import type { 
  DashboardSummary, Device, SensorReading, FallEvent, Caregiver, 
  NotificationLog, SystemSettings, TestSuiteReport 
} from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Health & Dashboard
  getHealth: () => fetchJson<{ status: string; timestamp: string }>('/health'),
  getDashboard: () => fetchJson<DashboardSummary>('/dashboard'),

  // Devices
  getDevices: () => fetchJson<Device[]>('/devices'),
  registerDevice: (data: Partial<Device>) => 
    fetchJson<{ message: string; device: Device }>('/devices/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Sensor Readings
  getLatestReadings: (limit = 50) => fetchJson<SensorReading[]>(`/sensors/latest?limit=${limit}`),
  postReading: (data: Partial<SensorReading>) => 
    fetchJson<{ status: string }>('/sensors/readings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Fall Events
  getEvents: (status?: string, severity?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);
    return fetchJson<FallEvent[]>(`/events?${params.toString()}`);
  },
  getEventDetails: (id: string) => fetchJson<FallEvent>(`/events/${id}`),
  acknowledgeEvent: (id: string, notes?: string) => 
    fetchJson<{ message: string; event: FallEvent }>(`/events/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ notes, acknowledged_by: 'Dashboard Caregiver' }),
    }),
  resolveEvent: (id: string, notes?: string) => 
    fetchJson<{ message: string; event: FallEvent }>(`/events/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ notes, resolved_by: 'Dashboard Caregiver' }),
    }),
  cancelEvent: (id: string, reason?: string) => 
    fetchJson<{ message: string; event: FallEvent }>(`/events/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Caregivers
  getCaregivers: () => fetchJson<Caregiver[]>('/caregivers'),
  createCaregiver: (data: Partial<Caregiver>) => 
    fetchJson<{ message: string; caregiver: Caregiver }>('/caregivers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCaregiver: (id: number, data: Partial<Caregiver>) => 
    fetchJson<{ message: string; caregiver: Caregiver }>(`/caregivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCaregiver: (id: number) => 
    fetchJson<{ message: string }>(`/caregivers/${id}`, {
      method: 'DELETE',
    }),

  // Alerts & Notifications
  getAlerts: () => fetchJson<NotificationLog[]>('/alerts'),
  testEmergencyAlert: () => 
    fetchJson<{ message: string; logs: NotificationLog[] }>('/alerts/test', {
      method: 'POST',
    }),

  // Settings
  getSettings: () => fetchJson<SystemSettings>('/settings'),
  updateSettings: (data: Partial<SystemSettings>) => 
    fetchJson<{ message: string; settings: SystemSettings }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  resetSettings: () => 
    fetchJson<{ message: string }>('/settings/reset', {
      method: 'POST',
    }),

  // Simulator
  startSimulator: () => fetchJson<{ message: string; active: boolean; mode: string }>('/simulator/start', { method: 'POST' }),
  stopSimulator: () => fetchJson<{ message: string; active: boolean }>('/simulator/stop', { method: 'POST' }),
  setSimulatorMode: (mode: string) => 
    fetchJson<{ message: string; mode: string }>('/simulator/mode', {
      method: 'POST',
      body: JSON.stringify({ mode }),
    }),

  // Reports & Tests
  getReportSummary: () => fetchJson<any>('/reports/summary'),
  runTestSuite: () => fetchJson<TestSuiteReport>('/tests/run', { method: 'POST' }),
  exportEventsCsvUrl: () => `${API_BASE}/reports/export`,
};
