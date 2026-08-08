import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Moon, Flame } from 'lucide-react';
import useTelemetryData from '../hooks/useTelemetryData';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Campaigns() {
  const nav = useNavigate();
  const { data, refresh } = useTelemetryData('/customers?limit=200');
  const { data: campaignLogs, refresh: refreshLogs } = useTelemetryData('/campaigns');
  const { data: campaignStats, refresh: refreshStats } = useTelemetryData('/campaigns/stats');
  
  const [templateType, setTemplateType] = useState('discount');
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [discountPercent, setDiscountPercent] = useState(20);
  const [customMsg, setCustomMsg] = useState('Complete your checkout today to claim your exclusive offer.');
  
  // Selection states
  const [selectedIds, setSelectedIds] = useState([]);
  const [sendingStatus, setSendingStatus] = useState('');
  const [bulkProgress, setBulkProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const rawCustomers = useMemo(() => data?.items || [], [data]);

  const applyAudiencePreset = (type) => {
    let matches = [];
    if (type === 'cart') {
      setRiskFilter('all');
      setSearch('');
      matches = rawCustomers.filter(c => c.cartAbandonRate >= 50);
      toast.success(`Targeting Assistant: Selected ${matches.length} Cart Abandonment candidates!`);
    } else if (type === 'inactive') {
      setRiskFilter('all');
      setSearch('');
      matches = rawCustomers.filter(c => c.daysInactive >= 30);
      toast.success(`Targeting Assistant: Selected ${matches.length} Inactive Drift candidates!`);
    } else if (type === 'high_risk') {
      setRiskFilter('high');
      setSearch('');
      matches = rawCustomers.filter(c => c.tier === 'high');
      toast.success(`Targeting Assistant: Selected ${matches.length} High-Risk accounts!`);
    }
    setSelectedIds(matches.map(c => c._id));
  };

  // Filtered target list
  const filteredCustomers = useMemo(() => {
    return rawCustomers.filter(c => {
      const matchesSearch = !search || 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.email.toLowerCase().includes(search.toLowerCase());
      
      const matchesRisk = riskFilter === 'all' || c.tier === riskFilter;
      
      return matchesSearch && matchesRisk;
    });
  }, [rawCustomers, search, riskFilter]);

  // Toggle single item selection
  const toggleSelect = id => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Select/Deselect all filtered
  const toggleSelectAll = () => {
    const allFilteredIds = filteredCustomers.map(c => c._id);
    const areAllSelected = allFilteredIds.every(id => selectedIds.includes(id));
    
    if (areAllSelected) {
      setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...allFilteredIds])]);
    }
  };

  // Send campaign to selected users
  const handleSendCampaign = async () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one customer first');
      return;
    }
    
    setIsSending(true);
    setBulkProgress(1);
    setSendingStatus(`Preparing dispatch payload for ${selectedIds.length} target(s)...`);

    try {
      // Send bulk request to backend
      const res = await api.post('/campaigns/bulk', {
        customerIds: selectedIds,
        templateType,
        discount_percent: discountPercent,
        custom_message: customMsg,
        checkout_link: window.location.origin
      });

      if (res.data.success) {
        setBulkProgress(100);
        setSendingStatus('All dispatches successfully processed!');
        toast.success(`Dispatched ${selectedIds.length} campaigns!`);
        setSelectedIds([]);
        refresh();
        refreshLogs?.();
        refreshStats?.();
      }
    } catch (err) {
      console.error(err);
      toast.error('Bulk dispatch operation failed');
      setSendingStatus('Error: Dispatch failed');
    } finally {
      setTimeout(() => {
        setIsSending(false);
        setBulkProgress(0);
        setSendingStatus('');
      }, 2500);
    }
  };

  // Email subject helper
  const subjectText = useMemo(() => {
    if (templateType === 'discount') return `Exclusive ${discountPercent}% Offer Inside!`;
    if (templateType === 'cart') return 'Complete Your Checkout Before It Expires';
    return 'Share Feedback & Claim Your Reward';
  }, [templateType, discountPercent]);

  return (
    <div className="page" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="modal-orb modal-orb-a" style={{ top: -100, right: -50, background: '#00f0ff', opacity: 0.1 }} />
      <div className="modal-orb modal-orb-b" style={{ bottom: -80, left: -50, background: '#72f1b8', opacity: 0.1 }} />

      <div className="page-hero">
        <div>
          <div className="hero-chip">Campaign & Marketing Studio</div>
          <h1>Targeted Recovery Studio</h1>
          <p>Compose behavioral email templates, select segment categories, and dispatch automated recovery logs.</p>
        </div>
        <button className="btn ghost-btn" onClick={() => nav('/dashboard')}>Tracker</button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.1fr 0.9fr', gap: 24, alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Visual Composer & Live Preview */}
        <div style={{ display: 'grid', gap: 20 }}>
          <div className="card glass-card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>1. Configure Template</h3>
            
            {/* Visual selector buttons instead of select dropdown */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <button 
                type="button" 
                className="btn" 
                style={{ flex: 1, padding: 12, fontSize: 13, background: templateType === 'discount' ? 'var(--accent)' : 'rgba(255,255,255,0.04)', color: templateType === 'discount' ? '#05101a' : 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => setTemplateType('discount')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                Discount
              </button>
              <button 
                type="button" 
                className="btn" 
                style={{ flex: 1, padding: 12, fontSize: 13, background: templateType === 'cart' ? 'var(--accent)' : 'rgba(255,255,255,0.04)', color: templateType === 'cart' ? '#05101a' : 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => setTemplateType('cart')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                Cart Recall
              </button>
              <button 
                type="button" 
                className="btn" 
                style={{ flex: 1, padding: 12, fontSize: 13, background: templateType === 'loyalty' ? 'var(--accent)' : 'rgba(255,255,255,0.04)', color: templateType === 'loyalty' ? '#05101a' : 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => setTemplateType('loyalty')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 12 20 22 4 22 4 12" />
                  <rect x="2" y="7" width="20" height="5" />
                  <line x1="12" y1="22" x2="12" y2="7" />
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                </svg>
                Loyalty Check
              </button>
            </div>

            {/* Live inputs */}
            {templateType === 'discount' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Discount Rate (%)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <input 
                    type="range" 
                    min="10" 
                    max="50" 
                    step="5"
                    value={discountPercent} 
                    onChange={e => setDiscountPercent(Number(e.target.value))} 
                    style={{ flex: 1, accentColor: 'var(--accent)' }} 
                  />
                  <strong style={{ fontSize: 16, width: 40, color: 'var(--accent)' }}>{discountPercent}%</strong>
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Urgent Call to Action Message</label>
              <textarea 
                className="field" 
                rows="3" 
                value={customMsg} 
                onChange={e => setCustomMsg(e.target.value)} 
                placeholder="Type dynamic message here..."
                style={{ resize: 'none', fontSize: 13 }}
              />
            </div>
          </div>

          {/* HTML Mock Preview Container */}
          <div className="card glass-card" style={{ padding: 24, background: 'rgba(4,10,20,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '.04em' }}>Live Composer Email Preview</h3>
              <span style={{ fontSize: 11, color: '#72f1b8' }}>● Real-time sync</span>
            </div>

            {/* Email Shell mockup */}
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#0e1b2d' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--muted)' }}>Subject:</span>
                {templateType === 'discount' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffb84d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                )}
                {templateType === 'cart' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
                {templateType === 'loyalty' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#72f1b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 12 20 22 4 22 4 12" />
                    <rect x="2" y="7" width="20" height="5" />
                    <line x1="12" y1="22" x2="12" y2="7" />
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </svg>
                )}
                <strong style={{ color: 'var(--text)' }}>{subjectText}</strong>
              </div>
              <div style={{ padding: 24, textAlign: 'center' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="url(#previewGlow)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', display: 'block', filter: 'drop-shadow(0 0 6px rgba(0,240,255,0.3))' }}>
                  <defs>
                    <linearGradient id="previewGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00f0ff" />
                      <stop offset="100%" stopColor="#72f1b8" />
                    </linearGradient>
                  </defs>
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                <h2 style={{ fontSize: 20, margin: '0 0 12px', color: '#fff' }}>
                  {templateType === 'discount' ? 'A Special Gift For You' : templateType === 'cart' ? 'Did You Leave Something Behind?' : 'We Value Your Partnership'}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 360, margin: '0 auto 20px' }}>
                  {customMsg}
                </p>

                {templateType === 'discount' && (
                  <div style={{ display: 'inline-block', padding: '10px 24px', background: 'rgba(114, 241, 184, 0.08)', border: '2px dashed var(--accent)', borderRadius: 10, fontSize: 22, fontWeight: 'bold', color: 'var(--accent)', letterSpacing: '.08em', marginBottom: 20 }}>
                    SAVE{discountPercent}NOW
                  </div>
                )}

                <div style={{ margin: '14px 0' }}>
                  <button 
                    type="button" 
                    className="btn" 
                    style={{ 
                      padding: '10px 28px', 
                      background: templateType === 'discount' ? 'linear-gradient(135deg, #ff6b6b, #ffb84d)' : 'linear-gradient(135deg, #72f1b8, #4cb7ff)',
                      color: '#05101a',
                      fontWeight: 'bold',
                      borderRadius: 999,
                      fontSize: 13
                    }}
                  >
                    {templateType === 'discount' ? 'Claim Coupon Code' : templateType === 'cart' ? 'Recover Shop Session' : 'Provide Feedback'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Target Filter & Selection Grid */}
        <div style={{ display: 'grid', gap: 20 }}>
          <div className="card glass-card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>2. Target Audience</h3>
            
            {/* Filter inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 12, marginBottom: 16 }}>
              <input 
                className="field" 
                placeholder="Search by name or email" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                style={{ marginTop: 0, padding: '10px 14px', fontSize: 13 }}
              />
              <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, background: 'rgba(0,0,0,0.1)', overflow: 'hidden', padding: 2 }}>
                {['all', 'high', 'medium'].map(t => (
                  <button
                    key={t}
                    type="button"
                    style={{ flex: 1, border: 0, background: riskFilter === t ? 'rgba(255,255,255,0.08)' : 'transparent', color: riskFilter === t ? 'var(--text)' : 'var(--muted)', fontSize: 11, cursor: 'pointer', borderRadius: 10, textTransform: 'capitalize', fontWeight: 'bold' }}
                    onClick={() => setRiskFilter(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Targeting Presets */}
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 8 }}>Targeting Assistant Presets</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn ghost-btn" onClick={() => applyAudiencePreset('cart')} style={{ fontSize: 11, padding: '6px 12px', background: 'rgba(255, 184, 77, 0.05)', border: '1px solid rgba(255, 184, 77, 0.15)', color: '#ffb84d', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShoppingCart size={13} /> Cart Recall
                </button>
                <button type="button" className="btn ghost-btn" onClick={() => applyAudiencePreset('inactive')} style={{ fontSize: 11, padding: '6px 12px', background: 'rgba(255, 107, 107, 0.05)', border: '1px solid rgba(255, 107, 107, 0.15)', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Moon size={13} /> Inactive Drift
                </button>
                <button type="button" className="btn ghost-btn" onClick={() => applyAudiencePreset('high_risk')} style={{ fontSize: 11, padding: '6px 12px', background: 'rgba(114, 241, 184, 0.05)', border: '1px solid rgba(114, 241, 184, 0.15)', color: '#72f1b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Flame size={13} /> High Risk
                </button>
              </div>
            </div>

            {/* Selection actions & Progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <button 
                type="button" 
                className="btn ghost-btn" 
                style={{ padding: '6px 12px', fontSize: 11 }}
                onClick={toggleSelectAll}
              >
                {filteredCustomers.every(c => selectedIds.includes(c._id)) ? 'Deselect All' : 'Select All Filtered'}
              </button>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                Selected: <strong style={{ color: 'var(--accent)' }}>{selectedIds.length}</strong> / {filteredCustomers.length}
              </span>
            </div>

            {/* Sending progress status */}
            {isSending && (
              <div style={{ margin: '14px 0', padding: 12, background: 'rgba(4,10,20,0.5)', borderRadius: 12, border: '1px solid rgba(0,240,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                  <span style={{ color: '#00f0ff' }}>{sendingStatus}</span>
                  <strong>{bulkProgress}%</strong>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${bulkProgress}%`, height: '100%', background: 'linear-gradient(90deg, #72f1b8, #4cb7ff)', transition: 'width 0.4s ease' }} />
                </div>
              </div>
            )}

            {/* Customer List Container */}
            <div style={{ maxHeight: 380, overflowY: 'auto', display: 'grid', gap: 10, paddingRight: 4 }}>
              {filteredCustomers.length ? filteredCustomers.map(c => {
                const isSelected = selectedIds.includes(c._id);
                return (
                  <div 
                    key={c._id} 
                    className="history-row" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '12px 14px',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid rgba(255,255,255,0.04)',
                      background: isSelected ? 'rgba(0, 240, 255, 0.04)' : 'rgba(255,255,255,0.02)',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => toggleSelect(c._id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {}} // Handle inside parent div onClick
                        style={{ cursor: 'pointer', accentColor: 'var(--accent)' }} 
                      />
                      <div>
                        <strong style={{ display: 'block', fontSize: 13 }}>{c.name}</strong>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{c.email}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        fontSize: 10, 
                        fontWeight: 'bold',
                        background: c.tier === 'high' ? 'rgba(255,107,107,0.1)' : c.tier === 'medium' ? 'rgba(255,184,77,0.1)' : 'rgba(114,241,184,0.1)',
                        color: c.tier === 'high' ? '#ff6b6b' : c.tier === 'medium' ? '#ffb84d' : '#72f1b8',
                        textTransform: 'uppercase'
                      }}>
                        {c.tier}
                      </span>
                    </div>
                  </div>
                );
              }) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>
                  No target customers matching search filters.
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn"
              disabled={isSending || selectedIds.length === 0}
              onClick={handleSendCampaign}
              style={{ width: '100%', marginTop: 18, background: selectedIds.length > 0 ? 'linear-gradient(135deg, #72f1b8, #4cb7ff)' : 'rgba(255,255,255,0.05)' }}
            >
              {isSending ? 'Dispatching Campaigns...' : `Send Campaign to ${selectedIds.length} Profile(s)`}
            </button>
          </div>
        </div>

      </div>

      {/* Recent Dispatches Log Card */}
      <div className="card glass-card table-card chart-wide" style={{ padding: 24, marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '.06em' }}>Campaign Registry</span>
            <h3 style={{ margin: '2px 0 0', fontSize: 16 }}>Recent Marketing & Win-Back Dispatches</h3>
          </div>
          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'rgba(114, 241, 184, 0.1)', color: 'var(--accent)', fontWeight: 'bold' }}>
            {campaignLogs?.length || 0} DISPATCHED
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Target Customer</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Template</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Sent Date</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Delivery status</th>
              </tr>
            </thead>
            <tbody>
              {(campaignLogs || []).slice(0, 10).map((l, i) => (
                <tr key={l._id || i} className="table-row">
                  <td style={{ padding: '14px 16px', fontWeight: 'bold' }}>{l.customerName}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--muted)' }}>{l.email}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: 4, 
                      fontSize: 10, 
                      fontWeight: 'bold',
                      background: l.templateType === 'discount' ? 'rgba(76, 183, 255, 0.1)' : l.templateType === 'cart' ? 'rgba(255, 184, 77, 0.1)' : 'rgba(114, 241, 184, 0.1)',
                      color: l.templateType === 'discount' ? '#4cb7ff' : l.templateType === 'cart' ? '#ffb84d' : '#72f1b8',
                      textTransform: 'uppercase'
                    }}>
                      {l.templateType}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>{new Date(l.sentAt).toLocaleString()}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ color: '#72f1b8', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#72f1b8' }} />
                      Delivered
                    </span>
                  </td>
                </tr>
              ))}
              {(!campaignLogs || campaignLogs.length === 0) && (
                <tr>
                  <td colSpan="5" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
                    No campaigns sent yet. Select target customers above to dispatch templates.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
