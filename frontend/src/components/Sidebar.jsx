import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { LayoutDashboard, LineChart, Megaphone, GraduationCap, Shield, ArrowUpRight, X } from 'lucide-react';

export default function Sidebar() {
  const socket = useSocket();
  const socketStatus = socket?.status || 'offline';

  return (
    <aside className="sidebar-shell">
      {/* Mobile Drawer Close Icon */}
      <button 
        className="icon-pill close-drawer-btn" 
        aria-label="Close navigation" 
        onClick={() => document.body.classList.remove('mobile-nav-open')}
      >
        <X size={16} />
      </button>

      {/* Brand Header block */}
      <div className="brand-block">
        <div className="brand-mark">XP</div>
        <div>
          <div className="brand-title">Xeno Products</div>
          <div className="brand-sub">Enterprise risk platform</div>
        </div>
      </div>

      {/* Clean Navigation Links with custom active/hover CSS classes */}
      <nav className="side-nav">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}
          onClick={() => document.body.classList.remove('mobile-nav-open')}
        >
          <LayoutDashboard size={16} className="side-icon-dashboard" /> 
          <span>Tracker</span>
        </NavLink>
        <NavLink 
          to="/analytics" 
          className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}
          onClick={() => document.body.classList.remove('mobile-nav-open')}
        >
          <LineChart size={16} className="side-icon-analytics" /> 
          <span>Analytics</span>
        </NavLink>
        <NavLink 
          to="/campaigns" 
          className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}
          onClick={() => document.body.classList.remove('mobile-nav-open')}
        >
          <Megaphone size={16} className="side-icon-campaigns" /> 
          <span>Campaigns</span>
        </NavLink>
        <NavLink 
          to="/trainer" 
          className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}
          onClick={() => document.body.classList.remove('mobile-nav-open')}
        >
          <GraduationCap size={16} className="side-icon-trainer" /> 
          <span>CS Trainer</span>
        </NavLink>
        <NavLink 
          to="/admin" 
          className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}
          onClick={() => document.body.classList.remove('mobile-nav-open')}
        >
          <Shield size={16} className="side-icon-admin" /> 
          <span>Admin</span>
        </NavLink>
      </nav>

      {/* Bottom Network Status Telemetry logs */}
      <div className="side-metrics">
        <div className="metric-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`status-lamp ${socketStatus}`} />
            <span>Socket Connection</span>
          </div>
          <strong style={{ textTransform: 'capitalize', color: socketStatus === 'online' ? '#72f1b8' : '#ff6b6b' }}>
            {socketStatus}
          </strong>
        </div>
        <div className="metric-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowUpRight size={12} style={{ color: 'var(--accent)' }} />
            <span>Telemetry Mode</span>
          </div>
          <strong>Realtime</strong>
        </div>
      </div>
    </aside>
  );
}
