import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useTelemetryData from '../hooks/useTelemetryData';
import StatCard from '../components/StatCard';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import { Play, RefreshCw, Terminal, Cpu, Database, Eye } from 'lucide-react';

export default function Admin() {
  const nav = useNavigate();
  const { data: users, refresh: refreshUsers } = useTelemetryData('/admin/users');
  const { data: config, refresh: refreshConfig } = useTelemetryData('/admin/config');
  const { data: logs, refresh: refreshLogs } = useTelemetryData('/admin/override-logs');
  const { data: summary, refresh: refreshSummary } = useTelemetryData('/analytics/summary');
  const { data: triggers, refresh: refreshTriggers } = useTelemetryData('/admin/triggers');
  const { data: campaigns, refresh: refreshCampaigns } = useTelemetryData('/campaigns');
  
  const [tab, setTab] = useState('overview');
  const [dbLoading, setDbLoading] = useState(false);
  const { socket } = useSocket();
  const terminalEndRef = useRef(null);
  const [consoleLogs, setConsoleLogs] = useState([
    `[${new Date().toLocaleTimeString()}] [SYS] Initializing Xeno Telemetry Cockpit...`,
    `[${new Date().toLocaleTimeString()}] [SYS] Connecting to Mongoose Schema Registry...`,
    `[${new Date().toLocaleTimeString()}] [SYS] Active Connection established with Atlas Cluster.`,
    `[${new Date().toLocaleTimeString()}] [SYS] WebSocket listening on channel: live_telemetry.`,
    `[${new Date().toLocaleTimeString()}] [SYS] Console ready.`
  ]);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight;
    }
  }, [consoleLogs]);

  useEffect(() => {
    const addLog = (msg) => {
      setConsoleLogs(prev => [...prev.slice(-30), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };
    
    if (socket) {
      const handleScore = (data) => {
        addLog(`[TELEMETRY] Broadcasted score update: Customer ${data.customerId.slice(-6)} -> Score ${data.newScore} (${data.newTier.toUpperCase()})`);
      };
      const handleBulk = (data) => {
        addLog(`[JOB] Bulk Scoring complete: Recalculated ${data.customers?.length || 0} user risk factors.`);
      };
      const handleOverride = (data) => {
        addLog(`[AUDIT] Override applied: Customer ${data.customerId?.slice(-6) || 'Unknown'} set to ${data.newTier?.toUpperCase() || 'LOW'}`);
      };

      socket.on('score_updated', handleScore);
      socket.on('bulk_scores_updated', handleBulk);
      socket.on('override_applied', handleOverride);

      const timer = setInterval(() => {
        const cpu = (Math.random() * 8 + 4).toFixed(1);
        const mem = Math.round(380 + Math.random() * 40);
        addLog(`[SYS] Diagnosing system: CPU ${cpu}% | RAM ${mem}MB | WS Status: Connected`);
      }, 10000);

      return () => {
        socket.off('score_updated', handleScore);
        socket.off('bulk_scores_updated', handleBulk);
        socket.off('override_applied', handleOverride);
        clearInterval(timer);
      };
    }
  }, [socket]);

  const toggleTrigger = async (key, val) => {
    try {
      await api.post('/admin/triggers', { [key]: val });
      toast.success('Automation rule updated');
      await refreshTriggers();
    } catch {
      toast.error('Failed to update trigger rule');
    }
  };

  const refreshAll = async () => {
    await Promise.all([
      refreshUsers(), 
      refreshConfig(), 
      refreshSummary(), 
      refreshTriggers(),
      refreshCampaigns(),
      refreshLogs()
    ]);
  };

  const recalculate = async () => {
    setDbLoading(true);
    try {
      await api.post('/customers/recalculate');
      toast.success('Scores recalculated successfully');
      await refreshAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Recalculation failed');
    } finally {
      setDbLoading(false);
    }
  };

  const seedDatabase = async () => {
    setDbLoading(true);
    try {
      const res = await api.post('/admin/database/seed');
      toast.success(res.data.message || 'Seeded mock database successfully!');
      await refreshAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to seed database');
    } finally {
      setDbLoading(false);
    }
  };

  const clearDatabase = async () => {
    if (!window.confirm('WIPE DATABASE WARNING: This will permanently delete all customer profiles, override records, and campaign histories. Are you sure?')) {
      return;
    }
    setDbLoading(true);
    try {
      const res = await api.post('/admin/database/clear');
      toast.success(res.data.message || 'Database wiped clean!');
      await refreshAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to clear database');
    } finally {
      setDbLoading(false);
    }
  };

  const tabs = ['overview', 'triggers', 'config', 'campaigns', 'templates', 'database', 'users'];

  return (
    <div className="page">
      <div className="page-hero">
        <div>
          <div className="hero-chip">System controls</div>
          <h1>Admin Cockpit</h1>
          <p>Configure automated risk workflows, manage system databases, and inspect telemetry dispatches.</p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button className="btn ghost-btn" onClick={refreshAll} disabled={dbLoading}>Refresh</button>
          <button className="btn ghost-btn" onClick={() => nav('/dashboard')}>Tracker</button>
        </div>
      </div>

      <div className="grid stats-grid is-visible" style={{ marginBottom: 18 }}>
        <StatCard title="Total Customers" value={summary?.totalCustomers || 0} color="#72f1b8" trendValue="+4.1%" />
        <StatCard title="High Risk" value={summary?.highRisk || 0} color="#ff6b6b" trend="down" trendValue="-1.4%" />
        <StatCard title="Campaigns Sent" value={summary?.campaignsSent || 0} color="#4cb7ff" trendValue="+12%" />
        <StatCard title="Recovered This Week" value={summary?.recoveredThisWeek || 0} color="#ffb84d" trendValue="+8%" />
      </div>

      <div className="tabs-nav-scroll">
        {tabs.map(name => (
          <button key={name} className={`btn ${tab === name ? '' : 'ghost-btn'}`} onClick={() => setTab(name)} disabled={dbLoading}>
            {name === 'config' ? 'Risk Config' : name.charAt(0).toUpperCase() + name.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid" style={{ gridTemplateColumns:'1.2fr .8fr', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Operational Controls Card */}
            <div className="card glass-card" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>System Action Cockpit</h3>
              <div className="grid" style={{ gap: 16 }}>
                <div className="history-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <RefreshCw size={18} className={dbLoading ? 'spin-anim' : ''} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <div>
                      <strong style={{ display: 'block', fontSize: 14 }}>Real-Time Sync</strong>
                      <span style={{ color: 'var(--muted)', fontSize: 12 }}>Fetch current system counters and telemetry stats.</span>
                    </div>
                  </div>
                  <button className="btn ghost-btn" onClick={refreshAll} disabled={dbLoading} style={{ fontSize: 11, padding: '6px 12px', minWidth: 90 }}>
                    Sync Stats
                  </button>
                </div>

                <div className="history-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Cpu size={18} style={{ color: '#72f1b8', flexShrink: 0 }} />
                    <div>
                      <strong style={{ display: 'block', fontSize: 14 }}>Recalculate Risk Scoring</strong>
                      <span style={{ color: 'var(--muted)', fontSize: 12 }}>Trigger background server calculation of all customer scores.</span>
                    </div>
                  </div>
                  <button className="btn" onClick={recalculate} disabled={dbLoading} style={{ fontSize: 11, padding: '6px 12px', background: 'linear-gradient(135deg, #72f1b8, #4cb7ff)', color: '#05101a', fontWeight: 'bold', minWidth: 90 }}>
                    {dbLoading ? 'Running...' : 'Run Scorer'}
                  </button>
                </div>

                <div className="history-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Database size={18} style={{ color: '#ffb84d', flexShrink: 0 }} />
                    <div>
                      <strong style={{ display: 'block', fontSize: 14 }}>Database Seed controls</strong>
                      <span style={{ color: 'var(--muted)', fontSize: 12 }}>Go directly to seed panel to repopulate mock telemetry databases.</span>
                    </div>
                  </div>
                  <button className="btn ghost-btn" onClick={() => setTab('database')} style={{ fontSize: 11, padding: '6px 12px', minWidth: 90 }}>
                    Manage DB
                  </button>
                </div>
              </div>
            </div>

            {/* Audit Logs Registry */}
            <div className="card glass-card" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Manager Override Audit Registry</h3>
              <div style={{ maxHeight: 250, overflowY: 'auto' }} className="table-card">
                <table className="premium-table" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Overridden Tier</th>
                      <th>Reason</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(logs || []).length ? (logs || []).map((l, i) => (
                      <tr key={i} className="table-row">
                        <td style={{ fontWeight: 'bold' }}>{l.customerName}</td>
                        <td style={{ color: 'var(--muted)' }}>{l.customerEmail}</td>
                        <td>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            background: l.newTier === 'high' ? 'rgba(255,107,107,0.1)' : l.newTier === 'medium' ? 'rgba(255,184,77,0.1)' : 'rgba(114,241,184,0.1)',
                            color: l.newTier === 'high' ? '#ff6b6b' : l.newTier === 'medium' ? '#ffb84d' : '#72f1b8'
                          }}>
                            {l.newTier}
                          </span>
                        </td>
                        <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.reason}>
                          {l.reason}
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(l.createdAt).toLocaleString()}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)' }}>
                          No manager override registry records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Engine Overview */}
            <div className="card glass-card" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Engine Overview</h3>
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>Database Node</span>
                  <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11, background: 'rgba(114,241,184,0.1)', border: '1px solid rgba(114,241,184,0.2)', color: '#72f1b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Connected</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>WebSocket Server</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="live-dot online" style={{ width: 8, height: 8 }} /> Active Online
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>Override Logs Count</span>
                  <span style={{ fontSize: 12, fontWeight: 'bold' }}>{logs?.length ?? 0} items</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>Autopilot Campaigns</span>
                  <span style={{ fontSize: 12, color: '#4cb7ff', fontWeight: 'bold' }}>{campaigns?.length ?? 0} dispatched</span>
                </div>
              </div>
            </div>

            {/* Developer CLI Terminal */}
            <div className="card glass-card" style={{ padding: 20, borderColor: 'rgba(0, 240, 255, 0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Terminal size={16} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '.04em' }}>Live Telemetry Console</span>
                </div>
                <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', borderRadius: 4 }}>STREAMING</span>
              </div>
              <div 
                ref={terminalEndRef}
                style={{ 
                  background: '#030812', 
                  border: '1px solid rgba(255,255,255,0.06)', 
                  borderRadius: 12, 
                  padding: 12, 
                  height: 180, 
                  overflowY: 'auto', 
                  fontFamily: 'Consolas, Monaco, monospace', 
                  fontSize: 10, 
                  color: '#72f1b8', 
                  lineHeight: 1.6,
                  boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.8)'
                }}
              >
                {consoleLogs.map((log, index) => (
                  <div key={index} style={{ borderBottom: '1px solid rgba(114, 241, 184, 0.03)', paddingBottom: 2, marginBottom: 2, textShadow: '0 0 4px rgba(114, 241, 184, 0.3)' }}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'triggers' && (
        <div className="grid admin-triggers-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <div className="card glass-card" style={{ padding: 24 }}>
            <div className="panel-label" style={{ marginBottom: 12, background: 'rgba(255, 107, 107, 0.12)', color: '#ff6b6b' }}>Auto-Pilot Flow</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Trigger Rule A: Discount Campaigns</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
              Automatically dispatch a 20% discount coupon to any customer whose risk score breaches the threshold.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span>Enable Automations</span>
              <button
                className="btn"
                style={{ background: triggers?.discountEnabled ? 'var(--accent)' : 'rgba(255,255,255,.08)', color: triggers?.discountEnabled ? '#05101a' : 'var(--text)' }}
                onClick={() => toggleTrigger('discountEnabled', !triggers?.discountEnabled)}
              >
                {triggers?.discountEnabled ? 'ACTIVE (ON)' : 'PAUSED (OFF)'}
              </button>
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
                Risk Threshold: <strong style={{ color: '#ff6b6b' }}>{triggers?.discountThreshold || 75}%</strong>
              </label>
              <input
                type="range"
                min="50"
                max="95"
                value={triggers?.discountThreshold || 75}
                onChange={e => toggleTrigger('discountThreshold', Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>
          </div>
          
          <div className="card glass-card" style={{ padding: 24 }}>
            <div className="panel-label" style={{ marginBottom: 12, background: 'rgba(76, 183, 255, 0.12)', color: '#4cb7ff' }}>Auto-Pilot Flow</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Trigger Rule B: Cart Reminders</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
              Automatically email a cart recovery notification when a customer's cart abandonment rate rises above the threshold.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span>Enable Automations</span>
              <button
                className="btn"
                style={{ background: triggers?.cartEnabled ? 'var(--accent)' : 'rgba(255,255,255,.08)', color: triggers?.cartEnabled ? '#05101a' : 'var(--text)' }}
                onClick={() => toggleTrigger('cartEnabled', !triggers?.cartEnabled)}
              >
                {triggers?.cartEnabled ? 'ACTIVE (ON)' : 'PAUSED (OFF)'}
              </button>
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
                Cart Abandon Rate Threshold: <strong style={{ color: '#4cb7ff' }}>{triggers?.cartThreshold || 60}%</strong>
              </label>
              <input
                type="range"
                min="40"
                max="90"
                value={triggers?.cartThreshold || 60}
                onChange={e => toggleTrigger('cartThreshold', Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>
          </div>
        </div>
      )}

      {tab === 'config' && (
        <div className="grid admin-template-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <div className="card glass-card" style={{ borderLeft: '4px solid #ff6b6b', padding: 20 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#ff6b6b', fontWeight: 'bold' }}>Category Red</span>
            <h3 style={{ margin: '4px 0 8px', fontSize: 18 }}>High Risk Segment</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5 }}>
              Applied to profiles with risk scores greater than or equal to <strong>{config?.highThreshold ?? 70}%</strong>. Prioritize recovery campaigns immediately.
            </p>
          </div>
          <div className="card glass-card" style={{ borderLeft: '4px solid #ffb84d', padding: 20 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#ffb84d', fontWeight: 'bold' }}>Category Orange</span>
            <h3 style={{ margin: '4px 0 8px', fontSize: 18 }}>Medium Risk Segment</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5 }}>
              Applied to profiles with risk scores between <strong>{config?.mediumThreshold ?? 40}%</strong> and <strong>69%</strong>. Engage with cart reminders.
            </p>
          </div>
          <div className="card glass-card" style={{ borderLeft: '4px solid #72f1b8', padding: 20 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#72f1b8', fontWeight: 'bold' }}>Category Green</span>
            <h3 style={{ margin: '4px 0 8px', fontSize: 18 }}>Low Risk Segment</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5 }}>
              Applied to profiles with risk scores below <strong>{config?.mediumThreshold ?? 40}%</strong>. Normal service retention actions apply.
            </p>
          </div>
        </div>
      )}

      {tab === 'campaigns' && (
        <div className="card glass-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Dispatched Marketing Campaigns Log</h3>
          <div className="table-card" style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Recipient Name</th>
                  <th>Email</th>
                  <th>Template Type</th>
                  <th>Trigger Mode</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(campaigns || []).length ? (campaigns || []).map((c, i) => (
                  <tr key={i} className="table-row">
                    <td>{c.customerName}</td>
                    <td style={{ color: 'var(--muted)' }}>{c.email}</td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, background: c.templateType === 'discount' ? 'rgba(255,107,107,0.1)' : 'rgba(76,183,255,0.1)', color: c.templateType === 'discount' ? '#ff6b6b' : '#4cb7ff', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {c.templateType}
                      </span>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize', color: c.triggeredBy === 'autopilot' ? 'var(--accent)' : 'var(--muted)' }}>
                        {c.triggeredBy || 'Manual'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{new Date(c.sentAt).toLocaleString()}</td>
                    <td>
                      <span style={{ color: '#72f1b8' }}>● Dispatched</span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)' }}>
                      No campaign logs recorded in database. Enable autopilot to track dispatches.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'templates' && (
        <div className="grid admin-template-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <div className="card glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '100%', height: 26, background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 4, marginBottom: 12 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff6b6b' }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffb84d' }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#72f1b8' }} />
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Discount Email</h3>
              <span style={{ display: 'block', fontSize: 11, color: '#ff6b6b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Urgency Promotion</span>
              <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.5, marginBottom: 16 }}>
                "We prepared a special discount to bring you back today. Click below to claim your coupon."
              </p>
            </div>
            <div style={{ width: '100%', padding: '10px', background: 'rgba(0, 240, 255, 0.1)', border: '1px dashed rgba(0, 240, 255, 0.3)', borderRadius: 8, textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: '#00f0ff' }}>
              Claim 20% Discount
            </div>
          </div>
          
          <div className="card glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '100%', height: 26, background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 4, marginBottom: 12 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff6b6b' }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffb84d' }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#72f1b8' }} />
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Cart Recovery Email</h3>
              <span style={{ display: 'block', fontSize: 11, color: '#4cb7ff', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Abandonment Recovery</span>
              <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.5, marginBottom: 16 }}>
                "You left items in your cart. Complete your checkout before the offer expires."
              </p>
            </div>
            <div style={{ width: '100%', padding: '10px', background: 'rgba(76, 183, 255, 0.1)', border: '1px dashed rgba(76, 183, 255, 0.3)', borderRadius: 8, textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: '#4cb7ff' }}>
              Complete Checkout
            </div>
          </div>

          <div className="card glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '100%', height: 26, background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 4, marginBottom: 12 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff6b6b' }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffb84d' }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#72f1b8' }} />
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Feedback Loyalty Email</h3>
              <span style={{ display: 'block', fontSize: 11, color: '#72f1b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Engagement Reward</span>
              <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.5, marginBottom: 16 }}>
                "Your feedback helps us improve. Share your suggestions to claim your loyalty prize."
              </p>
            </div>
            <div style={{ width: '100%', padding: '10px', background: 'rgba(114, 241, 184, 0.1)', border: '1px dashed rgba(114, 241, 184, 0.3)', borderRadius: 8, textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: '#72f1b8' }}>
              Share Feedback
            </div>
          </div>
        </div>
      )}

      {tab === 'database' && (
        <div className="grid system-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>System Seed Controls</h3>
              <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
                Populates your MongoDB Atlas database collections with a set of 150 mock customers, custom shopping carts, order drop ratios, and active score histories. 
                <br /><br />
                <em>Note: This action requires the database to be empty. Wipe all data first if needed.</em>
              </p>
            </div>
            <button className="btn" onClick={seedDatabase} disabled={dbLoading} style={{ width: '100%' }}>
              {dbLoading ? 'Processing...' : 'Seed 150 Mock Profiles'}
            </button>
          </div>

          <div className="card glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderColor: 'rgba(255, 107, 107, 0.25)' }}>
            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#ff6b6b' }}>Destructive Reset</h3>
              <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
                Wipes and purges all Mongoose schemas from Atlas, permanently deleting all customer accounts, autopilot campaigns, override statistics, and audit logs.
                <br /><br />
                <strong>This action is destructive and cannot be undone.</strong>
              </p>
            </div>
            <button className="btn danger-btn" onClick={clearDatabase} disabled={dbLoading} style={{ width: '100%' }}>
              {dbLoading ? 'Wiping Database...' : 'Wipe Database Clean'}
            </button>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card glass-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>System Access Control Registry</h3>
          <div className="grid" style={{ gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {(users || []).map(u => (
              <div key={u.id} className="history-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
                <div>
                  <strong style={{ display: 'block', fontSize: 14 }}>{u.name}</strong>
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>{u.email}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, background: 'rgba(0,240,255,0.1)', color: '#00f0ff', textTransform: 'uppercase', fontWeight: 'bold' }}>{u.role}</span>
                  <div style={{ fontSize: 11, color: '#72f1b8', marginTop: 4 }}>● Active Session</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
