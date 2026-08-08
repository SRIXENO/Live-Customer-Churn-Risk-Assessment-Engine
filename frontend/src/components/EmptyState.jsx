import React from 'react';
export default function EmptyState({ title, message }) {
  return <div className="card" style={{ textAlign:'center', padding:40 }}><h3>{title}</h3><p style={{ color:'var(--muted)' }}>{message}</p></div>;
}
