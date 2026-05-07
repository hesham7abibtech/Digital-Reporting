'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Check, Database, Building2, Download, 
  Table, FileText, Loader2, Sparkles, AlertCircle, RefreshCw,
  ExternalLink, ChevronRight, BarChart3, Zap
} from 'lucide-react';
import { Task, ProjectMetadata } from '@/lib/types';
import GlassCard from '@/components/shared/GlassCard';
import EliteDropdown from './EliteDropdown';
import { getDynamicExportColumns } from '@/lib/exportUtils';

interface ExportConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    type: 'pdf' | 'excel', 
    perspective: 'table' | 'dashboard' | 'both', 
    onProgress: (p: number) => void,
    filters?: { types: string[], cdes: string[] }
  ) => Promise<{ blob: Blob, filename: string }>;
  format: 'pdf' | 'excel';
  tasks: Task[];
  projectMetadata: ProjectMetadata | undefined;
  dateRangeText?: string;
  filterMode: 'monthly' | 'custom' | 'all';
  setFilterMode: (mode: 'monthly' | 'custom' | 'all') => void;
  filterDept: string[];
  setFilterDept: (val: string[]) => void;
  availableDepts: string[];
  filterType: string[];
  setFilterType: (val: string[]) => void;
  availableTypes: string[];
  filterCDE: string[];
  setFilterCDE: (val: string[]) => void;
  availableCDEs: string[];
  filterPrecinct: string[];
  setFilterPrecinct: (val: string[]) => void;
  availablePrecincts: string[];
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
}

