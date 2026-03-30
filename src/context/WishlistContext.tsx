import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface WishlistContextType {
  ids: string[];
  toggle: (id: string) => void;
  isWished: (id: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('prizzo_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('prizzo_wishlist', JSON.stringify(ids));
  }, [ids]);

  const toggle = useCallback((id: string) => {
    setIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const isWished = useCallback((id: string) => ids.includes(id), [ids]);

  return (
    <WishlistContext.Provider value={{ ids, toggle, isWished }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
