'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Download, Check, Shield, 
  Table, FileText, Loader2, Sparkles, AlertCircle, RefreshCw,
  ExternalLink, ChevronRight, BarChart3, Zap, Database
} from 'lucide-react';
import { BIMReview, ProjectMetadata } from '@/lib/types';
import GlassCard from '@/components/shared/GlassCard';
import EliteDropdown from './EliteDropdown';
import { getBimExportColumns } from '@/lib/exportUtils';

interface BimExportConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: 'pdf' | 'excel', perspective: 'table' | 'dashboard' | 'both', selectedColumns: string[], onProgress: (p: number) => void) => Promise<{ blob: Blob, filename: string }>;
  format: 'pdf' | 'excel';
  bimReviews: BIMReview[];
  projectMetadata: ProjectMetadata | undefined;
  dateRangeText?: string;
  
  // BIM Filters for Export
  filterStage: string[];
  setFilterStage: (val: string[]) => void;
  availableStages: string[];
  
  filterStatus: string[];
  setFilterStatus: (val: string[]) => void;
  availableStatuses: string[];
  
  filterStakeholder: string[];
  setFilterStakeholder: (val: string[]) => void;
  availableStakeholders: string[];
  
  filterReviewer: string[];
  setFilterReviewer: (val: string[]) => void;
  availableReviewers: string[];

  filterPrecinct: string[];
  setFilterPrecinct: (val: string[]) => void;
  availablePrecincts: string[];

  // Global mode and dates (for consistent range display)
  filterMode: 'monthly' | 'custom' | 'all';
  selectedYear: number;
  selectedMonth: number;
}

