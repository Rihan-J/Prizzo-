# 🛍️ Prizzo — Find it nearby. Pick it smart.

> **Hyperlocal product discovery PWA** — Search nearby stores, compare prices, reserve items, and pick them up. Built for the modern local shopper.

![Prizzo](https://img.shields.io/badge/Prizzo-v1.0.0-orange?style=for-the-badge) ![React](https://img.shields.io/badge/React-19.x-blue?style=for-the-badge) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge) ![Vite](https://img.shields.io/badge/Vite-8.x-purple?style=for-the-badge) ![Express](https://img.shields.io/badge/Express-JS-green?style=for-the-badge) ![Postgres](https://img.shields.io/badge/PostgreSQL-NeonDB-blue?style=for-the-badge)

---

## 🚀 What is Prizzo?

Prizzo is a **Full-Stack, Multi-Tenant Hyperlocal Marketplace**. 
It's a **"Search → Compare → Reserve → Pick Up"** experience for everyday needs — groceries, medicines, restaurant food, electronics, and more — all from **local stores near you**.

Unlike traditional delivery apps, Prizzo empowers consumers to **discover, compare, and pickup smartly**, while giving small local vendors a digital storefront with dynamic margin-based pricing.

---

## 👥 3-Tier User Roles & Workflows

Prizzo is powered by a robust Role-Based Access Control (RBAC) system:

### 1. 👤 The User (Shopper)
* Global smart search and category browsing.
* Dynamic cart management with order flow.
* Tracks live status of orders (Confirmed ➔ Preparing ➔ Ready ➔ Completed).

### 2. 🏪 The Vendor (Store Owner)
* **Store Setup:** Creates a digital storefront bound to their profile.
* **Pricing Engine:** Vendors do *not* set the final retail price manually. They input their `Base Price` and a `Profit Margin %`. Prizzo automatically calculates the final `Selling Price` seen by customers.
* **Dashboard:** A complete administration panel to view orders, check net earnings, and manage multi-product inventory stock in real-time.
* *Note: Vendors must be verified by the Admin before they can start selling.*

### 3. 🛡️ The Super Admin (Platform Owner)
* **Vendor Governance:** Complete control to Approve, Reject, or Block vendor storefronts.
* **Content Moderation:** Global visibility over every product across all stores with the ability to instantly remove non-compliant items.
* **Financial Analytics:** Tracks Platform Gross Revenue, total 5% Platform Commissions earned, and vendor payouts.
* **Secure Overrides:** Advanced API-driven password reset capabilities for any user/vendor without exposing or storing raw passwords.

---

## 💰 The Pricing & Commission Engine

Prizzo operates on an automated financial engine:
1. **Dynamic Retail Price**: `Base Price` + (`Base Price` × `Profit Margin %`) = `Selling Price`
2. **Platform Commission**: The platform takes a flat **5% commission** on the total order value at checkout.
3. **Vendor Net Earnings**: Total Order Value minus the 5% platform fee. All data is snapshotted to the database permanently.

---

## 🛠️ Full Tech Stack

| Domain | Technology |
|---|---|
| **Frontend UI** | React 19, Vite 8, Tailwind CSS 4, Framer Motion |
| **Backend API** | Node.js, Express.js |
| **Database** | PostgreSQL (hosted on Neon.tech), Prisma ORM |
| **Security/Auth** | JWT Token authentication, bcrypt password hashing |
| **PWA** | vite-plugin-pwa (Installable web app) |

---

## 🏃 Quick Start Environment Setup

To run Prizzo locally, you need two terminal windows running simultaneously.

### 1. Set up the Backend (Database & API)
```bash
# Navigate to the backend folder
cd hackathon/prizzo/backend

# Install backend dependencies (ignoring peer-conflicts)
npm install --legacy-peer-deps

# Important: Ensure you create a .env file locally with your Neon PostgreSQL DATABASE_URL
# Example: DATABASE_URL="postgresql://user:password@hostname/db_name?sslmode=require"

# Setup the Database Schema
npx prisma generate
npx prisma db push

# Start the Backend API (runs on http://localhost:5000)
npm run dev
```

### 2. Set up the Frontend (UI)
```bash
# Open a NEW terminal pointing to the project root
cd hackathon/prizzo

# Install frontend UI dependencies
npm install --legacy-peer-deps

# Start the Frontend App (runs on http://localhost:5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. *(Best viewed in a mobile layout viewport).*

---

## 📁 Accurate Project Structure

```text
prizzo/
├── backend/                  # Full-Stack Node.js Backend API
│   ├── .env                  # Secret keys & DATABASE_URL
│   ├── prisma/               # Database ORM Management
│   │   └── schema.prisma     # Real relational DB schema (User, Vendor, Store, Product, Order)
│   ├── src/
│   │   ├── config/           # Database configurations
│   │   ├── controllers/      # Core Business Logic (admin, auth, order, user, vendor)
│   │   ├── middlewares/      # Security layers (JWT, Role checking)
│   │   ├── routes/           # Protected API Endpoints (/admin, /vendor, /user)
│   │   ├── services/         # Third-party integrations & helpers
│   │   └── server.js         # Entrypoint for Express backend
│   └── package.json          # Backend dependencies
│
├── src/                      # React Frontend UI
│   ├── assets/               # Static images & icons
│   ├── components/           # Reusable UI Blocks (NavBars, Cards, Spinners)
│   ├── context/              # Global React State (Auth, Cart, Wishlist)
│   ├── data/                 # Local configurations & UI assets
│   ├── locales/              # i18n Translation content support
│   ├── pages/                # All 20+ Screens (Home, VendorDashboard, AdminDashboard, etc.)
│   ├── services/             # Axios API interceptors hitting backend (/api)
│   ├── App.tsx               # Root App Router & Authentication barriers
│   ├── index.css             # Tailwind base & global styles
│   └── main.tsx              # React mounting root
│
├── .gitignore                # Secured environment rules
├── package.json              # Frontend dependencies
├── tailwind.config.js        # UI Theming configs
└── vite.config.ts            # PWA & Vite build configs
```

---

## 👨‍💻 Built with ❤️ for Hackathon Demo

Made in India 🇮🇳
