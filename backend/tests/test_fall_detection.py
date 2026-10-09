import pytest
import time
from app.detection.fall_detector import FallDetectionEngine

def test_fall_detector_normal_walking():
    detector = FallDetectionEngine()
    # Process 10 normal walking samples
    for i in range(10):
        is_fall, classification, meta = detector.process_sample(
            accel_x=0.1, accel_y=0.05, accel_z=1.05,
            gyro_x=10.0, gyro_y=-5.0, gyro_z=2.0
        )
        assert is_fall is False
        assert classification in ["Normal", "Walking"]

def test_fall_detector_fall_sequence():
    detector = FallDetectionEngine()
    
    # 1. Normal stance
    detector.process_sample(0.02, 0.05, 0.98, 0.0, 0.0, 0.0)
    
    # 2. Freefall drop (< 0.5g)
    detector.process_sample(0.15, 0.12, 0.20, -30.0, 60.0, 80.0)
    
    # 3. High impact peak (> 2.5g)
    is_fall_impact, class_impact, meta_impact = detector.process_sample(2.4, 2.8, 3.2, 220.0, 190.0, 150.0)
    
    # 4. Post-fall inactivity (lying down posture)
    is_fall_inact, class_inact, meta_inact = detector.process_sample(0.92, 0.15, 0.18, 0.0, 0.0, 0.0)

    # Either impact or inactivity sample triggered the fall event
    assert (is_fall_impact or is_fall_inact) is True
    meta = meta_impact if is_fall_impact else meta_inact
    assert meta["confidence"] >= 65.0
    assert meta["severity"] in ["High", "Critical"]

def test_fall_detector_sudden_movement_not_fall():
    detector = FallDetectionEngine()
    # Sudden acceleration spike without prior freefall or post-inactivity
    is_fall, classification, meta = detector.process_sample(0.5, 0.6, 1.4, 80.0, 60.0, 40.0)
    assert is_fall is False
    assert classification in ["Walking", "Possible Fall", "Normal"]

def test_magnitude_calculation():
    mag = FallDetectionEngine.calculate_magnitude(3.0, 4.0, 0.0)
    assert abs(mag - 5.0) < 0.001
