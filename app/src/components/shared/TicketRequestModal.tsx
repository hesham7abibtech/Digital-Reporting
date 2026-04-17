'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  CheckCircle2, 
  Copy, 
  Loader2, 
  ShieldAlert, 
  Mail, 
  MessageSquare,
  ClipboardCheck,
  ChevronRight
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { generateTicketId } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/shared/EliteToast';

interface TicketRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultReason?: string;
  defaultMessage?: string;
}

export default function TicketRequestModal({ 
  isOpen, 
  onClose, 
  defaultReason = 'Access Privileges',
  defaultMessage = "I am asking to access this page for high-level monitoring and administrative overview."
}: TicketRequestModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [reason, setReason] = useState(defaultReason);
  const [message, setMessage] = useState(defaultMessage);
  const [guestEmail, setGuestEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Email Validation Logic
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const effectiveEmail = user?.email || guestEmail;
  const isEmailValid = user ? true : validateEmail(guestEmail);
  const isFormValid = isEmailValid && !!reason && !!message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    const ticketId = generateTicketId();

    try {
      await addDoc(collection(db, 'tickets'), {
        id: ticketId,
        uid: user?.uid || 'GUEST',
        email: effectiveEmail,
        reason,
        message,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setSubmittedId(ticketId);
      showToast(`Ticket ${ticketId} created successfully.`, 'SUCCESS');
    } catch (error) {
      console.error('Error creating ticket:', error);
      showToast('Failed to create ticket. Please try again.', 'ERROR');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (submittedId) {
      navigator.clipboard.writeText(submittedId);
      setIsCopied(true);
      showToast('Ticket ID copied to clipboard.', 'SUCCESS');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedId(null);
    setIsCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={handleResetAndClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(5, 5, 10, 0.8)', backdropFilter: 'blur(12px)' }} 
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'var(--aqua)', // Branded Aqua identity
          borderRadius: 36,
          border: '1px solid rgba(0, 63, 73, 0.25)',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 40px 100px rgba(0, 63, 73, 0.15), inset 0 0 80px rgba(255, 255, 255, 0.4)',
        }}
      >
        <div style={{ padding: '40px 40px 48px' }}>
          {/* Close Button */}
          {!submittedId && (
            <button 
              onClick={handleResetAndClose}
              style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(0, 63, 73, 0.05)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: 'rgba(0, 63, 73, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={18} />
            </button>
          )}

          <AnimatePresence mode="wait">
            {!submittedId ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div style={{ marginBottom: 44, textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 14, marginBottom: 28,
                    padding: '8px 20px', background: 'var(--teal)', borderRadius: 14,
                    border: '1px solid var(--sunlit-rock)', boxShadow: '0 6px 15px rgba(0, 63, 73, 0.08)',
                    margin: '0 auto' 
                  }}>
                    <img src="/logos/modon_logo.png" alt="MODON" style={{ height: 18, width: 'auto', filter: 'brightness(0) invert(1)' }} />
                    <div style={{ width: 1, height: 14, background: 'rgba(255, 255, 255, 0.2)' }} />
                    <img src="/logos/insite_logo.png" alt="INSITE" style={{ height: 14, width: 'auto', filter: 'brightness(0) invert(1)' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 16, textAlign: 'left' }}>
                    <div style={{ 
                      width: 44, height: 44, borderRadius: 12, 
                      background: 'linear-gradient(135deg, var(--teal) 0%, #005663 100%)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 8px 16px rgba(0, 63, 73, 0.15)'
                    }}>
                      <ShieldAlert size={22} color="white" />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--teal)', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-primary)' }}>Initialize Support Ticket</h2>
                      <p style={{ fontSize: 11, color: 'rgba(0, 63, 73, 0.5)', fontWeight: 800, margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secure Support Protocol — TICKET-ST-32</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: '#002a30', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Email Identity</label>
                    <div style={{ 
                      padding: '14px 16px', background: 'white', 
                      border: `1px solid ${guestEmail && !isEmailValid ? '#B45309' : 'rgba(0, 63, 73, 0.15)'}`, borderRadius: 14,
                      display: 'flex', alignItems: 'center', gap: 10,
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02)',
                      transition: 'border-color 300ms'
                    }}>
                      <Mail size={14} color="rgba(0, 63, 73, 0.3)" />
                      {user ? (
                        <span style={{ fontSize: 14, color: 'var(--teal)', fontWeight: 700 }}>{user.email}</span>
                      ) : (
                        <input 
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="your.email@modon.com"
                          required
                          style={{ 
                            background: 'none', border: 'none', outline: 'none', 
                            fontSize: 14, color: 'var(--teal)', fontWeight: 700,
                            width: '100%'
                          }}
                        />
                      )}
                    </div>
                    {guestEmail && !isEmailValid && (
                      <p style={{ fontSize: 10, fontWeight: 800, color: '#B45309', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        * Please enter a valid email identity protocol
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: '#002a30', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Subject / Reason</label>
                    <input 
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Admin Access Request"
                      required
                      style={{ 
                        padding: '14px 16px', background: 'white', 
                        border: '1px solid rgba(0, 63, 73, 0.15)', borderRadius: 14,
                        color: 'var(--teal)', fontSize: 14, fontWeight: 600, outline: 'none',
                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02)'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: '#002a30', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Detailed Message</label>
                    <div style={{ position: 'relative' }}>
                      <textarea 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please provide specific context for your request..."
                        required
                        rows={4}
                        style={{ 
                          width: '100%', padding: '14px 16px', background: 'white', 
                          border: '1px solid rgba(0, 63, 73, 0.15)', borderRadius: 14,
                          color: 'var(--teal)', fontSize: 14, fontWeight: 600, outline: 'none', resize: 'none',
                          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02)'
                        }}
                      />
                      <MessageSquare size={14} style={{ position: 'absolute', bottom: 14, right: 14, opacity: 0.1 }} />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting || !isFormValid}
                    style={{ 
                      width: '100%', padding: '16px', borderRadius: 14, 
                      background: isFormValid ? 'var(--teal)' : 'rgba(0, 63, 73, 0.2)',
                      color: 'white', fontSize: 14, fontWeight: 900, border: 'none',
                      cursor: (isSubmitting || !isFormValid) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      marginTop: 8, boxShadow: isFormValid ? '0 10px 20px rgba(0, 63, 73, 0.15)' : 'none',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      transition: 'all 300ms'
                    }}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (
                      <>
                        Transmit Support Request
                        <Send size={16} />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '10px 0' }}
              >
                <div style={{ 
                  width: 72, height: 72, borderRadius: 24, background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <CheckCircle2 size={36} color="#10b981" />
                </div>
                
                <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--teal)', margin: '0 0 12px' }}>Request Dispatched</h2>
                <p style={{ color: 'rgba(0, 63, 73, 0.6)', fontSize: 14, lineHeight: 1.6, marginBottom: 32, fontWeight: 500 }}>
                  Your support packet has been successfully synchronized. Administrators have been notified of your request.
                </p>

                <div style={{ 
                  background: 'white', border: '1px solid rgba(0, 63, 73, 0.1)',
                  borderRadius: 24, padding: '24px', marginBottom: 32,
                  boxShadow: '0 10px 25px rgba(0, 63, 73, 0.05)'
                }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(0, 63, 73, 0.4)', textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block', marginBottom: 16 }}>
                    Unique Ticket Identity
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <code style={{ fontSize: 24, fontWeight: 900, color: 'var(--teal)', letterSpacing: '0.1em' }}>{submittedId}</code>
                      <button 
                        onClick={handleCopy}
                        style={{ 
                          background: 'rgba(0, 63, 73, 0.05)', border: '1px solid rgba(0, 63, 73, 0.1)',
                          padding: 8, borderRadius: 10, cursor: 'pointer', display: 'flex'
                        }}
                      >
                        {isCopied ? <ClipboardCheck size={18} color="#10b981" /> : <Copy size={18} color="var(--teal)" />}
                      </button>
                  </div>
                </div>

                <button 
                  onClick={handleResetAndClose}
                  style={{ 
                    width: '100%', padding: '16px', borderRadius: 14, background: 'var(--teal)',
                    color: 'white', fontSize: 14, fontWeight: 900, border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: '0 10px 20px rgba(0, 63, 73, 0.1)'
                  }}
                >
                  Return to Portal
                  <ChevronRight size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
