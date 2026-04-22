import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Mic, Bell, ChevronRight, Globe, Check, X, MessageCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getCategoryList } from '../config/categoryConfig';
import { ProductCard, StoreCard } from '../components/Cards';
import api from '../services/api';

// ── Inline UI constants — promotional banners (frontend layout config) ──
const BANNERS = [
  { id: 'b1', title: 'Compare prices. Save more.', subtitle: 'Find the best deal on everyday items nearby', cta: 'Compare Now', emoji: '💰', bgGradient: 'from-orange-400 to-orange-600', link: '/compare' },
  { id: 'b2', title: 'Fresh Groceries in 10 min', subtitle: 'Pickup from stores near you', cta: 'Shop Now', emoji: '🛒', bgGradient: 'from-green-400 to-emerald-600', link: '/search?category=grocery' },
  { id: 'b3', title: 'Delicious Food Nearby 🍛', subtitle: 'Order and pick up hot meals', cta: 'Order Now', emoji: '🍛', bgGradient: 'from-red-400 to-rose-600', link: '/search?category=food' },
  { id: 'b4', title: 'Medicine at your doorstep', subtitle: 'Pickup in minutes from pharmacies', cta: 'Browse', emoji: '💊', bgGradient: 'from-blue-400 to-blue-600', link: '/search?category=medicine' },
];

