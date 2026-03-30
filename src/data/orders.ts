export type OrderStatus = 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  emoji: string;
}

export interface Order {
  id: string;
  storeId: string;
  storeName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  pickupTime: string;
  placedAt: string;
  updatedAt: string;
  paymentMethod: string;
}

export const sampleOrders: Order[] = [
  { id: 'PRZ1001', storeId: 's1', storeName: 'Sri Sai Supermarket', items: [{ productId: 'p1', name: 'Aashirvaad Atta 5kg', qty: 1, price: 248, emoji: '🌾' }, { productId: 'p3', name: 'Fortune Sunflower Oil 1L', qty: 2, price: 145, emoji: '🛢️' }], total: 538, status: 'ready', pickupTime: '10:30 AM', placedAt: '25 Mar, 10:15 AM', updatedAt: '25 Mar, 10:28 AM', paymentMethod: 'Pay at Store' },
  { id: 'PRZ1002', storeId: 's4', storeName: 'Surya Bakery & Sweets', items: [{ productId: 'p20', name: 'Chocolate Truffle Cake 500g', qty: 1, price: 450, emoji: '🍰' }], total: 450, status: 'preparing', pickupTime: '11:00 AM', placedAt: '25 Mar, 10:45 AM', updatedAt: '25 Mar, 10:50 AM', paymentMethod: 'UPI' },
  { id: 'PRZ1003', storeId: 's5', storeName: 'Hotel Kamath Deluxe', items: [{ productId: 'p13', name: 'Masala Dosa', qty: 2, price: 80, emoji: '🫓' }, { productId: 'p16', name: 'Idli Sambar (4 pcs)', qty: 1, price: 60, emoji: '🍚' }], total: 220, status: 'confirmed', pickupTime: '12:00 PM', placedAt: '25 Mar, 11:30 AM', updatedAt: '25 Mar, 11:30 AM', paymentMethod: 'Card' },
  { id: 'PRZ1004', storeId: 's2', storeName: 'MedPlus Pharmacy', items: [{ productId: 'p7', name: 'Paracetamol 500mg Strip', qty: 2, price: 18, emoji: '💊' }, { productId: 'p38', name: 'Vitamin D3 60 tablets', qty: 1, price: 399, emoji: '💊' }], total: 435, status: 'picked_up', pickupTime: 'Yesterday, 5 PM', placedAt: '24 Mar, 4:30 PM', updatedAt: '24 Mar, 5:05 PM', paymentMethod: 'UPI' },
  { id: 'PRZ1005', storeId: 's6', storeName: 'Biryani House', items: [{ productId: 'p14', name: 'Chicken Biryani (Full)', qty: 2, price: 220, emoji: '🍛' }], total: 440, status: 'picked_up', pickupTime: 'Yesterday, 1 PM', placedAt: '24 Mar, 12:15 PM', updatedAt: '24 Mar, 12:55 PM', paymentMethod: 'Pay at Store' },
  { id: 'PRZ1006', storeId: 's3', storeName: 'Zara Mobile World', items: [{ productId: 'p23', name: 'Boat Airdopes 141', qty: 1, price: 1299, emoji: '🎧' }, { productId: 'p40', name: 'USB Type-C Cable 1m', qty: 1, price: 199, emoji: '🔌' }], total: 1498, status: 'picked_up', pickupTime: '23 Mar, 3 PM', placedAt: '23 Mar, 2:20 PM', updatedAt: '23 Mar, 2:55 PM', paymentMethod: 'Card' },
  { id: 'PRZ1007', storeId: 's7', storeName: 'Nature Fresh Fruits', items: [{ productId: 'p28', name: 'Alphonso Mangoes 1 dozen', qty: 1, price: 380, emoji: '🥭' }, { productId: 'p27', name: 'Fresh Tomatoes 1kg', qty: 2, price: 40, emoji: '🍅' }], total: 460, status: 'picked_up', pickupTime: '22 Mar, 10 AM', placedAt: '22 Mar, 9:30 AM', updatedAt: '22 Mar, 9:55 AM', paymentMethod: 'UPI' },
  { id: 'PRZ1008', storeId: 's15', storeName: 'Spice Garden Restaurant', items: [{ productId: 'p46', name: 'Paneer Butter Masala', qty: 1, price: 200, emoji: '🍛' }, { productId: 'p19', name: 'Butter Naan (2 pcs)', qty: 2, price: 70, emoji: '🫓' }], total: 340, status: 'cancelled', pickupTime: '-', placedAt: '21 Mar, 7:00 PM', updatedAt: '21 Mar, 7:15 PM', paymentMethod: 'Wallet' },
  { id: 'PRZ0999', storeId: 's14', storeName: 'Laxmi General Stores', items: [{ productId: 'p31', name: 'Maggi 2-Minute Noodles 4-pack', qty: 3, price: 68, emoji: '🍜' }, { productId: 'p34', name: 'Red Label Tea 500g', qty: 1, price: 258, emoji: '🍵' }], total: 462, status: 'picked_up', pickupTime: '20 Mar, 6 PM', placedAt: '20 Mar, 5:30 PM', updatedAt: '20 Mar, 5:55 PM', paymentMethod: 'Pay at Store' },
  { id: 'PRZ0998', storeId: 's9', storeName: 'Lotus Stationery', items: [{ productId: 'p42', name: 'Classmate Notebook 200 pages', qty: 5, price: 85, emoji: '📓' }, { productId: 'p43', name: 'Pilot G2 Pen Set 5 pcs', qty: 1, price: 225, emoji: '✏️' }], total: 650, status: 'picked_up', pickupTime: '19 Mar, 4 PM', placedAt: '19 Mar, 3:30 PM', updatedAt: '19 Mar, 3:50 PM', paymentMethod: 'UPI' },
  { id: 'PRZ0997', storeId: 's8', storeName: 'Shree Hardware & Tools', items: [{ productId: 'p44', name: 'Philips LED Bulb 9W', qty: 4, price: 149, emoji: '💡' }], total: 596, status: 'picked_up', pickupTime: '18 Mar, 2 PM', placedAt: '18 Mar, 1:20 PM', updatedAt: '18 Mar, 1:45 PM', paymentMethod: 'Pay at Store' },
  { id: 'PRZ0996', storeId: 's13', storeName: 'Pure Milk & Dairy', items: [{ productId: 'p5', name: 'Amul Butter 500g', qty: 1, price: 255, emoji: '🧈' }, { productId: 'p6', name: 'Nandini Milk 1L', qty: 3, price: 52, emoji: '🥛' }], total: 411, status: 'picked_up', pickupTime: '17 Mar, 7 AM', placedAt: '17 Mar, 6:40 AM', updatedAt: '17 Mar, 6:55 AM', paymentMethod: 'Pay at Store' },
  { id: 'PRZ0995', storeId: 's10', storeName: 'Desi Dhaba', items: [{ productId: 'p18', name: 'Mutton Sukka', qty: 1, price: 280, emoji: '🍖' }], total: 280, status: 'cancelled', pickupTime: '-', placedAt: '16 Mar, 8 PM', updatedAt: '16 Mar, 8:30 PM', paymentMethod: 'UPI' },
  { id: 'PRZ0994', storeId: 's11', storeName: 'City Pharmacy', items: [{ productId: 'p9', name: 'Vicks VapoRub 25g', qty: 1, price: 90, emoji: '🫙' }, { productId: 'p37', name: 'Bandaid Premium 20 strips', qty: 1, price: 145, emoji: '🩹' }], total: 235, status: 'picked_up', pickupTime: '15 Mar, 3 PM', placedAt: '15 Mar, 2:30 PM', updatedAt: '15 Mar, 2:50 PM', paymentMethod: 'UPI' },
  { id: 'PRZ0993', storeId: 's4', storeName: 'Surya Bakery & Sweets', items: [{ productId: 'p22', name: 'Mysore Pak 250g', qty: 2, price: 180, emoji: '🍬' }, { productId: 'p21', name: 'Plain Croissant', qty: 3, price: 45, emoji: '🥐' }], total: 495, status: 'picked_up', pickupTime: '14 Mar, 11 AM', placedAt: '14 Mar, 10:30 AM', updatedAt: '14 Mar, 10:50 AM', paymentMethod: 'Card' },
];
