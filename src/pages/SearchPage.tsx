import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, X, SlidersHorizontal, TrendingUp, Loader2 } from 'lucide-react';
import { categories } from '../data/categories';
import { ProductCard, StoreCard } from '../components/Cards';
import api from '../services/api';

const tabs = ['All', 'Products', 'Stores', 'Food', 'Pharmacy'];
const sortOpts = ['Relevance', 'Price: Low to High', 'Price: High to Low'];
const trendingSearches = ['Milk', 'Biryani', 'Paracetamol', 'Charger', 'Dosa', 'Rice', 'Cake', 'Battery'];

export default function SearchPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [tab, setTab] = useState(params.get('tab') === 'stores' ? 'Stores' : 'All');
  const [sortBy, setSortBy] = useState('Relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('prizzo_recent_searches');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [products, setProducts] = useState<any[]>([]);
  const [apiLoading, setApiLoading] = useState(true);

  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        setApiLoading(true);
        // Using query params natively to API to get results. 
        // Adding basic limit since we rely on client-side sorting/filtering for quick UX in this demo
        const res = await api.get('/products?limit=100');
        if (res.data?.success) {
          setProducts(res.data.products);
        }
      } catch (err) {
        console.error("Search API Error:", err);
      } finally {
        setApiLoading(false);
      }
    };
    fetchSearchData();
  }, []);

  const catFilter = params.get('category') || '';

  useEffect(() => {
    if (params.get('q')) setQuery(params.get('q')!);
    if (params.get('category')) {
      const cat = categories.find(c => c.id === params.get('category'));
      if (cat) setQuery(cat.name);
    }
  }, [params]);

  const doSearch = (q: string) => {
    setQuery(q);
    if (q.trim() && !recentSearches.includes(q)) {
      const updated = [q, ...recentSearches].slice(0, 8);
      setRecentSearches(updated);
      localStorage.setItem('prizzo_recent_searches', JSON.stringify(updated));
    }
  };

  const filteredProducts = useMemo(() => {
    let items = products;
    const q = query.toLowerCase();
    
    if (q) items = items.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)) || p.category.includes(q));
    if (catFilter) items = items.filter(p => p.category === catFilter);
    if (tab === 'Food') items = items.filter(p => p.category === 'food');
    if (tab === 'Pharmacy') items = items.filter(p => p.category === 'medicine');
    if (tab === 'Products') items = items.filter(p => !['food'].includes(p.category));

    if (sortBy === 'Price: Low to High') items = [...items].sort((a, b) => a.price - b.price);
    if (sortBy === 'Price: High to Low') items = [...items].sort((a, b) => b.price - a.price);
    
    return items;
  }, [query, tab, sortBy, catFilter, products]);

  const filteredStores = useMemo(() => {
    if (tab !== 'All' && tab !== 'Stores') return [];
    
    // Dynamically derive stores from available products to prevent mock dependency
    const map = new Map();
    products.forEach(p => {
      if (p.store && !map.has(p.store.id)) {
        map.set(p.store.id, p.store);
      }
    });
    const derivedStores = Array.from(map.values());
    
    const q = query.toLowerCase();
    if (!q) return derivedStores.slice(0, 8);
    return derivedStores.filter((s: any) => s.name.toLowerCase().includes(q) || (s.address && s.address.toLowerCase().includes(q)));
  }, [query, tab, products]);

  const hasResults = query.trim().length > 0;

  return (
    <div className="min-h-dvh bg-white pb-nav">
      {/* Search Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 pt-3 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-gray-600" /></button>
          <div className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Search size={16} className="text-gray-400" />
            <input type="text" value={query} onChange={e => { setQuery(e.target.value); }}
              onKeyDown={e => e.key === 'Enter' && doSearch(query)}
              placeholder="Search products, stores, dishes…"
              className="flex-1 bg-transparent text-sm outline-none" autoFocus />
            {query && <button onClick={() => setQuery('')}><X size={14} className="text-gray-400" /></button>}
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="p-2 bg-orange-50 rounded-xl">
            <SlidersHorizontal size={18} className="text-orange-500" />
          </button>
        </div>

        {/* Tabs */}
        {hasResults && (
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`text-xs font-medium px-4 py-2 rounded-xl whitespace-nowrap transition-all ${tab === t ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter/Sort Sheet */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden bg-orange-50 px-4 border-b border-orange-100">
            <div className="py-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">Sort By</p>
              <div className="flex flex-wrap gap-2">
                {sortOpts.map(s => (
                  <button key={s} onClick={() => setSortBy(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg ${sortBy === s ? 'bg-orange-500 text-white' : 'bg-white text-gray-600'}`}>{s}</button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 mt-4">
        {apiLoading ? (
          <div className="flex items-center gap-2 justify-center py-10 font-medium text-gray-400">
            <Loader2 size={24} className="animate-spin text-orange-400" /> Searching database...
          </div>
        ) : (
          <>
            {/* Empty state — show trending + recent */}
            {!hasResults && (
              <div className="space-y-6">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-800">Recent Searches</h3>
                      <button onClick={() => { setRecentSearches([]); localStorage.removeItem('prizzo_recent_searches'); }}
                        className="text-xs text-gray-400">Clear</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map(s => (
                        <button key={s} onClick={() => doSearch(s)} className="bg-gray-100 text-xs px-3 py-2 rounded-xl text-gray-600 font-medium">{s}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 mb-3"><TrendingUp size={14} className="text-orange-500" /> Trending</h3>
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map(s => (
                      <button key={s} onClick={() => doSearch(s)} className="bg-orange-50 text-xs px-3 py-2 rounded-xl text-orange-600 font-medium">🔥 {s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Browse Categories</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {categories.map(c => (
                      <button key={c.id} onClick={() => { navigate(`/search?category=${c.id}`); setQuery(c.name); }}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-gray-50">
                        <span className="text-xl">{c.icon}</span>
                        <span className="text-[9px] font-medium text-gray-500 text-center">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {hasResults && (
              <div className="space-y-4">
                <p className="text-xs text-gray-400">{filteredProducts.length} products{filteredStores.length > 0 ? `, ${filteredStores.length} stores` : ''}</p>

                {(tab === 'All' || tab === 'Stores') && filteredStores.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Stores</h3>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
                      {filteredStores.map((s: any) => <StoreCard key={s.id} store={s} />)}
                    </div>
                  </div>
                )}

                {tab !== 'Stores' && (
                  <div className="space-y-3">
                    {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
                    {filteredProducts.length === 0 && (
                      <div className="text-center py-16">
                        <span className="text-5xl">🔍</span>
                        <p className="text-gray-500 mt-4 font-medium">No results found for "{query}"</p>
                        <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
