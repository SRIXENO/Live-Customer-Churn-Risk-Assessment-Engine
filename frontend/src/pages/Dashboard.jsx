import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import SkeletonLoader from '../components/SkeletonLoader';
import CustomerTable from '../components/CustomerTable';
import EmptyState from '../components/EmptyState';
import useTelemetryData from '../hooks/useTelemetryData';
import { useSocket } from '../context/SocketContext';
import useRealTime from '../hooks/useRealTime';
import api from '../services/api';
import toast from 'react-hot-toast';

const EMPTY_ARRAY = [];

export default function Dashboard() {
  const nav = useNavigate();
  const { data, loading, refresh } = useTelemetryData('/customers?limit=200', []);
  const customers = data?.items || EMPTY_ARRAY;
  const [rows, setRows] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const [serverWaking, setServerWaking] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const { status } = useSocket();
  const lastScored = useMemo(() => new Date().toLocaleTimeString(), [rows.length]);

  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [search, setSearch] = useState('');
  const [riskTier, setRiskTier] = useState('all');
  const [scoreFilter, setScoreFilter] = useState(null);

  const scoreGroups = useMemo(() => {
    const groups = {};
    rows.forEach(cust => {
      const score = cust.riskScore;
      if (!groups[score]) {
        groups[score] = {
          score,
          tier: cust.tier,
          customers: []
        };
      }
      groups[score].customers.push(cust);
    });
    return Object.values(groups).sort((a, b) => b.score - a.score).slice(0, 100);
  }, [rows]);

  const selectedGroupInfo = useMemo(() => {
    return scoreGroups.find(g => g.score === scoreFilter);
  }, [scoreGroups, scoreFilter]);

  const [activities, setActivities] = useState([
    {
      customerId: '0',
      customerName: 'System Core',
      activityType: 'system',
      description: 'Live customer activity stream simulator ready.',
      timestamp: new Date().toISOString()
    }
  ]);

  useRealTime('score_updated', ({ customerId, newScore, newTier }) => {
    setRows(prev => prev.map(c => c._id === customerId ? { ...c, riskScore: newScore, tier: newTier } : c));
  });

  useRealTime('bulk_scores_updated', ({ customers }) => {
    setRows(prev => prev.map(c => {
      const match = customers.find(x => x._id === c._id);
      return match ? { ...c, riskScore: match.riskScore, tier: match.tier } : c;
    }));
  });

  useRealTime('customer_added', ({ customer }) => {
    setRows(prev => [customer, ...prev.filter(c => c._id !== customer._id)]);
  });

  useRealTime('customer_deleted', ({ customerId }) => {
    setRows(prev => prev.filter(c => c._id !== customerId));
  });

  useRealTime('override_applied', (record) => {
    setRows(prev => prev.map(c => c._id === record.customerId ? { ...c, tier: record.newTier } : c));
  });

  useRealTime('customer_activity', (payload) => {
    setActivities(prev => [payload, ...prev].slice(0, 50));
    setRows(prev => prev.map(c => {
      if (c._id === payload.customerId) {
        return { ...c, riskScore: payload.riskScore, tier: payload.tier };
      }
      return c;
    }));
  });

  useRealTime('autopilot_action', (action) => {
    toast.success(`[Autopilot] Trigger: ${action.actionTaken} for ${action.customerName}`, {
      duration: 5000
    });
  });

  useEffect(() => {
    setRows(data?.items || EMPTY_ARRAY);
  }, [data?.items]);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let wakingTimer, countTimer;
    if (loading) {
      wakingTimer = setTimeout(() => setServerWaking(true), 5000);
      countTimer = setInterval(() => setLoadingTime(p => p + 1), 1000);
    } else {
      setServerWaking(false);
      setLoadingTime(0);
    }
    return () => {
      clearTimeout(wakingTimer);
      clearInterval(countTimer);
    };
  }, [loading]);

  const handleQuickRetain = async (customerId, customerName) => {
    try {
      await api.post(`/campaigns/send`, {
        customerId,
        templateId: 'discount_15'
      });
      toast.success(`Discount dispatch verified for ${customerName}!`, { icon: '📣' });
      setActivities(prev => [
        {
          customerId,
          customerName: 'System Core',
          activityType: 'campaign',
          description: `Retaliatory 15% discount code applied manually to ${customerName} profile.`,
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);
    } catch (err) {
      toast.error("Dispatched outreach template failed.");
    }
  };

  const createCustomer = async e => {
    e.preventDefault();
    setAddSaving(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get('name'),
      email: form.get('email'),
      riskScore: Number(form.get('riskScore') || 42),
      tier: form.get('tier') || 'medium',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(form.get('name') || 'Customer')}&background=random&size=128&bold=true`,
      joinDate: new Date().toISOString(),
      lastPurchaseDate: new Date().toISOString(),
      daysInactive: 0,
      cartAbandonRate: 0,
      orderFrequencyDrop: 0,
      orderHistory: [],
      cartHistory: [],
      scoreHistory: [],
      campaignHistory: [],
      overrides: []
    };
    try {
      const { data } = await api.post('/customers', payload);
      await refresh();
      setRows(prev => [data.data, ...prev.filter(c => c._id !== data.data._id)]);
      toast.success('Customer added');
      setAddOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Add customer failed');
    } finally {
      setAddSaving(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page">
        <Navbar />
        <div className="page-hero" style={{ marginTop: 8 }}>
          <div>
            <div className="hero-chip">Customer control</div>
            <h1>Tracker</h1>
            <p>Track customer risk, add new customer records, and dispatch automated recovery campaigns.</p>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button className="btn ghost-btn" onClick={() => setAddOpen(true)}>Add New Customer</button>
          </div>
        </div>
        <div className={`grid stats-grid ${revealed ? 'is-visible' : ''}`}>
          <StatCard title="Total Customers" value={customers.length} color="#72f1b8" trendValue="+8.2%" />
          <StatCard title="High Risk Today" value={customers.filter(c => c.tier === 'high').length} color="#ff6b6b" trend="down" trendValue="-3.1%" />
          <StatCard title="Campaigns Sent Today" value={12} color="#4cb7ff" trendValue="+24%" />
          <StatCard title="Recovered This Week" value={4} color="#ffb84d" trendValue="+16%" />
        </div>
        <div className={`card glass-card status-strip ${revealed ? 'is-visible' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>Socket status: {status}</div>
            <div>Last scored: {lastScored}</div>
          </div>
        </div>

        {/* Telemetry Risk Heatmap Grid Panel */}
        <div className={`card glass-card ${revealed ? 'is-visible' : ''}`} style={{ padding: 20, marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12, marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '.06em' }}>Operations Map</span>
              <h3 style={{ margin: '2px 0 0', fontSize: 16 }}>Telemetry Risk Radar Grid</h3>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#72f1b8' }} /> Low Risk</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffb84d' }} /> Medium Risk</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff6b6b' }} /> High Risk</span>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>
            {/* The Node Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(28px, 1fr))', gap: 8 }}>
              {Array.from({ length: 100 }).map((_, idx) => {
                const group = scoreGroups[idx];
                if (!group) {
                  return (
                    <div 
                      key={`placeholder-${idx}`}
                      style={{ 
                        aspectRatio: '1', 
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.06)',
                        fontFamily: 'monospace',
                        userSelect: 'none'
                      }}
                    >
                      +
                    </div>
                  );
                }

                const color = group.tier === 'high' ? '#ff6b6b' : group.tier === 'medium' ? '#ffb84d' : '#72f1b8';
                const isSelected = scoreFilter === group.score;
                const rgb = group.tier === 'high' ? '255,107,107' : group.tier === 'medium' ? '255,184,77' : '114,241,184';

                return (
                  <div
                    key={group.score}
                    onClick={() => {
                      setScoreFilter(scoreFilter === group.score ? null : group.score);
                    }}
                    onMouseEnter={() => setHoveredGroup(group)}
                    onMouseLeave={() => setHoveredGroup(null)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 6,
                      background: isSelected ? color : `rgba(${rgb}, 0.12)`,
                      border: isSelected ? '2px solid #fff' : `1px solid ${color}`,
                      color: isSelected ? '#04111b' : color,
                      boxShadow: isSelected ? `0 0 12px ${color}` : `0 0 4px rgba(${rgb}, 0.2)`,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 10,
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.15s ease',
                      animation: group.tier === 'high' ? 'pulse 2s infinite' : 'none',
                      userSelect: 'none',
                      position: 'relative'
                    }}
                  >
                    {group.score}

                    {/* Count bubble badge for duplicates */}
                    {group.customers.length > 1 && (
                      <span style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        background: '#00f0ff',
                        color: '#04111b',
                        fontSize: 8,
                        fontWeight: 'bold',
                        borderRadius: '50%',
                        width: 13,
                        height: 13,
                        display: 'grid',
                        placeItems: 'center',
                        boxShadow: '0 0 6px rgba(0, 240, 255, 0.6)',
                        border: '1px solid #fff'
                      }}>
                        {group.customers.length}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Radar Mini-Monitor Screen */}
            <div style={{ background: 'rgba(4,10,20,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 8 }}>Radar Telemetry Inspector</span>
                {hoveredGroup || selectedGroupInfo ? (
                  (() => {
                    const node = hoveredGroup || selectedGroupInfo;
                    return (
                      <div>
                        <strong style={{ fontSize: 14, display: 'block', color: '#fff', marginBottom: 2 }}>Risk Score Level: {node.score}/100</strong>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, fontSize: 11, marginBottom: 12, marginTop: 8 }}>
                          <div>
                            <span style={{ color: 'var(--muted)', display: 'block' }}>Group Volume</span>
                            <strong style={{ color: '#fff' }}>{node.customers.length} account(s)</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--muted)', display: 'block' }}>Risk Tier</span>
                            <strong style={{ textTransform: 'uppercase', color: node.tier === 'high' ? '#ff6b6b' : node.tier === 'medium' ? '#ffb84d' : '#72f1b8' }}>{node.tier}</strong>
                          </div>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
                          <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Cohort Members:</span>
                          <div style={{ maxHeight: 90, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {node.customers.map(c => (
                              <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                <span style={{ color: '#fff', fontWeight: 'bold' }}>{c.name}</span>
                                <span style={{ color: 'var(--muted)' }}>Score: {c.riskScore}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, padding: '30px 10px' }}>
                    Hover over a telemetry cell to inspect real-time account risk vectors.
                  </div>
                )}
              </div>
              
              {(hoveredGroup || selectedGroupInfo) && (hoveredGroup || selectedGroupInfo).customers.length === 1 && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => nav(`/customers/${(hoveredGroup || selectedGroupInfo).customers[0]._id}`)}
                  style={{ width: '100%', padding: '6px 12px', fontSize: 11, marginTop: 14, background: 'rgba(0, 240, 255, 0.12)', border: '1px solid rgba(0, 240, 255, 0.2)', color: '#00f0ff' }}
                >
                  Diagnose Profile & Arena
                </button>
              )}
            </div>
          </div>
        </div>
        {serverWaking && (
          <div className="card" style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700 }}>Waking up the server... ({loadingTime}s)</div>
            <div style={{ color: 'var(--muted)', marginTop: 6 }}>This only happens on first load. Usually 30-60 seconds.</div>
            <div style={{ marginTop: 10, height: 8, borderRadius: 999, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
              <div style={{ width: '55%', height: '100%', background: 'linear-gradient(90deg,#72f1b8,#4cb7ff)', animation: 'pulse 1.5s infinite' }} />
            </div>
          </div>
        )}
        <div className={`grid table-activity-grid ${revealed ? 'is-visible' : ''}`} style={{ gap: 16, marginTop: 16 }}>
          <div className={`table-wrap ${revealed ? 'is-visible' : ''}`} style={{ margin: 0 }}>
            {loading ? (
              <SkeletonLoader />
            ) : rows.length ? (
              <CustomerTable
                customers={rows}
                search={search}
                setSearch={setSearch}
                tier={riskTier}
                setTier={setRiskTier}
                scoreFilter={scoreFilter}
                setScoreFilter={setScoreFilter}
                onDelete={id => {
                  if (id === '__ALL__') {
                    setRows([]);
                    return;
                  }
                  setRows(prev => prev.filter(c => c._id !== id));
                }}
              />
            ) : (
              <EmptyState
                title="No customers left"
                message="All preset customers have been removed. Add a new customer to start monitoring telemetry again."
              />
            )}
          </div>
          <div className="activity-terminal" style={{ margin: 0 }}>
            <div className="activity-terminal-header">
              <span className="activity-terminal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="status-lamp online" style={{ width: 8, height: 8 }} />
                Dynamic Activity Stream
              </span>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>Live updates</span>
            </div>
            <div className="activity-feed-scroll">
              {activities.map((act, i) => {
                const isSystem = act.customerId === '0' || !act.customerId;
                
                // Display channel tag mappings
                let channelTag = '💻 System Telemetry';
                if (act.activityType === 'cart_abandoned') channelTag = '🛒 Cart Abandoned';
                if (act.activityType === 'checkout_viewed') channelTag = '💳 Checkout Opened';
                if (act.activityType === 'order_completed') channelTag = '🛍️ Order Placed';
                if (act.activityType === 'inactive_drift') channelTag = '💤 Inactive Drift';
                if (act.activityType === 'campaign') channelTag = '📣 Auto-Campaign';
                if (act.activityType === 'override') channelTag = '🛡️ Override Applied';

                let locationMarker = Number(act.customerId || 0) % 2 === 0 ? 'Chrome | India' : 'Safari | UK';
                if (act.description && act.description.includes('Chrome')) {
                  locationMarker = 'Chrome | India';
                } else if (act.description && act.description.includes('Safari')) {
                  locationMarker = 'Safari | UK';
                }

                return (
                  <div 
                    key={i} 
                    className={`activity-item ${act.activityType}`} 
                    style={{ 
                      borderLeft: `4px solid ${act.tier === 'high' ? 'var(--danger)' : act.tier === 'medium' ? 'var(--warn)' : '#72f1b8'}`, 
                      padding: '14px', 
                      borderRadius: '10px', 
                      background: 'rgba(255,255,255,0.015)', 
                      border: '1px solid rgba(255,255,255,0.03)', 
                      borderLeftWidth: '4px',
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '8px',
                      marginBottom: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                      <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '4px', color: 'var(--muted)', fontWeight: 'bold' }}>
                        {channelTag}
                      </span>
                      <span className="activity-time" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--muted)' }}>
                        {new Date(act.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <strong style={{ color: '#fff', fontSize: '13px' }}>{act.customerName}</strong>
                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', fontFamily: "'JetBrains Mono', monospace" }}>{act.description}</p>
                      </div>
                      {act.riskScore !== undefined && (
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: act.tier === 'high' ? 'rgba(255,107,107,0.1)' : 'rgba(255,184,77,0.1)', color: act.tier === 'high' ? '#ff6b6b' : '#ffb84d', fontWeight: 'bold', alignSelf: 'flex-start' }}>
                          {act.riskScore}% Risk
                        </span>
                      )}
                    </div>

                    {/* Metadata tags */}
                    {!isSystem && (
                      <div style={{ display: 'flex', gap: '10px', fontSize: '9px', color: 'var(--muted)', borderTop: '1px dashed rgba(255,255,255,0.04)', paddingTop: '6px' }}>
                        <span>Platform: <span style={{ color: '#fff' }}>{locationMarker}</span></span>
                        <span>•</span>
                        <span>Outreach: <span style={{ color: '#fff' }}>Simulated</span></span>
                      </div>
                    )}

                    {/* Actions Bar */}
                    {!isSystem && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
                        <button 
                          type="button" 
                          className="btn ghost-btn" 
                          onClick={() => handleQuickRetain(act.customerId, act.customerName)}
                          style={{ padding: '4px 8px', fontSize: '9px', height: 'auto', background: 'rgba(0, 240, 255, 0.05)', borderColor: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff', fontWeight: 'bold' }}
                        >
                          ⚡ Quick Retain
                        </button>
                        <button 
                          type="button" 
                          className="btn ghost-btn" 
                          onClick={() => nav(`/customers/${act.customerId}`)}
                          style={{ padding: '4px 8px', fontSize: '9px', height: 'auto', color: '#fff' }}
                        >
                          👤 Profile
                        </button>
                        <button 
                          type="button" 
                          className="btn ghost-btn" 
                          onClick={() => nav(`/customers/${act.customerId}?arena=true`)}
                          style={{ padding: '4px 8px', fontSize: '9px', height: 'auto', color: 'var(--muted)' }}
                        >
                          💬 Arena
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {addOpen && (
        <div className="modal-backdrop" onClick={() => !addSaving && setAddOpen(false)}>
          <div className="modal-card" style={{ maxWidth: 560, width: 'calc(100% - 24px)' }} onClick={e => e.stopPropagation()}>
            <div className="modal-orb modal-orb-a" />
            <div className="modal-orb modal-orb-b" />
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,240,255,0.12)', border: '1px solid rgba(0,240,255,0.3)', display: 'grid', placeItems: 'center', color: '#00f0ff' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <div className="modal-kicker">Database Registry</div>
                  <h2 style={{ margin:'4px 0 0', fontSize: 22 }}>Register Customer</h2>
                </div>
              </div>
              <button type="button" className="icon-btn" onClick={() => !addSaving && setAddOpen(false)}>×</button>
            </div>
            <form onSubmit={createCustomer} className="grid" style={{ gap:16, marginTop:20 }}>
              <div>
                <label style={{ display:'block', fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom: 2 }}>Customer Full Name</label>
                <input name="name" className="field" placeholder="e.g. Sridhar Sharma" required />
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom: 2 }}>Email Address</label>
                <input name="email" className="field" type="email" placeholder="e.g. sridhar@gmail.com" required />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div>
                  <label style={{ display:'block', fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom: 2 }}>Risk Rating Tier</label>
                  <select name="tier" className="field" defaultValue="medium" style={{ height: 49 }}>
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>
                <div>
                   <label style={{ display:'block', fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom: 2 }}>Starting Risk Score (1-99)</label>
                  <input name="riskScore" className="field" type="number" min="1" max="99" defaultValue="42" placeholder="42" required style={{ height: 49 }} />
                </div>
              </div>
              <div className="modal-actions" style={{ marginTop: 12 }}>
                <button type="button" className="btn ghost-btn" onClick={() => setAddOpen(false)} disabled={addSaving}>Cancel</button>
                <button className="btn" disabled={addSaving}>{addSaving ? 'Registering...' : 'Register Profile'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
