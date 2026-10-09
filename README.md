# IoT-Based Elderly Fall Detection and Alert System (GuardianPulse)

GuardianPulse is a complete, production-grade healthcare IoT system designed to monitor elderly motion telemetry in real time using MPU6050 6-axis IMU sensors (physical ESP32 hardware or built-in sensor simulator), detect potential fall incidents using a modular state-based algorithm, and immediately alert registered caregivers via email, SMS, or simulated notifications.

---

## 🌟 Key Features

1. **Modular Fall Detection Algorithm**: State-machine algorithm evaluating free-fall drop ($<0.5g$), impact peak ($>2.5g$), gyroscope rotation spike ($>150^\circ/s$), and post-event inactivity.
2. **Real-Time Motion Classifier**: Categorizes user movement into **Normal**, **Walking**, **Sitting**, **Lying Down**, **Possible Fall**, or **Fall Detected**.
3. **Emergency Caregiver Alert Dispatcher**: Dispatches alerts to caregivers via SMTP Email, Twilio SMS, or built-in Development Simulator with alert deduplication.
4. **Built-in Motion Sensor Simulator**: Allows complete testing without purchasing ESP32 hardware. Inject motion scenarios (**Walking**, **Sitting**, **Lying Down**, **Sudden Movement**, **Trigger Fall**, **Disconnect**).
5. **Modern React.js Healthcare Dashboard**: Built with Vite, TypeScript, Tailwind CSS, Recharts, and Lucide React. Features real-time WebSocket telemetry, live motion graphs, and active emergency banners.
6. **Physical ESP32 Firmware**: Arduino C++ sketch (`esp32_fall_detection.ino`) with Wi-Fi auto-reconnect, local active buzzer alarm, and push-button alarm cancel.
7. **Automated Validation Suite & CSV Export**: Built-in Pytest test suite, interactive scenario runner, precision/recall metrics calculation, and CSV event history download.

---

## 📁 Project Structure

```text
elderly-fall-detection/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py              # Flask REST API Endpoints
│   │   ├── detection/
│   │   │   └── fall_detector.py       # Modular Fall Detection Algorithm Engine
│   │   ├── models/
│   │   │   └── database.py            # SQLAlchemy Database Models & SQLite Init
│   │   ├── notifications/
│   │   │   └── service.py             # Emergency Alert Dispatcher (SMTP/Twilio/Sim)
│   │   ├── services/
│   │   │   └── simulator.py           # Multi-scenario Background Motion Simulator
│   │   └── main.py                    # Flask App Factory & Socket.IO Setup
│   ├── tests/
│   │   ├── test_fall_detection.py     # Algorithm Pytest Unit Tests
│   │   └── test_api_endpoints.py      # REST API Integration Tests
│   ├── requirements.txt               # Backend Dependencies
│   └── .env                           # Environment Configuration
├── frontend/
│   ├── src/
│   │   ├── components/                # Navbar, EmergencyBanner
│   │   ├── pages/                     # Dashboard, Monitoring, Events, Caregivers, etc.
│   │   ├── services/                  # REST API Client & Socket.IO WebSockets
│   │   ├── types.ts                   # TypeScript Interfaces
│   │   └── App.tsx                    # Main App Shell & State Management
│   ├── index.html
│   ├── vite.config.ts                 # Vite Server & Proxy Config
│   └── package.json
├── firmware/
│   └── esp32_fall_detection/
│       ├── esp32_fall_detection.ino   # Production Arduino C++ Firmware Sketch
│       └── config.h.example           # Wi-Fi & Backend Endpoint Placeholders
├── docs/
│   ├── architecture.md                # System Architecture & State Machine Spec
│   ├── wiring-guide.md                # ESP32 Pin Mapping & Schematic Guide
│   ├── api-documentation.md           # REST API & WebSockets Spec
│   └── testing-guide.md               # Testing Procedure & Metrics Guide
├── scripts/
│   ├── run_backend.bat                # Launch Backend Server on Windows
│   ├── run_frontend.bat               # Launch Frontend Dashboard on Windows
│   └── run_tests.bat                  # Execute Pytest Automated Test Suite
├── .env.example                       # Environment Template File
└── README.md                          # Full Project Documentation
```

---

## 🛠️ Requirements & Prerequisites

- **Python**: 3.10+ (Tested on Python 3.14)
- **Node.js**: v18+ (Tested on Node v26) & **npm**: v9+
- **OS**: Windows / Linux / macOS

---

## 🚀 Step-by-Step Setup & Execution Instructions

### Step 1: Clone or Navigate to Directory
```powershell
cd c:\IOT_Mini_Project
```

### Step 2: Set Up & Run Backend Server

1. Open a terminal and navigate to the backend directory:
   ```powershell
   cd c:\IOT_Mini_Project
   py -m venv backend\venv
   ```
2. Activate virtual environment & install backend dependencies:
   ```powershell
   .\backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
   ```
3. Start the Flask backend server:
   ```powershell
   $env:PYTHONPATH="backend"
   .\backend\venv\Scripts\python.exe backend\app\main.py
   ```
   *The backend server will start at `http://localhost:5000` with the built-in sensor simulator running.*

---

### Step 3: Set Up & Run Frontend Dashboard

1. Open a **second terminal** and navigate to the frontend directory:
   ```powershell
   cd c:\IOT_Mini_Project\frontend
   npm install
   ```
2. Start the Vite development server:
   ```powershell
   npm run dev
   ```
3. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

---

## 🧪 Running Automated Unit & Integration Tests

To run the full automated Pytest test suite (10 unit & API tests):

```powershell
cd c:\IOT_Mini_Project
.\backend\venv\Scripts\pytest.exe -o pythonpath=backend backend\tests
```

Or double-click `scripts\run_tests.bat`.

---

## 🔌 Connecting Physical ESP32 Hardware (Optional)

If you have physical hardware:

1. Connect **MPU6050** to **ESP32**:
   - VCC ➔ 3.3V / 5V
   - GND ➔ GND
   - SDA ➔ GPIO 21
   - SCL ➔ GPIO 22
   - Buzzer (+) ➔ GPIO 25
   - Push Button ➔ GPIO 4
2. Open `firmware/esp32_fall_detection/config.h.example`, rename to `config.h`, and update:
   - `WIFI_SSID` and `WIFI_PASSWORD`
   - `BACKEND_SENSOR_URL` (e.g., `http://<YOUR_LOCAL_IP>:5000/api/sensors/readings`)
3. Flash `esp32_fall_detection.ino` using Arduino IDE or PlatformIO.

---

## 📄 License & Medical Disclaimer

*This project is an engineering prototype designed for demonstration, research, and educational purposes. It is not a certified medical device and should not be used as the sole lifesaving monitor without clinical validation.*
