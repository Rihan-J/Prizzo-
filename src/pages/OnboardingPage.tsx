import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BarChart3, ShoppingBag, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const slides = [
  { icon: Search, title: 'Discover Nearby', desc: 'Search for groceries, medicines, food, electronics — all from local stores near you.', emoji: '🔍', color: 'from-orange-400 to-orange-600' },
  { icon: BarChart3, title: 'Compare Prices', desc: 'See the same product across multiple stores. Pick the best price, stock, and pickup time.', emoji: '💰', color: 'from-amber-400 to-orange-500' },
  { icon: ShoppingBag, title: 'Reserve & Pickup', desc: 'Add to cart, reserve your order, and pick it up from the store — no waiting!', emoji: '🛍️', color: 'from-orange-500 to-red-500' },
];

export default function OnboardingPage() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const { setOnboardingSeen } = useAuth();

  const finish = () => { setOnboardingSeen(); navigate('/login', { replace: true }); };

  return (
    <div className="h-dvh bg-white flex flex-col">
      <div className="flex justify-end p-4">
        <button onClick={finish} className="text-sm text-gray-400 font-medium hover:text-orange-500 transition-colors">Skip</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }} className="flex flex-col items-center text-center">
            <div className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${slides[current].color} flex items-center justify-center mb-8 shadow-orange`}>
              <span className="text-6xl">{slides[current].emoji}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{slides[current].title}</h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{slides[current].desc}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-8 pb-12">
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-orange-500' : 'w-2 bg-gray-200'}`} />
          ))}
        </div>
        {current < slides.length - 1 ? (
          <button onClick={() => setCurrent(c => c + 1)}
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors">
            Next <ChevronRight size={18} />
          </button>
        ) : (
          <button onClick={finish}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl font-semibold shadow-orange hover:shadow-lg transition-all">
            Get Started
          </button>
        )}
      </div>
    </div>
  );
}
