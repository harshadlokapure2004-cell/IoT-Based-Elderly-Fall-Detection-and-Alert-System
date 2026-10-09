import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, RotateCcw, Sliders, Mail, 
  MessageSquare, CheckCircle2, Lock
} from 'lucide-react';
import type { SystemSettings } from '../types';
import { api } from '../services/api';

interface SettingsPageProps {
  settings: SystemSettings | null;
  onRefreshSettings: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onRefreshSettings,
}) => {
  const [freefallG, setFreefallG] = useState(0.5);
  const [impactG, setImpactG] = useState(2.5);
  const [gyroDps, setGyroDps] = useState(150.0);
  const [inactivitySec, setInactivitySec] = useState(10.0);
  const [samplingMs, setSamplingMs] = useState(100);

  // Provider fields
  const [smtpServer, setSmtpServer] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpSender, setSmtpSender] = useState('');

  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioPhone, setTwilioPhone] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  useEffect(() => {
    if (settings) {
      setFreefallG(settings.freefall_threshold_g);
      setImpactG(settings.impact_threshold_g);
      setGyroDps(settings.gyro_threshold_dps);
      setInactivitySec(settings.inactivity_timeout_sec);
      setSamplingMs(settings.sampling_interval_ms);

      setSmtpServer(settings.smtp_server || '');
      setSmtpPort(settings.smtp_port || 587);
      setSmtpUser(settings.smtp_username || '');
      setSmtpSender(settings.smtp_sender || '');

      setTwilioSid(settings.twilio_sid || '');
      setTwilioPhone(settings.twilio_phone || '');
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.updateSettings({
        freefall_threshold_g: freefallG,
        impact_threshold_g: impactG,
        gyro_threshold_dps: gyroDps,
        inactivity_timeout_sec: inactivitySec,
        sampling_interval_ms: samplingMs,
        smtp_server: smtpServer,
        smtp_port: smtpPort,
        smtp_username: smtpUser,
        smtp_password: smtpPass,
        smtp_sender: smtpSender,
        twilio_sid: twilioSid,
        twilio_token: twilioToken,
        twilio_phone: twilioPhone,
      });

      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
      onRefreshSettings();
    } catch (err) {
      console.error('Save settings failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Reset all fall detection algorithm thresholds and provider settings to default factory values?')) return;
    try {
      await api.resetSettings();
      onRefreshSettings();
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Settings className="w-7 h-7 text-indigo-400" />
            <span>Algorithm Thresholds & System Settings</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tune fall detection parameters, free-fall sensitivity, and notification provider credentials.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition-all"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>System settings and fall detection engine thresholds updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Fall Detection Algorithm Tuning */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <span>1. Fall Detection Algorithm Tuning</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Free-Fall Threshold (g)</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="0.9"
                value={freefallG}
                onChange={(e) => setFreefallG(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
              <p className="text-slate-400 text-[11px] mt-1">Triggers drop phase when acceleration drops below this value.</p>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Impact Threshold (g)</label>
              <input
                type="number"
                step="0.1"
                min="1.5"
                max="5.0"
                value={impactG}
                onChange={(e) => setImpactG(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
              <p className="text-slate-400 text-[11px] mt-1">Triggers impact phase when acceleration surge exceeds this value.</p>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Gyroscope Spike Threshold (°/s)</label>
              <input
                type="number"
                step="10"
                min="50"
                max="400"
                value={gyroDps}
                onChange={(e) => setGyroDps(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
              <p className="text-slate-400 text-[11px] mt-1">Required angular velocity rotation spike magnitude.</p>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Post-Impact Inactivity Window (sec)</label>
              <input
                type="number"
                step="1"
                min="3"
                max="30"
                value={inactivitySec}
                onChange={(e) => setInactivitySec(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
              <p className="text-slate-400 text-[11px] mt-1">Duration of low movement required following impact.</p>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Sampling Interval (ms)</label>
              <input
                type="number"
                step="10"
                min="20"
                max="500"
                value={samplingMs}
                onChange={(e) => setSamplingMs(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
              <p className="text-slate-400 text-[11px] mt-1">100ms = 10Hz sampling frequency.</p>
            </div>
          </div>
        </div>

        {/* Section 2: SMTP Email Settings */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Mail className="w-5 h-5 text-blue-400" />
            <span>2. SMTP Email Notification Settings</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">SMTP Host</label>
              <input
                type="text"
                value={smtpServer}
                onChange={(e) => setSmtpServer(e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Port</label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(parseInt(e.target.value))}
                placeholder="587"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Sender Email</label>
              <input
                type="text"
                value={smtpSender}
                onChange={(e) => setSmtpSender(e.target.value)}
                placeholder="alerts@elderlycare.io"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">SMTP Username</label>
              <input
                type="text"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="your-email@gmail.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1 flex items-center space-x-1">
                <span>SMTP Password / App Key</span>
                <Lock className="w-3 h-3 text-slate-400" />
              </label>
              <input
                type="password"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Twilio SMS Settings */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <span>3. Twilio SMS Gateway Settings</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Twilio Account SID</label>
              <input
                type="text"
                value={twilioSid}
                onChange={(e) => setTwilioSid(e.target.value)}
                placeholder="ACXXXXXXXXXXXXXXXXX"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1 flex items-center space-x-1">
                <span>Auth Token</span>
                <Lock className="w-3 h-3 text-slate-400" />
              </label>
              <input
                type="password"
                value={twilioToken}
                onChange={(e) => setTwilioToken(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Twilio Phone Number</label>
              <input
                type="text"
                value={twilioPhone}
                onChange={(e) => setTwilioPhone(e.target.value)}
                placeholder="+1234567890"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save All Configurations</span>
          </button>
        </div>
      </form>
    </div>
  );
};
