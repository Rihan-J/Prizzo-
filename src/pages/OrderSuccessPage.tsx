import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Home, ShoppingBag } from 'lucide-react';

export default function OrderSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { orderId: string; storeName: string; pickupTime: string; total: number; items: number } | null;

  return (
    <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-8">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircle size={48} className="text-green-500" />
      </motion.div>

      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="text-2xl font-bold text-center">Order Placed! 🎉</motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="text-gray-400 text-sm mt-2 text-center">Your order has been confirmed and is being prepared.</motion.p>

      {state && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="bg-orange-50 rounded-2xl p-5 mt-6 w-full space-y-3">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Order ID</span><span className="font-bold text-orange-600">#{state.orderId}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Store</span><span className="font-medium">{state.storeName}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Pickup Time</span><span className="font-medium">{state.pickupTime}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Total</span><span className="font-bold text-orange-600">₹{state.total}</span></div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        className="flex gap-3 mt-8 w-full">
        <button onClick={() => navigate('/orders')}
          className="flex-1 bg-orange-500 text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2">
          <ShoppingBag size={18} /> Track Order
        </button>
        <button onClick={() => navigate('/')}
          className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2">
          <Home size={18} /> Home
        </button>
      </motion.div>
    </div>
  );
}
