import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, CheckCircle, Package, Ban, Loader2 } from 'lucide-react';
import api from '../services/api';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  CONFIRMED: { label: 'Confirmed', color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle },
  PREPARING: { label: 'Preparing', color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock },
  READY: { label: 'Ready for Pickup', color: 'text-green-600', bg: 'bg-green-50', icon: Package },
  COMPLETED: { label: 'Completed', color: 'text-gray-600', bg: 'bg-gray-100', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-50', icon: Ban },
};

const filterTabs = ['All', 'Active', 'Completed'];

export default function OrdersPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('All');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await api.get('/orders/user');
        if (res.data?.success) {
          setOrders(res.data.orders);
        }
      } catch (error) {
        console.error("Failed to fetch orders", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => {
    if (tab === 'Active') return ['CONFIRMED', 'PREPARING', 'READY'].includes(o.status);
    if (tab === 'Completed') return o.status === 'COMPLETED';
    return true; // All
  });

  return (
    <div className="min-h-dvh bg-gray-50 pb-nav">
      <div className="sticky top-0 z-30 bg-white px-4 pt-3 pb-0 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
          <h1 className="font-bold text-lg">My Orders</h1>
        </div>
        <div className="flex gap-2 pb-3 overflow-x-auto no-scrollbar">
          {filterTabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-xs font-medium px-4 py-2 rounded-xl whitespace-nowrap transition-all ${tab === t ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
             <Loader2 size={32} className="animate-spin text-orange-400" />
          </div>
        ) : (
          <>
            {filteredOrders.map((order: any) => {
              const sc = statusConfig[order.status] || statusConfig['CONFIRMED'];
              const Icon = sc.icon;
              return (
                <motion.div key={order.id} whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-2xl p-4 shadow-card cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-sm font-semibold">{order.store?.name || 'Local Store'}</p>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full ${sc.bg} ${sc.color}`}>
                      <Icon size={12} /> {sc.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mb-2">
                    {order.items?.map((i: any) => `📦 ${i.product?.name || 'Unknown'} x${i.quantity}`).join(' • ')}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-orange-600">₹{order.totalAmount}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  {/* Timeline for active orders */}
                  {['CONFIRMED', 'PREPARING', 'READY'].includes(order.status) && (
                    <div className="flex items-center gap-0 mt-3">
                      {['CONFIRMED', 'PREPARING', 'READY'].map((step, i) => {
                        const active = ['CONFIRMED', 'PREPARING', 'READY'].indexOf(order.status) >= i;
                        return (
                          <React.Fragment key={step}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] ${active ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                              {i + 1}
                            </div>
                            {i < 2 && <div className={`flex-1 h-0.5 ${active ? 'bg-orange-400' : 'bg-gray-200'}`} />}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              );
            })}
            {filteredOrders.length === 0 && (
              <div className="text-center py-16">
                <span className="text-5xl">📦</span>
                <p className="text-gray-400 mt-4 font-medium">No orders here</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
