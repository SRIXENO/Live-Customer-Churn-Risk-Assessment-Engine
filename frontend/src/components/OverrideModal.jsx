import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import RiskBadge from './RiskBadge';

export default function OverrideModal({ customer, onClose, onSaved }) {
  const [newTier, setNewTier] = useState(customer?.tier || 'medium');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  if (!customer) return null;

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/overrides', {
        customerId: customer._id,
        newTier,
        reason: reason || 'Manual override'
      });
      toast.success('Risk tier updated');
      onSaved?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Override failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 560, width: 'calc(100% - 24px)' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-kicker">Override risk tier</div>
            <h2 style={{ margin: '8px 0 0' }}>{customer.name}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>×</button>
        </div>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <RiskBadge tier={customer.tier} size="lg" />
          <div style={{ color: 'var(--muted)' }}>Current tier</div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ marginBottom: 8, color: 'var(--muted)' }}>New tier</div>
          <select className="field" value={newTier} onChange={e => setNewTier(e.target.value)}>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ marginBottom: 8, color: 'var(--muted)' }}>Reason</div>
          <textarea
            className="field"
            rows="4"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Why are you overriding the risk tier?"
          />
        </div>

        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button type="button" className="btn ghost-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="btn danger-btn" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Override'}
          </button>
        </div>
      </div>
    </div>
  );
}
