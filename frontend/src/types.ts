export interface Device {
  id: number;
  device_code: string;
  name: string;
  status: 'online' | 'offline' | 'error';
  is_simulated: boolean;
  battery_level: number;
  firmware_version: string;
  sensor_type: string;
  last_seen: string | null;
  created_at: string | null;
}

export interface SensorReading {
  id?: number;
  device_code: string;
  accel_x: number;
  accel_y: number;
  accel_z: number;
  accel_mag: number;
  gyro_x: number;
  gyro_y: number;
  gyro_z: number;
  activity_classification: 'Normal' | 'Walking' | 'Sitting' | 'Lying Down' | 'Possible Fall' | 'Fall Detected';
  is_simulated: boolean;
  timestamp: string;
}

export interface FallEvent {
  id: number;
  event_id: string;
  device_code: string;
  timestamp: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
  status: 'active' | 'acknowledged' | 'resolved' | 'cancelled';
  peak_acceleration: number;
  post_inactivity_duration: number;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  notes: string;
  is_simulated: boolean;
  sensor_snapshot?: SensorReading[];
  notifications?: NotificationLog[];
}

export interface Caregiver {
  id: number;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
}

export interface NotificationLog {
  id: number;
  event_id: string;
  caregiver_id: number | null;
  caregiver_name: string;
  channel: 'email' | 'sms' | 'simulated' | 'simulated_email' | 'simulated_sms';
  recipient: string;
  status: 'sent' | 'delivered' | 'failed';
  error_message: string;
  sent_at: string;
}

export interface SystemSettings {
  id: number;
  freefall_threshold_g: number;
  impact_threshold_g: number;
  gyro_threshold_dps: number;
  inactivity_timeout_sec: number;
  confirm_window_sec: number;
  cancel_window_sec: number;
  sampling_interval_ms: number;
  smtp_server: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password?: string;
  smtp_sender: string;
  twilio_sid: string;
  twilio_token?: string;
  twilio_phone: string;
  simulated_mode_enabled: boolean;
  has_smtp_configured: boolean;
  has_twilio_configured: boolean;
  updated_at: string;
}

export interface DashboardSummary {
  system_status: 'online' | 'idle' | 'offline';
  monitoring_active: boolean;
  is_simulated: boolean;
  active_device: Device | null;
  falls_today: number;
  total_alerts_sent: number;
  active_emergency_count: number;
  battery_level: number;
  latest_reading: SensorReading | null;
  recent_readings: SensorReading[];
  recent_events: FallEvent[];
  simulator: {
    active: boolean;
    mode: string;
  };
}

export interface TestResultItem {
  scenario: string;
  type: string;
  expected_fall: boolean;
  detected_fall: boolean;
  status: 'PASSED' | 'FAILED';
  latency_ms: number;
}

export interface TestSuiteReport {
  summary: {
    total_tests: number;
    passed: number;
    failed: number;
    success_rate_pct: number;
  };
  details: TestResultItem[];
}
