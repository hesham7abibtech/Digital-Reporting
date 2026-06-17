'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseBrowser } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import TwoFactorModal from './TwoFactorModal';
import { ShieldCheck, ChevronRight, Clock } from 'lucide-react';

const TEAL = '#003f49';
const GOLD = '#d0ab82';

/**
 * Centered "Secure your account" 2FA prompt shown after sign-in when the user has
 * no verified TOTP factor. "Remind me later" snoozes it for the current session
 * only (sessionStorage) — so it reappears on the next sign-in until 2FA is enabled.
 */
export default function Enable2FAAnnouncement() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const key = `reh-2fa-snooze-${user.uid}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(key)) return; // snoozed this session
    let active = true;
    supabaseBrowser.auth.mfa.listFactors().then(({ data }) => {
      const hasVerified = data?.totp?.some((f) => f.status === 'verified');
      if (active && !hasVerified) setShow(true);
    }).catch(() => {});
    return () => { active = false; };
  }, [user]);

  const remindLater = () => {
    if (user && typeof window !== 'undefined') sessionStorage.setItem(`reh-2fa-snooze-${user.uid}`, '1');
    setShow(false);
  };

  return (
    <>
      <AnimatePresence>
        {show && !enrollOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={remindLater}
            style={{ position: 'fixed', inset: 0, zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,63,73,0.35)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 24, boxShadow: '0 30px 80px rgba(0,63,73,0.3)', border: '1px solid #e8edf2', overflow: 'hidden' }}
            >
              <div style={{ height: 5, background: `linear-gradient(90deg, ${TEAL}, ${GOLD})` }} />
              <div style={{ padding: '32px 28px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, margin: '0 auto 18px', background: 'rgba(0,63,73,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={32} color={TEAL} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: TEAL, margin: '0 0 10px' }}>Secure your account</h2>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: '0 0 24px' }}>
                  Add two-factor authentication for an extra layer of protection. It only takes a minute and keeps your account safe even if your password is ever compromised.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={() => setEnrollOpen(true)}
                    style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${TEAL}, #015a68)`, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 10px 24px rgba(0,63,73,0.2)' }}>
                    Enable now <ChevronRight size={16} />
                  </button>
                  <button onClick={remindLater}
                    style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Clock size={14} /> Remind me later
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <TwoFactorModal isOpen={enrollOpen} mode="enroll" onClose={() => { setEnrollOpen(false); remindLater(); }} />
    </>
  );
}
