import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ShopProvider } from './context/ShopContext';
import { SettingsProvider } from './context/SettingsContext';
import { ModalProvider } from './context/ModalContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';

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
import TechLogin from './pages/admin/TechLogin';

import AdminUsers from './pages/admin/Users';
import AdminCustomers from './pages/admin/Customers';
import AdminAppointments from './pages/admin/Appointments';
import AdminReports from './pages/admin/Reports';
import AdminWarranties from './pages/admin/Warranties';
import AdminCoupons from './pages/admin/Coupons';
import AdminAudit from './pages/admin/Audit';
import AdminSettings from './pages/admin/Settings';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import CookiePolicy from './pages/legal/CookiePolicy';
import TermsOfService from './pages/legal/TermsOfService';
import CookieConsent from './components/CookieConsent';
import { AuditProvider } from './context/AuditContext';
import NotFound from './pages/NotFound';

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
                <Route path="/tech-login" element={<TechLogin />} />

                {/* Admin Routes — protegidas: requieren token */}
                <Route path="/admin" element={<RoleProtectedRoute allowedRoles={['admin', 'gerente', 'vendedor', 'técnico', 'rh', 'marketing', 'finanzas']}><AdminDashboard /></RoleProtectedRoute>} />
                <Route path="/admin/orders" element={<RoleProtectedRoute allowedRoles={['admin', 'gerente', 'vendedor']}><AdminOrders /></RoleProtectedRoute>} />
                <Route path="/admin/inventory" element={<RoleProtectedRoute allowedRoles={['admin', 'gerente', 'vendedor']}><AdminInventory /></RoleProtectedRoute>} />
                <Route path="/admin/suppliers" element={<RoleProtectedRoute allowedRoles={['admin', 'gerente', 'finanzas']}><AdminSuppliers /></RoleProtectedRoute>} />
                <Route path="/admin/marketing" element={<RoleProtectedRoute allowedRoles={['admin', 'gerente', 'marketing']}><AdminMarketing /></RoleProtectedRoute>} />
                <Route path="/admin/tech-service" element={<RoleProtectedRoute allowedRoles={['admin', 'gerente', 'técnico']}><AdminTechService /></RoleProtectedRoute>} />
                <Route path="/admin/hr" element={<RoleProtectedRoute allowedRoles={['admin', 'gerente', 'rh']}><AdminHR /></RoleProtectedRoute>} />
                <Route path="/admin/finance" element={<RoleProtectedRoute allowedRoles={['admin', 'gerente', 'finanzas']}><AdminFinance /></RoleProtectedRoute>} />
                <Route path="/admin/returns" element={<RoleProtectedRoute allowedRoles={['admin', 'gerente', 'vendedor']}><AdminReturns /></RoleProtectedRoute>} />
                <Route path="/admin/users" element={<RoleProtectedRoute allowedRoles={['admin', 'gerente', 'rh']}><AdminUsers /></RoleProtectedRoute>} />
                <Route path="/admin/customers" element={<RoleProtectedRoute allowedRoles={['admin', 'gerente', 'vendedor', 'técnico']}><AdminCustomers /></RoleProtectedRoute>} />
                <Route path="/admin/appointments" element={<RoleProtectedRoute allowedRoles={['admin', 'gerente', 'vendedor', 'técnico']}><AdminAppointments /></RoleProtectedRoute>} />
                <Route path="/admin/reports" element={<RoleProtectedRoute allowedRoles={['admin', 'gerente', 'finanzas', 'marketing', 'técnico']}><AdminReports /></RoleProtectedRoute>} />
                <Route path="/admin/warranties" element={<RoleProtectedRoute allowedRoles={['admin', 'gerente', 'vendedor', 'técnico']}><AdminWarranties /></RoleProtectedRoute>} />
                <Route path="/admin/coupons" element={<RoleProtectedRoute allowedRoles={['admin', 'gerente', 'marketing']}><AdminCoupons /></RoleProtectedRoute>} />
                <Route path="/admin/audit" element={<RoleProtectedRoute allowedRoles={['admin']}><AdminAudit /></RoleProtectedRoute>} />
                <Route path="/admin/settings" element={<RoleProtectedRoute allowedRoles={['admin', 'gerente']}><AdminSettings /></RoleProtectedRoute>} />

                {/* Legal Routes */}
                <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                <Route path="/legal/cookies" element={<CookiePolicy />} />
                <Route path="/legal/terms" element={<TermsOfService />} />

                {/* Catch-all Route for 404 */}
                <Route path="*" element={<NotFound />} />
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
