import { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'English' | 'Hindi' | 'Kannada';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  English: {
    // BottomNav
    Home: 'Home',
    Search: 'Search',
    Cart: 'Cart',
    Activity: 'Activity',
    Orders: 'Orders',
    Wishlist: 'Wishlist',
    Profile: 'Profile',

    // HomePage — Greeting
    Morning: 'Morning',
    Afternoon: 'Afternoon',
    Evening: 'Evening',
    Good: 'Good',
    Guest: 'Guest',
    Vendor: 'Vendor',

    // HomePage — Search & Location
    'Shivamogga, Karnataka': 'Shivamogga, Karnataka',
    'Search groceries, medicines, food…': 'Search groceries, medicines, food…',

    // HomePage — Section titles
    Categories: 'Categories',
    'See all': 'See all',
    'What are you looking for today?': 'What are you looking for today?',
    '🔥 Trending Products': '🔥 Trending Products',
    '📍 Best Pickup Stores Near You': '📍 Best Pickup Stores Near You',
    '⚡ Quick Deals': '⚡ Quick Deals',
    '🍽️ Top Restaurant Dishes': '🍽️ Top Restaurant Dishes',
    '💊 Pharmacy Essentials': '💊 Pharmacy Essentials',
    '📱 Electronics Picks': '📱 Electronics Picks',
    '🛒 Grocery Essentials': '🛒 Grocery Essentials',

    // HomePage — Compare CTA
    'Compare Nearby Prices': 'Compare Nearby Prices',
    'Same product. Different stores. Best deals.': 'Same product. Different stores. Best deals.',
    'Compare Now': 'Compare Now',

    // Offers
    OFF: 'OFF',
    Code: 'Code',

    // Language modal
    'Select Language': 'Select Language',

    // Settings
    Settings: 'Settings',
    Language: 'Language',

    // Categories
    Grocery: 'Grocery',
    Food: 'Food',
    Medicine: 'Medicine',
    Electronics: 'Electronics',
    Bakery: 'Bakery',
    Hardware: 'Hardware',
    Stationery: 'Stationery',
    Fashion: 'Fashion',
    Beauty: 'Beauty',
    'Pet Care': 'Pet Care',
  },
  Hindi: {
    // BottomNav
    Home: 'होम',
    Search: 'खोजें',
    Orders: 'ऑर्डर',
    Wishlist: 'विशलिस्ट',
    Profile: 'प्रोफ़ाइल',

    // HomePage — Greeting
    Morning: 'सुप्रभात',
    Afternoon: 'नमस्कार',
    Evening: 'शुभ संध्या',
    Good: 'शुभ',
    Guest: 'अतिथि',
    Vendor: 'विक्रेता',

    // HomePage — Search & Location
    'Shivamogga, Karnataka': 'शिवमोगा, कर्नाटक',
    'Search groceries, medicines, food…': 'किराना, दवाई, खाना खोजें…',

    // HomePage — Section titles
    Categories: 'श्रेणियाँ',
    'See all': 'सभी देखें',
    'What are you looking for today?': 'आज क्या ढूंढ रहे हैं?',
    '🔥 Trending Products': '🔥 ट्रेंडिंग उत्पाद',
    '📍 Best Pickup Stores Near You': '📍 आपके पास के बेहतरीन स्टोर',
    '⚡ Quick Deals': '⚡ त्वरित सौदे',
    '🍽️ Top Restaurant Dishes': '🍽️ शीर्ष रेस्तरां व्यंजन',
    '💊 Pharmacy Essentials': '💊 फार्मेसी आवश्यकताएं',
    '📱 Electronics Picks': '📱 इलेक्ट्रॉनिक्स चुनाव',
    '🛒 Grocery Essentials': '🛒 किराना आवश्यकताएं',

    // HomePage — Compare CTA
    'Compare Nearby Prices': 'आसपास की कीमतों की तुलना करें',
    'Same product. Different stores. Best deals.': 'वही उत्पाद। अलग-अलग दुकानें। सबसे अच्छे सौदे।',
    'Compare Now': 'अभी तुलना करें',

    // Offers
    OFF: 'छूट',
    Code: 'कोड',

    // Language modal
    'Select Language': 'भाषा चुनें',

    // Settings
    Settings: 'सेटिंग्स',
    Language: 'भाषा',

    // Categories
    Grocery: 'किराना',
    Food: 'खाना',
    Medicine: 'दवाई',
    Electronics: 'इलेक्ट्रॉनिक्स',
    Bakery: 'बेकरी',
    Hardware: 'हार्डवेयर',
    Stationery: 'स्टेशनरी',
    Fashion: 'फैशन',
    Beauty: 'ब्यूटी',
    'Pet Care': 'पेट केयर',
  },
  Kannada: {
    // BottomNav
    Home: 'ಮುಖಪುಟ',
    Search: 'ಹುಡುಕು',
    Orders: 'ಆದೇಶಗಳು',
    Wishlist: 'ಇಷ್ಟಪಟ್ಟಿ',
    Profile: 'ಪ್ರೊಫೈಲ್',

    // HomePage — Greeting
    Morning: 'ಶುಭೋದಯ',
    Afternoon: 'ಶುಭ ಮಧ್ಯಾಹ್ನ',
    Evening: 'ಶುಭ ಸಂಜೆ',
    Good: 'ಶುಭ',
    Guest: 'ಅತಿಥಿ',
    Vendor: 'ಮಾರಾಟಗಾರ',

    // HomePage — Search & Location
    'Shivamogga, Karnataka': 'ಶಿವಮೊಗ್ಗ, ಕರ್ನಾಟಕ',
    'Search groceries, medicines, food…': 'ದಿನಸಿ, ಔಷಧಿ, ಆಹಾರ ಹುಡುಕಿ…',

    // HomePage — Section titles
    Categories: 'ವರ್ಗಗಳು',
    'See all': 'ಎಲ್ಲಾ ನೋಡಿ',
    'What are you looking for today?': 'ಇಂದು ನೀವು ಏನು ಹುಡುಕುತ್ತಿದ್ದೀರಿ?',
    '🔥 Trending Products': '🔥 ಟ್ರೆಂಡಿಂಗ್ ಉತ್ಪನ್ನಗಳು',
    '📍 Best Pickup Stores Near You': '📍 ನಿಮ್ಮ ಹತ್ತಿರದ ಅತ್ಯುತ್ತಮ ಅಂಗಡಿಗಳು',
    '⚡ Quick Deals': '⚡ ತ್ವರಿತ ಡೀಲ್‌ಗಳು',
    '🍽️ Top Restaurant Dishes': '🍽️ ಅಗ್ರ ರೆಸ್ಟೋರೆಂಟ್ ಭಕ್ಷ್ಯಗಳು',
    '💊 Pharmacy Essentials': '💊 ಫಾರ್ಮಸಿ ಅಗತ್ಯಗಳು',
    '📱 Electronics Picks': '📱 ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್ ಆಯ್ಕೆಗಳು',
    '🛒 Grocery Essentials': '🛒 ದಿನಸಿ ಅಗತ್ಯಗಳು',

    // HomePage — Compare CTA
    'Compare Nearby Prices': 'ಹತ್ತಿರದ ಬೆಲೆಗಳನ್ನು ಹೋಲಿಸಿ',
    'Same product. Different stores. Best deals.': 'ಅದೇ ಉತ್ಪನ್ನ. ವಿಭಿನ್ನ ಅಂಗಡಿಗಳು. ಅತ್ಯುತ್ತಮ ಡೀಲ್‌ಗಳು.',
    'Compare Now': 'ಈಗ ಹೋಲಿಸಿ',

    // Offers
    OFF: 'ರಿಯಾಯಿತಿ',
    Code: 'ಕೋಡ್',

    // Language modal
    'Select Language': 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ',

    // Settings
    Settings: 'ಸೆಟ್ಟಿಂಗ್ಗಳು',
    Language: 'ಭಾಷೆ',

    // Categories
    Grocery: 'ದಿನಸಿ',
    Food: 'ಆಹಾರ',
    Medicine: 'ಔಷಧಿ',
    Electronics: 'ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್',
    Bakery: 'ಬೇಕರಿ',
    Hardware: 'ಹಾರ್ಡ್‌ವೇರ್',
    Stationery: 'ಸ್ಟೇಷನರಿ',
    Fashion: 'ಫ್ಯಾಷನ್',
    Beauty: 'ಸೌಂದರ್ಯ',
    'Pet Care': 'ಪೆಟ್ ಕೇರ್',
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'English',
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(
    (localStorage.getItem('prizzo_lang') as Language) || 'English'
  );

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('prizzo_lang', lang);
  };

  const t = (key: string) => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
