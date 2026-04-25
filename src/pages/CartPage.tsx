import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Trash2, Tag, ShoppingBag, Clock } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartPage({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const { items, updateQty, removeItem, selectItem, clearCart, selectedSubtotal, selectedItems, totalSavings, totalItems } = useCart();
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  const charges = Math.round(selectedSubtotal * 0.02);
  const discount = couponApplied ? Math.round(selectedSubtotal * 0.1) : 0;
  const total = selectedSubtotal + charges - discount;
  const allSelected = items.length > 0 && items.every(item => item.isSelected);

  const toggleSelectAll = async () => {
    const nextSelected = !allSelected;
    await Promise.all(items.map(item => selectItem(item.id, nextSelected)));
  };

  // Group by store
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.storeId]) acc[item.storeId] = { storeName: item.storeName, items: [] };
    acc[item.storeId].items.push(item);
    return acc;
  }, {} as Record<string, { storeName: string; items: typeof items }>);

  if (items.length === 0) {
    return (
      <div className={`${embedded ? 'min-h-[55vh]' : 'min-h-dvh'} flex flex-col items-center justify-center px-8 pb-24`}>
        <motion.span initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-7xl">🛒</motion.span>
        <h2 className="text-xl font-bold mt-6">Your cart is empty</h2>
        <p className="text-gray-400 text-sm mt-2 text-center">
          Explore nearby stores and add items to start building your order.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 bg-orange-500 text-white px-8 py-3 rounded-2xl font-semibold"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  // Checkout bar height ~88px + bottom nav ~80px + 8px gap = 176px → pb-44 (176px)
  return (
    <div className={embedded ? "bg-gray-50" : "min-h-dvh bg-gray-50"}>

      {/* ── Sticky Header ── */}
      {!embedded && <div className="sticky top-0 z-30 bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg">Cart ({totalItems})</h1>
        </div>
        <button onClick={clearCart} className="text-xs text-red-400 font-medium px-2 py-1">
          Clear All
        </button>
      </div>}

      {/* ── Scrollable body ──
          pb = checkout bar (~88px) + bottom nav (80px) + breathing room (16px) = 184px ≈ pb-48 */}
      <div className="px-4 pt-4 pb-48 space-y-4">
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="h-5 w-5 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
            />
            <span className="text-sm font-semibold">Select All</span>
          </label>
          <span className="text-xs text-gray-400">{selectedItems} selected</span>
        </div>

        {/* Store groups */}
        {Object.entries(grouped).map(([storeId, group]) => (
          <div key={storeId} className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
              <p className="text-sm font-semibold text-orange-700">🏪 {group.storeName}</p>
              <p className="text-xs text-orange-400 flex items-center gap-1 mt-0.5">
                <Clock size={10} />
                ~{Math.max(...group.items.map(i => i.pickupEta))} min pickup
              </p>
            </div>

            <AnimatePresence>
              {group.items.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  exit={{ opacity: 0, x: -80 }}
                  className="px-4 py-3 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.isSelected}
                      onChange={(e) => selectItem(item.id, e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-gray-300 text-orange-500 focus:ring-orange-400 flex-shrink-0"
                    />
                    <span className="text-2xl flex-shrink-0 mt-0.5">{item.emoji}</span>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug line-clamp-2">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-orange-600">₹{item.price}</span>
                        {item.mrp > item.price && (
                          <span className="text-xs text-gray-400 line-through">₹{item.mrp}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="text-sm font-semibold w-5 text-center tabular-nums">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors ml-0.5"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}

        {/* Coupon */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={16} className="text-orange-500" />
            <span className="text-sm font-semibold">Apply Coupon</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter coupon code"
              value={coupon}
              onChange={e => setCoupon(e.target.value)}
              className="flex-1 min-w-0 bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              onClick={() => { if (coupon.trim()) setCouponApplied(true); }}
              className="bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0"
            >
              Apply
            </button>
          </div>
          {couponApplied && (
            <p className="text-xs text-green-600 mt-2">✅ Coupon applied! 10% discount added.</p>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2.5">
          <h3 className="text-sm font-semibold">Order Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium">₹{selectedSubtotal}</span>
          </div>
          {totalSavings > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Savings</span>
              <span className="text-green-600 font-medium">-₹{totalSavings}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Handling charges</span>
            <span className="font-medium">₹{charges}</span>
          </div>
          {couponApplied && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Coupon discount</span>
              <span className="text-green-600 font-medium">-₹{discount}</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold text-base">
            <span>Total</span>
            <span className="text-orange-600">₹{total}</span>
          </div>
        </div>

      </div>

      {/* ── Checkout bar ──
          Sits at bottom: 80px (your nav height) so it floats perfectly above the nav bar.
          If your BottomNav uses env(safe-area-inset-bottom), change 80px to match exactly. -->  */}
      <div
        className="fixed left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 pt-3 pb-4"
        style={{ bottom: '80px' }}
      >
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-lg font-bold">₹{total}</p>
            {(totalSavings + discount) > 0 && (
              <p className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                You save ₹{totalSavings + discount}!
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/checkout')}
            disabled={selectedItems === 0}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none disabled:text-gray-500"
          >
            <ShoppingBag size={18} />
            {selectedItems > 0 ? `Checkout (${selectedItems} item${selectedItems > 1 ? 's' : ''})` : 'Select items to proceed'}
          </button>
        </div>
      </div>

    </div>
  );
}
