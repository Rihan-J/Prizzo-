import { useState, useEffect } from 'react';

/**
 * Debounce hook — delays updating a value until after a specified delay
 * of inactivity. Ideal for search inputs to prevent rapid API calls.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default 400ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 400): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
