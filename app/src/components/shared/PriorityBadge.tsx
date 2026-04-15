'use client';

import type { Priority } from '@/lib/types';

interface PriorityBadgeProps {
  priority: Priority;
}

const config: Record<Priority, { label: string; color: string; dot: string }> = {
  LOW: { label: 'Low', color: 'rgba(249, 248, 242, 0.5)', dot: 'rgba(249, 248, 242, 0.3)' },
  MEDIUM: { label: 'Medium', color: 'var(--aqua)', dot: 'var(--aqua)' },
  HIGH: { label: 'High', color: '#FF7908', dot: '#FF7908' },
  CRITICAL: { label: 'Critical', color: '#FF4C4F', dot: '#FF4C4F' },
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
