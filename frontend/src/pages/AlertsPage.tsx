import React, { useState } from 'react';
import { 
  Bell, CheckCircle, Mail, 
  MessageSquare, Sparkles, Clock, RefreshCw
} from 'lucide-react';
import type { NotificationLog } from '../types';
import { api } from '../services/api';

interface AlertsPageProps {
  alerts: NotificationLog[];
  onRefreshAlerts: () => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  alerts,
  onRefreshAlerts,
}) => {
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResultMsg, setTestResultMsg] = useState<string | null>(null);

  const handleTestEmergencyAlert = async () => {
    try {
      setIsSendingTest(true);
      setTestResultMsg(null);
      const res = await api.testEmergencyAlert();
      setTestResultMsg(res.message);
      onRefreshAlerts();
    } catch (err: any) {
      setTestResultMsg(`Failed: ${err.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Manual Emergency Test Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Bell className="w-7 h-7 text-indigo-400" />
            <span>Emergency Alert & Notification Dispatcher</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time audit log of email, SMS, and simulated caregiver emergency alerts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleTestEmergencyAlert}
            disabled={isSendingTest}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 transition-all border border-rose-400/30"
          >
            <Sparkles className="w-4 h-4" />
            <span>[TEST] MANUAL EMERGENCY ALERT</span>
          </button>
        </div>
      </div>

      {testResultMsg && (
        <div className="p-4 rounded-xl bg-blue-950/80 border border-blue-500/50 text-blue-200 text-sm flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-blue-400" />
          <span>{testResultMsg}</span>
        </div>
      )}

      {/* Notification Logs Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Notification Delivery History & Audit Trail</span>
          </h3>
          <button
            onClick={onRefreshAlerts}
            className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Event ID</th>
                <th className="px-6 py-4">Caregiver</th>
                <th className="px-6 py-4">Channel</th>
                <th className="px-6 py-4">Recipient</th>
                <th className="px-6 py-4">Delivery Status</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {alerts.length > 0 ? (
                alerts.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-all text-xs">
                    <td className="px-6 py-4 font-mono font-bold text-blue-400">
                      {log.event_id}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">
                      {log.caregiver_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        log.channel.includes('email') ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        log.channel.includes('sms') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {log.channel.includes('email') ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                        <span className="capitalize">{log.channel.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">
                      {log.recipient}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full font-bold ${
                        log.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        log.status === 'sent' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {log.status === 'delivered' ? '✓ Delivered' : log.status === 'sent' ? 'Sent' : '✕ Failed'}
                      </span>
                      {log.error_message && (
                        <span className="block text-xs text-slate-400 font-mono mt-1 max-w-xs truncate" title={log.error_message}>
                          {log.error_message}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono">
                      {new Date(log.sent_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No alert logs recorded yet. Use the test button above to dispatch a simulated alert.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
