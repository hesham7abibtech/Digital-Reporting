'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertTriangle, FileSpreadsheet, Database, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';

interface BIMImportConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (strategy: 'APPEND' | 'OVERWRITE') => void;
  isLoading: boolean;
  records: any[];
}

export default function BIMImportConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  records
}: BIMImportConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, background: 'rgba(0, 63, 73, 0.3)', backdropFilter: 'blur(12px)'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{ width: '100%', maxWidth: 1000, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        >
          <GlassCard padding="none">
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSpreadsheet size={22} color="#10b981" />
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Intelligence Ingestion Preview</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Reviewing {records.length} pending records from digital transport packet</p>
                </div>
              </div>
              <button disabled={isLoading} onClick={onClose} style={{ background: 'var(--section-bg)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="custom-scrollbar" style={{ padding: 32, overflowY: 'auto', maxHeight: '50vh' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase' }}>Project</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase' }}>Description</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase' }}>Stage</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase' }}>Stakeholder</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{rec.project}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.submissionDescription}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{rec.designStage}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12 }}>
                        <span style={{ background: 'var(--secondary)', color: 'var(--teal)', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 900 }}>{rec.insiteBimReviewStatus || 'EMPTY'}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{rec.stakeholder}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>{rec.submissionDate || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '32px', background: 'rgba(212, 175, 55, 0.02)', borderTop: '1px solid var(--border)', display: 'flex', gap: 24 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f59e0b', marginBottom: 8 }}>
                  <AlertTriangle size={18} />
                  <span style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administrative Warning</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                  Ingesting large datasets requires authority clearance. **Overwrite Matrix** will permanently purge all current records before synchronizing the new dataset. This action cannot be reversed.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                <button
                  disabled={isLoading}
                  onClick={() => onConfirm('APPEND')}
                  style={{
                    padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.2)',
                    background: 'rgba(16, 185, 129, 0.05)', color: '#10b981', fontSize: 13, fontWeight: 800,
                    cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'all 200ms'
                  }}
                >
                  <Database size={16} />
                  APPEND RECORDS
                </button>

                <button
                  disabled={isLoading}
                  onClick={() => onConfirm('OVERWRITE')}
                  style={{
                    padding: '12px 24px', borderRadius: 12, border: 'none',
                    background: '#ef4444', color: 'var(--text-primary)', fontSize: 13, fontWeight: 900,
                    cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)', transition: 'all 200ms'
                  }}
                >
                  <Trash2 size={16} />
                  OVERWRITE MATRIX
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
