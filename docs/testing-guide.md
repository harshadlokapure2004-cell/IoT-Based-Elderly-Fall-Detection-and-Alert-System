# GuardianPulse: Automated & Manual Testing Guide

## 1. Automated Pytest Backend Test Suite

To execute the automated Python unit and integration test suite:

```bash
cd backend
venv\Scripts\pytest.exe -o pythonpath=app tests
```

### Tested Modules:
- `test_fall_detection.py`: Verifies free-fall drop, impact peak, post-impact inactivity, confidence scoring, and non-fall motion rejection.
- `test_api_endpoints.py`: Verifies Flask REST endpoints (`/api/health`, `/api/dashboard`, `/api/caregivers`, `/api/events`, `/api/alerts/test`, `/api/tests/run`, `/api/reports/export`).

## 2. Interactive Controlled Scenario Runner

The application includes an automated test scenario runner accessible via the Web Dashboard or API:

```bash
POST /api/tests/run
```

### Evaluated Scenarios:
1. **Sudden Fall Impact**: Free-fall -> Heavy impact -> Low movement post-fall (Expected: Fall Detected).
2. **Normal Ambulatory Walking**: Oscillating vector cadence (Expected: Normal / Walking).
3. **Sitting Down Slowly**: Smooth transition to sitting posture (Expected: Sitting).
4. **Resting Lying Down**: Static gravity vector along horizontal axis (Expected: Lying Down).
5. **Abrupt Sudden Movement**: High accel surge without drop/inactivity (Expected: No Fall).
6. **Sensor Disconnection**: Hardware drop recovery (Expected: Disconnected handling).

## 3. Evaluation Metrics Calculation

- **Precision (%)**: $\frac{\text{True Positives}}{\text{True Positives} + \text{False Positives}} \times 100$
- **Recall (%)**: $\frac{\text{True Positives}}{\text{True Positives} + \text{False Negatives}} \times 100$
- **Detection Latency**: Measured time in milliseconds from IMU impact sample arrival to fall event record creation.
- **Notification Latency**: Measured time from event creation to caregiver email/SMS dispatch.
