# GuardianPulse: ESP32 & MPU6050 Hardware Wiring Guide

## 1. Required Components

- ESP32 Development Board (30-pin or 38-pin version)
- MPU6050 6-Axis Accelerometer and Gyroscope Module
- 5V Active Buzzer Module (optional for local alarm)
- Momentary Push Button (optional for local alarm cancellation)
- 10kΩ Resistor (for push-button pull-up if external)
- Breadboard & Jumper Wires
- Micro-USB / USB-C Cable

## 2. Pin Mapping Table

| ESP32 Pin | MPU6050 Pin | Active Buzzer | Push Button | Function |
| :--- | :--- | :--- | :--- | :--- |
| **3V3 / 5V** | VCC | VCC (+5V) | - | Power Supply |
| **GND** | GND | GND (-) | Terminal 1 | Common Ground |
| **GPIO 21** | SDA | - | - | I2C Data Line |
| **GPIO 22** | SCL | - | - | I2C Clock Line |
| **GPIO 25** | - | Signal (+) | - | Local Buzzer Alarm |
| **GPIO 4** | - | - | Terminal 2 | Local Alarm Cancel Button |

## 3. Step-by-Step Assembly Instructions

1. **Power Off**: Ensure the ESP32 is disconnected from USB power while connecting wires.
2. **I2C Connections**:
   - Connect **MPU6050 VCC** to **ESP32 3V3** (or 5V if module has onboard regulator).
   - Connect **MPU6050 GND** to **ESP32 GND**.
   - Connect **MPU6050 SDA** to **ESP32 GPIO 21**.
   - Connect **MPU6050 SCL** to **ESP32 GPIO 22**.
3. **Local Buzzer**:
   - Connect Buzzer (+) to **GPIO 25**.
   - Connect Buzzer (-) to **GND**.
4. **Emergency Button**:
   - Connect Button Terminal 1 to **GND**.
   - Connect Button Terminal 2 to **GPIO 4** (configured as `INPUT_PULLUP` in code).

## 4. Hardware Verification & Troubleshooting

- **Sensor Not Detected**: Ensure SDA and SCL are connected to GPIO 21 and 22 respectively. Verify I2C address (default is `0x68`).
- **Serial Debugging**: Open Arduino IDE Serial Monitor at `115200` baud rate to observe connection logs.
- **Wi-Fi Reconnection**: If Wi-Fi fails to connect, verify `config.h` credentials and 2.4GHz Wi-Fi band support.
