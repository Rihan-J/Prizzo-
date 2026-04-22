import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import api, { invalidateClientCache } from '../services/api';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
  stock: number;
  isAvailable: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (productId: string, qty: number, product?: any) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  updateQty: (cartItemId: string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  checkout: () => Promise<void>;
  fetchCart: () => Promise<void>;
  totalItems: number;
  subtotal: number;
  totalSavings: number;
  cartLoading: boolean;
  cartStoreId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, user, isVendor, isAdmin } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [cartStoreId, setCartStoreId] = useState<string | null>(null);
  const [cartLoading, setCartLoading] = useState(true);

  // ── Batched qty update refs ──
  const pendingUpdates = useRef(new Map<string, number>());
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Helper: sync state from server cart response ──
  const syncFromServerResponse = useCallback((cartData: any) => {
    if (!cartData) {
      setItems([]);
      setTotalItems(0);
      setSubtotal(0);
      setCartStoreId(null);
      return;
    }
    const normalizedItems: CartItem[] = cartData.items?.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      price: item.product.price,
      qty: item.quantity,
      stock: item.product.stock,
      isAvailable: item.product.isAvailable
    })) || [];

    setItems(normalizedItems);
    setSubtotal(cartData.total || 0);
    setTotalItems(normalizedItems.reduce((acc, curr) => acc + curr.qty, 0));
    setCartStoreId(cartData.storeId || null);
  }, []);

  const fetchCart = useCallback(async () => {
    // Only attempt to fetch cart for 'USER' role
    if (!user || user.role !== 'USER') {
      setCartLoading(false);
      return;
    }

    try {
      setCartLoading(true);
      const res = await api.get('/cart');
      // Handle new standardized response format
      const cartData = res.data?.data?.cart || res.data?.cart;
      syncFromServerResponse(cartData);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setCartLoading(false);
    }
  }, [isLoggedIn, syncFromServerResponse]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ── Flush batched qty updates ──
  const flushPendingUpdates = useCallback(async () => {
    const updates = Array.from(pendingUpdates.current.entries());
    pendingUpdates.current.clear();

    if (updates.length === 0) return;

    for (const [cartItemId, qty] of updates) {
      // Skip if it's a temp ID (it will be synced via the add response)
      if (cartItemId.startsWith('temp-')) continue;

      try {
        if (qty <= 0) {
          await api.delete(`/cart/item/${cartItemId}`);
        } else {
          await api.patch(`/cart/item/${cartItemId}`, { quantity: qty });
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.warn('Batch update skipped: Item already removed.', cartItemId);
        } else {
          console.error('Failed to sync qty update', error);
        }
      }
    }

    // Final sync with server to ensure consistency
    await fetchCart();
  }, [fetchCart]);

  const addItem = async (productId: string, qty: number, product?: any) => {
    if (!isLoggedIn) {
      alert("Please login first to add items to your cart.");
      return;
    }

    // Check if adding from a different store
    if (cartStoreId && product?.storeId && cartStoreId !== product.storeId) {
       if (!window.confirm("Adding this item will clear your current cart from another store. Continue?")) {
           return;
       }
    }

    // ── Optimistic Update ──
    if (product) {
      setItems(prev => {
        const existing = prev.find(i => i.productId === productId);
        if (existing) {
          return prev.map(i => i.productId === productId ? { ...i, qty: i.qty + qty } : i);
        }
        return [...prev, {
          id: 'temp-' + Date.now(), // Unique enough for a split second
          productId,
          name: product.name,
          price: product.price,
          qty,
          stock: product.stock || 99,
          isAvailable: true
        }];
      });
      setTotalItems(prev => prev + qty);
      setSubtotal(prev => prev + (product.price * qty));
    }

    try {
      const res = await api.post('/cart/add', { productId, quantity: qty });
      const cartData = res.data?.data?.cart || res.data?.cart;
      if (cartData) {
        syncFromServerResponse(cartData);
      } else {
        await fetchCart();
      }
      invalidateClientCache('products');
    } catch (error: any) {
      // Rollback on error
      await fetchCart();
      alert(error.response?.data?.error || error.response?.data?.message || "Failed to add to cart");
    }
  };

  const inFlightDeletes = useRef(new Set<string>());

  const removeItem = async (cartItemId: string) => {
    if (inFlightDeletes.current.has(cartItemId)) return;
    
    // If it's a temp ID, we might need to wait for the real ID from the server
    // or just ignore if it's not even on the server yet.
    if (cartItemId.startsWith('temp-')) {
       setItems(prev => prev.filter(i => i.id !== cartItemId));
       return;
    }

    inFlightDeletes.current.add(cartItemId);
    // Optimistic removal
    setItems(prev => prev.filter(i => i.id !== cartItemId));

    try {
      const res = await api.delete(`/cart/item/${cartItemId}`);
      const cartData = res.data?.data?.cart || res.data?.cart;
      if (cartData) {
        syncFromServerResponse(cartData);
      } else {
        await fetchCart();
      }
    } catch (error: any) {
      // If it's a 404, the item was likely already removed, so we can just ignore it
      if (error.response?.status === 404) {
          console.warn('Item already removed from server:', cartItemId);
      } else {
          console.error('Failed to remove item', error);
          await fetchCart(); // Rollback for other errors
      }
    } finally {
      inFlightDeletes.current.delete(cartItemId);
    }
  };

  const updateQty = async (cartItemId: string, qty: number) => {
    if (qty <= 0) {
      await removeItem(cartItemId);
      return;
    }

    // Optimistic: update local state immediately
    setItems(prev => prev.map(i => i.id === cartItemId ? { ...i, qty } : i));
    setTotalItems(_prev => {
      const items2 = items.map(i => i.id === cartItemId ? { ...i, qty } : i);
      return items2.reduce((a, c) => a + c.qty, 0);
    });
    setSubtotal(_prev => {
      const items2 = items.map(i => i.id === cartItemId ? { ...i, qty } : i);
      return items2.reduce((a, c) => a + c.price * c.qty, 0);
    });

    // Batch: store latest qty, flush after 500ms of inactivity
    pendingUpdates.current.set(cartItemId, qty);
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(flushPendingUpdates, 500);
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      syncFromServerResponse(null);
    } catch (error) {
      console.error('Failed to clear cart', error);
    }
  };

  const checkout = async () => {
    if (items.length === 0) {
      alert("Your cart is empty.");
      return;
    }
    // Flush any pending qty updates before checkout
    if (pendingUpdates.current.size > 0) {
      if (flushTimer.current) clearTimeout(flushTimer.current);
      await flushPendingUpdates();
    }
    try {
      await api.post('/orders');
      syncFromServerResponse(null);
      invalidateClientCache('products');
      alert("Order placed successfully!");
    } catch (error: any) {
      alert(error.response?.data?.error || error.response?.data?.message || "Failed during checkout");
    }
  };

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQty, clearCart, checkout, fetchCart,
      totalItems, subtotal, totalSavings: 0, cartLoading, cartStoreId
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
