import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Mic, Bell, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
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
  const { t } = useLanguage();
  
  const [bannerIdx, setBannerIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  
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
            <button onClick={() => navigate('/notifications')} className="relative bg-white/15 p-2 rounded-xl backdrop-blur-sm">
              <Bell size={18} className="text-white" />
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
          <Mic 
            size={18} 
            className="text-orange-400 cursor-pointer p-1 -m-1 hover:bg-orange-50 rounded-full" 
            onClick={(e) => { e.stopPropagation(); startVoiceSearch(); }} 
          />
        </motion.div>
      </div>

      <div className="px-4 mt-5 space-y-6">

        {/* AI Suggestion Box */}
        <div className="bg-orange-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-orange-500" />
            <span className="text-sm font-semibold text-gray-800">{t('What are you looking for today?')}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {AI_SUGGESTIONS.map(s => (
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
