import { io, Socket } from 'socket.io-client';
import { useEffect, useRef } from 'react';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socketInstance: Socket | null = null;

/**
 * Get or create a singleton socket connection
 */
export function getSocket(token: string): Socket {
  if (socketInstance?.connected) return socketInstance;

  socketInstance = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    transports: ['websocket', 'polling'],
  });

  socketInstance.on('connect', () => {
    console.log('[Socket] Connected:', socketInstance?.id);
  });

  socketInstance.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  return socketInstance;
}

/**
 * Disconnect and cleanup the socket
 */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

/**
 * Hook: Subscribe to real-time order status updates (for shoppers)
 */
export function useOrderUpdates(
  token: string | null,
  onUpdate: (data: { orderId: string; status: string; storeName?: string }) => void
) {
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);

    const handler = (data: any) => {
      callbackRef.current(data);
    };

    socket.on('order:status-update', handler);

    return () => {
      socket.off('order:status-update', handler);
    };
  }, [token]);
}

/**
 * Hook: Subscribe to new order alerts (for vendors)
 */
export function useNewOrderAlerts(
  token: string | null,
  storeId: string | null,
  onAlert: (data: { orderId: string; totalAmount: number; itemCount: number }) => void
) {
  const callbackRef = useRef(onAlert);
  callbackRef.current = onAlert;

  useEffect(() => {
    if (!token || !storeId) return;

    const socket = getSocket(token);
    
    // Join the vendor's store room
    socket.emit('join-store', storeId);

    const handler = (data: any) => {
      callbackRef.current(data);
    };

    socket.on('order:new', handler);

    return () => {
      socket.off('order:new', handler);
    };
  }, [token, storeId]);
}
