import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

// TODO: Implement backend GET /notifications endpoint.
// When ready, fetch notifications from the API instead of showing an empty state.

interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'order' | 'offer' | 'stock' | 'deal' | 'reminder' | 'recommendation';
  read: boolean;
  emoji: string;
  actionUrl?: string;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        // TODO: Replace with real API call when backend endpoint is ready
        // const res = await api.get('/notifications');
        // const data = res.data?.data || res.data;
        // if (data?.notifications) setNotifications(data.notifications);
        setNotifications([]);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-dvh bg-gray-50 pb-nav">
      <div className="sticky top-0 z-30 bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
          <h1 className="font-bold text-lg">Notifications</h1>
        </div>
        {unread > 0 && <span className="bg-orange-100 text-orange-600 text-xs px-3 py-1 rounded-full font-medium">{unread} new</span>}
      </div>
      <div className="px-4 mt-4 space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
            <Loader2 size={32} className="animate-spin text-orange-400" />
            <p className="text-sm">Loading notifications…</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <span className="text-5xl">⚠️</span>
            <p className="text-gray-500 mt-4 font-medium">{error}</p>
            <p className="text-xs text-gray-400 mt-1">Please try again later</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl">🔔</span>
            <p className="text-gray-500 mt-4 font-medium">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">We'll notify you when something important happens</p>
          </div>
        ) : (
          notifications.map((n, i) => (
            <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => n.actionUrl && navigate(n.actionUrl)}
              className={`bg-white rounded-2xl p-4 shadow-card cursor-pointer flex gap-3 ${!n.read ? 'border-l-4 border-orange-400' : ''}`}>
              <span className="text-2xl">{n.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{n.time}</p>
              </div>
              {!n.read && <div className="w-2 h-2 bg-orange-500 rounded-full mt-1 flex-shrink-0" />}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
