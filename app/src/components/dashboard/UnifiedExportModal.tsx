'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Calendar, Check, Database, Building2, Download,
  Table, FileText, Loader2, Sparkles, AlertCircle, RefreshCw,
  ExternalLink, BarChart3, Zap, Shield, CheckSquare, Square
} from 'lucide-react';
import { Task, ProjectMetadata, BIMReview } from '@/lib/types';
import GlassCard from '@/components/shared/GlassCard';
import EliteDropdown from './EliteDropdown';
import { getDynamicExportColumns, getBimExportColumns } from '@/lib/exportUtils';

// ─── Types ──────────────────────────────────────────────────────────────

export interface UnifiedExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    type: 'pdf' | 'excel',
    perspective: 'table' | 'dashboard' | 'both',
    onProgress: (p: number) => void,
    filters?: { types: string[], cdes: string[], precincts?: string[] },
    selectedColumns?: string[]
  ) => Promise<{ blob: Blob, filename: string }>;
  format: 'pdf' | 'excel';
  reportType: 'DELIVERABLES' | 'BIM_REVIEWS';

  // Tasks data (Deliverables)
  tasks?: Task[];
  // BIM data
  bimReviews?: BIMReview[];
  projectMetadata: ProjectMetadata | undefined;
  dateRangeText?: string;

  // Date controls
  filterMode: 'monthly' | 'custom' | 'all';
  setFilterMode: (mode: 'monthly' | 'custom' | 'all') => void;
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  yearOptions: { label: string, value: number }[];
  selectedMonth: number;
  setSelectedMonth: (m: number) => void;
  monthOptions: { label: string, value: number }[];
  startDate: string;
  setStartDate: (s: string) => void;
  endDate: string;
  setEndDate: (s: string) => void;

  // Deliverables filters
  filterDept?: string[];
  setFilterDept?: (val: string[]) => void;
  availableDepts?: string[];
  filterType?: string[];
  setFilterType?: (val: string[]) => void;
  availableTypes?: string[];
  filterCDE?: string[];
  setFilterCDE?: (val: string[]) => void;
  availableCDEs?: string[];
  filterPrecinct?: string[];
  setFilterPrecinct?: (val: string[]) => void;
  availablePrecincts?: string[];

  // BIM filters
  filterStage?: string[];
  setFilterStage?: (val: string[]) => void;
  availableStages?: string[];
  filterStatus?: string[];
  setFilterStatus?: (val: string[]) => void;
  availableStatuses?: string[];
  filterStakeholder?: string[];
  setFilterStakeholder?: (val: string[]) => void;
  availableStakeholders?: string[];
  filterReviewer?: string[];
  setFilterReviewer?: (val: string[]) => void;
  availableReviewers?: string[];
  
  // Registries
  departments?: any[];
  members?: any[];
}

// ─── Styles ─────────────────────────────────────────────────────────────

const GOLD = '#d0ab82';
const TEAL = '#003f49';

const sectionLabel: React.CSSProperties = {
  fontSize: 13, fontWeight: 1000, color: TEAL,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 900, color: 'rgba(0, 63, 73, 0.8)',
  textTransform: 'uppercase', letterSpacing: '0.05em',
  marginBottom: 6
};

// ─── Component ──────────────────────────────────────────────────────────

