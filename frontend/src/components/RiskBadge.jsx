import React from 'react';
import clsx from 'clsx';
export default function RiskBadge({ tier = 'low', size = 'md' }) {
  return <span className={clsx('risk', tier, size)}>{tier === 'high' ? 'High Risk' : tier === 'medium' ? 'Medium Risk' : 'Low Risk'}</span>;
}
