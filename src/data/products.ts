export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  mrp: number;
  discount: number;
  unit: string;
  storeId: string;
  storeName: string;
  inStock: boolean;
  stockCount: number;
  rating: number;
  reviewCount: number;
  pickupEta: number;
  emoji: string;
  tags: string[];
  variants?: { label: string; price: number }[];
  bestseller?: boolean;
  isVeg?: boolean;
}

export const products: Product[] = [
  // --- GROCERY ---
  { id: 'p1', name: 'Aashirvaad Atta 5kg', brand: 'Aashirvaad', category: 'grocery', description: 'Whole wheat atta for soft rotis. Rich in fiber and nutrients.', price: 248, mrp: 280, discount: 11, unit: '5kg', storeId: 's1', storeName: 'Sri Sai Supermarket', inStock: true, stockCount: 20, rating: 4.5, reviewCount: 89, pickupEta: 10, emoji: '🌾', tags: ['atta', 'wheat', 'flour'], bestseller: true },
  { id: 'p2', name: 'Tata Salt 1kg', brand: 'Tata', category: 'grocery', description: 'Vacuum evaporated iodized salt. Pure and healthy.', price: 24, mrp: 28, discount: 14, unit: '1kg', storeId: 's1', storeName: 'Sri Sai Supermarket', inStock: true, stockCount: 50, rating: 4.6, reviewCount: 134, pickupEta: 10, emoji: '🧂', tags: ['salt', 'iodized'] },
  { id: 'p3', name: 'Fortune Sunflower Oil 1L', brand: 'Fortune', category: 'grocery', description: 'Light and healthy sunflower oil for daily cooking.', price: 145, mrp: 165, discount: 12, unit: '1L', storeId: 's1', storeName: 'Sri Sai Supermarket', inStock: true, stockCount: 15, rating: 4.3, reviewCount: 67, pickupEta: 10, emoji: '🛢️', tags: ['oil', 'cooking', 'sunflower'] },
  { id: 'p4', name: 'India Gate Basmati Rice 1kg', brand: 'India Gate', category: 'grocery', description: 'Premium aged basmati rice with long grains and aromatic flavor.', price: 155, mrp: 180, discount: 14, unit: '1kg', storeId: 's14', storeName: 'Laxmi General Stores', inStock: true, stockCount: 30, rating: 4.7, reviewCount: 203, pickupEta: 14, emoji: '🍚', tags: ['rice', 'basmati', 'premium'], bestseller: true },
  { id: 'p5', name: 'Amul Butter 500g', brand: 'Amul', category: 'dairy', description: 'Pasteurized table butter made from fresh cream.', price: 255, mrp: 270, discount: 6, unit: '500g', storeId: 's13', storeName: 'Pure Milk & Dairy', inStock: true, stockCount: 12, rating: 4.8, reviewCount: 445, pickupEta: 5, emoji: '🧈', tags: ['butter', 'dairy', 'amul'], bestseller: true },
  { id: 'p6', name: 'Nandini Milk 1L', brand: 'Nandini', category: 'dairy', description: 'Fresh toned milk from Karnataka Milk Federation.', price: 52, mrp: 55, discount: 5, unit: '1L', storeId: 's13', storeName: 'Pure Milk & Dairy', inStock: true, stockCount: 40, rating: 4.9, reviewCount: 312, pickupEta: 5, emoji: '🥛', tags: ['milk', 'dairy', 'fresh'] },

  // --- MEDICINE ---
  { id: 'p7', name: 'Paracetamol 500mg Strip', brand: 'Crocin', category: 'medicine', description: 'Fever & pain relief tablet. 10 tablets per strip.', price: 18, mrp: 22, discount: 18, unit: 'Strip of 10', storeId: 's2', storeName: 'MedPlus Pharmacy', inStock: true, stockCount: 100, rating: 4.7, reviewCount: 567, pickupEta: 5, emoji: '💊', tags: ['fever', 'painkiller', 'paracetamol'], bestseller: true },
  { id: 'p8', name: 'Dolo 650mg Strip', brand: 'Dolo', category: 'medicine', description: 'Paracetamol 650mg for high fever relief.', price: 28, mrp: 32, discount: 13, unit: 'Strip of 10', storeId: 's2', storeName: 'MedPlus Pharmacy', inStock: true, stockCount: 80, rating: 4.8, reviewCount: 389, pickupEta: 5, emoji: '💊', tags: ['fever', 'dolo', 'paracetamol'], bestseller: true },
  { id: 'p9', name: 'Vicks VapoRub 25g', brand: 'Vicks', category: 'medicine', description: 'Mentholated topical ointment for cough and cold relief.', price: 90, mrp: 105, discount: 14, unit: '25g', storeId: 's11', storeName: 'City Pharmacy', inStock: true, stockCount: 25, rating: 4.5, reviewCount: 234, pickupEta: 8, emoji: '🫙', tags: ['cold', 'cough', 'vicks'] },
  { id: 'p10', name: 'Cetirizine 10mg Strip', brand: 'Zeetrid', category: 'medicine', description: 'Antihistamine for allergy relief. Non-drowsy formula.', price: 35, mrp: 42, discount: 17, unit: 'Strip of 10', storeId: 's2', storeName: 'MedPlus Pharmacy', inStock: true, stockCount: 60, rating: 4.3, reviewCount: 145, pickupEta: 5, emoji: '💊', tags: ['allergy', 'antihistamine'] },
  { id: 'p11', name: 'Digene Antacid 200ml', brand: 'Digene', category: 'medicine', description: 'Liquid antacid for acidity and heartburn relief.', price: 145, mrp: 165, discount: 12, unit: '200ml', storeId: 's11', storeName: 'City Pharmacy', inStock: false, stockCount: 0, rating: 4.4, reviewCount: 189, pickupEta: 8, emoji: '🧴', tags: ['antacid', 'acidity', 'digene'] },
  { id: 'p12', name: 'Glucon-D 500g', brand: 'Glucon-D', category: 'medicine', description: 'Instant energy with glucose and vitamin C.', price: 165, mrp: 195, discount: 15, unit: '500g', storeId: 's2', storeName: 'MedPlus Pharmacy', inStock: true, stockCount: 18, rating: 4.6, reviewCount: 278, pickupEta: 5, emoji: '⚡', tags: ['energy', 'glucose', 'vitamins'] },

  // --- FOOD / RESTAURANT ---
  { id: 'p13', name: 'Masala Dosa', brand: 'Hotel Kamath Deluxe', category: 'food', description: 'Crisp dosa with spiced potato filling, served with chutneys and sambar.', price: 80, mrp: 80, discount: 0, unit: '1 plate', storeId: 's5', storeName: 'Hotel Kamath Deluxe', inStock: true, stockCount: 999, rating: 4.8, reviewCount: 678, pickupEta: 20, emoji: '🫓', tags: ['dosa', 'south indian', 'breakfast'], bestseller: true, isVeg: true },
  { id: 'p14', name: 'Chicken Biryani (Full)', brand: 'Biryani House', category: 'food', description: 'Aromatic basmati biryani with tender chicken pieces cooked in dum style.', price: 220, mrp: 250, discount: 12, unit: '1 serving', storeId: 's6', storeName: 'Biryani House', inStock: true, stockCount: 999, rating: 4.6, reviewCount: 534, pickupEta: 25, emoji: '🍛', tags: ['biryani', 'chicken', 'dum'], bestseller: true, isVeg: false },
  { id: 'p15', name: 'Veg Thali', brand: 'Hotel Kamath Deluxe', category: 'food', description: 'Full veg thali with rice, dal, 2 sabzis, roti, salad, and dessert.', price: 150, mrp: 180, discount: 17, unit: '1 thali', storeId: 's5', storeName: 'Hotel Kamath Deluxe', inStock: true, stockCount: 999, rating: 4.7, reviewCount: 412, pickupEta: 20, emoji: '🍱', tags: ['thali', 'veg', 'full meal'], bestseller: true, isVeg: true },
  { id: 'p16', name: 'Idli Sambar (4 pcs)', brand: 'Hotel Kamath Deluxe', category: 'food', description: 'Steamed soft idlis with fresh sambar and coconut chutney.', price: 60, mrp: 60, discount: 0, unit: '4 pieces', storeId: 's5', storeName: 'Hotel Kamath Deluxe', inStock: true, stockCount: 999, rating: 4.9, reviewCount: 789, pickupEta: 15, emoji: '🍚', tags: ['idli', 'breakfast', 'south indian'], isVeg: true },
  { id: 'p17', name: 'Crispy Vada (2 pcs)', brand: 'Hotel Kamath Deluxe', category: 'food', description: 'Crispy medu vada served with sambar and chutney.', price: 50, mrp: 60, discount: 17, unit: '2 pieces', storeId: 's5', storeName: 'Hotel Kamath Deluxe', inStock: true, stockCount: 999, rating: 4.5, reviewCount: 234, pickupEta: 15, emoji: '🍩', tags: ['vada', 'snack', 'south indian'], isVeg: true },
  { id: 'p18', name: 'Mutton Sukka', brand: 'Desi Dhaba', category: 'food', description: 'Dry spiced mutton with fresh herbs and traditional masalas.', price: 280, mrp: 320, discount: 13, unit: '1 portion', storeId: 's10', storeName: 'Desi Dhaba', inStock: true, stockCount: 999, rating: 4.4, reviewCount: 167, pickupEta: 30, emoji: '🍖', tags: ['mutton', 'non-veg', 'spicy'], isVeg: false },
  { id: 'p19', name: 'Butter Naan (2 pcs)', brand: 'Spice Garden Restaurant', category: 'food', description: 'Soft leavened bread baked in tandoor with butter glaze.', price: 70, mrp: 80, discount: 13, unit: '2 pieces', storeId: 's15', storeName: 'Spice Garden Restaurant', inStock: true, stockCount: 999, rating: 4.6, reviewCount: 289, pickupEta: 25, emoji: '🫓', tags: ['naan', 'bread', 'indian'], isVeg: true },

  // --- BAKERY ---
  { id: 'p20', name: 'Chocolate Truffle Cake 500g', brand: 'Surya Bakery', category: 'bakery', description: 'Rich chocolate truffle cake layered with ganache. Perfect for any occasion.', price: 450, mrp: 520, discount: 13, unit: '500g', storeId: 's4', storeName: 'Surya Bakery & Sweets', inStock: true, stockCount: 8, rating: 4.9, reviewCount: 234, pickupEta: 8, emoji: '🍰', tags: ['cake', 'chocolate', 'celebration'], bestseller: true },
  { id: 'p21', name: 'Plain Croissant', brand: 'Surya Bakery', category: 'bakery', description: 'Flaky buttery croissant baked fresh every morning.', price: 45, mrp: 55, discount: 18, unit: '1 piece', storeId: 's4', storeName: 'Surya Bakery & Sweets', inStock: true, stockCount: 20, rating: 4.7, reviewCount: 145, pickupEta: 8, emoji: '🥐', tags: ['croissant', 'bakery', 'breakfast'] },
  { id: 'p22', name: 'Mysore Pak 250g', brand: 'Surya Bakery', category: 'bakery', description: 'Traditional Karnataka sweet made with gram flour, ghee and sugar.', price: 180, mrp: 200, discount: 10, unit: '250g', storeId: 's4', storeName: 'Surya Bakery & Sweets', inStock: true, stockCount: 15, rating: 4.8, reviewCount: 312, pickupEta: 8, emoji: '🍬', tags: ['sweet', 'mysore pak', 'traditional'], bestseller: true },

  // --- ELECTRONICS ---
  { id: 'p23', name: 'Boat Airdopes 141', brand: 'Boat', category: 'electronics', description: 'TWS earbuds with 42H total playback and ASAP charge.', price: 1299, mrp: 2990, discount: 57, unit: '1 pair', storeId: 's3', storeName: 'Zara Mobile World', inStock: true, stockCount: 5, rating: 4.2, reviewCount: 1234, pickupEta: 15, emoji: '🎧', tags: ['earbuds', 'wireless', 'boat'], bestseller: true },
  { id: 'p24', name: '20W Fast Charger + Cable', brand: 'Realme', category: 'electronics', description: 'Orange DART Flash charge 20W compatible with multiple devices.', price: 749, mrp: 1200, discount: 38, unit: '1 set', storeId: 's3', storeName: 'Zara Mobile World', inStock: true, stockCount: 10, rating: 4.4, reviewCount: 567, pickupEta: 15, emoji: '🔌', tags: ['charger', 'fast charge', 'usb-c'] },
  { id: 'p25', name: 'Mobile Screen Guard (Tempered)', brand: 'Mietubl', category: 'electronics', description: 'Tempered glass screen protector 9H hardness for all phones.', price: 99, mrp: 299, discount: 67, unit: '2 pack', storeId: 's3', storeName: 'Zara Mobile World', inStock: true, stockCount: 30, rating: 4.0, reviewCount: 234, pickupEta: 15, emoji: '📱', tags: ['screen guard', 'tempered', 'protection'] },
  { id: 'p26', name: 'Power Bank 10000mAh', brand: 'Mi', category: 'electronics', description: 'Slim power bank with dual outputs and micro USB + Type-C input.', price: 1099, mrp: 1499, discount: 27, unit: '1 unit', storeId: 's12', storeName: 'DigitalZone Electronics', inStock: false, stockCount: 0, rating: 4.3, reviewCount: 456, pickupEta: 12, emoji: '🔋', tags: ['power bank', 'mi', 'portable'] },

  // --- FRUITS & VEG ---
  { id: 'p27', name: 'Fresh Tomatoes 1kg', brand: 'Local Farm', category: 'fruits', description: 'Fresh ripe tomatoes sourced from local farms. Great for curries.', price: 40, mrp: 50, discount: 20, unit: '1kg', storeId: 's7', storeName: 'Nature Fresh Fruits', inStock: true, stockCount: 50, rating: 4.4, reviewCount: 89, pickupEta: 7, emoji: '🍅', tags: ['tomato', 'fresh', 'vegetable'] },
  { id: 'p28', name: 'Alphonso Mangoes 1 dozen', brand: 'Ratnagiri', category: 'fruits', description: 'Premium Alphonso mangoes with rich pulp and sweet aroma.', price: 380, mrp: 450, discount: 16, unit: '1 dozen', storeId: 's7', storeName: 'Nature Fresh Fruits', inStock: true, stockCount: 10, rating: 4.9, reviewCount: 234, pickupEta: 7, emoji: '🥭', tags: ['mango', 'alphonso', 'seasonal'], bestseller: true },
  { id: 'p29', name: 'Baby Spinach 250g', brand: 'Organic', category: 'fruits', description: 'Tender baby spinach leaves. Washed and ready to use.', price: 55, mrp: 70, discount: 21, unit: '250g', storeId: 's7', storeName: 'Nature Fresh Fruits', inStock: true, stockCount: 20, rating: 4.2, reviewCount: 45, pickupEta: 7, emoji: '🌿', tags: ['spinach', 'organic', 'greens'] },

  // --- SNACKS ---
  { id: 'p30', name: 'Lay\'s Classic Salted', brand: 'Lay\'s', category: 'snacks', description: 'Classic salted potato chips for a crispy snacking experience.', price: 20, mrp: 20, discount: 0, unit: '26g', storeId: 's1', storeName: 'Sri Sai Supermarket', inStock: true, stockCount: 100, rating: 4.3, reviewCount: 567, pickupEta: 10, emoji: '🥔', tags: ['chips', 'snack', 'lays'] },
  { id: 'p31', name: 'Maggi 2-Minute Noodles 4-pack', brand: 'Maggi', category: 'snacks', description: 'The original 2-minute noodles. 4 pack combo.', price: 68, mrp: 76, discount: 11, unit: '4 x 70g', storeId: 's14', storeName: 'Laxmi General Stores', inStock: true, stockCount: 35, rating: 4.6, reviewCount: 1234, pickupEta: 14, emoji: '🍜', tags: ['maggi', 'noodles', 'instant'], bestseller: true },
  { id: 'p32', name: 'Haldiram\'s Mixture 400g', brand: 'Haldiram\'s', category: 'snacks', description: 'Crunchy mixed snack with nuts, sev, and savory bites.', price: 130, mrp: 155, discount: 16, unit: '400g', storeId: 's1', storeName: 'Sri Sai Supermarket', inStock: true, stockCount: 22, rating: 4.4, reviewCount: 289, pickupEta: 10, emoji: '🥜', tags: ['mixture', 'namkeen', 'haldirams'] },

  // --- MORE GROCERY ---
  { id: 'p33', name: 'Bru Coffee 200g', brand: 'Bru', category: 'grocery', description: 'Premium roasted and ground coffee blend. Rich aroma.', price: 215, mrp: 250, discount: 14, unit: '200g', storeId: 's1', storeName: 'Sri Sai Supermarket', inStock: true, stockCount: 18, rating: 4.5, reviewCount: 234, pickupEta: 10, emoji: '☕', tags: ['coffee', 'bru', 'morning'] },
  { id: 'p34', name: 'Red Label Tea 500g', brand: 'Brooke Bond', category: 'grocery', description: 'Robust tea blend with strong flavor for the perfect cup.', price: 258, mrp: 295, discount: 13, unit: '500g', storeId: 's14', storeName: 'Laxmi General Stores', inStock: true, stockCount: 25, rating: 4.6, reviewCount: 445, pickupEta: 14, emoji: '🍵', tags: ['tea', 'red label', 'morning'] },
  { id: 'p35', name: 'Colgate MaxFresh Toothpaste', brand: 'Colgate', category: 'grocery', description: 'Fresh gel toothpaste with cooling crystals for 12-hour freshness.', price: 120, mrp: 140, discount: 14, unit: '150g', storeId: 's14', storeName: 'Laxmi General Stores', inStock: true, stockCount: 40, rating: 4.4, reviewCount: 678, pickupEta: 14, emoji: '🦷', tags: ['toothpaste', 'colgate', 'hygiene'] },
  { id: 'p36', name: 'Dove Soap 3-pack', brand: 'Dove', category: 'grocery', description: 'Moisturizing beauty bar with 1/4 moisturizing cream.', price: 199, mrp: 225, discount: 12, unit: '3 x 75g', storeId: 's1', storeName: 'Sri Sai Supermarket', inStock: true, stockCount: 28, rating: 4.7, reviewCount: 567, pickupEta: 10, emoji: '🧼', tags: ['soap', 'dove', 'body care'] },

  // --- MEDICINE extras ---
  { id: 'p37', name: 'Bandaid Premium 20 strips', brand: 'Band-Aid', category: 'medicine', description: 'Flexible fabric bandages for minor cuts and wounds.', price: 145, mrp: 175, discount: 17, unit: '20 strips', storeId: 's11', storeName: 'City Pharmacy', inStock: true, stockCount: 35, rating: 4.3, reviewCount: 123, pickupEta: 8, emoji: '🩹', tags: ['bandaid', 'first aid', 'wound'] },
  { id: 'p38', name: 'Vitamin D3 60 tablets', brand: 'Fast&Up', category: 'medicine', description: 'Vitamin D3 2000 IU for bone and immunity health.', price: 399, mrp: 499, discount: 20, unit: '60 tablets', storeId: 's2', storeName: 'MedPlus Pharmacy', inStock: true, stockCount: 20, rating: 4.5, reviewCount: 234, pickupEta: 5, emoji: '💊', tags: ['vitamin d', 'supplement', 'immunity'] },
  { id: 'p39', name: 'Thermometer Digital', brand: 'Rossmax', category: 'medicine', description: 'Fast and accurate digital thermometer. Result in 10 seconds.', price: 349, mrp: 450, discount: 22, unit: '1 unit', storeId: 's2', storeName: 'MedPlus Pharmacy', inStock: true, stockCount: 12, rating: 4.6, reviewCount: 189, pickupEta: 5, emoji: '🌡️', tags: ['thermometer', 'medical device', 'fever'] },

  // --- ELECTRONICS extras ---
  { id: 'p40', name: 'USB Type-C Cable 1m', brand: 'Anchor', category: 'electronics', description: 'Braided USB-C cable supporting fast charging and data transfer.', price: 199, mrp: 399, discount: 50, unit: '1m', storeId: 's3', storeName: 'Zara Mobile World', inStock: true, stockCount: 25, rating: 4.1, reviewCount: 345, pickupEta: 15, emoji: '🔌', tags: ['cable', 'usb-c', 'charging'] },
  { id: 'p41', name: 'Bluetooth Speaker Mini', brand: 'JBL Go Clone', category: 'electronics', description: 'Portable mini bluetooth speaker with 5H battery life.', price: 799, mrp: 1499, discount: 47, unit: '1 unit', storeId: 's12', storeName: 'DigitalZone Electronics', inStock: true, stockCount: 6, rating: 3.9, reviewCount: 178, pickupEta: 12, emoji: '🔊', tags: ['speaker', 'bluetooth', 'portable'] },

  // --- STATIONERY ---
  { id: 'p42', name: 'Classmate Notebook 200 pages', brand: 'ITC Classmate', category: 'stationery', description: 'Single line A4 notebook with sturdy cover.', price: 85, mrp: 100, discount: 15, unit: '1 book', storeId: 's9', storeName: 'Lotus Stationery', inStock: true, stockCount: 50, rating: 4.3, reviewCount: 234, pickupEta: 10, emoji: '📓', tags: ['notebook', 'classmate', 'stationery'] },
  { id: 'p43', name: 'Pilot G2 Pen Set 5 pcs', brand: 'Pilot', category: 'stationery', description: 'Smooth gel ink pens. Blue, black, red, green, and purple.', price: 225, mrp: 275, discount: 18, unit: '5 pens', storeId: 's9', storeName: 'Lotus Stationery', inStock: true, stockCount: 15, rating: 4.7, reviewCount: 189, pickupEta: 10, emoji: '✏️', tags: ['pen', 'pilot', 'gel ink'] },

  // --- HARDWARE ---
  { id: 'p44', name: 'Philips LED Bulb 9W', brand: 'Philips', category: 'hardware', description: 'Energy saving LED bulb. 9W, 950 lumens, cool daylight.', price: 149, mrp: 199, discount: 25, unit: '1 bulb', storeId: 's8', storeName: 'Shree Hardware & Tools', inStock: true, stockCount: 30, rating: 4.5, reviewCount: 312, pickupEta: 12, emoji: '💡', tags: ['bulb', 'led', 'philips'] },
  { id: 'p45', name: 'Stanley Tape Measure 5m', brand: 'Stanley', category: 'hardware', description: 'Durable steel tape measure with lock mechanism.', price: 250, mrp: 350, discount: 29, unit: '5m', storeId: 's8', storeName: 'Shree Hardware & Tools', inStock: true, stockCount: 8, rating: 4.4, reviewCount: 89, pickupEta: 12, emoji: '📏', tags: ['tape', 'measure', 'stanley'] },

  // --- MORE FOOD ---
  { id: 'p46', name: 'Paneer Butter Masala', brand: 'Spice Garden Restaurant', category: 'food', description: 'Creamy tomato-based curry with soft paneer chunks.', price: 200, mrp: 230, discount: 13, unit: '1 portion', storeId: 's15', storeName: 'Spice Garden Restaurant', inStock: true, stockCount: 999, rating: 4.7, reviewCount: 345, pickupEta: 25, emoji: '🍛', tags: ['paneer', 'curry', 'north indian'], isVeg: true, bestseller: true },
  { id: 'p47', name: 'Chicken Tandoori (Half)', brand: 'Spice Garden Restaurant', category: 'food', description: 'Marinated half chicken roasted in clay oven.', price: 320, mrp: 380, discount: 16, unit: '1 serving', storeId: 's15', storeName: 'Spice Garden Restaurant', inStock: true, stockCount: 999, rating: 4.5, reviewCount: 289, pickupEta: 30, emoji: '🍗', tags: ['tandoori', 'chicken', 'non-veg'], isVeg: false },
  { id: 'p48', name: 'Fresh Lime Soda', brand: 'Hotel Kamath Deluxe', category: 'food', description: 'Chilled lime soda, sweet or salted your choice.', price: 50, mrp: 60, discount: 17, unit: '1 glass', storeId: 's5', storeName: 'Hotel Kamath Deluxe', inStock: true, stockCount: 999, rating: 4.6, reviewCount: 567, pickupEta: 10, emoji: '🥤', tags: ['drink', 'lime', 'refreshing'], isVeg: true },

  // --- DAIRY extras ---
  { id: 'p49', name: 'Britannia Cheese Slices 10 pcs', brand: 'Britannia', category: 'dairy', description: 'Processed cheese slices for sandwiches and burgers.', price: 110, mrp: 130, discount: 15, unit: '10 slices', storeId: 's1', storeName: 'Sri Sai Supermarket', inStock: true, stockCount: 18, rating: 4.3, reviewCount: 156, pickupEta: 10, emoji: '🧀', tags: ['cheese', 'britannia', 'dairy'] },
  { id: 'p50', name: 'Mother Dairy Curd 400g', brand: 'Mother Dairy', category: 'dairy', description: 'Thick and creamy set curd. Made from fresh milk.', price: 55, mrp: 65, discount: 15, unit: '400g', storeId: 's13', storeName: 'Pure Milk & Dairy', inStock: true, stockCount: 22, rating: 4.7, reviewCount: 234, pickupEta: 5, emoji: '🥛', tags: ['curd', 'yogurt', 'dairy'], bestseller: true },
];

