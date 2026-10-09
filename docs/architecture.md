# GuardianPulse: System Architecture & Design Specification

## 1. System Overview

GuardianPulse is an end-to-end IoT Elderly Fall Detection and Alert System designed to continuously monitor motion data, detect falls with high precision, and immediately notify registered caregivers.

```
+------------------+         HTTP POST / JSON        +--------------------------+
|  ESP32 Hardware  | ------------------------------> |   Flask Backend API      |
|  + MPU6050 IMU   |                                 |                          |
+------------------+                                 |  * Fall Detection Engine |
                                                     |  * SQLite DB / SQLAlchemy|
+------------------+         Internal Pipeline       |  * Notification Service  |
| Sensor Simulator | ------------------------------> |  * Flask-SocketIO        |
| (Background Task)|                                 +--------------------------+
+------------------+                                              |
                                                                  | WebSockets / REST
                                                                  v
                                                     +--------------------------+
                                                     | React.js Vite Dashboard  |
                                                     |  * Real-Time Oscilloscope|
                                                     |  * Caregiver Manager     |
                                                     |  * Test Runner & Reports |
                                                     +--------------------------+
```

## 2. Fall Detection Algorithm State Machine

The modular Python algorithm processes acceleration ($a_{mag} = \sqrt{a_x^2 + a_y^2 + a_z^2}$) and gyroscope angular velocity ($\omega_{mag} = \sqrt{\omega_x^2 + \omega_y^2 + \omega_z^2}$) over a sliding buffer.

```
       +------------------+
       |   NORMAL STATE   |
       +------------------+
                 |
                 | Free-fall: a_mag < 0.5g
                 v
       +------------------+
       | FREE-FALL DROP   |
       +------------------+
                 |
                 | Impact: a_mag > 2.5g (within 1.5s)
                 v
       +------------------+
       |   IMPACT PEAK    |
       +------------------+
                 |
                 | Post-Impact Low Movement & Posture Check
                 v
       +------------------+
       |  FALL CONFIRMED  | ---> [Generate Event & Trigger Caregiver Alert]
       +------------------+
```

### Motion Activity Classifications
1. **Normal**: Standard standing/walking with minimal vector variance.
2. **Walking**: Dynamic periodic acceleration cadence (1.0Hz - 2.0Hz).
3. **Sitting**: Static gravity vector aligned primarily along Y/Z axes.
4. **Lying Down**: Static gravity vector aligned primarily along X/Y axes ($a_z < 0.4g$).
5. **Possible Fall**: Acceleration magnitude exceeds 2.2g or free-fall detected without full sequence confirmation.
6. **Fall Detected**: Fully confirmed state sequence (Free-fall -> Impact -> Posture Orientation Change -> Inactivity).

## 3. Database Schema

- **`devices`**: Stores registered ESP32 units, connection status, last seen, battery level, firmware version.
- **`sensor_readings`**: High-frequency telemetry log (accel X/Y/Z, gyro X/Y/Z, magnitude, activity classification).
- **`fall_events`**: Immutable incident log (event_id UUID, severity, confidence %, status, peak g, post inactivity sec).
- **`caregivers`**: Contact directory (name, phone, email, relationship, primary flag).
- **`notification_logs`**: Audit log of emergency email, SMS, and simulated notifications.
- **`system_settings`**: Configurable thresholds (free-fall g, impact g, gyro dps, inactivity timeout).
