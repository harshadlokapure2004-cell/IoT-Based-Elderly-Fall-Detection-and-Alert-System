import React from 'react';
import { 
  Activity, ShieldAlert, Users, Bell, Cpu, Settings, 
  FileCheck, LayoutDashboard, Wifi, WifiOff, CpuIcon
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isConnected: boolean;
  activeEmergencyCount: number;
  isSimulated: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isConnected,
  activeEmergencyCount,
  isSimulated,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Live Monitoring', icon: Activity },
    { id: 'events', label: 'Fall Events', icon: ShieldAlert, badge: activeEmergencyCount },
    { id: 'caregivers', label: 'Caregivers', icon: Users },
    { id: 'alerts', label: 'Alerts & Logs', icon: Bell },
    { id: 'devices', label: 'Device Manager', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'reports', label: 'Testing & Reports', icon: FileCheck },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">GuardianPulse</span>
                <span className="text-xs bg-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
                  IoT Fall Guard v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">Elderly Fall Detection & Emergency System</p>
            </div>
          </div>

          {/* System Status Indicators */}
          <div className="flex items-center space-x-4">
            {/* Real vs Simulated Badge */}
            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300">
              <CpuIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Mode:</span>
              <span className={isSimulated ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                {isSimulated ? 'Simulated Sensor' : 'ESP32 Hardware'}
              </span>
            </div>

            {/* WebSocket Connection Badge */}
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700">
              {isConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Live Backend Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto no-scrollbar py-2 border-t border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs font-bold bg-rose-600 text-white rounded-full animate-bounce">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
