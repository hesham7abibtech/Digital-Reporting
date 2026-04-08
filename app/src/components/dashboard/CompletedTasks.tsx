'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Paperclip, ChevronDown, ChevronRight } from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import PriorityBadge from '@/components/shared/PriorityBadge';
import { tasks } from '@/lib/data';
import type { Task } from '@/lib/types';
import { getDepartmentColor } from '@/lib/utils';
import { useTimeZone } from '@/context/TimeZoneContext';

const PREVIEW_ROWS = 3;

export default function CompletedTasks({ onTaskClick, tasks: externalTasks }: { onTaskClick?: (task: Task) => void, tasks?: Task[] }) {
  const [expanded, setExpanded] = useState(false);

  // Use external tasks if provided, otherwise fallback to mock
  const dataToFilter = externalTasks || tasks;

  const completedTasks = dataToFilter
    .filter((t: Task) => t.status === 'COMPLETED')
    .sort((a: Task, b: Task) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const previewRows = completedTasks.slice(0, PREVIEW_ROWS);
  const remainingRows = completedTasks.slice(PREVIEW_ROWS);

  const thStyle: React.CSSProperties = {
    padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 500,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
      <GlassCard padding="sm" hover={false}>
        {/* Header */}
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <button onClick={() => setExpanded(!expanded)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {expanded ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
            <CheckCircle size={16} color="#10b981" />
            <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Recently Completed
              <span style={{ marginLeft: 6, fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>({completedTasks.length})</span>
            </h2>
          </button>
        </div>

        {/* Table — always show preview, expand for all */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {['Task', 'Department', 'Priority', 'Completed', 'Files'].map((col, idx) => (
                  <th key={col} style={{ ...thStyle, textAlign: idx === 0 ? 'left' : 'center' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Always-visible preview rows */}
              {previewRows.map((task, i) => (
                <Row key={task.id} task={task} index={i} onClick={onTaskClick} />
              ))}

              {/* Expandable remaining rows */}
              <AnimatePresence initial={false}>
                {expanded && remainingRows.map((task, i) => (
                  <Row key={task.id} task={task} index={PREVIEW_ROWS + i} onClick={onTaskClick} />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Expand/collapse footer */}
        {remainingRows.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              width: '100%', padding: '10px 0', border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)',
              fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              borderRadius: '0 0 16px 16px', transition: 'background 200ms',
            }}
          >
            {expanded ? 'Show less' : `Show all ${completedTasks.length} completed`}
            <ChevronDown size={12} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
          </button>
        )}
      </GlassCard>
    </motion.div>
  );
}

function Row({ task, index, onClick }: { task: Task; index: number; onClick?: (task: Task) => void }) {
  const { formatDate, formatTime } = useTimeZone();

  return (
    <motion.tr
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      onClick={() => onClick?.(task)}
      style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'background 200ms' }}
      className="hover:bg-[rgba(255,255,255,0.02)]"
    >
      <td style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: getDepartmentColor(task.department), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
            {task.assigneeName.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle size={13} color="#10b981" /> {task.title}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{task.assigneeName}</p>
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
        <span style={{ fontSize: 13, color: getDepartmentColor(task.department), fontWeight: 500 }}>{task.department}</span>
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
        <PriorityBadge priority={task.priority} />
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {formatDate(task.updatedAt)}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
            {formatTime(task.updatedAt)}
          </span>
        </div>
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-dim)', fontSize: 13 }}>
          <Paperclip size={14} />
          {task.attachments || 0}
        </div>
      </td>
    </motion.tr>
  );
}
