import React from 'react';
import { AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import type { FallEvent } from '../types';

interface EmergencyBannerProps {
  activeEvents: FallEvent[];
  onAcknowledge: (eventId: string) => void;
  onViewEvents: () => void;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  activeEvents,
  onAcknowledge,
  onViewEvents,
}) => {
  if (!activeEvents || activeEvents.length === 0) return null;

  const latestFall = activeEvents[0];

  return (
    <div className="bg-gradient-to-r from-rose-900/90 via-red-800/90 to-rose-900/90 border-b border-rose-500/50 p-4 text-white shadow-2xl animate-emergency-pulse">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-full bg-rose-600/40 border border-rose-400/50 animate-bounce">
            <AlertTriangle className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-wide uppercase text-rose-200">
                🚨 Emergency Fall Alert Detected!
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-rose-800">
                Severity: {latestFall.severity}
              </span>
            </div>
            <p className="text-sm text-rose-100 mt-0.5">
              Device <strong className="font-mono">{latestFall.device_code}</strong> triggered a fall event at{' '}
              {new Date(latestFall.timestamp).toLocaleTimeString()}. Peak Acceleration:{' '}
              <strong className="text-white">{latestFall.peak_acceleration}g</strong> (Confidence:{' '}
              {latestFall.confidence}%)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <button
            onClick={() => onAcknowledge(latestFall.event_id)}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-rose-900 hover:bg-rose-50 font-bold text-sm shadow-lg transition-all transform hover:scale-105"
          >
            <CheckCircle className="w-4 h-4 text-rose-700" />
            <span>Acknowledge Alarm</span>
          </button>
          <button
            onClick={onViewEvents}
            className="flex items-center justify-center space-x-1 px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-400/40 text-white font-medium text-sm transition-all"
          >
            <span>View All ({activeEvents.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
