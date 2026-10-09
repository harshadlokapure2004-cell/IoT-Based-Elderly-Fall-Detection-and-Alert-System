import React from 'react';
import { 
  ShieldCheck, ShieldAlert, Activity, Battery, Bell, 
  Clock, Cpu, Zap, Radio, RefreshCw, AlertTriangle
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import type { DashboardSummary, SensorReading, FallEvent } from '../types';

interface DashboardPageProps {
  summary: DashboardSummary | null;
  sensorHistory: SensorReading[];
  onNavigateToMonitoring: () => void;
  onNavigateToEvents: () => void;
  onRefresh: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  sensorHistory,
  onNavigateToMonitoring,
  onNavigateToEvents,
  onRefresh,
}) => {
  const latestReading = summary?.latest_reading;
  const isEmergency = (summary?.active_emergency_count ?? 0) > 0;
  const activeDevice = summary?.active_device;

  const chartData = sensorHistory.map((r, idx) => ({
    index: idx,
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    magnitude: r.accel_mag,
    accel_x: r.accel_x,
    accel_y: r.accel_y,
    accel_z: r.accel_z,
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">System Status & Dashboard</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              isEmergency ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {isEmergency ? '⚠️ Emergency Active' : '✓ System Normal'}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Monitoring real-time acceleration and gyroscope metrics for elderly patient safety.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium transition-all"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>Refresh</span>
          </button>
          <button
            onClick={onNavigateToMonitoring}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all"
          >
            <Activity className="w-4 h-4" />
            <span>Live Stream</span>
          </button>
        </div>
      </div>

      {/* Emergency Status Panel */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isEmergency 
          ? 'bg-rose-950/40 border-rose-500/60 animate-emergency-pulse' 
          : 'bg-slate-800/40 border-slate-700/50'
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className={`p-4 rounded-2xl ${
              isEmergency ? 'bg-rose-600 text-white animate-bounce' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {isEmergency ? <ShieldAlert className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEmergency ? 'CRITICAL EMERGENCY: FALL DETECTED' : 'Active Patient Monitoring Status'}
              </h2>
              <p className="text-sm text-slate-300 mt-0.5">
                {isEmergency 
                  ? `${summary?.active_emergency_count} unacknowledged fall event requires caregiver attention!`
                  : 'Sensors active. No fall events currently detected in the confirmation window.'}
              </p>
            </div>
          </div>

          {isEmergency && (
            <button
              onClick={onNavigateToEvents}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/40 transition-all"
            >
              Respond to Emergency
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: System Status */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System State</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Radio className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white capitalize">
              {summary?.system_status || 'Online'}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Monitoring Active</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Falls Today */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Falls Detected Today</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white">
              {summary?.falls_today ?? 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">Recorded in database</p>
          </div>
        </div>

        {/* KPI 3: Alerts Sent */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alerts Delivered</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white">
              {summary?.total_alerts_sent ?? 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">Caregiver notifications sent</p>
          </div>
        </div>

        {/* KPI 4: Battery & Sensor Node */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Node Battery</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Battery className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-400">
              {summary?.battery_level ?? 95}%
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              <span>{activeDevice?.device_code || 'SIM-ESP32-01'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Acceleration Chart & Latest Reading Tile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Acceleration Magnitude Graph (2 cols) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Zap className="w-5 h-5 text-blue-400" />
                <span>Real-Time Motion Acceleration (g)</span>
              </h3>
              <p className="text-xs text-slate-400">Live vector magnitude | 2.5g Impact Threshold</p>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                Live Data
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 4.5]} stroke="#94a3b8" tick={{ fontSize: 11 }} label={{ value: 'g', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <ReferenceLine y={2.5} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Impact Threshold (2.5g)', fill: '#f43f5e', fontSize: 10, position: 'insideTopRight' }} />
                <ReferenceLine y={0.5} stroke="#amber-400" strokeDasharray="4 4" label={{ value: 'Free-fall (0.5g)', fill: '#fbbf24', fontSize: 10, position: 'insideBottomRight' }} />
                <Line type="monotone" dataKey="magnitude" stroke="#3b82f6" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latest Instantaneous Sensor Readings Card (1 col) */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>Latest IMU Telemetry</span>
            </h3>
            <p className="text-xs text-slate-400">MPU6050 Accelerometer & Gyroscope</p>
          </div>

          {latestReading ? (
            <div className="space-y-4">
              {/* Activity Classification Badge */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Motion Classification</span>
                <span className={`text-xl font-extrabold block mt-1 ${
                  latestReading.activity_classification === 'Fall Detected' ? 'text-rose-400 animate-pulse' :
                  latestReading.activity_classification === 'Possible Fall' ? 'text-amber-400' :
                  latestReading.activity_classification === 'Walking' ? 'text-blue-400' : 'text-emerald-400'
                }`}>
                  {latestReading.activity_classification}
                </span>
              </div>

              {/* Accel magnitude */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-xs text-slate-400 block">Accel Mag</span>
                  <span className="text-lg font-bold text-white">{latestReading.accel_mag} g</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-xs text-slate-400 block">Gyro Z</span>
                  <span className="text-lg font-bold text-white">{latestReading.gyro_z} °/s</span>
                </div>
              </div>

              {/* Vector X, Y, Z breakdown */}
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs font-mono text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Accel X, Y, Z:</span>
                  <span>{latestReading.accel_x}, {latestReading.accel_y}, {latestReading.accel_z} g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gyro X, Y, Z:</span>
                  <span>{latestReading.gyro_x}, {latestReading.gyro_y}, {latestReading.gyro_z} °/s</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 text-sm">
              No live sensor data received yet.
            </div>
          )}

          <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{latestReading ? new Date(latestReading.timestamp).toLocaleTimeString() : 'N/A'}</span>
            </span>
            <span className="text-slate-500">{summary?.is_simulated ? 'SIMULATOR ACTIVE' : 'ESP32 HARDWARE'}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>Recent Fall Detection Activity Log</span>
          </h3>
          <button
            onClick={onNavigateToEvents}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-all"
          >
            View All History →
          </button>
        </div>

        {summary?.recent_events && summary.recent_events.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {summary.recent_events.map((evt: FallEvent) => (
              <div key={evt.event_id} className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-3 rounded-xl transition-all">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${
                    evt.status === 'active' ? 'bg-rose-500/20 text-rose-400' :
                    evt.status === 'acknowledged' ? 'bg-amber-500/20 text-amber-400' :
                    evt.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-white">Fall Detected ({evt.device_code})</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        evt.severity === 'Critical' ? 'bg-rose-900/60 text-rose-300' : 'bg-amber-900/60 text-amber-300'
                      }`}>
                        {evt.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Peak G: {evt.peak_acceleration}g | Confidence: {evt.confidence}% | Status: <strong className="capitalize">{evt.status}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">No fall events recorded today.</p>
        )}
      </div>
    </div>
  );
};
