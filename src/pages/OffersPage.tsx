import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag, Clock, Copy, CheckCircle } from 'lucide-react';
import { offers } from '../data/offers';
import { motion } from 'framer-motion';

export default function OffersPage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const flash = offers.filter(o => o.type === 'flash');
  const coupons = offers.filter(o => o.type === 'coupon');
  const deals = offers.filter(o => o.type === 'deal');

  return (
    <div className="min-h-dvh bg-gray-50 pb-nav">
      <div className="sticky top-0 z-30 bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 className="font-bold text-lg">Offers & Deals</h1>
      </div>
      <div className="px-4 mt-4 space-y-5">
        {flash.length > 0 && (
          <Section title="⚡ Flash Deals">
            {flash.map(o => <OfferCard key={o.id} offer={o} copied={copied} onCopy={copy} />)}
          </Section>
        )}
        <Section title="🎫 Coupons">
          {coupons.map(o => <OfferCard key={o.id} offer={o} copied={copied} onCopy={copy} />)}
        </Section>
        <Section title="🏷️ Store Deals">
          {deals.map(o => <OfferCard key={o.id} offer={o} copied={copied} onCopy={copy} />)}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-bold text-base mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function OfferCard({ offer, copied, onCopy }: { offer: typeof offers[0]; copied: string | null; onCopy: (c: string) => void }) {
  return (
    <motion.div whileTap={{ scale: 0.98 }} className="rounded-2xl p-4 border shadow-card" style={{ backgroundColor: offer.bgColor, borderColor: `${offer.bgColor}99` }}>
      <div className="flex items-start gap-3">
        <span className="text-3xl">{offer.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">{offer.discount} OFF</p>
          <p className="text-xs text-gray-600 mt-0.5">{offer.description}</p>
          {offer.storeName && <p className="text-xs text-gray-400 mt-0.5">🏪 {offer.storeName}</p>}
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-0.5 text-xs text-gray-400"><Clock size={10} /> {offer.expiresIn}</span>
            {offer.minOrder && <span className="text-xs text-gray-400">Min ₹{offer.minOrder}</span>}
          </div>
        </div>
      </div>
      <button onClick={() => onCopy(offer.code)}
        className="mt-3 w-full border-2 border-dashed border-gray-300 py-2 rounded-xl text-xs font-bold text-gray-600 flex items-center justify-center gap-1.5 hover:border-orange-400 transition-colors">
        {copied === offer.code ? <><CheckCircle size={12} className="text-green-500" /> Copied!</> : <><Copy size={12} /> {offer.code}</>}
      </button>
    </motion.div>
  );
}
