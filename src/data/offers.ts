export interface Offer {
  id: string;
  title: string;
  description: string;
  code: string;
  discount: string;
  storeId?: string;
  storeName?: string;
  category?: string;
  expiresIn: string;
  emoji: string;
  type: 'coupon' | 'deal' | 'flash';
  minOrder?: number;
  bgColor: string;
}

export const offers: Offer[] = [
  { id: 'o1', title: 'WELCOME10', description: 'Get 10% off on your first order', code: 'WELCOME10', discount: '10%', expiresIn: '3 days', emoji: '🎉', type: 'coupon', bgColor: '#fff7ed', minOrder: 200 },
  { id: 'o2', title: 'GROCERY20', description: '₹20 off on groceries above ₹300', code: 'GROCERY20', discount: '₹20', storeId: 's1', storeName: 'Sri Sai Supermarket', category: 'grocery', expiresIn: '5 days', emoji: '🛒', type: 'deal', bgColor: '#f0fdf4', minOrder: 300 },
  { id: 'o3', title: 'MEDS15', description: '15% off on all generic medicines', code: 'MEDS15', discount: '15%', storeId: 's2', storeName: 'MedPlus Pharmacy', category: 'medicine', expiresIn: '2 days', emoji: '💊', type: 'coupon', bgColor: '#eff6ff' },
  { id: 'o4', title: 'BIRYANI50', description: '₹50 off on biryani orders', code: 'BIRYANI50', discount: '₹50', storeId: 's6', storeName: 'Biryani House', category: 'food', expiresIn: '1 day', emoji: '🍛', type: 'flash', bgColor: '#fff7ed', minOrder: 200 },
  { id: 'o5', title: 'TECH200', description: '₹200 off on electronics above ₹1500', code: 'TECH200', discount: '₹200', category: 'electronics', expiresIn: '7 days', emoji: '📱', type: 'coupon', bgColor: '#f5f3ff', minOrder: 1500 },
  { id: 'o6', title: 'FRESH30', description: '30% off on fresh fruits and vegetables', code: 'FRESH30', discount: '30%', storeId: 's7', storeName: 'Nature Fresh Fruits', category: 'fruits', expiresIn: '1 day', emoji: '🥦', type: 'flash', bgColor: '#f0fdf4' },
  { id: 'o7', title: 'CAKE100', description: '₹100 off on cakes above ₹500', code: 'CAKE100', discount: '₹100', storeId: 's4', storeName: 'Surya Bakery & Sweets', category: 'bakery', expiresIn: '2 days', emoji: '🎂', type: 'deal', bgColor: '#fefce8', minOrder: 500 },
  { id: 'o8', title: 'THALI25', description: '25% off on veg thali noon hours', code: 'THALI25', discount: '25%', storeId: 's5', storeName: 'Hotel Kamath Deluxe', category: 'food', expiresIn: 'Today only', emoji: '🍱', type: 'flash', bgColor: '#fff7ed' },
  { id: 'o9', title: 'DAIRY10', description: '10% off on all dairy products', code: 'DAIRY10', discount: '10%', category: 'dairy', expiresIn: '4 days', emoji: '🥛', type: 'coupon', bgColor: '#f0f9ff' },
  { id: 'o10', title: 'WEEKEND20', description: 'Flat 20% off on weekends at Laxmi General', code: 'WEEKEND20', discount: '20%', storeId: 's14', storeName: 'Laxmi General Stores', expiresIn: 'Next weekend', emoji: '🏪', type: 'deal', bgColor: '#fffbeb' },
  { id: 'o11', title: 'STUDENT5', description: '5% student discount at Lotus Stationery', code: 'STUDENT5', discount: '5%', storeId: 's9', storeName: 'Lotus Stationery', expiresIn: 'Ongoing', emoji: '✏️', type: 'coupon', bgColor: '#fdf2f8' },
  { id: 'o12', title: 'PHARMA10', description: '10% off on generics at City Pharmacy', code: 'PHARMA10', discount: '10%', storeId: 's11', storeName: 'City Pharmacy', expiresIn: '3 days', emoji: '🏥', type: 'coupon', bgColor: '#eff6ff' },
  { id: 'o13', title: 'FAMILYPACK', description: 'Family biryani pack ₹750 for 4', code: 'FAMILYPACK', discount: 'Special', storeId: 's6', storeName: 'Biryani House', category: 'food', expiresIn: 'Ongoing', emoji: '👨‍👩‍👧‍👦', type: 'deal', bgColor: '#fff7ed' },
  { id: 'o14', title: 'NEWUSER50', description: '₹50 cashback on first pickup order', code: 'NEWUSER50', discount: '₹50', expiresIn: '30 days', emoji: '🎁', type: 'coupon', bgColor: '#fdf2f8' },
  { id: 'o15', title: 'EMIFREE', description: 'No cost EMI on electronics ₹2000+', code: 'EMIFREE', discount: 'No cost EMI', category: 'electronics', expiresIn: '7 days', emoji: '💳', type: 'deal', bgColor: '#f5f3ff', minOrder: 2000 },
  { id: 'o16', title: 'EARLYBIRD', description: 'Morning orders before 9AM get 12% off at Kamath', code: 'EARLYBIRD', discount: '12%', storeId: 's5', storeName: 'Hotel Kamath Deluxe', expiresIn: 'Daily', emoji: '🌅', type: 'flash', bgColor: '#fff7ed' },
  { id: 'o17', title: 'MONSOON30', description: 'Monsoon sale 30% off on rainwear & hardware', code: 'MONSOON30', discount: '30%', category: 'hardware', expiresIn: '10 days', emoji: '🌧️', type: 'deal', bgColor: '#f5f5f4' },
  { id: 'o18', title: 'DIWALI15', description: 'Festive 15% off on sweets and snacks', code: 'DIWALI15', discount: '15%', expiresIn: '5 days', emoji: '🪔', type: 'coupon', bgColor: '#fffbeb' },
  { id: 'o19', title: 'REORDER5', description: '5% off when you reorder the same items', code: 'REORDER5', discount: '5%', expiresIn: 'Ongoing', emoji: '🔄', type: 'coupon', bgColor: '#f0fdf4' },
  { id: 'o20', title: 'PICKUP10', description: '10% off for all pickup-ready orders', code: 'PICKUP10', discount: '10%', expiresIn: 'Ongoing', emoji: '🛍️', type: 'deal', bgColor: '#fff7ed' },
];
