'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowUpDown, Paperclip, ChevronDown, CircleDot, User, Inbox, Building2, Clock, UserCheck, CheckCircle2, Timer, Activity } from 'lucide-react';
import { tasks } from '@/lib/data';
import StatusBadge from '@/components/shared/StatusBadge';
import PriorityBadge from '@/components/shared/PriorityBadge';
import GlassCard from '@/components/shared/GlassCard';
import type { Priority, TaskStatus, Task } from '@/lib/types';
import { getDepartmentColor } from '@/lib/utils';
import { useTimeZone } from '@/context/TimeZoneContext';

type SortField = 'title' | 'priority' | 'status' | 'dueDate' | 'completion' | 'requestDate' | 'actualStartDate' | 'actualEndDate';
type SortDir = 'asc' | 'desc';

const priorityOrder: Record<Priority, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
const departments = ['All', 'Architecture', 'MEP', 'Structural', 'Design', 'Project Management', 'QA/QC', 'HSE', 'IT'];
const priorities: (Priority | 'All')[] = ['All', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const statuses: (TaskStatus | 'All')[] = ['All', 'NOT_STARTED', 'IN_PROGRESS', 'PENDING_REVIEW', 'DELAYED', 'BLOCKED'];

const PREVIEW_ROWS = 3;

// ─── Live Review Timer ────────────────────────────────────────────
function ReviewTimer({ startDate }: { startDate: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const start = new Date(startDate).getTime();
    if (isNaN(start)) return;

    const update = () => {
      const diff = Math.max(0, Date.now() - start);
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);
      
      setElapsed(parts.join(' '));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  return <span className="font-mono-data">{elapsed}</span>;
}

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
      <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
        <PriorityBadge priority={task.priority} />
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <StatusBadge status={task.status} />
          {/* Reviewer details directly under the Pending Review badge */}
          {task.status === 'PENDING_REVIEW' && (task.reviewingEntity || task.responsiblePerson || task.pendingReviewDate) && (
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              marginTop: 2,
              flexWrap: 'wrap',
            }}>
              {task.reviewingEntity && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 10, fontWeight: 600, color: '#f59e0b',
                  background: 'rgba(245,158,11,0.08)',
                  padding: '2px 8px', borderRadius: 20,
                  border: '1px solid rgba(245,158,11,0.15)',
                  whiteSpace: 'nowrap',
                }}>
                  <Building2 size={9} />
                  {task.reviewingEntity}
                </span>
              )}
              {task.responsiblePerson && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 10, fontWeight: 600, color: '#a78bfa',
                  background: 'rgba(167,139,250,0.08)',
                  padding: '2px 8px', borderRadius: 20,
                  border: '1px solid rgba(167,139,250,0.15)',
                  whiteSpace: 'nowrap',
                }}>
                  <UserCheck size={9} />
                  {task.responsiblePerson}
                </span>
              )}
              {task.pendingReviewDate && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 10, fontWeight: 700, color: '#38bdf8',
                  background: 'rgba(56,189,248,0.08)',
                  padding: '2px 8px', borderRadius: 20,
                  border: '1px solid rgba(56,189,248,0.15)',
                  whiteSpace: 'nowrap',
                }}>
                  <Clock size={9} className="animate-pulse" />
                  <ReviewTimer startDate={task.pendingReviewDate} />
                </span>
              )}
            </div>
          )}
          {task.status === 'PENDING_REVIEW' && task.pendingReviewDate && (
            <span style={{ fontSize: 8, color: 'rgba(56,189,248,0.5)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: -2 }}>
              Started: {formatDate(task.pendingReviewDate)} {formatTime(task.pendingReviewDate)}
            </span>
          )}
        </div>
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: task.requestDate ? 0.8 : 0.2 }}>
            <Activity size={10} style={{ color: 'var(--text-dim)' }} />
            <span style={{ fontSize: 11, fontWeight: 500 }}>{task.requestDate ? formatDate(task.requestDate) : '—'}</span>
          </div>
          {task.requestDate && (
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>
              {formatTime(task.requestDate)}
            </span>
          )}
        </div>
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: task.actualStartDate ? '#D4AF37' : 'rgba(255,255,255,0.05)' }}>
            <Timer size={10} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>{task.actualStartDate ? formatDate(task.actualStartDate) : '—'}</span>
          </div>
          {task.actualStartDate && (
            <span style={{ fontSize: 9, color: 'rgba(212, 175, 55, 0.3)', fontWeight: 500 }}>
              {formatTime(task.actualStartDate)}
            </span>
          )}
        </div>
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: (task.actualEndDate && task.status === 'COMPLETED') ? '#10b981' : 'rgba(255,255,255,0.05)' }}>
            <CheckCircle2 size={10} />
            <span style={{ fontSize: 11, fontWeight: 700 }}>{(task.actualEndDate && task.status === 'COMPLETED') ? formatDate(task.actualEndDate) : '—'}</span>
          </div>
          {task.actualEndDate && task.status === 'COMPLETED' && (
            <span style={{ fontSize: 9, color: 'rgba(16, 185, 129, 0.3)', fontWeight: 500 }}>
              {formatTime(task.actualEndDate)}
            </span>
          )}
        </div>
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {formatDate(task.dueDate)}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
            {formatTime(task.dueDate)}
          </span>
        </div>
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{
            flex: 1, height: 6, borderRadius: 3, overflow: 'hidden', maxWidth: 80,
            background: task.status === 'PENDING_REVIEW' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
          }}>
            <div
              className={task.status === 'PENDING_REVIEW' ? 'animate-pulse' : ''}
              style={{
                height: '100%', borderRadius: 3, width: `${task.completion}%`,
                background: task.status === 'PENDING_REVIEW'
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : task.completion >= 80 ? '#10b981' : task.completion >= 50 ? '#3b82f6' : '#f59e0b',
                boxShadow: task.status === 'PENDING_REVIEW' ? '0 0 8px rgba(245,158,11,0.4)' : 'none',
                transition: 'width 300ms ease',
              }}
            />
          </div>
          <span
            className="font-mono-data"
            style={{
              fontSize: 13, width: 30, textAlign: 'right',
              color: task.status === 'PENDING_REVIEW' ? '#fbbf24' : 'var(--text-muted)',
            }}
          >
            {task.completion}%
          </span>
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
      else if (sortField === 'requestDate') cmp = new Date(a.requestDate || 0).getTime() - new Date(b.requestDate || 0).getTime();
      else if (sortField === 'actualStartDate') cmp = new Date(a.actualStartDate || 0).getTime() - new Date(b.actualStartDate || 0).getTime();
      else if (sortField === 'actualEndDate') cmp = new Date(a.actualEndDate || 0).getTime() - new Date(b.actualEndDate || 0).getTime();
      else if (sortField === 'completion') cmp = a.completion - b.completion;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [search, filterDept, filterPriority, filterStatus, sortField, sortDir, dataToFilter]);

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
                  { label: 'Requested', field: 'requestDate' as SortField, align: 'center' },
                  { label: 'Start', field: 'actualStartDate' as SortField, align: 'center' },
                  { label: 'Finish', field: 'actualEndDate' as SortField, align: 'center' },
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
