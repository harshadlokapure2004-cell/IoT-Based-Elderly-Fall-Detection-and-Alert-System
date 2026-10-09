import uuid
from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def utc_now():
    return datetime.now(timezone.utc)

class Device(db.Model):
    __tablename__ = 'devices'
    
    id = db.Column(db.Integer, primary_key=True)
    device_code = db.Column(db.String(64), unique=True, nullable=False, index=True)
    name = db.Column(db.String(128), nullable=False, default="Elderly Monitor Node")
    status = db.Column(db.String(32), nullable=False, default="online") # online, offline, error
    is_simulated = db.Column(db.Boolean, nullable=False, default=True)
    battery_level = db.Column(db.Integer, nullable=False, default=95) # 0-100%
    firmware_version = db.Column(db.String(32), nullable=False, default="v1.0.4-esp32")
    sensor_type = db.Column(db.String(32), nullable=False, default="MPU6050")
    auth_token = db.Column(db.String(128), nullable=False, default="esp32-secure-device-token-123")
    last_seen = db.Column(db.DateTime, nullable=False, default=utc_now)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "device_code": self.device_code,
            "name": self.name,
            "status": self.status,
            "is_simulated": self.is_simulated,
            "battery_level": self.battery_level,
            "firmware_version": self.firmware_version,
            "sensor_type": self.sensor_type,
            "last_seen": self.last_seen.isoformat() if self.last_seen else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class SensorReading(db.Model):
    __tablename__ = 'sensor_readings'
    
    id = db.Column(db.Integer, primary_key=True)
    device_code = db.Column(db.String(64), nullable=False, index=True)
    accel_x = db.Column(db.Float, nullable=False)
    accel_y = db.Column(db.Float, nullable=False)
    accel_z = db.Column(db.Float, nullable=False)
    accel_mag = db.Column(db.Float, nullable=False)
    gyro_x = db.Column(db.Float, nullable=False, default=0.0)
    gyro_y = db.Column(db.Float, nullable=False, default=0.0)
    gyro_z = db.Column(db.Float, nullable=False, default=0.0)
    activity_classification = db.Column(db.String(64), nullable=False, default="Normal")
    is_simulated = db.Column(db.Boolean, nullable=False, default=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=utc_now, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "device_code": self.device_code,
            "accel_x": round(self.accel_x, 3),
            "accel_y": round(self.accel_y, 3),
            "accel_z": round(self.accel_z, 3),
            "accel_mag": round(self.accel_mag, 3),
            "gyro_x": round(self.gyro_x, 2),
            "gyro_y": round(self.gyro_y, 2),
            "gyro_z": round(self.gyro_z, 2),
            "activity_classification": self.activity_classification,
            "is_simulated": self.is_simulated,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }

