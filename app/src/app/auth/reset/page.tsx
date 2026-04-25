'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle2, Loader2, ShieldAlert, Eye, EyeOff, ChevronRight, Home } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'verifying' | 'input' | 'submitting' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!oobCode) {
      setStatus('error');
      setError('Invalid or expired reset link. Please request a new one.');
      return;
    }

    // Verify the reset code and get the email associated with it
    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setEmail(email);
        setStatus('input');
      })
      .catch((err) => {
        console.error('Code verification failed:', err);
        setStatus('error');
        setError('The password reset link is invalid or has already been used.');
      });
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setStatus('submitting');
    setError('');

    try {
      await confirmPasswordReset(auth, oobCode!, newPassword);
      setStatus('success');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setStatus('error');
      setError(err.message || 'Failed to reset password. Please try again.');
    }
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(160deg, var(--aqua) 0%, var(--haze) 50%, var(--cotton) 100%)',
    padding: 20, position: 'relative', overflow: 'hidden'
  };

  const cardStyle: React.CSSProperties = {
    width: '100%', maxWidth: 460, background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(40px)', border: '1px solid rgba(0, 63, 73, 0.1)',
    borderRadius: 28, overflow: 'hidden', padding: '48px 40px',
    boxShadow: '0 25px 60px rgba(0, 63, 73, 0.08)', position: 'relative', zIndex: 10
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '16px 16px 16px 44px', borderRadius: 16,
    background: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(0, 63, 73, 0.15)',
    color: 'var(--teal)', fontSize: 15, outline: 'none', transition: 'all 300ms',
    fontWeight: 600,
  };

  if (status === 'verifying') {
    return (
      <div style={containerStyle}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={48} color="var(--teal)" />
          <p style={{ marginTop: 16, color: 'var(--teal)', fontWeight: 600, letterSpacing: '0.05em' }}>Verifying security credentials...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        style={cardStyle}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
           <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 16,
              padding: '10px 24px', background: 'var(--teal)', borderRadius: 16,
              boxShadow: '0 10px 30px rgba(0, 63, 73, 0.15)', 
              border: '1px solid var(--sunlit-rock)', 
              margin: '0 auto 24px',
            }}>
              <img src="/logos/modon_logo.png" alt="MODON" style={{ height: 22, filter: 'brightness(0) invert(1)' }} />
              <div style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
              <img src="/logos/insite_logo.png" alt="INSITE" style={{ height: 18, filter: 'brightness(0) invert(1)' }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--teal)', margin: '0 0 8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Set New Password
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}>
              Resetting access for <span style={{ color: 'var(--teal)' }}>{email}</span>
            </p>
        </div>

        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <CheckCircle2 size={32} color="white" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--teal)', marginBottom: 12 }}>Security Updated</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.6 }}>
                Your password has been successfully reset. Redirecting you to the portal...
              </p>
            </motion.div>
          ) : status === 'error' ? (
            <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255, 76, 79, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <ShieldAlert size={32} color="var(--status-error)" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--status-error)', marginBottom: 12 }}>Link Invalid</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                {error}
              </p>
              <button 
                onClick={() => router.push('/login')}
                style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'var(--teal)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Home size={18} /> Back to Login
              </button>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="New Password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  style={{ ...inputStyle, paddingRight: 44 }} 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Confirm New Password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  style={inputStyle} 
                />
              </div>

              {/* Ultra Elite 5-Point Security Matrix */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '12px 8px', 
                padding: '16px',
                background: 'rgba(0, 63, 73, 0.03)',
                borderRadius: 20,
                border: '1px solid rgba(0, 63, 73, 0.05)'
              }}>
                {[
                  { label: 'Lower Case', met: /[a-z]/.test(newPassword) },
                  { label: 'Upper Case', met: /[A-Z]/.test(newPassword) },
                  { label: 'Special Char', met: /[^a-zA-Z0-9]/.test(newPassword) },
                  { label: 'Numeric', met: /\d/.test(newPassword) },
                  { label: '8 Characters', met: newPassword.length >= 8 }
                ].map((req, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: 6,
                    opacity: req.met ? 1 : 0.4,
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: req.met ? 'scale(1)' : 'scale(0.95)',
                    gridColumn: i >= 3 ? 'span 1.5' : 'span 1' // Center the bottom two
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 7,
                      background: req.met ? 'var(--teal)' : 'rgba(0, 0, 0, 0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: req.met ? '0 4px 12px rgba(0, 63, 73, 0.25)' : 'none'
                    }}>
                      <CheckCircle2 size={13} color={req.met ? 'white' : 'var(--text-dim)'} />
                    </div>
                    <span style={{ 
                      fontSize: 8, 
                      fontWeight: 800, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.08em',
                      color: req.met ? 'var(--teal)' : 'var(--text-dim)',
                      textAlign: 'center',
                      lineHeight: 1.2
                    }}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>

              {error && (
                <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255, 76, 79, 0.06)', border: '1px solid rgba(255, 76, 79, 0.15)', color: 'var(--status-error)', fontSize: 12, fontWeight: 700 }}>
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={status === 'submitting'}
                style={{
                  width: '100%', padding: '16px', borderRadius: 16, background: 'var(--teal)', color: 'white',
                  fontSize: 14, fontWeight: 800, border: 'none', cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.1em'
                }}
              >
                {status === 'submitting' ? <Loader2 className="animate-spin" size={18} /> : <>Reset Password <ChevronRight size={18} /></>}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--aqua)' }}><Loader2 className="animate-spin" size={32} color="var(--teal)" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
