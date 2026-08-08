import React, { useEffect, useState, useMemo } from 'react';
import { ArrowUpRight, Users, ShieldAlert, Send, Activity } from 'lucide-react';

const iconForTitle = (title, color) => {
  const size = 18;
  const style = { color: color, filter: `drop-shadow(0 0 4px ${color})` };
  switch (title) {
    case 'Total Customers':
      return <Users size={size} style={style} className="icon-users" />;
    case 'High Risk Today':
      return <ShieldAlert size={size} style={style} className="icon-shield" />;
    case 'Campaigns Sent Today':
      return <Send size={size} style={style} className="icon-send" />;
    case 'Recovered This Week':
      return <Activity size={size} style={style} className="icon-activity" />;
    default:
      return <Users size={size} style={style} />;
  }
};

export default function StatCard({ title, value, color, trend = 'up', trendValue = '12%' }) {
  const [n, setN] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const s = performance.now();
    const tick = t => { 
      const p = Math.min((t - s) / 800, 1); 
      setN(Math.round(value * p)); 
      if (p < 1) requestAnimationFrame(tick); 
    };
    requestAnimationFrame(tick);
  }, [value]);

  const rgb = useMemo(() => {
    if (color === '#72f1b8') return '114, 241, 184';
    if (color === '#ff6b6b') return '255, 107, 107';
    if (color === '#4cb7ff') return '76, 183, 255';
    if (color === '#ffb84d') return '255, 184, 77';
    return '255, 255, 255';
  }, [color]);

  return (
    <div 
      className="card glass-card stat-card" 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ 
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
        borderTop: `3px solid ${color}`,
        boxShadow: hovered 
          ? `0 20px 40px rgba(0,0,0,0.4), 0 0 15px rgba(${rgb}, 0.15)` 
          : 'var(--shadow)',
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        cursor: 'pointer'
      }}
    >
      {/* Dynamic Glowing Backdrop Orb */}
      <div 
        style={{
          position: 'absolute',
          top: -40,
          left: -40,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${rgb}, 0.25) 0%, rgba(${rgb}, 0) 70%)`,
          filter: 'blur(20px)',
          opacity: hovered ? 1 : 0.6,
          transition: 'all 0.3s ease',
          pointerEvents: 'none',
          zIndex: 0
        }} 
      />

      {/* Pulsing neon strip on hover */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '3px',
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: hovered ? 1 : 0,
          animation: hovered ? 'pulse 1.5s infinite' : 'none',
          transition: 'opacity 0.2s ease',
          zIndex: 2
        }}
      />

      <div className="stat-card-top" style={{ position: 'relative', zIndex: 1 }}>
        {/* Glow capsule for icon wrapper */}
        <div 
          className="stat-icon" 
          style={{ 
            background: `rgba(${rgb}, 0.08)`, 
            border: `1px solid rgba(${rgb}, 0.25)`,
            boxShadow: `0 0 8px rgba(${rgb}, 0.15)`,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center'
          }}
        >
          {iconForTitle(title, color)}
        </div>

        <div 
          className={`stat-trend ${trend}`}
          style={{
            background: trend === 'up' ? 'rgba(114, 241, 184, 0.08)' : 'rgba(255, 107, 107, 0.08)',
            border: trend === 'up' ? '1px solid rgba(114, 241, 184, 0.15)' : '1px solid rgba(255, 107, 107, 0.15)',
            boxShadow: hovered ? `0 0 6px rgba(${trend === 'up' ? '114,241,184' : '255,107,107'}, 0.2)` : 'none',
            padding: '3px 8px',
            borderRadius: '99px',
            fontSize: '11px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            transition: 'all 0.3s ease'
          }}
        >
          <ArrowUpRight size={13} style={{ transform: trend === 'down' ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s ease' }} />
          <span>{trendValue}</span>
        </div>
      </div>

      <div style={{ color: 'var(--muted)', marginTop: 16, fontSize: '13px', position: 'relative', zIndex: 1, fontWeight: 500 }}>
        {title}
      </div>
      
      <div 
        className="stat-value"
        style={{ 
          fontSize: '32px', 
          fontWeight: 800, 
          fontFamily: "'JetBrains Mono', monospace",
          color: '#fff',
          marginTop: 6,
          position: 'relative',
          zIndex: 1,
          letterSpacing: '-0.02em',
          textShadow: hovered ? `0 0 10px rgba(${rgb}, 0.2)` : 'none',
          transition: 'all 0.3s ease'
        }}
      >
        {n}
      </div>
    </div>
  );
}
