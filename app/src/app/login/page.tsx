'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Mail, Loader2, Globe, ShieldCheck, UserPlus, ArrowLeft, User,
  ShieldAlert, ChevronRight, CheckCircle2, Circle, Briefcase, Home, LifeBuoy, MailCheck, KeyRound,
} from 'lucide-react';
import TicketRequestModal from '@/components/shared/TicketRequestModal';
import TwoFactorModal from '@/components/shared/TwoFactorModal';

type AuthMode = 'login' | 'register' | 'forgot-password';
const DEFAULT_ALLOWED_DOMAINS = ['modon.com', 'insiteinternational.com'];
const TEAL = '#003f49';

function validatePassword(p: string): string | null {
  if (p.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(p)) return 'Password must contain an uppercase letter.';
  if (!/\d/.test(p)) return 'Password must contain a digit.';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(p)) return 'Password must contain a special character.';
  return null;
}

async function allowedDomains(): Promise<string[]> {
  try {
    const { data } = await supabaseBrowser.from('settings').select('data').eq('id', 'project').maybeSingle();
    const list = (data?.data as any)?.allowedDomains;
    return Array.isArray(list) && list.length ? list : DEFAULT_ALLOWED_DOMAINS;
  } catch { return DEFAULT_ALLOWED_DOMAINS; }
}

