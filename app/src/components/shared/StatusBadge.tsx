'use client';

import type { TaskStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: TaskStatus;
}

const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  NOT_STARTED: { label: 'Not Started', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  IN_PROGRESS: { label: 'In Progress', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  PENDING_REVIEW: { label: 'Pending Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  COMPLETED: { label: 'Completed', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  DELAYED: { label: 'Delayed', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  BLOCKED: { label: 'Blocked', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const c = statusConfig[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: 9999,
        fontSize: 13,
        fontWeight: 500,
        color: c.color,
        background: c.bg,
        whiteSpace: 'nowrap',
      }}
    >
      {c.label}
    </span>
  );
}
