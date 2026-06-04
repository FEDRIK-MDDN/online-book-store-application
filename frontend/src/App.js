
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Visit from './components/visit';
import Home from './pages/UserManagement/Home';
import Login from './pages/UserManagement/Login';
import Register from './pages/UserManagement/Register';
import ChangePassword from './pages/UserManagement/ForgotPassword';
import Profile from './pages/UserManagement/Profile';
import UserList from './pages/UserManagement/UserList';
import Cart from './pages/CartManagement/Cart';
import Checkout from './pages/PaymentManagement/Checkout';
import Orders from './pages/OrderManagement/Orders';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import { useAuth } from './authContext';
import './index.css';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user && user.role === 'ADMIN' ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Visit />} />
      <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ChangePassword />} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
      <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
      <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute><UserList /></PrivateRoute>} />
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
