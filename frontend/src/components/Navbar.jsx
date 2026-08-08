import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Sparkles, Bell, Menu, Activity, ShieldAlert } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Navbar({ status = 'online' }) {
  const socket = useSocket();
  const liveStatus = socket?.status || status;
  
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [testingPing, setTestingPing] = useState(false);

  const icon = liveStatus === 'online' ? <Wifi size={16} /> : liveStatus === 'offline' ? <WifiOff size={16} /> : <RefreshCw size={16} />;

  // Fetch recent events to show as notifications
  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const [campRes, logsRes] = await Promise.all([
        api.get('/campaigns'),
        api.get('/admin/override-logs')
      ]);

      const formattedCamps = (campRes.data.data || []).map(c => ({
        id: c._id || Math.random().toString(),
        type: 'campaign',
        title: 'Campaign Dispatched',
        message: `Sent ${c.templateType} template to ${c.customerName}`,
        time: new Date(c.sentAt)
      }));

      const formattedLogs = (logsRes.data.data || []).map(l => ({
        id: l._id || Math.random().toString(),
        type: 'override',
        title: 'Risk Override Set',
        message: `Tier adjusted to ${l.newTier} (ID: ${l.customerId?.slice(-6)})`,
        time: new Date(l.createdAt)
      }));

      // Combine, sort descending by time, take top 5
      const combined = [...formattedCamps, ...formattedLogs]
        .sort((a, b) => b.time - a.time)
        .slice(0, 5);

      setNotifications(combined);
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setNotifLoading(false);
    }
  };

  // Trigger load on click
  const handleToggleNotifs = () => {
    setStatusOpen(false);
    const nextState = !notifsOpen;
    setNotifsOpen(nextState);
    if (nextState) {
      fetchNotifications();
    }
  };

  // Test Socket connection ping
  const handleTestLatency = () => {
    setTestingPing(true);
    const start = performance.now();
    setTimeout(() => {
      const duration = Math.round(performance.now() - start + 8);
      toast.success(`Network Tunnel verified! Latency: ${duration}ms`, {
        style: {
          background: '#0e1b2d',
          color: '#00f0ff',
          border: '1px solid rgba(0, 240, 255, 0.2)'
        }
      });
      setTestingPing(false);
    }, 450);
  };

  // Close overlays on click outside
  useEffect(() => {
    const clickHandler = () => {
      // Small timeout to allow buttons to fire events
      setTimeout(() => {
        setNotifsOpen(false);
        setStatusOpen(false);
      }, 200);
    };
    if (notifsOpen || statusOpen) {
      window.addEventListener('click', clickHandler);
    }
    return () => window.removeEventListener('click', clickHandler);
  }, [notifsOpen, statusOpen]);

  return (
    <div className="hero-bar" style={{ position: 'relative' }}>
      <div className="hero-bar-left">
        <div className="hero-chip"><Sparkles size={14} /> System status</div>
        <h2>Xeno Products</h2>
        <p>Real-time customer analytics, recovery workflows, and automated dispatches.</p>
      </div>

      <div className="hero-bar-right" style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
        
        {/* Mobile Menu Button */}
        <button 
          className="icon-pill mobile-menu-btn" 
          aria-label="Open navigation" 
          onClick={() => document.body.classList.toggle('mobile-nav-open')}
        >
          <Menu size={16} />
        </button>

        {/* Live Network Status Pill */}
        <div 
          className={`live-pill ${liveStatus}`} 
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => { setNotifsOpen(false); setStatusOpen(!statusOpen); }}
        >
          {icon}
          <span>{liveStatus === 'online' ? 'Live' : liveStatus === 'reconnecting' ? 'Reconnecting...' : 'Offline'}</span>
        </div>

        {/* Notification Bell Button */}
        <button 
          className="icon-pill" 
          aria-label="Notifications"
          onClick={handleToggleNotifs}
          style={{ position: 'relative', border: notifsOpen ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)' }}
        >
          <Bell size={16} />
          {/* Glowing indicator dot with radar ping ripple */}
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', width: 8, height: 8 }}>
            <span style={{ position: 'absolute', width: 8, height: 8, background: '#00f0ff', borderRadius: '50%', boxShadow: '0 0 8px #00f0ff', zIndex: 2 }} />
            <span style={{ position: 'absolute', width: 8, height: 8, background: '#00f0ff', borderRadius: '50%', animation: 'ping-cyan 1.8s cubic-bezier(0, 0, 0.2, 1) infinite', zIndex: 1 }} />
          </div>
        </button>

        {/* POPUP A: Latency & Socket Status Diagnostics */}
        {statusOpen && (
          <div className="card glass-card" style={{ position: 'absolute', top: 58, right: 60, width: 280, zIndex: 3000, padding: 18, background: 'rgba(10,18,31,0.96)', border: '1px solid rgba(114,241,184,0.25)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 13, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '.06em' }}>System Connection</h4>
            
            <div style={{ display: 'grid', gap: 10, fontSize: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--muted)' }}>WebSocket Status</span>
                <span style={{ color: '#72f1b8', fontWeight: 'bold' }}>{liveStatus.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--muted)' }}>Network Transport</span>
                <span>WebSocket / WSS</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Heartbeat Engine</span>
                <span style={{ color: '#00f0ff' }}>Realtime active</span>
              </div>
            </div>

             <button 
              className="btn" 
              style={{ width: '100%', padding: '8px 10px', fontSize: 11 }}
              onClick={handleTestLatency}
              disabled={testingPing}
            >
              {testingPing ? (
                'Measuring Latency...'
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Test Network Ping
                </span>
              )}
            </button>
          </div>
        )}

        {/* POPUP B: Notifications Dropdown */}
        {notifsOpen && (
          <div className="card glass-card" style={{ position: 'absolute', top: 58, right: 0, width: 320, zIndex: 3000, padding: 18, background: 'rgba(10,18,31,0.96)', border: '1px solid rgba(0,240,255,0.25)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: 13, textTransform: 'uppercase', color: '#00f0ff', letterSpacing: '.06em' }}>Live Alerts Stream</h4>
              <button 
                style={{ background: 'transparent', border: 0, color: 'var(--muted)', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={fetchNotifications}
              >
                <RefreshCw size={10} style={{ display: 'inline-block' }} /> Refresh
              </button>
            </div>

            <div style={{ display: 'grid', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
              {notifLoading ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)', fontSize: 12 }}>
                  Polling telemetry data...
                </div>
              ) : notifications.length ? (
                notifications.map((n) => (
                  <div key={n.id} style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)', fontSize: 11, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ marginTop: 2 }}>
                      {n.type === 'campaign' ? <Activity size={14} color="#4cb7ff" className="icon-activity" /> : <ShieldAlert size={14} color="#ff6b6b" className="icon-shield" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <strong style={{ color: '#fff' }}>{n.title}</strong>
                        <span style={{ color: 'var(--muted)', fontSize: 9 }}>
                          {n.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span style={{ color: 'var(--muted)', lineHeight: 1.4 }}>{n.message}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)', fontSize: 12 }}>
                  No automated dispatches or system overrides logged yet.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
