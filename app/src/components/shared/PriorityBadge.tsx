'use client';

import type { Priority } from '@/lib/types';

interface PriorityBadgeProps {
  priority: Priority;
}

const config: Record<Priority, { label: string; color: string; dot: string }> = {
  LOW: { label: 'Low', color: '#94a3b8', dot: '#94a3b8' },
  MEDIUM: { label: 'Medium', color: '#60a5fa', dot: '#60a5fa' },
  HIGH: { label: 'High', color: '#fbbf24', dot: '#fbbf24' },
  CRITICAL: { label: 'Critical', color: '#fca5a5', dot: '#fca5a5' },
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const c = config[priority];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        borderRadius: 9999,
        fontSize: 13,
        fontWeight: 500,
        color: c.color,
        background: `${c.color}15`,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}
