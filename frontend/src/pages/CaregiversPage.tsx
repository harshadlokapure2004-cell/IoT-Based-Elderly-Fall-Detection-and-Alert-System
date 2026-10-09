import React, { useState } from 'react';
import { 
  Users, UserPlus, Phone, Mail, HeartHandshake, Star, 
  Trash2, Edit, CheckCircle, Shield
} from 'lucide-react';
import type { Caregiver, SystemSettings } from '../types';
import { api } from '../services/api';

interface CaregiversPageProps {
  caregivers: Caregiver[];
  settings: SystemSettings | null;
  onRefresh: () => void;
}

export const CaregiversPage: React.FC<CaregiversPageProps> = ({
  caregivers,
  settings,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCaregiver, setEditingCaregiver] = useState<Caregiver | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('Family Member');
  const [isPrimary, setIsPrimary] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});

  const validateForm = (): boolean => {
    const errs: { name?: string; phone?: string; email?: string } = {};
    if (!name.trim()) errs.name = 'Caregiver name is required';
    if (!phone.trim() || phone.length < 7) errs.phone = 'Valid phone number is required';
    if (!email.trim() || !email.includes('@')) errs.email = 'Valid email address is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenAdd = () => {
    setEditingCaregiver(null);
    setName('');
    setPhone('');
    setEmail('');
    setRelationship('Family Member');
    setIsPrimary(false);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cg: Caregiver) => {
    setEditingCaregiver(cg);
    setName(cg.name);
    setPhone(cg.phone);
    setEmail(cg.email);
    setRelationship(cg.relationship);
    setIsPrimary(cg.is_primary);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        name,
        phone,
        email,
        relationship,
        is_primary: isPrimary,
      };

      if (editingCaregiver) {
        await api.updateCaregiver(editingCaregiver.id, payload);
      } else {
        await api.createCaregiver(payload);
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Caregiver save error:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this caregiver contact?')) return;
    try {
      await api.deleteCaregiver(id);
      onRefresh();
    } catch (err) {
      console.error('Failed to remove caregiver:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Users className="w-7 h-7 text-indigo-400" />
            <span>Caregiver Contact Registry</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage designated family emergency contacts, nurses, and medical first responders.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Caregiver</span>
        </button>
      </div>

      {/* Provider Readiness Alert Banner */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Emergency Dispatch Provider Status</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              SMTP Email:{' '}
              <strong className={settings?.has_smtp_configured ? 'text-emerald-400' : 'text-amber-400 font-normal'}>
                {settings?.has_smtp_configured ? 'Configured (Live Email)' : 'Development Simulation Mode'}
              </strong>{' '}
              | Twilio SMS:{' '}
              <strong className={settings?.has_twilio_configured ? 'text-emerald-400' : 'text-amber-400 font-normal'}>
                {settings?.has_twilio_configured ? 'Configured (Live SMS)' : 'Development Simulation Mode'}
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* Caregiver Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {caregivers.map((cg) => (
          <div key={cg.id} className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <span>{cg.name}</span>
                    {cg.is_primary && (
                      <span className="flex items-center space-x-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        <Star className="w-3 h-3 fill-amber-300" />
                        <span>Primary</span>
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-indigo-400 font-medium mt-0.5 flex items-center space-x-1">
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>{cg.relationship}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(cg)}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cg.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono">{cg.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span className="font-mono truncate">{cg.email}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Emergency Status:</span>
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Alert Active</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Caregiver Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card max-w-lg w-full rounded-2xl border border-slate-700 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">
                {editingCaregiver ? 'Edit Caregiver Contact' : 'Register New Caregiver'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1-555-019-2831"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                  {errors.phone && <p className="text-rose-400 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Relationship</label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Family Member">Family Member</option>
                    <option value="Son / Daughter">Son / Daughter</option>
                    <option value="Nurse / Caregiver">Nurse / Caregiver</option>
                    <option value="Attending Physician">Attending Physician</option>
                    <option value="Neighbor">Neighbor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah.jenkins@example.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email}</p>}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="primaryCheck"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <label htmlFor="primaryCheck" className="text-slate-300 font-medium cursor-pointer">
                  Designate as Primary Emergency Caregiver Contact
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 shadow-lg"
                >
                  Save Caregiver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
