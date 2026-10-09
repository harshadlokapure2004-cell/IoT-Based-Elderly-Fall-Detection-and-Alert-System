/*
 * GuardianPulse - IoT Elderly Fall Detection ESP32 Firmware
 * 
 * Hardware: ESP32 Dev Module + MPU6050 Accelerometer/Gyroscope
 * Features: Real-time telemetry, local buzzer alert, emergency push-button acknowledge,
 *           Wi-Fi auto-reconnect, and JSON payload transmission to Flask backend.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <MPU6050.h>
#include "config.h"

MPU6050 mpu;

unsigned long lastSampleTime = 0;
bool buzzerActive = false;
unsigned long buzzerStartTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[GuardianPulse ESP32] Initializing...");

  // Initialize Pinouts
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_BUTTON, INPUT_PULLUP);
  digitalWrite(PIN_BUZZER, LOW);

  // Initialize I2C Bus for MPU6050
  Wire.begin(PIN_SDA, PIN_SCL);
  mpu.initialize();

  if (mpu.testConnection()) {
    Serial.println("[MPU6050] Sensor initialized successfully.");
  } else {
    Serial.println("❌ [MPU6050] Sensor connection failed! Check SDA/SCL wiring.");
  }

  // Connect to Wi-Fi
  connectWiFi();
}

void loop() {
  // Check Wi-Fi reconnection
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Check push-button acknowledgment
  if (digitalRead(PIN_BUTTON) == LOW) {
    if (buzzerActive) {
      Serial.println("[Button] Alarm acknowledged locally by user.");
      digitalWrite(PIN_BUZZER, LOW);
      buzzerActive = false;
    }
    delay(200); // Debounce
  }

  // Auto-silence buzzer after 10 seconds if unacknowledged
  if (buzzerActive && (millis() - buzzerStartTime > 10000)) {
    digitalWrite(PIN_BUZZER, LOW);
    buzzerActive = false;
  }

  // Periodic sensor reading and transmission
  if (millis() - lastSampleTime >= SAMPLING_INTERVAL_MS) {
    lastSampleTime = millis();

    int16_t ax, ay, az, gx, gy, gz;
    mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

    // Convert raw LSB to physical units (±2g range: 16384 LSB/g, ±250°/s: 131 LSB/dps)
    float accel_x = ax / 16384.0;
    float accel_y = ay / 16384.0;
    float accel_z = az / 16384.0;
    float gyro_x = gx / 131.0;
    float gyro_y = gy / 131.0;
    float gyro_z = gz / 131.0;

    float accel_mag = sqrt(accel_x * accel_x + accel_y * accel_y + accel_z * accel_z);

    // Hardware pre-trigger buzzer for immediate audio feedback on impact
    if (accel_mag > IMPACT_THRESHOLD_G) {
      digitalWrite(PIN_BUZZER, HIGH);
      buzzerActive = true;
      buzzerStartTime = millis();
      Serial.println("🚨 Local Fall Impact Pre-Triggered!");
    }

    // Send HTTP POST payload to backend ingestion API
    sendSensorData(accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z, accel_mag);
  }
}

void connectWiFi() {
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n⚠️ [WiFi] Connection timeout. Retrying next loop...");
  }
}

void sendSensorData(float ax, float ay, float az, float gx, float gy, float gz, float mag) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(BACKEND_SENSOR_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", DEVICE_TOKEN);
  http.setTimeout(1500);

  String jsonPayload = "{";
  jsonPayload += "\"device_code\":\"" + String(DEVICE_CODE) + "\",";
  jsonPayload += "\"accel_x\":" + String(ax, 3) + ",";
  jsonPayload += "\"accel_y\":" + String(ay, 3) + ",";
  jsonPayload += "\"accel_z\":" + String(az, 3) + ",";
  jsonPayload += "\"gyro_x\":" + String(gx, 2) + ",";
  jsonPayload += "\"gyro_y\":" + String(gy, 2) + ",";
  jsonPayload += "\"gyro_z\":" + String(gz, 2) + ",";
  jsonPayload += "\"battery_level\":98,";
  jsonPayload += "\"is_simulated\":false";
  jsonPayload += "}";

  int httpCode = http.POST(jsonPayload);
  if (httpCode > 0) {
    if (httpCode != 200 && httpCode != 201) {
      Serial.printf("[HTTP] Warning status code: %d\n", httpCode);
    }
  } else {
    Serial.printf("❌ [HTTP] Error sending telemetry: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}
