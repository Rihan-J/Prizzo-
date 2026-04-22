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
      className="bg-white rounded-[24px] p-4 shadow-lg cursor-pointer relative border border-[#f0ede9] flex flex-col h-full hover:shadow-xl transition-all duration-300 group"
    >
      {/* Wishlist Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); toggle(product.id); }} 
        className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-[#f0ede9]"
      >
        <Heart size={16} className={isWished(product.id) ? 'fill-[#e63946] text-[#e63946]' : 'text-[#8e8e8e]'} />
      </button>

      {/* Product Image Area */}
      <div className="w-full aspect-[4/3] bg-[#F8F6F3] rounded-[20px] flex items-center justify-center text-7xl mb-5 group-hover:scale-105 transition-transform duration-500 shadow-inner">
        {emoji}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-[15px] font-[900] text-[#1E1E1E] leading-[1.3] line-clamp-2 tracking-tight">
            {product.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center gap-0.5 bg-[#FF6A00]/10 px-2 py-0.5 rounded-lg">
              <Star size={12} className="text-[#FF6A00] fill-[#FF6A00]" />
              <span className="text-[11px] font-black text-[#FF6A00]">{rating}</span>
            </div>
            <span className="text-[11px] text-[#8e8e8e] font-bold">• {pickupEta} MINS</span>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col -space-y-1">
             <span className="text-[11px] text-[#8e8e8e] font-bold line-through opacity-60">₹{price + 15}</span>
             <span className="text-[20px] font-[900] text-[#1E1E1E] tracking-tighter">₹{price}</span>
          </div>
          <button 
            onClick={handleAdd} 
            disabled={!inStock}
            className="bg-[#fff1e6] text-[#FF6A00] text-[13px] font-[900] px-5 py-2.5 rounded-full hover:bg-[#ffe2cc] transition-all active:scale-90 disabled:opacity-40 shadow-sm border border-[#FF6A00]/10"
          >
            + ADD
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
      className="bg-white rounded-[24px] p-5 shadow-lg cursor-pointer border border-[#f0ede9] flex gap-5 items-center hover:shadow-xl transition-all"
    >
      <div className="w-24 h-24 bg-[#F8F6F3] rounded-[22px] flex items-center justify-center text-5xl flex-shrink-0 border border-[#f0ede9] shadow-inner">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-[900] text-[17px] text-[#1E1E1E] truncate tracking-tight">{store.name}</h3>
          <span className="text-[11px] font-black text-[#FF6A00] bg-[#fff1e6] px-3 py-1 rounded-full border border-[#FF6A00]/10">
            {distance} KM
          </span>
        </div>
        <div className="flex items-center gap-4 text-[12px] font-black">
          <span className="flex items-center gap-1 text-[#1E1E1E]">
            <Star size={13} className="text-[#FF6A00] fill-[#FF6A00]" /> {rating}
          </span>
          <span className="text-[#8e8e8e] opacity-40">•</span>
          <span className={isOpen ? 'text-[#1ab34e]' : 'text-[#e63946]'}>
            {isOpen ? 'OPEN NOW' : 'CLOSED'}
          </span>
        </div>
        <div className="mt-3 text-[11px] text-[#8e8e8e] font-bold flex items-center gap-1.5 opacity-80 uppercase tracking-wider">
          <MapPin size={12} className="text-[#FF6A00]" /> {store.address?.split(',')[0] || 'SHIVAMOGGA'}
        </div>
      </div>
      <div className="w-10 h-10 bg-[#F8F6F3] rounded-full flex items-center justify-center text-[#8e8e8e] border border-[#f0ede9]">
         <ChevronRight size={20} />
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
