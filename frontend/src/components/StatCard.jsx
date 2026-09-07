import React, { useState, useMemo } from 'react';
import { ArrowUpRight, Users, ShieldAlert, Send, Activity, Sparkles } from 'lucide-react';
import TiltCard from './TiltCard';
import AnimatedCounter from './AnimatedCounter';

const iconForTitle = (title, color) => {
  const size = 18;
  const style = { color: color, filter: `drop-shadow(0 0 6px ${color})` };
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
      return <Sparkles size={size} style={style} />;
  }
};

export default function StatCard({ title, value, color = '#00f0ff', trend = 'up', trendValue = '12%' }) {
  const [hovered, setHovered] = useState(false);

  const rgb = useMemo(() => {
    if (color === '#72f1b8') return '114, 241, 184';
    if (color === '#ff6b6b') return '255, 107, 107';
    if (color === '#4cb7ff') return '76, 183, 255';
    if (color === '#ffb84d') return '255, 184, 77';
    if (color === '#00f0ff') return '0, 240, 255';
    return '255, 255, 255';
  }, [color]);

  return (
    <TiltCard
      maxTilt={10}
      className="stat-card-tilt"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div 
        className="card glass-card stat-card" 
        style={{ 
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderTop: `3px solid ${color}`,
          boxShadow: hovered 
            ? `0 20px 45px rgba(0, 0, 0, 0.45), 0 0 20px rgba(${rgb}, 0.2)` 
            : 'var(--shadow)',
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
          cursor: 'pointer',
          height: '100%'
        }}
      >
        {/* Dynamic Glowing Backdrop Halo */}
        <div 
          style={{
            position: 'absolute',
            top: -40,
            left: -40,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${rgb}, 0.25) 0%, transparent 70%)`,
            filter: 'blur(20px)',
            opacity: hovered ? 1 : 0.5,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
            zIndex: 0
          }} 
        />

        {/* Pulsing neon top strip */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '3px',
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.25s ease',
            zIndex: 2
          }}
        />

        <div className="stat-card-top" style={{ position: 'relative', zIndex: 1 }}>
          <div 
            className="stat-icon" 
            style={{ 
              background: `rgba(${rgb}, 0.08)`, 
              border: `1px solid rgba(${rgb}, 0.3)`,
              boxShadow: `0 0 10px rgba(${rgb}, 0.2)`,
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
              background: trend === 'up' ? 'rgba(114, 241, 184, 0.1)' : 'rgba(255, 107, 107, 0.1)',
              border: trend === 'up' ? '1px solid rgba(114, 241, 184, 0.25)' : '1px solid rgba(255, 107, 107, 0.25)',
              boxShadow: hovered ? `0 0 8px rgba(${trend === 'up' ? '114, 241, 184' : '255, 107, 107'}, 0.3)` : 'none',
              padding: '4px 10px',
              borderRadius: '99px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
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
            textShadow: hovered ? `0 0 12px rgba(${rgb}, 0.35)` : 'none',
            transition: 'text-shadow 0.3s ease'
          }}
        >
          <AnimatedCounter value={value} />
        </div>
      </div>
    </TiltCard>
  );
}
