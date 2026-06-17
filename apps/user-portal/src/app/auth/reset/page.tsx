'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Loader2, ShieldAlert, Eye, EyeOff, ChevronRight, Home, Sparkles } from 'lucide-react';

const TEAL = '#003f49';
const GOLD = '#d0ab82';

function ResetPasswordContent() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'verifying' | 'input' | 'submitting' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [isMigration, setIsMigration] = useState(false);

  // Wait for the Supabase recovery session that the email link establishes.
  useEffect(() => {
    let settled = false;
    const adopt = (session: any) => {
      if (!session?.user || settled) return;
      settled = true;
      setEmail(session.user.email || '');
      setIsMigration(!!(session.user.app_metadata?.must_set_password || session.user.user_metadata?.must_set_password));
      setStatus('input');
    };
    supabaseBrowser.auth.getSession().then(({ data }) => adopt(data.session));
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_e, session) => adopt(session));
    const timeout = setTimeout(() => {
      if (!settled) { setStatus('error'); setError('This link is invalid or has expired. Please request a new one.'); }
    }, 4000);
    return () => { sub.subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  const requirements = [
    { label: 'Lower Case', met: /[a-z]/.test(newPassword) },
    { label: 'Upper Case', met: /[A-Z]/.test(newPassword) },
    { label: 'Special Char', met: /[^a-zA-Z0-9]/.test(newPassword) },
    { label: 'Numeric', met: /\d/.test(newPassword) },
    { label: '8 Characters', met: newPassword.length >= 8 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!requirements.every((r) => r.met)) { setError('Password does not meet all requirements.'); return; }
    setStatus('submitting');
    setError('');
    try {
      const { data } = await supabaseBrowser.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Recovery session expired. Please request a new link.');
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || 'Failed to set password.');
      // Replace the recovery session with a clean, full session using the new
      // credentials — the recovery JWT still carries the stale `must_set_password`
      // claim, so without this the user can be re-prompted to set a password.
      await supabaseBrowser.auth.signInWithPassword({ email, password: newPassword }).catch(() => {});
      setStatus('success');
      setTimeout(() => router.push('/dashboard'), 3200);
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Failed to set password. Please try again.');
    }
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(circle at 50% 0%, #eaf2f3 0%, #f8fafc 60%)', padding: 20, position: 'relative', overflow: 'hidden',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '15px 44px 15px 44px', borderRadius: 14, boxSizing: 'border-box',
    background: '#fbfcfe', border: '1px solid rgba(0,63,73,0.15)', color: TEAL, fontSize: 15, outline: 'none', fontWeight: 600,
  };

  if (status === 'verifying') {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', padding: '16px 28px', borderRadius: 18, boxShadow: '0 10px 30px rgba(0,42,48,0.06)' }}>
          <Loader2 className="animate-spin" size={22} color={TEAL} />
          <p style={{ color: TEAL, fontWeight: 700, fontSize: 14 }}>Verifying your secure link…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <style>{SUCCESS_KEYFRAMES}</style>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 480, background: '#fff', border: '1px solid rgba(0,63,73,0.06)', borderRadius: 28,
          overflow: 'hidden', padding: '44px 40px', boxShadow: '0 25px 60px rgba(0,63,73,0.08)', position: 'relative', zIndex: 10 }}>

        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <SuccessView key="success" migration={isMigration} />
          ) : status === 'error' ? (
            <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
                <ShieldAlert size={32} color="#dc2626" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#dc2626', marginBottom: 12 }}>Link Invalid</h2>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{error}</p>
              <button onClick={() => router.push('/login')}
                style={{ width: '100%', padding: '14px', borderRadius: 14, background: TEAL, color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Home size={18} /> Back to Login
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Header / migration apology */}
              <div style={{ textAlign: 'center', marginBottom: 26 }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, margin: '0 auto 18px', background: `linear-gradient(135deg, ${TEAL}, #015a68)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 26px rgba(0,63,73,0.25)' }}>
                  <Lock size={26} color="#fff" />
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: TEAL, margin: '0 0 8px', letterSpacing: '0.02em' }}>
                  {isMigration ? 'Set Your New Password' : 'Reset Password'}
                </h1>
                {isMigration ? (
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                    We&apos;ve moved REH Digital to a new, <strong style={{ color: TEAL }}>ultra-secure, enterprise-grade platform</strong> with a more advanced database.
                    For your protection, a one-time password reset is required on your first sign-in — please set your password for <strong style={{ color: TEAL }}>{email}</strong>.
                    <br /><span style={{ color: GOLD, fontWeight: 700 }}>You&apos;re welcome to reuse your previous password.</span> We sincerely apologize for the one-time inconvenience.
                  </p>
                ) : (
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                    Setting a new password for <strong style={{ color: TEAL }}>{email}</strong>
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type={showPassword ? 'text' : 'password'} placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={inputStyle} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type={showPassword ? 'text' : 'password'} placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={inputStyle} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, padding: 14, background: 'rgba(0,63,73,0.03)', borderRadius: 16 }}>
                  {requirements.map((req, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all 250ms' }}>
                      <div style={{ width: 22, height: 22, borderRadius: 7, background: req.met ? TEAL : 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 250ms' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={req.met ? '#fff' : '#94a3b8'} strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span style={{ fontSize: 7.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: req.met ? TEAL : '#64748b', textAlign: 'center', lineHeight: 1.2 }}>{req.label}</span>
                    </div>
                  ))}
                </div>

                {error && (
                  <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#dc2626', fontSize: 12, fontWeight: 700 }}>{error}</div>
                )}

                <button type="submit" disabled={status === 'submitting'}
                  style={{ width: '100%', padding: '15px', borderRadius: 14, background: `linear-gradient(135deg, ${TEAL}, #015a68)`, color: '#fff', fontSize: 14, fontWeight: 800, border: 'none', cursor: status === 'submitting' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.08em', boxShadow: '0 8px 22px rgba(0,63,73,0.25)' }}>
                  {status === 'submitting' ? <Loader2 className="animate-spin" size={18} /> : <>Secure My Account <ChevronRight size={18} /></>}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function SuccessView({ migration }: { migration: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '12px 0' }}>
      <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 26px' }}>
        {/* radiating rings */}
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${GOLD}`, animation: `apc-ring 2s ${i * 0.4}s ease-out infinite`, opacity: 0 }} />
        ))}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          style={{ position: 'absolute', inset: 18, borderRadius: '50%', background: `linear-gradient(135deg, ${TEAL}, #015a68)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 30px rgba(0,63,73,0.35)' }}>
          <svg width="46" height="46" viewBox="0 0 52 52">
            <motion.path d="M14 27 l8 8 l16 -18" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.5, ease: 'easeOut' }} />
          </svg>
        </motion.div>
        <Sparkles size={18} color={GOLD} style={{ position: 'absolute', top: -2, right: 6, animation: 'apc-twinkle 1.6s ease-in-out infinite' }} />
        <Sparkles size={12} color={GOLD} style={{ position: 'absolute', bottom: 8, left: 0, animation: 'apc-twinkle 1.6s 0.5s ease-in-out infinite' }} />
      </div>
      <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        style={{ fontSize: 24, fontWeight: 900, margin: '0 0 10px', letterSpacing: '0.01em',
          background: `linear-gradient(90deg, ${GOLD}, ${TEAL}, ${GOLD})`, backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', animation: 'apc-grad 2.4s linear infinite' }}>
        {migration ? 'Welcome Back' : 'All Set'}
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
        Your account is secured on the new platform.<br />Taking you to your dashboard…
      </motion.p>
    </motion.div>
  );
}

const SUCCESS_KEYFRAMES = `
@keyframes apc-ring { 0% { transform: scale(0.6); opacity: 0.5; } 100% { transform: scale(1.25); opacity: 0; } }
@keyframes apc-twinkle { 0%,100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.15); } }
@keyframes apc-grad { to { background-position: 200% center; } }
`;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}><Loader2 className="animate-spin" size={32} color={TEAL} /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
