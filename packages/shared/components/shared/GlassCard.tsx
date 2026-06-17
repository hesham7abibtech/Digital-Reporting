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
    blue: 'hover:shadow-[0_0_20px_rgba(0,63,73,0.08)]',
    cyan: 'hover:shadow-[0_0_20px_rgba(198,224,224,0.2)]',
    emerald: 'hover:shadow-[0_0_20px_rgba(82,97,54,0.1)]',
    amber: 'hover:shadow-[0_0_20px_rgba(255,121,8,0.1)]',
    red: 'hover:shadow-[0_0_20px_rgba(255,76,79,0.1)]',
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
