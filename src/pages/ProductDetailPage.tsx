import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Star, Clock, MapPin, Share2, ShoppingCart, ChevronRight, BarChart3, Loader2, Zap, MapPinOff } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/Cards';
import { useToast } from '../components/Toast';
import { ProductDetailSkeleton } from '../components/Skeleton';
import api from '../services/api';
import { getProductImage } from '../utils/imageResolver';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toggle, isWished } = useWishlist();
  const toast = useToast();

  const [product, setProduct] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Smart Buy state ──
  const [smartBuyLoading, setSmartBuyLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // ── Request geolocation on mount ──
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError(null);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setLocationError(err.code === 1 ? 'Location access denied' : 'Location unavailable');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`);
        const payload = res.data?.data || res.data;
        
        if (res.data?.success || res.status === 200) {
          setProduct(payload.product);

          // Fetch similar products based on category
          const category = payload.product?.category;
          if (category) {
            const simRes = await api.get(`/products?category=${category}&limit=6`);
            const simPayload = simRes.data?.data || simRes.data;
            if (simRes.data?.success || simRes.status === 200) {
              setSimilar(simPayload.products?.filter((p: any) => p.id !== id) || []);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load product details", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProductDetails();
  }, [id]);

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <p className="text-gray-500 font-medium text-lg">Product not found</p>
      </div>
    );
  }

  // Derive missing UI fields safely
  const imageUrl = product.imageUrl || getProductImage(product.name, product.category);
  const brand = product.brand || 'Local Store';
  const mrp = product.mrp || product.price; // Backend doesn't have MRP yet
  const discount = product.discount || 0;
  const rating = product.rating || 4.5;
  const reviewCount = product.reviewCount || 12;
  const pickupEta = product.pickupEta || 15;
  const inStock = product.isAvailable ?? (product.stock > 0);
  const storeName = product.store?.name || 'Local Store';

  // TODO: Implement real reviews via GET /products/:id/reviews when backend is ready

  const handleAdd = async () => {
    const added = await addItem(product.id, 1, product);
    if (added) toast.show(`${product.name} added successfully`, 'success');
  };

  const handleSmartBuy = async () => {
    if (!userLocation) {
      toast.show('Enable location access to use Smart Buy', 'error');
      return;
    }

    try {
      setSmartBuyLoading(true);
      const res = await api.post('/orders/smart', {
        productId: product.id,
        quantity: 1,
        lat: userLocation.lat,
        lng: userLocation.lng,
      });

      const data = res.data?.data || res.data;
      if (data?.order) {
        const order = data.order;
        const store = data.selectedStore;
        const savings = data.savings || 0;

        const toastMsg = savings > 0
          ? `Bought from ${store.name} — saved ₹${savings}! 🎉`
          : `Order placed at ${store.name} (${store.distance}km away) ⚡`;
        toast.show(toastMsg, 'success');

        navigate('/order-success', {
          state: {
            orderId: order.id.slice(0, 8).toUpperCase(),
            storeName: store.name,
            pickupTime: `~${pickupEta} min`,
            total: order.totalAmount,
            items: 1,
          },
          replace: true,
        });
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'Smart Buy failed. Try again.';
      toast.show(errMsg, 'error');
    } finally {
      setSmartBuyLoading(false);
    }
  };

  const smartBuyDisabled = !inStock || !userLocation || smartBuyLoading;

  return (
    <div className="min-h-dvh bg-white pb-40">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-50">
        <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft size={20} /></button>
        <div className="flex gap-3">
          <button onClick={() => toggle(product.id)}>
            <Heart size={20} className={isWished(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
          </button>
          <Share2 size={20} className="text-gray-400" />
        </div>
      </div>

      {/* Product Image */}
      <div className="bg-white h-72 flex items-center justify-center p-8 relative overflow-hidden">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full relative z-10">
          <img 
            src={imageUrl} 
            alt={product.name} 
            className="w-full h-full object-contain mix-blend-multiply" 
            onError={(e: any) => {
              e.target.src = 'https://tse1.mm.bing.net/th?q=grocery+product&w=800&h=800&c=7&rs=1&p=0&dpr=1&pid=1.7&mkt=en-US&adlt=on';
              e.target.onerror = null;
            }}
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50" />
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Info */}
        <div>
          <p className="text-xs text-gray-400 font-medium">{brand}</p>
          <h1 className="text-xl font-bold mt-0.5">{product.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-2xl font-bold text-orange-600">₹{product.price}</span>
            {discount > 0 && (
              <>
                <span className="text-sm text-gray-400 line-through">₹{mrp}</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">{discount}% off</span>
              </>
            )}
          </div>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-xl text-xs font-medium text-yellow-700"><Star size={12} className="fill-yellow-500 text-yellow-500" /> {rating} ({reviewCount})</span>
          <span className="flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-xl text-xs font-medium text-blue-700"><Clock size={12} /> {pickupEta} min pickup</span>
          <span className={`px-3 py-1.5 rounded-xl text-xs font-medium ${inStock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {inStock ? `✓ In Stock (${product.stock})` : '✕ Out of Stock'}
          </span>
        </div>

        {/* Store info */}
        {product.storeId && (
          <motion.div whileTap={{ scale: 0.98 }} onClick={() => navigate(`/store/${product.storeId}`)}
            className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-semibold">{storeName}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10} /> Nearby • {pickupEta} min pickup</p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </motion.div>
        )}

        {/* Compare Nearby */}
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate('/compare')}
          className="w-full bg-orange-50 rounded-2xl p-4 flex items-center gap-3 cursor-pointer border border-orange-100">
          <BarChart3 size={20} className="text-orange-500" />
          <div className="text-left flex-1">
            <p className="text-sm font-semibold text-orange-700">Compare Nearby Prices</p>
            <p className="text-xs text-orange-400">See this item at other stores</p>
          </div>
          <ChevronRight size={16} className="text-orange-300" />
        </motion.button>

        {/* Description */}
        {product.description && (
          <div>
            <h3 className="text-sm font-semibold mb-2">About this product</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Reviews */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Reviews</h3>
          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <span className="text-3xl">💬</span>
            <p className="text-gray-400 text-sm mt-2">No reviews yet</p>
            <p className="text-xs text-gray-300 mt-1">Be the first to review this product!</p>
          </div>
        </div>

        {/* Similar Items */}
        {similar.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Similar Items</h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
              {similar.map(p => <ProductCard key={p.id} product={p} compact />)}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA — Dual Button Layout */}
      <div className="fixed left-0 right-0 w-full bg-white border-t border-gray-100 px-4 py-3 flex gap-3 z-40" style={{ bottom: '60px' }}>
        {/* Add to Cart (secondary) */}
        <button onClick={handleAdd} disabled={!inStock}
          className="flex-1 bg-white border-2 border-orange-500 text-orange-600 py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:border-gray-300 disabled:text-gray-300 transition-colors active:bg-orange-50"
          id="add-to-cart-btn">
          <ShoppingCart size={18} /> Add to Cart
        </button>

        {/* Smart Buy (primary) */}
        <button onClick={handleSmartBuy} disabled={smartBuyDisabled}
          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none transition-all active:scale-[0.98]"
          id="smart-buy-btn">
          {smartBuyLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : !userLocation ? (
            <><MapPinOff size={16} /> Enable Location</>
          ) : (
            <><Zap size={18} /> Smart Buy</>
          )}
        </button>
      </div>
    </div>
  );
}
