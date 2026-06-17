'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { supabaseBrowser } from '@/lib/supabase';
import { ShieldCheck, X, Loader2, KeyRound, CheckCircle2, Copy, Trash2, Smartphone, Check } from 'lucide-react';

const TEAL = '#003f49';
const GOLD = '#d0ab82';

type Mode = 'enroll' | 'challenge';
type Status = 'idle' | 'error' | 'success';

interface Props {
  isOpen: boolean;
  mode: Mode;
  onClose: () => void;
  onVerified?: () => void; // challenge success (login) or enroll success
}

/** Premium segmented 6-digit code input with success / error states. */
function CodeBoxes({ value, status, onChange, onComplete }: {
  value: string; status: Status; onChange: (v: string) => void; onComplete: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cells = Array.from({ length: 6 }, (_, i) => value[i] || '');
  const focusedIndex = Math.min(value.length, 5);
  const locked = status === 'success';

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{ position: 'relative', display: 'flex', gap: 8, justifyContent: 'center' }}
    >
      <input
        ref={inputRef}
        value={value}
        disabled={locked}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 6);
          onChange(v);
          if (v.length === 6) onComplete(v);
        }}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="6-digit verification code"
        autoFocus
        maxLength={6}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'text', border: 'none' }}
      />
      {cells.map((d, i) => {
        const active = i === focusedIndex && status === 'idle' && !locked;
        const border = status === 'error' ? '#dc2626' : status === 'success' ? '#047857' : active ? TEAL : '#dde3ea';
        const color = status === 'error' ? '#dc2626' : status === 'success' ? '#047857' : TEAL;
        const bg = status === 'error' ? 'rgba(220,38,38,0.04)' : status === 'success' ? 'rgba(4,120,87,0.06)' : active ? 'rgba(0,63,73,0.04)' : '#fbfcfe';
        return (
          <div key={i} style={{
            width: 46, height: 56, borderRadius: 12, border: `2px solid ${border}`, background: bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800,
            color, fontVariantNumeric: 'tabular-nums', transition: 'border-color 160ms, background 160ms, box-shadow 160ms',
            boxShadow: active ? '0 0 0 4px rgba(0,63,73,0.08)' : 'none',
          }}>
            {d || (active ? <span style={{ width: 2, height: 24, background: TEAL, borderRadius: 2, animation: 'tf-caret 1s step-end infinite' }} /> : '')}
          </div>
        );
      })}
    </div>
  );
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
  const [success, setSuccess] = useState(false); // brief success flash
  const [copied, setCopied] = useState(false);
  const shake = useAnimationControls();

  const status: Status = success || done ? 'success' : error ? 'error' : 'idle';

  const init = useCallback(async () => {
    setLoading(true); setError(''); setDone(false); setSuccess(false); setCode('');
    try {
      const { data: list } = await supabaseBrowser.auth.mfa.listFactors();
      const verified = list?.totp?.find((f) => f.status === 'verified');

      if (mode === 'challenge') {
        if (!verified) { onVerified?.(); return; } // nothing to challenge
        setFactorId(verified.id);
        setEnrolled(true);
      } else {
        if (verified) { setEnrolled(true); setFactorId(verified.id); return; }
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

  const verify = useCallback(async (submitCode?: string) => {
    const c = (submitCode ?? code).trim();
    if (!factorId || c.length < 6) { setError('Enter the 6-digit code from your app.'); return; }
    setWorking(true); setError('');
    try {
      const { data: ch, error: chErr } = await supabaseBrowser.auth.mfa.challenge({ factorId });
      if (chErr) throw chErr;
      const { error: vErr } = await supabaseBrowser.auth.mfa.verify({ factorId, challengeId: ch.id, code: c });
      if (vErr) throw vErr;
      if (mode === 'challenge') {
        setSuccess(true);
        setTimeout(() => { onVerified?.(); onClose(); }, 800);
        return;
      }
      setDone(true);
      setTimeout(() => { onVerified?.(); onClose(); }, 1600);
    } catch (e: any) {
      setError(e.message || 'Invalid code. Please try again.');
      setCode('');
      shake.start({ x: [0, -9, 9, -7, 7, -4, 4, 0], transition: { duration: 0.45 } });
    } finally {
      setWorking(false);
    }
  }, [code, factorId, mode, onClose, onVerified, shake]);

  const disable = async () => {
    if (!factorId) return;
    setWorking(true); setError('');
    try {
      await supabaseBrowser.auth.mfa.unenroll({ factorId });
      onClose();
    } catch (e: any) { setError(e.message || 'Could not disable 2FA.'); }
    finally { setWorking(false); }
  };

  const copySecret = () => {
    if (!secret) return;
    navigator.clipboard?.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
      <style>{`@keyframes tf-caret { 50% { opacity: 0; } }`}</style>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={mode === 'challenge' ? undefined : onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,45,53,0.7)', backdropFilter: 'blur(12px)' }} />
      <motion.div initial={{ scale: 0.94, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 432, background: '#fff', borderRadius: 24, position: 'relative', zIndex: 1, padding: '32px 30px', boxShadow: '0 30px 80px rgba(0,0,0,0.4)' }}>
        {mode !== 'challenge' && (
          <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
        )}

        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: `linear-gradient(135deg, ${TEAL}, #015a68)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(0,63,73,0.3)' }}>
              <ShieldCheck size={24} color="#fff" />
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 900, color: TEAL, margin: 0, letterSpacing: '0.04em' }}>
              {mode === 'challenge' ? 'Two-Factor Verification' : enrolled ? 'Two-Factor Authentication' : 'Enable Two-Factor'}
            </h2>
          </div>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: '10px 0 0' }}>
            {mode === 'challenge' ? 'Enter the 6-digit code from your authenticator app.'
              : enrolled ? '2FA is active on your account.' : 'Add an authenticator app for an extra layer of security.'}
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Loader2 className="animate-spin" size={26} color={TEAL} /></div>
        ) : done ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '10px 0 4px' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 220 }}
              style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(4,120,87,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <CheckCircle2 size={36} color="#047857" />
            </motion.div>
            <div style={{ fontWeight: 800, color: '#047857', fontSize: 16 }}>Two-factor enabled</div>
            <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>Your account is now protected.</div>
          </motion.div>
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
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <div style={{ display: 'inline-flex', padding: 14, borderRadius: 18, border: '1px solid #e8edf2', background: '#fff', boxShadow: '0 6px 20px rgba(0,63,73,0.08)' }}>
                  {qrSvg.trim().startsWith('<svg')
                    ? <div style={{ width: 188, height: 188 }} dangerouslySetInnerHTML={{ __html: qrSvg }} />
                    : <img src={qrSvg} alt="Two-factor authentication QR code" width={188} height={188} style={{ display: 'block', width: 188, height: 188 }} />}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, lineHeight: 1.4 }}>
                  <Smartphone size={13} style={{ flexShrink: 0 }} /> Scan with Google Authenticator, Microsoft Authenticator, or Authy
                </div>
                {secret && (
                  <button onClick={copySecret} title="Copy setup key"
                    style={{ marginTop: 10, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', color: TEAL, fontSize: 11.5, fontWeight: 800, letterSpacing: '0.06em', display: 'inline-flex', alignItems: 'center', gap: 8, fontVariantNumeric: 'tabular-nums' }}>
                    {copied ? <><Check size={13} color="#047857" /> Copied</> : <><Copy size={13} /> {secret}</>}
                  </button>
                )}
              </div>
            )}

            <label style={{ fontSize: 10, fontWeight: 800, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
              <KeyRound size={13} /> Verification code
            </label>
            <motion.div animate={shake}>
              <CodeBoxes value={code} status={status} onChange={(v) => { setCode(v); if (error) setError(''); }} onComplete={(v) => verify(v)} />
            </motion.div>

            <div style={{ minHeight: 18, marginTop: 10, textAlign: 'center' }}>
              {error && <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>{error}</span>}
              {success && <span style={{ fontSize: 12, fontWeight: 800, color: '#047857' }}>Verified ✓</span>}
            </div>

            <button onClick={() => verify()} disabled={working || success} style={{ ...btnPrimary, width: '100%', marginTop: 6, opacity: working || success ? 0.85 : 1 }}>
              {working ? <Loader2 className="animate-spin" size={16} /> : success ? <Check size={16} /> : <ShieldCheck size={16} />}
              {working ? 'Verifying…' : success ? 'Verified' : mode === 'challenge' ? 'Verify & Continue' : 'Verify & Enable'}
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
