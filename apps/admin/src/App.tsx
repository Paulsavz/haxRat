import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import CustomersPage from './pages/CustomersPage';
import ChatInboxPage from './pages/ChatInboxPage';
import CallCenterPage from './pages/CallCenterPage';
import PromotionsPage from './pages/PromotionsPage';
import DeliveryPage from './pages/DeliveryPage';
import StaffPage from './pages/StaffPage';
import SettingsPage from './pages/SettingsPage';
import { useAdminStore } from './store/adminStore';
import IncomingCallAlert from './components/layout/IncomingCallAlert';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { admin } = useAdminStore();
  if (!admin) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { initSocket, admin } = useAdminStore();

  useEffect(() => {
    if (admin) {
      initSocket();
    }
  }, [admin, initSocket]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '8px', fontSize: '14px' },
        }}
      />
      <IncomingCallAlert />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="chat" element={<ChatInboxPage />} />
          <Route path="calls" element={<CallCenterPage />} />
          <Route path="promotions" element={<PromotionsPage />} />
          <Route path="delivery" element={<DeliveryPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