function LoginContent() {
  const router = useRouter();
  const { user, userProfile, loading, authError } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [migrationHint, setMigrationHint] = useState(false);
  const [emailSent, setEmailSent] = useState<null | 'migration' | 'reset' | 'register'>(null);
  const [pendingState, setPendingState] = useState<null | 'unverified' | 'unapproved'>(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState(false);

  // Route on auth state (verification → approval → dashboard).
  useEffect(() => {
    if (!user) return;
    if (mfaChallenge) return; // hold routing until 2FA code is verified
    if (authError?.includes('ACCESS REVOKED')) { setError(authError); setIsSubmitting(false); return; }
    if (!userProfile) return; // still loading profile
    if (!user.emailVerified && !userProfile.isVerified) { setPendingState('unverified'); setIsSubmitting(false); return; }
    if (!userProfile.isApproved) { setPendingState('unapproved'); setIsSubmitting(false); return; }
    sessionStorage.setItem('dashboard_session', 'active');
    router.push('/dashboard');
  }, [user, userProfile, authError, router, mfaChallenge]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMigrationHint(false); setIsSubmitting(true);
    try {
      const domains = await allowedDomains();
      const domain = email.split('@')[1]?.toLowerCase();
      if (!domain || !domains.includes(domain)) { setError(`Access denied: @${domain || '?'} is not an authorized domain.`); setIsSubmitting(false); return; }
      const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
      if (error) {
        if (/invalid login credentials/i.test(error.message)) { setMigrationHint(true); setError('Incorrect email or password.'); }
        else setError(error.message);
        setIsSubmitting(false);
        return;
      }
      // If 2FA is enabled, require the code before routing to the dashboard.
      const { data: aal } = await supabaseBrowser.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.nextLevel === 'aal2' && aal.currentLevel === 'aal1') { setMfaChallenge(true); setIsSubmitting(false); return; }
      // success → routing effect handles redirect once profile loads
    } catch (err: any) {
      setError(err.message || 'Sign-in failed.'); setIsSubmitting(false);
    }
  };

  const sendSetPasswordEmail = async (kind: 'migration' | 'reset') => {
    setError(''); setIsSubmitting(true);
    try {
      const domain = email.split('@')[1]?.toLowerCase();
      const domains = await allowedDomains();
      if (!domain || !domains.includes(domain)) { setError('Enter your authorized work email first.'); setIsSubmitting(false); return; }
      const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset` });
      if (error) throw error;
      setEmailSent(kind);
    } catch (err: any) {
      setError(err.message || 'Could not send the email. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setIsSubmitting(true);
    try {
      const domains = await allowedDomains();
      const domain = email.split('@')[1]?.toLowerCase();
      if (!domain || !domains.includes(domain)) { setError(`Registration is restricted to authorized domains (@${domains.join(', @')}).`); setIsSubmitting(false); return; }
      const pwdErr = validatePassword(password);
      if (pwdErr) { setError(pwdErr); setIsSubmitting(false); return; }
      const name = `${firstName} ${lastName}`.trim();
      const { data, error } = await supabaseBrowser.auth.signUp({
        email, password,
        options: { data: { name, department }, emailRedirectTo: `${window.location.origin}/login` },
      });
      if (error) throw error;
      if (data.user) {
        await fetch('/api/auth/register-profile', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.user.id, email, name, department }),
        }).catch(() => {});
      }
      setEmailSent('register');
    } catch (err: any) {
      setError(err.message || 'Registration failed.'); setIsSubmitting(false);
    }
  };

  const logoutAndReset = async () => {
    await supabaseBrowser.auth.signOut();
    setPendingState(null); setEmailSent(null); setMode('login'); setPassword('');
  };

  if (loading && !isSubmitting && !pendingState) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#002d35' }}><Loader2 className="animate-spin" size={32} color="#d0ab82" /></div>;
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px 12px 44px', borderRadius: 12, boxSizing: 'border-box',
    background: '#eef2ff', border: '1px solid rgba(0,63,73,0.15)', color: TEAL, fontSize: 14, outline: 'none', fontWeight: 600,
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 20, position: 'relative' }}>
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        style={{ width: '100%', maxWidth: 460, background: '#fff', border: '1px solid rgba(0,63,73,0.05)', borderRadius: 32, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,63,73,0.06)', position: 'relative' }}>
        <div style={{ padding: '40px 36px 24px' }}>
          <motion.button onClick={() => router.push('/')} whileHover={{ scale: 1.05 }}
            style={{ position: 'absolute', top: 20, right: 20, padding: 8, borderRadius: 12, border: '1px solid rgba(208,171,130,0.2)', background: 'transparent', cursor: 'pointer', color: TEAL }}>
            <Home size={16} />
          </motion.button>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ background: TEAL, padding: '10px 28px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 24px rgba(0,63,73,0.15)' }}>
              <img src="/logos/modon_logo.png" alt="MODON" style={{ height: 20, filter: 'brightness(0) invert(1)' }} />
              <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.2)' }} />
              <img src="/logos/insite_logo.png" alt="INSITE" style={{ height: 16, filter: 'brightness(0) invert(1)' }} />
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 style={{ fontSize: 26, color: TEAL, margin: '0 0 4px', letterSpacing: '0.1em', fontWeight: 900, textTransform: 'uppercase' }}>
              {mode === 'login' ? 'Access Portal' : mode === 'register' ? 'Create Account' : 'Reset Password'}
            </h1>
            <p style={{ color: '#94A3B8', fontSize: 10, margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              {mode === 'login' ? 'Sign in to the reporting dashboard' : mode === 'register' ? 'Register for project access' : 'We will email you a secure link'}
            </p>
          </div>

          <form onSubmit={mode === 'register' ? handleRegister : mode === 'forgot-password' ? (e) => { e.preventDefault(); sendSetPasswordEmail('reset'); } : handleLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'register' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required style={inputStyle} />
                  </div>
                  <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required style={{ ...inputStyle, paddingLeft: 16 }} />
                </div>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type="text" placeholder="Job Title" value={department} onChange={(e) => setDepartment(e.target.value)} required style={inputStyle} />
                </div>
              </>
            )}

            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,45,53,0.4)' }} />
              <input type="email" placeholder="Work Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
            </div>

            {mode !== 'forgot-password' && (
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,45,53,0.4)' }} />
                <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ ...inputStyle, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(0,45,53,0.4)', cursor: 'pointer' }}>
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            )}

            {mode === 'register' && password.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[{ l: '8+ chars', m: password.length >= 8 }, { l: 'Uppercase', m: /[A-Z]/.test(password) }, { l: 'Number', m: /\d/.test(password) }, { l: 'Special', m: /[!@#$%^&*(),.?":{}|<>]/.test(password) }].map((r, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: r.m ? 'rgba(0,63,73,0.08)' : 'rgba(0,63,73,0.04)', color: r.m ? TEAL : '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {r.m ? <CheckCircle2 size={10} /> : <Circle size={10} />} {r.l}
                  </span>
                ))}
              </div>
            )}

            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#dc2626', fontSize: 12, fontWeight: 700, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: 2 }} /> <span style={{ lineHeight: 1.4 }}>{error}</span>
              </motion.div>
            )}

            {/* Migration hint after a failed login */}
            {migrationHint && mode === 'login' && (
              <button type="button" onClick={() => sendSetPasswordEmail('migration')}
                style={{ padding: '11px 14px', borderRadius: 12, background: 'rgba(0,63,73,0.05)', border: '1px dashed rgba(0,63,73,0.25)', color: TEAL, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <KeyRound size={14} /> First sign-in since our security upgrade? Set your password
              </button>
            )}

            {mode === 'login' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setMode('forgot-password'); setError(''); }} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Forgot password?</button>
              </div>
            )}

            <button type="submit" disabled={isSubmitting} style={{ width: 'fit-content', padding: '12px 40px', borderRadius: 12, marginTop: 4, background: TEAL, color: '#fff', fontSize: 13, fontWeight: 900, border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 24px rgba(0,63,73,0.15)', textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'center' }}>
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : mode === 'login' ? <>Sign In <ChevronRight size={18} /></> : mode === 'register' ? <>Create Account <UserPlus size={18} /></> : <>Email Secure Link <ChevronRight size={18} /></>}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button onClick={() => { setError(''); setMigrationHint(false); setMode(mode === 'login' ? 'register' : 'login'); }}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto' }}>
              {mode === 'login' ? <><UserPlus size={14} /> Don&apos;t have an account? Register</> : <><ArrowLeft size={14} /> Back to Sign In</>}
            </button>
            <button onClick={() => setIsTicketOpen(true)} style={{ background: 'none', border: 'none', color: TEAL, fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: '28px auto 0', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <LifeBuoy size={14} /> Need Technical Support?
            </button>
          </div>
        </div>

        <div style={{ padding: '14px 36px', background: 'rgba(0,63,73,0.03)', borderTop: '1px solid rgba(0,63,73,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Globe size={12} color="#94A3B8" />
          <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Secure Project Access</span>
        </div>
      </motion.div>

      {/* Email-sent confirmation (migration / reset / register) */}
      <AnimatePresence>
        {emailSent && (
          <Overlay onClose={() => { setEmailSent(null); if (emailSent === 'register') logoutAndReset(); }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: `linear-gradient(135deg, ${TEAL}, #015a68)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 12px 30px rgba(0,63,73,0.3)' }}>
                <MailCheck size={34} color="#fff" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: TEAL, margin: '0 0 10px' }}>
                {emailSent === 'register' ? 'Check Your Inbox' : 'Secure Link Sent'}
              </h2>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
                {emailSent === 'migration'
                  ? <>We&apos;ve moved REH Digital to a new, <strong style={{ color: TEAL }}>ultra-secure, enterprise-grade platform</strong> with a more advanced database. To protect your account during this one-time migration, we&apos;ve emailed <strong style={{ color: TEAL }}>{email}</strong> a secure link to set your password — <span style={{ color: '#b58a3c', fontWeight: 700 }}>you&apos;re welcome to reuse your previous password</span>. We sincerely apologize for the brief, one-time inconvenience.</>
                  : emailSent === 'reset'
                  ? <>A secure password-reset link is on its way to <strong style={{ color: TEAL }}>{email}</strong>. Check your inbox and spam folder.</>
                  : <>Your account was created and is awaiting administrator approval. Verify your email at <strong style={{ color: TEAL }}>{email}</strong> to continue.</>}
              </p>
              <button onClick={() => { setEmailSent(null); if (emailSent === 'register') logoutAndReset(); else setMode('login'); }}
                style={{ width: '100%', padding: '14px', borderRadius: 14, background: TEAL, color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Back to Sign In
              </button>
            </div>
          </Overlay>
        )}
      </AnimatePresence>

      {/* Verification / approval pending */}
      <AnimatePresence>
        {pendingState && (
          <Overlay onClose={logoutAndReset}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#003f49,#002d35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid rgba(208,171,130,0.4)' }}>
                <ShieldCheck size={36} color="#d0ab82" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: TEAL, margin: '0 0 10px', textTransform: 'uppercase' }}>
                {pendingState === 'unverified' ? 'Verify Your Email' : 'Clearance Pending'}
              </h2>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
                {pendingState === 'unverified'
                  ? 'Please confirm your email address using the link we sent, then sign in again.'
                  : 'Your identity is verified. An administrator is reviewing your access clearance — you’ll be notified once approved.'}
              </p>
              <button onClick={logoutAndReset} style={{ width: '100%', padding: '14px', borderRadius: 14, background: TEAL, color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Return to Portal
              </button>
            </div>
          </Overlay>
        )}
      </AnimatePresence>

      <TwoFactorModal
        isOpen={mfaChallenge}
        mode="challenge"
        onClose={async () => { await supabaseBrowser.auth.signOut(); setMfaChallenge(false); }}
        onVerified={() => setMfaChallenge(false)}
      />

      <TicketRequestModal isOpen={isTicketOpen} onClose={() => setIsTicketOpen(false)} defaultReason="Login Portal Support" defaultMessage="I am experiencing issues accessing my account. Please assist." />
    </div>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,45,53,0.55)', backdropFilter: 'blur(14px)' }} />
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 28, padding: '40px 36px', position: 'relative', zIndex: 1, boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }}>
        {children}
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}><Loader2 className="animate-spin" size={32} color={TEAL} /></div>}>
      <LoginContent />
    </Suspense>
  );
}
