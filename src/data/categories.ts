export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const categories: Category[] = [
  { id: 'grocery', name: 'Groceries', icon: '🛒', color: '#16a34a', bgColor: '#dcfce7' },
  { id: 'food', name: 'Food', icon: '🍽️', color: '#f97316', bgColor: '#fff7ed' },
  { id: 'medicine', name: 'Medicine', icon: '💊', color: '#3b82f6', bgColor: '#eff6ff' },
  { id: 'electronics', name: 'Electronics', icon: '📱', color: '#8b5cf6', bgColor: '#f5f3ff' },
  { id: 'bakery', name: 'Bakery', icon: '🥐', color: '#ca8a04', bgColor: '#fefce8' },
  { id: 'fruits', name: 'Fruits & Veg', icon: '🥦', color: '#22c55e', bgColor: '#f0fdf4' },
  { id: 'hardware', name: 'Hardware', icon: '🔧', color: '#78716c', bgColor: '#f5f5f4' },
  { id: 'stationery', name: 'Stationery', icon: '✏️', color: '#ec4899', bgColor: '#fdf2f8' },
  { id: 'dairy', name: 'Dairy', icon: '🥛', color: '#0ea5e9', bgColor: '#f0f9ff' },
  { id: 'snacks', name: 'Snacks', icon: '🍿', color: '#f59e0b', bgColor: '#fffbeb' },
];
