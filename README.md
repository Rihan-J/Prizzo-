# 🛍️ Prizzo — Find it nearby. Pick it smart.

> **Hyperlocal product discovery PWA** — Search nearby stores, compare prices, reserve items, and pick them up. Built for the modern local shopper.

![Prizzo](https://img.shields.io/badge/Prizzo-v1.0.0-orange?style=for-the-badge) ![React](https://img.shields.io/badge/React-19.x-blue?style=for-the-badge) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge) ![Vite](https://img.shields.io/badge/Vite-8.x-purple?style=for-the-badge) ![PWA](https://img.shields.io/badge/PWA-Installable-green?style=for-the-badge)

---

## 🚀 What is Prizzo?

Prizzo is **NOT** a delivery app.

It's a **"Search → Compare → Reserve → Pick Up"** experience for everyday needs — groceries, medicines, restaurant food, electronics, and more — all from **local stores near you**.

Think of it as a local product search engine with **price comparison**, **availability tracking**, and **pickup-first ordering**.

---

## 🎯 Hackathon Pitch

> "Every day, millions of people search for products at local stores but have **no visibility into prices, stock, or pickup availability**. Prizzo brings **Google-like search + Zomato-level UX** to hyperlocal physical retail — empowering consumers to **discover, compare, and pickup smartly**, while giving small local vendors a **digital storefront at zero cost**."

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔍 **Smart Search** | Real-time search across 50+ products, 15+ stores, and 10+ categories |
| 💰 **Compare Nearby Prices** | Same product, different stores — find the cheapest, fastest, best value |
| 🛒 **Cart & Checkout** | Full cart flow with store grouping, coupon support, and pickup slots |
| 📦 **Order Tracking** | Live order status: Confirmed → Preparing → Ready → Picked Up |
| 🏪 **Vendor Dashboard** | Complete merchant panel with orders, products, analytics, and stock management |
| 🎯 **AI Suggestions** | Smart contextual suggestions based on user intent |
| ❤️ **Wishlist** | Save favorite products across all categories |
| 🔔 **Notifications** | 20+ realistic notification types with actionable links |
| 🎫 **Offers & Deals** | Flash deals, coupons, and store-specific discounts |
| 📱 **PWA Installable** | Add to home screen, offline-ready, app-like experience |

---

## 🖥️ Screens (24+ pages)

- ✅ Splash Screen (animated)
- ✅ Onboarding (3 slides)
- ✅ Login / Signup (role toggle)
- ✅ Home (rich hero screen)
- ✅ Search + Filters + Sort
- ✅ Product Detail
- ✅ Store Detail
- ✅ Cart
- ✅ Checkout
- ✅ Order Success
- ✅ Orders (with timeline tracking)
- ✅ Wishlist
- ✅ Notifications
- ✅ Profile
- ✅ Settings
- ✅ Compare Prices
- ✅ Offers & Deals
- ✅ Help & Support (with chat)
- ✅ Vendor Dashboard (4 tabs)
- ✅ 404 / Empty States

---

## 🛠️ Tech Stack

| Stack | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Animations | Framer Motion |
| Routing | React Router 7 |
| Icons | Lucide React |
| PWA | vite-plugin-pwa |
| State | React Context + localStorage |

---

## 🏃 Quick Start

```bash
# Clone / Navigate to project
cd d:\hackathon\prizzo

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser (best viewed in mobile viewport).

---

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── BottomNav.tsx
│   ├── Cards.tsx
│   ├── FloatingCart.tsx
│   └── Toast.tsx
├── context/        # React Contexts (Auth, Cart, Wishlist)
├── data/           # Rich mock data (products, stores, orders, etc.)
├── pages/          # All 24+ page components
│   ├── HomePage.tsx
│   ├── SearchPage.tsx
│   ├── VendorDashboard.tsx
│   └── ...
├── App.tsx         # Root with routing
├── main.tsx        # Entry point
└── index.css       # Global styles + Tailwind
```

---

## 🇮🇳 Mock Data Context

Set in **Shivamogga / Bhadravati / Bengaluru**, Karnataka with realistic:
- 50+ products across 10 categories
- 15 stores (grocery, pharmacy, restaurants, electronics, bakery, hardware)
- 20+ offers and coupons
- 21 notifications
- 15 sample orders
- Price comparison data

---

## 🎨 Design Philosophy

- **Orange & White** primary color scheme
- Mobile-first, max-width 480px container
- Apple-level cleanliness with modern card-based UI
- Framer Motion animations throughout
- Skeleton loading states
- Premium empty states
- Glassmorphism accents

---

## 👨‍💻 Built with ❤️ for Hackathon Demo

Made in India 🇮🇳