// Compare prices data: same product across multiple stores
export interface PriceComparison {
  productName: string;
  productEmoji: string;
  category: string;
  stores: {
    storeId: string;
    storeName: string;
    price: number;
    inStock: boolean;
    distance: number;
    pickupEta: number;
    badge?: 'cheapest' | 'fastest' | 'bestValue';
  }[];
}

export const priceComparisons: PriceComparison[] = [
  {
    productName: 'Paracetamol 500mg Strip',
    productEmoji: '💊',
    category: 'medicine',
    stores: [
      { storeId: 's2', storeName: 'MedPlus Pharmacy', price: 18, inStock: true, distance: 0.7, pickupEta: 5, badge: 'cheapest' },
      { storeId: 's11', storeName: 'City Pharmacy', price: 20, inStock: true, distance: 0.6, pickupEta: 8, badge: 'fastest' },
      { storeId: 's14', storeName: 'Laxmi General Stores', price: 22, inStock: true, distance: 1.0, pickupEta: 14 },
    ],
  },
  {
    productName: 'Aashirvaad Atta 5kg',
    productEmoji: '🌾',
    category: 'grocery',
    stores: [
      { storeId: 's1', storeName: 'Sri Sai Supermarket', price: 248, inStock: true, distance: 0.4, pickupEta: 10, badge: 'cheapest' },
      { storeId: 's14', storeName: 'Laxmi General Stores', price: 255, inStock: true, distance: 1.0, pickupEta: 14 },
      { storeId: 's7', storeName: 'Nature Fresh Fruits', price: 260, inStock: false, distance: 0.5, pickupEta: 7 },
    ],
  },
  {
    productName: 'Boat Airdopes 141 Earbuds',
    productEmoji: '🎧',
    category: 'electronics',
    stores: [
      { storeId: 's3', storeName: 'Zara Mobile World', price: 1299, inStock: true, distance: 1.1, pickupEta: 15, badge: 'cheapest' },
      { storeId: 's12', storeName: 'DigitalZone Electronics', price: 1399, inStock: true, distance: 1.3, pickupEta: 12, badge: 'fastest' },
    ],
  },
  {
    productName: 'Amul Butter 500g',
    productEmoji: '🧈',
    category: 'dairy',
    stores: [
      { storeId: 's13', storeName: 'Pure Milk & Dairy', price: 255, inStock: true, distance: 0.2, pickupEta: 5, badge: 'cheapest' },
      { storeId: 's1', storeName: 'Sri Sai Supermarket', price: 262, inStock: true, distance: 0.4, pickupEta: 10 },
      { storeId: 's14', storeName: 'Laxmi General Stores', price: 265, inStock: true, distance: 1.0, pickupEta: 14 },
    ],
  },
];
