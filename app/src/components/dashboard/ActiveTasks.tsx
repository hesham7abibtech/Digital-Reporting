'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowUpDown, Paperclip, ChevronDown, CircleDot, User, Inbox, Building2, Clock, UserCheck, CheckCircle2, Timer, Activity, RefreshCw } from 'lucide-react';
import { tasks } from '@/lib/data';
import StatusBadge from '@/components/shared/StatusBadge';
import GlassCard from '@/components/shared/GlassCard';
import type { Priority, TaskStatus, Task, Department } from '@/lib/types';
import { getDepartmentColor } from '@/lib/utils';
import { useTimeZone } from '@/context/TimeZoneContext';
import EliteDropdown from '@/components/dashboard/EliteDropdown';
import { useTableColumns, ColumnDef } from '@/hooks/useTableColumns';
import ColumnSettingsDropdown from '@/components/dashboard/ColumnSettingsDropdown';
import type { TeamMember } from '@/lib/types';

type SortField = 'title' | 'completion' | 'submittingDate' | 'id' | 'department' | 'submitterName' | 'deliverableType' | 'cde' | 'precinct';
type SortDir = 'asc' | 'desc';

const INITIAL_COLUMNS: ColumnDef<SortField>[] = [
  { id: 'id', field: 'id', label: 'ID', align: 'center', priority: 'high', defaultWidth: 110, alwaysVisible: true },
  { id: 'title', field: 'title', label: 'Task Name', align: 'center', priority: 'high', defaultWidth: 220, alwaysVisible: true },
  { id: 'department', field: 'department', label: 'Task Category', align: 'center', priority: 'medium', defaultWidth: 140 },
  { id: 'precinct', field: 'precinct', label: 'Precinct', align: 'center', priority: 'medium', defaultWidth: 120 },
  { id: 'submitterName', field: 'submitterName', label: 'Submitter', align: 'center', priority: 'medium', defaultWidth: 180 },
  { id: 'submittingDate', field: 'submittingDate', label: 'Submission Date', align: 'center', priority: 'medium', defaultWidth: 125 },
  { id: 'deliverableType', field: 'deliverableType', label: 'Deliverable Type', align: 'center', priority: 'medium', defaultWidth: 150 },
  { id: 'cde', field: 'cde', label: 'CDE', align: 'center', priority: 'low', defaultWidth: 200 },
  { id: 'links', field: 'id', label: 'Deliverables Links', align: 'center', priority: 'low', defaultWidth: 240 }
];

function ResizeHandle({ columnWidth, onWidthChange }: { columnWidth: number, onWidthChange: (w: number) => void }) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        let startX = e.clientX;
        let currentWidth = columnWidth;
        
        const handleMouseMove = (moveEvent: MouseEvent) => {
          const delta = moveEvent.clientX - startX;
          const newWidth = Math.max(60, currentWidth + delta);
          onWidthChange(newWidth);
          startX = moveEvent.clientX;
          currentWidth = newWidth;
        };
        const handleMouseUp = () => {
          setIsDragging(false);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }}
      onDoubleClick={() => onWidthChange(150)}
      style={{
        position: 'absolute',
        right: -7,
        top: 0,
        bottom: 0,
        width: 14,
        cursor: 'col-resize',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      className="group"
      title="Drag to resize, double-click to reset"
    >
      <div 
        style={{ 
          width: isDragging ? 3 : 1, 
          height: isDragging ? '100%' : '50%', 
          background: isDragging ? 'var(--primary)' : 'rgba(0, 63, 73, 0.1)', 
          borderRadius: 4,
          transition: 'all 0.2s ease' 
        }} 
        className={!isDragging ? "group-hover:bg-[rgba(0,63,73,0.3)] group-hover:h-[70%]" : ""}
      />
    </div>
  );
}


