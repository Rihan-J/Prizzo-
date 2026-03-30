import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Package, ShoppingBag, Bell, AlertTriangle, Clock, CheckCircle, DollarSign, Plus, X, Edit, Trash2, ToggleLeft, ToggleRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const vendorTabs = [
  { id: 'overview', icon: Home, label: 'Overview' },
  { id: 'orders', icon: ShoppingBag, label: 'Orders' },
  { id: 'products', icon: Package, label: 'Products' }
];

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('overview');
  const [hasStore, setHasStore] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStore = async () => {
      try {
        const res = await api.get('/vendor/store');
        if (res.data?.success) setHasStore(true);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setHasStore(false);
        }
      }
    };
    checkStore();
  }, []);

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
        <VendorStoreSetup onCreated={() => setHasStore(true)} />
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
            {tab === 'overview' && <VendorOverview />}
            {tab === 'orders' && <VendorOrders />}
            {tab === 'products' && <VendorProducts />}
          </div>
        </>
      )}
    </div>
  );
}

function VendorOverview() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordRes, prdRes] = await Promise.all([
          api.get('/orders/vendor'),
          api.get('/vendor/products')
        ]);
        if (ordRes.data.success) setOrders(ordRes.data.orders);
        if (prdRes.data.success) setProducts(prdRes.data.products);
      } catch (error) {
        console.error("Failed to fetch overview data", error);
      }
    };
    fetchData();
  }, []);

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

function VendorOrders() {
  const [filter, setFilter] = useState('ALL');
  const [orders, setOrders] = useState<any[]>([]);
  const statusLabels = ['ALL', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/vendor');
      if (res.data?.success) {
        setOrders(res.data.orders);
      }
    } catch (error) {
      console.error("Failed to load orders", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/orders/${id}/status`, { status: newStatus });
      await fetchOrders();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update order status");
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

function VendorProducts() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formBasePrice, setFormBasePrice] = useState('');
  const [formProfitMargin, setFormProfitMargin] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formCategory, setFormCategory] = useState('');

  const fetchProducts = async () => {
    try {
      const res = await api.get('/vendor/products');
      if (res.data?.success) setProducts(res.data.products);
    } catch (error) {
      console.error("Failed to load products", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
      await fetchProducts();
      setShowModal(false);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/vendor/products/${id}`);
      await fetchProducts();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to delete product");
    }
  };

  const toggleStock = async (p: any) => {
    try {
      await api.patch(`/vendor/products/${p.id}`, { isAvailable: !p.isAvailable });
      await fetchProducts();
    } catch (error) {
      console.error("Failed to toggle stock", error);
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

function VendorStoreSetup({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // Hardcode coordinates for simplicity for now, or use geolocation/map
  const lat = 19.0760;
  const lng = 72.8777;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return alert("Please fill all details");
    
    setLoading(true);
    try {
      await api.post('/vendor/store', { 
        name, 
        address, 
        latitude: lat, 
        longitude: lng 
      });
      onCreated();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create store. Request approval first.");
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
        <p className="text-sm text-gray-500 text-center mb-6">You need to create your store profile before you can start selling products.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Store/Pharmacy Name</label>
            <input placeholder="Ex: Apollo Pharmacy" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Store Address</label>
            <textarea placeholder="Full address of your outlet..." value={address} onChange={e => setAddress(e.target.value)} rows={3}
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white py-3.5 rounded-2xl font-semibold transition-colors disabled:opacity-75 disabled:cursor-not-allowed">
            {loading ? 'Setting up...' : 'Create Store'}
          </button>
        </form>
      </div>
    </div>
  );
}
