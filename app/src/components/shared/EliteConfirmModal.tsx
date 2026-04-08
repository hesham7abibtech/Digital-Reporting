'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Loader2, 
  Trash2, 
  X, 
  ShieldAlert, 
  Info, 
  CheckCircle2,
  Lock
} from 'lucide-react';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';

export type ModalSeverity = 'INFO' | 'WARNING' | 'DANGER' | 'SUCCESS' | 'SECURITY';

interface EliteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: ModalSeverity;
  isReadOnly?: boolean;
}

export default function EliteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = 'Authorize',
  cancelLabel = 'Abort',
  severity = 'WARNING',
  isReadOnly = false
}: EliteConfirmModalProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!onConfirm) {
      onClose();
      return;
    }
    
    setIsExecuting(true);
    setErrorDetails(null);
    try {
      await onConfirm();
      onClose();
    } catch (error: any) {
      console.error('[TERMINAL_MODAL_FAILURE]', error);
      setErrorDetails(getFirebaseErrorMessage(error));
    } finally {
      setIsExecuting(false);
    }
  };

  const getSeverityColor = () => {
    switch(severity) {
      case 'DANGER': return '#ef4444';
      case 'WARNING': return '#D4AF37'; // Golden Warning
      case 'INFO': return '#D4AF37';    // Elite Gold
      case 'SUCCESS': return '#10b981';
      case 'SECURITY': return '#B8860B'; // Metallic Gold
      default: return '#D4AF37';
    }
  };

  const color = getSeverityColor();
  const isGoldThemed = severity === 'INFO' || severity === 'SECURITY' || severity === 'WARNING';
  const textColorOnAccent = isGoldThemed ? '#0a0a0f' : 'white';

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          {/* Elite Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={isExecuting ? undefined : onClose} 
            style={{ position: 'absolute', inset: 0, background: 'rgba(5, 5, 10, 0.9)', backdropFilter: 'blur(12px)' }} 
          />
          
          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            style={{
              width: '100%', 
              maxWidth: 500, 
              background: '#0a0a0f', 
              border: `1px solid ${errorDetails ? '#ef4444' : 'rgba(255, 255, 255, 0.08)'}`, 
              borderRadius: 28, 
              position: 'relative', 
              zIndex: 1, 
              overflow: 'hidden',
              boxShadow: errorDetails ? '0 0 50px rgba(239, 68, 68, 0.2)' : '0 25px 70px rgba(0,0,0,0.9)'
            }}
          >
            {/* Severity Accent Bar */}
            <div style={{ height: 4, width: '100%', background: color }} />

            <div style={{ padding: '40px 48px', textAlign: 'center' }}>
              <div style={{ 
                width: 80, height: 80, borderRadius: '24px', background: `${color}15`, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px',
                border: `2px solid ${color}30`,
                transform: 'rotate(5deg)',
                boxShadow: `0 0 30px ${color}10`
              }}>
                {severity === 'DANGER' && <Trash2 size={40} color={color} />}
                {severity === 'WARNING' && <AlertTriangle size={40} color={color} />}
                {severity === 'INFO' && <Info size={40} color={color} />}
                {severity === 'SUCCESS' && <CheckCircle2 size={40} color={color} />}
                {severity === 'SECURITY' && <Lock size={40} color={color} />}
              </div>

              <h3 style={{ fontSize: 26, fontWeight: 900, color: 'white', marginBottom: 14, letterSpacing: '-0.02em' }}>
                {title}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
                {message}
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
                    <div style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>{errorDetails}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', gap: 16 }}>
                {!isReadOnly && (
                  <button 
                    onClick={onClose} 
                    disabled={isExecuting}
                    style={{ 
                      flex: 1, padding: '16px', borderRadius: 16, 
                      background: 'rgba(255,255,255,0.03)', color: 'white', 
                      border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', 
                      fontSize: 15, fontWeight: 700, transition: 'all 200ms' 
                    }}
                  >
                    {cancelLabel}
                  </button>
                )}
                <button 
                  onClick={handleConfirm} 
                  disabled={isExecuting}
                  style={{ 
                    flex: isReadOnly ? 1 : 2, padding: '16px', borderRadius: 16, 
                    background: color, color: textColorOnAccent, 
                    border: 'none', cursor: 'pointer', 
                    fontSize: 15, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: `0 10px 20px ${color}30`
                  }}
                >
                  {isExecuting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {isReadOnly ? <CheckCircle2 size={20} /> : <CheckCircle2 size={20} />}
                      {confirmLabel}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Footer Status */}
            <div style={{ 
              background: `${color}05`, padding: '14px 24px', 
              borderTop: `1px solid ${color}10`, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} className="animate-pulse" />
              <span style={{ fontSize: 10, color: color, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {severity === 'DANGER' ? 'High Authority Wipe Sequence' : 'Verified Administrative Action'}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
