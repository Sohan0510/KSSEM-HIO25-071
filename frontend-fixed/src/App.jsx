import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './state/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';

// Auth pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// Admin & Farmer pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import FarmerDashboard from './pages/farmer/FarmerDashboard.jsx';
import Devices from './pages/farmer/Devices.jsx';

export default function App() {
  const { user, loading } = useAuth();
  const role = String(user?.role || '').toLowerCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-500 text-sm animate-pulse">
          Loading authentication...
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={
          <Navigate
            to={
              user
                ? role === 'admin'
                  ? '/admin'
                  : role === 'farmer'
                  ? '/farmer'
                  : '/login'
                : '/login'
            }
            replace
          />
        }
      />

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Farmer */}
      <Route
        path="/farmer"
        element={
          <ProtectedRoute role="farmer">
            <Layout>
              <FarmerDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/devices"
        element={
          <ProtectedRoute role="farmer">
            <Layout>
              <Devices />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
