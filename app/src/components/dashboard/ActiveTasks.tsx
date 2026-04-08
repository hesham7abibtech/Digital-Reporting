'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowUpDown, Paperclip, ChevronDown, CircleDot, User, Inbox } from 'lucide-react';
import { tasks } from '@/lib/data';
import StatusBadge from '@/components/shared/StatusBadge';
import PriorityBadge from '@/components/shared/PriorityBadge';
import GlassCard from '@/components/shared/GlassCard';
import type { Priority, TaskStatus, Task } from '@/lib/types';
import { getDepartmentColor } from '@/lib/utils';
import { useTimeZone } from '@/context/TimeZoneContext';

type SortField = 'title' | 'priority' | 'status' | 'dueDate' | 'completion';
type SortDir = 'asc' | 'desc';

const priorityOrder: Record<Priority, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
const departments = ['All', 'Architecture', 'MEP', 'Structural', 'Design', 'Project Management', 'QA/QC', 'HSE', 'IT'];
const priorities: (Priority | 'All')[] = ['All', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const statuses: (TaskStatus | 'All')[] = ['All', 'NOT_STARTED', 'IN_PROGRESS', 'PENDING_REVIEW', 'DELAYED', 'BLOCKED'];

const PREVIEW_ROWS = 3;

function TaskRow({ task, index, onClick }: { task: Task; index: number; onClick?: (task: Task) => void }) {
  const { formatDate, formatTime } = useTimeZone();

  return (
    <motion.tr
      key={task.id}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
      onClick={() => onClick?.(task)}
      style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'background 200ms' }}
      className="hover:bg-[rgba(255,255,255,0.02)]"
    >
      <td style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: getDepartmentColor(task.department), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
            {task.assigneeName.split(' ').map(n => n[0]).join('')}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{task.title}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2, fontSize: 13, color: 'var(--text-muted)' }}>
              <User size={11} /> {task.assigneeName}
              <span style={{ color: 'var(--text-dim)' }}>•</span>
              <span style={{ color: getDepartmentColor(task.department) }}>{task.department}</span>
              {task.attachments > 0 && <><span style={{ color: 'var(--text-dim)' }}>•</span><Paperclip size={11} />{task.attachments}</>}
            </div>
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
        <PriorityBadge priority={task.priority} />
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
        <StatusBadge status={task.status} />
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {formatDate(task.dueDate)}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
            {formatTime(task.dueDate)}
          </span>
        </div>
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', maxWidth: 80 }}>
            <div style={{ height: '100%', borderRadius: 3, width: `${task.completion}%`, background: task.completion >= 80 ? '#10b981' : task.completion >= 50 ? '#3b82f6' : '#f59e0b' }} />
          </div>
          <span className="font-mono-data" style={{ fontSize: 13, color: 'var(--text-muted)', width: 30, textAlign: 'right' }}>{task.completion}%</span>
        </div>
      </td>
    </motion.tr>
  );
}

const thStyle: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600,
  color: '#c9a227', textTransform: 'uppercase', letterSpacing: '0.06em',
  cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
};

const selectStyle: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 8,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
  fontSize: 13, color: 'var(--text-secondary)', outline: 'none',
};

export default function ActiveTasks({ onTaskClick, tasks: externalTasks }: { onTaskClick?: (task: Task) => void, tasks?: Task[] }) {
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterPriority, setFilterPriority] = useState<Priority | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'All'>('All');
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [expanded, setExpanded] = useState(false);

  // Use external tasks if provided, otherwise fallback to mock
  const dataToFilter = externalTasks || tasks;

  const filtered = useMemo(() => {
    let result = dataToFilter.filter((t: Task) => t.status !== 'COMPLETED');
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t: Task) => t.title.toLowerCase().includes(q) || t.assigneeName.toLowerCase().includes(q) || t.department.toLowerCase().includes(q));
    }
    if (filterDept !== 'All') result = result.filter((t: Task) => t.department === filterDept);
    if (filterPriority !== 'All') result = result.filter((t: Task) => t.priority === filterPriority);
    if (filterStatus !== 'All') result = result.filter((t: Task) => t.status === filterStatus);
    result.sort((a: Task, b: Task) => {
      let cmp = 0;
      if (sortField === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortField === 'priority') cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortField === 'dueDate') cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      else if (sortField === 'completion') cmp = a.completion - b.completion;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [search, filterDept, filterPriority, filterStatus, sortField, sortDir]);

  const previewRows = filtered.slice(0, PREVIEW_ROWS);
  const remainingRows = filtered.slice(PREVIEW_ROWS);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircleDot size={18} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Active Tasks</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginLeft: 'auto' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...selectStyle, paddingLeft: 30, width: 160 }}
              />
            </div>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={selectStyle}>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as Priority | 'All')} style={selectStyle}>
              {priorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as TaskStatus | 'All')} style={selectStyle}>
              {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {[
                  { label: 'Task Name', field: 'title' as SortField, align: 'left' },
                  { label: 'Priority', field: 'priority' as SortField, align: 'center' },
                  { label: 'Status', field: 'status' as SortField, align: 'center' },
                  { label: 'Due Date', field: 'dueDate' as SortField, align: 'center' },
                  { label: 'Progress', field: 'completion' as SortField, align: 'center' }
                ].map(col => (
                  <th key={col.label} onClick={() => toggleSort(col.field)} style={{ ...thStyle, textAlign: col.align as any }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: col.align === 'center' ? 'center' : 'flex-start', gap: 6 }}>
                      {col.label}
                      <ArrowUpDown size={10} style={{ color: sortField === col.field ? '#3b82f6' : 'rgba(255,255,255,0.1)' }} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Always-visible preview rows */}
              {previewRows.map((task, i) => <TaskRow key={task.id} task={task} index={i} onClick={onTaskClick} />)}

              {/* Expandable remaining rows */}
              <AnimatePresence initial={false}>
                {expanded && remainingRows.map((task, i) => (
                  <TaskRow key={task.id} task={task} index={PREVIEW_ROWS + i} onClick={onTaskClick} />
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
            {expanded ? 'Show less' : `Show all ${filtered.length} tasks`}
            <ChevronDown size={12} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
          </button>
        )}

        {filtered.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Inbox size={22} style={{ color: 'rgba(59, 130, 246, 0.4)' }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No current data available</p>
              <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Active tasks will appear here when created</p>
            </div>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
