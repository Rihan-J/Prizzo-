import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Package, ShoppingBag, Bell, AlertTriangle, Clock, DollarSign, Plus, X, Edit, Trash2, ToggleLeft, ToggleRight, TrendingUp, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useNewOrderAlerts } from '../hooks/useSocket';

const vendorTabs = [
  { id: 'overview', icon: Home, label: 'Overview' },
  { id: 'orders', icon: ShoppingBag, label: 'Orders' },
  { id: 'products', icon: Package, label: 'Products' }
];

// URL for a loud, repetitive notification sound (Service Bell)
const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; 

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('overview');
  const [hasStore, setHasStore] = useState<boolean | null>(null);

  // ── Shared state ──
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // ── Incoming Order Alert State ──
  const [incomingOrder, setIncomingOrder] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('prizzo_token') : null;

  const fetchSharedData = useCallback(async (silent = false) => {
    try {
      if (!silent) setDataLoading(true);
      const storeRes = await api.get('/vendor/store');
      const storeData = storeRes.data?.data || storeRes.data;
      if (storeData?.store) {
        setHasStore(true);
        setStoreId(storeData.store.id);

        const [ordRes, prdRes] = await Promise.all([
          api.get('/orders/vendor?limit=50'),
          api.get('/vendor/products')
        ]);
        const ordData = ordRes.data?.data || ordRes.data;
        const prdData = prdRes.data?.data || prdRes.data;
        if (ordData?.orders) setOrders(ordData.orders);
        if (prdData?.products) setProducts(prdData.products);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setHasStore(false);
      }
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSharedData();
    
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [fetchSharedData]);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.loop = true;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.warn("Audio play blocked by browser:", e));
    }
  };

  const stopNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // ── Socket.IO: Real-time new order alerts ──
  useNewOrderAlerts(token, storeId, (data) => {
    console.log("🚀 New Order Received:", data);
    setIncomingOrder(data);
    playNotificationSound();
    fetchSharedData(true); // Silent refresh

    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🚀 New Prizzo Order!", {
        body: `New order #${data.orderId.substring(0,8).toUpperCase()} for ₹${data.totalAmount}`,
        icon: "/icons/favicon.svg",
        tag: "new-order",
        renotify: true
      });
    }
  });

  const handleAcceptOrder = () => {
    stopNotificationSound();
    setIncomingOrder(null);
    setTab('orders'); // Switch to orders tab
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-dvh bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 px-4 pt-5 pb-5 rounded-b-[1.5rem] relative overflow-hidden">
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 6, repeat: Infinity }}
          className="absolute w-40 h-40 bg-white/5 rounded-full -top-12 -right-8" />
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div>
            <p className="text-gray-400 text-xs">Vendor Dashboard</p>
            <h1 className="text-white font-bold text-lg">{user?.name}'s Store 🏪</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="bg-red-500/20 text-red-100 text-xs px-3 py-1.5 rounded-xl font-medium">
              Log out
            </button>
            <button onClick={() => navigate('/notifications')} className="bg-white/10 p-2 rounded-xl">
              <Bell size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {hasStore === false ? (
        <VendorStoreSetup onCreated={() => fetchSharedData()} />
      ) : (
        <>
          {/* Vendor Nav */}
          <div className="px-4 -mt-5 relative z-10">
            <div className="bg-white rounded-2xl shadow-card p-1 flex">
              {vendorTabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl transition-all text-xs font-medium ${tab === t.id ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>
                  <t.icon size={16} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 mt-5">
            {tab === 'overview' && <VendorOverview orders={orders} products={products} loading={dataLoading} />}
            {tab === 'orders' && <VendorOrders orders={orders} onRefresh={fetchSharedData} />}
            {tab === 'products' && <VendorProducts products={products} onRefresh={fetchSharedData} />}
          </div>
        </>
      )}

      {/* ── Real-time Incoming Order Alert Modal (Swiggy Style) ── */}
      <AnimatePresence>
        {incomingOrder && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center px-6"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl relative"
            >
              {/* Pulsing Background for Urgency */}
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 bg-orange-500 pointer-events-none"
              />

              <div className="p-8 text-center relative z-10">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                  >
                    <ShoppingBag size={40} className="text-orange-600" />
                  </motion.div>
                </div>

                <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">New Order! 🚀</h2>
                <p className="text-gray-500 text-sm mb-6 font-medium">Customer is waiting for your response</p>

                <div className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Order ID</span>
                    <span className="text-sm font-mono font-bold text-gray-800">#{incomingOrder.orderId.substring(0,8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Amount</span>
                    <span className="text-xl font-black text-orange-600">₹{incomingOrder.totalAmount}</span>
                  </div>
                </div>

                <button 
                  onClick={handleAcceptOrder}
                  className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-3"
                >
                  <CheckCircle size={24} />
                  Accept & View
                </button>
                
                <button 
                  onClick={() => { stopNotificationSound(); setIncomingOrder(null); }}
                  className="mt-4 text-gray-400 text-sm font-semibold hover:text-gray-600 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VendorOverview({ orders, products }: { orders: any[]; products: any[]; loading: boolean }) {
  const todaysOrders = orders.slice(0, 5);
  const totalSales = orders
    .filter(o => o.status === 'COMPLETED' || o.status === 'READY')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  
  const totalEarnings = orders
    .filter(o => o.status === 'COMPLETED' || o.status === 'READY')
    .reduce((sum, o) => sum + (o.vendorEarnings || 0), 0);

  const stats = [
    { label: "Total Sales", value: `₹${totalSales.toLocaleString()}`, icon: TrendingUp, color: 'bg-orange-50 text-orange-600' },
    { label: 'Net Earnings', value: `₹${totalEarnings.toLocaleString()}`, icon: DollarSign, color: 'bg-green-50 text-green-600' },
    { label: 'Out of Stock', value: products.filter(p => p.stock === 0).length, icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
    { label: 'Pending Orders', value: orders.filter(o => o.status === 'CONFIRMED' || o.status === 'PREPARING').length, icon: Clock, color: 'bg-blue-50 text-blue-600' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${s.color}`}><s.icon size={18} /></div>
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3">🕐 Recent Orders</h3>
        <div className="space-y-2">
          {todaysOrders.length === 0 && <p className="text-sm text-gray-500 text-center py-4 bg-white rounded-xl">No recent orders.</p>}
          {todaysOrders.map(o => (
            <div key={o.id} className="bg-white rounded-xl p-3 shadow-card flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">#{o.id.substring(0,6).toUpperCase()}</p>
                <p className="text-xs text-gray-400">{o.items?.length || 0} items · ₹{o.totalAmount}</p>
              </div>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${o.status === 'READY' ? 'bg-green-100 text-green-700' : o.status === 'PREPARING' ? 'bg-orange-100 text-orange-700' : o.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                {o.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3">⚠️ Low Stock Alerts</h3>
        <div className="space-y-2">
          {products.filter(p => p.stock < 10 && p.stock > 0).slice(0, 3).map(p => (
            <div key={p.id} className="bg-red-50 rounded-xl p-3 flex items-center gap-3 border border-red-100">
              <span className="text-xl">📦</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-red-500">Only {p.stock} left</p>
              </div>
            </div>
          ))}
          {products.filter(p => p.stock < 10 && p.stock > 0).length === 0 && (
             <p className="text-sm text-gray-500 text-center py-4 bg-white rounded-xl">Stock levels are good.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function VendorOrders({ orders, onRefresh }: { orders: any[]; onRefresh: () => void }) {
  const [filter, setFilter] = useState('ALL');
  const statusLabels = ['ALL', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/orders/${id}/status`, { status: newStatus });
      await onRefresh();
    } catch (error: any) {
      alert(error.response?.data?.error || error.response?.data?.message || "Failed to update order status");
    }
  };

  const filtered = orders.filter(o => filter === 'ALL' || o.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {statusLabels.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs font-medium px-4 py-2 rounded-xl whitespace-nowrap ${filter === s ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 shadow-card'}`}>
            {s}
          </button>
        ))}
      </div>
      
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-card text-center text-gray-500 text-sm">
          No {filter !== 'ALL' ? filter.toLowerCase() : ''} orders found.
        </div>
      )}
      
      {filtered.map((o: any) => (
        <div key={o.id} className="bg-white rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-semibold text-sm">#{o.id.substring(0,8).toUpperCase()}</p>
              <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleString()}</p>
            </div>
            <span className="text-sm font-bold text-orange-600">₹{o.totalAmount}</span>
          </div>
          <div className="text-xs text-gray-500 mb-3">
            {o.items?.map((i: any) => `📦 ${i.product?.name || 'Unknown'} x${i.quantity}`).join(' · ')}
          </div>
          
          <div className="flex gap-2">
            {o.status === 'CONFIRMED' && <button onClick={() => updateStatus(o.id, 'PREPARING')} className="flex-1 bg-orange-500 text-white py-2 rounded-xl text-xs font-semibold">Start Preparing</button>}
            {o.status === 'PREPARING' && <button onClick={() => updateStatus(o.id, 'READY')} className="flex-1 bg-green-500 text-white py-2 rounded-xl text-xs font-semibold">Mark Ready</button>}
            {o.status === 'READY' && <button onClick={() => updateStatus(o.id, 'COMPLETED')} className="flex-1 bg-blue-500 text-white py-2 rounded-xl text-xs font-semibold">Mark Completed</button>}
            {o.status === 'COMPLETED' && <button disabled className="flex-1 bg-gray-100 text-gray-400 py-2 rounded-xl text-xs font-semibold">Completed</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

function VendorProducts({ products, onRefresh }: { products: any[]; onRefresh: () => void }) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formBasePrice, setFormBasePrice] = useState('');
  const [formProfitMargin, setFormProfitMargin] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formCategory, setFormCategory] = useState('');

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => {
    setEditingProduct(null);
    setFormName(''); setFormDesc(''); setFormBasePrice(''); setFormProfitMargin(''); setFormStock(''); setFormCategory('grocery');
    setShowModal(true);
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDesc(product.description || '');
    setFormBasePrice(String(product.basePrice || 0));
    setFormProfitMargin(String(product.profitMargin || 0));
    setFormStock(String(product.stock));
    setFormCategory(product.category || 'grocery');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formBasePrice.trim()) return;

    try {
      const payload = {
        name: formName,
        description: formDesc,
        basePrice: Number(formBasePrice),
        profitMargin: Number(formProfitMargin) || 0,
        stock: Number(formStock) || 0,
        category: formCategory.toLowerCase() || 'grocery',
        isAvailable: (Number(formStock) || 0) > 0
      };

      if (editingProduct) {
        await api.patch(`/vendor/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/vendor/products', payload);
      }
      await onRefresh();
      setShowModal(false);
    } catch (error: any) {
      alert(error.response?.data?.error || error.response?.data?.message || "Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/vendor/products/${id}`);
      await onRefresh();
    } catch (error: any) {
      alert(error.response?.data?.error || error.response?.data?.message || "Failed to delete product");
    }
  };

  const toggleStock = async (p: any) => {
    try {
      await api.patch(`/vendor/products/${p.id}`, { isAvailable: !p.isAvailable });
      await onRefresh();
    } catch (error: any) {
      console.error("Failed to toggle stock", error);
      alert(error.response?.data?.error || error.response?.data?.message || "Failed to toggle stock");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input type="text" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-white rounded-xl px-4 py-2.5 text-sm outline-none shadow-card" />
        <button onClick={openAdd} className="bg-orange-500 text-white p-2.5 rounded-xl"><Plus size={18} /></button>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-card text-center text-gray-500 text-sm">
            No products found. Click + to add one.
          </div>
        )}
        {filtered.map(p => (
          <div key={p.id} className={`bg-white rounded-xl p-3 shadow-card flex items-center gap-3 ${!p.isAvailable && 'opacity-60'}`}>
            <span className="text-2xl">📦</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{p.name}</p>
              <p className="text-xs text-gray-400">₹{p.price} · Stock: {p.stock}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {p.isAvailable ? 'Active' : 'Off'}
            </span>
            <button onClick={() => toggleStock(p)} className="text-gray-300 hover:text-blue-500">
              {p.isAvailable ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} className="text-gray-400" />}
            </button>
            <button onClick={() => openEdit(p)} className="text-gray-300 hover:text-orange-500"><Edit size={14} /></button>
            <button onClick={() => handleDelete(p.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      {/* Add / Edit product modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-t-3xl p-6 w-full max-w-lg space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
                <button onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>

              <input placeholder="Product name" value={formName} onChange={e => setFormName(e.target.value)}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400" />
              <input placeholder="Short Description" value={formDesc} onChange={e => setFormDesc(e.target.value)}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400" />
                
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 mb-1 block">Base Price (₹)</label>
                  <input placeholder="Ex: 100" type="number" value={formBasePrice} onChange={e => setFormBasePrice(e.target.value)}
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div className="w-28">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 mb-1 block">Margin (%)</label>
                  <input placeholder="Ex: 20" type="number" value={formProfitMargin} onChange={e => setFormProfitMargin(e.target.value)}
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div className="w-24">
                  <label className="text-[10px] text-gray-500 uppercase font-bold ml-1 mb-1 block">Stock</label>
                  <input placeholder="Qty" type="number" value={formStock} onChange={e => setFormStock(e.target.value)}
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>
              
              {Number(formBasePrice) > 0 && (
                <div className="bg-orange-50 text-orange-700 px-4 py-2.5 rounded-xl text-xs font-medium flex justify-between items-center border border-orange-100">
                  <span>Customer will see:</span>
                  <span className="font-bold text-sm">
                    ₹{((Number(formBasePrice) || 0) + ((Number(formBasePrice) || 0) * (Number(formProfitMargin) || 0) / 100)).toFixed(2)}
                  </span>
                </div>
              )}

              <input placeholder="Category (e.g. food, grocery, medicine)" value={formCategory} onChange={e => setFormCategory(e.target.value)}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400" />
              <button onClick={handleSave}
                disabled={!formName.trim() || !formBasePrice.trim()}
                className="w-full bg-orange-500 text-white py-3.5 rounded-2xl font-semibold disabled:bg-gray-300 disabled:text-gray-500 transition-colors">
                {editingProduct ? 'Save Changes' : 'Add Product'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Store Setup with Map Location Picker ──────────────────────────────────────
function VendorStoreSetup({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Please enter store name.");
    if (!address.trim()) return alert("Please pick a location or enter address.");
    if (!lat || !lng) return alert("Please pick your store location on the map.");

    setLoading(true);
    try {
      await api.post('/vendor/store', {
        name,
        address,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
      });
      onCreated();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create store.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 mt-8">
      <div className="bg-white rounded-3xl p-6 shadow-card border border-orange-100">
        <div className="bg-orange-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🏬</span>
        </div>
        <h2 className="text-xl font-bold text-center text-gray-900 mb-2">Set Up Your Store</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Create your store profile to start selling products.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Store/Pharmacy Name</label>
            <input placeholder="Ex: Apollo Pharmacy" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400" />
          </div>

          {/* Map Location Picker */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Store Location</label>
            <button type="button" onClick={() => setShowMapPicker(true)}
              className="w-full bg-orange-50 border-2 border-dashed border-orange-200 text-orange-600 py-4 rounded-2xl text-sm font-medium hover:bg-orange-100 transition-colors flex items-center justify-center gap-2">
              {lat && lng ? '🗺️ Change Location on Map' : '📍 Pick Location on Map'}
            </button>
            {lat && lng && (
              <div className="mt-2 bg-green-50 text-green-700 text-xs px-3 py-2 rounded-lg flex items-center gap-1 font-medium">
                ✅ Location set: {lat}, {lng}
              </div>
            )}
          </div>

          {/* Address — auto-filled from map pick, editable */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Store Address</label>
            <textarea
              placeholder={lat ? "Address auto-filled from map. You can edit it." : "Pick a location on the map first, or type manually..."}
              value={address} onChange={e => setAddress(e.target.value)} rows={2}
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
          </div>

          <button type="submit" disabled={loading || !name.trim() || !address.trim() || !lat || !lng}
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white py-3.5 rounded-2xl font-semibold transition-colors disabled:opacity-75 disabled:cursor-not-allowed">
            {loading ? 'Setting up...' : 'Create Store'}
          </button>
        </form>
      </div>

      {showMapPicker && (
        <MapLocationPicker
          initialLat={lat ? parseFloat(lat) : undefined}
          initialLng={lng ? parseFloat(lng) : undefined}
          onPick={(pLat, pLng, pAddr) => {
            setLat(pLat.toFixed(6));
            setLng(pLng.toFixed(6));
            if (pAddr) setAddress(pAddr);
            setShowMapPicker(false);
          }}
          onClose={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
}

// ─── Embedded Leaflet Map Picker (OpenStreetMap + Nominatim Reverse Geocoding) ──
function MapLocationPicker({ initialLat, initialLng, onPick, onClose }: {
  initialLat?: number; initialLng?: number;
  onPick: (lat: number, lng: number, address: string) => void;
  onClose: () => void;
}) {
  const mapDivRef = React.useRef<HTMLDivElement>(null);
  const mapObjRef = React.useRef<any>(null);
  const markerObjRef = React.useRef<any>(null);
  const [selLat, setSelLat] = useState(initialLat ?? 20.5937);
  const [selLng, setSelLng] = useState(initialLng ?? 78.9629);
  const [addr, setAddr] = useState('');
  const [isReversing, setIsReversing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [hasSelection, setHasSelection] = useState(!!initialLat);

  // Reverse geocode using free Nominatim API (OpenStreetMap)
  const doReverse = async (la: number, lo: number) => {
    setIsReversing(true);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${la}&lon=${lo}&format=json&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const d = await r.json();
      if (d.display_name) setAddr(d.display_name);
    } catch {
      // Silent fail — user can type address manually
    } finally {
      setIsReversing(false);
    }
  };

  // Place or move marker on the map
  const putMarker = (L: any, map: any, la: number, lo: number) => {
    if (markerObjRef.current) map.removeLayer(markerObjRef.current);
    const ic = L.divIcon({
      html: `<div style="background:#f97316;width:40px;height:40px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:18px;">🏪</span></div>`,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });
    markerObjRef.current = L.marker([la, lo], { icon: ic }).addTo(map);
    setSelLat(la);
    setSelLng(lo);
    setHasSelection(true);
    doReverse(la, lo);
  };

  // Load Leaflet and initialize map
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      // Load Leaflet CSS
      if (!document.getElementById('lf-css-pk')) {
        const lk = document.createElement('link');
        lk.id = 'lf-css-pk'; lk.rel = 'stylesheet';
        lk.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(lk);
      }
      // Load Leaflet JS if not already loaded
      if (!(window as any).L) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          s.onload = () => res();
          s.onerror = () => rej();
          document.head.appendChild(s);
        });
      }
      if (!mounted || !mapDivRef.current || mapObjRef.current) return;

      const L = (window as any).L;
      const zoom = initialLat ? 15 : 5;
      const map = L.map(mapDivRef.current).setView(
        [initialLat ?? 20.5937, initialLng ?? 78.9629], zoom
      );
      mapObjRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Place initial marker if we have coordinates
      if (initialLat && initialLng) {
        putMarker(L, map, initialLat, initialLng);
      }

      // Click anywhere on map to place/move marker
      map.on('click', (e: any) => {
        putMarker(L, map, e.latlng.lat, e.latlng.lng);
      });
    };
    init();
    return () => {
      mounted = false;
      if (mapObjRef.current) {
        mapObjRef.current.remove();
        mapObjRef.current = null;
      }
    };
  }, []);

  // "Go to My Location" — center map on GPS position
  const goToMyLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const L = (window as any).L;
        const map = mapObjRef.current;
        if (map && L) {
          map.setView([pos.coords.latitude, pos.coords.longitude], 16);
          putMarker(L, map, pos.coords.latitude, pos.coords.longitude);
        }
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl"
        style={{ height: '85vh', maxHeight: '700px', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-base">📍 Pick Store Location</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tap anywhere on the map to set your store</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-lg">✕</button>
        </div>

        {/* Controls */}
        <div className="px-4 py-2 flex items-center justify-between bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <button type="button" onClick={goToMyLocation} disabled={isLocating}
            className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 disabled:opacity-50 flex items-center gap-1">
            {isLocating ? (
              <><span className="animate-spin inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full" /> Finding...</>
            ) : (
              <>🎯 Go to My Location</>
            )}
          </button>
          {isReversing && <span className="text-xs text-gray-400">🔄 Getting address...</span>}
        </div>

        {/* Map container */}
        <div ref={mapDivRef} className="w-full flex-1" />

        {/* Bottom bar — selected address + confirm */}
        <div className="px-5 py-3 border-t border-gray-100 bg-white flex-shrink-0">
          {addr ? (
            <p className="text-xs text-gray-600 mb-2 leading-relaxed" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              📍 {addr}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mb-2">Tap on the map to select your store location</p>
          )}
          <button
            onClick={() => onPick(selLat, selLng, addr)}
            disabled={!hasSelection}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Confirm This Location
          </button>
        </div>
      </div>
    </div>
  );
}

