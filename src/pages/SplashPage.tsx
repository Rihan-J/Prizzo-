import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function SplashPage() {
  const navigate = useNavigate();
  const { hasSeenOnboarding, isLoggedIn } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoggedIn) navigate('/', { replace: true });
      else if (hasSeenOnboarding) navigate('/login', { replace: true });
      else navigate('/onboarding', { replace: true });
    }, 2200);
    return () => clearTimeout(timer);
  }, [navigate, hasSeenOnboarding, isLoggedIn]);

  return (
    <div className="h-dvh bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background circles */}
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 3, repeat: Infinity }}
        className="absolute w-80 h-80 rounded-full bg-white/10 -top-20 -right-20" />
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }} transition={{ duration: 4, repeat: Infinity }}
        className="absolute w-60 h-60 rounded-full bg-white/10 -bottom-10 -left-10" />

      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-float mb-6">
        <span className="text-5xl">🛍️</span>
      </motion.div>

      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="text-4xl font-black text-white tracking-tight">Prizzo</motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
        className="text-white/80 text-sm mt-2 font-medium">Find it nearby. Pick it smart.</motion.p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
        className="mt-12 flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div key={i} animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
            className="w-2 h-2 rounded-full bg-white/60" />
        ))}
      </motion.div>
    </div>
  );
}