// ── Inline UI constants — AI search suggestion chips ──
const AI_SUGGESTIONS = [
  { text: 'Need milk nearby?', query: 'milk', emoji: '🥛' },
  { text: 'Compare charger prices', query: 'charger', emoji: '🔌' },
  { text: 'Find paracetamol open now', query: 'paracetamol', emoji: '💊' },
  { text: 'Best biryani pickup', query: 'biryani', emoji: '🍛' },
  { text: 'Fresh fruits nearby', query: 'fruits', emoji: '🥭' },
  { text: 'Bakery items in 10 min', query: 'cake', emoji: '🍰' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user, isVendor } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  
  const [bannerIdx, setBannerIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  // Live Database State
  const [products, setProducts] = useState<any[]>([]);

  // Category display config
  const categories = getCategoryList();

  // Fetch online products (served from 30s cache on repeat visits)
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await api.get('/products?limit=50');
        // Handle standardized response format { success, data: { products }, meta }
        const data = res.data?.data || res.data;
        if (data?.products) {
          setProducts(data.products);
        }
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  // Dynamic geolocation
  useEffect(() => {
    const cached = sessionStorage.getItem('prizzo_location');
    if (cached) { setUserLocation(cached); setLocationLoading(false); return; }
    if (!navigator.geolocation) { setUserLocation('Shivamogga, Karnataka'); setLocationLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`);
          const data = await res.json();
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || 'Your City';
          const state = addr.state || '';
          const loc = `${city}${state ? `, ${state}` : ''}`;
          sessionStorage.setItem('prizzo_location', loc);
          sessionStorage.setItem('prizzo_user_coords', JSON.stringify({ lat: coords.latitude, lng: coords.longitude }));
          setUserLocation(loc);
        } catch { setUserLocation('Shivamogga, Karnataka'); }
        finally { setLocationLoading(false); }
      },
      () => { setUserLocation('Shivamogga, Karnataka'); setLocationLoading(false); },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 }
    );
  }, []);

  const languages = [
    { id: 'English', label: 'English' },
    { id: 'Hindi', label: 'हिन्दी (Hindi)' },
    { id: 'Kannada', label: 'ಕನ್ನಡ (Kannada)' },
  ] as const;

  const selectLanguage = (id: 'English' | 'Hindi' | 'Kannada') => {
    setLanguage(id);
    setShowLanguageModal(false);
  };

  useEffect(() => { const t = setInterval(() => setBannerIdx(i => (i + 1) % BANNERS.length), 4000); return () => clearInterval(t); }, []);

  if (isVendor) { navigate('/vendor', { replace: true }); return null; }

  // Derive views from real database products
  const trending = products.slice(0, 8);
  const foodItems = products.filter(p => p.category.toLowerCase() === 'food').slice(0, 6);
  const pharma = products.filter(p => p.category.toLowerCase() === 'medicine').slice(0, 4);
  const elec = products.filter(p => p.category.toLowerCase() === 'electronics').slice(0, 4);
  const grocery = products.filter(p => p.category.toLowerCase() === 'grocery').slice(0, 4);
  
  // Extract unique stores directly from the available products safely
  const map = new Map();
  products.forEach(p => {
    if (p.store && !map.has(p.store.id)) map.set(p.store.id, p.store);
  });
  const nearbyStores = Array.from(map.values()).slice(0, 6);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      navigate(`/search?q=${encodeURIComponent(transcript)}`);
    };
  };

  if (loading) {
// ... existing loading code
    return (
      <div className="min-h-dvh bg-white pb-nav">
        <div className="px-4 pt-6 space-y-4">
          <div className="animate-pulse bg-gray-200 h-16 rounded-2xl w-full" />
          <div className="animate-pulse bg-gray-200 h-12 rounded-2xl w-full" />
          <div className="flex gap-3 overflow-hidden">{[1, 2, 3, 4, 5].map(i => <div key={i} className="animate-pulse bg-gray-200 h-20 w-20 rounded-2xl flex-shrink-0" />)}</div>
          <div className="animate-pulse bg-gray-200 h-36 rounded-2xl w-full" />
          <div className="flex gap-3 overflow-hidden">{[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-gray-200 h-48 w-40 rounded-2xl flex-shrink-0" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F8F6F3] pb-nav">
      {/* 🔶 Refined Header */}
      <header className="px-5 pt-8 pb-4 bg-[#F8F6F3]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#1E1E1E] tracking-tight">Hi {user?.name?.split(' ')[0] || 'Farhan'} 👋</h1>
            <button onClick={() => navigate('/search')} className="flex items-center gap-0.5 text-[11px] text-[#8e8e8e] mt-1 font-medium">
              <MapPin size={11} className="text-[#FF6A00]" />
              {locationLoading ? 'Detecting…' : userLocation}
              <ChevronRight size={11} />
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={() => setShowLanguageModal(true)} className="p-2.5 bg-white rounded-full shadow-sm text-[#1E1E1E] border border-[#f0ede9]">
              <Globe size={18} />
            </button>
            <button onClick={() => navigate('/notifications')} className="p-2.5 bg-white rounded-full shadow-sm text-[#1E1E1E] border border-[#f0ede9]">
              <Bell size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="h-2" />

      {/* 🔍 Elevated Search Bar */}
      <div className="px-5 py-3 sticky top-0 z-30 bg-[#F8F6F3]/95 backdrop-blur-md">
        <motion.div 
          whileTap={{ scale: 0.98 }} 
          onClick={() => navigate('/search')}
          className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3 shadow-md cursor-pointer border border-[#f0ede9] focus-within:border-[#FF6A00]/40 transition-all"
        >
          <Search size={20} className="text-[#FF6A00]" />
          <span className="text-[#8e8e8e] text-sm font-medium flex-1 truncate">
            Search groceries, medicines, or nearby stores
          </span>
          <div className="w-px h-5 bg-gray-200" />
          <button 
            onClick={(e) => { e.stopPropagation(); startVoiceSearch(); }}
            className="p-1 hover:bg-gray-50 rounded-full transition-colors"
          >
            <Mic size={20} className="text-[#8e8e8e]" />
          </button>
        </motion.div>
      </div>

      <div className="px-5 mt-6 space-y-10">
        {/* ✨ Secondary Suggestion Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {AI_SUGGESTIONS.map(s => (
            <motion.button 
              key={s.query}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/search?q=${s.query}`)}
              className="bg-white px-3.5 py-1.5 rounded-xl shadow-sm border border-[#f0ede9] text-[#1E1E1E] text-[11px] font-semibold whitespace-nowrap flex items-center gap-1.5 hover:bg-[#fff1e6] hover:border-[#FF6A00]/20 transition-all"
            >
              <span className="grayscale opacity-50 text-xs">{s.emoji}</span>
              {s.text.replace('?', '')}
            </motion.button>
          ))}
        </div>

        {/* 🔥 Trending Products */}
        <Section title="🔥 Trending Products" onSeeAll={() => navigate('/search')}>
          <div className="grid grid-cols-2 gap-3">
            {trending.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </Section>

        {/* 📍 Nearby Stores */}
        <Section title="📍 Best Pickup Stores" onSeeAll={() => navigate('/search?tab=stores')}>
          <div className="space-y-3">
            {nearbyStores.map((s: any) => <StoreCard key={s.id} store={s} />)}
          </div>
        </Section>

        {/* Empty state when no products at all */}
        {products.length === 0 && !loading && (
          <div className="text-center py-16">
            <span className="text-5xl">🏪</span>
            <p className="text-gray-500 mt-4 font-medium">No products available yet</p>
            <p className="text-xs text-gray-400 mt-1">Check back soon — stores are adding items daily!</p>
          </div>
        )}

        <div className="h-4" />
      </div>

      {/* Language Selection Bottom Sheet */}
      <AnimatePresence>
        {showLanguageModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLanguageModal(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 mx-auto bg-white rounded-t-3xl z-50 p-6 pb-8 max-w-lg"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">{t('Select Language')}</h3>
                <button onClick={() => setShowLanguageModal(false)} className="p-2 bg-gray-100 rounded-full">
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <div className="space-y-3">
                {languages.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => selectLanguage(l.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${language === l.id ? 'border-orange-500 bg-orange-50/50' : 'border-gray-100 hover:bg-gray-50'
                      }`}
                  >
                    <span className={`font-semibold ${language === l.id ? 'text-orange-600' : 'text-gray-800'}`}>
                      {l.label}
                    </span>
                    {language === l.id && <Check size={20} className="text-orange-500" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 💬 Simple Floating Chat Button */}
      <button 
        onClick={() => navigate('/help')}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 bg-white text-[#FF6A00] rounded-full shadow-float flex items-center justify-center border border-[#f0ede9] hover:scale-105 transition-transform active:scale-95"
      >
        <MessageCircle size={22} />
      </button>
    </div>
  );
}

function Section({ title, children, onSeeAll }: { title: string; children: React.ReactNode; onSeeAll?: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-lg text-[#1E1E1E] tracking-tight">{title}</h2>
        {onSeeAll && (
          <button onClick={onSeeAll} className="text-xs font-bold text-[#FF6A00] flex items-center bg-[#fff1e6] px-2.5 py-1 rounded-lg">
            See all <ChevronRight size={14} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
