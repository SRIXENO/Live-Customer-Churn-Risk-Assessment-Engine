import React from 'react';

export default function TableControls({ search, setSearch, tier, setTier, sort, setSort, scoreFilter, setScoreFilter }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 280 }}>
      <div className="card" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 0 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email" style={{ padding: 12, borderRadius: 12, border: '1px solid var(--line)', background: 'rgba(255,255,255,.04)', color: 'var(--text)' }} />
        <select value={tier} onChange={e => setTier(e.target.value)} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--line)', background: 'rgba(255,255,255,.04)', color: 'var(--text)' }}>
          <option value="all">All Risk</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--line)', background: 'rgba(255,255,255,.04)', color: 'var(--text)' }}>
          <option value="riskScore:desc">Score desc</option>
          <option value="riskScore:asc">Score asc</option>
          <option value="name:asc">Name asc</option>
          <option value="lastPurchaseDate:desc">Last purchase desc</option>
          <option value="lastPurchaseDate:asc">Last purchase asc</option>
        </select>
      </div>
      
      {scoreFilter !== undefined && scoreFilter !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.15)', padding: '6px 12px', borderRadius: 8, fontSize: 11, color: '#00f0ff', alignSelf: 'flex-start' }}>
          <span>Filtered by Risk Score: <strong>{scoreFilter}</strong></span>
          <button 
            type="button" 
            onClick={() => setScoreFilter(null)} 
            style={{ background: 'transparent', border: 0, color: '#ff6b6b', cursor: 'pointer', fontWeight: 'bold', fontSize: 12, padding: 0, marginLeft: 4 }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