class FallEvent(db.Model):
    __tablename__ = 'fall_events'
    
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.String(64), unique=True, nullable=False, index=True, default=lambda: str(uuid.uuid4()))
    device_code = db.Column(db.String(64), nullable=False, default="SIM-ESP32-01")
    timestamp = db.Column(db.DateTime, nullable=False, default=utc_now, index=True)
    severity = db.Column(db.String(32), nullable=False, default="High") # Low, Medium, High, Critical
    confidence = db.Column(db.Float, nullable=False, default=92.5) # Percentage 0-100%
    status = db.Column(db.String(32), nullable=False, default="active", index=True) # active, acknowledged, resolved, cancelled
    peak_acceleration = db.Column(db.Float, nullable=False, default=3.2)
    post_inactivity_duration = db.Column(db.Float, nullable=False, default=5.0)
    acknowledged_at = db.Column(db.DateTime, nullable=True)
    acknowledged_by = db.Column(db.String(128), nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    resolved_by = db.Column(db.String(128), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    is_simulated = db.Column(db.Boolean, nullable=False, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "event_id": self.event_id,
            "device_code": self.device_code,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "severity": self.severity,
            "confidence": round(self.confidence, 1),
            "status": self.status,
            "peak_acceleration": round(self.peak_acceleration, 2),
            "post_inactivity_duration": round(self.post_inactivity_duration, 1),
            "acknowledged_at": self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            "acknowledged_by": self.acknowledged_by,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "resolved_by": self.resolved_by,
            "notes": self.notes or "",
            "is_simulated": self.is_simulated,
        }

class Caregiver(db.Model):
    __tablename__ = 'caregivers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    phone = db.Column(db.String(32), nullable=False)
    email = db.Column(db.String(128), nullable=False)
    relationship = db.Column(db.String(64), nullable=False, default="Family Member")
    is_primary = db.Column(db.Boolean, nullable=False, default=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
            "relationship": self.relationship,
            "is_primary": self.is_primary,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class NotificationLog(db.Model):
    __tablename__ = 'notification_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.String(64), nullable=False, index=True)
    caregiver_id = db.Column(db.Integer, db.ForeignKey('caregivers.id'), nullable=True)
    caregiver_name = db.Column(db.String(128), nullable=False)
    channel = db.Column(db.String(32), nullable=False) # email, sms, simulated
    recipient = db.Column(db.String(128), nullable=False)
    status = db.Column(db.String(32), nullable=False, default="sent") # sent, delivered, failed
    error_message = db.Column(db.Text, nullable=True)
    sent_at = db.Column(db.DateTime, nullable=False, default=utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "event_id": self.event_id,
            "caregiver_id": self.caregiver_id,
            "caregiver_name": self.caregiver_name,
            "channel": self.channel,
            "recipient": self.recipient,
            "status": self.status,
            "error_message": self.error_message or "",
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
        }

class SystemSettings(db.Model):
    __tablename__ = 'system_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    freefall_threshold_g = db.Column(db.Float, nullable=False, default=0.5)
    impact_threshold_g = db.Column(db.Float, nullable=False, default=2.5)
    gyro_threshold_dps = db.Column(db.Float, nullable=False, default=150.0)
    inactivity_timeout_sec = db.Column(db.Float, nullable=False, default=10.0)
    confirm_window_sec = db.Column(db.Float, nullable=False, default=3.0)
    cancel_window_sec = db.Column(db.Float, nullable=False, default=15.0)
    sampling_interval_ms = db.Column(db.Integer, nullable=False, default=100)
    smtp_server = db.Column(db.String(128), nullable=True, default="")
    smtp_port = db.Column(db.Integer, nullable=True, default=587)
    smtp_username = db.Column(db.String(128), nullable=True, default="")
    smtp_password = db.Column(db.String(128), nullable=True, default="")
    smtp_sender = db.Column(db.String(128), nullable=True, default="alerts@elderlycare.io")
    twilio_sid = db.Column(db.String(128), nullable=True, default="")
    twilio_token = db.Column(db.String(128), nullable=True, default="")
    twilio_phone = db.Column(db.String(32), nullable=True, default="")
    simulated_mode_enabled = db.Column(db.Boolean, nullable=False, default=True)
    updated_at = db.Column(db.DateTime, nullable=False, default=utc_now)

    @property
    def has_smtp_configured(self) -> bool:
        return bool(self.smtp_server and self.smtp_username and self.smtp_password)

    @property
    def has_twilio_configured(self) -> bool:
        return bool(self.twilio_sid and self.twilio_token and self.twilio_phone)

    def to_dict(self):
        return {
            "id": self.id,
            "freefall_threshold_g": self.freefall_threshold_g,
            "impact_threshold_g": self.impact_threshold_g,
            "gyro_threshold_dps": self.gyro_threshold_dps,
            "inactivity_timeout_sec": self.inactivity_timeout_sec,
            "confirm_window_sec": self.confirm_window_sec,
            "cancel_window_sec": self.cancel_window_sec,
            "sampling_interval_ms": self.sampling_interval_ms,
            "smtp_server": self.smtp_server or "",
            "smtp_port": self.smtp_port or 587,
            "smtp_username": self.smtp_username or "",
            "smtp_sender": self.smtp_sender or "",
            "twilio_sid": self.twilio_sid or "",
            "twilio_phone": self.twilio_phone or "",
            "simulated_mode_enabled": self.simulated_mode_enabled,
            "has_smtp_configured": self.has_smtp_configured,
            "has_twilio_configured": self.has_twilio_configured,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
