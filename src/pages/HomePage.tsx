import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Mic, Bell, ChevronRight, Sparkles, Globe, Check, X, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { banners, aiSuggestions } from '../data/banners';
import { ProductCard, StoreCard } from '../components/Cards';
import api from '../services/api';

// Fallback categories since they just contain static UI config/colors 
// and don't require database representation for a hackathon UI.
import { categories } from '../data/categories';

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

  // Fetch online products
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await api.get('/products?limit=50');
        if (res.data?.success) {
          setProducts(res.data.products);
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

  useEffect(() => { const t = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 4000); return () => clearInterval(t); }, []);

  if (isVendor) { navigate('/vendor', { replace: true }); return null; }

  // Derive views from real database products
  const trending = products.slice(0, 8); // Just take first 8 for trending demo
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

  if (loading) {
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
    <div className="min-h-dvh bg-white pb-nav">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-4 pt-5 pb-6 rounded-b-[1.5rem] relative overflow-hidden">
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 6, repeat: Infinity }}
          className="absolute w-48 h-48 bg-white/5 rounded-full -top-16 -right-12" />
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <p className="text-white/80 text-xs font-medium">{t('Good')} {new Date().getHours() < 12 ? t('Morning') : new Date().getHours() < 17 ? t('Afternoon') : t('Evening')} 👋</p>
            <h1 className="text-white font-bold text-lg">{user?.name || t('Guest')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowLanguageModal(true)} className="bg-white/15 text-white p-2 rounded-xl backdrop-blur-sm flex items-center justify-center">
              <Globe size={18} className="text-white" />
            </button>
            <button onClick={() => navigate('/notifications')} className="relative bg-white/15 p-2 rounded-xl backdrop-blur-sm">
              <Bell size={18} className="text-white" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-orange-500" />
            </button>
          </div>
        </div>
        <button onClick={() => navigate('/search')} className="flex items-center gap-0.5 text-white/70 text-xs mb-3">
          <MapPin size={12} />
          {locationLoading ? (
            <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Detecting…</span>
          ) : (
            <span>{userLocation}</span>
          )}
          <ChevronRight size={12} />
        </button>
        <motion.div whileTap={{ scale: 0.98 }} onClick={() => navigate('/search')}
          className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm cursor-pointer">
          <Search size={18} className="text-gray-400" />
          <span className="text-gray-400 text-sm flex-1">{t('Search groceries, medicines, food…')}</span>
          <Mic size={18} className="text-orange-400" />
        </motion.div>
      </div>

      <div className="px-4 mt-5 space-y-6">
        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base">{t('Categories')}</h2>
            <button className="text-xs text-orange-500 font-medium">{t('See all')}</button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {categories.map(cat => (
              <motion.button whileTap={{ scale: 0.92 }} key={cat.id}
                onClick={() => navigate(`/search?category=${cat.id}`)}
                className="flex flex-col items-center gap-1.5 min-w-[68px]">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: cat.bgColor }}>
                  {cat.icon}
                </div>
                <span className="text-[10px] font-medium text-gray-600 text-center leading-tight">{t(cat.name)}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Hero Banner */}
        <motion.div key={bannerIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(banners[bannerIdx].link)}
          className={`bg-gradient-to-r ${banners[bannerIdx].bgGradient} rounded-2xl p-5 relative overflow-hidden cursor-pointer min-h-[120px]`}>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl opacity-20">{banners[bannerIdx].emoji}</div>
          <h3 className="text-white font-bold text-lg relative z-10">{banners[bannerIdx].title}</h3>
          <p className="text-white/80 text-xs mt-1 relative z-10">{banners[bannerIdx].subtitle}</p>
          <button className="mt-3 bg-white/25 text-white text-xs font-medium px-4 py-2 rounded-xl relative z-10 backdrop-blur-sm">
            {banners[bannerIdx].cta} →
          </button>
          <div className="flex gap-1 mt-3">
            {banners.map((_, i) => <div key={i} className={`h-1 rounded-full ${i === bannerIdx ? 'w-6 bg-white' : 'w-2 bg-white/40'} transition-all`} />)}
          </div>
        </motion.div>

        {/* AI Suggestion Box */}
        <div className="bg-orange-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-orange-500" />
            <span className="text-sm font-semibold text-gray-800">{t('What are you looking for today?')}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {aiSuggestions.map(s => (
              <motion.button whileTap={{ scale: 0.95 }} key={s.query}
                onClick={() => navigate(`/search?q=${s.query}`)}
                className="bg-white text-xs px-3 py-2 rounded-xl text-gray-700 font-medium shadow-sm hover:shadow-md transition-shadow flex items-center gap-1.5">
                 {s.emoji} {s.text}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Trending */}
        {trending.length > 0 && (
          <Section title={t('🔥 Trending Products')} onSeeAll={() => navigate('/search?sort=popular')}>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
              {trending.map(p => <ProductCard key={p.id} product={p} compact />)}
            </div>
          </Section>
        )}

        {/* Nearby Stores extracted from products list */}
        {nearbyStores.length > 0 && (
          <Section title={t('📍 Best Pickup Stores Near You')} onSeeAll={() => navigate('/search?tab=stores')}>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
              {nearbyStores.map((s: any) => <StoreCard key={s.id} store={s} />)}
            </div>
          </Section>
        )}

        {/* General items */}
        {foodItems.length > 0 && (
          <Section title={t('🍽️ Restaurant Dishes')} onSeeAll={() => navigate('/search?category=food')}>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
              {foodItems.map(p => <ProductCard key={p.id} product={p} compact />)}
            </div>
          </Section>
        )}

        {pharma.length > 0 && (
          <Section title={t('💊 Pharmacy Essentials')} onSeeAll={() => navigate('/search?category=medicine')}>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
              {pharma.map(p => <ProductCard key={p.id} product={p} compact />)}
            </div>
          </Section>
        )}

        {elec.length > 0 && (
          <Section title={t('📱 Electronics Picks')} onSeeAll={() => navigate('/search?category=electronics')}>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
              {elec.map(p => <ProductCard key={p.id} product={p} compact />)}
            </div>
          </Section>
        )}

        {grocery.length > 0 && (
          <Section title={t('🛒 Grocery Essentials')} onSeeAll={() => navigate('/search?category=grocery')}>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
              {grocery.map(p => <ProductCard key={p.id} product={p} compact />)}
            </div>
          </Section>
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
    </div>
  );
}

function Section({ title, children, onSeeAll }: { title: string; children: React.ReactNode; onSeeAll?: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-base">{title}</h2>
        {onSeeAll && <button onClick={onSeeAll} className="text-xs text-orange-500 font-medium flex items-center gap-0.5"><ChevronRight size={12} /></button>}
      </div>
      {children}
    </div>
  );
}
