import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, MessageCircle, Send, HelpCircle, AlertTriangle, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  { q: 'What is Prizzo?', a: 'Prizzo is a hyperlocal product discovery app that helps you find items from nearby stores, compare prices, and reserve for pickup.' },
  { q: 'How does pickup work?', a: 'Browse products, add to cart, place your order, and go to the store to pick it up at your selected time slot.' },
  { q: 'Is delivery available?', a: 'Prizzo is a pickup-first platform. We help you find the best deals nearby and reserve items for quick in-store pickup.' },
  { q: 'How do I compare prices?', a: 'Use the "Compare Nearby" button on any product to see prices across multiple local stores.' },
  { q: 'What if an item is out of stock?', a: 'We\'ll show stock availability in real-time. You can enable stock alerts to get notified when items are back.' },
  { q: 'How do I become a vendor?', a: 'Switch to Vendor mode from your profile to manage your store, products, and orders.' },
];

export default function HelpPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [chatMsg, setChatMsg] = useState('');
  const [chatMsgs, setChatMsgs] = useState<{ from: string; text: string }[]>([
    { from: 'bot', text: 'Hi! 👋 How can I help you today? Ask me anything about Prizzo.' },
  ]);

  const sendChat = () => {
    if (!chatMsg.trim()) return;
    setChatMsgs(prev => [...prev, { from: 'user', text: chatMsg }, { from: 'bot', text: 'Thanks for reaching out! Our support team will get back to you shortly. For urgent issues, call +91 94481 00000.' }]);
    setChatMsg('');
  };

  return (
    <div className="min-h-dvh bg-gray-50 pb-nav">
      <div className="sticky top-0 z-30 bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 className="font-bold text-lg">Help & Support</h1>
      </div>
      <div className="px-4 mt-4 space-y-5">
        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          {[{ icon: ShoppingBag, label: 'Order Help', color: 'bg-orange-50 text-orange-600' },
            { icon: AlertTriangle, label: 'Report Issue', color: 'bg-red-50 text-red-500' },
            { icon: MessageCircle, label: 'Chat Support', color: 'bg-blue-50 text-blue-600' }].map((a, i) => (
            <div key={i} className={`${a.color} rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer`}>
              <a.icon size={20} />
              <span className="text-xs font-medium">{a.label}</span>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div>
          <h2 className="font-bold text-base mb-3">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-card overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left">
                  <span className="text-sm font-medium pr-4">{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <p className="px-4 pb-3 text-xs text-gray-500 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div>
          <h2 className="font-bold text-base mb-3">💬 Chat with Us</h2>
          <div className="bg-white rounded-2xl shadow-card p-4">
            <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
              {chatMsgs.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${m.from === 'user' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'}`}>{m.text}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Type your message…"
                className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400" />
              <button onClick={sendChat} className="bg-orange-500 text-white p-2.5 rounded-xl"><Send size={16} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
