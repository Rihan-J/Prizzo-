export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  emoji: string;
  bgGradient: string;
  link: string;
}

export const banners: Banner[] = [
  { id: 'b1', title: 'Compare prices. Save more.', subtitle: 'Find the best deal on everyday items nearby', cta: 'Compare Now', emoji: '💰', bgGradient: 'from-orange-400 to-orange-600', link: '/compare' },
  { id: 'b2', title: 'Fresh Groceries in 10 min', subtitle: 'Pickup from Sri Sai Supermarket', cta: 'Shop Now', emoji: '🛒', bgGradient: 'from-green-400 to-emerald-600', link: '/store/s1' },
  { id: 'b3', title: 'Biryani Special 🍛', subtitle: '₹50 off on Biryani House orders', cta: 'Order Now', emoji: '🍛', bgGradient: 'from-red-400 to-rose-600', link: '/store/s6' },
  { id: 'b4', title: 'Medicine at your door step', subtitle: 'Pickup in 5 min from MedPlus', cta: 'Browse', emoji: '💊', bgGradient: 'from-blue-400 to-blue-600', link: '/store/s2' },
];

export const aiSuggestions = [
  { text: 'Need milk nearby?', query: 'milk', emoji: '🥛' },
  { text: 'Compare charger prices', query: 'charger', emoji: '🔌' },
  { text: 'Find paracetamol open now', query: 'paracetamol', emoji: '💊' },
  { text: 'Best biryani pickup', query: 'biryani', emoji: '🍛' },
  { text: 'Fresh fruits nearby', query: 'fruits', emoji: '🥭' },
  { text: 'Bakery items in 10 min', query: 'cake', emoji: '🍰' },
];
