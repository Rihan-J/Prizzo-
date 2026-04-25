import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Loader2, Bot, User, ShoppingCart,
  Zap, Search, Sparkles, MapPin, Award
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import api from '../services/api';

// ── Types ──
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  data?: any;
  timestamp: Date;
}

interface ConversationContext {
  lastQuery: string;
  lastIntent: string;
}

// ── Quick action chips ──
const QUICK_CHIPS = [
  { label: '📍 Milk near me', msg: 'milk near me' },
  { label: '💰 Compare rice', msg: 'compare rice prices' },
  { label: '⚡ Buy bread', msg: 'buy bread' },
  { label: '📦 My orders', msg: 'my orders' },
];

export default function ChatBot() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem } = useCart();
  const { isLoggedIn, isVendor, isAdmin } = useAuth();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Thinking...');

  // ── Conversation context memory ──
  const contextRef = useRef<ConversationContext>({ lastQuery: '', lastIntent: '' });

  // ── Location ──
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hide chatbot on certain pages
  const hiddenPages = ['/splash', '/onboarding', '/login', '/signup', '/vendor', '/admin'];
  const shouldHide = hiddenPages.some(p => location.pathname.startsWith(p));

  // ── Get user location ──
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        sessionStorage.setItem('prizzo_user_coords', JSON.stringify(loc));
      },
      () => {
        toast.show('Location permission denied', 'error');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 }
    );
  }, [toast]);

  useEffect(() => {
    const cached = sessionStorage.getItem('prizzo_user_coords');
    if (cached) {
      try { setUserLocation(JSON.parse(cached)); } catch {}
    } else {
      requestLocation();
    }
  }, [requestLocation]);

  // ── Auto-scroll ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Focus input ──
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // ── Welcome message ──
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "What are you looking for? Type a product name, or try 'paper napkin near me'.",
        timestamp: new Date(),
      }]);
    }
  }, [open, messages.length]);

  // ── Send message to backend ──
  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    
    // Dynamic loading text
    if (/\b(near|around|closest)\b/i.test(msg)) {
      setLoadingText('Finding nearby stores...');
    } else if (/\b(compare|best price)\b/i.test(msg)) {
      setLoadingText('Comparing prices...');
    } else if (/\b(buy|order|cart)\b/i.test(msg)) {
      setLoadingText('Preparing order...');
    } else {
      setLoadingText('Searching...');
    }

    try {
      const res = await api.post('/ai/chat', {
        message: msg,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
        lastQuery: contextRef.current.lastQuery,
        lastIntent: contextRef.current.lastIntent,
      });

      const payload = res.data?.data || res.data;
      const { intent, query, reply, data } = payload;

      // ── Update context memory ──
      if (query && query.length > 0) {
        contextRef.current = { lastQuery: query, lastIntent: intent };
      }

      // ── Handle location prompt specifically ──
      if (data?.needsLocation) {
        setMessages(prev => [...prev, {
          id: `b-${Date.now()}`,
          role: 'assistant',
          content: reply || data.message || "Please enable location to find nearby stores.",
          intent: 'needs_location',
          data,
          timestamp: new Date(),
        }]);
        setLoading(false);
        return;
      }

      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        role: 'assistant',
        content: reply || data?.message || "Here's what I found:",
        intent,
        data,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Service unavailable. Try again.';
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ ${errMsg}`,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, userLocation]);

  // ── Cart action ──
  const handleAddToCart = useCallback(async (product: any) => {
    try {
      await api.post('/cart/add', { productId: product.id, quantity: 1 });
      addItem({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        selected: true,
      });
      toast.show(`${product.name} added to cart ✓`, 'success');
    } catch {
      toast.show('Failed to add to cart', 'error');
    }
  }, [addItem, toast]);

  // ── Smart Buy action ──
  const handleSmartBuy = useCallback(async (product: any) => {
    if (!userLocation) {
      toast.show('Enable location for Smart Buy', 'error');
      requestLocation();
      return;
    }
    try {
      await api.post('/orders/smart', {
        productId: product.id,
        quantity: 1,
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: 5,
      });
      toast.show('Order placed! 🎉', 'success');
      setOpen(false);
      navigate('/order-success');
    } catch (err: any) {
      toast.show(err.response?.data?.error || 'Smart Buy failed', 'error');
    }
  }, [userLocation, navigate, toast, requestLocation]);

  // Don't render for non-users
  if (!isLoggedIn || isVendor || isAdmin || shouldHide) return null;

  return (
    <>
      {/* ── Floating Trigger ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(249,115,22,0.4)] transition-shadow"
            id="chatbot-toggle"
          >
            <Sparkles size={24} className="text-white" />
            <span className="absolute inset-0 rounded-full border-2 border-orange-400 animate-ping opacity-20" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-3 left-3 sm:left-auto sm:w-[380px] z-50 bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] border border-gray-100 overflow-hidden flex flex-col"
            style={{ maxHeight: 'calc(100dvh - 140px)', height: '520px' }}
          >
            {/* ── Header ── */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Bot size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm">Prizzo AI</h3>
                <p className="text-white/70 text-[10px] font-medium truncate">
                  {contextRef.current.lastQuery
                    ? `Last: "${contextRef.current.lastQuery}"`
                    : 'Search · Compare · Buy · Track'}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center hover:bg-white/25 transition-colors"
              >
                <X size={16} className="text-white" />
              </button>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50/50">
              {messages.map((msg) => (
                <div key={msg.id}>
                  {/* ── Message Bubble ── */}
                  <div className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      msg.role === 'user'
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                    }`}>
                      {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                    </div>
                    <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-orange-500 text-white rounded-tr-md'
                        : 'bg-white text-gray-700 shadow-sm border border-gray-100 rounded-tl-md'
                    }`}>
                      {msg.content}
                    </div>
                  </div>

                  {/* ── Location Request Button ── */}
                  {msg.intent === 'needs_location' && (
                    <div className="mt-2 ml-8">
                      <button 
                        onClick={() => requestLocation()}
                        className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 hover:bg-orange-100 transition-colors"
                      >
                        <MapPin size={12} /> Enable Location
                      </button>
                    </div>
                  )}

                  {/* ── Data Cards ── */}
                  {msg.data && (
                    <div className="mt-2 ml-8 space-y-2">
                      <ResultCards msg={msg} navigate={navigate} onCart={handleAddToCart} onBuy={handleSmartBuy} />
                    </div>
                  )}
                </div>
              ))}

              {/* ── Typing Indicator ── */}
              {loading && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <Bot size={12} className="text-white" />
                  </div>
                  <div className="bg-white px-4 py-2.5 rounded-2xl rounded-tl-md shadow-sm border border-gray-100 flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-gray-500 font-medium ml-1">{loadingText}</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* ── Quick Chips (show only on welcome state) ── */}
            {messages.length <= 1 && !loading && (
              <div className="px-3 py-2 border-t border-gray-100 bg-white flex gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip.msg}
                    onClick={() => sendMessage(chip.msg)}
                    className="text-[11px] bg-orange-50 text-orange-600 px-2.5 py-1.5 rounded-xl font-medium whitespace-nowrap hover:bg-orange-100 transition-colors active:scale-95"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            {/* ── Input Bar ── */}
            <div className="px-3 py-2.5 border-t border-gray-100 bg-white flex-shrink-0">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a product name…"
                  className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder:text-gray-400"
                  disabled={loading}
                  id="chatbot-input"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white disabled:bg-gray-300 transition-colors active:scale-90"
                  id="chatbot-send"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Result Cards — renders actual data from backend, not text
// ═══════════════════════════════════════════════════════════════

function ResultCards({
  msg,
  navigate,
  onCart,
  onBuy,
}: {
  msg: ChatMessage;
  navigate: (path: string) => void;
  onCart: (p: any) => void;
  onBuy: (p: any) => void;
}) {
  const { intent, data } = msg;
  if (!data) return null;

  // ── Nearby comparison results (with tags) ──
  if (data.results && data.results.length > 0) {
    return (
      <>
        {data.results.map((r: any, i: number) => {
          const isCheapest = r._tags?.includes('cheapest');
          const isNearest = r._tags?.includes('nearest');
          return (
            <div key={i} className={`bg-white rounded-xl border p-2.5 shadow-sm transition-shadow ${isCheapest ? 'border-orange-200 shadow-orange-100' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{r.productName || r.name}</p>
                  <p className="text-[10px] text-gray-400">{r.storeName} · {r.distance?.toFixed(1)}km</p>
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ${isCheapest ? 'text-orange-600' : 'text-gray-700'}`}>₹{r.price}</span>
              </div>
              
              {/* Badges */}
              {(isCheapest || isNearest || (r.tags && r.tags.length > 0)) && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {isCheapest && (
                    <span className="flex items-center gap-0.5 text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
                      <Award size={8} /> Cheapest
                    </span>
                  )}
                  {isNearest && (
                    <span className="flex items-center gap-0.5 text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                      <MapPin size={8} /> Nearest
                    </span>
                  )}
                  {r.tags?.filter((t: string) => t !== 'cheapest' && t !== 'nearest' && t !== 'bestValue').map((tag: string) => (
                    <span key={tag} className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-medium">{tag}</span>
                  ))}
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-1.5 mt-2">
                <button
                  onClick={() => navigate(`/product/${r.productId || r.id}`)}
                  className="flex-1 text-[10px] bg-gray-50 text-gray-600 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 hover:bg-gray-100 transition-colors active:scale-95"
                >
                  <Search size={9} /> View
                </button>
                <button
                  onClick={() => onCart({ id: r.productId || r.id, name: r.productName || r.name, price: r.price })}
                  className="flex-1 text-[10px] bg-orange-50 text-orange-600 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 hover:bg-orange-100 transition-colors active:scale-95"
                >
                  <ShoppingCart size={9} /> Add
                </button>
                <button
                  onClick={() => onBuy({ id: r.productId || r.id })}
                  className="flex-1 text-[10px] bg-emerald-50 text-emerald-600 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 hover:bg-emerald-100 transition-colors active:scale-95"
                >
                  <Zap size={9} /> Buy
                </button>
              </div>
            </div>
          );
        })}
      </>
    );
  }

  // ── Product cards (search / smart_buy / add_to_cart / fallback) ──
  if (data.products && data.products.length > 0) {
    const isAction = intent === 'smart_buy' || intent === 'add_to_cart';

    return (
      <>
        {data.products.map((p: any) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{p.store?.name || 'Store'}{p.stock != null ? ` · Stock: ${p.stock}` : ''}</p>
              </div>
              <span className="text-sm font-bold text-orange-600 flex-shrink-0">₹{p.price}</span>
            </div>
            <div className="flex gap-1.5 mt-2">
              <button
                onClick={() => navigate(`/product/${p.id}`)}
                className="flex-1 text-[10px] bg-gray-50 text-gray-600 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 hover:bg-gray-100 transition-colors active:scale-95"
              >
                <Search size={9} /> View
              </button>
              {isAction && intent === 'add_to_cart' ? (
                <button
                  onClick={() => onCart(p)}
                  className="flex-1 text-[10px] bg-orange-500 text-white py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1 active:scale-95 transition-transform"
                >
                  <ShoppingCart size={9} /> Add
                </button>
              ) : isAction && intent === 'smart_buy' ? (
                <button
                  onClick={() => onBuy(p)}
                  className="flex-1 text-[10px] bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1 active:scale-95 transition-transform"
                >
                  <Zap size={9} /> Buy Now
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onCart(p)}
                    className="flex-1 text-[10px] bg-orange-50 text-orange-600 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 hover:bg-orange-100 transition-colors active:scale-95"
                  >
                    <ShoppingCart size={9} /> Cart
                  </button>
                  <button
                    onClick={() => onBuy(p)}
                    className="flex-1 text-[10px] bg-emerald-50 text-emerald-600 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 hover:bg-emerald-100 transition-colors active:scale-95"
                  >
                    <Zap size={9} /> Buy
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </>
    );
  }

  // ── Order cards ──
  if (data.orders && data.orders.length > 0) {
    const statusColor: Record<string, string> = {
      CONFIRMED: 'bg-blue-50 text-blue-600',
      PREPARING: 'bg-orange-50 text-orange-600',
      READY: 'bg-green-50 text-green-600',
      COMPLETED: 'bg-gray-100 text-gray-500',
      CANCELLED: 'bg-red-50 text-red-600',
    };

    return (
      <>
        {data.orders.map((o: any) => (
          <div
            key={o.id}
            onClick={() => navigate(`/orders/${o.id}`)}
            className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-400 font-medium">#{o.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-xs font-semibold text-gray-800 truncate">{o.store?.name || 'Store'}</p>
              </div>
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor[o.status] || 'bg-gray-100 text-gray-500'}`}>
                {o.status}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-gray-400 truncate flex-1">
                {o.items?.map((i: any) => i.product?.name).filter(Boolean).join(', ')}
              </p>
              <span className="text-xs font-bold text-orange-600 ml-2">₹{o.totalAmount}</span>
            </div>
          </div>
        ))}
      </>
    );
  }

  return null;
}
