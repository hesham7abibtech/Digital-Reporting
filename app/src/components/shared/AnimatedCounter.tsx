'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  startCounting?: boolean;
}

export default function AnimatedCounter({
  value,
  duration = 1800,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  startCounting = true,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const animationFrameRef = useRef<number>(0);
  const hasCompleted = useRef(false);
  const hasStarted = useRef(false);

  const animate = useCallback(() => {
    if (hasCompleted.current || hasStarted.current) return;
    hasStarted.current = true;

    const startTime = performance.now();

    function update(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = value * eased;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(update);
      } else {
        hasCompleted.current = true;
        setDisplayValue(value); // Ensure exact final value
      }
    }

    animationFrameRef.current = requestAnimationFrame(update);
  }, [value, duration]);

  useEffect(() => {
    // Only start when startCounting becomes true
    if (!startCounting) return;
    if (hasCompleted.current) return;

    // Brief delay to let the card entrance animation begin first
    const timer = setTimeout(() => {
      animate();
    }, 200);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [startCounting, animate]);

  // Reset if value changes significantly (e.g., new data loaded)
  useEffect(() => {
    if (hasCompleted.current && startCounting) {
      hasCompleted.current = false;
      hasStarted.current = false;
      animate();
    }
  }, [value]);

  return (
    <span className={`font-mono-data ${className}`} style={{ display: 'inline-flex', alignItems: 'baseline' }}>
      {prefix && <span style={{ marginRight: '0.1em' }}>{prefix}</span>}
      <span>{Math.round(displayValue).toFixed(decimals)}</span>
      {suffix && <span style={{ marginLeft: '0.05em' }}>{suffix}</span>}
    </span>
  );
}
