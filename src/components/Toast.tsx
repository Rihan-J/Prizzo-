import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
}

export default function Toast({ message, visible, onClose, type = 'success' }: ToastProps) {
  const colors = { success: 'bg-green-600', error: 'bg-red-500', info: 'bg-blue-500' };
  React.useEffect(() => {
    if (visible) { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }
  }, [visible, onClose]);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] ${colors[type]} text-white px-5 py-3 rounded-2xl shadow-float flex items-center gap-3 max-w-[420px]`}>
          <span className="text-sm font-medium flex-1">{message}</span>
          <button onClick={onClose}><X size={16} /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useToast() {
  const [state, setState] = React.useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
  const show = (message: string, type: 'success' | 'error' | 'info' = 'success') => setState({ visible: true, message, type });
  const hide = () => setState(s => ({ ...s, visible: false }));
  return { ...state, show, hide };
}
