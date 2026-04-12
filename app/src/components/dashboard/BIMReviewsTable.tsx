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
  AlertCircle
} from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import EliteDropdown from '@/components/dashboard/EliteDropdown';
import { BIMReview } from '@/lib/types';
import { useTableColumns, ColumnDef } from '@/hooks/useTableColumns';
import ColumnSettingsDropdown from '@/components/dashboard/ColumnSettingsDropdown';

type SortField = keyof BIMReview;
type SortDir = 'asc' | 'desc';

const INITIAL_COLUMNS: ColumnDef<SortField>[] = [
  { id: 'project', field: 'project', label: 'Project Identifier', align: 'center', priority: 'high', defaultWidth: 260, alwaysVisible: true },
  { id: 'submissionDescription', field: 'submissionDescription', label: 'Submission Description', align: 'center', priority: 'high', defaultWidth: 280 },
  { id: 'reviewNumber', field: 'reviewNumber', label: 'Rev #', align: 'center', priority: 'medium', defaultWidth: 100 },
  { id: 'designStage', field: 'designStage', label: 'Stage', align: 'center', priority: 'high', defaultWidth: 140 },
  { id: 'stakeholder', field: 'stakeholder', label: 'Stakeholder', align: 'center', priority: 'medium', defaultWidth: 180 },
  { id: 'insiteBimReviewStatus', field: 'insiteBimReviewStatus', label: 'InSite Review Status', align: 'center', priority: 'high', defaultWidth: 240 },
  { id: 'insiteReviewDueDate', field: 'insiteReviewDueDate', label: 'Due Date', align: 'center', priority: 'medium', defaultWidth: 160 },
  { id: 'insiteReviewer', field: 'insiteReviewer', label: 'Lead Reviewer', align: 'center', priority: 'medium', defaultWidth: 200 },
  { id: 'modonHillFinalReviewStatus', field: 'modonHillFinalReviewStatus', label: 'Modon Status', align: 'center', priority: 'low', defaultWidth: 200 },
  { id: 'submissionDate', field: 'submissionDate', label: 'Submission Date', align: 'center', priority: 'low', defaultWidth: 200 },
  { id: 'onAcc', field: 'onAcc', label: 'ACC', align: 'center', priority: 'low', defaultWidth: 120 },
  { id: 'comments', field: 'comments', label: 'Internal Comments', align: 'center', priority: 'low', defaultWidth: 280 },
  { id: 'submissionCategory', field: 'submissionCategory', label: 'Category', align: 'center', priority: 'low', defaultWidth: 180 },
  { id: 'output', field: 'insiteReviewOutputUrl', label: 'Output Hub', align: 'center', priority: 'high', defaultWidth: 120 }
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
          width: isDragging ? 3 : 2, 
          height: isDragging ? '100%' : '60%', 
          background: isDragging ? '#d4af37' : 'transparent', 
          borderRadius: 4,
          boxShadow: isDragging ? '0 0 12px rgba(212, 175, 55, 0.6)' : 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
        }} 
        className={!isDragging ? "group-hover:bg-[rgba(212,175,55,0.6)] group-hover:h-[80%]" : ""}
      />
    </div>
  );
}

