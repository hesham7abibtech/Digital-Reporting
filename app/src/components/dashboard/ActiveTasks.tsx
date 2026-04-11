'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowUpDown, Paperclip, ChevronDown, CircleDot, User, Inbox, Building2, Clock, UserCheck, CheckCircle2, Timer, Activity } from 'lucide-react';
import { tasks } from '@/lib/data';
import StatusBadge from '@/components/shared/StatusBadge';
import GlassCard from '@/components/shared/GlassCard';
import type { Priority, TaskStatus, Task, Department } from '@/lib/types';
import { getDepartmentColor } from '@/lib/utils';
import { useTimeZone } from '@/context/TimeZoneContext';
import EliteDropdown from '@/components/dashboard/EliteDropdown';

type SortField = 'title' | 'status' | 'completion' | 'actualStartDate' | 'actualEndDate' | 'id' | 'department';
type SortDir = 'asc' | 'desc';


const PREVIEW_ROWS = 5;


function TaskRow({ task, index, onClick }: { task: Task; index: number; onClick?: (task: Task) => void }) {
  const { formatDate } = useTimeZone();

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
      {/* 1. Task ID */}
      <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-dim)', fontWeight: 500, textAlign: 'left', verticalAlign: 'middle' }}>
        {task.id}
      </td>

      {/* 2. Task Name */}
      <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: 0 }}>{task.title}</p>
      </td>

      {/* 3. Department Name */}
      <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: getDepartmentColor(task.department) }}>
          {task.department}
        </span>
      </td>

      <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <StatusBadge status={task.status} />
        </div>
      </td>

      {/* 5. Start Date */}
      <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', flexDirection: 'column', opacity: task.actualStartDate ? 1 : 0.4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: task.actualStartDate ? '#D4AF37' : 'inherit' }}>
            {task.actualStartDate ? formatDate(task.actualStartDate) : '—'}
          </span>
        </div>
      </td>

      {/* 6. Finish Date */}
      <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', flexDirection: 'column', opacity: (task.actualEndDate && task.status === 'COMPLETED') ? 1 : 0.4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: (task.actualEndDate && task.status === 'COMPLETED') ? '#10b981' : 'inherit' }}>
            {(task.actualEndDate && task.status === 'COMPLETED') ? formatDate(task.actualEndDate) : '—'}
          </span>
        </div>
      </td>

      {/* 7. Deliverables Links */}
      <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          {task.links?.slice(0, 3).map((link) => (
            <a 
              key={link.id} 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={(e) => e.stopPropagation()}
              style={{ 
                color: '#D4AF37', 
                background: 'rgba(212, 175, 55, 0.1)', 
                padding: '4px 8px', 
                borderRadius: 6, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6,
                textDecoration: 'none',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                transition: 'all 200ms'
              }}
              className="hover:bg-[rgba(212,175,55,0.2)]"
            >
              <Activity size={10} />
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{link.label}</span>
            </a>
          ))}
          {(!task.links || task.links.length === 0) && <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>—</span>}
        </div>
      </td>

      {/* 8. Assignee Removed */}
    </motion.tr>
  );
}

const thStyle: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600,
  color: '#c9a227', textTransform: 'uppercase', letterSpacing: '0.06em',
  cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10,
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
  fontSize: 13, color: 'white', outline: 'none',
  transition: 'all 0.2s ease'
};

const headerInputStyle: React.CSSProperties = {
  ...selectStyle,
  paddingLeft: 38,
  width: 240,
  border: '1px solid rgba(212, 175, 55, 0.1)'
};

export default function ActiveTasks({ 
  tasks: dataToFilter = [], 
  onTaskClick,
  search,
  setSearch,
  filterDept,
  setFilterDept,
  availableDepts = []
}: { 
  tasks?: Task[]; 
  onTaskClick?: (task: Task) => void;
  search: string;
  setSearch: (v: string) => void;
  filterDept: string[];
  setFilterDept: (v: string[]) => void;
  availableDepts: string[];
}) {
  const activeTasksInitial = useMemo(() => {
    // Note: dataToFilter passed from parent is already filtered by Date, Dept, Status, and Search.
    return dataToFilter;
  }, [dataToFilter]);

  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expanded, setExpanded] = useState(false);

  // Since filtering is handled by parent, result is just activeTasksInitial + sorting
  const filtered = useMemo(() => {
    let result = [...activeTasksInitial];
    
    result.sort((a: Task, b: Task) => {
      let cmp = 0;
      if (sortField === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortField === 'id') cmp = a.id.localeCompare(b.id);
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortField === 'actualStartDate') cmp = new Date(a.actualStartDate || 0).getTime() - new Date(b.actualStartDate || 0).getTime();
      else if (sortField === 'actualEndDate') cmp = new Date(a.actualEndDate || 0).getTime() - new Date(b.actualEndDate || 0).getTime();
      else if (sortField === 'department') cmp = a.department.localeCompare(b.department);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [sortField, sortDir, activeTasksInitial]);

  const previewRows = filtered.slice(0, PREVIEW_ROWS);
  const remainingRows = filtered.slice(PREVIEW_ROWS);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const headers = [
    { label: 'Task ID', field: 'id' as SortField, align: 'center' },
    { label: 'Task Name', field: 'title' as SortField, align: 'center' },
    { label: 'Department Name', field: 'department' as SortField, align: 'center' },
    { label: 'Task Status', field: 'status' as SortField, align: 'center' },
    { label: 'Start Date', field: 'actualStartDate' as SortField, align: 'center' },
    { label: 'Finish Date', field: 'actualEndDate' as SortField, align: 'center' },
    { label: 'Deliverables Links', field: 'id' as SortField, align: 'center' }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <GlassCard style={{ padding: 0, overflow: 'visible' }}>
        <div style={{ 
          padding: '16px 20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderBottom: '1px solid rgba(255,255,255,0.04)', 
          flexWrap: 'wrap', 
          gap: 16,
          position: 'relative',
          zIndex: 100, // Ensure dropdowns stay above table
          overflow: 'visible'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircleDot size={18} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Active Tasks</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginLeft: 'auto' }}>
             <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(212, 175, 55, 0.4)' }} />
              <input 
                type="text" 
                placeholder="Search Tasks..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={headerInputStyle}
              />
            </div>
            
            <EliteDropdown 
              value={filterDept} 
              options={availableDepts.map(d => ({ label: d, value: d }))} 
              onChange={setFilterDept} 
              menuLabel="Departments"
              isMulti={true}
              allLabel="All Departments"
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {headers.map(col => (
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
              {previewRows.map((task, i) => <TaskRow key={task.id} task={task} index={i} onClick={onTaskClick} />)}
              <AnimatePresence initial={false}>
                {expanded && remainingRows.map((task, i) => (
                  <TaskRow key={task.id} task={task} index={PREVIEW_ROWS + i} onClick={onTaskClick} />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

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
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No current data</p>
              <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>System is ready for task initiation</p>
            </div>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
