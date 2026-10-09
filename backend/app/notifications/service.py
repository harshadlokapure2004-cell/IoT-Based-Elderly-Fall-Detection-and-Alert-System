import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone
import requests

from app.models.database import db, Caregiver, NotificationLog, SystemSettings, utc_now

logger = logging.getLogger("fall_detection_notifications")

class NotificationService:
    def __init__(self, socketio=None):
        self.socketio = socketio

    def get_settings(self) -> SystemSettings:
        settings = SystemSettings.query.first()
        if not settings:
            settings = SystemSettings()
            db.session.add(settings)
            db.session.commit()
        return settings

    def send_fall_alert(self, event_data: dict, is_test: bool = False) -> list:
        """
        Dispatches emergency fall alerts to active caregivers.
        Returns a list of NotificationLog entries created.
        """
        settings = self.get_settings()
        caregivers = Caregiver.query.filter_by(is_active=True).all()
        logs = []

        event_id = event_data.get("event_id", "TEST-EVENT")
        severity = event_data.get("severity", "High")
        confidence = event_data.get("confidence", 90.0)
        timestamp = event_data.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        device_code = event_data.get("device_code", "ESP32-01")

        if not caregivers:
            logger.warning("No active caregivers found to receive alert.")
            # Record a fallback log
            log = NotificationLog(
                event_id=event_id,
                caregiver_id=None,
                caregiver_name="System Admin",
                channel="simulated",
                recipient="No Caregivers Registered",
                status="failed",
                error_message="No active caregivers registered in the database.",
                sent_at=utc_now()
            )
            db.session.add(log)
            db.session.commit()
            logs.append(log)
            return logs

        for caregiver in caregivers:
            # Check deduplication - don't re-send for same event_id to same caregiver if sent within 60 sec
            existing_log = NotificationLog.query.filter_by(
                event_id=event_id, caregiver_id=caregiver.id
            ).first()
            if existing_log and not is_test:
                logger.info(f"Skipping duplicate alert for caregiver {caregiver.name} on event {event_id}")
                continue

            subject = f"{'[TEST] ' if is_test else '🚨 EMERGENCY FALL DETECTED'} - Device {device_code}"
            message_body = (
                f"{'[DEVELOPMENT TEST ALERT]' if is_test else '🚨 URGENT EMERGENCY FALL ALERT'}\n\n"
                f"Caregiver Notice for: {caregiver.name} ({caregiver.relationship})\n"
                f"Device: {device_code}\n"
                f"Time: {timestamp}\n"
                f"Severity: {severity}\n"
                f"Confidence Level: {confidence}%\n\n"
                f"Please check on the elderly individual immediately or access the dashboard."
            )

            # Send Email if configured
            if settings.has_smtp_configured:
                email_status, email_err = self._send_email(
                    settings=settings,
                    recipient=caregiver.email,
                    subject=subject,
                    body=message_body
                )
                log_email = NotificationLog(
                    event_id=event_id,
                    caregiver_id=caregiver.id,
                    caregiver_name=caregiver.name,
                    channel="email",
                    recipient=caregiver.email,
                    status=email_status,
                    error_message=email_err,
                    sent_at=utc_now()
                )
                db.session.add(log_email)
                logs.append(log_email)
            else:
                # Recorded as simulated mode because SMTP provider is unconfigured
                log_email = NotificationLog(
                    event_id=event_id,
                    caregiver_id=caregiver.id,
                    caregiver_name=caregiver.name,
                    channel="simulated_email",
                    recipient=caregiver.email,
                    status="delivered",
                    error_message="SMTP credentials unconfigured. Simulated email delivery.",
                    sent_at=utc_now()
                )
                db.session.add(log_email)
                logs.append(log_email)

            # Send SMS if configured
            if settings.has_twilio_configured:
                sms_status, sms_err = self._send_sms(
                    settings=settings,
                    recipient=caregiver.phone,
                    body=message_body
                )
                log_sms = NotificationLog(
                    event_id=event_id,
                    caregiver_id=caregiver.id,
                    caregiver_name=caregiver.name,
                    channel="sms",
                    recipient=caregiver.phone,
                    status=sms_status,
                    error_message=sms_err,
                    sent_at=utc_now()
                )
                db.session.add(log_sms)
                logs.append(log_sms)
            else:
                log_sms = NotificationLog(
                    event_id=event_id,
                    caregiver_id=caregiver.id,
                    caregiver_name=caregiver.name,
                    channel="simulated_sms",
                    recipient=caregiver.phone,
                    status="delivered",
                    error_message="Twilio SMS unconfigured. Simulated SMS delivery.",
                    sent_at=utc_now()
                )
                db.session.add(log_sms)
                logs.append(log_sms)

        db.session.commit()

        # Emit Socket.IO event to update dashboard notification logs in real time
        if self.socketio:
            self.socketio.emit("notification_sent", {
                "event_id": event_id,
                "is_test": is_test,
                "logs": [l.to_dict() for l in logs]
            })

        return logs

    def _send_email(self, settings: SystemSettings, recipient: str, subject: str, body: str) -> tuple:
        """Helper to send SMTP email."""
        try:
            msg = MIMEMultipart()
            msg['From'] = settings.smtp_sender or settings.smtp_username
            msg['To'] = recipient
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))

            with smtplib.SMTP(settings.smtp_server, settings.smtp_port, timeout=10) as server:
                server.starttls()
                server.login(settings.smtp_username, settings.smtp_password)
                server.send_message(msg)

            return "delivered", None
        except Exception as e:
            logger.error(f"SMTP Email Delivery Failed: {str(e)}")
            return "failed", f"SMTP Error: {str(e)}"

    def _send_sms(self, settings: SystemSettings, recipient: str, body: str) -> tuple:
        """Helper to send Twilio SMS."""
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_sid}/Messages.json"
            auth = (settings.twilio_sid, settings.twilio_token)
            data = {
                "From": settings.twilio_phone,
                "To": recipient,
                "Body": body[:160] # standard SMS length
            }
            resp = requests.post(url, auth=auth, data=data, timeout=10)
            if resp.status_code in [200, 201]:
                return "delivered", None
            else:
                err = f"Twilio API HTTP {resp.status_code}: {resp.text}"
                logger.error(f"SMS Delivery Failed: {err}")
                return "failed", err
        except Exception as e:
            logger.error(f"SMS Delivery Exception: {str(e)}")
            return "failed", f"SMS Exception: {str(e)}"
