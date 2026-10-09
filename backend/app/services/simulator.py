import time
import math
import random
import threading
import logging
from typing import Dict, Any

logger = logging.getLogger("sensor_simulator")

class SensorSimulator:
    def __init__(self, ingestion_callback=None):
        self.ingestion_callback = ingestion_callback
        self.is_running = False
        self.mode = "walking" # walking, sitting, lying_down, sudden_movement, fall, disconnect
        self.thread = None
        self.device_code = "SIM-ESP32-01"
        self.sample_rate_hz = 10
        self.step_counter = 0

    def start(self, initial_mode: str = "walking"):
        if self.is_running:
            self.mode = initial_mode
            return
        self.is_running = True
        self.mode = initial_mode
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()
        logger.info(f"Sensor Simulator started in '{self.mode}' mode.")

    def stop(self):
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=2.0)
        logger.info("Sensor Simulator stopped.")

    def set_mode(self, new_mode: str):
        self.mode = new_mode
        self.step_counter = 0
        logger.info(f"Simulator switched to mode: {new_mode}")

    def _run_loop(self):
        interval = 1.0 / self.sample_rate_hz
        fall_sequence_stage = 0

        while self.is_running:
            start_t = time.time()
            self.step_counter += 1

            if self.mode == "disconnect":
                # Simulated hardware disconnection - send no readings
                time.sleep(interval)
                continue

            ax, ay, az = 0.0, 0.0, 1.0
            gx, gy, gz = 0.0, 0.0, 0.0

            # Generate sensor pattern according to scenario
            if self.mode == "walking":
                t = self.step_counter * 0.1
                # Vertical acceleration oscillation
                az = 0.98 + 0.25 * math.sin(2 * math.pi * 1.5 * t) + random.uniform(-0.04, 0.04)
                ax = 0.1 * math.cos(2 * math.pi * 1.5 * t) + random.uniform(-0.03, 0.03)
                ay = 0.05 * math.sin(2 * math.pi * 0.75 * t) + random.uniform(-0.03, 0.03)
                gx = random.uniform(-15.0, 15.0)
                gy = random.uniform(-20.0, 20.0)
                gz = random.uniform(-10.0, 10.0)

            elif self.mode == "sitting":
                ax = 0.08 + random.uniform(-0.01, 0.01)
                ay = 0.68 + random.uniform(-0.01, 0.01)
                az = 0.72 + random.uniform(-0.01, 0.01)
                gx = random.uniform(-2.0, 2.0)
                gy = random.uniform(-2.0, 2.0)
                gz = random.uniform(-2.0, 2.0)

            elif self.mode == "lying_down":
                ax = 0.95 + random.uniform(-0.01, 0.01)
                ay = 0.12 + random.uniform(-0.01, 0.01)
                az = 0.10 + random.uniform(-0.01, 0.01)
                gx = random.uniform(-1.0, 1.0)
                gy = random.uniform(-1.0, 1.0)
                gz = random.uniform(-1.0, 1.0)

            elif self.mode == "sudden_movement":
                t = (self.step_counter % 20)
                if 8 <= t <= 11:
                    ax = 0.6 + random.uniform(0.5, 0.9)
                    ay = 0.4 + random.uniform(0.4, 0.8)
                    az = 1.2 + random.uniform(0.3, 0.7)
                    gx = random.uniform(80.0, 140.0)
                    gy = random.uniform(60.0, 120.0)
                    gz = random.uniform(40.0, 90.0)
                else:
                    ax = 0.05 + random.uniform(-0.02, 0.02)
                    ay = 0.05 + random.uniform(-0.02, 0.02)
                    az = 0.98 + random.uniform(-0.02, 0.02)
                    gx = random.uniform(-5.0, 5.0)
                    gy = random.uniform(-5.0, 5.0)
                    gz = random.uniform(-5.0, 5.0)

            elif self.mode == "fall":
                # Multi-stage Fall Sequence
                stage_step = self.step_counter % 60
                if stage_step < 5:
                    # Normal standing prior to fall
                    ax, ay, az = 0.02, 0.05, 0.98
                    gx, gy, gz = 5.0, -2.0, 3.0
                elif 5 <= stage_step < 8:
                    # Stage 1: Freefall drop (0.2s)
                    ax, ay, az = 0.15, 0.12, 0.20
                    gx, gy, gz = -40.0, 85.0, 120.0
                elif 8 <= stage_step < 12:
                    # Stage 2: Heavy Impact peak (0.4s)
                    ax = 1.8 + random.uniform(0.5, 1.2)
                    ay = 2.1 + random.uniform(0.4, 1.1)
                    az = 2.6 + random.uniform(0.5, 1.4)
                    gx = random.uniform(180.0, 320.0)
                    gy = random.uniform(150.0, 290.0)
                    gz = random.uniform(110.0, 240.0)
                else:
                    # Stage 3: Lying post-fall (Post-event inactivity)
                    ax = 0.92 + random.uniform(-0.008, 0.008)
                    ay = 0.15 + random.uniform(-0.008, 0.008)
                    az = 0.18 + random.uniform(-0.008, 0.008)
                    gx = random.uniform(-0.5, 0.5)
                    gy = random.uniform(-0.5, 0.5)
                    gz = random.uniform(-0.5, 0.5)

            # Round values
            payload = {
                "device_code": self.device_code,
                "accel_x": round(ax, 3),
                "accel_y": round(ay, 3),
                "accel_z": round(az, 3),
                "gyro_x": round(gx, 2),
                "gyro_y": round(gy, 2),
                "gyro_z": round(gz, 2),
                "battery_level": max(15, 98 - (self.step_counter // 500)),
                "is_simulated": True,
                "timestamp": time.time()
            }

            if self.ingestion_callback:
                try:
                    self.ingestion_callback(payload)
                except Exception as e:
                    logger.error(f"Error in simulator ingestion callback: {e}")

            elapsed = time.time() - start_t
            sleep_time = max(0.001, interval - elapsed)
            time.sleep(sleep_time)
