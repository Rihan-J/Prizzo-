import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Heart, Package, ShoppingCart } from 'lucide-react';
import CartPage from './CartPage';
import OrdersPage from './OrdersPage';
import WishlistPage from './WishlistPage';

const tabs = [
  { id: 'cart', label: 'Cart', icon: ShoppingCart },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
] as const;

type ActivityTab = typeof tabs[number]['id'];

function normalizeTab(tab: string | null): ActivityTab {
  return tabs.some(item => item.id === tab) ? tab as ActivityTab : 'cart';
}

export default function ActivityPage() {
  const [params, setParams] = useSearchParams();
  const activeTab = normalizeTab(params.get('tab'));

  const setActiveTab = (tab: ActivityTab) => {
    setParams({ tab }, { replace: true });
  };

  return (
    <div className="min-h-dvh bg-gray-50 pb-nav">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 pt-4 pb-3">
        <h1 className="font-bold text-lg mb-3">Activity</h1>
        <div className="grid grid-cols-3 gap-2">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`h-10 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  isActive ? 'bg-orange-500 text-white shadow-orange' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'cart' && <CartPage embedded />}
      {activeTab === 'orders' && <OrdersPage embedded />}
      {activeTab === 'wishlist' && <WishlistPage embedded />}
    </div>
  );
}