function TaskRow({ 
  task, index, onClick, visibleColumns, isCustomized, 
  filterType = [], filterCDE = [], members = [], departments = []
}: { 
  task: Task; index: number; onClick?: (task: Task) => void, visibleColumns: ColumnDef<SortField>[], isCustomized: boolean,
  filterType?: string[], filterCDE?: string[], members?: TeamMember[], departments?: Department[]
}) {
  const { formatDate } = useTimeZone();

  const isVisible = (id: string) => visibleColumns.some(c => c.id === id);

  // Resolve submitter avatar
  const submitterProfile = (members || []).find((m: TeamMember) => 
    (task.submitterId && m.id === task.submitterId) || 
    (task.submitterEmail && m.email.toLowerCase() === task.submitterEmail.toLowerCase()) ||
    (task.submitterName && m.name.toLowerCase() === task.submitterName.toLowerCase())
  );
  const avatarUrl = submitterProfile?.avatar;

  return (
    <motion.tr
      key={task.id}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
      onClick={() => onClick?.(task)}
      style={{ borderBottom: '1px solid rgba(198, 224, 224, 0.15)', cursor: 'pointer', transition: 'background 200ms' }}
      className="hover:bg-[rgba(255,255,255,0.03)]"
    >
      {visibleColumns.map(col => {
        if (col.id === 'id') return (
          <td key={col.id} style={{ 
            padding: '12px 14px', fontSize: 13, color: 'var(--text-dim)', fontWeight: 600, textAlign: 'center', verticalAlign: 'middle', 
            whiteSpace: 'nowrap', 
            wordBreak: 'normal' 
          }}>
            {task.id}
          </td>
        );

        if (col.id === 'title') return (
          <td key={col.id} style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle', minWidth: isCustomized ? undefined : 220, maxWidth: col.width || 450 }}>
            <p style={{ 
              fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, 
              whiteSpace: 'normal', 
              wordBreak: 'break-word',
              lineHeight: 1.4
            }}>{task.title}</p>
          </td>
        );
        if (col.id === 'department') return (
          <td key={col.id} style={{ 
            padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle',
            whiteSpace: 'normal',
            wordBreak: 'break-word'
          }}>
            {(() => {
              const d = (departments || []).find((dept: Department) => dept.id === task.department || dept.name === task.department);
              const deptColor = getDepartmentColor(d?.name || task.department);
              return (
                <span style={{ 
                  fontSize: 11,
                  fontWeight: 900,
                  padding: '5px 12px',
                  background: `${deptColor}14`,
                  border: `1.5px solid ${deptColor}66`,
                  color: '#003f49',
                  borderRadius: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  whiteSpace: 'normal',
                  boxShadow: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 'fit-content',
                  maxWidth: '100%'
                }}>
                  {d ? d.name : task.department || 'General'}
                </span>
              );
            })()}
          </td>
        );
        
        if (col.id === 'precinct') return (
          <td key={col.id} style={{ 
            padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle',
            whiteSpace: 'normal',
            wordBreak: 'break-word'
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {task.precinct || '—'}
            </span>
          </td>
        );

        if (col.id === 'submitterName') return (
          <td key={col.id} style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {(submitterProfile?.name || task.submitterName) && (
                <div style={{ 
                  width: 26, height: 26, borderRadius: '8px', 
                  background: avatarUrl ? 'transparent' : 'var(--accent)', 
                  border: '1px solid var(--accent)', 
                  color: 'var(--teal)', fontSize: 10, fontWeight: 900, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  flexShrink: 0, boxShadow: '0 0 10px rgba(197, 160, 89, 0.3)',
                  overflow: 'hidden'
                }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={submitterProfile?.name || task.submitterName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (submitterProfile?.name || task.submitterName || '??').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                  )}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ 
                  fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word'
                }}>
                  {submitterProfile?.name || task.submitterName || '—'}
                </span>
              </div>
            </div>
          </td>
        );

        if (col.id === 'submittingDate') return (
          <td key={col.id} style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'normal', wordBreak: 'break-word' }}>
            <div style={{ display: 'flex', flexDirection: 'column', opacity: task.submittingDate ? 1 : 0.4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: task.submittingDate ? 'var(--text-primary)' : 'inherit' }}>
                {task.submittingDate ? formatDate(task.submittingDate) : '—'}
              </span>
            </div>
          </td>
        );

        if (col.id === 'deliverableType') {
          const activeTypes = (filterType || []).filter(v => v !== 'All Types');
          const activeCDEs = (filterCDE || []).filter(v => v !== 'All Environments');

          const legacyTypes = (Array.isArray(task.deliverableType) ? task.deliverableType : [task.deliverableType]).filter((v): v is string => !!v);
          
          // Filter Legacy Types
          const filteredLegacyTypes = legacyTypes.filter(type => activeTypes.length === 0 || activeTypes.includes(type));

          // Filter Vectors surgically
          const filteredVectors = (task.vectors || []).filter(v => {
            const typeMatch = activeTypes.length === 0 || activeTypes.includes(v.type);
            const cdeMatch = activeCDEs.length === 0 || activeCDEs.includes(v.cde);
            return typeMatch && cdeMatch;
          });

          const vectorTypes = filteredVectors.map(v => v.type);
          const allTypes = Array.from(new Set([...filteredLegacyTypes, ...vectorTypes]));

          return (
            <td key={col.id} style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
                {allTypes.map((type, i) => (
                  <span key={i} style={{ 
                    fontSize: 10, fontWeight: 950, padding: '4px 14px', 
                    background: type === 'RVT' ? 'var(--teal)' : type === 'PPTX' ? '#C5A059' : 'rgba(0, 63, 73, 0.85)', 
                    border: '1px solid rgba(0, 63, 73, 0.2)', 
                    borderRadius: '20px', color: type === 'PPTX' ? '#000' : 'var(--aqua)', whiteSpace: 'normal', textTransform: 'uppercase',
                    letterSpacing: '0.08em', 
                    wordBreak: 'break-word',                    boxShadow: '0 2px 10px rgba(0, 63, 73, 0.15)',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}>{type}</span>
                ))}
                {allTypes.length === 0 && <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>—</span>}
              </div>
            </td>
          );
        }

        if (col.id === 'cde') {
          const activeTypes = (filterType || []).filter(v => v !== 'All Types');
          const activeCDEs = (filterCDE || []).filter(v => v !== 'All Environments');
          
          const legacyCdes = (Array.isArray(task.cde) ? task.cde : [task.cde]).filter((v): v is string => !!v);

          // Filter Legacy CDEs 
          const filteredLegacyCdes = legacyCdes.filter(c => activeCDEs.length === 0 || activeCDEs.includes(c));

          // Filter Vectors surgically (Must match both Type and CDE filter if present)
          const filteredVectors = (task.vectors || []).filter(v => {
            const typeMatch = activeTypes.length === 0 || activeTypes.includes(v.type);
            const cdeMatch = activeCDEs.length === 0 || activeCDEs.includes(v.cde);
            return typeMatch && cdeMatch;
          });

          const vectorCdes = filteredVectors.map(v => v.cde);
          const allCdes = Array.from(new Set([...filteredLegacyCdes, ...vectorCdes]));

          return (
            <td key={col.id} style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
                {allCdes.map((env, i) => (
                  <span key={i} style={{ 
                    fontSize: 10, fontWeight: 950, padding: '4px 14px', 
                    background: env === 'ACC' ? 'var(--teal)' : 'rgba(0, 63, 73, 0.85)', 
                    border: '1px solid rgba(0, 63, 73, 0.2)', 
                    borderRadius: '20px', color: 'var(--aqua)', whiteSpace: 'normal', textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    wordBreak: 'break-word',                    boxShadow: '0 2px 10px rgba(0, 63, 73, 0.15)',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}>{env}</span>
                ))}
                {allCdes.length === 0 && <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>—</span>}
              </div>
            </td>
          );
        }

        if (col.id === 'links') {
          const activeTypes = (filterType || []).filter(v => v !== 'All Types');
          const activeCDEs = (filterCDE || []).filter(v => v !== 'All Environments');

          const legacyTypes = (Array.isArray(task.deliverableType) ? task.deliverableType : [task.deliverableType]).filter((v): v is string => !!v);
          const legacyCdes = (Array.isArray(task.cde) ? task.cde : [task.cde]).filter((v): v is string => !!v);

          // Filter Vectors surgically
          const filteredVectors = (task.vectors || []).filter(v => {
            const typeMatch = activeTypes.length === 0 || activeTypes.includes(v.type);
            const cdeMatch = activeCDEs.length === 0 || activeCDEs.includes(v.cde);
            return typeMatch && cdeMatch;
          });

          // Filter Legacy Links surgically
          const filteredLegacyLinks = (task.links || []).filter((l, i) => {
            const typeAtIdx = legacyTypes[i] || legacyTypes[0];
            const cdeAtIdx = legacyCdes[i] || legacyCdes[0];
            const typeMatch = activeTypes.length === 0 || activeTypes.includes(typeAtIdx);
            const cdeMatch = activeCDEs.length === 0 || activeCDEs.includes(cdeAtIdx);
            return typeMatch && cdeMatch;
          });

          const vectorLinks = filteredVectors.map(v => ({ id: v.id, label: `${v.type} (${v.cde})`, url: v.url }));
          const allLinks = [...filteredLegacyLinks, ...vectorLinks];

          return (
            <td key={col.id} style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                {allLinks.slice(0, 3).map((link) => (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ 
                    color: 'var(--teal)', background: 'var(--sunlit-rock)', 
                    padding: '5px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 7, 
                    textDecoration: 'none', border: '1px solid var(--sunlit-rock)', transition: 'all 200ms', 
                    whiteSpace: 'normal', boxShadow: '0 4px 15px rgba(197, 160, 89, 0.2)',
                    minWidth: 'fit-content',
                    wordBreak: 'break-word'
                  }} className="hover:scale-105 hover:brightness-110">
                    <Activity size={11} strokeWidth={3} />
                    <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{link.label}</span>
                  </a>
                ))}
                {allLinks.length === 0 && <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>}
              </div>
            </td>
          );
        }

        return null;
      })}
    </motion.tr>
  );
}

