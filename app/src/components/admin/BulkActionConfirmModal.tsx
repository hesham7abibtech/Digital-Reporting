'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, Trash2, X, ShieldAlert } from 'lucide-react';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';

interface BulkActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  count: number;
  actionName: string;
}

export default function BulkActionConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  count, 
  actionName 
}: BulkActionConfirmModalProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const handleExecute = async () => {
    setIsExecuting(true);
    setErrorDetails(null);
    try {
      await onConfirm();
      onClose();
    } catch (error: any) {
      console.error('Bulk action failed:', error);
      setErrorDetails(getFirebaseErrorMessage(error));
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={isExecuting ? undefined : onClose} 
        style={{ position: 'absolute', inset: 0, background: 'rgba(0, 30, 36, 0.85)', backdropFilter: 'blur(8px)', backdropFilter: 'blur(12px)' }} 
      />
      
      {/* Modal */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        style={{
          width: '100%', 
          maxWidth: 500, 
          background: 'var(--cotton)', 
          border: `1px solid ${errorDetails ? '#ef4444' : 'rgba(239, 68, 68, 0.3)'}`, 
          borderRadius: 28, 
          position: 'relative', 
          zIndex: 1, 
          overflow: 'hidden',
          boxShadow: errorDetails ? '0 0 50px rgba(239, 68, 68, 0.2)' : '0 25px 50px rgba(0,0,0,0.8)'
        }}
      >
        <div style={{ padding: '40px 48px', textAlign: 'center' }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: '24px', background: 'rgba(239, 68, 68, 0.1)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px',
            border: '2px solid rgba(239, 68, 68, 0.2)',
            transform: 'rotate(5deg)'
          }}>
            <AlertTriangle size={40} color="#ef4444" />
          </div>

          <h3 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 14, letterSpacing: '-0.02em' }}>
            Bulk {actionName}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
            Initiating high-authority deletion for <strong style={{ color: 'var(--text-primary)', fontSize: 17 }}>{count} items</strong>. 
            This operation is irreversible and will purge data from the production environment.
          </p>

          <AnimatePresence>
            {errorDetails && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                style={{ 
                  background: 'rgba(239, 68, 68, 0.15)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)', 
                  borderRadius: 16, padding: '16px', marginBottom: 24,
                  display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left'
                }}
              >
                <ShieldAlert size={20} color="#ef4444" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--status-error)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Denied</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, marginTop: 2 }}>{errorDetails}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: 'flex', gap: 16 }}>
            <button 
              onClick={onClose} 
              disabled={isExecuting}
              style={{ 
                flex: 1, padding: '16px', borderRadius: 16, 
                background: 'var(--section-bg)', color: 'var(--teal)', 
                border: '1px solid var(--border)', cursor: 'pointer', 
                fontSize: 15, fontWeight: 700, transition: 'all 200ms' 
              }}
            >
              Abort
            </button>
            <button 
              onClick={handleExecute} 
              disabled={isExecuting}
              style={{ 
                flex: 2, padding: '16px', borderRadius: 16, 
                background: '#ef4444', color: 'var(--text-primary)', 
                border: 'none', cursor: 'pointer', 
                fontSize: 15, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 10px 20px rgba(239, 68, 68, 0.3)'
              }}
            >
              {isExecuting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Trash2 size={20} />
                  Authorize Wipe
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security Footer */}
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.08)', padding: '14px 24px', 
          borderTop: '1px solid rgba(239, 68, 68, 0.1)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} className="animate-pulse" />
          <span style={{ fontSize: 11, color: 'var(--status-error)', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>High Authority Verification Required</span>
        </div>
      </motion.div>
    </div>
  );
}
