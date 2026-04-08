'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
  glow?: 'blue' | 'cyan' | 'emerald' | 'amber' | 'red' | 'none';
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export default function GlassCard({
  children,
  className,
  style,
  hover = true,
  glow = 'none',
  padding = 'md',
}: GlassCardProps) {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const glowClasses = {
    none: '',
    blue: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
    cyan: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]',
    emerald: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    amber: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    red: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]',
  };

  return (
    <div
      style={style}
      className={cn(
        'glass-card',
        paddings[padding],
        hover && 'hover-lift',
        glowClasses[glow],
        className
      )}
    >
      {children}
    </div>
  );
}
