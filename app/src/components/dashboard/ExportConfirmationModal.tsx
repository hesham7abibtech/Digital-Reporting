'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  onConfirm: (type: 'pdf' | 'excel', perspective: 'table' | 'dashboard' | 'both', onProgress: (p: number) => void) => Promise<{ blob: Blob, filename: string }>;
  format: 'pdf' | 'excel';
  tasks: Task[];
  projectMetadata: ProjectMetadata | undefined;
  dateRangeText?: string;
  // Filter states
  filterMode: 'monthly' | 'custom' | 'all';
  setFilterMode: (mode: 'monthly' | 'custom' | 'all') => void;
  filterDept: string[];
  setFilterDept: (val: string[]) => void;
  availableDepts: string[];
  // New technical filters
  filterType: string[];
  setFilterType: (val: string[]) => void;
  availableTypes: string[];
  filterCDE: string[];
  setFilterCDE: (val: string[]) => void;
  availableCDEs: string[];
  // Date states
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
  selectedYear, setSelectedYear, yearOptions,
  selectedMonth, setSelectedMonth, monthOptions,
  startDate, setStartDate, endDate, setEndDate
}: ExportConfirmationModalProps) {
  
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [generatedFile, setGeneratedFile] = useState<{ url: string, name: string } | null>(null);
  const [exportCols, setExportCols] = useState<{label: string}[]>([]);
  const [perspective, setPerspective] = useState<'table' | 'dashboard' | 'both'>('table');
  
  useEffect(() => {
    if (isOpen) {
      setExportCols(getDynamicExportColumns(projectMetadata?.reportExcludedFields || [], format));
    }
  }, [isOpen, projectMetadata, format]);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (generatedFile) URL.revokeObjectURL(generatedFile.url);
    };
  }, [generatedFile]);

  const handleToggleDept = (dept: string) => {
    if (dept === 'All Categories') { setFilterDept(['All Categories']); return; }
    let newDepts = filterDept.filter(d => d !== 'All Categories');
    if (newDepts.includes(dept)) {
      newDepts = newDepts.filter(d => d !== dept);
      if (newDepts.length === 0) newDepts = ['All Categories'];
    } else newDepts.push(dept);
    setFilterDept(newDepts);
  };

  const handleToggleType = (type: string) => {
    if (type === 'All Types') { setFilterType(['All Types']); return; }
    let newTypes = filterType.filter(t => t !== 'All Types');
    if (newTypes.includes(type)) {
      newTypes = newTypes.filter(t => t !== type);
      if (newTypes.length === 0) newTypes = ['All Types'];
    } else newTypes.push(type);
    setFilterType(newTypes);
  };

  const handleToggleCDE = (cde: string) => {
    if (cde === 'All Environments') { setFilterCDE(['All Environments']); return; }
    let newCDEs = filterCDE.filter(c => c !== 'All Environments');
    if (newCDEs.includes(cde)) {
      newCDEs = newCDEs.filter(c => c !== cde);
      if (newCDEs.length === 0) newCDEs = ['All Environments'];
    } else newCDEs.push(cde);
    setFilterCDE(newCDEs);
  };

  const startGeneration = async () => {
    setStatus('generating');
    setProgress(0);
    
    try {
      // Small delay for UI transition
      await new Promise(r => setTimeout(r, 400));
      
      const result = await onConfirm(format, perspective, (p) => setProgress(p));
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 3500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{ width: '100%', maxWidth: 720 }}
        >
          <GlassCard style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(212, 175, 55, 0.3)', boxShadow: '0 0 80px rgba(0,0,0,0.5), 0 0 40px rgba(212, 175, 55, 0.1)' }}>
            
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(212, 175, 55, 0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  width: 36, height: 36, borderRadius: 10, 
                  background: format === 'pdf' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${format === 'pdf' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                }}>
                  {format === 'pdf' ? <FileText color="#ef4444" size={18} /> : <Table color="#10b981" size={18} />}
                </div>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {status === 'generating' ? 'Synchronizing Stream' : status === 'success' ? 'Protocol Success' : 'Final Verification Protocol'}
                  </h2>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>
                    Elite {format.toUpperCase()} Generation
                  </p>
                </div>
              </div>
              <button onClick={handleClose} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 8, color: 'white', cursor: status === 'generating' ? 'not-allowed' : 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: 24, minHeight: 320, display: 'flex', flexDirection: 'column' }}>
              <AnimatePresence mode="wait">
                {status === 'idle' && (
                  <motion.div key="idle" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    
                    {/* Perspective Selection */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Sparkles size={14} color="#D4AF37" />
                        <span style={{ fontSize: 10, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Report Focus Perspective</span>
                      </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                          <button
                            onClick={() => setPerspective('table')}
                            style={{
                              padding: '12px 10px', borderRadius: 14, border: `1px solid ${perspective === 'table' ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.05)'}`,
                              background: perspective === 'table' ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none'
                            }}
                          >
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: perspective === 'table' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Table size={18} color={perspective === 'table' ? '#D4AF37' : 'rgba(255,255,255,0.4)'} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: perspective === 'table' ? 'white' : 'rgba(255,255,255,0.5)' }}>Task Registry</div>
                              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: 700 }}>Registry View</div>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => setPerspective('dashboard')}
                            style={{
                              padding: '12px 10px', borderRadius: 14, border: `1px solid ${perspective === 'dashboard' ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.05)'}`,
                              background: perspective === 'dashboard' ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none', position: 'relative'
                            }}
                          >
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: perspective === 'dashboard' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <BarChart3 size={18} color={perspective === 'dashboard' ? '#D4AF37' : 'rgba(255,255,255,0.4)'} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: perspective === 'dashboard' ? 'white' : 'rgba(255,255,255,0.5)' }}>Analytics View</div>
                              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: 700 }}>Visual Insights</div>
                            </div>
                          </button>

                          <button
                            onClick={() => setPerspective('both')}
                            style={{
                              padding: '12px 10px', borderRadius: 14, border: `1px solid ${perspective === 'both' ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.05)'}`,
                              background: perspective === 'both' ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none',
                              boxShadow: perspective === 'both' ? '0 0 20px rgba(212, 175, 55, 0.1)' : 'none'
                            }}
                          >
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: perspective === 'both' ? 'rgba(212, 175, 55, 0.3)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Zap size={18} color={perspective === 'both' ? '#D4AF37' : 'rgba(255,255,255,0.4)'} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 11, fontWeight: 900, color: perspective === 'both' ? 'white' : 'rgba(255,255,255,0.5)' }}>CONSOLIDATED</div>
                              <div style={{ fontSize: 8, color: perspective === 'both' ? '#D4AF37' : 'rgba(255,255,255,0.2)', textTransform: 'uppercase', fontWeight: 900 }}>Executive Master</div>
                            </div>
                          </button>
                        </div>
                    </div>

                    {/* Data Coverage Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Calendar size={14} color="#D4AF37" />
                          <span style={{ fontSize: 10, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Data Coverage Parameters</span>
                        </div>
                        
                        {/* Interactive Mode Switcher */}
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
                          {(['all', 'monthly', 'custom'] as const).map(mode => (
                            <button
                              key={mode}
                              onClick={() => setFilterMode(mode)}
                              style={{
                                flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none',
                                fontSize: 10, fontWeight: 800, color: filterMode === mode ? '#000' : 'rgba(255,255,255,0.4)',
                                background: filterMode === mode ? '#D4AF37' : 'transparent',
                                cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase'
                              }}
                            >
                              {mode === 'all' ? 'All Time' : mode}
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
                        
                        <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 900, textTransform: 'uppercase' }}>Active Records</span>
                            <span style={{ fontSize: 14, fontWeight: 900, color: 'white' }}>{tasks.length} Vectors</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 10, color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase' }}>{dateRangeText}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Building2 size={14} color="#D4AF37" />
                          <span style={{ fontSize: 10, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Filter Specifications</span>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {/* Categories Dropdown */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ fontSize: 10, color: '#FFFFFF', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.9 }}>Functional Category Selection</span>
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ fontSize: 10, color: '#FFFFFF', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.9 }}>Deliverable Type Protocol</span>
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ fontSize: 10, color: '#FFFFFF', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.9 }}>CDE Environment Matrix</span>
                            <EliteDropdown 
                              value={filterCDE} 
                              options={availableCDEs.map(c => ({ label: c, value: c }))} 
                              onChange={setFilterCDE} 
                              isMulti={true}
                              allLabel="All Environments"
                              menuLabel="Environment Nodes"
                              fullWidth={true}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {perspective === 'table' && (
                      <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Exported Columns Schema</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {exportCols.map((c, i) => (
                            <span key={i} style={{ fontSize: 9, fontWeight: 800, padding: '6px 10px', background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: 6, color: '#D4AF37', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                              <Database size={10} />
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

                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                      <button onClick={startGeneration} disabled={tasks.length === 0} style={{ width: 'fit-content', padding: '12px 32px', borderRadius: 12, background: '#D4AF37', border: 'none', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 8px 30px rgba(212, 175, 55, 0.2)' }}>
                        <Download size={18} />
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
                        <circle cx="110" cy="110" r="100" stroke="rgba(212, 175, 55, 0.05)" strokeWidth="8" fill="none" />
                        <motion.circle cx="110" cy="110" r="100" stroke="#D4AF37" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="628" initial={{ strokeDashoffset: 628 }} animate={{ strokeDashoffset: 628 - (628 * progress) / 100 }} transition={{ type: 'spring', bounce: 0, duration: 0.5 }} style={{ filter: 'drop-shadow(0 0 12px rgba(212, 175, 55, 0.5))' }} />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.span animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: 42, fontWeight: 950, color: 'white', letterSpacing: '-0.02em' }}>{Math.round(progress)}%</motion.span>
                        <span style={{ fontSize: 10, fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 4 }}>Processing</span>
                      </div>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', inset: -15, border: '1px dashed rgba(212, 175, 55, 0.2)', borderRadius: '50%' }} />
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ fontSize: 20, color: 'white', margin: '0 0 8px 0', fontWeight: 800 }}>Dataset Synchronization</h3>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>High-fidelity conversion in progress. Do not terminate terminal session.</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                        <Loader2 className="animate-spin" size={14} color="#D4AF37" />
                        <span style={{ fontSize: 11, color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          {progress < 30 ? 'Compiling Registry' : progress < 70 ? 'Injecting Metadata' : 'Finalizing Format'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {status === 'success' && (
                  <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }} style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(45deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, boxShadow: '0 0 40px rgba(16, 185, 129, 0.3)' }}>
                      <Check size={50} color="white" strokeWidth={3} />
                    </motion.div>
                    
                    <h2 style={{ fontSize: 28, fontWeight: 900, color: 'white', margin: '0 0 12px 0' }}>Generation Successful</h2>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', maxWidth: 400, marginBottom: 40, lineHeight: 1.6 }}>
                      The {format.toUpperCase()} dataset has been perfectly synthesized and verified. Your browser should initiate the download automatically.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 360 }}>
                      <div style={{ padding: '24px', borderRadius: 16, background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Transmission Ready</span>
                        <a href={generatedFile?.url} download={generatedFile?.name} style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#D4AF37', border: 'none', color: '#000', fontSize: 13, fontWeight: 900, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 8px 32px rgba(212, 175, 55, 0.2)' }}>
                          <ExternalLink size={16} /> START DOWNLOAD
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
            
            {/* Footer decoration */}
            <div style={{ height: 4, background: 'linear-gradient(90deg, #D4AF37 0%, rgba(212, 175, 55, 0.2) 50%, #D4AF37 100%)', opacity: 0.3 }} />
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
