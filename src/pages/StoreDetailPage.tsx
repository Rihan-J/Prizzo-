import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Clock, MapPin, Phone, Search, X, Navigation, Loader2, ExternalLink } from 'lucide-react';
import { ProductCard } from '../components/Cards';
import api from '../services/api';

// ─── Map Modal ────────────────────────────────────────────────────────────────
interface MapModalProps {
  store: {
    name: string;
    address: string;
    lat?: number;
    lng?: number;
  };
  onClose: () => void;
}

function MapModal({ store, onClose }: MapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapInstanceRef = useRef<any>(null);
  const routingControlRef = useRef<any>(null);

  // Store coordinates — fall back to a default if not on the store object
  const storeLat = store.lat ?? 12.9716;
  const storeLng = store.lng ?? 77.5946;

  // Load Leaflet + routing plugin dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      if ((window as any).L) { initMap(); return; }

      // Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      // Routing CSS
      if (!document.getElementById('routing-css')) {
        const link = document.createElement('link');
        link.id = 'routing-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css';
        document.head.appendChild(link);
      }

      // Leaflet JS
      await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
      // Routing Machine JS
      await loadScript('https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.min.js');

      initMap();
    };

    loadLeaflet();

    return () => {
      if (routingControlRef.current) {
        try { routingControlRef.current.getPlan().setWaypoints([]); } catch (_) { }
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const loadScript = (src: string) =>
    new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject();
      document.head.appendChild(s);
    });

  const initMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const L = (window as any).L;

    const map = L.map(mapRef.current, { zoomControl: true }).setView([storeLat, storeLng], 15);
    mapInstanceRef.current = map;

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Store marker
    const storeIcon = L.divIcon({
      html: `<div style="background:#f97316;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
               <span style="transform:rotate(45deg);font-size:16px;">🏪</span>
             </div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    L.marker([storeLat, storeLng], { icon: storeIcon })
      .addTo(map)
      .bindPopup(`<b>${store.name}</b><br/>${store.address}`)
      .openPopup();

    setMapLoaded(true);

    // Get user location
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ul = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(ul);
        setLoadingLocation(false);
        drawRoute(map, L, ul);
      },
      (err) => {
        setLoadingLocation(false);
        setLocationError('Unable to get your location. Showing store location only.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const drawRoute = (map: any, L: any, from: { lat: number; lng: number }) => {
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    // User location marker
    const userIcon = L.divIcon({
      html: `<div style="background:#3b82f6;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3);"></div>`,
      className: '',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    L.marker([from.lat, from.lng], { icon: userIcon }).addTo(map).bindPopup('You are here');

    // Routing
    const routing = (L as any).Routing.control({
      waypoints: [
        L.latLng(from.lat, from.lng),
        L.latLng(storeLat, storeLng),
      ],
      routeWhileDragging: false,
      show: false,           // hide the default instruction panel
      addWaypoints: false,
      lineOptions: {
        styles: [{ color: '#f97316', weight: 5, opacity: 0.85 }],
      },
      createMarker: () => null, // use our custom markers instead
    });

    routing.addTo(map);
    routingControlRef.current = routing;

    // Fit bounds to show both points
    map.fitBounds(
      [[from.lat, from.lng], [storeLat, storeLng]],
      { padding: [40, 40] }
    );
  };

  const openInGoogleMaps = () => {
    const url = userLocation
      ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${storeLat},${storeLng}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${storeLat},${storeLng}`;
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl"
          style={{ height: '85vh', maxHeight: '680px' }}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-base text-gray-900">{store.name}</h2>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <MapPin size={10} /> {store.address}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openInGoogleMaps}
                className="flex items-center gap-1.5 bg-orange-50 text-orange-600 text-xs font-medium px-3 py-2 rounded-xl hover:bg-orange-100 transition-colors"
               >
                <ExternalLink size={12} />
                Google Maps
              </button>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Status bar */}
          {(loadingLocation || locationError) && (
            <div className={`px-5 py-2 text-xs flex items-center gap-2 ${locationError ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>
              {loadingLocation
                ? <><Loader2 size={12} className="animate-spin" /> Getting your location for directions…</>
                : <><Navigation size={12} /> {locationError}</>
              }
            </div>
          )}
          {!loadingLocation && userLocation && !locationError && (
            <div className="px-5 py-2 text-xs flex items-center gap-2 bg-green-50 text-green-700">
              <Navigation size={12} /> Route found! Orange line shows directions to store.
            </div>
          )}

          {/* Map */}
          <div ref={mapRef} className="w-full" style={{ height: 'calc(100% - 80px)' }} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StoreDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showMap, setShowMap] = useState(false);
  const [store, setStore] = useState<any>(null);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        setLoading(true);
        const [storeRes, productsRes] = await Promise.all([
          api.get(`/stores/${id}`),
          api.get(`/products?storeId=${id}&limit=20&page=1`)
        ]);

        // Handle standardized response format
        const storeData = storeRes.data?.data || storeRes.data;
        if (storeData?.store) {
          setStore(storeData.store);
        }
        const prodData = productsRes.data?.data || productsRes.data;
        if (prodData?.products) {
          setStoreProducts(prodData.products);
          const meta = productsRes.data?.meta;
          setHasMore(meta ? meta.hasMore : prodData.products.length >= 20);
        }
      } catch (err) {
        console.error("Failed to load store", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchStore();
  }, [id]);

  const loadMoreProducts = async () => {
    const nextPage = page + 1;
    try {
      const res = await api.get(`/products?storeId=${id}&limit=20&page=${nextPage}`);
      const data = res.data?.data || res.data;
      if (data?.products) {
        setStoreProducts(prev => [...prev, ...data.products]);
        setPage(nextPage);
        const meta = res.data?.meta;
        setHasMore(meta ? meta.hasMore : data.products.length >= 20);
      }
    } catch (err) {
      console.error("Load more products error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="animate-spin text-orange-500" size={32} />
        <p>Loading store...</p>
      </div>
    );
  }

  if (!store) return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500 text-lg">Store not found</p>
      <button onClick={() => navigate(-1)} className="text-orange-600 font-semibold bg-orange-50 px-4 py-2 rounded-xl">Go Back</button>
    </div>
  );

  const reviews = [
    { name: 'Ananya K.', rating: 5, text: 'Great selection and always in stock!', time: '3 days ago' },
    { name: 'Suresh N.', rating: 4, text: 'Quick pickup. Friendly staff.', time: '1 week ago' },
  ];

  // Derived properties with fallbacks
  const emoji = store.emoji || '🏪';
  const bgGradient = store.bgGradient || 'from-orange-100 to-amber-100';
  const rating = store.rating || 4.2;
  const reviewCount = store.reviewCount || 10;
  const distance = store.distance || 2.5;
  const pickupEta = store.pickupEta || 15;
  const isOpen = store.isOpen ?? true;
  const closeTime = store.closeTime || '9 PM';
  const openTime = store.openTime || '9 AM';
  const phone = store.phone || '+91 9999999999';
  const tags = store.tags || ['Grocery', 'Daily Needs'];
  const offers = store.offers || [];

  return (
    <>
      <div className="min-h-dvh bg-white pb-nav">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-gray-50">
          <button onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
          <h1 className="font-semibold text-sm truncate flex-1">{store.name}</h1>
        </div>

        {/* Banner */}
        <div className={`h-36 bg-gradient-to-br ${bgGradient} flex items-center justify-center relative`}>
          <span className="text-7xl">{emoji}</span>
        </div>

        <div className="px-4 -mt-6 relative z-10">
          <div className="bg-white rounded-2xl shadow-card p-4">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-3xl flex-shrink-0">
                {emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg">{store.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{store.address}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-0.5">
                    <Star size={10} className="fill-yellow-500 text-yellow-500" /> {rating} ({reviewCount})
                  </span>
                  <span className="flex items-center gap-0.5"><MapPin size={10} /> {distance} km</span>
                  <span className="flex items-center gap-0.5"><Clock size={10} /> {pickupEta} min</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {isOpen ? `Open until ${closeTime}` : `Closed · Opens at ${openTime}`}
              </span>
              {tags.map((t: string) => (
                <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{t}</span>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <a
                href={`tel:${phone}`}
                className="flex-1 flex items-center justify-center gap-1.5 bg-orange-50 text-orange-600 py-2 rounded-xl text-xs font-medium"
              >
                <Phone size={14} /> Call
              </a>
              {/* Directions button — opens map modal */}
              <button
                onClick={() => setShowMap(true)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 text-gray-600 py-2 rounded-xl text-xs font-medium hover:bg-gray-100 transition-colors"
              >
                <MapPin size={14} /> Directions
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 mt-6 space-y-5">
          {/* Offers */}
          {offers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">🎫 Store Offers</h3>
              <div className="space-y-2">
                {offers.map((o: string, i: number) => (
                  <div key={i} className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-2.5 text-xs text-orange-700 font-medium">
                    ⚡ {o}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">All Products ({storeProducts.length})</h3>
              <button
                onClick={() => navigate(`/search?q=${store.name}`)}
                className="text-xs text-orange-500 flex items-center gap-0.5"
              >
                <Search size={12} /> Search
              </button>
            </div>
            <div className="space-y-3">
              {storeProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            {storeProducts.length === 0 && (
              <div className="text-center py-10">
                <span className="text-4xl">📦</span>
                <p className="text-gray-400 text-sm mt-2">No products listed yet</p>
              </div>
            )}
            {hasMore && storeProducts.length > 0 && (
              <button onClick={loadMoreProducts}
                className="w-full bg-orange-50 text-orange-600 py-3 rounded-2xl text-sm font-semibold hover:bg-orange-100 transition-colors mt-3">
                Load More Products
              </button>
            )}
          </div>

          {/* Reviews */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Reviews</h3>
            <div className="space-y-3">
              {reviews.map((r, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.name}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: r.rating }).map((_, j) => (
                        <Star key={j} size={10} className="text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 ml-auto">{r.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Map Modal */}
      {showMap && (
        <MapModal
          store={{
            name: store.name,
            address: store.address,
            lat: Number(store.latitude) || undefined,
            lng: Number(store.longitude) || undefined,
          }}
          onClose={() => setShowMap(false)}
        />
      )}
    </>
  );
}