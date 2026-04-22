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
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-[#f0ede9] z-50 safe-bottom">
      <div className="flex items-center justify-around py-3">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} className="relative flex flex-col items-center gap-1 min-w-[64px]">
              <div className="relative">
                <Icon size={24} className={isActive ? 'text-[#FF6A00]' : 'text-[#8e8e8e]'} strokeWidth={1.5} />
                {label === 'Orders' && totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FF6A00] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">{totalItems}</span>
                )}
              </div>
              <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'text-[#FF6A00]' : 'text-[#8e8e8e]'}`}>{t(label)}</span>
              {isActive && (
                <motion.div 
                  layoutId="nav-indicator" 
                  className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#FF6A00]" 
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }} 
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
