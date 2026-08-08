import React from 'react';
export default function SkeletonLoader() {
  return <div className="grid">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="card" style={{ height:54, opacity:.6 }} />)}</div>;
}
