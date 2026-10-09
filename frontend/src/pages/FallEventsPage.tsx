import React, { useState } from 'react';
import { 
  ShieldAlert, Filter, Calendar, ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import type { FallEvent } from '../types';
import { api } from '../services/api';

interface FallEventsPageProps {
  events: FallEvent[];
  onRefreshEvents: () => void;
}

export const FallEventsPage: React.FC<FallEventsPageProps> = ({
  events,
  onRefreshEvents,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [activeModalEvent, setActiveModalEvent] = useState<FallEvent | null>(null);
  const [actionNotes, setActionNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredEvents = events.filter((e) => {
    if (selectedStatus !== 'all' && e.status !== selectedStatus) return false;
    if (selectedSeverity !== 'all' && e.severity !== selectedSeverity) return false;
    return true;
  });

  const handleOpenDetails = async (eventId: string) => {
    try {
      const details = await api.getEventDetails(eventId);
      setActiveModalEvent(details);
    } catch (err) {
      console.error('Failed to load event snapshot details:', err);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      setIsSubmitting(true);
      await api.acknowledgeEvent(id, actionNotes);
      setActionNotes('');
      onRefreshEvents();
      if (activeModalEvent && activeModalEvent.event_id === id) {
        const updated = await api.getEventDetails(id);
        setActiveModalEvent(updated);
      }
    } catch (err) {
      console.error('Acknowledge failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      setIsSubmitting(true);
      await api.resolveEvent(id, actionNotes);
      setActionNotes('');
      onRefreshEvents();
      if (activeModalEvent && activeModalEvent.event_id === id) {
        const updated = await api.getEventDetails(id);
        setActiveModalEvent(updated);
      }
    } catch (err) {
      console.error('Resolution failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelFalsePositive = async (id: string) => {
    try {
      setIsSubmitting(true);
      await api.cancelEvent(id, actionNotes || 'Marked as false alarm');
      setActionNotes('');
      onRefreshEvents();
      if (activeModalEvent && activeModalEvent.event_id === id) {
        const updated = await api.getEventDetails(id);
        setActiveModalEvent(updated);
      }
    } catch (err) {
      console.error('Cancel failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <ShieldAlert className="w-7 h-7 text-rose-400" />
            <span>Fall Detection Incident History</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable log of detected fall incidents, caregiver acknowledgments, and resolution records.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Statuses</option>
              <option value="active" className="bg-slate-900 text-rose-400">Active Emergency</option>
              <option value="acknowledged" className="bg-slate-900 text-amber-400">Acknowledged</option>
              <option value="resolved" className="bg-slate-900 text-emerald-400">Resolved</option>
              <option value="cancelled" className="bg-slate-900 text-slate-400">False Positive</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Severities</option>
              <option value="Critical" className="bg-slate-900">Critical</option>
              <option value="High" className="bg-slate-900">High</option>
              <option value="Medium" className="bg-slate-900">Medium</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Event ID / Device</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Peak Accel (g)</th>
                <th className="px-6 py-4">Confidence</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((evt) => (
                  <tr key={evt.event_id} className="hover:bg-slate-800/40 transition-all">
                    <td className="px-6 py-4 font-medium text-white">
                      <div className="font-mono text-xs text-blue-400 font-bold">{evt.event_id.slice(0, 16)}...</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{evt.device_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-300">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(evt.timestamp).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        evt.severity === 'Critical' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                        evt.severity === 'High' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}>
                        {evt.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-white">
                      {evt.peak_acceleration} g
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full rounded-full" 
                            style={{ width: `${evt.confidence}%` }} 
                          />
                        </div>
                        <span className="font-mono text-xs text-slate-300">{evt.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                        evt.status === 'active' ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40 animate-pulse' :
                        evt.status === 'acknowledged' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        evt.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        'bg-slate-700/40 text-slate-400 border border-slate-700'
                      }`}>
                        {evt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      {evt.status === 'active' && (
                        <button
                          onClick={() => handleAcknowledge(evt.event_id)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Acknowledge
                        </button>
                      )}
                      {evt.status !== 'resolved' && evt.status !== 'cancelled' && (
                        <button
                          onClick={() => handleResolve(evt.event_id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenDetails(evt.event_id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-all inline-flex items-center space-x-1"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No fall incidents matching filter selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Details & Sensor Snapshot Modal */}
      {activeModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card max-w-3xl w-full rounded-2xl border border-slate-700 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <ShieldAlert className="w-6 h-6 text-rose-400" />
                  <span>Fall Event Detailed Diagnostics</span>
                </h2>
                <p className="text-xs font-mono text-slate-400 mt-1">ID: {activeModalEvent.event_id}</p>
              </div>

              <button
                onClick={() => setActiveModalEvent(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Event Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Severity</span>
                <span className="text-base font-bold text-rose-400">{activeModalEvent.severity}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Peak Acceleration</span>
                <span className="text-base font-bold text-amber-400">{activeModalEvent.peak_acceleration} g</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Algorithm Confidence</span>
                <span className="text-base font-bold text-blue-400">{activeModalEvent.confidence}%</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Current Status</span>
                <span className="text-base font-bold text-emerald-400 capitalize">{activeModalEvent.status}</span>
              </div>
            </div>

            {/* Sensor Snapshot Recharts Graph around event window */}
            {activeModalEvent.sensor_snapshot && activeModalEvent.sensor_snapshot.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  ±5 Second Sensor Reading Window Snapshot
                </h4>
                <div className="h-48 w-full bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activeModalEvent.sensor_snapshot.map((s) => ({
                      time: new Date(s.timestamp).toLocaleTimeString([], { second: '2-digit' }),
                      Magnitude: s.accel_mag,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 4.5]} stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                      <ReferenceLine y={2.5} stroke="#f43f5e" strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="Magnitude" stroke="#f43f5e" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Action Note Input & Status Control Buttons */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block">Add Caregiver Note / Action Remarks:</label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Enter notes regarding emergency response, caregiver check, or false alarm cause..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 h-20"
              />

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                {activeModalEvent.status === 'active' && (
                  <button
                    disabled={isSubmitting}
                    onClick={() => handleAcknowledge(activeModalEvent.event_id)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Acknowledge Alert
                  </button>
                )}
                {activeModalEvent.status !== 'resolved' && (
                  <button
                    disabled={isSubmitting}
                    onClick={() => handleResolve(activeModalEvent.event_id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Mark as Resolved
                  </button>
                )}
                {activeModalEvent.status !== 'cancelled' && (
                  <button
                    disabled={isSubmitting}
                    onClick={() => handleCancelFalsePositive(activeModalEvent.event_id)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
                  >
                    Flag False Positive
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