const thStyle: React.CSSProperties = {
  padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 900,
  color: '#000000', textTransform: 'uppercase', letterSpacing: '0.15em',
  cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
  fontFamily: 'var(--font-primary)',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10,
  background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.12)',
  fontSize: 13, color: 'var(--text-primary)', outline: 'none',
  transition: 'all 0.2s ease'
};

const headerInputStyle: React.CSSProperties = {
  ...selectStyle,
  paddingLeft: 38,
  width: 240,
  border: '1px solid rgba(255, 255, 255, 0.15)'
};

export default function ActiveTasks({
  tasks: dataToFilter = [],
  onTaskClick,
  search,
  setSearch,
  filterDept = [],
  setFilterDept,
  availableDepts = [],
  filterType = [],
  setFilterType,
  availableTypes = [],
  filterCDE = [],
  setFilterCDE,
  availableCDEs = [],
  filterPrecinct = [],
  setFilterPrecinct,
  availablePrecincts = [],
  members = [],
  departments = []
}: {
  tasks?: Task[];
  onTaskClick?: (task: Task) => void;
  search: string;
  setSearch: (v: string) => void;
  filterDept: string[];
  setFilterDept: (v: string[]) => void;
  availableDepts: string[];
  filterType: string[];
  setFilterType: (v: string[]) => void;
  availableTypes: string[];
  filterCDE: string[];
  setFilterCDE: (v: string[]) => void;
  availableCDEs: string[];
  filterPrecinct?: string[];
  setFilterPrecinct?: (v: string[]) => void;
  availablePrecincts?: string[];
  members?: TeamMember[];
  departments?: Department[];
}) {
  const activeTasksInitial = useMemo(() => {
    // Note: dataToFilter passed from parent is already filtered by Date, Dept, Status, and Search.
    return dataToFilter;
  }, [dataToFilter]);

  const [sortField, setSortField] = useState<SortField>('department');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const {
    columns: visibleColumns,
    allColumns,
    settings,
    toggleColumnVisibility,
    updateColumnWidth,
    resetSettings,
    reorderColumn,
    isCustomized
  } = useTableColumns('active-tasks-v3', INITIAL_COLUMNS);

  // Since filtering is handled by parent, result is just activeTasksInitial + sorting
  const filtered = useMemo(() => {
    let result = [...activeTasksInitial];

    result.sort((a: Task, b: Task) => {
      let cmp = 0;
      if (sortField === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortField === 'id') cmp = a.id.localeCompare(b.id);

      else if (sortField === 'submittingDate') cmp = new Date(a.submittingDate || 0).getTime() - new Date(b.submittingDate || 0).getTime();
      else if (sortField === 'department') cmp = a.department.localeCompare(b.department);
      else if (sortField === 'submitterName') cmp = (a.submitterName || '').localeCompare(b.submitterName || '');
      else if (sortField === 'deliverableType') cmp = (Array.isArray(a.deliverableType) ? a.deliverableType.join(',') : (a.deliverableType || '')).localeCompare(Array.isArray(b.deliverableType) ? b.deliverableType.join(',') : (b.deliverableType || ''));
      else if (sortField === 'cde') cmp = (Array.isArray(a.cde) ? a.cde.join(',') : (a.cde || '')).localeCompare(Array.isArray(b.cde) ? b.cde.join(',') : (b.cde || ''));
      else if (sortField === 'precinct') cmp = (a.precinct || '').localeCompare(b.precinct || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [sortField, sortDir, activeTasksInitial]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ marginTop: 0, height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <GlassCard style={{ padding: 0, overflow: 'hidden', gap: 0, height: '100%', minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%', minHeight: 0 }}>
        <div style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0, 63, 73, 0.15)',
          flexWrap: 'wrap',
          gap: 16,
          background: 'rgba(251, 250, 245, 0.99)',
          borderRadius: '16px 16px 0 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', width: '100%', gap: 16 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#003f49' }} />
              <input
                type="text"
                placeholder="Search Deliverables..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...headerInputStyle, background: 'rgba(255, 255, 255, 0.8)', color: '#003f49', borderColor: 'rgba(0, 63, 73, 0.25)', fontWeight: 600 }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>


            <EliteDropdown
              value={filterDept}
              options={availableDepts.map(d => ({ label: d, value: d }))}
              onChange={setFilterDept}
              menuLabel="Categories"
              isMulti={true}
              allLabel="All Categories"
            />

            <EliteDropdown
              value={filterType}
              options={availableTypes.map(t => ({ label: t, value: t }))}
              onChange={setFilterType}
              menuLabel="Deliverable Type"
              isMulti={true}
              allLabel="All Types"
            />

            <EliteDropdown
              value={filterCDE}
              options={availableCDEs.map(c => ({ label: c, value: c }))}
              onChange={setFilterCDE}
              menuLabel="Environments"
              isMulti={true}
              allLabel="All Environments"
            />

            <EliteDropdown
              value={filterPrecinct}
              options={availablePrecincts.map(p => ({ label: p, value: p }))}
              onChange={setFilterPrecinct || (() => {})}
              menuLabel="Precincts"
              isMulti={true}
              allLabel="All Precincts"
            />

            <ColumnSettingsDropdown
              columns={allColumns}
              settings={settings}
              onToggle={toggleColumnVisibility}
              onReset={resetSettings}
              hasChanges={isCustomized}
            />

            {(search || 
              (filterDept.length > 0 && !filterDept.includes('All Categories')) ||
              (filterType.length > 0 && !filterType.includes('All Types')) || 
              (filterCDE.length > 0 && !filterCDE.includes('All Environments')) ||
              (filterPrecinct.length > 0 && !filterPrecinct.includes('All Precincts'))
            ) && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterDept([]);
                  setFilterType([]);
                  setFilterCDE([]);
                  if (setFilterPrecinct) setFilterPrecinct([]);
                }}
                title="Clear All Data Filters"
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s'
                }}
                className="hover:bg-[rgba(239, 68, 68, 0.15)]"
              >
                <RefreshCw size={14} />
                Reset Filters
              </button>
            )}

            {isCustomized && (
              <button
                onClick={() => { resetSettings(); setSortField('id'); setSortDir('asc'); }}
                style={{
                  padding: '6px 12px', fontSize: 11, fontWeight: 800,
                  color: '#FF4C4F', background: 'rgba(255, 76, 79, 0.1)',
                  border: '1px solid rgba(255, 76, 79, 0.2)', borderRadius: 6,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  gap: 6, transition: 'all 0.2s'
                }}
                className="hover:bg-[rgba(255,76,79,0.15)]"
              >
                <ArrowUpDown size={14} />
                Reset Layout
              </button>
            )}
            </div>
          </div>
        </div>

        <div
          style={{
            overflowX: isCustomized ? 'auto' : 'hidden',
            overflowY: 'auto',
            paddingBottom: 4,
            flex: 1,
            minHeight: 0,
            maxHeight: 'calc(100vh - 305px)'
          }}
          className="elite-scrollbar"
        >
          <style>{`
            .elite-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
            .elite-scrollbar::-webkit-scrollbar-track { background: rgba(0, 63, 73, 0.05); border-radius: 10px; }
            .elite-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 63, 73, 0.35); border-radius: 10px; }
            .elite-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 63, 73, 0.6); }
            .elite-column-dividers th:not(:last-child) {
              position: relative;
            }
            .elite-column-dividers th:not(:last-child)::after {
              content: '';
              position: absolute;
              right: 0;
              top: 25%;
              bottom: 25%;
              width: 1.5px;
              background: rgba(0, 63, 73, 0.4);
            }
            .elite-column-dividers td:not(:last-child) {
              border-right: 1.5px solid rgba(0, 63, 73, 0.15) !important;
            }
          `}</style>
          <table className="elite-column-dividers" style={{ width: isCustomized ? 'max-content' : '100%', borderCollapse: 'collapse', tableLayout: isCustomized ? 'fixed' : 'auto', minWidth: '100%' }}>
            <colgroup>
              {visibleColumns.map(col => {
                if (isCustomized) {
                  return <col key={col.id} style={{ width: col.width || col.defaultWidth }} />;
                }

                // In default view, keep semantic columns content-fitted and let title absorb remaining width.
                const contentFitColumns = new Set([
                  'id',
                  'department',
                  'precinct',
                  'submitterName',
                  'submittingDate',
                  'deliverableType',
                  'cde',
                  'links'
                ]);

                return (
                  <col
                    key={col.id}
                    style={{ width: col.id === 'title' ? 'auto' : (contentFitColumns.has(col.id) ? `${col.defaultWidth}px` : undefined) }}
                  />
                );
              })}
            </colgroup>
            <thead>
              <tr style={{ background: 'var(--accent)', borderBottom: '1px solid var(--border)' }}>
                {visibleColumns.map((col, index) => (
                  <th 
                    key={col.id} 
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', col.id);
                      e.currentTarget.style.opacity = '0.4';
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      e.currentTarget.style.background = 'var(--secondary)';
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.background = 'var(--accent)';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.background = 'var(--accent)';
                      const sourceId = e.dataTransfer.getData('text/plain');
                      if (sourceId && sourceId !== col.id) {
                        reorderColumn(sourceId, col.id);
                      }
                    }}
                    style={{ ...thStyle, color: '#000000', textAlign: 'center', background: 'var(--accent)', borderBottom: '1px solid var(--border)', transition: 'background 0.2s', position: 'sticky', top: 0, zIndex: 50 }}
                  >
                    <div onClick={() => toggleSort(col.field)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 950, color: '#000000', whiteSpace: 'nowrap' }}>{col.label}</span>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginLeft: 8 }}>
                        {sortField === col.field ? (
                          sortDir === 'asc' ? (
                            <motion.div animate={{ rotate: 0 }} initial={{ rotate: 180 }}>
                              <ChevronDown size={14} style={{ color: '#003f49', strokeWidth: 4 }} />
                            </motion.div>
                          ) : (
                            <motion.div animate={{ rotate: 180 }} initial={{ rotate: 0 }}>
                              <ChevronDown size={14} style={{ color: '#003f49', strokeWidth: 4 }} />
                            </motion.div>
                          )
                        ) : (
                          <ArrowUpDown size={14} style={{ color: 'rgba(0, 0, 0, 0.25)', opacity: 0.5 }} />
                        )}
                      </span>
                    </div>
                    <ResizeHandle columnWidth={col.width || 120} onWidthChange={(w) => updateColumnWidth(col.id, w)} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((task, i) => (
                <TaskRow 
                  key={task.id} 
                  task={task} 
                  index={i} 
                  onClick={onTaskClick} 
                  visibleColumns={visibleColumns}
                  isCustomized={isCustomized}
                  filterType={filterType}
                  filterCDE={filterCDE}
                  members={members}
                  departments={departments}
                />
              ))}
            </tbody>
          </table>
        </div>

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
      </div>
    </GlassCard>
  </motion.div>
  );
}
