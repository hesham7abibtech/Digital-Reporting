'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ArrowUpDown,
  ChevronDown,
  Layers,
  Link as LinkIcon,
  Activity,
  Calendar,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  User,
  Settings,
  Globe,
  MessageSquare,
  FileText,
  Clock,
  Hash,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  Shield
} from 'lucide-react';
import { 
  deleteBimReview, 
  upsertBimReview, 
  bulkUpsertBimReviews,
  migrateBimReviews 
} from '@/services/FirebaseService';
import { useAuth } from '@/context/AuthContext';
import GlassCard from '@/components/shared/GlassCard';
import EliteDropdown from '@/components/dashboard/EliteDropdown';
import { BIMReview } from '@/lib/types';
import { useTableColumns, ColumnDef } from '@/hooks/useTableColumns';
import ColumnSettingsDropdown from '@/components/dashboard/ColumnSettingsDropdown';
import type { TeamMember } from '@/lib/types';
import { formatDate } from '@/lib/utils';

type SortField = keyof BIMReview;
type SortDir = 'asc' | 'desc';

const INITIAL_COLUMNS: ColumnDef<SortField>[] = [
  { id: 'ID', field: 'ID' as any, label: 'ID', align: 'center', priority: 'high', defaultWidth: 120, alwaysVisible: true },
  { id: 'Project', field: 'Project' as any, label: 'Project', align: 'center', priority: 'high', defaultWidth: 260, alwaysVisible: true },
  { id: 'Precinct', field: 'Precinct' as any, label: 'Precinct', align: 'center', priority: 'medium', defaultWidth: 180 },
  { id: 'Stakeholder', field: 'Stakeholder' as any, label: 'Stakeholder', align: 'center', priority: 'medium', defaultWidth: 180 },
  { id: 'Milestone Submissions', field: 'Milestone Submissions' as any, label: 'Milestone Submissions', align: 'center', priority: 'high', defaultWidth: 280 },
  { id: 'Submission Category', field: 'Submission Category' as any, label: 'Submission Category', align: 'center', priority: 'low', defaultWidth: 180 },
  { id: 'Planned Submission Date', field: 'Planned Submission Date' as any, label: 'Planned Submission Date', align: 'center', priority: 'low', defaultWidth: 200 },
  { id: 'ACC Status', field: 'ACC Status' as any, label: 'ACC Status', align: 'center', priority: 'low', defaultWidth: 160 },
  { id: 'Priority', field: 'Priority' as any, label: 'Design Stage', align: 'center', priority: 'medium', defaultWidth: 120 },
  { id: 'ACC Review ID', field: 'ACC Review ID' as any, label: 'ACC Review ID', align: 'center', priority: 'medium', defaultWidth: 120 },
  { id: 'InSite Review Status', field: 'InSite Review Status' as any, label: 'InSite Review Status', align: 'center', priority: 'high', defaultWidth: 240 },
  { id: 'InSite Review Due Date', field: 'InSite Review Due Date' as any, label: 'InSite Review Due Date', align: 'center', priority: 'medium', defaultWidth: 160 },
  { id: 'InSite Reviewer', field: 'InSite Reviewer' as any, label: 'InSite Reviewer', align: 'center', priority: 'medium', defaultWidth: 200 },
  { id: 'InSite Review Output ACC URL', field: 'InSite Review Output ACC URL' as any, label: 'InSite Review Output ACC URL', align: 'center', priority: 'high', defaultWidth: 160 },
  { id: 'Comments', field: 'Comments' as any, label: 'Comments', align: 'center', priority: 'low', defaultWidth: 280 }
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
          const newWidth = Math.max(80, currentWidth + delta);
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
    >
      <div
        style={{
          width: isDragging ? 3 : 1,
          height: isDragging ? '100%' : '50%',
          background: isDragging ? 'var(--primary)' : 'rgba(0, 63, 73, 0.1)',
          borderRadius: 4,
          transition: 'all 0.2s ease'
        }}
        className={!isDragging ? "group-hover:bg-[rgba(0, 63, 73, 0.3)] group-hover:h-[70%]" : ""}
      />
    </div>
  );
}

