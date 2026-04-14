import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Store, Package, ShoppingBag,
  CheckCircle, XCircle, Ban, Shield, LogOut, Loader2,
  DollarSign, AlertTriangle, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ─── Types ──────────────────────────────────────────────────────────────────────
interface DashboardStats {
  totalUsers: number;
  totalVendors: number;
  pendingVendors: number;
  blockedVendors: number;
  totalStores: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  totalVendorEarnings: number;
  commissionPercentage: number;
}

interface VendorData {
  id: string;
  storeName: string;
  isVerified: boolean;
  isBlocked: boolean;
  user: { id: string; name: string; email: string; createdAt: string };
  store?: { id: string; name: string; address: string } | null;
}

// ─── Tabs ───────────────────────────────────────────────────────────────────────
const adminTabs = [
  { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'vendors', icon: Users, label: 'Vendors' },
  { id: 'stores', icon: Store, label: 'Stores' },
  { id: 'products', icon: Package, label: 'Products' },
  { id: 'orders', icon: ShoppingBag, label: 'Orders' },
];

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('overview');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-dvh bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 px-4 pt-5 pb-6 rounded-b-[1.5rem] relative overflow-hidden">
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 6, repeat: Infinity }}
          className="absolute w-40 h-40 bg-white/5 rounded-full -top-12 -right-8" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} className="text-yellow-300" />
              <p className="text-indigo-200 text-xs font-medium">Admin Panel</p>
            </div>
            <h1 className="text-white font-bold text-lg">{user?.name || 'Admin'}</h1>
          </div>
          <button onClick={handleLogout}
            className="bg-red-500/20 text-red-100 text-xs px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 hover:bg-red-500/30 transition-colors">
            <LogOut size={12} /> Log out
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 mt-5">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'vendors' && <VendorsTab />}
        {tab === 'stores' && <StoresTab />}
        {tab === 'products' && <ProductsTab />}
        {tab === 'orders' && <OrdersTab />}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-lg border-t border-gray-100 z-50 safe-bottom">
        <div className="flex items-center justify-around py-2">
          {adminTabs.map(t => {
            const isActive = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="relative flex flex-col items-center gap-0.5 px-3 py-1">
                <t.icon size={22}
                  className={isActive ? 'text-indigo-600' : 'text-gray-400'}
                  strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {t.label}
                </span>
                {isActive && (
                  <motion.div layoutId="admin-nav-dot"
                    className="absolute -top-0.5 w-1 h-1 rounded-full bg-indigo-600"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}


// ─── Overview Tab ───────────────────────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        const responseData = res.data?.data || res.data;
        if (res.data?.success) setStats(responseData.stats);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <ErrorMessage message="Failed to load dashboard stats." />;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
    { label: 'Total Vendors', value: stats.totalVendors, icon: Users, color: 'bg-purple-50 text-purple-600', border: 'border-purple-100' },
    { label: 'Pending Approval', value: stats.pendingVendors, icon: AlertTriangle, color: 'bg-amber-50 text-amber-600', border: 'border-amber-100' },
    { label: 'Blocked Vendors', value: stats.blockedVendors, icon: Ban, color: 'bg-red-50 text-red-600', border: 'border-red-100' },
    { label: 'Total Stores', value: stats.totalStores, icon: Store, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
    { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'bg-cyan-50 text-cyan-600', border: 'border-cyan-100' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'bg-orange-50 text-orange-600', border: 'border-orange-100' },
    { label: 'Platform Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-green-50 text-green-600', border: 'border-green-100' },
    { label: 'Commission Earned', value: `₹${stats.totalCommission.toLocaleString()}`, icon: DollarSign, color: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-100' },
    { label: 'Vendor Payouts', value: `₹${stats.totalVendorEarnings.toLocaleString()}`, icon: DollarSign, color: 'bg-orange-50 text-orange-600', border: 'border-orange-100' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-white rounded-2xl p-4 shadow-sm border ${c.border}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${c.color}`}>
              <c.icon size={18} />
            </div>
            <p className="text-lg font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {stats.pendingVendors > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {stats.pendingVendors} vendor{stats.pendingVendors > 1 ? 's' : ''} awaiting approval
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Switch to the Vendors tab to review them.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Vendors Tab ────────────────────────────────────────────────────────────────
function VendorsTab() {
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'BLOCKED'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resettingPasswordId, setResettingPasswordId] = useState<string | null>(null);

  const fetchVendors = async () => {
    try {
      const res = await api.get('/admin/vendors');
      const responseData = res.data?.data || res.data;
      if (res.data?.success) setVendors(responseData.vendors);
    } catch (err) {
      console.error('Failed to load vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendors(); }, []);

  const handleAction = async (vendorId: string, action: 'approve' | 'reject' | 'block') => {
    setActionLoading(`${vendorId}-${action}`);
    try {
      await api.patch(`/admin/vendors/${vendorId}/${action}`);
      await fetchVendors();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${action} vendor.`);
    } finally {
      setActionLoading(null);
    }
  };

  const resetPassword = async (userId: string) => {
    const newPassword = window.prompt("Enter new password for this vendor (min 6 chars):");
    if (!newPassword) return;
    if (newPassword.length < 6) return alert("Password must be at least 6 characters.");

    setResettingPasswordId(userId);
    try {
      const res = await api.patch(`/admin/users/${userId}/reset-password`, { newPassword });
      // Backend returns { success, data: null, message: "..." }
      alert(res.data?.message || "Password reset successfully.");
    } catch (err: any) {
      // Backend error returns { success: false, data: null, error: "..." }
      alert(err.response?.data?.error || "Failed to reset password.");
    } finally {
      setResettingPasswordId(null);
    }
  };

  const filtered = vendors.filter(v => {
    if (filter === 'PENDING') return !v.isVerified && !v.isBlocked;
    if (filter === 'APPROVED') return v.isVerified && !v.isBlocked;
    if (filter === 'BLOCKED') return v.isBlocked;
    return true;
  });

  if (loading) return <LoadingSpinner />;

  const filterTabs = ['ALL', 'PENDING', 'APPROVED', 'BLOCKED'] as const;

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {filterTabs.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs font-medium px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
              filter === f ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 shadow-sm hover:bg-gray-50'
            }`}>
            {f} {f !== 'ALL' ? `(${vendors.filter(v => {
              if (f === 'PENDING') return !v.isVerified && !v.isBlocked;
              if (f === 'APPROVED') return v.isVerified && !v.isBlocked;
              if (f === 'BLOCKED') return v.isBlocked;
              return false;
            }).length})` : `(${vendors.length})`}
          </button>
        ))}
      </div>

      {/* Vendor Cards */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <span className="text-4xl">👤</span>
          <p className="text-gray-400 text-sm mt-3">No {filter !== 'ALL' ? filter.toLowerCase() : ''} vendors found.</p>
        </div>
      )}

      {filtered.map(v => (
        <motion.div key={v.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-sm text-gray-900">{v.user.name}</p>
              <p className="text-xs text-gray-400">{v.user.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">Store: {v.storeName}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {v.isBlocked && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-600">Blocked</span>
              )}
              {!v.isBlocked && v.isVerified && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">Approved</span>
              )}
              {!v.isBlocked && !v.isVerified && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Pending</span>
              )}
            </div>
          </div>

          {v.store && (
            <div className="bg-gray-50 rounded-xl p-2.5 mb-3 text-xs text-gray-500">
              🏪 {v.store.name} — {v.store.address}
            </div>
          )}

          <div className="flex gap-2">
            {!v.isVerified && !v.isBlocked && (
              <button onClick={() => handleAction(v.id, 'approve')}
                disabled={actionLoading === `${v.id}-approve`}
                className="flex-1 bg-green-500 text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-green-600 transition-colors disabled:opacity-50">
                {actionLoading === `${v.id}-approve` ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                Approve
              </button>
            )}
            {!v.isVerified && !v.isBlocked && (
              <button onClick={() => handleAction(v.id, 'reject')}
                disabled={actionLoading === `${v.id}-reject`}
                className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-200 transition-colors disabled:opacity-50">
                {actionLoading === `${v.id}-reject` ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                Reject
              </button>
            )}
            <button onClick={() => handleAction(v.id, 'block')}
              disabled={actionLoading === `${v.id}-block`}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 ${
                v.isBlocked
                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}>
              {actionLoading === `${v.id}-block` ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
              {v.isBlocked ? 'Unblock' : 'Block'}
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
            <p className="text-[10px] text-gray-300">Joined: {new Date(v.user.createdAt).toLocaleDateString()}</p>
            <button onClick={() => resetPassword(v.user.id)} disabled={resettingPasswordId === v.user.id}
              className="text-[10px] font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded transition-colors hover:bg-orange-100">
              {resettingPasswordId === v.user.id ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Stores Tab ─────────────────────────────────────────────────────────────────
function StoresTab() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchStores = async () => {
    try {
      const res = await api.get('/admin/stores');
      const responseData = res.data?.data || res.data;
      if (res.data?.success) setStores(responseData.stores);
    } catch (err) {
      console.error('Failed to load stores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStores(); }, []);

  const verifyLocation = async (storeId: string) => {
    setVerifyingId(storeId);
    try {
      await api.patch(`/admin/stores/${storeId}/verify-location`);
      await fetchStores();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to verify location.");
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-3">
      {stores.length === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <span className="text-4xl">🏪</span>
          <p className="text-gray-400 text-sm mt-3">No stores registered yet.</p>
        </div>
      )}

      {stores.map(s => (
        <motion.div key={s.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm">{s.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.address}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {s.vendor?.isVerified ? (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">Verified</span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">Unverified</span>
              )}
              {s.vendor?.isBlocked && (
                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600 font-medium">Blocked</span>
              )}
            </div>
          </div>

          {/* Location Info */}
          <div className="mt-3 bg-gray-50 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                📍 {s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)}
              </span>
              {s.isLocationVerified ? (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">📌 Location Verified</span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">⚠️ Location Unverified</span>
              )}
            </div>
            <div className="flex gap-2">
              <a
                href={`https://www.google.com/maps?q=${s.latitude},${s.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-600 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
              >
                🗺️ View on Map
              </a>
              {!s.isLocationVerified && (
                <button
                  onClick={() => verifyLocation(s.id)}
                  disabled={verifyingId === s.id}
                  className="flex-1 bg-green-500 text-white py-1.5 rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {verifyingId === s.id ? (
                    <><Loader2 size={12} className="animate-spin" /> Verifying...</>
                  ) : (
                    <>✅ Verify Location</>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Package size={12} /> {s._count?.products || 0} products</span>
            <span className="flex items-center gap-1"><ShoppingBag size={12} /> {s._count?.orders || 0} orders</span>
          </div>
          <p className="text-[10px] text-gray-300 mt-2">Owner: {s.vendor?.storeName}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Products Tab ───────────────────────────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async (p: number) => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/products?page=${p}&limit=20`);
      const responseData = res.data?.data || res.data;
      if (res.data?.success) {
        setProducts(responseData.products);
        setTotalPages(responseData.totalPages || responseData.meta?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(page); }, [page]);

  if (loading) return <LoadingSpinner />;

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this product from the platform?")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      await fetchProducts(page);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete product");
    }
  };

  return (
    <div className="space-y-3">
      {products.length === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <span className="text-4xl">📦</span>
          <p className="text-gray-400 text-sm mt-3">No products found.</p>
        </div>
      )}

      {products.map(p => (
        <div key={p.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
          <span className="text-2xl">📦</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{p.name}</p>
            <p className="text-xs text-gray-400">₹{p.price} · Stock: {p.stock} · {p.category}</p>
            <p className="text-[10px] text-gray-300">Store: {p.store?.name || 'N/A'}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              p.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            }`}>
              {p.isAvailable ? 'Active' : 'Off'}
            </span>
            <button onClick={() => handleDeleteProduct(p.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
            className="text-xs px-3 py-2 rounded-xl bg-white shadow-sm disabled:opacity-30">← Prev</button>
          <span className="text-xs text-gray-500">{page} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
            className="text-xs px-3 py-2 rounded-xl bg-white shadow-sm disabled:opacity-30">Next →</button>
        </div>
      )}
    </div>
  );
}

// ─── Orders Tab ─────────────────────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async (p: number, status?: string) => {
    try {
      setLoading(true);
      const query = status && status !== 'ALL' ? `&status=${status}` : '';
      const res = await api.get(`/admin/orders?page=${p}&limit=20${query}`);
      const responseData = res.data?.data || res.data;
      if (res.data?.success) {
        setOrders(responseData.orders);
        setTotalPages(responseData.totalPages || responseData.meta?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(page, filter); }, [page, filter]);

  const statusLabels = ['ALL', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

  const statusColor = (s: string) => {
    switch (s) {
      case 'CONFIRMED': return 'bg-blue-100 text-blue-700';
      case 'PREPARING': return 'bg-orange-100 text-orange-700';
      case 'READY': return 'bg-green-100 text-green-700';
      case 'COMPLETED': return 'bg-gray-100 text-gray-600';
      case 'CANCELLED': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {statusLabels.map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }}
            className={`text-xs font-medium px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
              filter === s ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 shadow-sm hover:bg-gray-50'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {orders.length === 0 && (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <span className="text-4xl">🛒</span>
              <p className="text-gray-400 text-sm mt-3">No {filter !== 'ALL' ? filter.toLowerCase() : ''} orders found.</p>
            </div>
          )}

          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">#{o.id.substring(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleString()}</p>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor(o.status)}`}>
                  {o.status}
                </span>
              </div>
              <div className="text-xs text-gray-500 mb-2">
                <p>👤 {o.user?.name || 'Unknown'} — {o.user?.email || ''}</p>
                <p>🏪 {o.store?.name || 'Unknown Store'}</p>
              </div>
              <div className="text-xs text-gray-400 mb-2">
                {o.items?.map((i: any, idx: number) => (
                  <span key={idx}>📦 {i.product?.name || 'Unknown'} x{i.quantity}{idx < o.items.length - 1 ? ' · ' : ''}</span>
                ))}
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-indigo-600">₹{o.totalAmount}</span>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="text-xs px-3 py-2 rounded-xl bg-white shadow-sm disabled:opacity-30">← Prev</button>
              <span className="text-xs text-gray-500">{page} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="text-xs px-3 py-2 rounded-xl bg-white shadow-sm disabled:opacity-30">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
      <Loader2 size={28} className="animate-spin text-indigo-400" />
      <p className="text-xs">Loading...</p>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
      <AlertTriangle size={24} className="text-red-400 mx-auto mb-2" />
      <p className="text-sm text-red-600">{message}</p>
    </div>
  );
}
