import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, Loader2, CheckCircle, Package, Receipt, ChefHat, AlertCircle, Star, Info, Sparkles } from 'lucide-react';
import api from '../services/api';
const GlobalStyles = () => (
  <style>{`
    @keyframes slide {
      from { background-position: 0 0; }
      to { background-position: 48px 0; }
    }
  `}</style>
);
export default function OrderTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const res = await api.get('/orders/user'); 
        const responseData = res.data?.data || res.data;
        if (responseData?.orders) {
          const found = responseData.orders.find((o: { id: string }) => o.id === id);
          if (found) setOrder(found);
        }
      } catch (error: any) {
        console.error("Failed to fetch order", error);
        setFetchError(error.message === 'Network Error' ? 'Cannot connect to backend server. Please check your connection.' : 'Failed to load order details.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);
  const handleRatingSubmit = async (rating: number) => {
    setUserRating(rating);
    try {
      setIsSubmitting(true);
      await api.post(`/orders/${id}/review`, { rating });
      setReviewSubmitted(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const preparationTips = [
    "Our chefs are hand-picking the freshest ingredients for you.",
    "Did you know? Our store uses 100% biodegradable packaging.",
    "Your order is being double-checked for quality and quantity.",
    "We're almost there! Your package is being sealed with hygiene.",
    "Great choice! This is one of our most popular items today."
  ];
  const [tipIndex, setTipIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % preparationTips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [preparationTips.length]);
  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 text-gray-500">
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p>Loading order details...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-4 text-center">
        <AlertCircle size={48} className="text-red-400" />
        <p className="text-gray-700 font-medium">{fetchError}</p>
        <p className="text-xs text-gray-400 max-w-xs block">If you are using a mobile phone, verify that your deployed app isn't trying to connect to localhost.</p>
        <button onClick={() => window.location.reload()} className="bg-orange-50 text-orange-600 px-6 py-2 rounded-xl font-medium mt-2">Retry</button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
        <AlertCircle size={48} className="text-gray-300" />
        <p className="text-gray-500">Order not found</p>
        <button onClick={() => navigate('/orders')} className="bg-orange-50 text-orange-600 px-6 py-2 rounded-xl font-medium">Go Back</button>
      </div>
    );
  }
  if (order.status === 'CANCELLED') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-white p-8 text-center">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-2">
          <AlertCircle size={48} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 leading-tight">Order Cancelled</h1>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">This order was cancelled. If you have any questions, please contact our support team.</p>
        <div className="flex flex-col w-full gap-3 mt-4">
           <button onClick={() => navigate('/orders')} className="w-full bg-gray-900 text-white px-8 py-3.5 rounded-2xl font-bold active:scale-95 transition-all shadow-lg">Back to Orders</button>
           <button className="w-full text-gray-500 font-bold py-2">Contact Support</button>
        </div>
      </div>
    );
  }
  const timelineSteps = [
    { id: 'CONFIRMED', label: 'Order Confirmed', time: new Date(order.createdAt as string).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), icon: CheckCircle },
    { id: 'PREPARING', label: 'Preparing', time: 'Usually takes 10-15 mins', icon: ChefHat },
    { id: 'READY', label: 'Ready for Pickup', time: 'Waiting for pickup', icon: Package },
    { id: 'COMPLETED', label: 'Completed', time: 'Delivered successfully', icon: CheckCircle },
  ];
  const currentStatusIndex = timelineSteps.findIndex(s => s.id === order.status);
  
  return (
    <>
    <GlobalStyles />
    <div className="min-h-screen bg-gray-50 pb-12 relative w-full overflow-x-hidden">
      {/* Header */}
      <div className="fixed top-0 inset-x-0 z-40 flex justify-center pointer-events-none p-2 md:p-0">
        <div className="w-full max-w-3xl bg-white/90 backdrop-blur-lg border border-gray-100 rounded-2xl md:rounded-none md:border-x-0 md:border-t-0 flex items-center justify-between px-3 md:px-6 py-2 md:py-4 pointer-events-auto shadow-sm">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <button onClick={() => navigate('/orders')} className="min-w-[40px] w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:scale-90 transition-all rounded-xl">
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 md:gap-2 overflow-hidden">
                <h1 className="font-extrabold text-xs md:text-sm text-gray-900 truncate">{(order.store as { name: string })?.name || 'Local Store'}</h1>
                <span className="shrink-0 w-1 h-1 bg-gray-300 rounded-full" />
                <p className="shrink-0 text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-wider">{(order.id as string).slice(0,8)}</p>
              </div>
              <p className="text-[9px] md:text-[10px] text-green-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live Status
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0 ml-2">
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `Tracking my order from ${(order.store as { name: string })?.name || 'Prizzo'}`,
                    text: `My order ${(order.id as string).slice(0,8)} is currently ${(order.status as string).toLowerCase()}`,
                    url: window.location.href
                  }).catch(console.error);
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Tracking link copied to clipboard!');
                }
              }}
              className="w-9 h-9 flex items-center justify-center bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-colors shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </button>
            <button className="text-orange-600 text-[10px] md:text-xs font-black bg-orange-50 hover:bg-orange-100 transition-colors px-3 md:px-5 py-2 md:py-2.5 rounded-xl border border-orange-100 shadow-sm">Support</button>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto w-full md:grid md:grid-cols-2 md:gap-8 md:px-6 md:pt-28 pt-20 px-4">
        
        {/* Preparation Visual Section (Self-Pickup Dashboard) */}
        <div className="min-h-[360px] h-auto md:h-[calc(100vh-10rem)] w-full bg-white relative z-10 rounded-3xl md:order-2 md:sticky md:top-28 flex flex-col items-center justify-center p-6 py-10 md:py-6 space-y-8 border border-gray-100 shadow-card">
          <div className="relative shrink-0">
             <motion.div 
               animate={{ 
                 scale: [1, 1.05, 1],
                 rotate: [0, 1, -1, 0]
               }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="w-40 h-40 md:w-56 md:h-56 bg-orange-50 rounded-full flex items-center justify-center shadow-inner border border-orange-100/50"
             >
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-orange-200 animate-[spin_15s_linear_infinite]" />
                {order.status === 'READY' ? (
                  <Package size={64} className="text-orange-500 md:w-24 md:h-24" />
                ) : order.status === 'COMPLETED' ? (
                  <CheckCircle size={64} className="text-green-500 md:w-24 md:h-24" />
                ) : (
                  <ChefHat size={64} className="text-orange-500 animate-bounce md:w-24 md:h-24" />
                )}
             </motion.div>
             <motion.div
               animate={{ scale: [1, 1.15, 1] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute top-0 right-0 md:-top-2 md:-right-2 bg-gradient-to-br from-orange-500 to-orange-700 text-white p-3 rounded-2xl shadow-[0_4px_15px_rgba(249,115,22,0.3)] border-2 border-white shrink-0"
             >
                <Sparkles size={16} />
             </motion.div>
          </div>
          <div className="text-center space-y-2.5 max-w-[280px] md:max-w-none shrink-0">
            <h3 className="font-extrabold text-2xl md:text-3xl text-gray-900 leading-tight tracking-tight">
              {order.status === 'READY' ? "It's Ready! 🎉" : order.status === 'COMPLETED' ? "Enjoy your items! ✨" : "Packing with love... 🧡"}
            </h3>
            <p className="text-gray-500 text-xs md:text-sm font-semibold opacity-70 leading-relaxed">
              {order.status === 'READY' ? "Your order is packed and waiting for you." : order.status === 'COMPLETED' ? "Hope you loved our delicious items." : "Our chefs are perfecting your order right now."}
            </p>
          </div>
          <div className="w-full bg-gray-50/80 rounded-2xl p-4 border border-gray-200/50 flex items-start gap-4 shrink-0">
             <div className="bg-white p-2.5 rounded-xl text-orange-500 shadow-sm border border-orange-100/30 shrink-0">
                <Info size={18} />
             </div>
             <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">Chef's Note</p>
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={tipIndex}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-xs text-gray-700 font-bold leading-relaxed pr-2"
                  >
                    {preparationTips[tipIndex]}
                  </motion.p>
                </AnimatePresence>
             </div>
          </div>
          
          {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
            <div className="w-full px-1 shrink-0">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-black text-gray-900 tracking-wide uppercase opacity-50">Overall Progress</span>
                <span className="text-[11px] font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100 shadow-sm">
                  {(currentStatusIndex + 1) * 25}% Completed
                </span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200/50 p-[2px]">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${(currentStatusIndex + 1) * 25}%` }}
                   className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-full relative"
                 >
                    <div 
                      className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:32px_32px]"
                      style={{ animation: 'slide 1.5s linear infinite' }}
                    />
                 </motion.div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-8 md:mt-0 relative z-20 space-y-6 md:order-1 flex flex-col">
          {/* Tracker Card */}
          <div className="bg-white rounded-3xl p-6 shadow-card">
            <h2 className="font-bold text-lg mb-6 text-gray-900">Track Order</h2>
            <div className="relative">
              <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-gray-100" />
              <div className="space-y-6">
                {timelineSteps.map((step, idx) => {
                  const isCompleted = currentStatusIndex >= idx;
                  const isCurrent = currentStatusIndex === idx;
                  const activeColor = isCompleted ? 'text-orange-500' : 'text-gray-300';
                  const activeBorder = isCompleted ? 'border-orange-500' : 'border-gray-200';
                  
                  return (
                    <div key={step.id} className="relative flex items-start gap-4">
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 ${activeBorder} ${isCompleted ? 'bg-white' : 'bg-gray-50'} ${activeColor}`}>
                         {isCompleted && idx < currentStatusIndex ? (
                           <div className="w-full h-full bg-orange-500 text-white rounded-full flex items-center justify-center">
                             <CheckCircle size={20} />
                           </div>
                         ) : (
                           <step.icon size={20} className={isCurrent ? 'animate-pulse text-orange-500' : ''} />
                         )}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className={`font-bold text-sm ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{step.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {currentStatusIndex >= 0 && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${(currentStatusIndex / (timelineSteps.length - 1)) * 100}%` }}
                  className="absolute left-[19px] top-4 w-[2px] bg-orange-500 origin-top z-0"
                />
              )}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-card flex items-center justify-between border border-gray-50 hover:shadow-lg transition-shadow">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-blue-100/50">🏪</div>
                <div>
                   <p className="font-extrabold text-base text-gray-900">{(order.store as { name: string })?.name || 'Local Store'}</p>
                   <p className="text-xs text-gray-500 mt-1 font-medium">Preparing your items</p>
                </div>
             </div>
             <a href={`tel:${(order.store as { phone: string })?.phone || '+919999999999'}`} className="w-12 h-12 bg-green-50 hover:bg-green-100 text-green-600 rounded-2xl flex items-center justify-center transition-all shadow-sm">
                <Phone size={20} className="fill-current" />
             </a>
          </div>
          {order.status === 'COMPLETED' && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 shadow-card border border-green-50 flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-3xl mb-4 group hover:scale-110 transition-transform shadow-inner">⭐</div>
               <h3 className="font-extrabold text-gray-900 mb-1">{reviewSubmitted ? "Thank you! ❤️" : "How was your experience?"}</h3>
               <p className="text-xs text-gray-500 mb-6 font-medium">{reviewSubmitted ? "Your review has been stored." : `Your feedback helps us make ${(order.store as { name: string })?.name || 'the store'} better!`}</p>
               {!reviewSubmitted && (
                 <div className="flex gap-2">
                    {[1,2,3,4,5].map(star => (
                       <button key={star} disabled={isSubmitting} onClick={() => handleRatingSubmit(star)}
                         className={`w-11 h-11 border-2 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-90 ${star <= userRating ? 'bg-orange-500 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-white border-gray-50 text-gray-300'}`}>
                          <Star size={20} className={star <= userRating ? 'fill-current' : ''} />
                       </button>
                    ))}
                 </div>
               )}
               {isSubmitting && <div className="mt-4 flex items-center gap-2 text-xs text-orange-500 font-bold"><Loader2 size={14} className="animate-spin" /> Saving review...</div>}
            </motion.div>
          )}
          <div className="bg-white rounded-3xl p-7 shadow-card border border-gray-50">
            <div className="flex items-center gap-3 mb-5 text-gray-900">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600"><Receipt size={20} /></div>
              <h3 className="font-extrabold text-lg">Bill Details</h3>
            </div>
            <div className="space-y-4 mb-6">
              {(order.items as any[])?.map((item: { quantity: number; product?: { name: string }; price: number }, i: number) => (
                <div key={i} className="flex justify-between text-sm items-start gap-3 md:gap-4 overflow-hidden">
                  <div className="flex gap-2.5 md:gap-3 text-gray-700 min-w-0 flex-1">
                    <span className="shrink-0 bg-orange-50 text-orange-600 font-bold px-2 py-0.5 rounded-lg text-xs h-fit border border-orange-100/50">{item.quantity}x</span> 
                    <span className="font-semibold leading-tight md:leading-relaxed truncate md:whitespace-normal">{item.product?.name || 'Unknown Item'}</span>
                  </div>
                  <span className="font-bold text-gray-900 whitespace-nowrap pt-0.5">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-gray-200 pt-5 space-y-3">
               <div className="flex justify-between text-sm font-medium text-gray-500"><span>Item Total</span><span className="text-gray-900">₹{order.totalAmount as number}</span></div>
               <div className="flex justify-between text-sm font-medium text-gray-500"><span>Special Discount</span><span className="text-green-600 font-bold">Free Packaging</span></div>
               <div className="flex justify-between text-sm font-medium text-gray-500"><span>Platform Fee</span><span className="text-gray-900">₹5</span></div>
               <div className="flex justify-between items-center font-black text-xl mt-4 pt-4 border-t border-gray-100 text-gray-900"><span>Total Paid</span><span className="text-orange-600">₹{(order.totalAmount as number || 0) + 5}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