function ReviewRow({ 
  item, 
  index, 
  visibleColumns, 
  isCustomized 
}: { 
  item: BIMReview; 
  index: number; 
  visibleColumns: ColumnDef<SortField>[]; 
  isCustomized: boolean; 
}) {
  const formatTextWithLinks = (text: string) => {
    if (!text) return text;
    const parts = text.split(/(\(https?:\/\/[^)]+\))/g);
    return parts.map((part, i) => {
      if (part.startsWith('(http')) {
        const url = part.slice(1, -1);
        return (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#D4AF37', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 4 }} className="hover:underline">
            <LinkIcon size={12} />
          </a>
        );
      }
      return part;
    });
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s.includes('WITH EGIS') || s.includes('IN REVIEW')) return '#f59e0b';
    if (s.includes('APPROVED') || s.includes('SHARED') || s.includes('COMPLETED')) return '#10b981';
    if (s.includes('REJECTED') || s.includes('HOLD')) return '#ef4444';
    return 'rgba(255,255,255,0.4)';
  };

  return (
    <motion.tr
      key={item.id || `row-${index}`}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.01, duration: 0.15 }}
      style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'background 200ms' }}
      className="hover:bg-[rgba(255,255,255,0.02)]"
    >
      {visibleColumns.map(col => {
        const cellStyle: React.CSSProperties = { 
          padding: '12px 20px', 
          textAlign: (col.align as any) || 'left', 
          verticalAlign: 'middle',
          fontSize: 12,
          fontWeight: 500,
          color: 'rgba(255,255,255,0.7)'
        };

        if (col.id === 'project') return (
          <td key={col.id} style={{ ...cellStyle, color: 'white', fontWeight: 800 }}>
            {formatTextWithLinks(item.project)}
          </td>
        );

        if (col.id === 'submissionDescription') return (
          <td key={col.id} style={{ ...cellStyle, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
            {item.submissionDescription}
          </td>
        );

        if (col.id === 'reviewNumber') return (
          <td key={col.id} style={{ ...cellStyle }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>
              <Hash size={10} /> {item.reviewNumber || '—'}
            </div>
          </td>
        );

        if (col.id === 'designStage') return (
          <td key={col.id} style={{ ...cellStyle }}>
            <div style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 6, background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.2)', fontSize: 11, fontWeight: 800, color: '#D4AF37', textTransform: 'uppercase' }}>
              {item.designStage}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: getStatusColor(item.insiteBimReviewStatus) }} />
              <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{(item.insiteBimReviewStatus || 'PENDING').toUpperCase()}</span>
            </div>
          </td>
        );

        if (col.id === 'insiteReviewDueDate') return (
          <td key={col.id} style={{ ...cellStyle, color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Clock size={12} /> {item.insiteReviewDueDate || '—'}
            </div>
          </td>
        );

        if (col.id === 'insiteReviewer') return (
          <td key={col.id} style={{ ...cellStyle }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
               <User size={12} color="rgba(255,255,255,0.4)" />
               <span style={{ fontSize: 12 }}>{item.insiteReviewer || '—'}</span>
            </div>
          </td>
        );

        if (col.id === 'modonHillFinalReviewStatus') return (
          <td key={col.id} style={{ ...cellStyle }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, fontWeight: 700 }}>
              {item.modonHillFinalReviewStatus || 'AWAITING'}
            </div>
          </td>
        );

        if (col.id === 'submissionDate') return (
          <td key={col.id} style={{ ...cellStyle, color: 'rgba(255,255,255,0.4)' }}>
            {item.submissionDate || '—'}
          </td>
        );

        if (col.id === 'onAcc') return (
          <td key={col.id} style={{ ...cellStyle }}>
             <span style={{ fontWeight: 900, color: item.onAcc === 'SHARED' ? '#10b981' : 'rgba(255,255,255,0.15)' }}>{item.onAcc}</span>
          </td>
        );

        if (col.id === 'comments') return (
          <td key={col.id} style={{ ...cellStyle, color: 'rgba(255,255,255,0.5)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.comments || '—'}
          </td>
        );

        if (col.id === 'submissionCategory') return (
          <td key={col.id} style={{ ...cellStyle }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              {(item.submissionCategory || []).map(cat => (
                <span key={cat} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>{cat}</span>
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
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(212, 175, 55, 0.2)' }}
                  style={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: 8, 
                    background: 'rgba(212, 175, 55, 0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#D4AF37', 
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                    textDecoration: 'none',
                    position: 'relative',
                    overflow: 'visible'
                  }}
                  className="group"
                >
                  <ExternalLink size={14} />
                  
                  {/* Ultra Professional Link Tooltip */}
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%) translateY(-10px)',
                    padding: '8px 12px',
                    background: 'rgba(10, 10, 18, 0.95)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: 8,
                    fontSize: 10,
                    fontWeight: 800,
                    color: 'white',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    opacity: 0,
                    pointerEvents: 'none',
                    transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    zIndex: 1000
                  }} className="group-hover:opacity-100 group-hover:translate-y-[-14px]">
                    <span style={{ color: '#D4AF37', letterSpacing: '0.1em' }}>OUTPUT HUB</span>
                    <span style={{ opacity: 0.5, fontWeight: 400, fontSize: 9 }}>OPEN REPOSITORY</span>
                    
                    {/* Tooltip Arrow */}
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      marginLeft: -4,
                      borderWidth: 4,
                      borderStyle: 'solid',
                      borderColor: 'rgba(212, 175, 55, 0.3) transparent transparent transparent'
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
  color: '#c9a227', textTransform: 'uppercase', letterSpacing: '0.12em',
  cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
};

const headerInputStyle: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10,
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212, 175, 55, 0.1)',
  fontSize: 13, color: 'white', outline: 'none',
  transition: 'all 0.2s ease',
  paddingLeft: 38,
  width: 240
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
  filterReviewer,
  setFilterReviewer,
  availableReviewers = []
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
}) {
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
  } = useTableColumns('bim-matrix-v4', INITIAL_COLUMNS);

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
    (filterReviewer.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Table Interface Header */}
      <div style={{ 
        padding: '14px 20px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: 16,
        position: 'relative',
        zIndex: 500,
        background: 'rgba(255,255,255,0.01)',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: 20,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
            <ShieldCheck size={18} />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.02em', color: 'rgba(255,255,255,0.9)' }}>Matrix Hub</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginLeft: 'auto' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(212, 175, 55, 0.4)' }} />
            <input
              type="text"
              placeholder="Query Hub..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={headerInputStyle}
            />
          </div>

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
                setFilterReviewer([]);
              }}
              title="Clear Filter Constraints"
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.2)',
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
                background: 'rgba(212, 175, 55, 0.05)',
                color: '#D4AF37',
                border: '1px solid rgba(212, 175, 55, 0.1)',
                fontSize: 11,
                fontWeight: 700,
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

      <GlassCard padding="none">
        <div style={{ maxHeight: 'calc(100vh - 380px)', overflowY: 'auto', overflowX: 'auto', paddingBottom: 4, position: 'relative' }} className="elite-scrollbar">
          <style>{`
            .elite-scrollbar::-webkit-scrollbar { height: 6px; }
            .elite-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; }
            .elite-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.2); border-radius: 10px; border: 1px solid rgba(212, 175, 55, 0.1); }
            .elite-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212, 175, 55, 0.4); }
            
            .elite-column-dividers th:not(:last-child) { position: relative; }
            .elite-column-dividers th:not(:last-child)::after {
              content: '';
              position: absolute;
              right: 0;
              top: 15%;
              bottom: 15%;
              width: 1px;
              background: linear-gradient(to bottom, rgba(212, 175, 55, 0), rgba(212, 175, 55, 0.5), rgba(212, 175, 55, 0));
              box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
            }
            .elite-column-dividers td:not(:last-child) { border-right: 1px solid rgba(212, 175, 55, 0.06) !important; }
          `}</style>
          
          <table className="elite-column-dividers" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 'max-content' }}>
            <colgroup>
              {visibleColumns.map(col => (
                <col key={col.id} style={{ width: col.width || INITIAL_COLUMNS.find(c => c.id === col.id)?.defaultWidth || 150 }} />
              ))}
            </colgroup>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
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
                      e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(15, 15, 20, 0.95)';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.background = 'rgba(15, 15, 20, 0.95)';
                      const sourceId = e.dataTransfer.getData('text/plain');
                      if (sourceId && sourceId !== col.id) {
                        reorderColumn(sourceId, col.id);
                      }
                    }}
                    style={{ ...thStyle, textAlign: 'center', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15, 15, 20, 0.95)', backdropFilter: 'blur(16px)', transition: 'background 0.2s' }}
                  >
                    <div onClick={() => toggleSort(col.field)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}>
                      <span style={{ whiteSpace: 'nowrap' }}>{col.label}</span>
                      <ArrowUpDown size={10} style={{ color: sortField === col.field ? '#3b82f6' : 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                    </div>
                    <ResizeHandle columnWidth={col.width || 120} onWidthChange={(w) => updateColumnWidth(col.id, w)} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, i) => (
                <ReviewRow 
                  key={item.id} 
                  item={item} 
                  index={i} 
                  visibleColumns={visibleColumns}
                  isCustomized={isCustomized}
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
                background: 'rgba(212, 175, 55, 0.05)', 
                border: '1px solid rgba(212, 175, 55, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <Layers size={30} style={{ color: 'rgba(212, 175, 55, 0.4)' }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.4)', margin: 0 }}>NO MATRIX DATA DETECTED</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', marginTop: 8 }}>The secure repository contains no records for the current criteria.</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
