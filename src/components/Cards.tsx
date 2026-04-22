import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Clock, Star, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
export function ProductCard({ product }: { product: any }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toggle, isWished } = useWishlist();

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product.id, 1, product);
  };

  const emoji = product.emoji || '📦';
  const price = product.price || 0;
  const rating = product.rating || 4.2;
  const pickupEta = product.pickupEta || 10;
  const inStock = product.isAvailable ?? (product.stock > 0);

  return (
    <motion.div 
      whileTap={{ scale: 0.98 }} 
      onClick={() => navigate(`/product/${product.id}`)}
      className="bg-white rounded-2xl p-3 shadow-card cursor-pointer relative border border-[#f0ede9] flex flex-col h-full"
    >
      <button 
        onClick={(e) => { e.stopPropagation(); toggle(product.id); }} 
        className="absolute top-2 right-2 z-10 p-1.5"
      >
        <Heart size={16} className={isWished(product.id) ? 'fill-[#e63946] text-[#e63946]' : 'text-[#8e8e8e]'} />
      </button>

      <div className="w-full aspect-square bg-[#F8F6F3] rounded-xl flex items-center justify-center text-5xl mb-3">
        {emoji}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-[#1E1E1E] leading-tight line-clamp-2 mb-1">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-1 mb-2">
          <span className="text-[10px] flex items-center gap-0.5 text-[#8e8e8e]">
            <Star size={10} className="text-[#FF6A00] fill-[#FF6A00]" /> {rating}
          </span>
          <span className="text-[10px] text-[#8e8e8e]">•</span>
          <span className="text-[10px] text-[#FF6A00] font-medium bg-[#fff1e6] px-1.5 py-0.5 rounded-md">
            {pickupEta} min pickup
          </span>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-base font-bold text-[#1E1E1E]">₹{price}</span>
          <button 
            onClick={handleAdd} 
            disabled={!inStock}
            className="bg-white border border-[#FF6A00] text-[#FF6A00] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#fff1e6] transition-colors active:scale-95 disabled:opacity-50 disabled:border-[#8e8e8e] disabled:text-[#8e8e8e]"
          >
            + Add
          </button>
        </div>
      </div>
    </motion.div>
  );
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

export function StoreCard({ store }: { store: any }) {
  const navigate = useNavigate();
  const emoji = store.emoji || '🏪';
  const rating = store.rating || 4.3;
  
  let distance = store.distance || 1.2;
  const userCoords = JSON.parse(sessionStorage.getItem('prizzo_user_coords') || 'null');
  if (userCoords && store.latitude && store.longitude) {
    distance = calculateDistance(userCoords.lat, userCoords.lng, store.latitude, store.longitude);
  }

  const isOpen = store.isOpen ?? true;

  return (
    <motion.div 
      whileTap={{ scale: 0.98 }} 
      onClick={() => navigate(`/store/${store.id}`)}
      className="bg-white rounded-2xl p-3 shadow-card cursor-pointer border border-[#f0ede9] flex gap-4 items-center"
    >
      <div className="w-16 h-16 bg-[#F8F6F3] rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#1E1E1E] truncate">{store.name}</h3>
          <span className="text-[11px] font-bold text-[#FF6A00] bg-[#fff1e6] px-2 py-0.5 rounded-full">
            {distance} km away
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs">
          <span className="flex items-center gap-0.5 font-medium">
            <Star size={12} className="text-[#FF6A00] fill-[#FF6A00]" /> {rating}
          </span>
          <span className="text-[#8e8e8e]">•</span>
          <span className={isOpen ? 'text-[#1ab34e] font-semibold' : 'text-[#e63946] font-semibold'}>
            {isOpen ? 'Open Now' : 'Closed'}
          </span>
        </div>
      </div>
      <ChevronRight size={18} className="text-[#8e8e8e]" />
    </motion.div>
  );
}

export function ShimmerCard() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-card">
      <div className="shimmer h-32 rounded-xl mb-3" />
      <div className="shimmer h-4 rounded w-2/3 mb-2" />
      <div className="shimmer h-4 rounded w-1/2 mb-4" />
      <div className="flex justify-between items-center">
        <div className="shimmer h-6 rounded w-1/4" />
        <div className="shimmer h-8 rounded-lg w-1/4" />
      </div>
    </div>
  );
}
