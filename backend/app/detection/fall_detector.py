import math
import time
from collections import deque
from typing import List, Dict, Any, Tuple, Optional

class FallDetectionEngine:
    def __init__(
        self,
        freefall_threshold_g: float = 0.5,
        impact_threshold_g: float = 2.5,
        gyro_threshold_dps: float = 150.0,
        inactivity_timeout_sec: float = 10.0,
        confirm_window_sec: float = 3.0,
        cancel_window_sec: float = 15.0
    ):
        self.freefall_threshold_g = freefall_threshold_g
        self.impact_threshold_g = impact_threshold_g
        self.gyro_threshold_dps = gyro_threshold_dps
        self.inactivity_timeout_sec = inactivity_timeout_sec
        self.confirm_window_sec = confirm_window_sec
        self.cancel_window_sec = cancel_window_sec
        
        # Sliding sample buffer storing (timestamp, ax, ay, az, amag, gx, gy, gz, gmag)
        self.buffer: deque = deque(maxlen=100) # 10 seconds at 10Hz
        
        # State tracking
        self.last_freefall_time: Optional[float] = None
        self.last_impact_time: Optional[float] = None
        self.last_freefall_min: float = 1.0
        self.last_impact_max: float = 0.0
        self.last_gyro_max: float = 0.0

    def update_settings(self, settings_dict: Dict[str, Any]):
        """Update detection thresholds dynamically."""
        if "freefall_threshold_g" in settings_dict:
            self.freefall_threshold_g = float(settings_dict["freefall_threshold_g"])
        if "impact_threshold_g" in settings_dict:
            self.impact_threshold_g = float(settings_dict["impact_threshold_g"])
        if "gyro_threshold_dps" in settings_dict:
            self.gyro_threshold_dps = float(settings_dict["gyro_threshold_dps"])
        if "inactivity_timeout_sec" in settings_dict:
            self.inactivity_timeout_sec = float(settings_dict["inactivity_timeout_sec"])
        if "confirm_window_sec" in settings_dict:
            self.confirm_window_sec = float(settings_dict["confirm_window_sec"])
        if "cancel_window_sec" in settings_dict:
            self.cancel_window_sec = float(settings_dict["cancel_window_sec"])

    @staticmethod
    def calculate_magnitude(x: float, y: float, z: float) -> float:
        """Calculate Euclidean vector magnitude."""
        return math.sqrt(x * x + y * y + z * z)

    def classify_activity(
        self,
        accel_mag: float,
        gyro_mag: float,
        accel_x: float,
        accel_y: float,
        accel_z: float,
        is_fall_trigger: bool = False
    ) -> str:
        """Classify current motion state based on instantaneous readings and buffer history."""
        if is_fall_trigger:
            return "Fall Detected"
        
        # Check for possible fall sequence in buffer
        if accel_mag > self.impact_threshold_g or (self.last_impact_time and (time.time() - self.last_impact_time) < 2.0):
            return "Possible Fall"

        # Calculate standard deviation of acceleration magnitude over last 10 readings
        mags = [item[4] for item in self.buffer]
        std_dev = 0.0
        if len(mags) >= 5:
            avg = sum(mags) / len(mags)
            variance = sum((m - avg) ** 2 for m in mags) / len(mags)
            std_dev = math.sqrt(variance)

        if std_dev > 0.22 or gyro_mag > 80.0:
            return "Walking"
        
        # Posture-based orientation analysis using static gravity component
        abs_x = abs(accel_x)
        abs_y = abs(accel_y)
        abs_z = abs(accel_z)

        # Lying down (gravity vector primarily along X or Y axis rather than Z axis)
        if abs_z < 0.4 and (abs_x > 0.7 or abs_y > 0.7):
            if abs_x > 0.75:
                return "Lying Down"
            else:
                return "Sitting"
        
        if accel_mag < 0.6:
            return "Possible Fall"
        
        return "Normal"

    def process_sample(
        self,
        accel_x: float,
        accel_y: float,
        accel_z: float,
        gyro_x: float = 0.0,
        gyro_y: float = 0.0,
        gyro_z: float = 0.0,
        timestamp: Optional[float] = None
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Process a single IMU sensor sample and evaluate fall condition.
        Returns:
            (is_fall_detected: bool, classification: str, metadata: dict)
        """
        now = timestamp if timestamp is not None else time.time()
        accel_mag = self.calculate_magnitude(accel_x, accel_y, accel_z)
        gyro_mag = self.calculate_magnitude(gyro_x, gyro_y, gyro_z)

        # Append to buffer
        self.buffer.append((now, accel_x, accel_y, accel_z, accel_mag, gyro_x, gyro_y, gyro_z, gyro_mag))

        is_fall = False
        confidence = 0.0
        severity = "Medium"
        peak_g = accel_mag
        post_inactivity_sec = 0.0

        # Phase 1: Freefall detection (< threshold)
        if accel_mag < self.freefall_threshold_g:
            self.last_freefall_time = now
            self.last_freefall_min = min(self.last_freefall_min, accel_mag)

        # Phase 2: Impact detection (> threshold)
        if accel_mag > self.impact_threshold_g:
            self.last_impact_time = now
            self.last_impact_max = max(self.last_impact_max, accel_mag)
            self.last_gyro_max = max(self.last_gyro_max, gyro_mag)

        # Evaluate fall event state sequence:
        # Require an impact peak, preceded within 1.5s by a freefall OR sudden angular rate spike (> gyro_threshold)
        has_recent_freefall = (
            self.last_freefall_time is not None and (now - self.last_freefall_time) <= 1.5
        )
        has_recent_impact = (
            self.last_impact_time is not None and (now - self.last_impact_time) <= 0.8
        )
        has_gyro_spike = gyro_mag >= self.gyro_threshold_dps or self.last_gyro_max >= self.gyro_threshold_dps

        if has_recent_impact and (has_recent_freefall or has_gyro_spike):
            # Check post-impact activity: if gyro is low or magnitude variance post-impact is low
            post_impact_mags = [item[4] for item in self.buffer if self.last_impact_time and (item[0] >= self.last_impact_time)]
            
            std_m = 0.0
            if len(post_impact_mags) >= 2:
                avg_m = sum(post_impact_mags) / len(post_impact_mags)
                var_m = sum((m - avg_m) ** 2 for m in post_impact_mags) / len(post_impact_mags)
                std_m = math.sqrt(var_m)
            
            # Post impact low movement / gyro stability indicates fall without recovery
            if gyro_mag < 80.0 or std_m < 0.5 or len(post_impact_mags) <= 1:
                is_fall = True
                post_inactivity_sec = round(now - (self.last_impact_time or now) + 1.5, 1)

                # Calculate confidence score (0-100%)
                peak_g = self.last_impact_max
                g_score = min(40.0, (peak_g / self.impact_threshold_g) * 20.0)
                ff_score = 30.0 if has_recent_freefall else 15.0
                gyro_score = min(20.0, (self.last_gyro_max / max(1.0, self.gyro_threshold_dps)) * 15.0)
                inactivity_score = max(0.0, 10.0 - (std_m * 10.0))

                confidence = min(99.0, max(65.0, g_score + ff_score + gyro_score + inactivity_score))

                # Severity mapping
                if peak_g > 4.0 or confidence > 90.0:
                    severity = "Critical"
                elif peak_g > 3.0 or confidence > 80.0:
                    severity = "High"
                elif peak_g > 2.5:
                    severity = "Medium"
                else:
                    severity = "Low"

                # Reset state triggers to prevent duplicate triggers on consecutive samples
                self.last_freefall_time = None
                self.last_impact_time = None
                self.last_freefall_min = 1.0
                self.last_impact_max = 0.0
                self.last_gyro_max = 0.0

        classification = self.classify_activity(
            accel_mag, gyro_mag, accel_x, accel_y, accel_z, is_fall_trigger=is_fall
        )

        metadata = {
            "accel_mag": accel_mag,
            "gyro_mag": gyro_mag,
            "confidence": confidence,
            "severity": severity,
            "peak_g": peak_g,
            "post_inactivity_sec": post_inactivity_sec,
        }

        return is_fall, classification, metadata
