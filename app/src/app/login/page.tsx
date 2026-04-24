'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserSessionPersistence,
  sendEmailVerification
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { waitForPendingWrites, doc, updateDoc } from 'firebase/firestore';
import { createUserProfile, getProjectMetadata, logRegistrationEvent } from '@/services/FirebaseService';
import { useAuth } from '@/context/AuthContext';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';
import { ProjectMetadata } from '@/lib/types';
import { getApiEndpoint } from '@/lib/apiConfig';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Lock, Mail, Loader2, Globe, ShieldCheck,
  UserPlus, ArrowLeft, User, ShieldAlert,
  ChevronRight, Fingerprint, Database, Cpu,
  CheckCircle2, Eye, EyeOff, Circle, Briefcase, Home, LifeBuoy
} from 'lucide-react';
import TicketRequestModal from '@/components/shared/TicketRequestModal';

type AuthMode = 'login' | 'register' | 'forgot-password';

const DEFAULT_ALLOWED_DOMAINS = ['modon.com', 'insiteinternational.com'];

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/\d/.test(password)) return 'Password must contain at least one digit.';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character.';
  return null;
}

function LoginContent() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const [emailNotFound, setEmailNotFound] = useState(false);
  const [authStatusMode, setAuthStatusMode] = useState<'none' | 'unverified' | 'unapproved'>('none');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [resendTimer, setResendTimer] = useState(0);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Real-time Verification Observer
  useEffect(() => {
    if (!showRegistrationSuccess) return;
    if (authStatusMode !== 'unverified') return;

    const checkVerification = async () => {
      if (auth.currentUser) {
        try {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified) {
            setIsEmailVerified(true);
            setAuthStatusMode('unapproved');
          }
        } catch (err) {
          console.error('Verification sync failed:', err);
        }
      }
    };

    const interval = setInterval(checkVerification, 1500);
    window.addEventListener('focus', checkVerification);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkVerification);
    };
  }, [showRegistrationSuccess, authStatusMode]);


  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0 && resendStatus === 'sent') {
      setResendStatus('idle');
    }
  }, [resendTimer, resendStatus]);

  const router = useRouter();
  const { user, userProfile, loading, authError } = useAuth();

  // Sync isEmailVerified from Firebase Auth AND Firestore profile
  useEffect(() => {
    if (user?.emailVerified || userProfile?.isVerified) {
      setIsEmailVerified(true);
    }
  }, [user, userProfile]);

  useEffect(() => {
    if (loading) return;

    // ISOLATION PROTOCOL: Only react to auth state if dashboard_session is active
    // OR if the user is actively submitting login credentials (isSubmitting).
    // This prevents cross-contamination from the admin portal.
    const hasDashboardSession = sessionStorage.getItem('dashboard_session') === 'active';
    const hasAdminSessionOnly = sessionStorage.getItem('admin_session') === 'active' && !hasDashboardSession;
    
    // If the user signed in through admin portal only, don't auto-redirect here
    if (user && hasAdminSessionOnly && !isSubmitting) {
      return;
    }

    if (user && authError) {
      setError(`Authentication error: ${authError}`);
      setIsSubmitting(false);
      return;
    }
    if (user && userProfile) {
      // Determine verification from BOTH Firebase Auth AND Firestore profile
      const isVerified = user.emailVerified || userProfile.isVerified === true;

      // 1. Check Email Verification First
      if (!isVerified) {
        setAuthStatusMode('unverified');
        setShowRegistrationSuccess(true);
        setIsSubmitting(false);
        return;
      }

      // Mark as verified since we passed the check
      setIsEmailVerified(true);

      // 2. Check Admin Approval
      if (!userProfile.isApproved) {
        setAuthStatusMode('unapproved');
        setShowRegistrationSuccess(true);
        setIsSubmitting(false);
        return;
      }

      // BOTH verified AND approved: skip modal, go straight to dashboard
      sessionStorage.setItem('dashboard_session', 'active');
      router.push('/dashboard');
    }
  }, [user, userProfile, loading, authError, router, isSubmitting]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const projectMetadata = await getProjectMetadata() as ProjectMetadata | null;
      const allowed = projectMetadata?.allowedDomains?.length ? projectMetadata.allowedDomains : DEFAULT_ALLOWED_DOMAINS;
      const userDomain = email.split('@')[1]?.toLowerCase();
      if (!userDomain || !allowed.includes(userDomain)) {
        setError(`Access denied: Domain @${userDomain} is not authorized.`);
        setIsSubmitting(false);
        return;
      }
      // Sign out any existing session to prevent cross-portal contamination
      if (auth.currentUser) {
        await auth.signOut();
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Fire-and-forget telemetry (Non-blocking)
      updateDoc(doc(db, 'users', userCredential.user.uid), {
        lastLoginAt: new Date().toISOString()
      }).catch(e => console.error('Failed to sync login timestamp:', e));
      
      // Sync verification state
      if (userCredential.user.emailVerified) {
        setIsEmailVerified(true);
      }

      // The useEffect above will handle routing once userProfile loads:
      // - If not verified → show modal with unverified state
      // - If verified but not approved → show modal with unapproved state  
      // - If verified AND approved → skip modal, redirect to dashboard
      // Clear admin session flag to prevent bleed-through
      sessionStorage.removeItem('admin_session');
      sessionStorage.setItem('dashboard_session', 'active');
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setResendLoading(true);
    setResendStatus('idle');
    try {
      await sendEmailVerification(auth.currentUser);
      setResendStatus('sent');
      setResendTimer(30);
    } catch (err) {
      setResendStatus('error');
    } finally {
      setResendLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const projectMetadata = await getProjectMetadata() as ProjectMetadata | null;
      const allowed = projectMetadata?.allowedDomains?.length ? projectMetadata.allowedDomains : DEFAULT_ALLOWED_DOMAINS;
      const userDomain = email.split('@')[1]?.toLowerCase();
      if (!userDomain || !allowed.includes(userDomain)) {
        setError(`Registration restricted to authorized domains (@${allowed.join(', @')}).`);
        setIsSubmitting(false);
        return;
      }
      const pwdError = validatePassword(password);
      if (pwdError) { setError(pwdError); setIsSubmitting(false); return; }

      const fullName = `${firstName} ${lastName}`.trim();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await logRegistrationEvent(userCredential.user.uid, 'AUTH_CREATED', 'success', { email });
      await updateProfile(userCredential.user, { displayName: fullName });
      
      // 1. Resilient Identity Handshake
      console.log('%c[AUTH] Starting verification handshake...', 'color: #008080; font-weight: bold;');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Propagation Buffer
      try {
        await sendEmailVerification(userCredential.user);
        console.log('%c[AUTH] Verification link dispatched.', 'color: #2e7d32; font-weight: bold;');
        await logRegistrationEvent(userCredential.user.uid, 'VERIFICATION_SENT', 'success');
      } catch (emailErr: any) {
        console.error('[AUTH] Handshake failed:', emailErr);
        await logRegistrationEvent(userCredential.user.uid, 'VERIFICATION_SENT', 'failure', { error: emailErr.message || emailErr });
      }

      // 2. Initialize Firestore Profile
      try {
        await createUserProfile(userCredential.user.uid, {
          name: fullName, email, department
        });
        await logRegistrationEvent(userCredential.user.uid, 'PROFILE_INIT', 'success', { name: fullName, department });
      } catch (profileErr: any) {
        await logRegistrationEvent(userCredential.user.uid, 'PROFILE_INIT', 'failure', { error: profileErr.message || profileErr });
        throw profileErr;
      }

      // 3. Synchronization Guarantee
      try {
        await waitForPendingWrites(db);
        await logRegistrationEvent(userCredential.user.uid, 'SYNC_COMPLETE', 'success');
      } catch (syncErr: any) {
        await logRegistrationEvent(userCredential.user.uid, 'SYNC_COMPLETE', 'failure', { error: syncErr.message || syncErr });
        console.error('Core synchronization failed:', syncErr);
      }

      // 4. Dispatch Ultra-Elite Notifications (Non-blocking)
      const dispatchNotifications = async () => {
        try {
          // Notify User
          await fetch(getApiEndpoint('/api/mail'), {
            method: 'POST',
            body: JSON.stringify({
              type: 'REGISTRATION_PENDING',
              to: email,
              payload: { name: fullName }
            })
          });

          // Notify Admins (Hesham & Architect)
          const admins = ['Hesham.habib@insiteinternational.com', 'architect@rehdigital.com'];
          for (const adminEmail of admins) {
            await fetch(getApiEndpoint('/api/mail'), {
              method: 'POST',
              body: JSON.stringify({
                type: 'ADMIN_NOTIFICATION',
                to: adminEmail,
                payload: { name: fullName, email, department }
              })
            });
          }
        } catch (mailErr) {
          console.error('[AUTH] Notification dispatch failed:', mailErr);
        }
      };
      
      dispatchNotifications();

      setIsSubmitting(false);
      setAuthStatusMode('unverified');
      setShowRegistrationSuccess(true);
    } catch (err: any) {
      if (auth.currentUser) {
        await logRegistrationEvent(auth.currentUser.uid, 'REGISTRATION_OVERALL', 'failure', { error: err.message || err });
      }
      setError(getFirebaseErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      setEmailNotFound(false);
      const response = await fetch(getApiEndpoint('/api/auth/reset-link'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      let data: any = {};
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try { data = await response.json(); } catch { data = {}; }
      }

      if (!response.ok) {
        if (response.status === 404 && data.code === 'USER_NOT_FOUND') {
          setEmailNotFound(true);
          setError('The specified email address does not exist in our infrastructure.');
          setIsSubmitting(false);
          return;
        }
        throw new Error(data.error || 'Failed to dispatch reset link.');
      }
      
      setShowResetSuccess(true);
      setIsSubmitting(false);
    } catch (err: any) {
      setError(err.message || 'Service unavailable. Please try again later.');
      setIsSubmitting(false);
    }
  };

  if (loading && !isSubmitting) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--aqua)' }}>
        <Loader2 className="animate-spin" size={32} color="var(--teal)" />
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '16px 16px 16px 44px', borderRadius: 16,
    background: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(0, 63, 73, 0.15)',
    color: 'var(--teal)', fontSize: 15, outline: 'none', transition: 'all 300ms',
    fontWeight: 600, boxShadow: 'inset 0 2px 4px rgba(0, 63, 73, 0.02)',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, var(--aqua) 0%, var(--haze) 50%, var(--cotton) 100%)',
      padding: 20, position: 'relative', overflow: 'hidden'
    }}>
      {/* Ambient Decorations */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(208, 171, 130, 0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0, 63, 73, 0.1) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120%', height: '120%', background: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 80%)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
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
          {/* Home Button - Repositioned to Top-Right to avoid collision with logos */}
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
            title="Back to Home"
          >
            <Home size={16} color="var(--teal)" />
          </motion.button>

          {/* Slim Branded Insignia - Final Proportional Scaling */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 16,
              padding: '10px 24px', background: 'var(--teal)', borderRadius: 16,
              boxShadow: '0 10px 30px rgba(0, 63, 73, 0.15)', 
              border: '1px solid var(--sunlit-rock)', 
              width: 'max-content', margin: '0 auto 12px',
            }}>
              <motion.img 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src="/logos/modon_logo.png" 
                alt="MODON" 
                style={{ height: 26, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} 
              />
              <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.2)' }} />
              <motion.img 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                src="/logos/insite_logo.png" 
                alt="INSITE" 
                style={{ height: 22, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} 
              />
            </div>
            <h1 className="brand-heading" style={{
              fontSize: 24, color: 'var(--teal)', margin: '0 0 6px',
              letterSpacing: '0.15em', fontWeight: 900,
              textTransform: 'uppercase',
            }}>
              {mode === 'login' ? 'Access Portal' : mode === 'register' ? 'Create Account' : 'Reset Password'}
            </h1>
            <p style={{ color: 'var(--text-dim)', fontSize: 11, margin: 0, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.7 }}>
              {mode === 'login' ? 'Sign in to access the reporting dashboard' :
                mode === 'register' ? 'Register for project access' :
                  'Enter your email to receive a reset link'}
            </p>
          </div>

          <form
            onSubmit={mode === 'register' ? handleRegister : mode === 'forgot-password' ? handleResetPassword : handleLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            {mode === 'register' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} required style={inputStyle} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} required style={{ ...inputStyle, paddingLeft: 16 }} />
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input type="text" placeholder="Job Title" value={department} onChange={e => setDepartment(e.target.value)} required style={inputStyle} />
                </div>
              </>
            )}

            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input type="email" placeholder="Work Email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            </div>

            {mode !== 'forgot-password' && (
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ ...inputStyle, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 0 }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            )}

            {/* Password strength for register */}
            {mode === 'register' && password.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { label: '8+ chars', met: password.length >= 8 },
                  { label: 'Uppercase', met: /[A-Z]/.test(password) },
                  { label: 'Number', met: /\d/.test(password) },
                  { label: 'Special', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
                ].map((r, i) => (
                  <span key={i} style={{
                    fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                    background: r.met ? 'rgba(82, 97, 54, 0.1)' : 'rgba(0, 63, 73, 0.04)',
                    color: r.met ? 'var(--status-success)' : 'var(--text-dim)',
                    border: `1px solid ${r.met ? 'rgba(82, 97, 54, 0.2)' : 'rgba(0, 63, 73, 0.08)'}`,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {r.met ? <CheckCircle2 size={10} /> : <Circle size={10} />} {r.label}
                  </span>
                ))}
              </div>
            )}

            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{
                padding: '12px 14px', borderRadius: 12,
                background: 'rgba(255, 76, 79, 0.06)', border: '1px solid rgba(255, 76, 79, 0.15)',
                color: 'var(--status-error)', fontSize: 12, fontWeight: 700,
                display: 'flex', flexDirection: 'column', gap: 10
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: 2 }} /> 
                  <span style={{ lineHeight: 1.4 }}>{error}</span>
                </div>
                
                {emailNotFound && (
                  <button 
                    type="button" 
                    onClick={() => { setError(''); setEmailNotFound(false); setMode('register'); }}
                    style={{ 
                      width: '100%', padding: '10px', borderRadius: 10, 
                      background: 'var(--teal)', color: 'white', 
                      border: 'none', fontSize: 11, fontWeight: 800, 
                      cursor: 'pointer', textTransform: 'uppercase', 
                      letterSpacing: '0.05em', boxShadow: '0 4px 12px rgba(0, 63, 73, 0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}
                  >
                    <UserPlus size={14} /> Create New Account
                  </button>
                )}
              </motion.div>
            )}

            {message && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{
                padding: '12px 14px', borderRadius: 12,
                background: 'rgba(82, 97, 54, 0.06)', border: '1px solid rgba(82, 97, 54, 0.15)',
                color: 'var(--status-success)', fontSize: 12, fontWeight: 600,
              }}>
                {message}
              </motion.div>
            )}

            {mode === 'login' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setMode('forgot-password')} style={{ background: 'none', border: 'none', color: 'var(--sunlit-rock)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" disabled={isSubmitting} style={{
              width: '100%', padding: '14px', borderRadius: 14, marginTop: 4,
              background: 'var(--teal)', color: 'var(--cotton)', fontSize: 14,
              fontWeight: 700, border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 8px 24px rgba(0, 63, 73, 0.15)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              transition: 'all 300ms',
            }}>
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> :
                mode === 'login' ? <>Sign In <ChevronRight size={16} /></> :
                  mode === 'register' ? <>Create Account <UserPlus size={16} /></> :
                    <>Send Reset Link <ChevronRight size={16} /></>}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button
              onClick={() => { setError(''); setMessage(''); setEmailNotFound(false); setMode(mode === 'login' ? 'register' : 'login'); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto' }}>
              {mode === 'login' ? <><UserPlus size={14} /> Don&apos;t have an account? Register</> :
                <><ArrowLeft size={14} /> Back to Sign In</>}
            </button>
            
            <button
              onClick={() => setIsTicketModalOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: '32px auto 0', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <LifeBuoy size={14} /> Need Technical Support?
            </button>
          </div>
        </div>

        <div style={{
          padding: '14px 36px', background: 'rgba(0, 63, 73, 0.03)',
          borderTop: '1px solid rgba(0, 63, 73, 0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <Globe size={12} color="var(--text-dim)" />
          <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Secure Project Access
          </span>
        </div>
      </motion.div>

      {/* Security Protocol Tracker Modal */}
      <AnimatePresence>
        {showRegistrationSuccess && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0, 42, 48, 0.4)', backdropFilter: 'blur(16px)' }} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ width: '100%', maxWidth: 460, background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0, 63, 73, 0.15)', borderRadius: 32, padding: '48px 40px', position: 'relative', zIndex: 1, boxShadow: '0 30px 80px rgba(0,42,48,0.2)' }}>
              
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, var(--teal) 0%, #005663 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(0, 63, 73, 0.2)' }}>
                  <ShieldCheck size={32} color="white" />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--teal)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  {authStatusMode === 'unapproved' ? 'Clearance Pending' : 'Security Protocol'}
                </h2>
                <p style={{ color: 'var(--text-dim)', fontSize: 14, fontWeight: 500 }}>
                  {authStatusMode === 'unapproved' ? 'Identity verified successfully. Your clearance for project modules is now finalizing.' : 'Your security profile has been initialized. Please complete the following stages:'}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                {/* Stage 1: Verification */}
                  <motion.div 
                    animate={{ 
                      scale: authStatusMode === 'unapproved' ? [1, 1.02, 1] : 1,
                      boxShadow: authStatusMode === 'unapproved' ? '0 0 20px rgba(82, 97, 54, 0.15)' : 'none'
                    }}
                    style={{ 
                      display: 'flex', gap: 16, padding: '16px 20px', borderRadius: 16, 
                      background: (isEmailVerified || authStatusMode === 'unapproved') ? 'rgba(82, 97, 54, 0.04)' : 'rgba(0, 63, 73, 0.03)', 
                      border: (isEmailVerified || authStatusMode === 'unapproved') ? '1px solid rgba(82, 97, 54, 0.2)' : '1px solid rgba(0, 63, 73, 0.08)',
                      transition: 'all 500ms ease'
                    }}
                  >
                    <div style={{ 
                      width: 24, height: 24, borderRadius: '50%', 
                      background: (isEmailVerified || authStatusMode === 'unapproved') ? 'var(--status-success)' : 'rgba(0, 63, 73, 0.1)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      transition: 'background 400ms ease'
                    }}>
                      <AnimatePresence mode="wait">
                        {(isEmailVerified || authStatusMode === 'unapproved') ? (
                          <motion.div
                            key="success"
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                          >
                            <CheckCircle2 size={14} color="white" />
                          </motion.div>
                        ) : (
                          <motion.span 
                            key="number"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ fontSize: 12, fontWeight: 900, color: 'var(--teal)' }}
                          >
                            01
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <div style={{ flex: 1 }}>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={authStatusMode === 'unapproved' ? 'verified' : 'pending'}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <h3 style={{ fontSize: 13, fontWeight: 800, color: (isEmailVerified || authStatusMode === 'unapproved') ? 'var(--status-success)' : 'var(--teal)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {(isEmailVerified || authStatusMode === 'unapproved') ? 'Identity Verified' : 'Identity Verification'}
                          </h3>
                          <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
                            {(isEmailVerified || authStatusMode === 'unapproved') ? 'Authentication successful. Your work email has been confirmed.' : 'Verification link dispatched to your inbox. Please check your email and verify your address to continue.'}
                          </p>
                        </motion.div>
                      </AnimatePresence>
                      {authStatusMode === 'unverified' && (
                        <button 
                          onClick={handleResendVerification}
                          disabled={resendLoading || resendTimer > 0}
                          style={{ 
                            background: 'none', border: 'none', padding: '4px 0', marginTop: 8,
                            color: resendTimer > 0 ? 'var(--status-success)' : 'var(--teal)', 
                            fontSize: 10, fontWeight: 800, cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: 6,
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            opacity: resendLoading ? 0.6 : 1
                          }}
                        >
                          {resendLoading ? <Loader2 className="animate-spin" size={12} /> : 
                           resendTimer > 0 ? <><CheckCircle2 size={12} /> Re-sent. Wait {resendTimer}s</> : 
                           'Resend Verification Link'}
                        </button>
                      )}
                    </div>
                  </motion.div>

                {/* Stage 2: Approval */}
                <div style={{ 
                  display: 'flex', gap: 16, padding: '16px 20px', borderRadius: 16, 
                  background: 'rgba(212, 175, 55, 0.03)', 
                  border: '1px solid rgba(212, 175, 55, 0.15)' 
                }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: userProfile?.isApproved ? 'var(--status-success)' : 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {userProfile?.isApproved ? <CheckCircle2 size={14} color="white" /> : <span style={{ fontSize: 12, fontWeight: 900, color: '#b89431' }}>02</span>}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: userProfile?.isApproved ? 'var(--status-success)' : '#b89431', margin: '0 0 4px' }}>
                      {userProfile?.isApproved ? 'ADMINISTRATIVE CLEARANCE GRANTED' : 'ADMINISTRATIVE CLEARANCE'}
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
                      {userProfile?.isApproved ? 'Access finalized. All requested project modules have been successfully bound to your security profile.' : 'Registry access pending manual review. An administrator is currently evaluating your authorization for project modules.'}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {userProfile?.isApproved ? (
                  <motion.button 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={async () => { 
                      sessionStorage.setItem('dashboard_session', 'active');
                      router.push('/dashboard');
                    }} 
                    style={{ 
                      width: '100%', padding: '18px', borderRadius: 18, 
                      background: 'var(--teal)', color: 'var(--cotton)', 
                      fontSize: 14, fontWeight: 900, border: 'none', cursor: 'pointer', 
                      boxShadow: '0 12px 28px rgba(0, 63, 73, 0.25)', 
                      textTransform: 'uppercase', letterSpacing: '0.12em',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                    }}
                  >
                    Launch System Dashboard
                    <ChevronRight size={18} />
                  </motion.button>
                ) : (
                  <button 
                    onClick={async () => { 
                      setShowRegistrationSuccess(false); 
                      setAuthStatusMode('none');
                      setMode('login'); 
                      setEmail(''); 
                      setPassword(''); 
                      setFirstName(''); 
                      setLastName(''); 
                      setDepartment(''); 
                      await auth.signOut();
                    }} 
                    style={{ 
                      width: '100%', padding: '16px', borderRadius: 16, 
                      background: 'var(--teal)', color: 'var(--cotton)', 
                      fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer', 
                      boxShadow: '0 8px 24px rgba(0,63,73,0.15)', 
                      textTransform: 'uppercase', letterSpacing: '0.1em' 
                    }}
                  >
                    Return to Access Portal
                  </button>
                )}
                
                {userProfile?.isApproved && (
                  <button
                    onClick={async () => {
                      setShowRegistrationSuccess(false);
                      await auth.signOut();
                      window.location.reload();
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    Logout Session
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Success Modal */}
      <AnimatePresence>
        {showResetSuccess && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0, 63, 73, 0.4)', backdropFilter: 'blur(12px)' }} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(208, 171, 130, 0.2)', borderRadius: 24, padding: '40px 36px', textAlign: 'center', position: 'relative', zIndex: 1, boxShadow: '0 25px 60px rgba(0,63,73,0.15)' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, var(--sunlit-rock) 0%, #a08050 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(208, 171, 130, 0.2)' }}>
                <Mail size={32} color="var(--teal)" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--teal)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Link Dispatched</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.6, margin: '0 0 20px', fontWeight: 500 }}>
                A secure recovery protocol has been initiated. Please check your **Inbox** or **Junk/Spam** folders for further instructions.
              </p>
              <button onClick={() => { setShowResetSuccess(false); setMode('login'); setEmail(''); }} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'var(--teal)', color: 'var(--cotton)', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                Back to Sign In
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <TicketRequestModal 
        isOpen={isTicketModalOpen} 
        onClose={() => setIsTicketModalOpen(false)} 
        defaultReason="Login Portal Support"
        defaultMessage="I am experiencing issues accessing my account. Please provide technical assistance."
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--aqua)' }}>
        <Loader2 className="animate-spin" size={32} color="var(--teal)" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
