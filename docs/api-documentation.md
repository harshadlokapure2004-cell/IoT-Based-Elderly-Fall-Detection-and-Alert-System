# GuardianPulse: REST API & WebSockets Documentation

## Base URL
`http://localhost:5000/api`

---

## REST Endpoints Specification

### 1. Health & Dashboard
- `GET /health`
  - Response: `{ "status": "healthy", "timestamp": "...", "version": "1.0.0" }`
- `GET /dashboard`
  - Response: System summary, active emergency count, falls today, latest reading, recent activity timeline.

### 2. Device Management
- `GET /devices`
  - Response: List of registered hardware and simulated devices.
- `POST /devices/register`
  - Request: `{ "device_code": "ESP32-001", "name": "Living Room Node", "sensor_type": "MPU6050" }`

### 3. Sensor Telemetry Ingestion
- `POST /sensors/readings`
  - Headers: `X-Device-Token: esp32-secure-device-token-123`
  - Request:
    ```json
    {
      "device_code": "ESP32-001",
      "accel_x": 0.12,
      "accel_y": 0.05,
      "accel_z": 0.98,
      "gyro_x": 10.5,
      "gyro_y": -2.3,
      "gyro_z": 1.1,
      "battery_level": 98,
      "is_simulated": false
    }
    ```
- `GET /sensors/latest?limit=50`
  - Response: Array of recent sensor telemetry entries.

### 4. Fall Incident Events
- `GET /events?status=active&severity=High`
  - Response: Filtered array of fall incidents.
- `GET /events/{event_id}`
  - Response: Event details + sensor snapshot window (±5s) + notification logs.
- `POST /events/{event_id}/acknowledge`
  - Request: `{ "notes": "Caregiver checking on patient" }`
- `POST /events/{event_id}/resolve`
  - Request: `{ "notes": "Patient safe. False alarm resolved." }`
- `POST /events/{event_id}/cancel`
  - Request: `{ "reason": "Accidental drop on couch" }`

### 5. Caregivers Management
- `GET /caregivers`
- `POST /caregivers`
- `PUT /caregivers/{id}`
- `DELETE /caregivers/{id}`

### 6. Alerts & Simulator
- `GET /alerts`
- `POST /alerts/test` -> Dispatches manual test alert
- `POST /simulator/start`
- `POST /simulator/stop`
- `POST /simulator/mode` -> `{ "mode": "fall" }`
- `POST /tests/run` -> Runs automated test scenarios suite
- `GET /reports/export` -> Downloads CSV export file

---

## WebSocket Real-Time Events (`socket.io`)

- **`sensor_update`**: Emitted on every sensor sample with calculated magnitude and activity classification.
- **`fall_event`**: Emitted when a fall incident is confirmed by the detection engine.
- **`notification_sent`**: Emitted when emergency caregiver alerts are dispatched.
- **`event_updated`**: Emitted when an event status changes (acknowledged/resolved).