export default function ExportConfirmationModal({
  isOpen, onClose, onConfirm, format, tasks, projectMetadata, dateRangeText,
  filterMode, setFilterMode, filterDept, setFilterDept, availableDepts,
  filterType, setFilterType, availableTypes,
  filterCDE, setFilterCDE, availableCDEs,
  filterPrecinct, setFilterPrecinct, availablePrecincts,
  selectedYear, setSelectedYear, yearOptions,
  selectedMonth, setSelectedMonth, monthOptions,
  startDate, setStartDate, endDate, setEndDate
}: ExportConfirmationModalProps) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [perspective, setPerspective] = useState<'table' | 'dashboard' | 'both'>('table');
  const [generatedFile, setGeneratedFile] = useState<{ url: string, name: string } | null>(null);

  const exportCols = getDynamicExportColumns(projectMetadata?.reportExcludedFields || [], format);

  const startGeneration = async () => {
    setStatus('generating');
    setProgress(0);
    
    try {
      // Small delay for UI transition
      await new Promise(r => setTimeout(r, 400));
      
      const filters = {
        types: filterType.filter(t => t !== 'All Types'),
        cdes: filterCDE.filter(c => c !== 'All CDE'),
        precincts: filterPrecinct.filter(p => p !== 'All Precincts')
      };

      const result = await onConfirm(format, perspective, (p) => setProgress(p), filters);
      const url = URL.createObjectURL(result.blob);
      setGeneratedFile({ url, name: result.filename });
      
      setProgress(100);
      setTimeout(() => setStatus('success'), 600);
      
      // Auto download
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      link.click();
      
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const handleClose = () => {
    if (status === 'generating') return;
    onClose();
    // Reset after animation exit
    setTimeout(() => {
      setStatus('idle');
      setProgress(0);
      setGeneratedFile(null);
    }, 300);
  };

  // Porting Logic
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div 
        onClick={handleClose}
        style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'rgba(0, 63, 73, 0.4)', backdropFilter: 'blur(24px)', overflowY: 'auto' }}
      >
        <motion.div
           onClick={(e) => e.stopPropagation()}
           initial={{ opacity: 0, scale: 0.9, y: 30 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.9, y: 30 }}
           transition={{ type: 'spring', damping: 25, stiffness: 300 }}
           style={{ width: '100%', maxWidth: 880, maxHeight: 'calc(100vh - 120px)', background: 'rgba(255, 255, 255, 0.98)', borderRadius: 24, border: '1.5px solid #d0ab82', boxShadow: '0 30px 100px rgba(0, 63, 73, 0.15)', overflowY: 'auto', position: 'relative' }}
           className="elite-scrollbar"
        >
            <div style={{ padding: 0, overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(0, 63, 73, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 63, 73, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: 8, 
                  background: format === 'pdf' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${format === 'pdf' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                }}>
                  {format === 'pdf' ? <FileText color="#ef4444" size={18} /> : <Table color="#10b981" size={18} />}
                </div>
                <div>
                  <h2 style={{ fontSize: 13, fontWeight: 950, color: '#003f49', margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {status === 'generating' ? 'Synchronizing Stream' : status === 'success' ? 'Protocol Success' : 'Final Verification Protocol'}
                  </h2>
                  <p style={{ fontSize: 9, color: '#d0ab82', margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Elite {format.toUpperCase()} Generation
                  </p>
                </div>
              </div>
              <button onClick={handleClose} style={{ background: 'rgba(0, 63, 73, 0.05)', border: '1px solid rgba(0, 63, 73, 0.15)', borderRadius: 10, padding: 8, color: '#003f49', cursor: status === 'generating' ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '16px 24px', minHeight: 280, display: 'flex', flexDirection: 'column' }}>
              <AnimatePresence mode="wait">
                {status === 'idle' && (
                  <motion.div key="idle" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* Perspective Selection */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Sparkles size={14} color="#d0ab82" />
                        <span style={{ fontSize: 10, fontWeight: 950, color: 'rgba(0, 63, 73, 0.6)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Report Focus Perspective</span>
                      </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                          <button
                            onClick={() => setPerspective('table')}
                            style={{
                              padding: '10px 8px', borderRadius: 12, border: `1.5px solid ${perspective === 'table' ? '#d0ab82' : 'rgba(0, 63, 73, 0.12)'}`,
                              background: perspective === 'table' ? 'rgba(208, 171, 130, 0.12)' : 'rgba(0, 63, 73, 0.03)',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none'
                            }}
                          >
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: perspective === 'table' ? 'rgba(0, 63, 73, 0.12)' : 'rgba(0, 63, 73, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Table size={16} color={perspective === 'table' ? '#003f49' : 'rgba(0, 63, 73, 0.4)'} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 10, fontWeight: 950, color: perspective === 'table' ? '#003f49' : 'rgba(0, 63, 73, 0.5)' }}>Task Registry</div>
                              <div style={{ fontSize: 7, color: 'rgba(0, 63, 73, 0.4)', textTransform: 'uppercase', fontWeight: 900 }}>Registry View</div>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => setPerspective('dashboard')}
                            style={{
                              padding: '10px 8px', borderRadius: 12, border: `1.5px solid ${perspective === 'dashboard' ? '#d0ab82' : 'rgba(0, 63, 73, 0.12)'}`,
                              background: perspective === 'dashboard' ? 'rgba(208, 171, 130, 0.12)' : 'rgba(0, 63, 73, 0.03)',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none', position: 'relative'
                            }}
                          >
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: perspective === 'dashboard' ? 'rgba(0, 63, 73, 0.12)' : 'rgba(0, 63, 73, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <BarChart3 size={16} color={perspective === 'dashboard' ? '#003f49' : 'rgba(0, 63, 73, 0.4)'} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 10, fontWeight: 950, color: perspective === 'dashboard' ? '#003f49' : 'rgba(0, 63, 73, 0.5)' }}>Analytics View</div>
                              <div style={{ fontSize: 7, color: 'rgba(0, 63, 73, 0.4)', textTransform: 'uppercase', fontWeight: 900 }}>Visual Insights</div>
                            </div>
                          </button>

                          <button
                            onClick={() => setPerspective('both')}
                            style={{
                              padding: '10px 8px', borderRadius: 12, border: `1.5px solid ${perspective === 'both' ? '#d0ab82' : 'rgba(0, 63, 73, 0.12)'}`,
                              background: perspective === 'both' ? 'rgba(208, 171, 130, 0.12)' : 'rgba(0, 63, 73, 0.03)',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none',
                              boxShadow: perspective === 'both' ? '0 10px 30px rgba(208, 171, 130, 0.15)' : 'none'
                            }}
                          >
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: perspective === 'both' ? 'rgba(0, 63, 73, 0.12)' : 'rgba(0, 63, 73, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Zap size={16} color={perspective === 'both' ? '#003f49' : 'rgba(0, 63, 73, 0.4)'} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 10, fontWeight: 950, color: perspective === 'both' ? '#003f49' : 'rgba(0, 63, 73, 0.5)' }}>CONSOLIDATED</div>
                              <div style={{ fontSize: 7, color: perspective === 'both' ? '#d0ab82' : 'rgba(0, 63, 73, 0.45)', textTransform: 'uppercase', fontWeight: 950 }}>Executive Master</div>
                            </div>
                          </button>
                        </div>
                    </div>

                    {/* Data Coverage Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Calendar size={12} color="#d0ab82" />
                          <span style={{ fontSize: 10, fontWeight: 950, color: 'rgba(0, 63, 73, 0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Data Coverage</span>
                        </div>
                        
                        {/* Interactive Mode Switcher */}
                        <div style={{ display: 'flex', background: 'rgba(0, 63, 73, 0.05)', borderRadius: 12, padding: 4, border: '1px solid rgba(0, 63, 73, 0.1)' }}>
                          {(['all', 'monthly', 'custom'] as const).map(mode => (
                            <button
                               key={mode}
                               onClick={() => setFilterMode(mode)}
                               style={{
                                 flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none',
                                 fontSize: 10, fontWeight: 900, color: filterMode === mode ? 'var(--aqua)' : 'var(--teal)',
                                 background: filterMode === mode ? 'var(--teal)' : 'transparent',
                                 cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase',
                                 opacity: filterMode === mode ? 1 : 0.6
                               }}
                             >
                              {mode === 'all' ? 'Project Lifecycle' : mode}
                            </button>
                          ))}
                        </div>
                        
                        <div style={{ minHeight: 60, display: 'flex', alignItems: 'center' }}>
                          {filterMode === 'monthly' && (
                            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                              <EliteDropdown value={selectedYear} options={yearOptions} onChange={setSelectedYear} menuLabel="Year" />
                              <EliteDropdown value={selectedMonth} options={monthOptions} onChange={setSelectedMonth} menuLabel="Month" />
                            </div>
                          )}

                          {filterMode === 'custom' && (
                            <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase' }}>Start</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', color: 'white', fontSize: 12, outline: 'none' }} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <label style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase' }}>End</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', color: 'white', fontSize: 12, outline: 'none' }} />
                              </div>
                            </div>
                          )}

                          {filterMode === 'all' && (
                            <div style={{ width: '100%', padding: '12px 16px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: 12, border: '1px dashed rgba(212, 175, 55, 0.2)', textAlign: 'center' }}>
                              <span style={{ fontSize: 11, fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Comprehensive Historical Capture</span>
                            </div>
                          )}
                        </div>
                        
                          <div style={{ padding: '12px 16px', background: 'rgba(0, 63, 73, 0.04)', borderRadius: 12, border: '1px solid rgba(0, 63, 73, 0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: 9, color: 'rgba(0, 63, 73, 0.6)', fontWeight: 950, textTransform: 'uppercase' }}>Active Records</span>
                              <span style={{ fontSize: 16, fontWeight: 950, color: '#003f49' }}>
                                {tasks.length} Vectors
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: 10, color: '#d0ab82', fontWeight: 950, textTransform: 'uppercase' }}>{dateRangeText}</span>
                            </div>
                          </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                           <Building2 size={12} color="#d0ab82" />
                           <span style={{ fontSize: 10, fontWeight: 950, color: 'rgba(0, 63, 73, 0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Specifications</span>
                         </div>
                         
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                           {/* Categories Dropdown */}
                           <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                             <span style={{ fontSize: 10, color: '#003f49', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.8 }}>Functional Category Selection</span>
                            <EliteDropdown 
                              value={filterDept} 
                              options={availableDepts.map(d => ({ label: d, value: d }))} 
                              onChange={setFilterDept} 
                              isMulti={true}
                              allLabel="All Categories"
                              menuLabel="Task Categories"
                              fullWidth={true}
                            />
                          </div>

                          {/* Deliverable Types Dropdown */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: 10, color: '#003f49', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.8 }}>Deliverable Type Protocol</span>
                            <EliteDropdown 
                              value={filterType} 
                              options={availableTypes.map(t => ({ label: t, value: t }))} 
                              onChange={setFilterType} 
                              isMulti={true}
                              allLabel="All Types"
                              menuLabel="Technical Types"
                              fullWidth={true}
                            />
                          </div>

                          {/* CDE Environments Dropdown */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: 10, color: '#003f49', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.8 }}>CDE Environment Matrix</span>
                            <EliteDropdown 
                              value={filterCDE} 
                              options={availableCDEs.map(c => ({ label: c, value: c }))} 
                              onChange={setFilterCDE} 
                              isMulti={true}
                              allLabel="All CDE"
                              menuLabel="CDE"
                              fullWidth={true}
                            />
                          </div>

                          {/* Precincts Dropdown */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                             <span style={{ fontSize: 10, color: '#003f49', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.8 }}>Project Precinct Grid</span>
                             <EliteDropdown 
                               value={filterPrecinct} 
                               options={availablePrecincts.map(p => ({ label: p, value: p }))} 
                               onChange={setFilterPrecinct} 
                               isMulti={true}
                               allLabel="All Precincts"
                               menuLabel="Regional Precincts"
                               fullWidth={true}
                             />
                          </div>
                        </div>
                      </div>
                    </div>

                    {perspective === 'table' && (
                      <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <span style={{ fontSize: 9, color: 'rgba(0, 63, 73, 0.5)', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Exported Columns Schema</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {exportCols.map((c: any, i: number) => (
                              <span key={i} style={{ fontSize: 9, fontWeight: 950, padding: '8px 12px', background: 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(0, 63, 73, 0.12)', borderRadius: 8, color: '#003f49', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                <Database size={10} color="#d0ab82" />
                                {c.label}
                              </span>
                            ))}
                          </div>
                      </div>
                    )}

                    {perspective === 'dashboard' && (
                      <div style={{ padding: '16px 20px', background: 'rgba(212, 175, 55, 0.03)', borderRadius: 12, border: '1px dashed rgba(212, 175, 55, 0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Sparkles size={16} color="#D4AF37" />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 11, fontWeight: 900, color: 'white' }}>Analytics Visual Report</span>
                          <span style={{ fontSize: 9, color: 'rgba(212, 175, 55, 0.6)', fontWeight: 700, textTransform: 'uppercase' }}>KPI Summaries & Metric Visualizations included</span>
                        </div>
                      </div>
                    )}

                       <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                        <button onClick={startGeneration} disabled={tasks.length === 0} style={{ width: 'fit-content', padding: '12px 32px', borderRadius: 14, background: '#003f49', border: 'none', color: '#FFFFFF', fontSize: 12, fontWeight: 950, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 10px 30px rgba(0, 63, 73, 0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          <Download size={16} color="#FFFFFF" />
                          COMMENCE {format.toUpperCase()} GENERATION
                        </button>
                      </div>
                  </motion.div>
                )}

                {status === 'generating' && (
                  <motion.div key="generating" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
                      <div style={{ position: 'relative', width: 220, height: 220 }}>
                        {/* Circular Progress SVG */}
                        <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="110" cy="110" r="100" stroke="rgba(0, 63, 73, 0.05)" strokeWidth="8" fill="none" />
                          <motion.circle cx="110" cy="110" r="100" stroke="#d0ab82" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="628" initial={{ strokeDashoffset: 628 }} animate={{ strokeDashoffset: 628 - (628 * progress) / 100 }} transition={{ type: 'spring', bounce: 0, duration: 0.5 }} style={{ filter: 'drop-shadow(0 0 12px rgba(208, 171, 130, 0.2))' }} />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <motion.span animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: 42, fontWeight: 950, color: '#003f49', letterSpacing: '-0.02em' }}>{Math.round(progress)}%</motion.span>
                          <span style={{ fontSize: 10, fontWeight: 950, color: '#d0ab82', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 4 }}>Processing</span>
                        </div>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', inset: -15, border: '1px dashed rgba(208, 171, 130, 0.2)', borderRadius: '50%' }} />
                      </div>
                      
                      <div style={{ textAlign: 'center' }}>
                        <h3 style={{ fontSize: 20, color: '#003f49', margin: '0 0 8px 0', fontWeight: 900 }}>Dataset Synchronization</h3>
                        <p style={{ fontSize: 13, color: 'rgba(0, 63, 73, 0.5)', margin: 0, fontWeight: 800 }}>High-fidelity conversion in progress. Do not terminate terminal session.</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                          <Loader2 className="animate-spin" size={14} color="#d0ab82" />
                          <span style={{ fontSize: 11, color: '#d0ab82', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {progress < 30 ? 'Compiling Registry' : progress < 70 ? 'Injecting Metadata' : 'Finalizing Format'}
                          </span>
                        </div>
                      </div>
                  </motion.div>
                )}

                {status === 'success' && (
                  <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20 }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }} style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(45deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 0 40px rgba(16, 185, 129, 0.3)' }}>
                      <Check size={50} color="white" strokeWidth={3} />
                    </motion.div>
                    
                    <h2 style={{ fontSize: 24, fontWeight: 950, color: '#003f49', margin: '0 0 10px 0' }}>Generation Successful</h2>
                    <p style={{ fontSize: 13, color: 'rgba(0, 63, 73, 0.6)', maxWidth: 400, marginBottom: 32, lineHeight: 1.6, fontWeight: 800 }}>
                      The {format.toUpperCase()} dataset has been perfectly synthesized and verified. Your browser should initiate the download automatically.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 360 }}>
                      <div style={{ padding: '20px', borderRadius: 20, background: 'rgba(0, 63, 73, 0.04)', border: '1.5px solid rgba(0, 63, 73, 0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: 10, color: '#003f49', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Transmission Ready</span>
                        <a href={generatedFile?.url} download={generatedFile?.name} style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#003f49', border: 'none', color: '#FFFFFF', fontSize: 13, fontWeight: 950, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, textTransform: 'uppercase', letterSpacing: '0.12em', boxShadow: '0 10px 30px rgba(0, 63, 73, 0.2)' }}>
                          <ExternalLink size={16} color="#FFFFFF" /> START DOWNLOAD
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
            
            {/* Footer decoration */}
            <div style={{ height: 4, background: 'linear-gradient(90deg, #d0ab82 0%, rgba(208, 171, 130, 0.2) 50%, #d0ab82 100%)', opacity: 0.6 }} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
