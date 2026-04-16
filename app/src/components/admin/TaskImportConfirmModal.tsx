'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertTriangle, FileSpreadsheet, Database, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import { Task } from '@/lib/types';

interface TaskImportConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (strategy: 'APPEND' | 'OVERWRITE') => void;
  isLoading: boolean;
  records: Task[];
}

export default function TaskImportConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  records
}: TaskImportConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, background: 'rgba(5, 10, 20, 0.5)', backdropFilter: 'blur(16px)'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{ width: '100%', maxWidth: 1000, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        >
          <GlassCard padding="none">
            <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSpreadsheet size={22} color="#D4AF37" />
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Task Matrix Ingestion</h2>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Previewing {records.length} records from data packet</p>
                </div>
              </div>
              <button disabled={isLoading} onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ffffff' }}>
                <X size={18} />
              </button>
            </div>

            <div className="custom-scrollbar" style={{ padding: '0 32px', overflowY: 'auto', maxHeight: '50vh', background: 'rgba(0,0,0,0.2)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#0a1220', position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th style={{ padding: '16px', fontSize: 10, fontWeight: 900, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ID</th>
                    <th style={{ padding: '16px', fontSize: 10, fontWeight: 900, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Asset / Task Title</th>
                    <th style={{ padding: '16px', fontSize: 10, fontWeight: 900, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Category</th>
                    <th style={{ padding: '16px', fontSize: 10, fontWeight: 900, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Submitter</th>
                    <th style={{ padding: '16px', fontSize: 10, fontWeight: 900, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Submission Date</th>
                    <th style={{ padding: '16px', fontSize: 10, fontWeight: 900, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 100).map((rec, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{rec.id?.substring(0, 8)}...</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#ffffff', fontWeight: 600 }}>{rec.title}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{rec.department}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{rec.submitterName || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{rec.submittingDate || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12 }}>
                        <span style={{ background: 'rgba(0,128,128,0.2)', color: 'var(--teal)', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 900 }}>{rec.status || 'PENDING'}</span>
                      </td>
                    </tr>
                  ))}
                  {records.length > 100 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, fontStyle: 'italic' }}>
                        ... and {records.length - 100} more records
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '32px', background: 'rgba(212, 175, 55, 0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 24, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f59e0b', marginBottom: 8 }}>
                  <AlertTriangle size={18} />
                  <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Data Integrity Protocol</span>
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>
                  Please authorize the ingestion strategy. **OVERWRITE** will purge the current Digital Deliverable Matrix and replace it with this packet. **APPEND** will merge these records into the existing repository.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  disabled={isLoading}
                  onClick={() => onConfirm('APPEND')}
                  style={{
                    padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(0, 128, 128, 0.3)',
                    background: 'rgba(0, 128, 128, 0.1)', color: 'var(--teal)', fontSize: 12, fontWeight: 900,
                    cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'all 200ms', textTransform: 'uppercase'
                  }}
                >
                  <Database size={16} />
                  {isLoading ? 'Processing...' : 'Append Matrix'}
                </button>

                <button
                  disabled={isLoading}
                  onClick={() => onConfirm('OVERWRITE')}
                  style={{
                    padding: '12px 24px', borderRadius: 12, border: 'none',
                    background: '#ef4444', color: '#ffffff', fontSize: 12, fontWeight: 900,
                    cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    boxShadow: '0 8px 20px rgba(239, 68, 68, 0.2)', transition: 'all 200ms', textTransform: 'uppercase'
                  }}
                >
                  <Trash2 size={16} />
                  {isLoading ? 'Purging...' : 'Overwrite Matrix'}
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
