export const money = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
export const pct = n => `${Math.round(n || 0)}%`;
