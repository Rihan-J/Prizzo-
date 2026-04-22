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
      className="bg-white rounded-xl p-3 shadow-md cursor-pointer relative border border-[#f0ede9] flex flex-col h-full hover:shadow-lg transition-shadow"
    >
      <button 
        onClick={(e) => { e.stopPropagation(); toggle(product.id); }} 
        className="absolute top-2 right-2 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm"
      >
        <Heart size={14} className={isWished(product.id) ? 'fill-[#e63946] text-[#e63946]' : 'text-[#8e8e8e]'} />
      </button>

      <div className="w-full aspect-square bg-[#F8F6F3] rounded-lg flex items-center justify-center text-6xl mb-4 group-hover:scale-105 transition-transform duration-300">
        {emoji}
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-[#1E1E1E] leading-tight line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center gap-1">
            <Star size={10} className="text-[#FF6A00] fill-[#FF6A00]" />
            <span className="text-[10px] font-bold text-[#1E1E1E]">{rating}</span>
            <span className="text-[10px] text-[#8e8e8e] ml-1">{pickupEta} min</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex flex-col">
            <span className="text-xs text-[#8e8e8e] font-medium">₹{price + 10}</span>
            <span className="text-lg font-black text-[#1E1E1E]">₹{price}</span>
          </div>
          <button 
            onClick={handleAdd} 
            disabled={!inStock}
            className="bg-[#fff1e6] text-[#FF6A00] text-xs font-black px-4 py-2 rounded-full hover:bg-[#ffe2cc] transition-colors active:scale-95 disabled:opacity-50"
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
      className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer border border-[#f0ede9] flex gap-4 items-center hover:shadow-md transition-shadow"
    >
      <div className="w-20 h-20 bg-[#F8F6F3] rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 border border-[#f0ede9]">
        {emoji}
      </div>
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-base text-[#1E1E1E] truncate">{store.name}</h3>
          <span className="text-xs font-black text-[#FF6A00] bg-[#fff1e6] px-3 py-1 rounded-full">
            {distance} km
          </span>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs font-bold">
          <span className="flex items-center gap-1">
            <Star size={12} className="text-[#FF6A00] fill-[#FF6A00]" /> {rating}
          </span>
          <span className="text-[#8e8e8e]">•</span>
          <span className={isOpen ? 'text-[#1ab34e]' : 'text-[#e63946]'}>
            {isOpen ? 'Open Now' : 'Closed'}
          </span>
        </div>
        <div className="mt-2 text-[10px] text-[#8e8e8e] font-medium flex items-center gap-1">
          <MapPin size={10} /> {store.address || 'Shivamogga, Karnataka'}
        </div>
      </div>
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
