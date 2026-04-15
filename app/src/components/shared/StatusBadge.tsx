'use client';

import type { TaskStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: TaskStatus;
}

const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  NOT_STARTED: { label: 'Not Started', color: 'rgba(255, 255, 255, 0.4)', bg: 'rgba(255, 255, 255, 0.05)' },
  IN_PROGRESS: { label: 'In Progress', color: 'rgb(198, 224, 224)', bg: 'rgba(198, 224, 224, 0.15)' },
  PENDING_REVIEW: { label: 'Pending Review', color: '#FF7908', bg: 'rgba(255, 121, 8, 0.1)' },
  COMPLETED: { label: 'Completed', color: '#B0B540', bg: 'rgba(176, 181, 64, 0.1)' },
  DELAYED: { label: 'Delayed', color: '#FF4C4F', bg: 'rgba(255, 76, 79, 0.1)' },
  BLOCKED: { label: 'Blocked', color: '#FF4C4F', bg: 'rgba(255, 76, 79, 0.2)' },
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