export default function UnifiedExportModal(props: UnifiedExportModalProps) {
  const {
    isOpen, onClose, onConfirm, format, reportType,
    tasks = [], bimReviews = [], projectMetadata, dateRangeText,
    filterMode, setFilterMode, selectedYear, setSelectedYear, yearOptions,
    selectedMonth, setSelectedMonth, monthOptions,
    startDate, setStartDate, endDate, setEndDate,
    // Deliverables
    filterDept = [], setFilterDept, availableDepts = [],
    filterType = [], setFilterType, availableTypes = [],
    filterCDE = [], setFilterCDE, availableCDEs = [],
    filterPrecinct = [], setFilterPrecinct, availablePrecincts = [],
    // BIM
    filterStage = [], setFilterStage, availableStages = [],
    filterStatus = [], setFilterStatus, availableStatuses = [],
    filterStakeholder = [], setFilterStakeholder, availableStakeholders = [],
    filterReviewer = [], setFilterReviewer, availableReviewers = [],
    departments = [], members = []
  } = props;
  
  // Dynamic extraction from data to ensure filters only show existing values
  const effectiveAvailableOptions = useMemo(() => {
    if (reportType === 'DELIVERABLES') {
      const depts = new Set<string>();
      const types = new Set<string>();
      const cdes = new Set<string>();
      const precincts = new Set<string>();
      
      tasks.forEach(t => {
        // Resolve Dept Name
        const d = departments.find(sd => sd.id === t.department || sd.name === t.department);
        const resolvedName = d ? d.name : (t.department || 'General');
        depts.add(resolvedName);

        if (t.deliverableType) (Array.isArray(t.deliverableType) ? t.deliverableType : [t.deliverableType]).forEach(x => types.add(x));
        if (t.cde) (Array.isArray(t.cde) ? t.cde : [t.cde]).forEach(x => cdes.add(x));
        if (t.precinct) precincts.add(t.precinct);
      });
      
      return {
        depts: Array.from(depts).sort(),
        types: Array.from(types).sort(),
        cdes: Array.from(cdes).sort(),
        precincts: Array.from(precincts).sort()
      };
    } else {
      const stages = new Set<string>();
      const statuses = new Set<string>();
      const stakeholders = new Set<string>();
      const reviewers = new Set<string>();
      
      bimReviews.forEach(r => {
        if (r.Priority) stages.add(r.Priority);
        if (r["InSite Review Status"]) statuses.add(r["InSite Review Status"]);
        if (r.Stakeholder) stakeholders.add(r.Stakeholder);
        (r["InSite Reviewer"] || []).forEach(x => reviewers.add(x));
      });
      
      return {
        stages: Array.from(stages).sort(),
        statuses: Array.from(statuses).sort(),
        stakeholders: Array.from(stakeholders).sort(),
        reviewers: Array.from(reviewers).sort()
      };
    }
  }, [reportType, tasks, bimReviews, departments]);
  
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [perspective, setPerspective] = useState<'table' | 'dashboard' | 'both'>('table');
  const [generatedFile, setGeneratedFile] = useState<{ url: string, name: string } | null>(null);

  // Column selection state
  const [columnSelections, setColumnSelections] = useState<Record<string, boolean>>({});

  const allColumns = useMemo(() => {
    const excluded = projectMetadata?.reportExcludedFields || [];
    if (reportType === 'BIM_REVIEWS') {
      return getBimExportColumns(excluded, format);
    }
    return getDynamicExportColumns(excluded, format);
  }, [reportType, format, projectMetadata]);

  // Initialize column selections when modal opens
  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, boolean> = {};
      allColumns.forEach(c => { initial[c.id] = c.visible !== false; });
      setColumnSelections(initial);
      setStatus('idle');
      setProgress(0);
      setGeneratedFile(null);
      setPerspective('table');
    }
  }, [isOpen, allColumns]);

  const selectedColumnIds = useMemo(() =>
    Object.entries(columnSelections).filter(([, v]) => v).map(([k]) => k),
    [columnSelections]
  );

  const selectedCount = selectedColumnIds.length;
  const totalCount = allColumns.length;

  const toggleColumn = (colId: string) => {
    setColumnSelections(prev => ({ ...prev, [colId]: !prev[colId] }));
  };

  const selectAllColumns = () => {
    const all: Record<string, boolean> = {};
    allColumns.forEach(c => { all[c.id] = true; });
    setColumnSelections(all);
  };

  const deselectAllColumns = () => {
    const none: Record<string, boolean> = {};
    allColumns.forEach(c => { none[c.id] = false; });
    setColumnSelections(none);
  };

  const recordCount = reportType === 'BIM_REVIEWS' ? bimReviews.length : tasks.length;
  const reportLabel = reportType === 'BIM_REVIEWS' ? 'BIM Review Matrix' : 'Deliverables Registry';

  // ── Generation Flow ──
  const startGeneration = async () => {
    setStatus('generating');
    setProgress(0);

    try {
      await new Promise(r => setTimeout(r, 300));

      const filters = reportType === 'DELIVERABLES' ? {
        types: filterType.filter(t => t !== 'All Types'),
        cdes: filterCDE.filter(c => c !== 'All Environments'),
        precincts: filterPrecinct.filter(p => p !== 'All Precincts')
      } : undefined;

      const result = await onConfirm(
        format, perspective,
        (p) => setProgress(p),
        filters,
        selectedColumnIds
      );

      const url = URL.createObjectURL(result.blob);
      setGeneratedFile({ url, name: result.filename });
      setProgress(100);
      setTimeout(() => setStatus('success'), 500);

      // Auto download
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error('Export generation error:', err);
      setStatus('error');
    }
  };

  const handleClose = () => {
    if (status === 'generating') return;
    onClose();
    setTimeout(() => {
      setStatus('idle');
      setProgress(0);
      if (generatedFile) URL.revokeObjectURL(generatedFile.url);
      setGeneratedFile(null);
    }, 300);
  };

  // Body scroll lock
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Portal mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  if (!isOpen || !mounted) return null;

  // ── RENDER ──
  return createPortal(
    <AnimatePresence>
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
          background: 'rgba(0, 63, 73, 0.45)',
          backdropFilter: 'blur(24px)',
        }}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 30 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          style={{
            width: '100%', maxWidth: (status === 'success' || status === 'error' || status === 'generating') ? 640 : 1100,
            maxHeight: 'calc(100vh - 64px)',
            background: '#FFFFFF',
            borderRadius: 32,
            border: `2px solid ${GOLD}`,
            boxShadow: `0 50px 150px rgba(0, 63, 73, 0.25), 0 0 0 1px rgba(208, 171, 130, 0.2)`,
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            transition: 'max-width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
        >

          {/* ══════════ HEADER ══════════ */}
          <div style={{
            padding: '18px 28px',
            background: 'linear-gradient(135deg, rgba(0, 63, 73, 0.06) 0%, rgba(208, 171, 130, 0.08) 100%)',
            borderBottom: `1px solid rgba(0, 63, 73, 0.1)`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 14,
                background: format === 'pdf' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                border: `1.5px solid ${format === 'pdf' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {format === 'pdf' ? <FileText color="#ef4444" size={20} /> : <Table color="#10b981" size={20} />}
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 1000, color: TEAL, margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {status === 'generating' ? 'Generating Report' : status === 'success' ? 'Export Complete' : 'Export Configuration'}
                </h2>
                <p style={{
                  fontSize: 13, margin: '6px 0 0 0', fontWeight: 1000,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: '#b8944e', // Deep Golden Brown for high contrast
                  display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(184, 148, 78, 0.15)', borderRadius: 6, color: '#916d2e', marginRight: 4 }}>
                    {reportLabel}
                  </span>
                  <span style={{ color: 'rgba(0, 63, 73, 0.4)', fontWeight: 400 }}>•</span>
                  <span>{format.toUpperCase()} OUTPUT</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={status === 'generating'}
              style={{
                width: 36, height: 36, borderRadius: 12,
                background: 'rgba(0, 63, 73, 0.05)',
                border: '1px solid rgba(0, 63, 73, 0.12)',
                color: TEAL, cursor: status === 'generating' ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* ══════════ BODY ══════════ */}
          <div style={{ flex: 1, overflow: 'hidden' }} className="elite-scrollbar">
            <AnimatePresence mode="wait">

              {/* ── IDLE CONFIG STATE ── */}
              {status === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ display: 'grid', gridTemplateColumns: '340px 1fr', height: '100%' }}
                >

                  {/* ── LEFT SIDEBAR ── */}
                  <div style={{
                    padding: '24px 20px',
                    background: 'rgba(0, 63, 73, 0.03)',
                    borderRight: '1px solid rgba(0, 63, 73, 0.1)',
                    display: 'flex', flexDirection: 'column', gap: 24,
                    overflowY: 'auto',
                    overflowX: 'hidden'
                  }}>

                    {/* Perspective Selection */}
                    <section>
                      <div style={sectionLabel}>
                        <BarChart3 size={16} color={GOLD} strokeWidth={2.5} />
                        Report Perspective
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {[
                          { id: 'table' as const, label: reportType === 'BIM_REVIEWS' ? 'BIM Review Matrix' : 'Task Registry', icon: <Table size={18} />, desc: 'Data Table Export' },
                          { id: 'dashboard' as const, label: 'Analytics View', icon: <BarChart3 size={18} />, desc: 'Charts & KPIs' },
                          { id: 'both' as const, label: 'Consolidated Report', icon: <Zap size={18} />, desc: 'Full Executive Suite' },
                        ].map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => setPerspective(opt.id)}
                            style={{
                              padding: '14px 16px', borderRadius: 16,
                              background: perspective === opt.id ? 'rgba(208, 171, 130, 0.15)' : 'rgba(255, 255, 255, 0.8)',
                              border: `2px solid ${perspective === opt.id ? GOLD : 'rgba(0, 63, 73, 0.1)'}`,
                              display: 'flex', alignItems: 'center', gap: 14,
                              cursor: 'pointer', transition: 'all 250ms', textAlign: 'left',
                              outline: 'none',
                              boxShadow: perspective === opt.id ? '0 4px 12px rgba(208, 171, 130, 0.15)' : 'none',
                            }}
                          >
                            <div style={{ color: perspective === opt.id ? TEAL : 'rgba(0, 63, 73, 0.4)' }}>{opt.icon}</div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 1000, color: perspective === opt.id ? TEAL : 'rgba(0,63,73,0.7)' }}>{opt.label}</div>
                              <div style={{ fontSize: 11, color: 'rgba(0, 63, 73, 0.5)', fontWeight: 800 }}>{opt.desc}</div>
                            </div>
                            {perspective === opt.id && (
                              <div style={{ marginLeft: 'auto' }}>
                                <Check size={16} color={GOLD} strokeWidth={3.5} />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* Date Coverage */}
                    <section>
                      <div style={sectionLabel}>
                        <Calendar size={16} color={GOLD} strokeWidth={2.5} />
                        Data Coverage
                      </div>

                      <div style={{
                        display: 'flex',
                        background: 'rgba(0,63,73,0.05)',
                        borderRadius: 14, padding: 4,
                        border: '1.5px solid rgba(0,63,73,0.1)',
                        marginBottom: 16,
                      }}>
                        {(['all', 'monthly', 'custom'] as const).map(mode => (
                          <button
                            key={mode}
                            onClick={() => setFilterMode(mode)}
                            style={{
                              flex: 1, padding: '10px 4px', borderRadius: 10, border: 'none',
                              fontSize: 11, fontWeight: 1000, textTransform: 'uppercase', letterSpacing: '0.08em',
                              color: filterMode === mode ? '#FFFFFF' : TEAL,
                              background: filterMode === mode ? TEAL : 'transparent',
                              cursor: 'pointer', transition: 'all 0.3s ease',
                              opacity: 1,
                              outline: 'none',
                              boxShadow: filterMode === mode ? '0 4px 12px rgba(0, 63, 73, 0.2)' : 'none',
                            }}
                          >
                            {mode === 'all' ? 'Project Lifecycle' : mode}
                          </button>
                        ))}
                      </div>

                      {filterMode === 'monthly' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8 }}>
                          <EliteDropdown value={selectedYear} options={yearOptions} onChange={setSelectedYear} menuLabel="Select Year" fullWidth />
                          <EliteDropdown value={selectedMonth} options={monthOptions} onChange={setSelectedMonth} menuLabel="Select Month" fullWidth />
                        </div>
                      )}

                      {filterMode === 'custom' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={labelStyle}>Start Date</label>
                            <input
                              type="date" value={startDate}
                              onChange={e => setStartDate(e.target.value)}
                              style={{
                                background: '#FFFFFF', border: `1.5px solid ${GOLD}`,
                                borderRadius: 14, padding: '10px 14px', color: TEAL,
                                fontSize: 13, fontWeight: 800, outline: 'none',
                                width: '100%'
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={labelStyle}>End Date</label>
                            <input
                              type="date" value={endDate}
                              onChange={e => setEndDate(e.target.value)}
                              style={{
                                background: '#FFFFFF', border: `1.5px solid ${GOLD}`,
                                borderRadius: 14, padding: '10px 14px', color: TEAL,
                                fontSize: 13, fontWeight: 800, outline: 'none',
                                width: '100%'
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {filterMode === 'all' && (
                        <div style={{
                          padding: '14px 18px', background: 'rgba(208, 171, 130, 0.08)',
                          borderRadius: 16, border: '1.5px dashed rgba(208, 171, 130, 0.4)',
                          textAlign: 'center',
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 1000, color: '#b8944e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Full Historical Data
                          </span>
                        </div>
                      )}
                    </section>

                    {/* Filters — Contextual */}
                    <section>
                      <div style={sectionLabel}>
                        <Shield size={16} color={GOLD} strokeWidth={2.5} />
                        Filter Specifications
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {reportType === 'DELIVERABLES' ? (
                          <>
                              {setFilterDept && (
                                <EliteDropdown
                                  value={filterDept} options={(effectiveAvailableOptions?.depts || []).map(d => ({ label: d, value: d }))}
                                  onChange={setFilterDept} isMulti allLabel="All Categories" menuLabel="Categories" fullWidth
                                />
                              )}
                              {setFilterType && (
                                <EliteDropdown
                                  value={filterType} options={(effectiveAvailableOptions?.types || []).map(t => ({ label: t, value: t }))}
                                  onChange={setFilterType} isMulti allLabel="All Types" menuLabel="Deliverable Types" fullWidth
                                />
                              )}
                              {setFilterCDE && (
                                <EliteDropdown
                                  value={filterCDE} options={(effectiveAvailableOptions?.cdes || []).map(c => ({ label: c, value: c }))}
                                  onChange={setFilterCDE} isMulti allLabel="All Environments" menuLabel="CDE Environments" fullWidth
                                />
                              )}
                              {setFilterPrecinct && (
                                <EliteDropdown
                                  value={filterPrecinct} options={(effectiveAvailableOptions?.precincts || []).map(p => ({ label: p, value: p }))}
                                  onChange={setFilterPrecinct} isMulti allLabel="All Precincts" menuLabel="Precincts" fullWidth
                                />
                              )}
                          </>
                        ) : (
                          <>
                              {setFilterStage && (
                                <EliteDropdown
                                  value={filterStage} options={(availableStages.length > 0 ? availableStages : effectiveAvailableOptions?.stages || []).map(s => ({ label: s, value: s }))}
                                  onChange={setFilterStage} isMulti allLabel="All Stages" menuLabel="Design Stages" fullWidth
                                />
                              )}
                              {setFilterStatus && (
                                <EliteDropdown
                                  value={filterStatus} options={(availableStatuses.length > 0 ? availableStatuses : effectiveAvailableOptions?.statuses || []).map(s => ({ label: s, value: s }))}
                                  onChange={setFilterStatus} isMulti allLabel="All Statuses" menuLabel="Review Status" fullWidth
                                />
                              )}
                              {setFilterStakeholder && (
                                <EliteDropdown
                                  value={filterStakeholder} options={(availableStakeholders.length > 0 ? availableStakeholders : effectiveAvailableOptions?.stakeholders || []).map(s => ({ label: s, value: s }))}
                                  onChange={setFilterStakeholder} isMulti allLabel="All Stakeholders" menuLabel="Stakeholders" fullWidth
                                />
                              )}
                              {setFilterReviewer && (
                                <EliteDropdown
                                  value={filterReviewer} options={(availableReviewers.length > 0 ? availableReviewers : effectiveAvailableOptions?.reviewers || []).map(s => ({ label: s, value: s }))}
                                  onChange={setFilterReviewer} isMulti allLabel="All Reviewers" menuLabel="Reviewers" fullWidth
                                />
                              )}
                          </>
                        )}
                      </div>
                    </section>
                  </div>

                  {/* ── RIGHT MAIN CONTENT ── */}
                  <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24, overflowX: 'hidden' }}>

                    {/* Record Summary Card */}
                    <div style={{
                      padding: '20px 24px',
                      background: 'rgba(0, 63, 73, 0.04)',
                      borderRadius: 20,
                      border: '1.5px solid rgba(0, 63, 73, 0.1)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 1000, color: 'rgba(0, 63, 73, 0.6)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Active Analysis Scope</span>
                          <span style={{ fontSize: 28, fontWeight: 1000, color: TEAL, lineHeight: 1 }}>{recordCount} <span style={{ fontSize: 14, fontWeight: 900, color: GOLD }}>Records</span></span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 1000, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{dateRangeText || 'Full Time Entry'}</span>
                          <span style={{ fontSize: 11, fontWeight: 900, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mode • {filterMode}</span>
                        </div>
                        <Sparkles size={18} color={GOLD} strokeWidth={2.5} />
                      </div>
                    </div>

                    {/* Column Selection */}
                    {(perspective === 'table' || perspective === 'both') && (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                          <div style={sectionLabel}>
                            <Database size={16} color={GOLD} strokeWidth={2.5} />
                            Export Column Schema ({selectedCount}/{totalCount} Selected)
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={selectAllColumns}
                              style={{
                                fontSize: 11, fontWeight: 1000, padding: '7px 14px', borderRadius: 10,
                                background: 'rgba(16, 185, 129, 0.1)', border: '1.5px solid rgba(16, 185, 129, 0.3)',
                                color: '#059669', cursor: 'pointer', textTransform: 'uppercase',
                                letterSpacing: '0.06em', outline: 'none', transition: 'all 0.2s'
                              }}
                            >
                              Select All
                            </button>
                            <button
                              onClick={deselectAllColumns}
                              style={{
                                fontSize: 11, fontWeight: 1000, padding: '7px 14px', borderRadius: 10,
                                background: 'rgba(239, 68, 68, 0.08)', border: '1.5px solid rgba(239, 68, 68, 0.3)',
                                color: '#dc2626', cursor: 'pointer', textTransform: 'uppercase',
                                letterSpacing: '0.06em', outline: 'none', transition: 'all 0.2s'
                              }}
                            >
                              Clear All
                            </button>
                          </div>
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: 10,
                          padding: '20px',
                          background: 'rgba(0, 63, 73, 0.02)',
                          borderRadius: 24,
                          border: '1.5px solid rgba(0, 63, 73, 0.1)',
                          flex: 1,
                          overflowY: 'auto',
                          overflowX: 'hidden',
                          minHeight: 0,
                        }} className="elite-scrollbar">
                          {allColumns.map((col) => {
                            const isSelected = columnSelections[col.id] ?? true;
                            return (
                              <button
                                key={col.id}
                                onClick={() => toggleColumn(col.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 12,
                                  padding: '12px 16px', borderRadius: 14,
                                  background: isSelected ? 'rgba(0, 63, 73, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                                  border: `1.5px solid ${isSelected ? GOLD : 'rgba(0, 63, 73, 0.15)'}`,
                                  boxShadow: isSelected ? `0 4px 12px rgba(208, 171, 130, 0.1)` : 'none',
                                  cursor: 'pointer', transition: 'all 200ms',
                                  opacity: 1,
                                  textAlign: 'left', outline: 'none',
                                }}
                              >
                                <div style={{
                                  width: 20, height: 20, flexShrink: 0, borderRadius: 6,
                                  border: `2px solid ${isSelected ? GOLD : 'rgba(0,63,73,0.3)'}`,
                                  background: isSelected ? GOLD : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'all 180ms',
                                }}>
                                  {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={4.5} />}
                                </div>
                                <span style={{
                                  fontSize: 13, fontWeight: 1000, color: TEAL,
                                  textTransform: 'uppercase', letterSpacing: '0.04em',
                                  opacity: isSelected ? 1 : 0.5,
                                }}>
                                  {col.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Dashboard Notice */}
                    {perspective === 'dashboard' && (
                      <div style={{
                        padding: '20px 24px',
                        background: 'rgba(208, 171, 130, 0.08)',
                        borderRadius: 18,
                        border: '1.5px dashed rgba(208, 171, 130, 0.3)',
                        display: 'flex', alignItems: 'center', gap: 18,
                      }}>
                        <Sparkles size={22} color={GOLD} />
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 1000, color: TEAL }}>Analytics Intelligence Report</span>
                          <p style={{ fontSize: 12, color: 'rgba(0, 63, 73, 0.7)', margin: '4px 0 0 0', fontWeight: 800 }}>
                            KPI Summaries, High-Fidelity Charts & Metric Visualizations will be captured exactly as viewed.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Generate Button */}
                    <div style={{ marginTop: 'auto', paddingTop: reportType === 'DELIVERABLES' ? 8 : 12 }}>
                      <button
                        onClick={startGeneration}
                        disabled={recordCount === 0 || (perspective !== 'dashboard' && selectedCount === 0)}
                        style={{
                          width: '100%', padding: '18px',
                          borderRadius: 18, background: TEAL,
                          border: 'none', color: '#FFFFFF',
                          fontSize: 14, fontWeight: 1000, textTransform: 'uppercase',
                          letterSpacing: '0.12em', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
                          boxShadow: '0 15px 45px rgba(0, 63, 73, 0.3)',
                          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                          opacity: (recordCount === 0 || (perspective !== 'dashboard' && selectedCount === 0)) ? 0.4 : 1,
                          outline: 'none',
                        }}
                      >
                        <Download size={22} strokeWidth={2.5} />
                        Generate {format.toUpperCase()} — {recordCount} High-Fidelity Records
                      </button>
                      {selectedCount === 0 && perspective !== 'dashboard' && (
                        <p style={{ textAlign: 'center', fontSize: 12, color: '#dc2626', fontWeight: 1000, marginTop: 10 }}>
                          * Select at least one column to proceed with data export
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── GENERATING STATE ── */}
              {status === 'generating' && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  style={{
                    padding: '60px 40px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 40,
                    minHeight: 460,
                  }}
                >
                  <div style={{ position: 'relative', width: 200, height: 200 }}>
                    <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="100" cy="100" r="90" stroke="rgba(0, 63, 73, 0.06)" strokeWidth="8" fill="none" />
                      <motion.circle
                        cx="100" cy="100" r="90"
                        stroke={GOLD} strokeWidth="8" fill="none"
                        strokeLinecap="round" strokeDasharray="565"
                        initial={{ strokeDashoffset: 565 }}
                        animate={{ strokeDashoffset: 565 - (565 * progress) / 100 }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                        style={{ filter: `drop-shadow(0 0 10px rgba(208, 171, 130, 0.25))` }}
                      />
                    </svg>
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <motion.span
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ fontSize: 38, fontWeight: 950, color: TEAL, letterSpacing: '-0.02em' }}
                      >
                        {Math.round(progress)}%
                      </motion.span>
                      <span style={{ fontSize: 9, fontWeight: 950, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 2 }}>
                        Processing
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                      style={{ position: 'absolute', inset: -12, border: '1px dashed rgba(208, 171, 130, 0.2)', borderRadius: '50%' }}
                    />
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: 22, color: TEAL, margin: '0 0 10px 0', fontWeight: 1000, letterSpacing: '-0.01em' }}>
                      Compiling {reportLabel}
                    </h3>
                    <p style={{ fontSize: 14, color: TEAL, margin: 0, fontWeight: 800, opacity: 0.7 }}>
                      High-fidelity data extraction and formatting in progress
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                      <Loader2 className="animate-spin" size={14} color={GOLD} />
                      <span style={{ fontSize: 10, color: GOLD, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {progress < 30 ? 'Compiling Registry' : progress < 60 ? 'Capturing Analytics' : progress < 85 ? 'Injecting Metadata' : 'Finalizing Document'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── SUCCESS STATE ── */}
              {status === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '60px 40px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                    minHeight: 460,
                  }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
                    style={{
                      width: 90, height: 90, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 28, boxShadow: '0 0 50px rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <Check size={44} color="white" strokeWidth={3} />
                  </motion.div>

                  <h2 style={{ fontSize: 28, fontWeight: 1000, color: TEAL, margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>Export Successful</h2>
                  <p style={{ fontSize: 15, color: TEAL, maxWidth: 480, marginBottom: 36, lineHeight: 1.6, fontWeight: 800, opacity: 0.8 }}>
                    Your high-fidelity {format.toUpperCase()} report has been generated. The download should initiate automatically.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 360 }}>
                    <div style={{
                      padding: '20px', borderRadius: 18,
                      background: 'rgba(0, 63, 73, 0.04)',
                      border: '1.5px solid rgba(0, 63, 73, 0.1)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                    }}>
                      <span style={{ fontSize: 13, color: '#916d2e', fontWeight: 1000, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
                        Transmission Protocol Ready
                      </span>
                        <a
                          href={generatedFile?.url}
                          download={generatedFile?.name}
                          style={{
                            width: '100%', padding: '16px',
                            borderRadius: 14, background: TEAL,
                            border: 'none', color: '#FFFFFF',
                            fontSize: 13, fontWeight: 1000, textDecoration: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                            textTransform: 'uppercase', letterSpacing: '0.12em',
                            boxShadow: '0 12px 35px rgba(0, 63, 73, 0.3)',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <ExternalLink size={18} strokeWidth={2.5} /> Download Document
                        </a>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── ERROR STATE ── */}
              {status === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '60px 40px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                    minHeight: 460, gap: 24,
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    style={{
                      width: 80, height: 80, borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '2px solid #ef4444',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#ef4444',
                    }}
                  >
                    <AlertCircle size={38} />
                  </motion.div>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 950, color: TEAL, marginBottom: 8 }}>Generation Failed</h3>
                    <p style={{ fontSize: 13, color: 'rgba(0, 63, 73, 0.5)', fontWeight: 800, maxWidth: 380 }}>
                      An error occurred during export compilation. Please try again.
                    </p>
                  </div>
                  <button
                    onClick={() => setStatus('idle')}
                    style={{
                      padding: '14px 28px', borderRadius: 12,
                      background: 'rgba(0, 63, 73, 0.06)', color: TEAL,
                      fontSize: 12, fontWeight: 950, border: '1px solid rgba(0, 63, 73, 0.12)',
                      cursor: 'pointer', textTransform: 'uppercase',
                      display: 'flex', alignItems: 'center', gap: 8, outline: 'none',
                    }}
                  >
                    <RefreshCw size={16} /> Retry
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* ══════════ FOOTER ══════════ */}
          <div style={{
            height: 4, flexShrink: 0,
            background: `linear-gradient(90deg, ${GOLD} 0%, rgba(208, 171, 130, 0.15) 50%, ${GOLD} 100%)`,
            opacity: 0.5,
          }} />

        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
