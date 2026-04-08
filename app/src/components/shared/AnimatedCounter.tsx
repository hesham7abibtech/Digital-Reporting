'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export default function AnimatedCounter({
  value,
  duration = 1800,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const animationFrameRef = useRef<number>(0);
  const hasCompleted = useRef(false);

  const animate = useCallback(() => {
    if (hasCompleted.current) return;

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
    // Start animation after a brief delay to ensure DOM is ready
    const timer = setTimeout(() => {
      animate();
    }, 100);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationFrameRef.current);
      // Reset for strict mode re-mount
      hasCompleted.current = false;
    };
  }, [animate]);

  return (
    <span className={`font-mono-data ${className}`}>
      {prefix}
      {Math.round(displayValue).toFixed(decimals)}
      {suffix}
    </span>
  );
}
