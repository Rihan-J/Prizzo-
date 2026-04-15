import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CreditCard, Wallet, Banknote, Smartphone, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../services/api';

const slots = ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '2:00 PM', '3:00 PM'];
const methods = [
  { id: 'store', label: 'Pay at Store', icon: Banknote, desc: 'Cash or card at pickup' },
  { id: 'upi', label: 'UPI', icon: Smartphone, desc: 'GPay / PhonePe / Paytm' },
  { id: 'card', label: 'Card', icon: CreditCard, desc: 'Credit / Debit card' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, desc: 'Prizzo Wallet' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, totalSavings, fetchCart } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [slot, setSlot] = useState(slots[2]);
  const [payment, setPayment] = useState('store');
  const [loading, setLoading] = useState(false);

  const charges = Math.round(subtotal * 0.02);
  const total = subtotal + charges;

  const handleConfirm = async () => {
    if (items.length === 0) return alert("Your cart is empty!");
    
    try {
      setLoading(true);
      const res = await api.post('/orders');
      
      // Handle standardized response format
      const data = res.data?.data || res.data;
      if (data?.order) {
        const order = data.order;
        await fetchCart(); 
        
        navigate('/order-success', { 
          state: { 
            orderId: order.id.slice(0, 8).toUpperCase(), 
            storeName: 'Local Store', 
            pickupTime: slot, 
            total: order.totalAmount, 
            items: items.length 
          }, 
          replace: true 
        });
      }
    } catch (error: any) {
      alert(error.response?.data?.error || "Checkout failed. Please try again.");
      await fetchCart(); // Sync frontend with backend to fix stale cart state
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gray-50 pb-48">
      <div className="sticky top-0 z-30 bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 className="font-bold text-lg">Checkout</h1>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Pickup Details */}
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <h3 className="text-sm font-semibold mb-3">Pickup Person</h3>
          <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 mb-3" />
          <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)}
            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400" />
        </div>

        {/* Pickup Slot */}
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Clock size={14} /> Select Pickup Slot</h3>
          <div className="grid grid-cols-3 gap-2">
            {slots.map(s => (
              <button key={s} onClick={() => setSlot(s)}
                className={`py-2.5 rounded-xl text-xs font-medium transition-all ${slot === s ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-50 text-gray-600'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <h3 className="text-sm font-semibold mb-3">Payment Method</h3>
          <div className="space-y-2">
            {methods.map(m => (
              <button key={m.id} onClick={() => setPayment(m.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${payment === m.id ? 'bg-orange-50 border-2 border-orange-400' : 'bg-gray-50 border-2 border-transparent'}`}>
                <m.icon size={20} className={payment === m.id ? 'text-orange-500' : 'text-gray-400'} />
                <div className="text-left">
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="text-xs text-gray-400">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-card space-y-2">
          <h3 className="text-sm font-semibold mb-2">Order Summary</h3>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Items ({items.length})</span><span>₹{subtotal}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Platform Fee</span><span>₹{charges}</span></div>
          {totalSavings > 0 && <div className="flex justify-between text-sm"><span className="text-green-600">Savings</span><span className="text-green-600">-₹{totalSavings}</span></div>}
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold"><span>Total</span><span className="text-orange-600">₹{total}</span></div>
        </div>
      </div>

      <div className="fixed left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 pt-3 pb-4" style={{ bottom: '80px' }}>
        <button onClick={handleConfirm} disabled={loading || items.length === 0}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl font-semibold shadow-orange text-base flex justify-center items-center gap-2 disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none">
          {loading ? <Loader2 size={20} className="animate-spin" /> : `Confirm Order — ₹${total}`}
        </button>
      </div>
    </div>
  );
}
