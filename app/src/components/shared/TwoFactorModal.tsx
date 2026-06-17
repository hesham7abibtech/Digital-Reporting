'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseBrowser } from '@/lib/supabase';
import { ShieldCheck, X, Loader2, KeyRound, CheckCircle2, Copy, Trash2, Smartphone } from 'lucide-react';

const TEAL = '#003f49';
const GOLD = '#d0ab82';

type Mode = 'enroll' | 'challenge';

interface Props {
  isOpen: boolean;
  mode: Mode;
  onClose: () => void;
  onVerified?: () => void; // challenge success (login) or enroll success
}

/**
 * Supabase TOTP two-factor:
 *  - mode="enroll": optional setup (QR + manual secret) and management/disable.
 *  - mode="challenge": prompt for a 6-digit code at sign-in when 2FA is enabled.
 */
export default function TwoFactorModal({ isOpen, mode, onClose, onVerified }: Props) {
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false); // already has a verified factor
  const [done, setDone] = useState(false);

  const init = useCallback(async () => {
    setLoading(true); setError(''); setDone(false); setCode('');
    try {
      const { data: list } = await supabaseBrowser.auth.mfa.listFactors();
      const verified = list?.totp?.find((f) => f.status === 'verified');

      if (mode === 'challenge') {
        if (!verified) { onVerified?.(); return; } // nothing to challenge
        setFactorId(verified.id);
        setEnrolled(true);
      } else {
        if (verified) { setEnrolled(true); setFactorId(verified.id); return; }
        // Clean any stale unverified factor, then enroll fresh.
        const stale = list?.all?.find((f) => f.status === 'unverified');
        if (stale) await supabaseBrowser.auth.mfa.unenroll({ factorId: stale.id });
        const { data, error } = await supabaseBrowser.auth.mfa.enroll({ factorType: 'totp' });
        if (error) throw error;
        setFactorId(data.id);
        setQrSvg(data.totp.qr_code);
        setSecret(data.totp.secret);
      }
    } catch (e: any) {
      setError(e.message || 'Could not initialize 2FA.');
    } finally {
      setLoading(false);
    }
  }, [mode, onVerified]);

  useEffect(() => { if (isOpen) init(); }, [isOpen, init]);

  const verify = async () => {
    if (!factorId || code.trim().length < 6) { setError('Enter the 6-digit code from your app.'); return; }
    setWorking(true); setError('');
    try {
      const { data: ch, error: chErr } = await supabaseBrowser.auth.mfa.challenge({ factorId });
      if (chErr) throw chErr;
      const { error: vErr } = await supabaseBrowser.auth.mfa.verify({ factorId, challengeId: ch.id, code: code.trim() });
      if (vErr) throw vErr;
      if (mode === 'challenge') { onVerified?.(); onClose(); return; }
      setDone(true);
      setTimeout(() => { onVerified?.(); onClose(); }, 1600);
    } catch (e: any) {
      setError(e.message || 'Invalid code. Please try again.');
    } finally {
      setWorking(false);
    }
  };

  const disable = async () => {
    if (!factorId) return;
    setWorking(true); setError('');
    try {
      await supabaseBrowser.auth.mfa.unenroll({ factorId });
      onClose();
    } catch (e: any) { setError(e.message || 'Could not disable 2FA.'); }
    finally { setWorking(false); }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={mode === 'challenge' ? undefined : onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,45,53,0.7)', backdropFilter: 'blur(12px)' }} />
      <motion.div initial={{ scale: 0.94, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 24, position: 'relative', zIndex: 1, padding: '32px 30px', boxShadow: '0 30px 80px rgba(0,0,0,0.4)' }}>
        {mode !== 'challenge' && (
          <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
        )}

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px', background: `linear-gradient(135deg, ${TEAL}, #015a68)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 22px rgba(0,63,73,0.3)' }}>
            <ShieldCheck size={28} color="#fff" />
          </div>
          <h2 style={{ fontSize: 19, fontWeight: 900, color: TEAL, margin: 0 }}>
            {mode === 'challenge' ? 'Two-Factor Verification' : enrolled ? 'Two-Factor Authentication' : 'Enable Two-Factor'}
          </h2>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: '6px 0 0' }}>
            {mode === 'challenge' ? 'Enter the 6-digit code from your authenticator app.'
              : enrolled ? '2FA is active on your account.' : 'Add an authenticator app for an extra layer of security.'}
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Loader2 className="animate-spin" size={26} color={TEAL} /></div>
        ) : done ? (
          <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
            <CheckCircle2 size={48} color="#047857" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 800, color: '#047857', fontSize: 15 }}>Two-factor enabled</div>
          </div>
        ) : enrolled && mode === 'enroll' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', color: '#047857', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
              <CheckCircle2 size={16} /> Authenticator app linked and active.
            </div>
            <button onClick={disable} disabled={working} style={{ ...btnGhost, color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)', width: '100%' }}>
              {working ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />} Disable 2FA
            </button>
          </div>
        ) : (
          <>
            {mode === 'enroll' && qrSvg && (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ display: 'inline-flex', padding: 10, borderRadius: 14, border: '1px solid #e8edf2', background: '#fff' }}
                  dangerouslySetInnerHTML={{ __html: qrSvg }} />
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Smartphone size={13} /> Scan with Google Authenticator / Authy
                </div>
                {secret && (
                  <button onClick={() => navigator.clipboard?.writeText(secret)} style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', color: TEAL, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Copy size={12} /> {secret}
                  </button>
                )}
              </div>
            )}
            <label style={{ fontSize: 10, fontWeight: 800, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <KeyRound size={13} /> Verification code
            </label>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="000000"
              style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 12, border: '1px solid #dde3ea', fontSize: 22, letterSpacing: '0.4em', textAlign: 'center', fontWeight: 800, color: TEAL, outline: 'none' }} />
            {error && <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: '#dc2626' }}>{error}</div>}
            <button onClick={verify} disabled={working} style={{ ...btnPrimary, width: '100%', marginTop: 16 }}>
              {working ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />} {mode === 'challenge' ? 'Verify & Continue' : 'Verify & Enable'}
            </button>
          </>
        )}
        {error && (enrolled || loading) && <div style={{ marginTop: 12, fontSize: 12, color: '#dc2626', fontWeight: 700, textAlign: 'center' }}>{error}</div>}
      </motion.div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 22px', borderRadius: 12, border: 'none',
  background: `linear-gradient(135deg, ${TEAL}, #015a68)`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,63,73,0.25)',
};
const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 18px', borderRadius: 12,
  border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
};
