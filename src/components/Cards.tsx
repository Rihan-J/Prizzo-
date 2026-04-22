import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Clock, Star, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
export function ProductCard({ product, compact }: { product: any; compact?: boolean }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toggle, isWished } = useWishlist();

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product.id, 1, product);
  };

  const emoji = product.emoji || '📦';
  const brand = product.brand || 'Local Brand';
  const mrp = product.mrp || product.price; // Backend doesn't have MRP yet
  const discount = product.discount || 0;
  const rating = product.rating || 4.5;
  const pickupEta = product.pickupEta || 15;
  const inStock = product.isAvailable ?? (product.stock > 0);
  const storeName = product.store?.name || 'Unknown Store';

  if (compact) {
    return (
      <motion.div whileTap={{ scale: 0.97 }} onClick={() => navigate(`/product/${product.id}`)}
        className="bg-white rounded-2xl p-3 shadow-card cursor-pointer relative min-w-[150px] snap-start border border-gray-50">
        <button onClick={(e) => { e.stopPropagation(); toggle(product.id); }} className="absolute top-2 right-2 z-10">
          <Heart size={16} className={isWished(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-300'} />
        </button>
        <div className="w-full h-20 bg-gray-50 rounded-xl flex items-center justify-center text-3xl mb-2">{emoji}</div>
        <p className="text-xs text-gray-500 truncate">{brand}</p>
        <p className="text-sm font-semibold truncate">{product.name}</p>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-sm font-bold text-orange-600">₹{product.price}</span>
          {discount > 0 && <span className="text-xs text-gray-400 line-through">₹{mrp}</span>}
        </div>
        <button onClick={handleAdd} className="mt-2 w-full bg-orange-50 text-orange-600 text-xs font-semibold py-1.5 rounded-xl hover:bg-orange-100 transition-colors">ADD</button>
      </motion.div>
    );
  }

  return (
    <motion.div whileTap={{ scale: 0.98 }} onClick={() => navigate(`/product/${product.id}`)}
      className="bg-white rounded-2xl p-4 shadow-card cursor-pointer relative flex gap-3 border border-gray-50">
      <button onClick={(e) => { e.stopPropagation(); toggle(product.id); }} className="absolute top-3 right-3 z-10">
        <Heart size={18} className={isWished(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-300'} />
      </button>
      <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">{emoji}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{brand}</p>
        <p className="font-semibold text-sm truncate">{product.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-bold text-orange-600">₹{product.price}</span>
          {discount > 0 && (
            <>
              <span className="text-xs text-gray-400 line-through">₹{mrp}</span>
              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">{discount}% off</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
          <span className="flex items-center gap-0.5"><Star size={10} className="text-yellow-500 fill-yellow-500" />{rating}</span>
          <span className="flex items-center gap-0.5"><Clock size={10} />{pickupEta} min</span>
          <span className={`font-medium ${inStock ? 'text-green-600' : 'text-red-500'}`}>{inStock ? 'In Stock' : 'Out of Stock'}</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{storeName}</p>
      </div>
      <button onClick={handleAdd} disabled={!inStock} className="self-end bg-orange-500 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 transition-colors flex-shrink-0">
        ADD
      </button>
    </motion.div>
  );
}

export function StoreCard({ store }: { store: any }) {
  const navigate = useNavigate();
  const emoji = store.emoji || '🏪';
  const rating = store.rating || 4.2;
  const distance = store.distance || 2.5;
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