export default function BimExportConfirmationModal({
  isOpen, onClose, onConfirm, format, bimReviews, projectMetadata, dateRangeText,
  filterStage, setFilterStage, availableStages,
  filterStatus, setFilterStatus, availableStatuses,
  filterStakeholder, setFilterStakeholder, availableStakeholders,
  filterReviewer, setFilterReviewer, availableReviewers,
  filterPrecinct, setFilterPrecinct, availablePrecincts,
  filterMode, selectedYear, selectedMonth
}: BimExportConfirmationModalProps) {
  
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [generatedFile, setGeneratedFile] = useState<{ url: string, name: string } | null>(null);
  const [exportCols, setExportCols] = useState<{id: string, label: string, isSelected: boolean}[]>([]);
  const [perspective, setPerspective] = useState<'table' | 'dashboard' | 'both'>('table');
  
  useEffect(() => {
    if (isOpen) {
      setExportCols(getBimExportColumns([], format).map(c => ({ id: c.id, label: c.label, isSelected: true })));
    }
  }, [isOpen, format]);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (generatedFile) URL.revokeObjectURL(generatedFile.url);
    };
  }, [generatedFile]);

  const handleHandleToggle = (current: string[], set: (v: string[]) => void, val: string, all: string) => {
    if (val === all) { set([all]); return; }
    let next = current.filter(v => v !== all);
    if (next.includes(val)) {
      next = next.filter(v => v !== val);
      if (next.length === 0) next = [all];
    } else next.push(val);
    set(next);
  };

  const handleStartGeneration = async () => {
    setStatus('generating');
    setProgress(0);
    try {
      const selectedColIds = exportCols.filter(c => c.isSelected).map(c => c.id);
      const result = await onConfirm(format, perspective, selectedColIds, (p) => setProgress(p));
      const url = URL.createObjectURL(result.blob);
      setGeneratedFile({ url, name: result.filename });
      setStatus('success');
    } catch (error) {
      console.error('Generation Failed:', error);
      setStatus('error');
    }
  };

  const handleDownload = () => {
    if (!generatedFile) return;
    const link = document.createElement('a');
    link.href = generatedFile.url;
    link.download = generatedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClose = () => {
    if (status === 'generating') return;
    onClose();
    setTimeout(() => {
      setStatus('idle');
      setProgress(0);
      setGeneratedFile(null);
    }, 300);
  };

  // Automated Download Protocol
  useEffect(() => {
    if (status === 'success' && generatedFile) {
      const link = document.createElement('a');
      link.href = generatedFile.url;
      link.download = generatedFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [status, generatedFile]);

  // Body Scroll Lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Porting Logic - Mount to Body
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
          style={{ width: '100%', maxWidth: 1000, maxHeight: 'calc(100vh - 80px)', background: 'rgba(255, 255, 255, 0.98)', borderRadius: 24, border: '1.5px solid #d0ab82', boxShadow: '0 30px 100px rgba(0, 63, 73, 0.15)', overflowY: 'auto', position: 'relative' }}
          className="elite-scrollbar"
        >
          {/* Header */}
          <div style={{ padding: '24px 32px', background: 'linear-gradient(to right, rgba(212, 175, 55, 0.1), transparent)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(208, 171, 130, 0.15)', border: '1.5px solid #d0ab82', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d0ab82' }}>
                {format === 'pdf' ? <FileText size={24} /> : <Table size={24} />}
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 950, color: '#003f49', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>
                  BIM Review Verification Protocol
                </h2>
                <p style={{ fontSize: 11, fontWeight: 900, color: '#d0ab82', margin: 0, letterSpacing: '0.12em' }}>
                  ELITE {format.toUpperCase()} INTEL GENERATION
                </p>
              </div>
            </div>
            <button onClick={handleClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0, 63, 73, 0.05)', border: '1px solid rgba(0, 63, 73, 0.1)', color: '#003f49', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 0, minHeight: 480 }}>
            {/* Sidebar - Configuration */}
            <div style={{ padding: 24, background: 'rgba(0, 63, 73, 0.02)', borderRight: '1.5px solid rgba(0, 63, 73, 0.1)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Perspective Selection */}
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <BarChart3 size={14} color="#d0ab82" />
                    <span style={{ fontSize: 10, fontWeight: 950, color: 'rgba(0, 63, 73, 0.6)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Report Focus Perspective</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                    {[
                      { id: 'table', label: 'BIM Matrix', icon: <Table size={14} />, desc: 'Registry View' },
                      { id: 'dashboard', label: 'Analytics View', icon: <BarChart3 size={14} />, desc: 'Visual Insights' },
                      { id: 'both', label: 'Consolidated', icon: <Zap size={14} />, desc: 'Executive Master' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setPerspective(opt.id as any)}
                        style={{
                          padding: '14px 16px', borderRadius: 14, background: perspective === opt.id ? 'rgba(208, 171, 130, 0.15)' : 'rgba(255, 255, 255, 0.6)',
                          border: `1.5px solid ${perspective === opt.id ? '#d0ab82' : 'rgba(0, 63, 73, 0.1)'}`,
                          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 200ms', textAlign: 'left'
                        }}
                      >
                        <div style={{ color: perspective === opt.id ? '#d0ab82' : 'rgba(0, 63, 73, 0.3)' }}>{opt.icon}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 900, color: perspective === opt.id ? '#003f49' : 'rgba(0,63,73,0.7)' }}>{opt.label}</div>
                          <div style={{ fontSize: 10, color: 'rgba(0, 63, 73, 0.5)', fontWeight: 800 }}>{opt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Technical Constraints */}
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Shield size={14} color="#d0ab82" />
                    <span style={{ fontSize: 10, fontWeight: 950, color: 'rgba(0, 63, 73, 0.6)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Filter Specifications</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <EliteDropdown value={filterStage} options={availableStages.map(s => ({ label: s, value: s }))} onChange={(v) => handleHandleToggle(filterStage, setFilterStage, v, 'All Stages')} menuLabel="Technical Stages" isMulti allLabel="All Stages" fullWidth />
                    <EliteDropdown value={filterStakeholder} options={availableStakeholders.map(s => ({ label: s, value: s }))} onChange={(v) => handleHandleToggle(filterStakeholder, setFilterStakeholder, v, 'All Stakeholders')} menuLabel="Stakeholders" isMulti allLabel="All Stakeholders" fullWidth />
                    <EliteDropdown value={filterReviewer} options={availableReviewers.map(s => ({ label: s, value: s }))} onChange={(v) => handleHandleToggle(filterReviewer, setFilterReviewer, v, 'All Reviewers')} menuLabel="Lead Reviewers" isMulti allLabel="All Reviewers" fullWidth />
                    <EliteDropdown value={filterPrecinct} options={availablePrecincts.map(s => ({ label: s, value: s }))} onChange={(v) => handleHandleToggle(filterPrecinct, setFilterPrecinct, v, 'All Precincts')} menuLabel="Precincts" isMulti allLabel="All Precincts" fullWidth />
                  </div>
                </section>
              </div>
            </div>

            {/* Main Content - Preview */}
            <div style={{ padding: 32, display: 'flex', flexDirection: 'column' }}>
              {status === 'idle' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <GlassCard style={{ flex: 1, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, right: 0, padding: 8, background: 'rgba(208, 171, 130, 0.1)', borderBottomLeftRadius: 12, borderTopRightRadius: 0 }}>
                        <Sparkles size={14} color="#d0ab82" />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: 10, fontWeight: 950, color: 'rgba(0, 63, 73, 0.6)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>BIM Active Vectors</p>
                          <p style={{ fontSize: 26, fontWeight: 950, color: '#003f49', margin: 0 }}>{bimReviews.length} Records</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 10, fontWeight: 950, color: '#d0ab82', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>{dateRangeText}</p>
                          <p style={{ fontSize: 12, fontWeight: 850, color: 'rgba(0, 63, 73, 0.6)', margin: 0 }}>Temporal Mode: {filterMode.toUpperCase()}</p>
                        </div>
                      </div>
                    </GlassCard>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Table size={14} color="#d0ab82" />
                      <span style={{ fontSize: 10, fontWeight: 950, color: 'rgba(0, 63, 73, 0.6)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Technical Column Schema ({exportCols.filter(c => c.isSelected).length} Fields Selected)</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', maxHeight: 200, overflowY: 'auto' }}>
                      {exportCols.map((col, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setExportCols(cols => cols.map(c => c.id === col.id ? { ...c, isSelected: !c.isSelected } : c))}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: col.isSelected ? 'rgba(0, 63, 73, 0.04)' : 'rgba(255, 255, 255, 0.7)', borderRadius: 10, border: `1px solid ${col.isSelected ? '#d0ab82' : 'rgba(0, 63, 73, 0.12)'}`, boxShadow: '0 2px 8px rgba(0,63,73,0.03)', cursor: 'pointer', transition: 'all 200ms', opacity: col.isSelected ? 1 : 0.5, textAlign: 'left' }}
                        >
                          <div style={{ width: 14, height: 14, flexShrink: 0, borderRadius: 4, border: `1.5px solid ${col.isSelected ? '#d0ab82' : 'var(--text-muted)'}`, background: col.isSelected ? '#d0ab82' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {col.isSelected && <Check size={10} color="#FFFFFF" strokeWidth={4} />}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 900, color: '#003f49', textTransform: 'uppercase', letterSpacing: '0.02em', textDecoration: col.isSelected ? 'none' : 'line-through' }}>{col.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: 32 }}>
                    <button
                      onClick={handleStartGeneration}
                      style={{
                        width: '100%', padding: '20px', borderRadius: 16,
                        background: '#003f49',
                        color: '#FFFFFF', fontSize: 14, fontWeight: 950, textTransform: 'uppercase',
                        letterSpacing: '0.12em', cursor: 'pointer', border: 'none',
                        boxShadow: '0 12px 40px rgba(0, 63, 73, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12
                      }}
                    >
                      <Zap size={20} fill="#FFFFFF" color="#FFFFFF" />
                      Commence BIM Registry Generation
                    </button>
                  </div>
                </>
              )}

              {status === 'generating' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
                  <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(208, 171, 130, 0.08)', border: '2px solid rgba(208, 171, 130, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={40} color="#d0ab82" className="animate-spin" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: 20, fontWeight: 950, color: '#003f49', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compiling BIP Matrix...</h3>
                    <p style={{ fontSize: 13, color: 'rgba(0, 63, 73, 0.6)', fontWeight: 800 }}>Executing high-fidelity data extraction.</p>
                  </div>
                  <div style={{ width: '100%', maxWidth: 400, height: 8, background: 'rgba(0, 63, 73, 0.05)', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(0, 63, 73, 0.08)' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} style={{ height: '100%', background: '#d0ab82', boxShadow: '0 0 15px rgba(208, 171, 130, 0.4)' }} />
                  </div>
                  <span style={{ fontSize: 16, color: '#003f49', fontWeight: 950, letterSpacing: '0.05em' }}>{progress}% COMPLETE</span>
                </div>
              )}

              {(status === 'success' || status === 'error') && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ width: 80, height: 80, borderRadius: '50%', background: status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `2px solid ${status === 'success' ? '#10b981' : '#ef4444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: status === 'success' ? '#10b981' : '#ef4444' }}>
                    {status === 'success' ? <Check size={40} /> : <AlertCircle size={40} />}
                  </motion.div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: 24, fontWeight: 950, color: '#003f49', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {status === 'success' ? 'Protocol Success' : 'Generation Halted'}
                    </h3>
                    <p style={{ fontSize: 14, color: 'rgba(0, 63, 73, 0.6)', fontWeight: 800, maxWidth: 420, lineHeight: 1.6 }}>
                      {status === 'success' ? 'Technical registry has been encrypted and is ready.' : 'An error occurred during data compilation.'}
                    </p>
                  </div>
                  
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 360 }}>
                      <div style={{ padding: '20px', borderRadius: 20, background: 'rgba(0, 63, 73, 0.04)', border: '1.5px solid rgba(0, 63, 73, 0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: 10, color: '#003f49', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Transmission Ready</span>
                        <button onClick={handleDownload} style={{ width: '100%', padding: '16px', borderRadius: 12, background: '#003f49', color: '#FFFFFF', fontSize: 13, fontWeight: 950, border: 'none', cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 10px 30px rgba(0, 63, 73, 0.2)', letterSpacing: '0.05em' }}>
                          <Download size={18} color="#FFFFFF" />
                          Download Registry
                        </button>
                      </div>
                    </div>
                  {status === 'error' && (
                    <button onClick={() => setStatus('idle')} style={{ padding: '14px 28px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: 13, fontWeight: 900, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <RefreshCw size={16} />
                      Retry Protocol
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
