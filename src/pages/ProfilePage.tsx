import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, LogOut, Heart, MapPin, CreditCard, ShoppingBag, HelpCircle, Settings, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { icon: ShoppingBag, label: 'My Orders', path: '/orders' },
  { icon: Heart, label: 'Wishlist', path: '/wishlist' },
  { icon: MapPin, label: 'Saved Addresses', path: '#' },
  { icon: CreditCard, label: 'Payment Methods', path: '#' },
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: HelpCircle, label: 'Help & Support', path: '/help' },
  { icon: Info, label: 'About Prizzo', path: '#' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <div className="min-h-dvh bg-gray-50 pb-nav">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-5 pt-10 pb-8 rounded-b-[1.5rem] relative overflow-hidden">
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 6, repeat: Infinity }}
          className="absolute w-40 h-40 bg-white/5 rounded-full -top-10 -right-10" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white backdrop-blur-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{user?.name || 'Guest'}</h1>
            <p className="text-white/70 text-sm">{user?.email || 'guest@prizzo.app'}</p>
            {user?.phone && <p className="text-white/60 text-xs mt-0.5">{user.phone}</p>}
          </div>
        </div>
        <button className="mt-4 bg-white/15 text-white text-xs px-4 py-2 rounded-xl font-medium backdrop-blur-sm">
          Edit Profile
        </button>
      </div>

      <div className="px-4 -mt-4 relative z-10">


        {/* Menu */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {menuItems.map((item, i) => (
            <button key={i} onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
              <item.icon size={18} className="text-gray-400" />
              <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
              <ChevronRight size={14} className="text-gray-300" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full mt-4 bg-white rounded-2xl shadow-card px-4 py-3.5 flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors">
          <LogOut size={18} />
          <span className="text-sm font-medium">Logout</span>
        </button>

        <p className="text-center text-xs text-gray-300 mt-6 mb-4">Prizzo v1.0.0 · Made with ❤️ in India</p>
      </div>
    </div>
  );
}
