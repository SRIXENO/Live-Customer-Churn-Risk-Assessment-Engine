import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RiskBadge from './RiskBadge';
import { money, pct } from '../utils/formatters';
import TableControls from './TableControls';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CustomerTable({ 
  customers = [], 
  onDelete,
  search: externalSearch,
  setSearch: externalSetSearch,
  tier: externalTier,
  setTier: externalSetTier,
  scoreFilter,
  setScoreFilter
}) {
  const nav = useNavigate();
  const [localSearch, localSetSearch] = useState('');
  const [localTier, localSetTier] = useState('all');

  const search = externalSearch !== undefined ? externalSearch : localSearch;
  const setSearch = externalSetSearch !== undefined ? externalSetSearch : localSetSearch;
  const tier = externalTier !== undefined ? externalTier : localTier;
  const setTier = externalSetTier !== undefined ? externalSetTier : localSetTier;

  const [sort, setSort] = useState('riskScore:desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const limit = 20;

  const filtered = useMemo(() => {
    let rows = customers.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));
    if (tier !== 'all') rows = rows.filter(c => c.tier === tier);
    if (scoreFilter !== undefined && scoreFilter !== null) {
      rows = rows.filter(c => c.riskScore === scoreFilter);
    }
    const [field, dir] = sort.split(':');
    rows = [...rows].sort((a, b) => {
      const av = field === 'lastPurchaseDate' ? new Date(a.lastPurchaseDate).getTime() : a[field];
      const bv = field === 'lastPurchaseDate' ? new Date(b.lastPurchaseDate).getTime() : b[field];
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [customers, search, tier, sort, scoreFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const pageRows = filtered.slice((page - 1) * limit, page * limit);
  const allSelected = pageRows.length > 0 && pageRows.every(r => selected.includes(r._id));

  const toggle = id => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const deleteCustomer = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/customers/${deleteTarget._id}`);
      toast.success('Customer deleted');
      onDelete?.(deleteTarget._id);
      setSelected(prev => prev.filter(id => id !== deleteTarget._id));
      setPage(1);
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };
  const executeDeleteBulk = async () => {
    setDeletingAll(true);
    const isBulk = selected.length > 0;
    try {
      if (isBulk) {
        await api.delete('/customers', { data: { ids: selected } });
        toast.success(`${selected.length} customer(s) deleted`);
        selected.forEach(id => onDelete?.(id));
      } else {
        await api.delete('/customers');
        toast.success('All customers deleted');
        onDelete?.('__ALL__');
      }
      setSelected([]);
      setPage(1);
    } catch (err) {
      console.error('Delete bulk failed:', err);
      toast.error(isBulk ? 'Delete selected failed' : 'Delete all failed');
    } finally {
      setDeletingAll(false);
      setDeleteAllOpen(false);
    }
  };

  return <div className="table-shell">
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
      <TableControls 
        search={search} 
        setSearch={setSearch} 
        tier={tier} 
        setTier={setTier} 
        sort={sort} 
        setSort={setSort} 
        scoreFilter={scoreFilter}
        setScoreFilter={setScoreFilter}
      />
      {selected.length > 0 && (
        <button className="btn danger-btn" onClick={() => setDeleteAllOpen(true)}>
          Delete Selected ({selected.length})
        </button>
      )}
    </div>
    <div className="card glass-card table-card">
      <table className="premium-table">
        <thead>
          <tr style={{ textAlign:'left', color:'var(--muted)' }}>
            <th><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? selected.filter(id => !pageRows.some(r => r._id === id)) : [...new Set([...selected, ...pageRows.map(r => r._id)])])} /></th>
            <th>#</th><th>Name</th><th>Email</th><th>Score</th><th>Risk</th><th>Last Purchase</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((c, i) => <tr key={c._id} onClick={() => nav(`/customers/${c._id}`)} className={`table-row ${c.tier}`} style={{ cursor:'pointer' }}>
            <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.includes(c._id)} onChange={() => toggle(c._id)} /></td>
            <td>{(page - 1) * limit + i + 1}</td>
            <td>{c.name}</td>
            <td>{c.email}</td>
            <td>
              <div className="score-track">
                <div className="score-fill" style={{ width: `${c.riskScore}%`, background: c.tier === 'high' ? 'var(--danger)' : c.tier === 'medium' ? 'var(--warn)' : 'var(--accent)' }} />
              </div>
            </td>
            <td><RiskBadge tier={c.tier} /></td>
            <td>{new Date(c.lastPurchaseDate).toLocaleDateString()}</td>
            <td onClick={e => e.stopPropagation()} style={{ display:'flex', gap:8 }}>
              <button className="btn" onClick={() => nav(`/customers/${c._id}`)} style={{ padding:'8px 10px' }}>Analyze</button>
              <button className="btn" onClick={() => setDeleteTarget(c)} style={{ padding:'8px 10px', background:'rgba(255,107,107,.18)', color:'var(--text)' }}>Delete</button>
              <span style={{ display:'none' }}>{money(0)} {pct(0)}</span>
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 12 }}>
      <div style={{ color:'var(--muted)' }}>Selected: {selected.length}</div>
      <div style={{ display:'flex', gap:8 }}>
        <button className="btn" onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
        <button className="btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
      </div>
    </div>

    {deleteTarget && (
      <div className="modal-backdrop" onClick={() => !deleting && setDeleteTarget(null)}>
        <div className="modal-card delete-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-orb modal-orb-a" />
          <div className="modal-orb modal-orb-b" />
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)', display: 'grid', placeItems: 'center', color: '#ff6b6b' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <div className="modal-kicker">Confirm Delete</div>
                <h2 style={{ margin:'4px 0 0', fontSize: 22 }}>{deleteTarget.name}</h2>
              </div>
            </div>
            <button type="button" className="icon-btn" onClick={() => !deleting && setDeleteTarget(null)}>×</button>
          </div>
          <p style={{ color:'var(--muted)', lineHeight:1.6, fontSize: 13, marginTop: 12 }}>
            Warning: This action is permanent. This customer, their profile details, and all cascading historical dispatches will be completely deleted from the MongoDB database.
          </p>
          <div className="delete-preview" style={{ marginTop: 16 }}>
            <div>
              <div style={{ color:'var(--muted)', fontSize:11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Customer Email</div>
              <div style={{ fontSize: 13, marginTop: 4, fontWeight: 'bold' }}>{deleteTarget.email}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color:'var(--muted)', fontSize:11, textTransform: 'uppercase', letterSpacing: '.04em' }}>Risk Rating</div>
              <div style={{ marginTop: 4 }}><RiskBadge tier={deleteTarget.tier} /></div>
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: 24 }}>
            <button className="btn ghost-btn" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
            <button className="btn danger-btn" onClick={deleteCustomer} disabled={deleting}>{deleting ? 'Purging...' : 'Confirm Purge'}</button>
          </div>
        </div>
      </div>
    )}
    {deleteAllOpen && (
      <div className="modal-backdrop" onClick={() => !deletingAll && setDeleteAllOpen(false)}>
        <div className="modal-card delete-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-orb modal-orb-a" style={{ background: '#ff3b30' }} />
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)', display: 'grid', placeItems: 'center', color: '#ff6b6b' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <div>
                <div className="modal-kicker">{selected.length > 0 ? 'Purge Selected?' : 'Destructive Action'}</div>
                <h2 style={{ margin:'4px 0 0', fontSize: 22 }}>
                  {selected.length > 0 ? `Wipe ${selected.length} Profile(s)?` : 'Wipe All Records?'}
                </h2>
              </div>
            </div>
            <button type="button" className="icon-btn" onClick={() => !deletingAll && setDeleteAllOpen(false)}>×</button>
          </div>
          <p style={{ color:'var(--muted)', lineHeight:1.6, fontSize: 13, marginTop: 12 }}>
            {selected.length > 0
              ? `This will permanently remove the ${selected.length} selected customer profile(s) and all their associated campaigns/overrides from the database. There is no undo.`
              : 'This will permanently remove every customer profile and all telemetry records from the MongoDB backend. There is no undo.'}
          </p>
          <div className="modal-actions" style={{ marginTop: 28 }}>
            <button className="btn ghost-btn" onClick={() => setDeleteAllOpen(false)} disabled={deletingAll}>Cancel</button>
            <button className="btn danger-btn" onClick={executeDeleteBulk} disabled={deletingAll}>
              {deletingAll
                ? (selected.length > 0 ? 'Purging...' : 'Wiping DB...')
                : (selected.length > 0 ? 'Confirm Purge' : 'Wipe Database')}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>;
}
