import React, { useState } from 'react';
import { 
  Cpu, Plus, Wifi, WifiOff, 
  Code, BookOpen, Copy, Check
} from 'lucide-react';
import type { Device } from '../types';
import { api } from '../services/api';

interface DevicesPageProps {
  devices: Device[];
  onRefreshDevices: () => void;
}

export const DevicesPage: React.FC<DevicesPageProps> = ({
  devices,
  onRefreshDevices,
}) => {
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [newDeviceCode, setNewDeviceCode] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceCode.trim()) return;

    try {
      await api.registerDevice({
        device_code: newDeviceCode,
        name: newDeviceName || `ESP32 Wearable Node (${newDeviceCode})`,
        sensor_type: 'MPU6050',
        is_simulated: false,
      });
      setNewDeviceCode('');
      setNewDeviceName('');
      onRefreshDevices();
    } catch (err) {
      console.error('Failed to register device:', err);
    }
  };

  const sampleArduinoCode = `#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <MPU6050.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://192.168.1.100:5000/api/sensors/readings";
const char* deviceToken = "esp32-secure-device-token-123";

MPU6050 mpu;

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22); // SDA, SCL
  mpu.initialize();

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
}

void loop() {
  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  // Convert to g (±2g range: 16384 LSB/g) and dps (±250°/s: 131 LSB/dps)
  float float_ax = ax / 16384.0;
  float float_ay = ay / 16384.0;
  float float_az = az / 16384.0;
  float float_gx = gx / 131.0;
  float float_gy = gy / 131.0;
  float float_gz = gz / 131.0;

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-Token", deviceToken);

    String jsonPayload = "{\"device_code\":\"ESP32-HARDWARE-01\",\"accel_x\":" + String(float_ax, 3) +
      ",\"accel_y\":" + String(float_ay, 3) + ",\"accel_z\":" + String(float_az, 3) +
      ",\"gyro_x\":" + String(float_gx, 2) + ",\"gyro_y\":" + String(float_gy, 2) +
      ",\"gyro_z\":" + String(float_gz, 2) + ",\"battery_level\":98,\"is_simulated\":false}";

    int httpCode = http.POST(jsonPayload);
    http.end();
  }
  delay(100); // 10Hz sampling
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sampleArduinoCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Cpu className="w-7 h-7 text-blue-400" />
            <span>ESP32 Device Registry & Setup Guide</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Register physical ESP32 development boards with MPU6050 IMU sensors or inspect simulated devices.
          </p>
        </div>

        <button
          onClick={() => setIsSetupModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all"
        >
          <BookOpen className="w-4 h-4" />
          <span>ESP32 Setup & Pinout Guide</span>
        </button>
      </div>

      {/* Quick Register Card */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Plus className="w-4 h-4 text-blue-400" />
          <span>Register New Physical ESP32 Wearable Node</span>
        </h3>

        <form onSubmit={handleRegisterDevice} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={newDeviceCode}
            onChange={(e) => setNewDeviceCode(e.target.value)}
            placeholder="Device Code (e.g. ESP32-DEV-001)"
            className="w-full sm:w-64 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
          />
          <input
            type="text"
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
            placeholder="Friendly Name (e.g. Living Room Node)"
            className="w-full sm:w-64 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            Register Device
          </button>
        </form>
      </div>

      {/* Device List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((dev) => (
          <div key={dev.id} className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>{dev.name}</span>
                </h3>
                <span className="font-mono text-xs text-blue-400 font-bold block mt-0.5">{dev.device_code}</span>
              </div>

              <span className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                dev.status === 'online' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {dev.status === 'online' ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                <span className="capitalize">{dev.status}</span>
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Sensor Model:</span>
                <span className="font-bold text-white">{dev.sensor_type}</span>
              </div>
              <div className="flex justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Mode:</span>
                <span className={`font-bold ${dev.is_simulated ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {dev.is_simulated ? 'Simulated' : 'ESP32 Hardware'}
                </span>
              </div>
              <div className="flex justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Battery Level:</span>
                <span className="font-bold text-emerald-400">{dev.battery_level}%</span>
              </div>
              <div className="flex justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Firmware:</span>
                <span className="font-mono text-slate-300">{dev.firmware_version}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
              <span>Last ping:</span>
              <span className="font-mono text-slate-200">{dev.last_seen ? new Date(dev.last_seen).toLocaleTimeString() : 'N/A'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Setup Guide Modal */}
      {isSetupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card max-w-3xl w-full rounded-2xl border border-slate-700 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Code className="w-5 h-5 text-indigo-400" />
                <span>ESP32 Hardware Wiring & Firmware Instructions</span>
              </h2>
              <button onClick={() => setIsSetupModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              {/* Wiring Pinout Spec */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm">1. MPU6050 to ESP32 Pin Mapping:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                  <div className="bg-slate-800 p-2 rounded">VCC ➔ 3.3V / 5V</div>
                  <div className="bg-slate-800 p-2 rounded">GND ➔ GND</div>
                  <div className="bg-slate-800 p-2 rounded">SDA ➔ GPIO 21</div>
                  <div className="bg-slate-800 p-2 rounded">SCL ➔ GPIO 22</div>
                  <div className="bg-slate-800 p-2 rounded">Buzzer ➔ GPIO 25</div>
                  <div className="bg-slate-800 p-2 rounded">Button ➔ GPIO 4</div>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">2. Arduino C++ Firmware Sketch:</h4>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto h-56">
                  {sampleArduinoCode}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsSetupModalOpen(false)}
                className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
