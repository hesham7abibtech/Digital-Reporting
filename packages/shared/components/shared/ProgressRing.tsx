'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface ProgressRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  className?: string;
  showLabel?: boolean;
}

export default function ProgressRing({
  score,
  size = 120,
  strokeWidth = 8,
  color,
  label,
  className = '',
  showLabel = true,
}: ProgressRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const animationFrameRef = useRef<number>(0);
  const hasCompleted = useRef(false);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const getColor = () => {
    if (color) return color;
    if (score >= 75) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const animate = useCallback(() => {
    if (hasCompleted.current) return;

    const startTime = performance.now();
    const duration = 1500;

    function step(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(score * eased);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        hasCompleted.current = true;
        setAnimatedScore(score); // Ensure exact final value
      }
    }

    animationFrameRef.current = requestAnimationFrame(step);
  }, [score]);

  useEffect(() => {
    const timer = setTimeout(() => {
      animate();
    }, 200);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationFrameRef.current);
      hasCompleted.current = false;
    };
  }, [animate]);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 0.3s ease-out',
            filter: `drop-shadow(0 0 6px ${getColor()}40)`,
          }}
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            transform: 'rotate(90deg)',
            transformOrigin: 'center',
            fontSize: size * 0.22,
            fontWeight: 700,
            fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
            fill: getColor(),
          }}
        >
          {Math.round(animatedScore)}%
        </text>
      </svg>
      {showLabel && label && (
        <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      )}
    </div>
  );
}
