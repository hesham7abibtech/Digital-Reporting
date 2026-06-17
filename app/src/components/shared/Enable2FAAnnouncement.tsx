'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseBrowser } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import TwoFactorModal from './TwoFactorModal';
import { ShieldCheck, X, ChevronRight } from 'lucide-react';

const TEAL = '#003f49';

/**
 * One-time, dismissible "Enable 2FA" announcement shown after sign-in when the
 * user has no verified TOTP factor. Opens the optional enroll flow.
 */
export default function Enable2FAAnnouncement() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const key = `reh-2fa-dismissed-${user.uid}`;
    if (typeof window !== 'undefined' && localStorage.getItem(key)) return;
    let active = true;
    supabaseBrowser.auth.mfa.listFactors().then(({ data }) => {
      const hasVerified = data?.totp?.some((f) => f.status === 'verified');
      if (active && !hasVerified) setShow(true);
    }).catch(() => {});
    return () => { active = false; };
  }, [user]);

  const dismiss = () => {
    if (user && typeof window !== 'undefined') localStorage.setItem(`reh-2fa-dismissed-${user.uid}`, '1');
    setShow(false);
  };

  return (
    <>
      <AnimatePresence>
        {show && !enrollOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1500, width: 340, background: '#fff', borderRadius: 18,
              boxShadow: '0 20px 50px rgba(0,63,73,0.2)', border: '1px solid #e8edf2', overflow: 'hidden' }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${TEAL}, #d0ab82)` }} />
            <div style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'rgba(0,63,73,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={20} color={TEAL} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: TEAL }}>Secure your account</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, lineHeight: 1.5 }}>
                    Add two-factor authentication for an extra layer of protection. It only takes a minute.
                  </div>
                </div>
                <button onClick={dismiss} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={16} /></button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button onClick={() => setEnrollOpen(true)}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${TEAL}, #015a68)`, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  Enable now <ChevronRight size={14} />
                </button>
                <button onClick={dismiss} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <TwoFactorModal isOpen={enrollOpen} mode="enroll" onClose={() => { setEnrollOpen(false); dismiss(); }} />
    </>
  );
}
