import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Star, Clock, MapPin, Share2, ShoppingCart, ChevronRight, BarChart3, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/Cards';
import Toast, { useToast } from '../components/Toast';
import api from '../services/api';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toggle, isWished } = useWishlist();
  const toast = useToast();

  const [product, setProduct] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-white text-gray-500 gap-3">
        <Loader2 className="animate-spin text-orange-500" size={32} />
        <p>Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <p className="text-gray-500 font-medium text-lg">Product not found</p>
      </div>
    );
  }

  // Derive missing UI fields safely
  const emoji = product.emoji || '📦';
  const brand = product.brand || 'Local Brand';
  const mrp = product.mrp || product.price; // Backend doesn't have MRP yet
  const discount = product.discount || 0;
  const rating = product.rating || 4.5;
  const reviewCount = product.reviewCount || 12;
  const pickupEta = product.pickupEta || 15;
  const inStock = product.isAvailable ?? (product.stock > 0);
  const storeName = product.store?.name || 'Local Store';

  const reviews = [
    { name: 'Rahul S.', rating: 5, text: 'Excellent quality! Picked up within 10 minutes.', time: '2 days ago' },
    { name: 'Priya M.', rating: 4, text: 'Good product. Store was easy to find.', time: '5 days ago' },
    { name: 'Karthik R.', rating: 5, text: 'Best price in town. Love the compare feature!', time: '1 week ago' },
  ];

  const handleAdd = async () => {
    try {
      await addItem(product.id, 1);
      toast.show('Added to cart!', 'success');
    } catch (e) {
      // CartContext alerts internally but we do it gracefully here
    }
  };

  return (
    <div className="min-h-dvh bg-white pb-32">
      <Toast message={toast.message} visible={toast.visible} onClose={toast.hide} type={toast.type} />

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
      <div className="bg-gray-50 h-56 flex items-center justify-center">
        <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-8xl">{emoji}</motion.span>
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
          <div className="space-y-3">
            {reviews.map((r, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{r.name}</span>
                  <div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, j) => <Star key={j} size={10} className="text-yellow-500 fill-yellow-500" />)}</div>
                  <span className="text-xs text-gray-400 ml-auto">{r.time}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{r.text}</p>
              </div>
            ))}
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

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-100 px-4 py-3 flex gap-3 z-40">
        <button onClick={handleAdd} disabled={!inStock}
          className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-orange disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none">
          <ShoppingCart size={18} /> Add to Cart
        </button>
      </div>
    </div>
  );
}
