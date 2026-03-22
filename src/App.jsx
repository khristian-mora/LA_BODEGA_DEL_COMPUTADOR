import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ShopProvider } from './context/ShopContext';
import { SettingsProvider } from './context/SettingsContext';
import { ModalProvider } from './context/ModalContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Support from './pages/Support';
import Enterprise from './pages/Enterprise';
import Builder from './pages/Builder';
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import AdminInventory from './pages/admin/Inventory';
import AdminSuppliers from './pages/admin/Suppliers';
import AdminMarketing from './pages/admin/Marketing';
import AdminTechService from './pages/admin/TechService';
import AdminHR from './pages/admin/HumanResources';
import AdminFinance from './pages/admin/Finance';
import AdminReturns from './pages/admin/Returns';
import AdminLogin from './pages/admin/Login';
import AdminUsers from './pages/admin/Users';
import AdminCustomers from './pages/admin/Customers';
import AdminAppointments from './pages/admin/Appointments';
import AdminReports from './pages/admin/Reports';
import AdminWarranties from './pages/admin/Warranties';
import AdminSettings from './pages/admin/Settings';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import CookiePolicy from './pages/legal/CookiePolicy';
import TermsOfService from './pages/legal/TermsOfService';
import CookieConsent from './components/CookieConsent';
import { AuditProvider } from './context/AuditContext';

function App() {
  return (
    <ShopProvider>
      <SettingsProvider>
        <AuditProvider>
          <ModalProvider>
            <Router>
              <ScrollToTop />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/laptops" element={<Catalog />} />
                <Route path="/components" element={<Catalog />} />
                <Route path="/accessories" element={<Catalog />} />
                <Route path="/printers" element={<Catalog />} />
                <Route path="/furniture" element={<Catalog />} />
                <Route path="/gaming" element={<Catalog />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/support" element={<Support />} />
                <Route path="/enterprise" element={<Enterprise />} />
                <Route path="/builder" element={<Builder />} />

                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Admin Routes — pública: solo /admin/login */}
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* Admin Routes — protegidas: requieren token */}
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
                <Route path="/admin/inventory" element={<ProtectedRoute><AdminInventory /></ProtectedRoute>} />
                <Route path="/admin/suppliers" element={<ProtectedRoute><AdminSuppliers /></ProtectedRoute>} />
                <Route path="/admin/marketing" element={<ProtectedRoute><AdminMarketing /></ProtectedRoute>} />
                <Route path="/admin/tech-service" element={<ProtectedRoute><AdminTechService /></ProtectedRoute>} />
                <Route path="/admin/hr" element={<ProtectedRoute><AdminHR /></ProtectedRoute>} />
                <Route path="/admin/finance" element={<ProtectedRoute><AdminFinance /></ProtectedRoute>} />
                <Route path="/admin/returns" element={<ProtectedRoute><AdminReturns /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
                <Route path="/admin/customers" element={<ProtectedRoute><AdminCustomers /></ProtectedRoute>} />
                <Route path="/admin/appointments" element={<ProtectedRoute><AdminAppointments /></ProtectedRoute>} />
                <Route path="/admin/reports" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
                <Route path="/admin/warranties" element={<ProtectedRoute><AdminWarranties /></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />

                {/* Legal Routes */}
                <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                <Route path="/legal/cookies" element={<CookiePolicy />} />
                <Route path="/legal/terms" element={<TermsOfService />} />
              </Routes>
              <CookieConsent />
            </Router>
          </ModalProvider>
        </AuditProvider>
      </SettingsProvider>
    </ShopProvider>
  );
}

export default App;