function ReviewRow({
  item,
  index,
  visibleColumns,
  isCustomized,
  isAdminOrOwner,
  onEdit,
  onDelete,
  members = []
}: {
  item: BIMReview;
  index: number;
  visibleColumns: ColumnDef<SortField>[];
  isCustomized: boolean;
  isAdminOrOwner: boolean;
  onEdit?: (r: BIMReview) => void;
  onDelete?: (r: BIMReview) => void;
  members?: TeamMember[];
}) {
  const formatTextWithLinks = (text: string) => {
    if (!text) return text;
    const parts = text.split(/(\(https?:\/\/[^)]+\))/g);
    return parts.map((part: string, i: number) => {
      if (part.startsWith('(http')) {
        const url = part.slice(1, -1);
        return (
          <div key={i} className="group" style={{ display: 'inline-flex', position: 'relative', overflow: 'visible' }}>
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 4, padding: 4, borderRadius: 4, background: 'rgba(0,63,73,0.05)' }} className="hover:bg-[rgba(0,63,73,0.1)] transition-colors">
              <LinkIcon size={12} />
            </a>
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              marginBottom: 8,
              padding: '8px 12px',
              background: 'rgba(0, 63, 73, 0.98)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(198, 224, 224, 0.2)',
              borderRadius: 8,
              fontSize: 10,
              fontWeight: 600,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              transition: 'all 0.2s',
              zIndex: 1000,
              boxShadow: '0 8px 24px rgba(0, 63, 73, 0.2)'
            }} className="opacity-0 -translate-x-1/2 group-hover:opacity-100 group-hover:-translate-y-[2px]">
              {url}
              <div style={{
                position: 'absolute', top: '100%', left: '50%', marginLeft: -4,
                borderWidth: 4, borderStyle: 'solid',
                borderColor: 'rgba(0, 63, 73, 0.98) transparent transparent transparent'
              }} />
            </div>
          </div>
        );
      }
      return part;
    });
  };
 
  // Resolve reviewer avatar - taking the first reviewer for the avatar if multiple exist
  const firstReviewer = item["InSite Reviewer"]?.[0] || '';
  const reviewerProfile = (members || []).find((m: TeamMember) => 
    (m.name.toLowerCase() === firstReviewer.toLowerCase()) ||
    (m.email.toLowerCase() === firstReviewer.toLowerCase())
  );
  const avatarUrl = reviewerProfile?.avatar;

  const getStatusColor = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s.includes('WITH EGIS') || s.includes('IN REVIEW')) return '#FF7908';
    if (s.includes('APPROVED') || s.includes('SHARED') || s.includes('COMPLETED')) return '#526136';
    if (s.includes('REJECTED') || s.includes('HOLD')) return '#FF4C4F';
    return 'var(--text-dim)';
  };

  return (
    <motion.tr
      key={item.ID || `row-${index}`}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.01, duration: 0.15 }}
      style={{ borderBottom: '1.5px solid rgba(0, 63, 73, 0.12)', cursor: 'pointer', transition: 'background 200ms' }}
      className="hover:bg-[rgba(0,63,73,0.03)]"
      onClick={() => onEdit?.(item)}
    >
      {visibleColumns.map(col => {
        const cellStyle: React.CSSProperties = {
          padding: '12px 20px',
          textAlign: (col.align as any) || 'left',
          verticalAlign: 'middle',
          fontSize: 12,
          fontWeight: 850,
          color: '#003f49',
          fontFamily: 'var(--font-primary)'
        };

        if (col.id === 'ID') return (
          <td key={col.id} style={{ ...cellStyle, color: 'var(--text-dim)', fontWeight: 800, fontSize: 11 }}>
            {item.ID}
          </td>
        );

        if (col.id === 'Project') return (
          <td key={col.id} style={{ ...cellStyle, color: 'var(--text-dim)', fontWeight: 800, fontSize: 11, letterSpacing: '0.02em' }}>
            {formatTextWithLinks(item.Project)}
          </td>
        );

        if (col.id === 'Precinct') return (
          <td key={col.id} style={{ ...cellStyle }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              {(item.Precinct || []).map((p, i) => (
                <span key={`${p}-${i}`} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(0, 63, 73, 0.05)', border: '1px solid rgba(0, 63, 73, 0.15)', color: '#003f49', fontWeight: 900, textTransform: 'uppercase' }}>{p}</span>
              ))}
            </div>
          </td>
        );

        if (col.id === 'Milestone Submissions') return (
          <td key={col.id} style={{ ...cellStyle }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
              {(item["Milestone Submissions"] || []).map((ms, i) => (
                <div key={`ms-${i}`} style={{ color: 'rgba(0, 63, 73, 0.7)', fontStyle: 'italic', fontWeight: 800, fontSize: 11 }}>{ms}</div>
              ))}
            </div>
          </td>
        );

        if (col.id === 'ACC Review ID') return (
          <td key={col.id} style={{ ...cellStyle }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
              borderRadius: 8, background: 'rgba(0, 63, 73, 0.05)',
              border: '1px solid rgba(0, 63, 73, 0.2)', fontSize: 11,
              fontWeight: 900, color: 'var(--teal)', boxShadow: '0 2px 8px rgba(0, 63, 73, 0.05)'
            }}>
              <Hash size={10} style={{ opacity: 0.9, color: 'var(--teal)' }} /> {item["ACC Review ID"] || '—'}
            </div>
          </td>
        );

        if (col.id === 'Stakeholder') return (
          <td key={col.id} style={{ ...cellStyle, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            {item.Stakeholder}
          </td>
        );

        if (col.id === 'InSite Review Status') return (
          <td key={col.id} style={{ ...cellStyle }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: getStatusColor(item["InSite Review Status"]),
                boxShadow: `0 0 10px ${getStatusColor(item["InSite Review Status"])}`
              }} />
              <span className="brand-heading" style={{
                fontSize: 11,
                color: '#003f49',
                fontWeight: 900,
                letterSpacing: '0.1em'
              }}>{(item["InSite Review Status"] || 'PENDING').toUpperCase()}</span>
            </div>
          </td>
        );

        if (col.id === 'InSite Review Due Date') return (
          <td key={col.id} style={{ ...cellStyle, color: 'var(--text-dim)', fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Clock size={12} style={{ opacity: 0.6 }} /> {formatDate(item["InSite Review Due Date"])}
            </div>
          </td>
        );

        if (col.id === 'InSite Reviewer') return (
          <td key={col.id} style={{ ...cellStyle }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
              {(item["InSite Reviewer"] || []).map((rev, i) => (
                <div key={`rev-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                   <div style={{ 
                    width: 20, height: 20, borderRadius: '4px', 
                    background: 'rgba(0, 63, 73, 0.05)', 
                    border: '1px solid rgba(0, 63, 73, 0.1)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    flexShrink: 0, overflow: 'hidden'
                  }}>
                    <User size={10} style={{ opacity: 0.9 }} color="#003f49" />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 950, color: '#003f49', textTransform: 'uppercase' }}>{rev}</span>
                </div>
              ))}
            </div>
          </td>
        );

        if (col.id === 'Priority') return (
          <td key={col.id} style={{ ...cellStyle }}>
            <div style={{ display: 'inline-flex', padding: '4px 14px', borderRadius: 20, background: 'rgba(0, 63, 73, 0.95)', border: '1.5px solid rgba(0, 63, 73, 0.2)', fontSize: 10, fontWeight: 950, color: 'var(--aqua)', textTransform: 'uppercase', letterSpacing: '0.08em', boxShadow: '0 4px 12px rgba(0, 63, 73, 0.2)' }}>
              {item.Priority}
            </div>
          </td>
        );

        if (col.id === 'Planned Submission Date') return (
          <td key={col.id} style={{ ...cellStyle, color: 'var(--text-dim)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(item["Planned Submission Date"] || []).map((date, i) => (
                <div key={`date-${i}`} style={{ fontSize: 10, whiteSpace: 'nowrap' }}>{formatDate(date)}</div>
              ))}
            </div>
          </td>
        );

        if (col.id === 'ACC Status') return (
          <td key={col.id} style={{ ...cellStyle }}>
             <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              {(item["ACC Status"] || []).map((status, i) => (
                <span key={`${status}-${i}`} style={{
                  fontSize: 10,
                  fontWeight: 950,
                  color: status?.toUpperCase() === 'SHARED' ? '#FF7908' : 'rgba(0, 63, 73, 0.4)',
                  letterSpacing: '0.05em'
                }}>{status.toUpperCase()}</span>
              ))}
            </div>
          </td>
        );

        if (col.id === 'Comments') return (
          <td key={col.id} style={{ ...cellStyle, color: 'var(--text-dim)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.Comments || '—'}
          </td>
        );

        if (col.id === 'Submission Category') return (
          <td key={col.id} style={{ ...cellStyle }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              {(item["Submission Category"] || []).map((cat, i) => (
                <span key={`${cat}-${i}`} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--section-bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{cat}</span>
              ))}
            </div>
          </td>
        );

        if (col.id === 'InSite Review Output ACC URL') return (
          <td key={col.id} style={{ ...cellStyle }}>
            {item["InSite Review Output ACC URL"] ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <motion.a
                  href={item["InSite Review Output ACC URL"]}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, backgroundColor: '#C5A059', color: '#000000' }}
                  style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'rgba(255, 121, 8, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#FF7908', border: '1px solid rgba(255, 121, 8, 0.3)',
                    transition: 'all 0.3s'
                  }}
                >
                  <ExternalLink size={16} />
                </motion.a>
              </div>
            ) : (
              <div style={{ opacity: 0.2 }}>—</div>
            )}
          </td>
        );

        return null;
      })}
    </motion.tr>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 900,
  color: '#000000', textTransform: 'uppercase', letterSpacing: '0.1em',
  cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
  fontFamily: 'var(--font-primary)'
};

const headerInputStyle: React.CSSProperties = {
  padding: '10px 16px', 
  borderRadius: 14,
  background: 'rgba(0, 0, 0, 0.45)', 
  border: '1.5px solid rgba(255, 255, 255, 0.2)',
  fontSize: 13, 
  color: '#FFFFFF', 
  outline: 'none',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  paddingLeft: 46,
  width: 320,
  backdropFilter: 'blur(12px)',
  boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.2)'
};

export default function BIMReviewsTable({
  data,
  isLoading,
  search,
  setSearch,
  filterStage,
  setFilterStage,
  filterStatus,
  setFilterStatus,
  filterStakeholder,
  setFilterStakeholder,
  filterReviewer,
  setFilterReviewer,
  filterPrecinct,
  setFilterPrecinct,
  availableStages = [],
  availableStatuses = [],
  availableStakeholders = [],
  availableReviewers = [],
  availablePrecincts = [],
  onEdit,
  onDelete,
  onNew,
  onImport,
  members = []
}: {
  data: BIMReview[];
  isLoading: boolean;
  search: string;
  setSearch: (v: string) => void;
  filterStage: string[];
  setFilterStage: (v: string[]) => void;
  availableStages: string[];
  filterStatus: string[];
  setFilterStatus: (v: string[]) => void;
  availableStatuses: string[];
  filterStakeholder: string[];
  setFilterStakeholder: (v: string[]) => void;
  availableStakeholders: string[];
  filterReviewer: string[];
  setFilterReviewer: (v: string[]) => void;
  availableReviewers: string[];
  filterPrecinct: string[];
  setFilterPrecinct: (v: string[]) => void;
  availablePrecincts: string[];
  onEdit?: (review: BIMReview) => void;
  onDelete?: (review: BIMReview) => void;
  onNew?: () => void;
  onImport?: () => void;
  members?: TeamMember[];
}) {
  const { userProfile } = useAuth();
  const isAdminOrOwner = userProfile?.isAdmin || userProfile?.role === 'OWNER';
  const [sortField, setSortField] = useState<SortField>('Project');
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
  } = useTableColumns('bim-matrix-precinct-v2', INITIAL_COLUMNS);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      // Handle arrays
      const strA = Array.isArray(valA) ? valA.join(', ') : String(valA || '');
      const strB = Array.isArray(valB) ? valB.join(', ') : String(valB || '');
      
      const cmp = strA.localeCompare(strB);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const isAnyFilterActive = !!search ||
    (filterStage.length > 0 && !filterStage.includes('All Stages')) ||
    (filterStatus.length > 0 && !filterStatus.includes('All Statuses')) ||
    (filterStakeholder.length > 0 && !filterStakeholder.includes('All Stakeholders')) ||
    (filterReviewer.length > 0 && !filterReviewer.includes('All Reviewers')) ||
    (filterPrecinct.length > 0 && !filterPrecinct.includes('All Precincts'));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ marginTop: 0, height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <GlassCard style={{ padding: 0, overflow: 'hidden', gap: 0, height: '100%', minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%', minHeight: 0 }}>
          {/* Table Interface Header */}
          <div style={{
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            background: '#003f49',
            borderBottom: '2px solid rgba(208, 171, 130, 0.3)',
            borderRadius: '16px 16px 0 0',
            position: 'relative'
          }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', width: '100%', gap: 16 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 500 }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#FFFFFF', opacity: 0.9 }} />
            <input
              type="text"
              placeholder="Search Reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ 
                ...headerInputStyle, 
                background: 'rgba(0, 0, 0, 0.4)', 
                color: '#ffffff', 
                borderColor: 'rgba(255, 255, 255, 0.25)', 
                fontWeight: 900,
                letterSpacing: '0.02em'
              }}
            />
            <style>{`
              input::placeholder { color: rgba(255, 255, 255, 0.4) !important; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; font-size: 10px; }
              input:focus { border-color: #d0ab82 !important; box-shadow: 0 0 15px rgba(208, 171, 130, 0.15), inset 0 2px 10px rgba(0, 0, 0, 0.3) !important; }
            `}</style>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginLeft: 'auto' }}>


            <EliteDropdown
              value={filterStage}
              options={availableStages.map(s => ({ label: s, value: s }))}
              onChange={setFilterStage}
              menuLabel="Priority"
              isMulti={true}
              allLabel="All Priorities"
            />

            <EliteDropdown
              value={filterStatus}
              options={availableStatuses.map(s => ({ label: s, value: s }))}
              onChange={setFilterStatus}
              menuLabel="InSite Status"
              isMulti={true}
              allLabel="All Statuses"
            />

            <EliteDropdown
              value={filterStakeholder}
              options={availableStakeholders.map(s => ({ label: s, value: s }))}
              onChange={setFilterStakeholder}
              menuLabel="Stakeholders"
              isMulti={true}
              allLabel="All Stakeholders"
            />

            <EliteDropdown
              value={filterReviewer}
              options={availableReviewers.map(s => ({ label: s, value: s }))}
              onChange={setFilterReviewer}
              menuLabel="InSite Reviewer"
              isMulti={true}
              allLabel="All Reviewers"
            />

            <EliteDropdown
              value={filterPrecinct}
              options={availablePrecincts.map(p => ({ label: p, value: p }))}
              onChange={setFilterPrecinct}
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

            {isAnyFilterActive && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterStage([]);
                  setFilterStatus([]);
                  setFilterStakeholder([]);
                  setFilterReviewer([]);
                  setFilterPrecinct([]);
                }}
                title="Clear Filter Constraints"
                style={{
                  padding: '10px 18px',
                  borderRadius: 14,
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#fca5a5',
                  border: '1.5px solid rgba(239, 68, 68, 0.4)',
                  fontSize: 11,
                  fontWeight: 950,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'all 0.3s ease'
                }}
                className="hover:bg-[rgba(239,68,68,0.25)] hover:scale-105"
              >
                <RefreshCw size={14} />
                Reset Filters
              </button>
            )}

            {isCustomized && (
              <button
                onClick={resetSettings}
                title="Restore Matrix Default"
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: 'rgba(255, 76, 79, 0.1)',
                  color: '#FF4C4F',
                  border: '1px solid rgba(255, 76, 79, 0.2)',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s'
                }}
              >
                <ArrowUpDown size={14} />
                Reset Layout
              </button>
            )}
          </div>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'auto', paddingBottom: 4, position: 'relative', overscrollBehavior: 'contain' }} className="elite-scrollbar">
          <style>{`
            .elite-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
            .elite-scrollbar::-webkit-scrollbar-track { background: rgba(0, 63, 73, 0.05); border-radius: 10px; }
            .elite-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 63, 73, 0.35); border-radius: 10px; }
            .elite-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 63, 73, 0.6); }
            
            .elite-column-dividers th:not(:last-child) { position: relative; }
            .elite-column-dividers th:not(:last-child)::after {
              content: '';
              position: absolute;
              right: 0;
              top: 25%;
              bottom: 25%;
              width: 1px;
              background: rgba(0, 0, 0, 0.2);
            }
            .elite-column-dividers td:not(:last-child) { border-right: 1px solid rgba(198, 224, 224, 0.12) !important; }
          `}</style>

          <table className="elite-column-dividers" style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              {visibleColumns.map((col, index) => {
                const w = col.width || INITIAL_COLUMNS.find(c => c.id === col.id)?.defaultWidth || 150;
                return (
                  <col key={col.id} style={{ width: w }} />
                );
              })}
            </colgroup>
            <thead>
              <tr style={{ background: 'var(--section-bg)', borderBottom: '1px solid var(--border)' }}>
                {visibleColumns.map((col) => (
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
                      e.currentTarget.style.background = 'var(--background)';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.background = 'var(--background)';
                      const sourceId = e.dataTransfer.getData('text/plain');
                      if (sourceId && sourceId !== col.id) {
                        reorderColumn(sourceId, col.id);
                      }
                    }}
                    style={{ ...thStyle, textAlign: 'center', position: 'sticky', top: 0, zIndex: 100, background: 'var(--accent)', borderBottom: '1px solid rgba(0,0,0,0.1)', transition: 'background 0.2s', overflow: 'hidden' }}
                  >
                    <div onClick={() => toggleSort(col.field)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', overflow: 'hidden' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#003f49', fontSize: 14.5, fontWeight: 950, letterSpacing: '0.02em', textShadow: '0 1px 2px rgba(255,255,255,0.4)' }}>{col.label}</span>
                      <ArrowUpDown size={14} style={{ color: '#003f49', opacity: sortField === col.field ? 1 : 0.6, flexShrink: 0 }} />
                    </div>
                    <ResizeHandle columnWidth={col.width || 120} onWidthChange={(w) => updateColumnWidth(col.id, w)} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, i) => (
                <ReviewRow
                  key={item.ID || `bim-row-${i}`}
                  item={item}
                  index={i}
                  visibleColumns={visibleColumns}
                  isCustomized={isCustomized}
                  isAdminOrOwner={isAdminOrOwner}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  members={members}
                />
              ))}
            </tbody>
          </table>

          {sortedData.length === 0 && (
            <div style={{
              padding: '60px 40px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 20,
                background: 'var(--secondary)',
                border: '1px solid rgba(0, 63, 73, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <Layers size={30} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className="brand-heading" style={{ fontSize: 16, color: 'var(--primary)', margin: 0 }}>NO MATRIX DATA DETECTED</h3>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>The secure repository contains no records for the current criteria.</p>
            </div>
          )}
        </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
