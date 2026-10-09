import os
import sys
import time
import logging
from datetime import datetime, timezone
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.models.database import db, Device, SensorReading, FallEvent, Caregiver, NotificationLog, SystemSettings, utc_now
from app.detection.fall_detector import FallDetectionEngine
from app.notifications.service import NotificationService
from app.services.simulator import SensorSimulator
from app.api.routes import api_bp

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("elderly_fall_detection")

# Instantiate singletons
socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")
fall_detector = FallDetectionEngine()
notification_service = NotificationService(socketio=socketio)

def create_app():
    app = Flask(__name__)
    
    # Database config
    db_path = os.getenv("DATABASE_URL", "sqlite:///fall_detection.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = db_path
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    
    # Store references in app config
    app.config["SOCKETIO"] = socketio
    app.config["FALL_DETECTOR"] = fall_detector
    app.config["NOTIFICATION_SERVICE"] = notification_service

    CORS(app)
    socketio.init_app(app)

    # Register API blueprint
    app.register_blueprint(api_bp, url_prefix="/api")

    db.init_app(app)

    with app.app_context():
        db.create_all()
        seed_initial_data()

    # Ingestion handler bound with app context
    def ingestion_pipeline(payload):
        with app.app_context():
            return process_sensor_payload(payload)

    simulator = SensorSimulator(ingestion_callback=ingestion_pipeline)
    app.config["SIMULATOR"] = simulator

    if os.getenv("SIMULATOR_AUTOSTART", "true").lower() == "true":
        simulator.start("walking")

    return app

def seed_initial_data():
    """Seed initial settings, device, and default caregiver if missing."""
    if not SystemSettings.query.first():
        default_settings = SystemSettings(
            freefall_threshold_g=float(os.getenv("FREEFALL_THRESHOLD_G", 0.5)),
            impact_threshold_g=float(os.getenv("IMPACT_THRESHOLD_G", 2.5)),
            gyro_threshold_dps=float(os.getenv("GYRO_THRESHOLD_DPS", 150.0)),
            inactivity_timeout_sec=float(os.getenv("INACTIVITY_TIMEOUT_SEC", 10.0)),
            confirm_window_sec=float(os.getenv("CONFIRM_WINDOW_SEC", 3.0)),
            cancel_window_sec=float(os.getenv("CANCELLATION_WINDOW_SEC", 15.0)),
            sampling_interval_ms=100,
            smtp_server=os.getenv("SMTP_SERVER", ""),
            smtp_port=int(os.getenv("SMTP_PORT", 587)),
            smtp_username=os.getenv("SMTP_USERNAME", ""),
            smtp_password=os.getenv("SMTP_PASSWORD", ""),
            smtp_sender=os.getenv("SMTP_SENDER", "alerts@elderlycare.io"),
            twilio_sid=os.getenv("TWILIO_ACCOUNT_SID", ""),
            twilio_token=os.getenv("TWILIO_AUTH_TOKEN", ""),
            twilio_phone=os.getenv("TWILIO_PHONE_NUMBER", ""),
            simulated_mode_enabled=True
        )
        db.session.add(default_settings)

    if not Device.query.filter_by(device_code="SIM-ESP32-01").first():
        sim_device = Device(
            device_code="SIM-ESP32-01",
            name="Simulated Elderly Monitor Node",
            status="online",
            is_simulated=True,
            battery_level=98,
            firmware_version="v1.0.4-sim",
            sensor_type="MPU6050",
            last_seen=utc_now()
        )
        db.session.add(sim_device)

    if not Caregiver.query.first():
        primary_cg = Caregiver(
            name="Sarah Jenkins",
            phone="+1-555-019-2831",
            email="sarah.jenkins@example.com",
            relationship="Daughter (Primary Caregiver)",
            is_primary=True,
            is_active=True
        )
        secondary_cg = Caregiver(
            name="Dr. Marcus Vance",
            phone="+1-555-014-9922",
            email="dr.vance@eldercareclinic.org",
            relationship="Attending Physician",
            is_primary=False,
            is_active=True
        )
        db.session.add(primary_cg)
        db.session.add(secondary_cg)

    db.session.commit()

def process_sensor_payload(data):
    """Core sensor data processing and fall detection pipeline."""
    device_code = data.get("device_code", "ESP32-01")
    ax = float(data.get("accel_x", 0.0))
    ay = float(data.get("accel_y", 0.0))
    az = float(data.get("accel_z", 1.0))
    gx = float(data.get("gyro_x", 0.0))
    gy = float(data.get("gyro_y", 0.0))
    gz = float(data.get("gyro_z", 0.0))
    battery = int(data.get("battery_level", 95))
    is_simulated = bool(data.get("is_simulated", True))

    accel_mag = fall_detector.calculate_magnitude(ax, ay, az)

    # Process through fall algorithm
    is_fall, classification, meta = fall_detector.process_sample(ax, ay, az, gx, gy, gz)

    # Record reading in database
    reading = SensorReading(
        device_code=device_code,
        accel_x=ax,
        accel_y=ay,
        accel_z=az,
        accel_mag=accel_mag,
        gyro_x=gx,
        gyro_y=gy,
        gyro_z=gz,
        activity_classification=classification,
        is_simulated=is_simulated,
        timestamp=utc_now()
    )
    db.session.add(reading)

    # Update device state
    dev = Device.query.filter_by(device_code=device_code).first()
    if dev:
        dev.last_seen = utc_now()
        dev.status = "online"
        dev.battery_level = battery
    else:
        dev = Device(
            device_code=device_code,
            name=f"Device {device_code}",
            status="online",
            is_simulated=is_simulated,
            battery_level=battery,
            last_seen=utc_now()
        )
        db.session.add(dev)

    # Handle fall detection event
    fall_event_dict = None
    if is_fall:
        # Check duplicate event within past 15 seconds for this device
        recent_cutoff = utc_now() - timedelta(seconds=15)
        existing_event = FallEvent.query.filter(
            FallEvent.device_code == device_code,
            FallEvent.timestamp >= recent_cutoff,
            FallEvent.status.in_(["active", "acknowledged"])
        ).first()

        if not existing_event:
            new_event = FallEvent(
                device_code=device_code,
                timestamp=utc_now(),
                severity=meta["severity"],
                confidence=meta["confidence"],
                status="active",
                peak_acceleration=meta["peak_g"],
                post_inactivity_duration=meta["post_inactivity_sec"],
                is_simulated=is_simulated
            )
            db.session.add(new_event)
            db.session.commit()
            fall_event_dict = new_event.to_dict()

            logger.warning(f"🚨 FALL DETECTED on device {device_code}! Event ID: {new_event.event_id}")

            # Dispatch emergency notifications to caregivers
            notification_service.send_fall_alert(fall_event_dict)

            # Broadcast fall event via WebSockets
            socketio.emit("fall_event", fall_event_dict)

    db.session.commit()

    # Emit real-time sensor reading payload to connected clients
    reading_dict = reading.to_dict()
    reading_dict["activity_classification"] = classification
    reading_dict["is_fall_detected"] = is_fall
    if fall_event_dict:
        reading_dict["fall_event"] = fall_event_dict

    socketio.emit("sensor_update", reading_dict)

    return {
        "status": "success",
        "reading": reading_dict,
        "classification": classification,
        "fall_detected": is_fall
    }

def handle_sensor_ingestion(data):
    """Wrapper function for API endpoint ingestion."""
    return process_sensor_payload(data)

app = create_app()

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 5000))
    logger.info(f"Starting Elderly Fall Detection Server on http://{host}:{port}")
    socketio.run(app, host=host, port=port, debug=False, allow_unsafe_werkzeug=True)
