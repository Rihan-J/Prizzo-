/**
 * Category UI Display Configuration
 *
 * Pure frontend display config — emoji icons, hex colors, background colors.
 * The actual list of available categories comes from the database via the API.
 * This mapping provides the visual representation for each known category ID.
 */

export interface CategoryDisplayConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const CATEGORY_CONFIG: Record<string, CategoryDisplayConfig> = {
  grocery:     { id: 'grocery',     name: 'Groceries',     icon: '🛒', color: '#16a34a', bgColor: '#dcfce7' },
  food:        { id: 'food',        name: 'Food',          icon: '🍽️', color: '#f97316', bgColor: '#fff7ed' },
  medicine:    { id: 'medicine',    name: 'Medicine',      icon: '💊', color: '#3b82f6', bgColor: '#eff6ff' },
  electronics: { id: 'electronics', name: 'Electronics',   icon: '📱', color: '#8b5cf6', bgColor: '#f5f3ff' },
  bakery:      { id: 'bakery',      name: 'Bakery',        icon: '🥐', color: '#ca8a04', bgColor: '#fefce8' },
  fruits:      { id: 'fruits',      name: 'Fruits & Veg',  icon: '🥦', color: '#22c55e', bgColor: '#f0fdf4' },
  hardware:    { id: 'hardware',    name: 'Hardware',      icon: '🔧', color: '#78716c', bgColor: '#f5f5f4' },
  stationery:  { id: 'stationery',  name: 'Stationery',    icon: '✏️', color: '#ec4899', bgColor: '#fdf2f8' },
  dairy:       { id: 'dairy',       name: 'Dairy',         icon: '🥛', color: '#0ea5e9', bgColor: '#f0f9ff' },
  snacks:      { id: 'snacks',      name: 'Snacks',        icon: '🍿', color: '#f59e0b', bgColor: '#fffbeb' },
};

/** Get all categories as an ordered array for rendering */
export const getCategoryList = (): CategoryDisplayConfig[] =>
  Object.values(CATEGORY_CONFIG);

/** Get display config for a single category, with a sensible default */
export const getCategoryDisplay = (categoryId: string): CategoryDisplayConfig =>
  CATEGORY_CONFIG[categoryId] || {
    id: categoryId,
    name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
    icon: '📦',
    color: '#6b7280',
    bgColor: '#f3f4f6',
  };
