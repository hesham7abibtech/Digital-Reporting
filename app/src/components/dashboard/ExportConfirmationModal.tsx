'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Check, Database, Building2, Download, 
  Table, FileText, Loader2, Sparkles, AlertCircle, RefreshCw,
  ExternalLink, ChevronRight
} from 'lucide-react';
import { Task, ProjectMetadata } from '@/lib/types';
import GlassCard from '@/components/shared/GlassCard';
import EliteDropdown from './EliteDropdown';

interface ExportConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: 'pdf' | 'excel', onProgress: (p: number) => void) => Promise<{ blob: Blob, filename: string }>;
  format: 'pdf' | 'excel';
  tasks: Task[];
  projectMetadata: ProjectMetadata | undefined;
  dateRangeText?: string;
  // Filter states
  filterMode: 'monthly' | 'custom' | 'all';
  filterDept: string[];
  setFilterDept: (val: string[]) => void;
  availableDepts: string[];
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
  filterMode, filterDept, setFilterDept, availableDepts,
  selectedYear, setSelectedYear, yearOptions,
  selectedMonth, setSelectedMonth, monthOptions,
  startDate, setStartDate, endDate, setEndDate
}: ExportConfirmationModalProps) {
  
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [generatedFile, setGeneratedFile] = useState<{ url: string, name: string } | null>(null);
  
  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (generatedFile) URL.revokeObjectURL(generatedFile.url);
    };
  }, [generatedFile]);

  const handleToggleDept = (dept: string) => {
    if (dept === 'All Departments') {
      setFilterDept(['All Departments']);
      return;
    }
    let newDepts = filterDept.filter(d => d !== 'All Departments');
    if (newDepts.includes(dept)) {
      newDepts = newDepts.filter(d => d !== dept);
      if (newDepts.length === 0) newDepts = ['All Departments'];
    } else {
      newDepts.push(dept);
    }
    setFilterDept(newDepts);
  };

  const startGeneration = async () => {
    setStatus('generating');
    setProgress(0);
    
    try {
      // Small delay for UI transition
      await new Promise(r => setTimeout(r, 400));
      
      const result = await onConfirm(format, (p) => setProgress(p));
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
            <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(212, 175, 55, 0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ 
                  width: 44, height: 44, borderRadius: 14, 
                  background: format === 'pdf' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${format === 'pdf' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  boxShadow: `0 0 20px ${format === 'pdf' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}`
                }}>
                  {format === 'pdf' ? <FileText color="#ef4444" size={22} /> : <Table color="#10b981" size={22} />}
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {status === 'generating' ? 'Synchronizing Data Stream' : status === 'success' ? 'Protocol Success' : 'Final Verification Protocol'}
                  </h2>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    Elite {format.toUpperCase()} Generation — High Fidelity Mode
                  </p>
                </div>
              </div>
              <button onClick={handleClose} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 10, color: 'white', cursor: status === 'generating' ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: 40, minHeight: 400, display: 'flex', flexDirection: 'column' }}>
              <AnimatePresence mode="wait">
                
                {status === 'idle' && (
                  <motion.div key="idle" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    
                    {/* Data Coverage Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Calendar size={14} color="#D4AF37" />
                          <span style={{ fontSize: 11, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Data Coverage Parameters</span>
                        </div>
                        
                        {filterMode === 'monthly' && (
                          <div style={{ display: 'flex', gap: 12 }}>
                            <EliteDropdown value={selectedYear} options={yearOptions} onChange={setSelectedYear} menuLabel="Select Year" />
                            <EliteDropdown value={selectedMonth} options={monthOptions} onChange={setSelectedMonth} menuLabel="Select Month" />
                          </div>
                        )}

                        {filterMode === 'custom' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase' }}>Start Date</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: 'white', fontSize: 13, outline: 'none' }} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase' }}>End Date</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: 'white', fontSize: 13, outline: 'none' }} />
                              </div>
                            </div>
                          </div>
                        )}

                        {filterMode === 'all' && (
                          <div style={{ padding: '20px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: 16, border: '1px dashed rgba(212, 175, 55, 0.2)', textAlign: 'center' }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Comprehensive Historical Capture</span>
                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '8px 0 0 0', fontWeight: 600 }}>All task data will be included in the generation.</p>
                          </div>
                        )}
                        
                        <div style={{ marginTop: 8, padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Active Preview</span>
                          <span style={{ fontSize: 16, fontWeight: 900, color: 'white' }}>{tasks.length} Records</span>
                          <p style={{ fontSize: 11, color: 'rgba(212, 175, 55, 0.6)', margin: '4px 0 0 0', fontWeight: 700 }}>{dateRangeText}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Building2 size={14} color="#D4AF37" />
                          <span style={{ fontSize: 11, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Entity Distribution</span>
                        </div>
                        <div style={{ maxHeight: 220, overflowY: 'auto', padding: 12, borderRadius: 14, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {availableDepts.map(dept => (
                            <label key={dept} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: filterDept.includes(dept) ? 'rgba(212, 175, 55, 0.08)' : 'transparent', border: `1px solid ${filterDept.includes(dept) ? 'rgba(212, 175, 55, 0.2)' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                              <div onClick={() => handleToggleDept(dept)} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${filterDept.includes(dept) ? '#D4AF37' : 'rgba(255,255,255,0.15)'}`, background: filterDept.includes(dept) ? 'rgba(212, 175, 55, 0.1)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: filterDept.includes(dept) ? '0 0 10px rgba(212, 175, 55, 0.2)' : 'none' }}>
                                {filterDept.includes(dept) && <Check size={12} color="#D4AF37" strokeWidth={4} />}
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: filterDept.includes(dept) ? 'white' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{dept}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button onClick={startGeneration} disabled={tasks.length === 0} style={{ width: '100%', padding: '18px', borderRadius: 16, background: '#D4AF37', border: 'none', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 10px 40px rgba(212, 175, 55, 0.3)', marginTop: 8 }}>
                      <Download size={20} />
                      COMMENCE {format.toUpperCase()} GENERATION
                    </button>
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
