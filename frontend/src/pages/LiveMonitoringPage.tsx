import React, { useState } from 'react';
import { 
  Activity, Play, Square, Sliders, Zap, 
  RotateCw, Footprints, Armchair, BedDouble, AlertCircle, WifiOff
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import type { SensorReading, SystemSettings } from '../types';
import { api } from '../services/api';

interface LiveMonitoringPageProps {
  latestReading: SensorReading | null;
  sensorHistory: SensorReading[];
  settings: SystemSettings | null;
  simulatorActive: boolean;
  simulatorMode: string;
  onRefreshSettings: () => void;
}

export const LiveMonitoringPage: React.FC<LiveMonitoringPageProps> = ({
  latestReading,
  sensorHistory,
  settings,
  simulatorActive,
  simulatorMode,
  onRefreshSettings,
}) => {
  const [impactThreshold, setImpactThreshold] = useState<number>(settings?.impact_threshold_g || 2.5);

  const chartData = sensorHistory.slice(-40).map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    Magnitude: r.accel_mag,
    Accel_X: r.accel_x,
    Accel_Y: r.accel_y,
    Accel_Z: r.accel_z,
  }));

  const handleThresholdChange = async (newVal: number) => {
    setImpactThreshold(newVal);
    try {
      await api.updateSettings({ impact_threshold_g: newVal });
      onRefreshSettings();
    } catch (err) {
      console.error('Failed to update impact threshold:', err);
    }
  };

  const handleToggleSimulator = async () => {
    try {
      if (simulatorActive) {
        await api.stopSimulator();
      } else {
        await api.startSimulator();
      }
    } catch (err) {
      console.error('Failed to toggle simulator:', err);
    }
  };

  const handleInjectScenario = async (mode: string) => {
    try {
      await api.setSimulatorMode(mode);
    } catch (err) {
      console.error('Failed to inject test mode:', err);
    }
  };

  const currentClassification = latestReading?.activity_classification || 'Normal';

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Activity className="w-7 h-7 text-blue-400" />
            <span>Live Sensor Telemetry & Classification</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time IMU vector magnitudes, activity classification engine, and test injection controls.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleSimulator}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
              simulatorActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            {simulatorActive ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{simulatorActive ? 'Stop Simulator' : 'Start Simulator'}</span>
          </button>
        </div>
      </div>

      {/* Activity Classification Badge & Telemetry KPI Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Large Animated Activity Badge (Col 1) */}
        <div className={`p-6 rounded-2xl border flex flex-col justify-between items-center text-center transition-all ${
          currentClassification === 'Fall Detected' ? 'bg-rose-950/80 border-rose-500 animate-emergency-pulse' :
          currentClassification === 'Possible Fall' ? 'bg-amber-950/60 border-amber-500/80' :
          currentClassification === 'Walking' ? 'bg-blue-950/40 border-blue-500/50' : 'bg-emerald-950/40 border-emerald-500/40'
        }`}>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Activity Classifier
          </span>

          <div className="my-4 space-y-2">
            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center border ${
              currentClassification === 'Fall Detected' ? 'bg-rose-600 text-white border-rose-400 animate-bounce' :
              currentClassification === 'Possible Fall' ? 'bg-amber-500 text-slate-950 border-amber-300' :
              currentClassification === 'Walking' ? 'bg-blue-500 text-white border-blue-300' : 'bg-emerald-500 text-slate-950 border-emerald-300'
            }`}>
              <Activity className="w-9 h-9" />
            </div>

            <h3 className={`text-2xl font-black ${
              currentClassification === 'Fall Detected' ? 'text-rose-400' :
              currentClassification === 'Possible Fall' ? 'text-amber-400' :
              currentClassification === 'Walking' ? 'text-blue-400' : 'text-emerald-400'
            }`}>
              {currentClassification}
            </h3>
          </div>

          <div className="text-xs text-slate-400">
            Last update: <strong className="text-slate-200">{latestReading ? new Date(latestReading.timestamp).toLocaleTimeString() : 'N/A'}</strong>
          </div>
        </div>

        {/* Acceleration Vectors Card (Col 2) */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acceleration (g)</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">g Units</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-rose-400">X-Axis</span>
              <span className="text-base font-extrabold text-white font-mono">{latestReading?.accel_x ?? 0.0} g</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-emerald-400">Y-Axis</span>
              <span className="text-base font-extrabold text-white font-mono">{latestReading?.accel_y ?? 0.0} g</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-blue-400">Z-Axis</span>
              <span className="text-base font-extrabold text-white font-mono">{latestReading?.accel_z ?? 1.0} g</span>
            </div>
          </div>
        </div>

        {/* Gyroscope Vectors Card (Col 3) */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Angular Velocity (°/s)</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">dps</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-rose-400">Gyro X</span>
              <span className="text-base font-extrabold text-white font-mono">{latestReading?.gyro_x ?? 0.0} °/s</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-emerald-400">Gyro Y</span>
              <span className="text-base font-extrabold text-white font-mono">{latestReading?.gyro_y ?? 0.0} °/s</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-blue-400">Gyro Z</span>
              <span className="text-base font-extrabold text-white font-mono">{latestReading?.gyro_z ?? 0.0} °/s</span>
            </div>
          </div>
        </div>

        {/* Acceleration Magnitude Card (Col 4) */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vector Magnitude</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>

          <div className="text-center py-2">
            <span className="text-4xl font-black text-amber-400 font-mono tracking-tight">
              {latestReading?.accel_mag ?? 1.0}
            </span>
            <span className="text-xs text-slate-400 block mt-1">Euclidean g (√(X²+Y²+Z²))</span>
          </div>

          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
            Current Impact Threshold: <strong className="text-white">{impactThreshold} g</strong>
          </div>
        </div>
      </div>

      {/* Live Graph Chart */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span>Real-Time Sensor Oscilloscope</span>
            </h3>
            <p className="text-xs text-slate-400">Live stream of X, Y, Z vector components and resultant magnitude</p>
          </div>

          {/* Configurable Monitoring Threshold Slider */}
          <div className="flex items-center space-x-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <Sliders className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-300 font-medium">Impact Threshold:</span>
            <input
              type="range"
              min="1.5"
              max="4.5"
              step="0.1"
              value={impactThreshold}
              onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
              className="w-24 accent-blue-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-white font-mono">{impactThreshold}g</span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis domain={[-1.5, 4.5]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="Magnitude" stroke="#fbbf24" strokeWidth={3} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="Accel_X" stroke="#f43f5e" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="Accel_Y" stroke="#10b981" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="Accel_Z" stroke="#3b82f6" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Simulator Test Scenario Injection Controls */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <RotateCw className="w-5 h-5 text-indigo-400" />
            <span>Interactive Motion Test Scenario Injector</span>
          </h3>
          <p className="text-xs text-slate-400">
            Inject synthetic IMU motion sequences directly into the backend ingestion pipeline to evaluate fall algorithm response.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => handleInjectScenario('walking')}
            className={`p-3.5 rounded-xl border font-medium text-xs flex flex-col items-center justify-center space-y-2 transition-all ${
              simulatorMode === 'walking'
                ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold shadow-lg'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Footprints className="w-5 h-5 text-blue-400" />
            <span>Normal Walking</span>
          </button>

          <button
            onClick={() => handleInjectScenario('sitting')}
            className={`p-3.5 rounded-xl border font-medium text-xs flex flex-col items-center justify-center space-y-2 transition-all ${
              simulatorMode === 'sitting'
                ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold shadow-lg'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Armchair className="w-5 h-5 text-emerald-400" />
            <span>Sitting Down</span>
          </button>

          <button
            onClick={() => handleInjectScenario('lying_down')}
            className={`p-3.5 rounded-xl border font-medium text-xs flex flex-col items-center justify-center space-y-2 transition-all ${
              simulatorMode === 'lying_down'
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-bold shadow-lg'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BedDouble className="w-5 h-5 text-indigo-400" />
            <span>Lying Down</span>
          </button>

          <button
            onClick={() => handleInjectScenario('sudden_movement')}
            className={`p-3.5 rounded-xl border font-medium text-xs flex flex-col items-center justify-center space-y-2 transition-all ${
              simulatorMode === 'sudden_movement'
                ? 'bg-amber-600/30 border-amber-500 text-amber-300 font-bold shadow-lg'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Sudden Movement</span>
          </button>

          <button
            onClick={() => handleInjectScenario('fall')}
            className={`p-3.5 rounded-xl border font-bold text-xs flex flex-col items-center justify-center space-y-2 transition-all ${
              simulatorMode === 'fall'
                ? 'bg-rose-600 text-white border-rose-400 shadow-lg animate-pulse'
                : 'bg-rose-950/60 border-rose-800 text-rose-300 hover:bg-rose-900/80'
            }`}
          >
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span>Trigger Fall Event</span>
          </button>

          <button
            onClick={() => handleInjectScenario('disconnect')}
            className={`p-3.5 rounded-xl border font-medium text-xs flex flex-col items-center justify-center space-y-2 transition-all ${
              simulatorMode === 'disconnect'
                ? 'bg-slate-700 border-slate-500 text-slate-200'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <WifiOff className="w-5 h-5 text-slate-400" />
            <span>Disconnect Sensor</span>
          </button>
        </div>
      </div>
    </div>
  );
};
