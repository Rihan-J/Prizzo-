import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, Eye, EyeOff, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signup, setOnboardingSeen } = useAuth();
  
  const [isSignup, setIsSignup] = useState(false);
  const [role, setRole] = useState<'user' | 'vendor'>('user');
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', storeName: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingSeen();
    setLoading(true);
    try {
      if (isSignup) {
        await signup(form.name, form.email, form.password, role.toUpperCase(), role === 'vendor' ? form.storeName : undefined);
      } else {
        await login(form.email, form.password);
      }
      navigate('/', { replace: true });
    } catch (err: any) {
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col md:flex-row">

      {/* ── LEFT PANEL (desktop hero) ── */}
      <div className="hidden md:flex md:w-1/2 lg:w-2/5 bg-gradient-to-br from-orange-500 to-orange-600 flex-col justify-center items-center p-12 relative overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute w-72 h-72 bg-white/10 rounded-full -top-16 -right-16"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          className="absolute w-48 h-48 bg-white/10 rounded-full -bottom-10 -left-10"
        />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 text-center"
        >
          <div className="text-6xl mb-6">🛍️</div>
          <h2 className="text-4xl font-black text-white leading-tight mb-3">
            {isSignup ? 'Join Prizzo' : 'Welcome Back'}
          </h2>
          <p className="text-white/80 text-base max-w-xs">
            {isSignup
              ? 'Discover local stores and amazing deals near you.'
              : 'Sign in to continue exploring local stores and deals.'}
          </p>
        </motion.div>
      </div>

      {/* ── RIGHT PANEL / Mobile full page ── */}
      <div className="flex-1 flex flex-col overflow-y-auto">

        {/* Mobile-only header */}
        <div className="md:hidden bg-gradient-to-br from-orange-500 to-orange-600 px-6 pt-14 pb-10 rounded-b-[2rem] relative overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute w-40 h-40 bg-white/10 rounded-full -top-10 -right-10"
          />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-black text-white">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-white/80 text-sm mt-1">
              {isSignup ? 'Join Prizzo and discover local stores' : 'Sign in to your Prizzo account'}
            </p>
          </motion.div>
        </div>

        {/* Form container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 px-6 md:px-10 lg:px-16 py-8 md:flex md:flex-col md:justify-center md:max-w-lg md:mx-auto md:w-full"
        >
          {/* Desktop-only title */}
          <div className="hidden md:block mb-8">
            <h1 className="text-3xl font-black text-gray-900">
              {isSignup ? 'Create Account' : 'Sign In'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {isSignup ? 'Fill in your details to get started' : 'Enter your credentials to continue'}
            </p>
          </div>

          {/* Role toggle */}
          {isSignup && (
            <div className="bg-gray-100 rounded-2xl p-1 flex mb-6">
              {(['user', 'vendor'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${role === r ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-400'
                    }`}
                >
                  {r === 'user' ? '👤 User' : '🏪 Vendor'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            )}

            {isSignup && role === 'vendor' && (
              <div className="relative">
                <Store size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Your Store Name"
                  required
                  value={form.storeName}
                  onChange={e => setForm({ ...form, storeName: e.target.value })}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            )}

            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="email"
                placeholder="Email address"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {isSignup && (
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            )}

            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                required
                minLength={6}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full pl-11 pr-11 py-3.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-70"
            >
              {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6 mb-2">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-orange-500 font-semibold"
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}