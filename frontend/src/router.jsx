import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerProfile from './pages/CustomerProfile';
import Analytics from './pages/Analytics';
import Campaigns from './pages/Campaigns';
import Admin from './pages/Admin';
import Trainer from './pages/Trainer';

const token = () => localStorage.getItem('xeno_token');
const role = () => JSON.parse(localStorage.getItem('xeno_user') || '{}')?.role;
const Protected = ({ children }) => token() ? children : <Navigate to="/login" replace />;
const AdminOnly = ({ children }) => role() === 'admin' ? children : <Navigate to="/dashboard" replace />;

export default function Router() {
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
    <Route path="/customers/:id" element={<Protected><CustomerProfile /></Protected>} />
    <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
    <Route path="/campaigns" element={<Protected><Campaigns /></Protected>} />
    <Route path="/trainer" element={<Protected><Trainer /></Protected>} />
    <Route path="/admin" element={<AdminOnly><Admin /></AdminOnly>} />
  </Routes>;
}
