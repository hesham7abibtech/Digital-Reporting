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
  Plus,
  Trash2,
  Edit2,
  Upload
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import GlassCard from '@/components/shared/GlassCard';
import EliteDropdown from '@/components/dashboard/EliteDropdown';
import { BIMReview } from '@/lib/types';
import { useTableColumns, ColumnDef } from '@/hooks/useTableColumns';
import ColumnSettingsDropdown from '@/components/dashboard/ColumnSettingsDropdown';

type SortField = keyof BIMReview;
type SortDir = 'asc' | 'desc';

const INITIAL_COLUMNS: ColumnDef<SortField>[] = [
  { id: 'project', field: 'project', label: 'Project Identifier', align: 'center', priority: 'high', defaultWidth: 260, alwaysVisible: true },
  { id: 'precinct', field: 'precinct', label: 'Precinct', align: 'center', priority: 'high', defaultWidth: 150 },
  { id: 'submissionDescription', field: 'submissionDescription', label: 'Submission Description', align: 'center', priority: 'high', defaultWidth: 280 },
  { id: 'reviewNumber', field: 'reviewNumber', label: 'Rev #', align: 'center', priority: 'medium', defaultWidth: 100 },
  { id: 'designStage', field: 'designStage', label: 'Stage', align: 'center', priority: 'high', defaultWidth: 200 },
  { id: 'stakeholder', field: 'stakeholder', label: 'Stakeholder', align: 'center', priority: 'medium', defaultWidth: 180 },
  { id: 'insiteBimReviewStatus', field: 'insiteBimReviewStatus', label: 'InSite Review Status', align: 'center', priority: 'high', defaultWidth: 240 },
  { id: 'insiteReviewDueDate', field: 'insiteReviewDueDate', label: 'Due Date', align: 'center', priority: 'medium', defaultWidth: 160 },
  { id: 'insiteReviewer', field: 'insiteReviewer', label: 'Lead Reviewer', align: 'center', priority: 'medium', defaultWidth: 200 },
  { id: 'modonHillFinalReviewStatus', field: 'modonHillFinalReviewStatus', label: 'Modon Status', align: 'center', priority: 'low', defaultWidth: 200 },
  { id: 'submissionDate', field: 'submissionDate', label: 'Submission Date', align: 'center', priority: 'low', defaultWidth: 200 },
  { id: 'onAcc', field: 'onAcc', label: 'ACC Submission Status', align: 'center', priority: 'low', defaultWidth: 160 },
  { id: 'comments', field: 'comments', label: 'Internal Comments', align: 'center', priority: 'low', defaultWidth: 280 },
  { id: 'submissionCategory', field: 'submissionCategory', label: 'Category', align: 'center', priority: 'low', defaultWidth: 180 },
  { id: 'output', field: 'insiteReviewOutputUrl', label: 'Report Links', align: 'center', priority: 'high', defaultWidth: 160 }
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
  onDelete
}: {
  item: BIMReview;
  index: number;
  visibleColumns: ColumnDef<SortField>[];
  isCustomized: boolean;
  isAdminOrOwner: boolean;
  onEdit?: (r: BIMReview) => void;
  onDelete?: (r: BIMReview) => void;
}) {
  const formatTextWithLinks = (text: string) => {
    if (!text) return text;
    const parts = text.split(/(\(https?:\/\/[^)]+\))/g);
    return parts.map((part, i) => {
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

  const getStatusColor = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s.includes('WITH EGIS') || s.includes('IN REVIEW')) return '#FF7908';
    if (s.includes('APPROVED') || s.includes('SHARED') || s.includes('COMPLETED')) return '#526136';
    if (s.includes('REJECTED') || s.includes('HOLD')) return '#FF4C4F';
    return 'var(--text-dim)';
  };

  return (
    <motion.tr
      key={item.id || `row-${index}`}
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

        if (col.id === 'project') return (
          <td key={col.id} style={{ ...cellStyle, color: 'var(--text-dim)', fontWeight: 800, fontSize: 11, letterSpacing: '0.02em' }}>
            {formatTextWithLinks(item.project)}
          </td>
        );

        if (col.id === 'precinct') return (
          <td key={col.id} style={{ ...cellStyle, color: 'var(--text-primary)', fontWeight: 800, fontSize: 11 }}>
            {item.precinct || '—'}
          </td>
        );

        if (col.id === 'submissionDescription') return (
          <td key={col.id} style={{ ...cellStyle, color: 'rgba(0, 63, 73, 0.7)', fontStyle: 'italic', fontWeight: 800 }}>
            {item.submissionDescription}
          </td>
        );

        if (col.id === 'reviewNumber') return (
          <td key={col.id} style={{ ...cellStyle }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
              borderRadius: 8, background: 'rgba(0, 63, 73, 0.05)',
              border: '1px solid rgba(0, 63, 73, 0.2)', fontSize: 11,
              fontWeight: 900, color: 'var(--teal)', boxShadow: '0 2px 8px rgba(0, 63, 73, 0.05)'
            }}>
              <Hash size={10} style={{ opacity: 0.9, color: 'var(--teal)' }} /> {item.reviewNumber || '—'}
            </div>
          </td>
        );

        if (col.id === 'designStage') return (
          <td key={col.id} style={{ ...cellStyle, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ display: 'inline-flex', padding: '4px 14px', borderRadius: 20, background: 'rgba(0, 63, 73, 0.95)', border: '1.5px solid rgba(0, 63, 73, 0.2)', fontSize: 10, fontWeight: 950, color: 'var(--aqua)', textTransform: 'uppercase', letterSpacing: '0.08em', boxShadow: '0 4px 12px rgba(0, 63, 73, 0.2)', whiteSpace: 'nowrap' }}>
                {item.designStage}
              </div>
            </div>
          </td>
        );

        if (col.id === 'stakeholder') return (
          <td key={col.id} style={{ ...cellStyle, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            {item.stakeholder}
          </td>
        );

        if (col.id === 'insiteBimReviewStatus') return (
          <td key={col.id} style={{ ...cellStyle }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: item.insiteBimReviewStatus?.toUpperCase() === 'WITH EGIS' ? '#FF7908' : getStatusColor(item.insiteBimReviewStatus),
                boxShadow: `0 0 10px ${item.insiteBimReviewStatus?.toUpperCase() === 'WITH EGIS' ? '#FF7908' : getStatusColor(item.insiteBimReviewStatus)}`
              }} />
              <span className="brand-heading" style={{
                fontSize: 11,
                color: item.insiteBimReviewStatus?.toUpperCase() === 'WITH EGIS' ? '#DB4D00' : '#003f49',
                fontWeight: 900,
                letterSpacing: '0.1em'
              }}>{(item.insiteBimReviewStatus || 'PENDING').toUpperCase()}</span>
            </div>
          </td>
        );

        if (col.id === 'insiteReviewDueDate') return (
          <td key={col.id} style={{ ...cellStyle, color: 'var(--text-dim)', fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Clock size={12} style={{ opacity: 0.6 }} /> {item.insiteReviewDueDate || '—'}
            </div>
          </td>
        );

        if (col.id === 'insiteReviewer') return (
          <td key={col.id} style={{ ...cellStyle }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <User size={12} style={{ opacity: 0.9 }} color="#003f49" />
              <span style={{ fontSize: 11, fontWeight: 900, color: '#003f49', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.insiteReviewer || '—'}</span>
            </div>
          </td>
        );

        if (col.id === 'modonHillFinalReviewStatus') return (
          <td key={col.id} style={{ ...cellStyle }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, background: 'rgba(255, 255, 255, 0.6)', border: '1.5px solid rgba(0, 63, 73, 0.15)', fontSize: 10, fontWeight: 950, color: '#003f49', textTransform: 'uppercase', letterSpacing: '0.08em', boxShadow: '0 2px 8px rgba(0, 63, 73, 0.05)' }}>
              {item.modonHillFinalReviewStatus || 'AWAITING'}
            </div>
          </td>
        );

        if (col.id === 'submissionDate') return (
          <td key={col.id} style={{ ...cellStyle, color: 'var(--text-dim)' }}>
            {item.submissionDate || '—'}
          </td>
        );

        if (col.id === 'onAcc') return (
          <td key={col.id} style={{ ...cellStyle }}>
            <span style={{
              fontSize: 11,
              fontWeight: 950,
              color: item.onAcc?.toUpperCase() === 'SHARED' ? '#FF7908' : 'rgba(198, 224, 224, 0.4)',
              textShadow: item.onAcc?.toUpperCase() === 'SHARED' ? '0 0 10px rgba(255, 121, 8, 0.3)' : 'none',
              letterSpacing: '0.05em'
            }}>
              {(item.onAcc || 'NOT SHARED').toUpperCase()}
            </span>
          </td>
        );

        if (col.id === 'comments') return (
          <td key={col.id} style={{ ...cellStyle, color: 'var(--text-dim)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.comments || '—'}
          </td>
        );

        if (col.id === 'submissionCategory') return (
          <td key={col.id} style={{ ...cellStyle }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              {(item.submissionCategory || []).map(cat => (
                <span key={cat} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--section-bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{cat}</span>
              ))}
            </div>
          </td>
        );

        if (col.id === 'output') return (
          <td key={col.id} style={{ ...cellStyle }}>
            {item.insiteReviewOutputUrl ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                <motion.a
                  href={item.insiteReviewOutputUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, backgroundColor: '#C5A059', color: '#000000', boxShadow: '0 0 25px rgba(197, 160, 89, 0.5)' }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'rgba(255, 121, 8, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FF7908',
                    border: '1px solid rgba(255, 121, 8, 0.3)',
                    textDecoration: 'none',
                    position: 'relative',
                    overflow: 'visible',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  className="group"
                >
                  <ExternalLink size={16} />

                  {/* Ultra Professional Link Tooltip */}
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    right: 0,
                    marginBottom: 12,
                    padding: '12px 16px',
                    background: 'rgba(0, 63, 73, 0.98)',
                    backdropFilter: 'blur(16px)',
                    border: '1.5px solid #d0ab82',
                    borderRadius: 14,
                    fontSize: 11,
                    fontWeight: 950,
                    color: '#FFFFFF',
                    boxShadow: '-12px 12px 40px rgba(0, 63, 73, 0.35)',
                    pointerEvents: 'none',
                    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    zIndex: 1000,
                    width: 'max-content',
                    maxWidth: 320
                  }} className="opacity-0 group-hover:opacity-100 group-hover:-translate-y-[8px]">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#d0ab82', borderBottom: '1px solid rgba(208, 171, 130, 0.2)', paddingBottom: 6, marginBottom: 2 }}>
                      <ExternalLink size={12} />
                      <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Open Review Output</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600, wordBreak: 'break-all' }}>
                      {item.insiteReviewOutputUrl}
                    </span>

                    {/* Tooltip Arrow */}
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 12,
                      borderWidth: 6,
                      borderStyle: 'solid',
                      borderColor: '#d0ab82 transparent transparent transparent'
                    }} />
                  </div>
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
  padding: '10px 16px', borderRadius: 12,
  background: 'rgba(0, 63, 73, 0.4)', border: '1px solid rgba(198, 224, 224, 0.3)',
  fontSize: 13, color: '#FFFFFF', outline: 'none',
  transition: 'all 0.2s ease',
  paddingLeft: 42,
  width: 280,
  backdropFilter: 'blur(8px)'
};

export default function BIMReviewsTable({
  data,
  isLoading,
  search,
  setSearch,
  filterStage,
  setFilterStage,
  availableStages = [],
  filterStatus,
  setFilterStatus,
  availableStatuses = [],
  filterStakeholder,
  setFilterStakeholder,
  availableStakeholders = [],
  filterPrecinct,
  setFilterPrecinct,
  availablePrecincts = [],
  filterReviewer,
  setFilterReviewer,
  availableReviewers = [],
  onEdit,
  onDelete,
  onNew,
  onImport
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
  filterPrecinct: string[];
  setFilterPrecinct: (v: string[]) => void;
  availablePrecincts: string[];
  filterReviewer: string[];
  setFilterReviewer: (v: string[]) => void;
  availableReviewers: string[];
  onEdit?: (review: BIMReview) => void;
  onDelete?: (review: BIMReview) => void;
  onNew?: () => void;
  onImport?: () => void;
}) {
  const { userProfile } = useAuth();
  const isAdminOrOwner = userProfile?.isAdmin || userProfile?.role === 'OWNER';
  const [sortField, setSortField] = useState<SortField>('project');
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
      let valA = a[sortField] as string;
      let valB = b[sortField] as string;
      const cmp = (valA || '').localeCompare(valB || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const isAnyFilterActive = search ||
    (filterStage.length > 0) ||
    (filterStatus.length > 0) ||
    (filterStakeholder.length > 0) ||
    (filterPrecinct.length > 0) ||
    (filterReviewer.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: -8 }}>
      {/* Table Interface Header */}
      <div style={{
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        position: 'relative',
        zIndex: 500,
        background: 'rgba(255, 255, 255, 0.6)',
        borderBottom: '1px solid rgba(0, 63, 73, 0.2)',
        borderRadius: '24px 24px 0 0',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', width: '100%', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#003f49' }} />
            <input
              type="text"
              placeholder="Search Reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...headerInputStyle, background: 'rgba(255, 255, 255, 0.8)', color: '#003f49', borderColor: 'rgba(0, 63, 73, 0.25)', fontWeight: 600 }}
            />
          </div>

          {isAdminOrOwner && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 20 }}>
              <div style={{ width: 1, height: 24, background: 'rgba(0, 63, 73, 0.12)' }} />
              <button
                onClick={onImport}
                title="Import Intelligence Matrix"
                style={{
                  padding: '8px 16px', borderRadius: 10, background: 'rgba(212, 175, 55, 0.1)',
                  color: '#C5A059', border: '1.5px solid rgba(212, 175, 55, 0.2)',
                  fontSize: 10, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}
              >
                <Upload size={14} /> IMPORT
              </button>
              <button
                onClick={onNew}
                title="Initiate New Matrix Record"
                style={{
                  padding: '8px 16px', borderRadius: 10, background: 'var(--teal)',
                  color: 'white', border: 'none',
                  fontSize: 10, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 4px 12px rgba(0, 63, 73, 0.2)'
                }}
              >
                <Plus size={14} /> NEW ENTRY
              </button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginLeft: 'auto' }}>


            <EliteDropdown
              value={filterStage}
              options={availableStages.map(s => ({ label: s, value: s }))}
              onChange={setFilterStage}
              menuLabel="Stages"
              isMulti={true}
              allLabel="All Stages"
            />

            <EliteDropdown
              value={filterStatus}
              options={availableStatuses.map(s => ({ label: s, value: s }))}
              onChange={setFilterStatus}
              menuLabel="Statuses"
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
              value={filterPrecinct}
              options={availablePrecincts.map(s => ({ label: s, value: s }))}
              onChange={setFilterPrecinct}
              menuLabel="Precincts"
              isMulti={true}
              allLabel="All Precincts"
            />

            <EliteDropdown
              value={filterReviewer}
              options={availableReviewers.map(s => ({ label: s, value: s }))}
              onChange={setFilterReviewer}
              menuLabel="Reviewer"
              isMulti={true}
              allLabel="All Reviewers"
            />

            <ColumnSettingsDropdown
              columns={allColumns}
              settings={settings}
              onToggle={toggleColumnVisibility}
              onReset={resetSettings}
            />

            {isAnyFilterActive && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterStage([]);
                  setFilterStatus([]);
                  setFilterStakeholder([]);
                  setFilterPrecinct([]);
                  setFilterReviewer([]);
                }}
                title="Clear Filter Constraints"
                style={{
                  padding: '8px 14px',
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
                <RefreshCw size={14} />
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
              </button>
            )}
          </div>
        </div>
      </div>

      <GlassCard padding="none">
        <div style={{ maxHeight: 'calc(100vh - 380px)', overflowY: 'auto', overflowX: 'auto', paddingBottom: 4, position: 'relative' }} className="elite-scrollbar">
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

          <table className="elite-column-dividers" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 'max-content' }}>
            <colgroup>
              {visibleColumns.map((col, index) => {
                // By omitting the width on the final column, Chromium's tableLayout: 'fixed' will natively 
                // dump all remaining pixels of the 100% container into it, destroying the gap perfectly.
                const isFinal = index === visibleColumns.length - 1;
                const w = col.width || INITIAL_COLUMNS.find(c => c.id === col.id)?.defaultWidth || 150;
                return (
                  <col key={col.id} style={{ width: isFinal ? undefined : w }} />
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
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#003f49', fontWeight: 950, letterSpacing: '0.02em', textShadow: '0 1px 2px rgba(255,255,255,0.4)' }}>{col.label}</span>
                      <ArrowUpDown size={11} style={{ color: '#003f49', opacity: sortField === col.field ? 1 : 0.6, flexShrink: 0 }} />
                    </div>
                    <ResizeHandle columnWidth={col.width || 120} onWidthChange={(w) => updateColumnWidth(col.id, w)} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, i) => (
                <ReviewRow
                  key={item.id || `bim-row-${i}`}
                  item={item}
                  index={i}
                  visibleColumns={visibleColumns}
                  isCustomized={isCustomized}
                  isAdminOrOwner={isAdminOrOwner}
                  onEdit={onEdit}
                  onDelete={onDelete}
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
      </GlassCard>
    </div>
  );
}
