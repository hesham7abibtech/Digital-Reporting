'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertTriangle, FileSpreadsheet, Database, Trash2, Loader2, Calendar, RefreshCw } from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import { Task } from '@/lib/types';

interface TaskImportConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (strategy: 'APPEND' | 'OVERWRITE' | 'UPDATE') => void;
  isLoading: boolean;
  records: Task[];
}

/**
 * Technical Cleanse helper to remove ISO noise and time
 */
const formatPreviewDate = (dateStr?: string | null) => {
  if (!dateStr) return '—';
  try {
    return dateStr.split('T')[0];
  } catch (e) {
    return '—';
  }
};

export default function TaskImportConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  records
}: TaskImportConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 6000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, background: 'rgba(0, 63, 73, 0.4)', backdropFilter: 'blur(24px)'
        }}>
          <motion.div
            key="task-import-modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            style={{ width: '100%', maxWidth: 1100, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{
              background: '#ffffff',
              borderRadius: 28,
              overflow: 'hidden',
              boxShadow: '0 40px 100px rgba(0, 63, 73, 0.25)',
              border: '1px solid rgba(0, 63, 73, 0.15)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Elite Header */}
              <div style={{ 
                padding: '24px 40px', 
                background: 'rgba(0, 63, 73, 0.03)', 
                borderBottom: '1.5px solid rgba(0, 63, 73, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ 
                    width: 52, height: 52, borderRadius: 14, 
                    background: 'var(--primary)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 20px rgba(0, 63, 73, 0.2)'
                  }}>
                    <FileSpreadsheet size={24} color="#D4AF37" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 950, color: '#003F49', margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Task Matrix Ingestion</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)' }} />
                      <p style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                        Ready for Review: {records.length} Records Detected
                      </p>
                    </div>
                  </div>
                </div>
                <button 
                  disabled={isLoading} 
                  onClick={onClose} 
                  style={{ 
                    background: '#ffffff', border: '1px solid rgba(0,63,73,0.15)', 
                    borderRadius: 12, width: 40, height: 40, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: 'pointer', color: '#003F49', transition: 'all 0.2s' 
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#003F49'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,63,73,0.15)'}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Preview Terminal Table */}
              <div className="elite-scrollbar" style={{ padding: '0', overflowY: 'auto', maxHeight: '55vh', background: '#F9F8F2' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead style={{ background: '#ffffff', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <tr>
                      <th style={{ width: 140, padding: '20px', fontSize: 11, fontWeight: 950, color: '#003F49', textTransform: 'uppercase', letterSpacing: '0.15em', textAlign: 'center' }}>Project ID</th>
                      <th style={{ padding: '20px', fontSize: 11, fontWeight: 950, color: '#003F49', textTransform: 'uppercase', letterSpacing: '0.15em', textAlign: 'center' }}>Technical Asset / Title</th>
                      <th style={{ width: 150, padding: '20px', fontSize: 11, fontWeight: 950, color: '#003F49', textTransform: 'uppercase', letterSpacing: '0.15em', textAlign: 'center' }}>Category</th>
                      <th style={{ width: 180, padding: '20px', fontSize: 11, fontWeight: 950, color: '#003F49', textTransform: 'uppercase', letterSpacing: '0.15em', textAlign: 'center' }}>Lead Submitter</th>
                      <th style={{ width: 160, padding: '20px', fontSize: 11, fontWeight: 950, color: '#003F49', textTransform: 'uppercase', letterSpacing: '0.15em', textAlign: 'center' }}>Submission</th>
                      <th style={{ width: 140, padding: '20px', fontSize: 11, fontWeight: 950, color: '#003F49', textTransform: 'uppercase', letterSpacing: '0.15em', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.slice(0, 100).map((rec, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(0,63,73,0.06)', transition: 'background 0.2s' }} className="preview-row">
                        <td style={{ padding: '16px 20px', fontSize: 11, color: '#003F49', fontWeight: 700, textAlign: 'center', opacity: 0.6 }}>{rec.id || 'AUTO_RECODE'}</td>
                        <td style={{ padding: '16px 20px', fontSize: 13, color: '#002A30', fontWeight: 800, textAlign: 'center' }}>{rec.title}</td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                           <span style={{ fontSize: 10, background: 'rgba(0,63,73,0.06)', color: '#003F49', padding: '5px 12px', borderRadius: 8, fontWeight: 900, textTransform: 'uppercase', border: '1px solid rgba(0,63,73,0.1)' }}>
                              {Array.isArray(rec.department) ? rec.department.join(', ') : (rec.department || 'GENERAL')}
                           </span>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: 12, color: '#003F49', fontWeight: 700, textAlign: 'center' }}>
                          {Array.isArray(rec.submitterName) ? rec.submitterName.join(', ') : (rec.submitterName || 'Registry N/A')}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                           <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#003F49', fontWeight: 800 }}>
                              <Calendar size={13} color="var(--teal)" />
                              {formatPreviewDate(rec.submittingDate)}
                           </div>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <span style={{ background: rec.status === 'COMPLETED' ? 'rgba(16,185,129,0.1)' : 'rgba(0,63,73,0.08)', color: rec.status === 'COMPLETED' ? '#10b981' : 'var(--teal)', padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 950, letterSpacing: '0.05em' }}>
                             {rec.status || 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {records.length > 100 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'rgba(0,63,73,0.4)', fontSize: 13, fontWeight: 700, fontStyle: 'italic', background: 'rgba(0,63,73,0.02)' }}>
                          ... and {records.length - 100} additional records held in synchronization buffer
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Protocol Authorization Section */}
              <div style={{ padding: '40px', background: '#ffffff', borderTop: '1.5px solid rgba(0,63,73,0.1)', display: 'flex', gap: 40, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#D4AF37', marginBottom: 10 }}>
                    <AlertTriangle size={24} />
                    <span style={{ fontSize: 13, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Data Integrity Protocol</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#003F49', margin: 0, lineHeight: 1.6, fontWeight: 600 }}>
                    Please authorize the ingestion strategy. <strong style={{ color: '#ef4444' }}>OVERWRITE</strong> will purge the current Deliverable Matrix and re-sequence all new records. 
                    <strong> UPDATE</strong> will synchronize records by ID, and <strong> APPEND</strong> will merge records as new entries.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button
                    disabled={isLoading}
                    onClick={() => onConfirm('UPDATE')}
                    style={{
                      padding: '14px 28px', borderRadius: 14, border: '1.5px solid #003F49',
                      background: '#003F49', color: '#ffffff', fontSize: 13, fontWeight: 900,
                      cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                      transition: 'all 0.3s ease', textTransform: 'uppercase', letterSpacing: '0.05em',
                      boxShadow: '0 8px 20px rgba(0, 63, 73, 0.2)'
                    }}
                    onMouseEnter={e => { if(!isLoading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { if(!isLoading) e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                    {isLoading ? 'Updating...' : 'Update Existing'}
                  </button>

                  <button
                    disabled={isLoading}
                    onClick={() => onConfirm('APPEND')}
                    style={{
                      padding: '14px 28px', borderRadius: 14, border: '1.5px solid rgba(0, 63, 73, 0.2)',
                      background: '#ffffff', color: '#003F49', fontSize: 13, fontWeight: 900,
                      cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                      transition: 'all 0.3s ease', textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}
                    onMouseEnter={e => { if(!isLoading) e.currentTarget.style.background = 'rgba(0,63,73,0.04)'; }}
                    onMouseLeave={e => { if(!isLoading) e.currentTarget.style.background = '#ffffff'; }}
                  >
                    <Database size={18} />
                    {isLoading ? 'Processing...' : 'Append New'}
                  </button>

                  <button
                    disabled={isLoading}
                    onClick={() => onConfirm('OVERWRITE')}
                    style={{
                      padding: '14px 28px', borderRadius: 14, border: 'none',
                      background: 'linear-gradient(to right, #ef4444, #dc2626)', color: '#ffffff', fontSize: 13, fontWeight: 900,
                      cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                      boxShadow: '0 8px 20px rgba(239, 68, 68, 0.2)', transition: 'all 0.3s ease', textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}
                    onMouseEnter={e => { if(!isLoading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { if(!isLoading) e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    {isLoading ? 'Purging Hub...' : 'Purge & Import'}
                  </button>
                </div>
              </div>
            </div>
            <style jsx>{`
              .elite-scrollbar::-webkit-scrollbar { width: 6px; }
              .elite-scrollbar::-webkit-scrollbar-track { background: #f9f8f2; }
              .elite-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 63, 73, 0.1); border-radius: 10px; }
              .elite-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 63, 73, 0.2); }
              .preview-row:hover { background: rgba(0, 63, 73, 0.02); }
            `}</style>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
