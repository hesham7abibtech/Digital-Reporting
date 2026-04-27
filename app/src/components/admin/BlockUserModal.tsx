'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldOff, X, Clock, AlertTriangle, Loader2 } from 'lucide-react';

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, duration: string) => Promise<void>;
  userName: string;
  userEmail: string;
}

export default function BlockUserModal({ isOpen, onClose, onConfirm, userName, userEmail }: BlockUserModalProps) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('PERMANENT');
  const [customDays, setCustomDays] = useState('7');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      const finalDuration = duration === 'CUSTOM' ? `${customDays} Days` : duration;
      await onConfirm(reason, finalDuration);
      onClose();
    } catch (err) {
      console.error('Block failure:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 10, 12, 0.8)', backdropFilter: 'blur(8px)' }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            style={{ background: '#ffffff', width: '100%', maxWidth: 480, borderRadius: 24, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
          >
            {/* Header */}
            <div style={{ background: '#fef2f2', padding: '24px 32px', borderBottom: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldOff size={20} color="#ef4444" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: '#991b1b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Revocation</h3>
                  <p style={{ fontSize: 11, color: '#b91c1c', margin: 0, fontWeight: 700 }}>Security Protocol: Suspension</p>
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#991b1b', cursor: 'pointer', opacity: 0.5 }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Personnel</label>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>{userName}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{userEmail}</div>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason for Suspension</label>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide a detailed justification for this security action..."
                  style={{ width: '100%', minHeight: 100, padding: '16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, resize: 'none', background: '#f8fafc', color: '#1e293b' }}
                />
              </div>

              <div style={{ marginBottom: 32 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suspension Duration</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 14, fontWeight: 700, color: '#1e293b' }}
                  >
                    <option value="PERMANENT">PERMANENT</option>
                    <option value="24 Hours">24 HOURS</option>
                    <option value="48 Hours">48 HOURS</option>
                    <option value="72 Hours">72 HOURS</option>
                    <option value="CUSTOM">CUSTOM DURATION</option>
                  </select>
                  
                  {duration === 'CUSTOM' && (
                    <div style={{ position: 'relative', width: 100 }}>
                      <input
                        type="number"
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value)}
                        style={{ width: '100%', padding: '12px 32px 12px 12px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 14, fontWeight: 700 }}
                      />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 10, fontWeight: 900, color: '#64748b' }}>DAYS</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: '16px', borderRadius: 16, marginBottom: 32, display: 'flex', gap: 12 }}>
                <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#92400e', margin: 0, lineHeight: 1.5 }}>
                  <strong>Security Impact:</strong> This user will be immediately logged out and blocked from the identity terminal. A real-time notification of this action will be displayed upon their next handshake attempt.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ flex: 1, padding: '14px', borderRadius: 12, background: '#f1f5f9', color: '#64748b', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ flex: 2, padding: '14px', borderRadius: 12, background: '#ef4444', color: '#ffffff', border: 'none', fontWeight: 800, fontSize: 13, cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'AUTHORIZE SUSPENSION'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
