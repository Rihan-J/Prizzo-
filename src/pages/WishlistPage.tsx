import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/Cards';
import { motion } from 'framer-motion';
import api from '../services/api';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { ids } = useWishlist();
  const [wished, setWished] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        if (ids.length === 0) {
          setWished([]);
          return;
        }

        // For demo purposes, we fetch latest products and filter
        // A real app would send ids[] to the backend
        const res = await api.get('/products?limit=100');
        if (res.data?.success) {
          setWished(res.data.products.filter((p: any) => ids.includes(p.id)));
        }
      } catch (error) {
        console.error("Failed to load wishlist", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [ids]);

  return (
    <div className="min-h-dvh bg-gray-50 pb-nav">
      <div className="sticky top-0 z-30 bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 className="font-bold text-lg">Wishlist {!loading && `(${wished.length})`}</h1>
      </div>
      <div className="px-4 mt-4 space-y-3">
        {loading ? (
           <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
             <Loader2 size={32} className="animate-spin text-orange-400" />
           </div>
        ) : (
          <>
            {wished.map(p => <ProductCard key={p.id} product={p} />)}
            {wished.length === 0 && (
              <div className="text-center py-16">
                <motion.span initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-6xl inline-block">💖</motion.span>
                <p className="text-gray-500 mt-4 font-medium">Your wishlist is empty</p>
                <p className="text-xs text-gray-400 mt-1">Tap the heart on any product to save it here.</p>
                <button onClick={() => navigate('/')} className="mt-6 bg-orange-500 text-white px-6 py-3 rounded-2xl font-semibold text-sm shadow-orange">
                  Explore Products
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
