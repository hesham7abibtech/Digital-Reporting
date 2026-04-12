'use client';

import React, { useState, useEffect } from 'react';
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
  onConfirm: (type: 'pdf' | 'excel', perspective: 'table' | 'dashboard' | 'both', onProgress: (p: number) => void) => Promise<{ blob: Blob, filename: string }>;
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
  filterMode, selectedYear, selectedMonth
}: BimExportConfirmationModalProps) {
  
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [generatedFile, setGeneratedFile] = useState<{ url: string, name: string } | null>(null);
  const [exportCols, setExportCols] = useState<{label: string}[]>([]);
  const [perspective, setPerspective] = useState<'table' | 'dashboard' | 'both'>('table');
  
  useEffect(() => {
    if (isOpen) {
      setExportCols(getBimExportColumns([], format));
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
      const result = await onConfirm(format, perspective, (p) => setProgress(p));
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 6500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          style={{ width: '100%', maxWidth: 1000, background: '#0A0A0F', borderRadius: 24, border: '1px solid rgba(212, 175, 55, 0.2)', boxShadow: '0 30px 100px rgba(0,0,0,0.8), 0 0 50px rgba(212, 175, 55, 0.05)', overflow: 'hidden', position: 'relative' }}
        >
          {/* Header */}
          <div style={{ padding: '24px 32px', background: 'linear-gradient(to right, rgba(212, 175, 55, 0.1), transparent)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
                {format === 'pdf' ? <FileText size={24} /> : <Table size={24} />}
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>
                  BIM Review Verification Protocol
                </h2>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#D4AF37', margin: 0, opacity: 0.8, letterSpacing: '0.1em' }}>
                  ELITE {format.toUpperCase()} INTEL GENERATION
                </p>
              </div>
            </div>
            <button onClick={handleClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 0, minHeight: 480 }}>
            {/* Sidebar - Configuration */}
            <div style={{ padding: 24, background: 'rgba(255,255,255,0.01)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Perspective Selection */}
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <BarChart3 size={14} color="#D4AF37" />
                    <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Report Focus Perspective</span>
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
                          padding: '12px 14px', borderRadius: 12, background: perspective === opt.id ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${perspective === opt.id ? '#D4AF37' : 'rgba(255,255,255,0.05)'}`,
                          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 200ms', textAlign: 'left'
                        }}
                      >
                        <div style={{ color: perspective === opt.id ? '#D4AF37' : 'rgba(255,255,255,0.3)' }}>{opt.icon}</div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: perspective === opt.id ? '#D4AF37' : 'white' }}>{opt.label}</div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{opt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Technical Constraints */}
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Shield size={14} color="#D4AF37" />
                    <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Filter Specifications</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <EliteDropdown value={filterStage} options={availableStages.map(s => ({ label: s, value: s }))} onChange={(v) => handleHandleToggle(filterStage, setFilterStage, v, 'All Stages')} menuLabel="Technical Stages" isMulti allLabel="All Stages" fullWidth />
                    <EliteDropdown value={filterStakeholder} options={availableStakeholders.map(s => ({ label: s, value: s }))} onChange={(v) => handleHandleToggle(filterStakeholder, setFilterStakeholder, v, 'All Stakeholders')} menuLabel="Stakeholders" isMulti allLabel="All Stakeholders" fullWidth />
                    <EliteDropdown value={filterReviewer} options={availableReviewers.map(s => ({ label: s, value: s }))} onChange={(v) => handleHandleToggle(filterReviewer, setFilterReviewer, v, 'All Reviewers')} menuLabel="Lead Reviewers" isMulti allLabel="All Reviewers" fullWidth />
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
                      <div style={{ position: 'absolute', top: 0, right: 0, padding: 8, background: 'rgba(212, 175, 55, 0.1)', borderBottomLeftRadius: 12, borderTopRightRadius: 0 }}>
                        <Sparkles size={14} color="#D4AF37" />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>BIM Active Vectors</p>
                          <p style={{ fontSize: 24, fontWeight: 900, color: 'white', margin: 0 }}>{bimReviews.length} Records</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 10, fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{dateRangeText}</p>
                          <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Temporal Mode: {filterMode.toUpperCase()}</p>
                        </div>
                      </div>
                    </GlassCard>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Table size={14} color="#D4AF37" />
                      <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Technical Column Schema (14 Fields)</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                      {exportCols.map((col, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                          <Database size={12} color="rgba(212, 175, 55, 0.5)" />
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>{col.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: 32 }}>
                    <button
                      onClick={handleStartGeneration}
                      style={{
                        width: '100%', padding: '16px', borderRadius: 14,
                        background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                        color: '#0A0A0F', fontSize: 14, fontWeight: 900, textTransform: 'uppercase',
                        letterSpacing: '0.1em', cursor: 'pointer', border: 'none',
                        boxShadow: '0 10px 30px rgba(212, 175, 55, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12
                      }}
                    >
                      <Zap size={18} fill="#0A0A0F" />
                      Commence BIM Registry Generation
                    </button>
                  </div>
                </>
              )}

              {status === 'generating' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', border: '2px solid rgba(212, 175, 55, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={40} color="#D4AF37" className="animate-spin" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 8, textTransform: 'uppercase' }}>Compiling BIP Matrix...</h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Executing high-fidelity data extraction.</p>
                  </div>
                  <div style={{ width: '100%', maxWidth: 400, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} style={{ height: '100%', background: '#D4AF37', boxShadow: '0 0 10px #D4AF37' }} />
                  </div>
                  <span style={{ fontSize: 14, color: '#D4AF37', fontWeight: 900 }}>{progress}% COMPLETE</span>
                </div>
              )}

              {(status === 'success' || status === 'error') && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ width: 80, height: 80, borderRadius: '50%', background: status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `2px solid ${status === 'success' ? '#10b981' : '#ef4444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: status === 'success' ? '#10b981' : '#ef4444' }}>
                    {status === 'success' ? <Check size={40} /> : <AlertCircle size={40} />}
                  </motion.div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 8, textTransform: 'uppercase' }}>
                      {status === 'success' ? 'Protocol Success' : 'Generation Halted'}
                    </h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                      {status === 'success' ? 'Technical registry has been encrypted and is ready.' : 'An error occurred during data compilation.'}
                    </p>
                  </div>
                  
                  {status === 'success' && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={handleDownload} style={{ padding: '14px 28px', borderRadius: 12, background: '#D4AF37', color: '#0A0A0F', fontSize: 13, fontWeight: 900, border: 'none', cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Download size={16} />
                        Download Registry
                      </button>
                      <button onClick={handleClose} style={{ padding: '14px 28px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: 13, fontWeight: 900, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', textTransform: 'uppercase' }}>
                        Finish
                      </button>
                    </div>
                  )}
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
    </AnimatePresence>
  );
}
