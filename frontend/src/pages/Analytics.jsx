import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import useTelemetryData from '../hooks/useTelemetryData';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Filler);

export default function Analytics() {
  const nav = useNavigate();
  const [days, setDays] = useState(30);
  const [clv, setClv] = useState(5000);
  const [recoveryRate, setRecoveryRate] = useState(25);
  const [couponValue, setCouponValue] = useState(15);
  const [simCustomers, setSimCustomers] = useState(120);

  const { data: summary } = useTelemetryData('/analytics/summary');
  const { data: dist } = useTelemetryData('/analytics/distribution');
  const { data: trend } = useTelemetryData(`/analytics/trend?days=${days}`, [days]);
  const { data: topRisk } = useTelemetryData('/analytics/top-risk');
  const { data: impact } = useTelemetryData('/analytics/campaign-impact');
  const { data: weekly } = useTelemetryData('/analytics/weekly');

  useEffect(() => {
    if (summary && dist) {
      const activeRisk = (summary.highRisk || 0) + (dist.medium || 0);
      if (activeRisk > 0) {
        setSimCustomers(activeRisk);
      }
    }
  }, [summary, dist]);

  const doughnut = useMemo(() => ({
    labels: ['High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [{
      data: [dist?.high || 0, dist?.medium || 0, dist?.low || 0],
      backgroundColor: ['#ff6b6b', '#ffb84d', '#72f1b8'],
      borderWidth: 0
    }]
  }), [dist]);

  const line = useMemo(() => ({
    labels: (trend || []).slice(0, 10).map(x => x.date).reverse(),
    datasets: [{
      label: 'Average Risk Score',
      data: (trend || []).slice(0, 10).map(x => x.avgScore).reverse(),
      borderColor: '#00f0ff',
      backgroundColor: 'rgba(0, 240, 255, 0.08)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#00f0ff',
      pointBorderColor: '#fff',
      pointHoverRadius: 6
    }]
  }), [trend]);

  const bar = useMemo(() => ({
    labels: (topRisk || []).slice(0, 8).map(x => x.name),
    datasets: [{
      label: 'Risk Score',
      data: (topRisk || []).slice(0, 8).map(x => x.riskScore),
      backgroundColor: 'rgba(255, 107, 107, 0.8)',
      hoverBackgroundColor: '#ff6b6b',
      borderRadius: 6,
      maxBarThickness: 48
    }]
  }), [topRisk]);

  const impactLine = useMemo(() => ({
    labels: (impact || []).map(x => x.date),
    datasets: [
      {
        label: 'Emails Sent',
        data: (impact || []).map(x => x.sent),
        borderColor: '#4cb7ff',
        backgroundColor: 'transparent',
        tension: 0.35,
        pointBackgroundColor: '#4cb7ff'
      },
      {
        label: 'Recoveries',
        data: (impact || []).map(x => x.recoveries),
        borderColor: '#72f1b8',
        backgroundColor: 'transparent',
        tension: 0.35,
        pointBackgroundColor: '#72f1b8'
      }
    ]
  }), [impact]);

  const stacked = useMemo(() => ({
    labels: (weekly || []).map(x => x.week),
    datasets: [
      {
        label: 'New Profiles',
        data: weekly?.map(x => x.newCustomers) || [],
        backgroundColor: 'rgba(0, 240, 255, 0.8)',
        borderRadius: 4,
        maxBarThickness: 32
      },
      {
        label: 'Elevated Risk',
        data: weekly?.map(x => x.churned) || [],
        backgroundColor: 'rgba(255, 107, 107, 0.8)',
        borderRadius: 4,
        maxBarThickness: 32
      }
    ]
  }), [weekly]);

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#8ea2c0',
          font: { family: 'Outfit, Inter, sans-serif', size: 11 }
        }
      },
      tooltip: {
        backgroundColor: '#0e1b2d',
        titleColor: '#00f0ff',
        bodyColor: '#ecf3ff',
        borderColor: 'rgba(0, 240, 255, 0.15)',
        borderWidth: 1,
        padding: 10
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#8ea2c0', font: { family: 'Outfit, Inter, sans-serif', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.02)' },
        ticks: { color: '#8ea2c0', font: { family: 'Outfit, Inter, sans-serif', size: 10 } }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#8ea2c0',
          font: { family: 'Outfit, Inter, sans-serif', size: 11 }
        }
      }
    },
    cutout: '72%'
  };

  const hasAnyData = (dist?.high || 0) + (dist?.medium || 0) + (dist?.low || 0) > 0;

  return (
    <div className="page">
      <div className="page-hero">
        <div>
          <div className="hero-chip">Performance Overview</div>
          <h1>Analytics Cockpit</h1>
          <p>Real-time risk segment distribution, engagement telemetry patterns, and recovery outcomes.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
            {[7, 30, 90].map(d => (
              <button 
                key={d} 
                className="btn" 
                onClick={() => setDays(d)}
                style={{ 
                  padding: '6px 12px', 
                  fontSize: 12, 
                  background: days === d ? 'linear-gradient(135deg, #72f1b8, #4cb7ff)' : 'transparent',
                  color: days === d ? '#05101a' : 'var(--muted)',
                  borderRadius: 6,
                  boxShadow: 'none',
                  transform: 'none',
                  minWidth: 'auto'
                }}
              >
                {d}D
              </button>
            ))}
          </div>
          <button className="btn ghost-btn" onClick={() => nav('/dashboard')}>Tracker</button>
          <button className="btn ghost-btn">Export PNG</button>
        </div>
      </div>

      <div className="grid stats-grid is-visible" style={{ marginBottom: 24 }}>
        <div className="card glass-card mini-kpi">
          <span>Active Accounts</span>
          <strong>{summary?.totalCustomers ?? 0}</strong>
        </div>
        <div className="card glass-card mini-kpi" style={{ borderLeftColor: '#ff6b6b' }}>
          <span>High Risk Segments</span>
          <strong style={{ color: '#ff6b6b' }}>{summary?.highRisk ?? 0}</strong>
        </div>
        <div className="card glass-card mini-kpi" style={{ borderLeftColor: '#00f0ff' }}>
          <span>Campaigns Logged</span>
          <strong style={{ color: '#00f0ff' }}>{summary?.campaignsSent ?? 0}</strong>
        </div>
        <div className="card glass-card mini-kpi" style={{ borderLeftColor: '#72f1b8' }}>
          <span>Weekly Recoveries</span>
          <strong style={{ color: '#72f1b8' }}>{summary?.recoveredThisWeek ?? 0}</strong>
        </div>
      </div>

      <div className="grid analytics-grid" style={{ gap: 20 }}>
        <div className="card glass-card chart-card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '.06em' }}>Segment Metrics</span>
            <h3 style={{ margin: '2px 0 0', fontSize: 16 }}>Risk Distribution</h3>
          </div>
          <div style={{ height: 180, position: 'relative' }}>
            {dist === null ? (
              <div className="empty-visual">Loading distribution...</div>
            ) : hasAnyData ? (
              <Doughnut data={doughnut} options={doughnutOptions} />
            ) : (
              <div className="empty-visual">No customer records in database</div>
            )}
          </div>
        </div>

        <div className="card glass-card chart-card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '.06em' }}>Score History</span>
            <h3 style={{ margin: '2px 0 0', fontSize: 16 }}>Average Risk Trend</h3>
          </div>
          <div style={{ height: 180, position: 'relative' }}>
            {trend === null ? (
              <div className="empty-visual">Loading trend...</div>
            ) : trend.length ? (
              <Line data={line} options={commonOptions} />
            ) : (
              <div className="empty-visual">No telemetry logs recorded</div>
            )}
          </div>
        </div>

        <div className="card glass-card chart-card chart-wide" style={{ padding: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '.06em' }}>Extreme Scores</span>
            <h3 style={{ margin: '2px 0 0', fontSize: 16 }}>Highest Risk Customer Profiles</h3>
          </div>
          <div style={{ height: 220, position: 'relative', maxWidth: (topRisk && topRisk.length) ? `min(100%, ${Math.max(400, topRisk.length * 120)}px)` : '100%', margin: '0 auto' }}>
            {topRisk === null ? (
              <div className="empty-visual">Loading risks...</div>
            ) : topRisk.length ? (
              <Bar data={bar} options={commonOptions} />
            ) : (
              <div className="empty-visual">No customer records in database</div>
            )}
          </div>
        </div>

        <div className="card glass-card chart-card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '.06em' }}>Marketing ROI</span>
            <h3 style={{ margin: '2px 0 0', fontSize: 16 }}>Campaign Recovery Impact</h3>
          </div>
          <div style={{ height: 180, position: 'relative' }}>
            {impact === null ? (
              <div className="empty-visual">Loading impact...</div>
            ) : impact.length ? (
              <Line data={impactLine} options={commonOptions} />
            ) : (
              <div className="empty-visual">No active campaign dispatches</div>
            )}
          </div>
        </div>

        <div className="card glass-card chart-card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '.06em' }}>Registry Growth</span>
            <h3 style={{ margin: '2px 0 0', fontSize: 16 }}>Weekly Profile Velocity</h3>
          </div>
          <div style={{ height: 180, position: 'relative', maxWidth: (weekly && weekly.length) ? `min(100%, ${Math.max(300, weekly.length * 100)}px)` : '100%', margin: '0 auto' }}>
            {weekly === null ? (
              <div className="empty-visual">Loading growth...</div>
            ) : weekly.length ? (
              <Bar data={stacked} options={commonOptions} />
            ) : (
              <div className="empty-visual">No growth metrics logged</div>
            )}
          </div>
        </div>

        {/* Retention ROI Simulator Card */}
        <div className="card glass-card chart-card chart-wide" style={{ padding: 20, minHeight: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12, marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#00f0ff', letterSpacing: '.06em' }}>Strategic ROI Calculator</span>
              <h3 style={{ margin: '2px 0 0', fontSize: 16 }}>Retention Value & Cost Projections</h3>
            </div>
            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', alignSelf: 'center', fontWeight: 'bold' }}>
              PROJECTIONS ENGINE
            </span>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'center' }}>
            {/* Simulation controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: 'var(--muted)' }}>
                  <span>Simulated At-Risk Customer Volume:</span>
                  <strong style={{ color: '#00f0ff' }}>{simCustomers} accounts</strong>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="1000" 
                  step="10"
                  value={simCustomers} 
                  onChange={e => setSimCustomers(Number(e.target.value))} 
                  className="custom-slider" 
                />
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: 'var(--muted)' }}>
                  <span>Avg Customer Lifetime Value (CLV):</span>
                  <strong style={{ color: '#fff' }}>₹{clv.toLocaleString()}</strong>
                </label>
                <input 
                  type="range" 
                  min="1000" 
                  max="50000" 
                  step="500"
                  value={clv} 
                  onChange={e => setClv(Number(e.target.value))} 
                  className="custom-slider" 
                />
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: 'var(--muted)' }}>
                  <span>Expected Winback / Recovery Rate:</span>
                  <strong style={{ color: '#72f1b8' }}>{recoveryRate}%</strong>
                </label>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  step="5"
                  value={recoveryRate} 
                  onChange={e => setRecoveryRate(Number(e.target.value))} 
                  className="custom-slider warn" 
                />
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: 'var(--muted)' }}>
                  <span>Average Coupon Discount Offer:</span>
                  <strong style={{ color: '#ff6b6b' }}>{couponValue}%</strong>
                </label>
                <input 
                  type="range" 
                  min="5" 
                  max="50" 
                  step="5"
                  value={couponValue} 
                  onChange={e => setCouponValue(Number(e.target.value))} 
                  className="custom-slider danger" 
                />
              </div>
            </div>

            {/* Calculated outcomes */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12, background: 'rgba(255,255,255,0.02)', padding: 18, borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>Customers Under Risk:</span>
                <strong style={{ color: '#fff' }}>{simCustomers} accounts</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>Gross Revenue At Risk:</span>
                <strong style={{ color: '#ff6b6b' }}>₹{(simCustomers * clv).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px dashed rgba(255,255,255,0.08)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--muted)' }}>Projected Winbacks:</span>
                <strong style={{ color: '#72f1b8' }}>{Math.round(simCustomers * (recoveryRate / 100))} accounts</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>Total Saved Value:</span>
                <strong style={{ color: '#72f1b8' }}>₹{(Math.round(simCustomers * (recoveryRate / 100)) * clv).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>Winback Cost (Discounts):</span>
                <strong style={{ color: '#ffb84d' }}>₹{(Math.round(simCustomers * (recoveryRate / 100)) * clv * (couponValue / 100)).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10, marginTop: 4 }}>
                <span style={{ color: '#00f0ff' }}>Net Recovery ROI:</span>
                <span style={{ color: '#00f0ff', textShadow: '0 0 10px rgba(0, 240, 255, 0.4)' }}>
                  ₹{(Math.round(simCustomers * (recoveryRate / 100)) * clv - (Math.round(simCustomers * (recoveryRate / 100)) * clv * (couponValue / 100))).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Churn Drivers Card */}
        <div className="card glass-card chart-card" style={{ padding: 20, minHeight: 'auto' }}>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '.06em' }}>Diagnostics</span>
            <h3 style={{ margin: '2px 0 0', fontSize: 16 }}>Primary Churn Risk Drivers</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: '#fff' }}>Inactivity & Login Decay</span>
                <strong style={{ color: 'var(--danger)' }}>40% Weight Impact</strong>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }}>
                <div style={{ width: '40%', height: '100%', borderRadius: 99, background: 'var(--danger)' }} />
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--muted)' }}>Users crossing 60 days inactivity have an elevated rate of exit conversion.</p>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: '#fff' }}>Checkout Cart Abandonment</span>
                <strong style={{ color: 'var(--warn)' }}>30% Weight Impact</strong>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }}>
                <div style={{ width: '30%', height: '100%', borderRadius: 99, background: 'var(--warn)' }} />
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--muted)' }}>High shipping charges and payment checkout drop-offs affect conversion.</p>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: '#fff' }}>Order Purchase Frequency Decay</span>
                <strong style={{ color: 'var(--accent)' }}>30% Weight Impact</strong>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 99 }}>
                <div style={{ width: '30%', height: '100%', borderRadius: 99, background: 'var(--accent)' }} />
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--muted)' }}>Decrease in historical purchase patterns indicates a drop in interest.</p>
            </div>
          </div>
        </div>

        {/* Top Churn Risk Accounts Table */}
        <div className="card glass-card table-card chart-wide" style={{ padding: 20, marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--danger)', letterSpacing: '.06em' }}>Target Segments</span>
              <h3 style={{ margin: '2px 0 0', fontSize: 16 }}>High-Risk Account Registry</h3>
            </div>
            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'rgba(255, 107, 107, 0.1)', color: 'var(--danger)', fontWeight: 'bold' }}>
              RECOVERY QUEUE
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Customer</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Risk Score</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Inactivity</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Cart Abandon Rate</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(topRisk || []).slice(0, 5).map(c => (
                  <tr key={c._id} className="table-row">
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 'bold' }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{c.email}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <strong style={{ color: c.riskScore >= 70 ? 'var(--danger)' : c.riskScore >= 40 ? 'var(--warn)' : 'var(--accent)' }}>
                        {c.riskScore}/100
                      </strong>
                    </td>
                    <td style={{ padding: '14px 16px' }}>{c.daysInactive} days</td>
                    <td style={{ padding: '14px 16px' }}>{c.cartAbandonRate}%</td>
                    <td style={{ padding: '14px 16px' }}>
                      <button 
                        className="btn" 
                        onClick={() => nav(`/customers/${c._id}`)}
                        style={{ padding: '6px 12px', fontSize: 11, background: 'rgba(0, 240, 255, 0.12)', border: '1px solid rgba(0, 240, 255, 0.2)', color: '#00f0ff' }}
                      >
                        Negotiate Win-Back
                      </button>
                    </td>
                  </tr>
                ))}
                {(!topRisk || topRisk.length === 0) && (
                  <tr>
                    <td colSpan="5" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
                      No accounts requiring active win-back campaigns.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
