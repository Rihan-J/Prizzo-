import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Globe, Shield, Download, Moon, HelpCircle } from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [notif, setNotif] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("PWA installation is either already complete, or your browser requires you to install it manually from the Share/Menu options (like in Safari on iOS).");
    }
  };

  return (
    <div className="min-h-dvh bg-gray-50 pb-nav">
      <div className="sticky top-0 z-30 bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 className="font-bold text-lg">Settings</h1>
      </div>
      <div className="px-4 mt-4 space-y-3">
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <ToggleItem icon={Moon} label="Dark Mode" sublabel="Use dark theme" value={darkMode} onChange={setDarkMode} />
          <ToggleItem icon={Bell} label="Notifications" sublabel="Push and in-app alerts" value={notif} onChange={setNotif} />
        </div>

        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <MenuItem icon={Shield} label="Privacy Settings" sublabel="Manage permissions" />
          <MenuItem icon={HelpCircle} label="Support" sublabel="Get help from our team" onClick={() => navigate('/help')} />
        </div>

        <div className="bg-white rounded-2xl shadow-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <Download size={18} className="text-orange-500" />
            <div>
              <p className="text-sm font-semibold">Install Prizzo App</p>
              <p className="text-xs text-gray-400">Add to home screen for app-like experience</p>
            </div>
          </div>
          <button 
            onClick={handleInstallClick}
            className={`w-full py-3 rounded-xl text-sm font-semibold mt-2 transition-colors ${deferredPrompt ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}`}
          >
            {deferredPrompt ? 'Install App Now' : 'Installed / Check Browser Menu'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-300 mt-4">Prizzo v1.0.0</p>
      </div>
    </div>
  );
}

function ToggleItem({ icon: Icon, label, sublabel, value, onChange }: { icon: any; label: string; sublabel: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="px-4 py-3.5 flex items-center gap-3 border-b border-gray-50 last:border-0">
      <Icon size={18} className="text-gray-400" />
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-400">{sublabel}</p>
      </div>
      <button onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full flex items-center px-0.5 transition-colors ${value ? 'bg-orange-500' : 'bg-gray-200'}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function MenuItem({ icon: Icon, label, sublabel, onClick }: { icon: any; label: string; sublabel: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full px-4 py-3.5 flex items-center gap-3 border-b border-gray-50 last:border-0 hover:bg-gray-50">
      <Icon size={18} className="text-gray-400" />
      <div className="flex-1 text-left">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-400">{sublabel}</p>
      </div>
    </button>
  );
}
