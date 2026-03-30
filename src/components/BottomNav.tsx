import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, Heart, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/wishlist', icon: Heart, label: 'Wishlist' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const { totalItems } = useCart();
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const hideOn = ['/splash', '/onboarding', '/login', '/signup'];
  
  if (hideOn.some(p => location.pathname.startsWith(p))) return null;
  if (isAdmin || user?.role === 'VENDOR') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-lg border-t border-gray-100 z-50 safe-bottom">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} className="relative flex flex-col items-center gap-0.5 px-3 py-1">
              <div className="relative">
                <Icon size={22} className={isActive ? 'text-orange-500' : 'text-gray-400'} strokeWidth={isActive ? 2.5 : 1.8} />
                {label === 'Orders' && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-orange-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{totalItems}</span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-orange-500' : 'text-gray-400'}`}>{t(label)}</span>
              {isActive && (
                <motion.div layoutId="nav-dot" className="absolute -top-0.5 w-1 h-1 rounded-full bg-orange-500" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
