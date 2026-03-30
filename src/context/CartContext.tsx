import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: string; // The cart item ID
  productId: string;
  name: string;
  price: number;
  qty: number;
  stock: number;
  isAvailable: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (productId: string, qty: number) => Promise<void>;
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
  const { isLoggedIn } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [cartStoreId, setCartStoreId] = useState<string | null>(null);
  const [cartLoading, setCartLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) {
      setItems([]);
      setTotalItems(0);
      setSubtotal(0);
      setCartStoreId(null);
      setCartLoading(false);
      return;
    }

    try {
      setCartLoading(true);
      const res = await api.get('/cart');
      
      if (res.data && res.data.cart) {
        const cartData = res.data.cart;
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
      } else {
        setItems([]);
        setSubtotal(0);
        setTotalItems(0);
        setCartStoreId(null);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setCartLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (productId: string, qty: number) => {
    if (!isLoggedIn) {
      alert("Please login first to add items to your cart.");
      return;
    }
    try {
      await api.post('/cart/add', { productId, quantity: qty });
      await fetchCart();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to add to cart");
    }
  };

  const removeItem = async (cartItemId: string) => {
    try {
      await api.delete(`/cart/item/${cartItemId}`);
      await fetchCart();
    } catch (error) {
      console.error('Failed to remove item', error);
    }
  };

  const updateQty = async (cartItemId: string, qty: number) => {
    if (qty <= 0) { 
      await removeItem(cartItemId); 
      return; 
    }
    
    try {
      await api.patch(`/cart/item/${cartItemId}`, { quantity: qty });
      await fetchCart();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update quantity");
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      await fetchCart();
    } catch (error) {
      console.error('Failed to clear cart', error);
    }
  };

  const checkout = async () => {
    if (items.length === 0) {
      alert("Your cart is empty.");
      return;
    }
    try {
      await api.post('/orders');
      await fetchCart(); // this completely flushes the cart
      alert("Order placed successfully!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed during checkout");
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
