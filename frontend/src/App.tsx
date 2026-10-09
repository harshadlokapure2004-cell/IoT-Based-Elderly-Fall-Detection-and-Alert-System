import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { EmergencyBanner } from './components/EmergencyBanner';

import { DashboardPage } from './pages/DashboardPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { FallEventsPage } from './pages/FallEventsPage';
import { CaregiversPage } from './pages/CaregiversPage';
import { AlertsPage } from './pages/AlertsPage';
import { DevicesPage } from './pages/DevicesPage';
import { SettingsPage } from './pages/SettingsPage';
import { TestingReportsPage } from './pages/TestingReportsPage';

import { api } from './services/api';
import { initWebSocket } from './services/websocket';
import type { 
  DashboardSummary, SensorReading, FallEvent, 
  Caregiver, NotificationLog, SystemSettings, Device 
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [sensorHistory, setSensorHistory] = useState<SensorReading[]>([]);
  const [events, setEvents] = useState<FallEvent[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [alerts, setAlerts] = useState<NotificationLog[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Load initial data
  const loadDashboard = useCallback(async () => {
    try {
      const data = await api.getDashboard();
      setSummary(data);
      if (data.recent_readings && data.recent_readings.length > 0) {
        setSensorHistory(data.recent_readings);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const evts = await api.getEvents();
      setEvents(evts);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  }, []);

  const loadCaregivers = useCallback(async () => {
    try {
      const cgs = await api.getCaregivers();
      setCaregivers(cgs);
    } catch (err) {
      console.error('Failed to load caregivers:', err);
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const logs = await api.getAlerts();
      setAlerts(logs);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  }, []);

  const loadDevices = useCallback(async () => {
    try {
      const devs = await api.getDevices();
      setDevices(devs);
    } catch (err) {
      console.error('Failed to load devices:', err);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const sets = await api.getSettings();
      setSettings(sets);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }, []);

  const refreshAll = useCallback(() => {
    loadDashboard();
    loadEvents();
    loadCaregivers();
    loadAlerts();
    loadDevices();
    loadSettings();
  }, [loadDashboard, loadEvents, loadCaregivers, loadAlerts, loadDevices, loadSettings]);

  useEffect(() => {
    refreshAll();

    // Initialize WebSockets
    const socket = initWebSocket(
      (reading: SensorReading) => {
        setSensorHistory((prev) => {
          const next = [...prev, reading];
          return next.slice(-60); // Keep last 60 readings
        });
        setSummary((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            latest_reading: reading,
          };
        });
      },
      (fallEvt: FallEvent) => {
        setEvents((prev) => [fallEvt, ...prev]);
        loadDashboard();
      },
      () => {
        loadAlerts();
      },
      (updatedEvt: FallEvent) => {
        setEvents((prev) => prev.map((e) => (e.event_id === updatedEvt.event_id ? updatedEvt : e)));
        loadDashboard();
      }
    );

    if (socket) {
      setIsConnected(socket.connected);
      socket.on('connect', () => setIsConnected(true));
      socket.on('disconnect', () => setIsConnected(false));
    }
  }, [refreshAll, loadDashboard, loadAlerts]);

  const activeEvents = events.filter((e) => e.status === 'active');

  const handleAcknowledgeEvent = async (eventId: string) => {
    try {
      await api.acknowledgeEvent(eventId);
      loadEvents();
      loadDashboard();
    } catch (err) {
      console.error('Failed to acknowledge event:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        activeEmergencyCount={activeEvents.length}
        isSimulated={summary?.is_simulated ?? true}
      />

      <EmergencyBanner
        activeEvents={activeEvents}
        onAcknowledge={handleAcknowledgeEvent}
        onViewEvents={() => setActiveTab('events')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardPage
            summary={summary}
            sensorHistory={sensorHistory}
            onNavigateToMonitoring={() => setActiveTab('monitoring')}
            onNavigateToEvents={() => setActiveTab('events')}
            onRefresh={refreshAll}
          />
        )}

        {activeTab === 'monitoring' && (
          <LiveMonitoringPage
            latestReading={summary?.latest_reading || (sensorHistory.length > 0 ? sensorHistory[sensorHistory.length - 1] : null)}
            sensorHistory={sensorHistory}
            settings={settings}
            simulatorActive={summary?.simulator?.active ?? true}
            simulatorMode={summary?.simulator?.mode ?? 'walking'}
            onRefreshSettings={loadSettings}
          />
        )}

        {activeTab === 'events' && (
          <FallEventsPage
            events={events}
            onRefreshEvents={loadEvents}
          />
        )}

        {activeTab === 'caregivers' && (
          <CaregiversPage
            caregivers={caregivers}
            settings={settings}
            onRefresh={loadCaregivers}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsPage
            alerts={alerts}
            onRefreshAlerts={loadAlerts}
          />
        )}

        {activeTab === 'devices' && (
          <DevicesPage
            devices={devices}
            onRefreshDevices={loadDevices}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            settings={settings}
            onRefreshSettings={loadSettings}
          />
        )}

        {activeTab === 'reports' && (
          <TestingReportsPage />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950/80 border-t border-slate-800/80 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            <span>GuardianPulse IoT Fall Detection & Alert System v1.0.0</span>
          </div>
          <div>
            <span>Built with React, Vite, TypeScript, Flask, SQLite & Socket.IO</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
