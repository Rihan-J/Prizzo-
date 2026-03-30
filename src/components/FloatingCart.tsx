import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function FloatingCart() {
  const { totalItems, subtotal } = useCart();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  if (isAdmin) return null;

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <>
          {collapsed ? (
            /* Tiny floating button */
            <motion.button
              key="mini"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              onClick={() => setCollapsed(false)}
              className="fixed bottom-24 right-4 z-40 w-12 h-12 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center"
            >
              <ShoppingCart size={20} />
              <span className="absolute -top-1 -right-1 bg-white text-orange-600 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                {totalItems}
              </span>
            </motion.button>
          ) : (
            /* Full expanded bar — responsive */
            <motion.div
              key="full"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed bottom-20 left-4 right-4 mx-auto z-40 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl px-4 py-3 flex items-center gap-2 shadow-orange max-w-xl"
            >
              <button onClick={() => navigate('/cart')} className="flex items-center gap-2 flex-1 min-w-0">
                <div className="bg-white/20 rounded-xl p-2 flex-shrink-0">
                  <ShoppingCart size={18} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold">{totalItems} item{totalItems > 1 ? 's' : ''}</p>
                  <p className="text-[11px] opacity-80">View cart</p>
                </div>
                <p className="text-base font-bold flex-shrink-0">₹{subtotal}</p>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCollapsed(true); }}
                className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-xs font-bold"
              >
                ✕
              </button>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
