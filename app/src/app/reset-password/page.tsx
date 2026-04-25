'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, ShieldCheck, Loader2, CheckCircle2, Circle, 
  Eye, EyeOff, ShieldAlert, ArrowRight, Shield,
  Fingerprint, Activity, Zap, Home, ChevronRight
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

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
  const [handshakeStep, setHandshakeStep] = useState(0);

  const isMockToken = oobCode?.startsWith('mock_token_');

  // Hard Security Rules Validation
  const rules = [
    { label: 'Minimum 12 Characters', met: password.length >= 12 },
    { label: 'Mixed Case Architecture', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'Numeric Identifier', met: /\d/.test(password) },
    { label: 'Special Symbol Entropy', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    { label: 'Identity Synchronized', met: password.length > 0 && password === confirmPassword }
  ];

  const allRulesMet = rules.every(r => r.met);

  useEffect(() => {
    // Handshake Simulation
    const timer1 = setTimeout(() => setHandshakeStep(1), 1000);
    const timer2 = setTimeout(() => setHandshakeStep(2), 2000);

    const verifyRequest = async () => {
      try {
        if (!oobCode) {
          setError('Invalid Security Token. Direct access is prohibited.');
          setIsVerifying(false);
          return;
        }

        // 1. First verify with Firebase (standard check)
        let verifiedEmail = '';
        if (isMockToken) {
          verifiedEmail = 'authorized.test.user@modon.com';
        } else {
          try {
            verifiedEmail = await verifyPasswordResetCode(auth, oobCode);
          } catch (err: any) {
            console.error('Firebase token verification failed:', err);
            setError('The security token has expired or is invalid.');
            setIsVerifying(false);
            return;
          }
        }

        // 2. Secondary Industrial Security Layer: Firestore Policy Check
        const requestDoc = await getDoc(doc(db, 'passwordResetRequests', oobCode));
        if (requestDoc.exists()) {
          const data = requestDoc.data();
          
          // One-time use policy
          if (data.used) {
            setError('This security link has already been utilized. Please request a new one.');
            setIsVerifying(false);
            return;
          }

          // 30-minute expiration policy
          const createdAt = new Date(data.createdAt).getTime();
          const now = new Date().getTime();
          const diffInMinutes = (now - createdAt) / (1000 * 60);

          if (diffInMinutes > 30) {
            setError('This security link has expired (30-minute policy). Please request a new link.');
            setIsVerifying(false);
            return;
          }
        } else if (!isMockToken) {
          // If the record doesn't exist and it's not a mock, it's an untracked or legacy link
          console.warn('[SECURITY] Reset request record not found for oobCode:', oobCode);
          setError('Security protocol mismatch. Please initiate a new recovery request.');
          setIsVerifying(false);
          return;
        }

        setEmail(verifiedEmail);
        setTimeout(() => setIsVerifying(false), 2800);
      } catch (err: any) {
        console.error('Handshake failure:', err);
        setError('A technical failure occurred during the security handshake.');
        setIsVerifying(false);
      }
    };

    verifyRequest();

    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [oobCode, isMockToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesMet) return;
    if (!oobCode) return;

    setIsSubmitting(true);
    setError('');

    try {
      if (isMockToken) {
        // Simulate network delay for mock
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else {
        await confirmPasswordReset(auth, oobCode, password);
        // Mark as used in our security tracker
        await updateDoc(doc(db, 'passwordResetRequests', oobCode), {
          used: true,
          completedAt: new Date().toISOString()
        }).catch(e => console.warn('Failed to update usage status:', e));
      }
      
      setSuccess(true);
      setIsSubmitting(false);
      
      setTimeout(() => {
        router.push('/login');
      }, 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to re-encrypt credentials.');
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '16px 16px 16px 44px', borderRadius: 16,
    background: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(0, 63, 73, 0.15)',
    color: 'var(--teal)', fontSize: 15, outline: 'none', transition: 'all 300ms',
    fontWeight: 600, boxShadow: 'inset 0 2px 4px rgba(0, 63, 73, 0.02)',
  };

  if (isVerifying) {
    return (
      <div style={{ 
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
        background: 'linear-gradient(160deg, var(--aqua) 0%, var(--haze) 50%, var(--cotton) 100%)',
        overflow: 'hidden', position: 'relative' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 20,
          background: 'rgba(255, 255, 255, 0.6)',
          padding: '20px 32px',
          borderRadius: 24,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 63, 73, 0.1)',
          boxShadow: '0 15px 40px rgba(0, 42, 48, 0.08)',
          position: 'relative',
          zIndex: 10
        }}>
          <Loader2 className="animate-spin" size={28} color="var(--teal)" />
          
          <div style={{ height: 20, overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
              {handshakeStep === 0 && (
                <motion.p key="0" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} style={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: 11, fontWeight: 900, color: 'var(--teal)', margin: 0 }}>Establishing Secure Uplink</motion.p>
              )}
              {handshakeStep === 1 && (
                <motion.p key="1" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} style={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: 11, fontWeight: 900, color: 'var(--teal)', margin: 0 }}>Verifying Identity Token</motion.p>
              )}
              {handshakeStep === 2 && (
                <motion.p key="2" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} style={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: 11, fontWeight: 900, color: 'var(--teal)', margin: 0 }}>Synchronizing Protocols</motion.p>
              )}
            </AnimatePresence>
          </div>
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
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(208, 171, 130, 0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0, 63, 73, 0.1) 0%, transparent 70%)', filter: 'blur(80px)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        style={{
          width: '100%', maxWidth: 460,
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(0, 63, 73, 0.1)',
          borderRadius: 28, overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 63, 73, 0.08), 0 8px 24px rgba(0, 63, 73, 0.04)',
          position: 'relative', zIndex: 10,
        }}
      >
        <div style={{ padding: '32px 36px 28px' }}>
          {/* Home Button */}
          <motion.button
            onClick={() => router.push('/')}
            whileHover={{ scale: 1.08, background: 'rgba(0, 63, 73, 0.08)', borderColor: 'var(--teal)' }}
            whileTap={{ scale: 0.95 }}
            style={{
              position: 'absolute', top: 20, right: 20, padding: 8,
              borderRadius: 12, border: '1px solid rgba(0, 63, 73, 0.08)',
              background: 'rgba(0, 63, 73, 0.03)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 20,
            }}
          >
            <Home size={16} color="var(--teal)" />
          </motion.button>

          {/* Unified Branded Insignia */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 16,
              padding: '10px 24px', background: 'var(--teal)', borderRadius: 16,
              boxShadow: '0 10px 30px rgba(0, 63, 73, 0.15)', 
              border: '1px solid var(--sunlit-rock)', 
              width: 'max-content', margin: '0 auto 12px',
            }}>
              <img src="/logos/modon_logo.png" alt="MODON" style={{ height: 26, filter: 'brightness(0) invert(1)' }} />
              <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.2)' }} />
              <img src="/logos/insite_logo.png" alt="INSITE" style={{ height: 22, filter: 'brightness(0) invert(1)' }} />
            </div>
            <h1 style={{ fontSize: 24, color: 'var(--teal)', margin: '0 0 6px', letterSpacing: '0.15em', fontWeight: 900, textTransform: 'uppercase' }}>
              Vault Recovery
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-dim)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.7 }}>
              <Activity size={12} color="var(--sunlit-rock)" /> Verified Profile: {email || 'Anonymous'}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', padding: '20px 0' }}
              >
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, var(--teal) 0%, #005663 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(0, 63, 73, 0.2)' }}>
                  <ShieldCheck size={32} color="white" />
                </div>
                <h2 style={{ color: 'var(--teal)', fontSize: 22, fontWeight: 900, marginBottom: 12, letterSpacing: '-0.02em' }}>VAULT ENCRYPTED</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 32, lineHeight: 1.6, fontWeight: 500 }}>Your security credentials have been re-indexed successfully. Access protocols have been restored.</p>
                <button onClick={() => router.push('/login')} style={{ width: '100%', background: 'var(--teal)', color: 'white', padding: '16px', borderRadius: 16, border: 'none', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: '0 8px 24px rgba(0,63,73,0.15)' }}>
                  Enter Portal <ArrowRight size={18} />
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                {error && (
                  <motion.div 
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255, 76, 79, 0.06)', border: '1px solid rgba(255, 76, 79, 0.15)', color: 'var(--status-error)', fontSize: 12, fontWeight: 700, display: 'flex', gap: 10, alignItems: 'center' }}
                  >
                    <ShieldAlert size={14} /> {error}
                  </motion.div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="NEW CREDENTIAL"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ ...inputStyle, paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 0 }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <ShieldCheck size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="CONFIRM CREDENTIAL"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Hard Security Rules Checklist */}
                <div style={{ 
                  padding: '16px', background: 'rgba(0, 63, 73, 0.03)', borderRadius: 16, 
                  border: '1px solid rgba(0, 63, 73, 0.06)', display: 'grid', gridTemplateColumns: '1fr', gap: 8 
                }}>
                  {rules.map((rule, idx) => (
                    <motion.div 
                      key={idx} 
                      animate={{ opacity: rule.met ? 1 : 0.85 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                      {rule.met ? (
                        <CheckCircle2 size={12} color="var(--status-success)" />
                      ) : (
                        <Circle size={12} color="#64748b" />
                      )}
                      <span style={{ fontSize: 10, fontWeight: 800, color: rule.met ? 'var(--teal)' : '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {rule.label}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!allRulesMet || isSubmitting}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 16,
                    background: allRulesMet ? 'var(--teal)' : 'rgba(0, 63, 73, 0.08)',
                    color: allRulesMet ? 'white' : 'var(--text-dim)', fontSize: 14, fontWeight: 900, border: 'none',
                    cursor: allRulesMet ? 'pointer' : 'not-allowed',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    boxShadow: allRulesMet ? '0 8px 24px rgba(0,63,73,0.15)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    transition: 'all 300ms'
                  }}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <>Initialize Cryptography <Zap size={16} /></>}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div style={{
          padding: '14px 36px', background: 'rgba(0, 63, 73, 0.03)',
          borderTop: '1px solid rgba(0, 63, 73, 0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <Fingerprint size={12} color="var(--text-dim)" />
          <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Encrypted Security Handshake
          </span>
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
