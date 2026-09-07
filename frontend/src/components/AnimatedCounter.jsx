import React, { useEffect, useState } from 'react';

/**
 * High-performance animated number ticker with smooth cubic easing
 */
export default function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1200, decimals = 0 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const numericTarget = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 0;
    const initialVal = 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Cubic ease out
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = initialVal + (numericTarget - initialVal) * easeOut;
      
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(numericTarget);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value, duration]);

  const formatted = decimals > 0 
    ? displayValue.toFixed(decimals) 
    : Math.round(displayValue).toLocaleString();

  return (
    <span className="animated-counter">
      {prefix}{formatted}{suffix}
    </span>
  );
}
