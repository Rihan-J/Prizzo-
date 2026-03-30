export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'order' | 'offer' | 'stock' | 'deal' | 'reminder' | 'recommendation';
  read: boolean;
  emoji: string;
  actionUrl?: string;
}

export const notifications: AppNotification[] = [
  { id: 'n1', title: 'Order Ready! 🎉', message: 'Your order #PRZ1001 is ready for pickup at Sri Sai Supermarket.', time: '2 min ago', type: 'order', read: false, emoji: '✅', actionUrl: '/orders' },
  { id: 'n2', title: 'Flash Deal!', message: '30% off on fresh fruits at Nature Fresh — ends tonight!', time: '15 min ago', type: 'deal', read: false, emoji: '⚡', actionUrl: '/offers' },
  { id: 'n3', title: 'Back in Stock', message: 'Power Bank 10000mAh is back at DigitalZone Electronics.', time: '1 hr ago', type: 'stock', read: false, emoji: '🔋', actionUrl: '/product/p26' },
  { id: 'n4', title: 'Order Confirmed', message: 'Your order #PRZ1003 has been confirmed. Preparing now.', time: '2 hrs ago', type: 'order', read: true, emoji: '📦', actionUrl: '/orders' },
  { id: 'n5', title: 'Weekend Sale!', message: 'Flat 20% off this weekend at Laxmi General Stores.', time: '3 hrs ago', type: 'offer', read: true, emoji: '🏪', actionUrl: '/offers' },
  { id: 'n6', title: 'Pharmacy Reminder', message: 'Time to refill your Vitamin D3 supplements.', time: '5 hrs ago', type: 'reminder', read: false, emoji: '💊', actionUrl: '/product/p38' },
  { id: 'n7', title: 'You Might Like', message: 'Try the new Chicken Tandoori at Spice Garden — 4.5★', time: '6 hrs ago', type: 'recommendation', read: true, emoji: '🍗', actionUrl: '/product/p47' },
  { id: 'n8', title: 'Price Drop Alert', message: 'Boat Airdopes 141 dropped to ₹1,299 at Zara Mobile World!', time: '8 hrs ago', type: 'deal', read: true, emoji: '📉', actionUrl: '/product/p23' },
  { id: 'n9', title: 'Order Picked Up', message: 'Order #PRZ0998 has been picked up. Thank you!', time: '1 day ago', type: 'order', read: true, emoji: '🛍️', actionUrl: '/orders' },
  { id: 'n10', title: 'New Store Nearby', message: 'DigitalZone Electronics just listed on Prizzo. Check it out!', time: '1 day ago', type: 'recommendation', read: true, emoji: '🆕', actionUrl: '/store/s12' },
  { id: 'n11', title: 'WELCOME10 Coupon', message: 'Use code WELCOME10 for 10% off on your first order.', time: '2 days ago', type: 'offer', read: true, emoji: '🎁', actionUrl: '/offers' },
  { id: 'n12', title: 'Biryani Special', message: 'Family biryani pack ₹750 for 4 at Biryani House.', time: '2 days ago', type: 'deal', read: true, emoji: '🍛', actionUrl: '/store/s6' },
  { id: 'n13', title: 'Morning Deal', message: 'Early bird 12% off on breakfast at Hotel Kamath before 9 AM!', time: '3 days ago', type: 'offer', read: true, emoji: '🌅', actionUrl: '/store/s5' },
  { id: 'n14', title: 'Low Stock Alert', message: 'Only 5 left — Alphonso Mangoes at Nature Fresh Fruits.', time: '3 days ago', type: 'stock', read: true, emoji: '🥭', actionUrl: '/product/p28' },
  { id: 'n15', title: 'Student Discount', message: '5% student discount at Lotus Stationery — show ID at pickup.', time: '4 days ago', type: 'offer', read: true, emoji: '✏️', actionUrl: '/store/s9' },
  { id: 'n16', title: 'Order Preparing', message: 'Your order #PRZ1002 is being prepared at Surya Bakery.', time: '4 days ago', type: 'order', read: true, emoji: '👨‍🍳', actionUrl: '/orders' },
  { id: 'n17', title: 'Top Pick Nearby', message: 'Masala Dosa at Hotel Kamath — 4.8★ and only 0.9 km away.', time: '5 days ago', type: 'recommendation', read: true, emoji: '🫓', actionUrl: '/product/p13' },
  { id: 'n18', title: 'Monsoon Sale', message: '30% off on hardware and rainwear at Shree Hardware.', time: '5 days ago', type: 'deal', read: true, emoji: '🌧️', actionUrl: '/store/s8' },
  { id: 'n19', title: 'Free Health Check', message: 'Free BP check at MedPlus Pharmacy this week.', time: '6 days ago', type: 'reminder', read: true, emoji: '🏥', actionUrl: '/store/s2' },
  { id: 'n20', title: 'Festive Offer', message: '15% off on sweets and snacks — limited time!', time: '7 days ago', type: 'offer', read: true, emoji: '🪔', actionUrl: '/offers' },
  { id: 'n21', title: 'Reorder Discount', message: 'Reorder your previous items and get 5% off automatically.', time: '7 days ago', type: 'offer', read: true, emoji: '🔄' },
];
