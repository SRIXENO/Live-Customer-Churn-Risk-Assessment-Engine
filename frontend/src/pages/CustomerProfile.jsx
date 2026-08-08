import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Bot, Wrench } from 'lucide-react';
import useTelemetryData from '../hooks/useTelemetryData';
import RiskBadge from '../components/RiskBadge';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import CampaignPanel from '../components/CampaignPanel';
import OverrideModal from '../components/OverrideModal';
import { sendCartEmail, sendDiscountEmail, sendLoyaltyEmail } from '../services/emailService';
import toast from 'react-hot-toast';
import api from '../services/api';
import useRealTime from '../hooks/useRealTime';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function CustomerProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, loading, refresh } = useTelemetryData(`/customers/${id}`, [id]);
  const { data: scoreHistory, refresh: refreshScoreHistory } = useTelemetryData(`/customers/${id}/score-history`, [id]);
  const { data: orders } = useTelemetryData(`/customers/${id}/orders`, [id]);
  const { data: carts } = useTelemetryData(`/customers/${id}/carts`, [id]);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const [simInactive, setSimInactive] = useState(0);
  const [simAbandon, setSimAbandon] = useState(0);
  const [simDrop, setSimDrop] = useState(0);
  const [simSaving, setSimSaving] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [arenaMood, setArenaMood] = useState('price_sensitive');
  const [arenaStrategy, setArenaStrategy] = useState('empathetic');
  const [arenaLogs, setArenaLogs] = useState([]);
  const [arenaLoading, setArenaLoading] = useState(false);
  const [arenaActive, setArenaActive] = useState(false);
  const [overrideText, setOverrideText] = useState('');
  const [liveSentiment, setLiveSentiment] = useState(50);
  const [liveRetention, setLiveRetention] = useState(40);

  const [branchEvent, setBranchEvent] = useState('checkout_failure');
  const [branchAction, setBranchAction] = useState('Send 25% checkout discount coupon automatically');
  const [branchData, setBranchData] = useState(null);
  const [branchLoading, setBranchLoading] = useState(false);

  useEffect(() => {
    if (!loading && window.location.search.includes('arena=true')) {
      const startParamArena = async () => {
        setArenaActive(true);
        setArenaLoading(true);
        setArenaLogs([]);
        setLiveSentiment(50);
        setLiveRetention(40);
        try {
          const { data: res } = await api.post(`/customers/${id}/negotiate-step`, {
            history: [],
            mood: 'price_sensitive',
            strategy: 'empathetic',
            speaker: 'agent'
          });
          setArenaLogs([{
            sender: 'agent',
            text: res.data.message,
            sentiment: res.data.sentiment,
            retentionProbability: res.data.retentionProbability,
            isRealAi: res.data.isRealAi
          }]);
          setLiveSentiment(res.data.sentiment);
          setLiveRetention(res.data.retentionProbability);
          toast.success('Auto-launched negotiation simulation arena!');
        } catch (err) {
          toast.error('Simulation negotiation starter failed');
        } finally {
          setArenaLoading(false);
        }
      };
      
      startParamArena();

      // Scroll to the arena section with a slight delay so DOM is rendered
      setTimeout(() => {
        const el = document.getElementById('arena-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [loading, id]);

  const runBranchSimulation = async () => {
    setBranchLoading(true);
    try {
      const res = await api.post(`/customers/${id}/forecast-branch`, {
        pastEvent: branchEvent === 'checkout_failure' ? 'Abandoned Cart checkout session' : branchEvent === 'inactivity' ? 'Long login inactivity logs' : 'Order purchase frequency decay',
        counterAction: branchAction
      });
      if (res.data.success) {
        setBranchData(res.data.data);
        toast.success('Simulation branching calculation complete!');
      }
    } catch (err) {
      toast.error('Simulation forecast failed');
    } finally {
      setBranchLoading(false);
    }
  };

  const startArenaSimulation = async () => {
    setArenaActive(true);
    setArenaLoading(true);
    setArenaLogs([]);
    setLiveSentiment(50);
    setLiveRetention(40);
    try {
      const { data: res } = await api.post(`/customers/${id}/negotiate-step`, {
        history: [],
        mood: arenaMood,
        strategy: arenaStrategy,
        speaker: 'agent'
      });
      setArenaLogs([{
        sender: 'agent',
        text: res.data.message,
        sentiment: res.data.sentiment,
        retentionProbability: res.data.retentionProbability,
        isRealAi: res.data.isRealAi
      }]);
      setLiveSentiment(res.data.sentiment);
      setLiveRetention(res.data.retentionProbability);
      toast.success('Negotiation simulation started!');
    } catch (err) {
      console.error(err);
      toast.error('Simulation failed to launch');
    } finally {
      setArenaLoading(false);
    }
  };

  const advanceSimulationStep = async (nextSpeaker, humanMsg = null) => {
    setArenaLoading(true);
    let updatedLogs = [...arenaLogs];
    if (humanMsg) {
      updatedLogs.push({
        sender: 'agent',
        text: humanMsg,
        sentiment: liveSentiment,
        retentionProbability: liveRetention,
        isHuman: true
      });
      setArenaLogs(updatedLogs);
    }

    try {
      const { data: res } = await api.post(`/customers/${id}/negotiate-step`, {
        history: updatedLogs.map(l => ({ sender: l.sender, text: l.text, sentiment: l.sentiment, retentionProbability: l.retentionProbability })),
        mood: arenaMood,
        strategy: arenaStrategy,
        speaker: nextSpeaker,
        humanMessage: humanMsg
      });

      if (nextSpeaker === 'customer') {
        setArenaLogs(prev => [...prev, {
          sender: 'customer',
          text: res.data.message,
          sentiment: res.data.sentiment,
          retentionProbability: res.data.retentionProbability,
          isRealAi: res.data.isRealAi
        }]);
      } else {
        setArenaLogs(prev => [...prev, {
          sender: 'agent',
          text: res.data.message,
          sentiment: res.data.sentiment,
          retentionProbability: res.data.retentionProbability,
          isRealAi: res.data.isRealAi
        }]);
      }
      setLiveSentiment(res.data.sentiment);
      setLiveRetention(res.data.retentionProbability);
    } catch (err) {
      console.error(err);
      toast.error('Simulation step failed');
    } finally {
      setArenaLoading(false);
      setOverrideText('');
    }
  };

  const runAiAnalysis = async () => {
    setAiLoading(true);
    setAiData(null);
    try {
      const { data: res } = await api.post(`/customers/${id}/ai-analyze`);
      setTimeout(() => {
        setAiData(res.data);
        setAiLoading(false);
      }, 1500);
    } catch {
      toast.error('AI analysis failed');
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (data) {
      setSimInactive(data.daysInactive || 0);
      setSimAbandon(data.cartAbandonRate || 0);
      setSimDrop(data.orderFrequencyDrop || 0);
    }
  }, [data]);

  const previewScore = useMemo(() => {
    const inactiveScore = (Math.min(simInactive, 120) / 120) * 40;
    const abandonScore = (Math.min(simAbandon, 100) / 100) * 30;
    const dropScore = (Math.min(simDrop, 100) / 100) * 30;
    const score = Math.round(inactiveScore + abandonScore + dropScore);
    return Math.max(1, Math.min(99, score));
  }, [simInactive, simAbandon, simDrop]);

  const previewTier = useMemo(() => {
    return previewScore >= 70 ? 'high' : previewScore >= 40 ? 'medium' : 'low';
  }, [previewScore]);

  useRealTime('score_updated', ({ customerId }) => {
    if (customerId === id) {
      refresh();
      refreshScoreHistory();
    }
  });

  useRealTime('override_applied', (record) => {
    if (record.customerId === id) {
      refresh();
    }
  });

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 60);
    return () => clearTimeout(t);
  }, []);

  const { chart, chartOptions } = useMemo(() => {
    const history = (scoreHistory || []).slice(-15);
    return {
      chart: {
        labels: history.map(x => {
          const d = new Date(x.date);
          const today = new Date();
          if (d.toDateString() === today.toDateString()) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
          }
          return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
        }),
        datasets: [{
          label: 'Risk Score',
          data: history.map(x => x.score),
          borderColor: '#00f0ff',
          backgroundColor: 'rgba(0, 240, 255, 0.08)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#00f0ff',
          pointBorderColor: '#fff',
          pointHoverRadius: 6
        }]
      },
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: '#0a121f',
            titleColor: '#00f0ff',
            bodyColor: '#fff',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#8ea2c0',
              font: { family: 'Inter, system-ui, sans-serif', size: 10 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 6
            }
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: {
              color: '#8ea2c0',
              font: { family: 'Inter, system-ui, sans-serif', size: 10 },
              stepSize: 20
            }
          }
        }
      }
    };
  }, [scoreHistory]);

  if (loading) return <div className="page">Loading...</div>;
  if (!data) return <div className="page">Not found</div>;

  return (
    <div className="page profile-page">
      <div className="page-hero">
        <div>
          <div className="hero-chip">Customer intelligence</div>
          <h1>{data.name}</h1>
          <p>{data.email}</p>
        </div>
        <button className="btn ghost-btn" onClick={() => nav('/dashboard')}>Back to Tracker</button>
      </div>

      <div className={`profile-shell ${revealed ? 'is-visible' : ''}`}>
        <section className="card glass-card profile-hero-card">
          <div className="profile-head">
            <img src={data.avatar} alt={data.name} className="profile-avatar" />
            <div>
              <RiskBadge tier={data.tier} size="lg" />
              <h2 style={{ margin: '14px 0 6px' }}>{data.name}</h2>
              <div style={{ color: 'var(--muted)' }}>{data.email}</div>
            </div>
          </div>
          <div className="profile-kpis">
            <div className="mini-kpi"><span>Inactive</span><strong>{data.daysInactive} days</strong></div>
            <div className="mini-kpi"><span>Cart abandon</span><strong>{data.cartAbandonRate}%</strong></div>
            <div className="mini-kpi"><span>Order drop</span><strong>{data.orderFrequencyDrop}%</strong></div>
          </div>
        </section>

        <section className="card glass-card profile-chart-card">
          <div className="panel-label" style={{ marginBottom: 12 }}>Risk trend</div>
          <div style={{ height: 260, position: 'relative' }}>
            <Line data={chart} options={chartOptions} />
          </div>
        </section>

        {/* Customer Journey Branching Simulator */}
        <section className="card glass-card journey-time-machine" style={{ gridColumn: '1 / -1', padding: 24, marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12, marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '.06em' }}>Timeline Simulation</span>
              <h3 style={{ margin: '2px 0 0', fontSize: 16 }}>Customer Journey Branching Simulator</h3>
            </div>
            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', fontWeight: 'bold' }}>
              TIME MACHINE
            </span>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
            {/* Left side: The Event Timeline */}
            <div>
              <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Event Milestones</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18, borderLeft: '2px solid rgba(255,255,255,0.06)', paddingLeft: 16, marginLeft: 8 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -22, top: 4, width: 10, height: 10, borderRadius: '50%', background: '#72f1b8' }} />
                  <strong style={{ fontSize: 12, display: 'block' }}>Account Registered</strong>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>Joined platform on {new Date(data.joinDate).toLocaleDateString()}</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -22, top: 4, width: 10, height: 10, borderRadius: '50%', background: 'var(--warn)' }} />
                  <strong style={{ fontSize: 12, display: 'block' }}>Inactivity Signature Detected</strong>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>Logged {data.daysInactive} inactive days (login decay trend)</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -22, top: 4, width: 10, height: 10, borderRadius: '50%', background: 'var(--danger)' }} />
                  <strong style={{ fontSize: 12, display: 'block' }}>Checkout Cart Friction</strong>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>Abandoned checkout session (cart abandonment rate: {data.cartAbandonRate}%)</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -22, top: 4, width: 10, height: 10, borderRadius: '50%', background: '#00f0ff', boxShadow: '0 0 8px #00f0ff' }} />
                  <strong style={{ fontSize: 12, display: 'block' }}>Live Evaluation Score</strong>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>Analyzed and flagged as {data.tier.toUpperCase()} risk segment ({data.riskScore}/100)</span>
                </div>
              </div>
            </div>

            {/* Right side: Branch alternate future controls */}
            <div style={{ background: 'rgba(4,10,20,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 18 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Configure Timeline Branch</span>
              
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Select Historical Milestone:</label>
                  <select className="field" value={branchEvent} onChange={e => setBranchEvent(e.target.value)} style={{ marginTop: 0 }}>
                    <option value="checkout_failure">Abandoned Cart checkout session</option>
                    <option value="inactivity">Long login inactivity logs</option>
                    <option value="frequency_decay">Order purchase frequency decay</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Alternate Action to Take:</label>
                  <input 
                    type="text" 
                    className="field" 
                    value={branchAction} 
                    onChange={e => setBranchAction(e.target.value)} 
                    placeholder="Type alternate action..."
                    style={{ marginTop: 0 }}
                  />
                </div>

                <button 
                  type="button" 
                  className="btn" 
                  disabled={branchLoading}
                  onClick={runBranchSimulation}
                  style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #00f0ff, #72f1b8)', color: '#04111b', fontWeight: 'bold' }}
                >
                  {branchLoading ? 'Simulating Branch...' : 'Simulate Alternate Future Branch'}
                </button>
              </div>

              {/* Simulation Result */}
              {branchData && (
                <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14, animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>Branching Outcome Forecast:</span>
                    <strong style={{ 
                      padding: '2px 8px', 
                      borderRadius: 4, 
                      fontSize: 10, 
                      background: branchData.forecastedTier === 'high' ? 'rgba(255,107,107,0.1)' : branchData.forecastedTier === 'medium' ? 'rgba(255,184,77,0.1)' : 'rgba(114,241,184,0.1)',
                      color: branchData.forecastedTier === 'high' ? '#ff6b6b' : branchData.forecastedTier === 'medium' ? '#ffb84d' : '#72f1b8',
                      textTransform: 'uppercase'
                    }}>
                      {branchData.forecastedTier} Risk ({branchData.forecastedScore}/100)
                    </strong>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>Score Trajectory Shift:</span>
                    <strong style={{ color: 'var(--danger)' }}>{data.riskScore}</strong>
                    <span style={{ color: 'var(--muted)' }}>➔</span>
                    <strong style={{ color: '#72f1b8' }}>{branchData.forecastedScore}</strong>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
                    {branchData.analysis}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="card glass-card profile-snapshot">
          <div className="panel-label">Snapshot</div>
          <div className="snapshot-grid">
            <div><span>Join date</span><strong>{new Date(data.joinDate).toLocaleDateString()}</strong></div>
            <div><span>Last purchase</span><strong>{new Date(data.lastPurchaseDate).toLocaleDateString()}</strong></div>
            <div><span>Current score</span><strong>{data.riskScore}</strong></div>
            <div><span>Customer ID</span><strong>{data._id}</strong></div>
          </div>
        </section>

        <section className="card glass-card profile-simulator-card" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-label" style={{ marginBottom: 12 }}>Simulator Mode</div>
          <h3 style={{ margin: '0 0 16px' }}>Interactive Customer Risk Simulator</h3>
          <p style={{ color: 'var(--muted)', marginTop: -8, marginBottom: 20 }}>
            Adjust the customer behavior metrics to simulate how the retention risk algorithm calculates their risk score.
          </p>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            <div>
              <label style={{ display: 'block', color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
                Days Inactive: <strong style={{ color: 'var(--text)' }}>{simInactive} days</strong>
              </label>
              <input
                type="range"
                min="0"
                max="120"
                value={simInactive}
                onChange={e => setSimInactive(Number(e.target.value))}
                className="custom-slider"
              />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
                Cart Abandon Rate: <strong style={{ color: 'var(--text)' }}>{simAbandon}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={simAbandon}
                onChange={e => setSimAbandon(Number(e.target.value))}
                className="custom-slider warn"
              />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
                Order Frequency Drop: <strong style={{ color: 'var(--text)' }}>{simDrop}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={simDrop}
                onChange={e => setSimDrop(Number(e.target.value))}
                className="custom-slider danger"
              />
            </div>
          </div>
          <div
            style={{
              marginTop: 24,
              padding: 16,
              borderRadius: 16,
              background: 'rgba(255,255,255,.03)',
              border: '1px solid var(--line)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12
            }}
          >
            <div style={{ minWidth: 240 }}>
              <span style={{ color: 'var(--muted)', fontSize: 11, display: 'block', textTransform: 'uppercase', letterSpacing: '.04em' }}>Simulated Outcome Preview</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <strong style={{ fontSize: 24, letterSpacing: '-.02em' }}>Score: {previewScore}</strong>
                <RiskBadge tier={previewTier} />
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,.08)', marginTop: 10, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  height: '100%',
                  borderRadius: 999,
                  width: `${previewScore}%`,
                  transition: 'width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.3s ease',
                  background: previewTier === 'high' ? 'var(--danger)' : previewTier === 'medium' ? 'var(--warn)' : 'var(--accent)',
                  boxShadow: `0 0 12px ${previewTier === 'high' ? 'var(--danger)' : previewTier === 'medium' ? 'var(--warn)' : 'var(--accent)'}`
                }} />
              </div>
            </div>
            <button
              className="btn"
              onClick={async () => {
                setSimSaving(true);
                try {
                  await api.post(`/customers/${data._id}/simulate`, {
                    daysInactive: simInactive,
                    cartAbandonRate: simAbandon,
                    orderFrequencyDrop: simDrop
                  });
                  toast.success('Simulation run applied!');
                  await refresh();
                  await refreshScoreHistory();
                } catch {
                  toast.error('Simulation failed to apply');
                } finally {
                  setSimSaving(false);
                }
              }}
              disabled={simSaving}
            >
              {simSaving ? 'Applying...' : 'Apply Simulation'}
            </button>
          </div>
        </section>

        <section className="card glass-card profile-ai-copilot-card" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-label" style={{ marginBottom: 12, background: 'rgba(76, 183, 255, 0.12)', color: '#bff7db' }}>AI Copilot</div>
          <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span>AI Risk Reasoner & Recovery Copilot</span>
          </h3>
          <p style={{ color: 'var(--muted)', marginTop: -8, marginBottom: 20 }}>
            Analyze behavioral telemetry to diagnose exact risk factors and auto-generate tailored recovery promotions.
          </p>

          {!aiData && !aiLoading && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <button className="btn" onClick={runAiAnalysis}>Run Telemetry Diagnostics</button>
            </div>
          )}

          {aiLoading && (
            <div style={{ padding: '24px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,.05)', borderTopColor: '#4cb7ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <div style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'monospace' }}>Processing customer telemetry...</div>
            </div>
          )}

          {aiData && (
            <div className="ai-diagnostics-container">
              <div className="ai-diagnosis-bubble">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong style={{ color: '#4cb7ff', margin: 0, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.04em' }}>Telemetry Diagnostics Diagnosis</strong>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: aiData.isRealAi ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)', color: aiData.isRealAi ? '#00f0ff' : 'var(--muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    {aiData.isRealAi ? 'Gemini Live AI' : 'Heuristic Engine'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 14 }}>{aiData.diagnosis}</p>
              </div>
              <div className="ai-recommendation-box">
                <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.04em' }}>Recovery Action Recommendation</strong>
                <p style={{ margin: 0, fontSize: 14, marginBottom: 12 }}>{aiData.recommendation}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span>Generated Promo Code:</span>
                  <span className="ai-code-display">{aiData.discountCode}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button className="btn ghost-btn" onClick={() => setAiData(null)}>Clear Analysis</button>
              </div>
            </div>
          )}
        </section>

        <section id="arena-section" className="card glass-card profile-ai-copilot-card" style={{ gridColumn: '1 / -1', borderColor: 'rgba(0, 240, 255, 0.3)' }}>
          <div className="panel-label" style={{ marginBottom: 12, background: 'rgba(0, 240, 255, 0.12)', color: '#00f0ff' }}>Multi-Agent Sandbox</div>
          <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#00f0ff' }}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>AI-vs-AI Retention Negotiation Arena</span>
          </h3>
          <p style={{ color: 'var(--muted)', marginTop: -4, marginBottom: 20, fontSize: 13 }}>
            Pit our autopilot retention agent against a simulated AI persona of <strong>{data?.name}</strong> to test coupon negotiations and sentiment recovery.
          </p>

          {!arenaActive ? (
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: 18, borderRadius: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 200 }}>
                <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Customer Mood Persona</span>
                <select 
                  value={arenaMood} 
                  onChange={e => setArenaMood(e.target.value)} 
                  style={{ background: '#0a121f', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: 10, borderRadius: 8, fontSize: 13 }}
                >
                  <option value="price_sensitive">Price-Sensitive (Demands Competitor Pricing)</option>
                  <option value="angry">Angry (Furious about checkout failures/delays)</option>
                  <option value="indifferent">Indifferent (Bored and hard to win back)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 200 }}>
                <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Agent Autopilot Strategy</span>
                <select 
                  value={arenaStrategy} 
                  onChange={e => setArenaStrategy(e.target.value)} 
                  style={{ background: '#0a121f', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: 10, borderRadius: 8, fontSize: 13 }}
                >
                  <option value="empathetic">Empathetic (Apologetic & Relationship-focused)</option>
                  <option value="aggressive">Aggressive (Urgency & High-Discount pitches)</option>
                  <option value="value_focused">Value-Focused (Feature advantages & Cart resolution)</option>
                </select>
              </div>

              <button className="btn" onClick={startArenaSimulation} style={{ background: 'linear-gradient(135deg, #00f0ff, #72f1b8)', color: '#05101a', fontWeight: 'bold', height: 40, padding: '0 24px' }}>
                Launch Arena Simulation
              </button>
            </div>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: '1fr 1.5fr', gap: 20, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: 20, borderRadius: 16 }}>
              {/* Gauges & Controls Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h4 style={{ margin: '0 0 14px', fontSize: 14 }}>Real-Time Diagnostics</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Sentiment Progress Gauge */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: 'var(--muted)' }}>Customer Sentiment</span>
                        <strong style={{ color: liveSentiment >= 70 ? '#72f1b8' : liveSentiment >= 40 ? '#ffb84d' : '#ff6b6b' }}>{liveSentiment}/100</strong>
                      </div>
                      <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }}>
                        <div style={{ width: `${liveSentiment}%`, height: '100%', borderRadius: 99, background: liveSentiment >= 70 ? '#72f1b8' : liveSentiment >= 40 ? '#ffb84d' : '#ff6b6b', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>

                    {/* Retention Probability Gauge */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: 'var(--muted)' }}>Retention Probability</span>
                        <strong style={{ color: '#00f0ff' }}>{liveRetention}%</strong>
                      </div>
                      <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }}>
                        <div style={{ width: `${liveRetention}%`, height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #00f0ff, #72f1b8)', boxShadow: '0 0 8px rgba(0, 240, 255, 0.4)', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                  <button 
                    className="btn" 
                    disabled={arenaLoading || (arenaLogs.length > 0 && arenaLogs[arenaLogs.length - 1].sender === 'customer')}
                    onClick={() => advanceSimulationStep('customer')}
                    style={{ fontSize: 12, padding: '10px' }}
                  >
                    {arenaLoading ? 'Processing...' : 'Let Customer Respond'}
                  </button>
                  <button 
                    className="btn" 
                    disabled={arenaLoading || (arenaLogs.length > 0 && arenaLogs[arenaLogs.length - 1].sender === 'agent')}
                    onClick={() => advanceSimulationStep('agent')}
                    style={{ fontSize: 12, padding: '10px', background: 'rgba(114,241,184,0.12)', border: '1px solid rgba(114,241,184,0.2)', color: '#72f1b8' }}
                  >
                    {arenaLoading ? 'Processing...' : 'Let Agent Auto-Reply'}
                  </button>
                  <button 
                    className="btn ghost-btn" 
                    onClick={() => setArenaActive(false)} 
                    style={{ fontSize: 12, padding: '8px', color: 'var(--muted)' }}
                  >
                    Reset Simulation
                  </button>
                </div>
              </div>

              {/* Chat Registry & Overrides Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: '#040b15', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, height: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {arenaLogs.map((l, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        alignSelf: l.sender === 'agent' ? 'flex-start' : 'flex-end', 
                        maxWidth: '85%', 
                        padding: '10px 14px', 
                        borderRadius: 14, 
                        fontSize: 12, 
                        lineHeight: 1.5,
                        background: l.sender === 'agent' ? 'rgba(0, 240, 255, 0.06)' : 'rgba(255, 107, 107, 0.05)', 
                        border: l.sender === 'agent' 
                          ? (l.isHuman ? '1px dashed rgba(114, 241, 184, 0.4)' : '1px solid rgba(0, 240, 255, 0.15)') 
                          : '1px solid rgba(255, 107, 107, 0.15)',
                        color: '#fff'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'var(--muted)', marginBottom: 4, gap: 12 }}>
                        <span style={{ fontWeight: 'bold', color: l.sender === 'agent' ? '#00f0ff' : '#ff6b6b', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {l.sender === 'agent' ? (
                            l.isHuman ? (
                              <>
                                <Wrench size={12} /> human manager
                              </>
                            ) : (
                              <>
                                <Bot size={12} /> autopilot agent
                              </>
                            )
                          ) : (
                            <>
                              <User size={12} /> customer ({arenaMood})
                            </>
                          )}
                        </span>
                        <span style={{ fontSize: 9 }}>
                          {l.isRealAi ? 'Gemini AI' : 'Simulation'}
                        </span>
                      </div>
                      <p style={{ margin: 0 }}>{l.text}</p>
                    </div>
                  ))}
                  {arenaLoading && (
                    <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '8px 14px', borderRadius: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span className="live-dot" style={{ width: 6, height: 6, background: '#00f0ff', animation: 'pulse 1s infinite' }} />
                      <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace' }}>AI typing...</span>
                    </div>
                  )}
                </div>

                {/* Human Takeover input bar */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input 
                    type="text" 
                    value={overrideText} 
                    onChange={e => setOverrideText(e.target.value)}
                    placeholder="Take over as human manager: Type a custom offer..." 
                    disabled={arenaLoading || (arenaLogs.length > 0 && arenaLogs[arenaLogs.length - 1].sender === 'agent')}
                    style={{ flex: 1, background: '#060d17', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}
                  />
                  <button 
                    className="btn" 
                    disabled={arenaLoading || !overrideText.trim() || (arenaLogs.length > 0 && arenaLogs[arenaLogs.length - 1].sender === 'agent')}
                    onClick={() => advanceSimulationStep('customer', overrideText)}
                    style={{ fontSize: 12, padding: '0 16px', background: 'linear-gradient(135deg, #72f1b8, #4cb7ff)', color: '#05101a', fontWeight: 'bold' }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="card glass-card profile-list-card">
          <h3>Orders</h3>
          <div className="history-list">
            {(orders || []).length
              ? (orders || []).slice(0, 10).map((o, i) => <div key={i} className="history-row">{new Date(o.date).toLocaleDateString()} - ₹{o.amount} - {o.status} - {o.itemCount} items</div>)
              : <div className="history-row">No order history yet</div>}
          </div>
        </section>

        <section className="card glass-card profile-list-card">
          <h3>Cart Events</h3>
          <div className="history-list">
            {(carts || []).length
              ? (carts || []).slice(0, 10).map((o, i) => <div key={i} className="history-row">{new Date(o.date).toLocaleDateString()} - ₹{o.cartValue} - {o.itemCount} items - {o.timeInCart}</div>)
              : <div className="history-row">No cart activity yet</div>}
          </div>
        </section>

        <section className="profile-actions">
          <button className="btn" onClick={() => setCampaignOpen(true)}>Open Campaign Panel</button>
          <button className="btn" onClick={async () => {
            try {
              await sendCartEmail(data, { order_id: data._id, checkout_link: window.location.origin });
              toast.success(`Cart email sent to ${data.name}`);
            } catch {
              toast.error('Cart email failed');
            }
          }}>Send Cart Email</button>
          <button className="btn" onClick={async () => {
            try {
              await sendDiscountEmail(data, { discount_percent: '15', checkout_link: window.location.origin });
              toast.success(`Discount email sent to ${data.name}`);
            } catch {
              toast.error('Discount email failed');
            }
          }}>Send Discount Email</button>
          <button className="btn" onClick={async () => {
            try {
              await sendLoyaltyEmail(data, { reward_text: 'Special loyalty reward available', survey_link: window.location.origin });
              toast.success(`Loyalty email sent to ${data.name}`);
            } catch {
              toast.error('Loyalty email failed');
            }
          }}>Send Loyalty Email</button>
          <button className="btn" onClick={() => setOverrideOpen(true)}>Override Risk Tier</button>
        </section>
      </div>

      {campaignOpen && <CampaignPanel customer={data} onClose={() => setCampaignOpen(false)} />}
      {overrideOpen && <OverrideModal customer={data} onClose={() => setOverrideOpen(false)} onSaved={() => setOverrideOpen(false)} />}
    </div>
  );
}
