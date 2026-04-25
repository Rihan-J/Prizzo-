/**
 * Category UI Display Configuration
 *
 * These names MUST match the GROCERY_CATEGORIES list in the backend categorizer.
 */

export interface CategoryDisplayConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const CATEGORY_CONFIG: Record<string, CategoryDisplayConfig> = {
  "Fruits & Vegetables": { id: 'fruits', name: 'Fruits & Vegetables', icon: '🥦', color: '#16a34a', bgColor: '#dcfce7' },
  "Dairy & Bakery": { id: 'dairy', name: 'Dairy & Bakery', icon: '🥐', color: '#ca8a04', bgColor: '#fefce8' },
  "Beverages": { id: 'beverages', name: 'Beverages', icon: '🧃', color: '#0ea5e9', bgColor: '#f0f9ff' },
  "Snacks & Branded Foods": { id: 'snacks', name: 'Snacks & Branded Foods', icon: '🍿', color: '#f59e0b', bgColor: '#fffbeb' },
  "Kitchen & Household": { id: 'kitchen', name: 'Kitchen & Household', icon: '🍳', color: '#78716c', bgColor: '#f5f5f4' },
  "Beauty & Hygiene": { id: 'beauty', name: 'Beauty & Hygiene', icon: '🧴', color: '#ec4899', bgColor: '#fdf2f8' },
  "Gourmet & World Food": { id: 'gourmet', name: 'Gourmet & World Food', icon: '🧀', color: '#8b5cf6', bgColor: '#f5f3ff' },
  "Baby Care": { id: 'baby', name: 'Baby Care', icon: '🍼', color: '#f43f5e', bgColor: '#fff1f2' },
  "Meat & Eggs": { id: 'meat', name: 'Meat & Eggs', icon: '🥩', color: '#ef4444', bgColor: '#fef2f2' },
  "Cleaning & Household": { id: 'cleaning', name: 'Cleaning & Household', icon: '🧹', color: '#6366f1', bgColor: '#eef2ff' },
  "Health & Wellness": { id: 'health', name: 'Health & Wellness', icon: '💊', color: '#3b82f6', bgColor: '#eff6ff' },
  "Instant Food & Ready to Cook": { id: 'instant', name: 'Instant Food & Ready to Cook', icon: '🍜', color: '#f97316', bgColor: '#fff7ed' },
  "Pet Care": { id: 'pet', name: 'Pet Care', icon: '🐾', color: '#10b981', bgColor: '#ecfdf5' },
  "Stationery": { id: 'stationery', name: 'Stationery', icon: '✏️', color: '#71717a', bgColor: '#f4f4f5' },
  "Food": { id: 'food', name: 'Food', icon: '🍽️', color: '#f97316', bgColor: '#fff7ed' },
  "Electronics": { id: 'electronics', name: 'Electronics', icon: '📱', color: '#8b5cf6', bgColor: '#f5f3ff' },
};

export const getCategoryList = (): CategoryDisplayConfig[] =>
  Object.values(CATEGORY_CONFIG);

export const getCategoryDisplay = (categoryName: string): CategoryDisplayConfig => {
  if (!categoryName) return { id: 'none', name: '', icon: '', color: '', bgColor: '' };
  
  const key = Object.keys(CATEGORY_CONFIG).find(k => k.toLowerCase() === categoryName.toLowerCase());
  return key ? CATEGORY_CONFIG[key] : {
    id: categoryName,
    name: categoryName,
    icon: '📦',
    color: '#6b7280',
    bgColor: '#f3f4f6',
  };
};
