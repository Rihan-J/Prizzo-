import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, X, SlidersHorizontal, TrendingUp, Mic } from 'lucide-react';
import { getCategoryList, getCategoryDisplay } from '../config/categoryConfig';
import { ProductCard, StoreCard } from '../components/Cards';
import { SearchResultsSkeleton } from '../components/Skeleton';
import api, { createCancelableRequest } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';

const tabs = ['All', 'Products', 'Stores'];
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
  const [apiLoading, setApiLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const cancelRef = useRef<ReturnType<typeof createCancelableRequest> | null>(null);

  // Category display config
  const categories = getCategoryList();

  // ── Debounced search query (400ms) ──
  const debouncedQuery = useDebounce(query, 400);
  const catFilter = params.get('category') || '';

  // ── Fetch products from server with debounced query ──
  useEffect(() => {
    let isCurrent = true;
    const fetchSearch = async () => {
      // Cancel previous in-flight request
      if (cancelRef.current) cancelRef.current.cancel();
      const cancelable = createCancelableRequest();
      cancelRef.current = cancelable;

      try {
        setApiLoading(true);
        const queryParams: Record<string, any> = { page: '1', limit: '20', t: Date.now() };
        if (debouncedQuery.trim()) queryParams.query = debouncedQuery.trim();
        if (catFilter) queryParams.category = catFilter;

        const res = await api.get('/products', { params: queryParams, signal: cancelable.signal });
        if (!isCurrent) return;

        const data = res.data?.data || res.data;

        if (data?.products) {
          setProducts(data.products);
          setPage(1);
          const meta = res.data?.meta;
          setHasMore(meta ? meta.hasMore : data.products.length >= 20);
          setTotalCount(meta?.total || data.total || data.products.length);
        }
      } catch (err: any) {
        if (!isCurrent) return;
        if (err?.code !== 'ERR_CANCELED') {
          console.error("Search API Error:", err);
        }
      } finally {
        if (isCurrent) {
          setApiLoading(false);
        }
      }
    };

    fetchSearch();

    return () => {
      isCurrent = false;
      if (cancelRef.current) cancelRef.current.cancel();
    };
  }, [debouncedQuery, catFilter]);

  // ── Load more products (pagination) ──
  const loadMore = async () => {
    const nextPage = page + 1;
    try {
      const queryParams: Record<string, any> = { page: String(nextPage), limit: '20', t: Date.now() };
      if (debouncedQuery.trim()) queryParams.query = debouncedQuery.trim();
      if (catFilter) queryParams.category = catFilter;

      const res = await api.get('/products', { params: queryParams });
      const data = res.data?.data || res.data;
      if (data?.products) {
        setProducts(prev => [...prev, ...data.products]);
        setPage(nextPage);
        const meta = res.data?.meta;
        setHasMore(meta ? meta.hasMore : data.products.length >= 20);
      }
    } catch (err) {
      console.error("Load more error:", err);
    }
  };

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
      setQuery(transcript);
      doSearch(transcript);
    };
  };

  useEffect(() => {
    const qParam = params.get('q');
    if (qParam) setQuery(qParam);
    // If we have a category but no explicit search query, keep search bar empty or show category hint
    // but DON'T set query to category name because it breaks backend filtering
  }, [params]);

  const doSearch = (q: string) => {
    setQuery(q);
    if (q.trim() && !recentSearches.includes(q)) {
      const updated = [q, ...recentSearches].slice(0, 8);
      setRecentSearches(updated);
      localStorage.setItem('prizzo_recent_searches', JSON.stringify(updated));
    }
  };

  // ── Client-side sort/filter on already-fetched products ──
  const filteredProducts = useMemo(() => {
    let items = products;
    if (sortBy === 'Price: Low to High') items = [...items].sort((a, b) => a.price - b.price);
    if (sortBy === 'Price: High to Low') items = [...items].sort((a, b) => b.price - a.price);
    return items;
  }, [sortBy, products]);

  const filteredStores = useMemo(() => {
    if (tab !== 'All' && tab !== 'Stores') return [];
    const map = new Map();
    products.forEach(p => {
      if (p.store && !map.has(p.store.id)) map.set(p.store.id, p.store);
    });
    return Array.from(map.values());
  }, [tab, products]);

  const hasResults = query.trim().length > 0 || catFilter.length > 0;

  return (
    <div className="min-h-dvh bg-white pb-nav">
      {/* Search Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 pt-3 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} className="text-gray-600" /></button>
          <div className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Search size={16} className="text-gray-400" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch(query)}
              placeholder={params.get('category') ? `Search in ${getCategoryDisplay(params.get('category')!)?.name}...` : "Search products, stores, dishes..."}
              className="flex-1 bg-transparent text-sm outline-none" autoFocus />
            {query ? (
              <button onClick={() => setQuery('')}><X size={14} className="text-gray-400" /></button>
            ) : (
              <button onClick={startVoiceSearch}><Mic size={16} className="text-orange-500" /></button>
            )}
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="p-2 bg-orange-50 rounded-xl">
            <SlidersHorizontal size={18} className="text-orange-500" />
          </button>
        </div>

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
          <SearchResultsSkeleton />
        ) : (
          <>
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
                      <button key={c.id} onClick={() => { navigate(`/search?category=${encodeURIComponent(c.name)}`); setQuery(c.name); }}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-gray-50">
                        <span className="text-xl">{c.icon}</span>
                        <span className="text-[9px] font-medium text-gray-500 text-center">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {hasResults && (
              <div className="space-y-4">
                <p className="text-xs text-gray-400">{totalCount} products{filteredStores.length > 0 ? `, ${filteredStores.length} stores` : ''}</p>

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
                    {/* Load More */}
                    {hasMore && filteredProducts.length > 0 && (
                      <button onClick={loadMore}
                        className="w-full bg-orange-50 text-orange-600 py-3 rounded-2xl text-sm font-semibold hover:bg-orange-100 transition-colors">
                        Load More
                      </button>
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
