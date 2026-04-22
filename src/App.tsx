import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { LanguageProvider } from './context/LanguageContext';
import BottomNav from './components/BottomNav';
import FloatingCart from './components/FloatingCart';

import SplashPage from './pages/SplashPage';
import OnboardingPage from './pages/OnboardingPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ProductDetailPage from './pages/ProductDetailPage';
import StoreDetailPage from './pages/StoreDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrdersPage from './pages/OrdersPage';
import WishlistPage from './pages/WishlistPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ComparePage from './pages/ComparePage';
import OffersPage from './pages/OffersPage';
import HelpPage from './pages/HelpPage';
import VendorDashboard from './pages/VendorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import OrderTrackingPage from './pages/OrderTrackingPage';

function AppRoutes() {
  const { isLoggedIn, isVendor, isAdmin } = useAuth();

  return (
    <>
      <Routes>
        <Route path="/splash" element={<SplashPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={isLoggedIn ? (isAdmin ? <AdminDashboard /> : isVendor ? <VendorDashboard /> : <HomePage />) : <Navigate to="/splash" replace />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/store/:id" element={<StoreDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success" element={<OrderSuccessPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderTrackingPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/vendor" element={<VendorDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <FloatingCart />
      <BottomNav />
    </>
  );
}

function NotFoundPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-8">
      <span className="text-7xl">🗺️</span>
      <h1 className="text-2xl font-bold mt-6">Page Not Found</h1>
      <p className="text-gray-400 text-sm mt-2 text-center">Looks like you've wandered off the map. Let's get you back.</p>
      <a href="/" className="mt-6 bg-orange-500 text-white px-8 py-3 rounded-2xl font-semibold text-sm">Go Home</a>
    </div>
  );
}

export default function App() {
  React.useEffect(() => {
    if (localStorage.getItem('prizzo_dark_mode') === 'true') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AppRoutes />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
