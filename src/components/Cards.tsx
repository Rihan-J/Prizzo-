import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Clock, Star, ChevronRight, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from './Toast';
import { getProductImage } from '../utils/imageResolver';

export function ProductCard({ product, compact }: { product: any; compact?: boolean }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toggle, isWished } = useWishlist();
  const toast = useToast();

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = await addItem(product.id, 1, product);
    if (added) toast.show(`${product.name} added successfully`, 'success');
  };

  const imageUrl = product.imageUrl || getProductImage(product.name, product.category);
  const brand = product.brand || 'Local Store';
  const mrp = product.mrp || product.price;
  const discount = product.discount || 0;
  const rating = product.rating || 4.5;
  const pickupEta = product.pickupEta || 15;
  const inStock = product.isAvailable ?? (product.stock > 0);
  const storeName = product.store?.name || 'Local Shop';

  if (compact) {
    return (
      <motion.div whileTap={{ scale: 0.97 }} onClick={() => navigate(`/product/${product.id}`)}
        className="bg-white rounded-2xl p-3 shadow-card cursor-pointer relative min-w-[160px] snap-start border border-gray-50 flex flex-col group">
        <button onClick={(e) => { e.stopPropagation(); toggle(product.id); }} className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <Heart size={14} className={isWished(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
        </button>
        <div className="w-full h-28 bg-gray-50 rounded-xl overflow-hidden mb-2 relative">
          <img src={imageUrl} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" loading="lazy" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{brand}</p>
          <p className="text-sm font-bold text-gray-800 truncate leading-tight mt-0.5">{product.name}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-sm font-extrabold text-orange-600">₹{product.price}</span>
            {discount > 0 && <span className="text-[10px] text-gray-300 line-through">₹{mrp}</span>}
          </div>
        </div>
        <button onClick={handleAdd} className="mt-3 w-full bg-orange-500 text-white text-[11px] font-bold py-2 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5">
          <ShoppingCart size={12} /> ADD
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div whileTap={{ scale: 0.98 }} onClick={() => navigate(`/product/${product.id}`)}
      className="bg-white rounded-2xl p-4 shadow-card cursor-pointer relative flex gap-4 border border-gray-50 group hover:border-orange-200 transition-colors">
      <button onClick={(e) => { e.stopPropagation(); toggle(product.id); }} className="absolute top-3 right-3 z-10 p-2 bg-gray-50 rounded-full hover:bg-white transition-colors">
        <Heart size={18} className={isWished(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-300'} />
      </button>
      <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 relative">
        <img 
          src={imageUrl} 
          alt={product.name} 
          className="w-full h-full object-contain mix-blend-multiply" 
          loading="lazy" 
          onError={(e: any) => {
            e.target.src = 'https://tse1.mm.bing.net/th?q=grocery+product&w=800&h=800&c=7&rs=1&p=0&dpr=1&pid=1.7&mkt=en-US&adlt=on';
            e.target.onerror = null;
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{brand}</p>
        <p className="font-bold text-base text-gray-800 truncate mt-0.5">{product.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-lg font-extrabold text-orange-600">₹{product.price}</span>
          {discount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300 line-through">₹{mrp}</span>
              <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-black uppercase">{discount}% OFF</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 mt-2 text-[10px] font-semibold">
          <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100">
            <Star size={10} className="fill-yellow-600" />{rating}
          </span>
          <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
            <Clock size={10} />{pickupEta} min
          </span>
          <span className={`px-2 py-0.5 rounded-lg border ${inStock ? 'text-green-600 bg-green-50 border-green-100' : 'text-red-500 bg-red-50 border-red-100'}`}>
            {inStock ? 'IN STOCK' : 'OUT OF STOCK'}
          </span>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 font-medium flex items-center gap-1">
          <MapPin size={10} /> {storeName}
        </p>
      </div>
      <button onClick={handleAdd} disabled={!inStock} 
        className="self-center bg-orange-500 hover:bg-orange-600 text-white text-xs font-black px-5 py-3 rounded-2xl shadow-lg shadow-orange-500/20 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none transition-all flex items-center gap-2">
        <ShoppingCart size={14} /> ADD
      </button>
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
  const rating = store.rating || 4.2;
  
  // Calculate real distance if lat/lng available
  let distance = store.distance || 2.5;
  const userCoords = JSON.parse(sessionStorage.getItem('prizzo_user_coords') || 'null');
  if (userCoords && store.latitude && store.longitude) {
    distance = calculateDistance(userCoords.lat, userCoords.lng, store.latitude, store.longitude);
  }

  const pickupEta = store.pickupEta || 15;
  const isOpen = store.isOpen ?? true;
  const bgGradient = store.bgGradient || 'from-orange-100 to-amber-100';

  return (
    <motion.div whileTap={{ scale: 0.97 }} onClick={() => navigate(`/store/${store.id}`)}
      className="bg-white rounded-2xl overflow-hidden shadow-card cursor-pointer min-w-[200px] snap-start border border-gray-50">
      <div className={`h-20 bg-gradient-to-br ${bgGradient} flex items-center justify-center text-4xl`}>{emoji}</div>
      <div className="p-3">
        <p className="font-semibold text-sm truncate">{store.name}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
          <span className="flex items-center gap-0.5"><Star size={10} className="text-yellow-500 fill-yellow-500" />{rating}</span>
          <span className="flex items-center gap-0.5"><MapPin size={10} />{distance} km</span>
          <span className="flex items-center gap-0.5"><Clock size={10} />{pickupEta} min</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {isOpen ? 'Open' : 'Closed'}
          </span>
          <ChevronRight size={14} className="text-gray-300" />
        </div>
      </div>
    </motion.div>
  );
}

export function ShimmerCard() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-card">
      <div className="shimmer h-20 rounded-xl mb-3" />
      <div className="shimmer h-3 rounded w-2/3 mb-2" />
      <div className="shimmer h-3 rounded w-1/2 mb-2" />
      <div className="shimmer h-8 rounded-xl w-full mt-2" />
    </div>
  );
}
