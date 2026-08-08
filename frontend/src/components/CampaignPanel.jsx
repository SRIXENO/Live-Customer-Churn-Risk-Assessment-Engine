import React, { useState } from 'react';
import RiskBadge from './RiskBadge';
import { sendCartEmail, sendDiscountEmail, sendLoyaltyEmail } from '../services/emailService';
import toast from 'react-hot-toast';

export default function CampaignPanel({ customer, onClose }) {
  const [templateType, setTemplateType] = useState('cart');
  const [sending, setSending] = useState(false);

  if (!customer) return null;

  const send = async () => {
    setSending(true);
    try {
      if (templateType === 'loyalty') {
        await sendLoyaltyEmail(customer, { reward_text: 'Loyalty reward available', survey_link: window.location.origin });
      } else if (templateType === 'discount') {
        await sendDiscountEmail(customer, { discount_percent: '20', checkout_link: window.location.origin });
      } else {
        await sendCartEmail(customer, { order_id: customer._id, checkout_link: window.location.origin });
      }
      toast.success(`Email sent to ${customer.name}`);
      onClose?.();
    } catch (error) {
      toast.error(error?.text || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:900, display:'grid', placeItems:'end' }}>
      <div onClick={e => e.stopPropagation()} className="panel" style={{ width:'min(420px,100%)', height:'100%', padding:24, borderRadius:'24px 0 0 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h2 style={{ margin:'0 0 4px' }}>{customer.name}</h2>
            <div style={{ color:'var(--muted)' }}>{customer.email}</div>
          </div>
          <button className="btn" onClick={onClose} style={{ background:'rgba(255,255,255,.12)', color:'var(--text)' }}>X</button>
        </div>
        <div style={{ marginTop:16 }}><RiskBadge tier={customer.tier} /></div>
        <div style={{ marginTop:20 }}>
          <div style={{ marginBottom:8, color:'var(--muted)' }}>Template</div>
          {['discount', 'cart', 'loyalty'].map(t => (
            <button key={t} className="btn" onClick={() => setTemplateType(t)} style={{ display:'block', width:'100%', marginBottom:10, background:templateType === t ? 'linear-gradient(135deg,#72f1b8,#4cb7ff)' : 'rgba(255,255,255,.08)', color:templateType === t ? '#04111b' : 'var(--text)' }}>
              {t}
            </button>
          ))}
        </div>
        <button className="btn" onClick={send} disabled={sending} style={{ width:'100%', marginTop:8 }}>{sending ? 'Sending...' : 'Send Email'}</button>
      </div>
    </div>
  );
}
