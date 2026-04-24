'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, ShieldCheck, Loader2, CheckCircle2, Circle, 
  Eye, EyeOff, ShieldAlert, ArrowRight, Home, Shield
} from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  // Hard Security Rules Validation
  const rules = [
    { label: 'At least 12 characters', met: password.length >= 12 },
    { label: 'Uppercase & Lowercase', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'Numeric Character', met: /\d/.test(password) },
    { label: 'Special Character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    { label: 'Passwords Match', met: password.length > 0 && password === confirmPassword }
  ];

  const allRulesMet = rules.every(r => r.met);

  useEffect(() => {
    if (!oobCode) {
      setError('Invalid or expired security token.');
      setIsVerifying(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setEmail(email);
        setIsVerifying(false);
      })
      .catch((err) => {
        console.error('Verification failed:', err);
        setError('The password reset link is invalid or has expired.');
        setIsVerifying(false);
      });
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesMet) return;
    if (!oobCode) return;

    setIsSubmitting(true);
    setError('');

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
      setIsSubmitting(false);
      
      // Auto-redirect after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update credentials.');
      setIsSubmitting(false);
    }
  };

  if (isVerifying) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--aqua)' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={48} color="var(--teal)" style={{ marginBottom: 20 }} />
          <p style={{ color: 'var(--teal)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 12 }}>Securing Handshake...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, var(--aqua) 0%, var(--haze) 50%, var(--cotton) 100%)',
      padding: 20, position: 'relative', overflow: 'hidden'
    }}>
      {/* Ambient Decorations */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(208, 171, 130, 0.15) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0, 63, 73, 0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%', maxWidth: 480,
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(0, 63, 73, 0.15)',
          borderRadius: 32, overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0, 63, 73, 0.1)',
          position: 'relative', zIndex: 10,
        }}
      >
        <div style={{ padding: '40px 40px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ 
              width: 64, height: 64, borderRadius: 20, background: 'var(--teal)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              margin: '0 auto 20px', boxShadow: '0 10px 25px rgba(0, 63, 73, 0.2)' 
            }}>
              <Lock size={32} color="white" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--teal)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>
              Security Update
            </h1>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, fontWeight: 600 }}>
              {email ? `Updating credentials for ${email}` : 'Establish new security credentials'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '20px 0' }}
              >
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(82, 97, 54, 0.1)', border: '2px solid var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <CheckCircle2 size={40} color="var(--status-success)" />
                </div>
                <h2 style={{ color: 'var(--status-success)', fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Credentials Updated</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 24 }}>Your security profile has been successfully re-encrypted. Redirecting to access portal...</p>
                <button onClick={() => router.push('/login')} style={{ background: 'var(--teal)', color: 'white', padding: '14px 32px', borderRadius: 16, border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto' }}>
                  Return Now <ArrowRight size={18} />
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {error && (
                  <div style={{ padding: '14px', borderRadius: 16, background: 'rgba(255, 76, 79, 0.08)', border: '1px solid rgba(255, 76, 79, 0.2)', color: 'var(--status-error)', fontSize: 13, fontWeight: 700, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <ShieldAlert size={18} /> {error}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="New Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{
                        width: '100%', padding: '18px 50px 18px 48px', borderRadius: 18,
                        background: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(0, 63, 73, 0.15)',
                        color: 'var(--teal)', fontSize: 15, fontWeight: 600, outline: 'none'
                      }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <ShieldCheck size={18} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{
                        width: '100%', padding: '18px 18px 18px 48px', borderRadius: 18,
                        background: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(0, 63, 73, 0.15)',
                        color: 'var(--teal)', fontSize: 15, fontWeight: 600, outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Hard Security Rules Checklist */}
                <div style={{ 
                  padding: '20px', background: 'rgba(0, 63, 73, 0.03)', borderRadius: 20, 
                  border: '1px solid rgba(0, 63, 73, 0.06)', display: 'grid', gridTemplateColumns: '1fr', gap: 10 
                }}>
                  <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', marginBottom: 4 }}>Security Requirements</p>
                  {rules.map((rule, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, transition: 'all 300ms' }}>
                      {rule.met ? (
                        <CheckCircle2 size={14} color="var(--status-success)" />
                      ) : (
                        <Circle size={14} color="rgba(0, 63, 73, 0.15)" />
                      )}
                      <span style={{ fontSize: 12, fontWeight: 700, color: rule.met ? 'var(--status-success)' : 'var(--text-dim)' }}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!allRulesMet || isSubmitting}
                  style={{
                    width: '100%', padding: '18px', borderRadius: 18,
                    background: allRulesMet ? 'var(--teal)' : 'rgba(0, 63, 73, 0.2)',
                    color: 'white', fontSize: 14, fontWeight: 900, border: 'none',
                    cursor: allRulesMet ? 'pointer' : 'not-allowed',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    boxShadow: allRulesMet ? '0 12px 28px rgba(0, 63, 73, 0.2)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    transition: 'all 400ms cubic-bezier(0.23, 1, 0.32, 1)'
                  }}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <>Update Credentials <Shield size={18} /></>}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div style={{
          padding: '16px', background: 'rgba(0, 63, 73, 0.04)', textAlign: 'center',
          borderTop: '1px solid rgba(0, 63, 73, 0.08)'
        }}>
          <button onClick={() => router.push('/login')} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 11, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Cancel and Return to Portal
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--aqua)' }}>
        <Loader2 className="animate-spin" size={32} color="var(--teal)" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
