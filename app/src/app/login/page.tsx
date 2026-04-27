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
      if (err.code === 'auth/user-disabled') {
        try {
          const response = await fetch(`/api/auth/blocking-details?email=${encodeURIComponent(email)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.suspended && data.blockingDetails) {
              setError(`ACCESS REVOKED: Reason: ${data.blockingDetails.reason} | Duration: ${data.blockingDetails.duration}`);
              setIsSubmitting(false);
              return;
            }
          }
        } catch (e) {
          console.error('Suspension retrieval failure:', e);
        }
      }
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
      
      // 1. AWS Consolidated Identity Handshake
      console.log('%c[AUTH] Starting Master Relay handshake...', 'color: #008080; font-weight: bold;');
      try {
        const { mailService } = await import('@/services/MailService');
        
        // Dispatch User Verification (Branded)
        await mailService.sendVerificationLink(email, fullName);
        
        // Dispatch Admin Notification
        await mailService.notifyAdminOfNewUser(fullName, email, 'verification@rehdigital.com'); 
        
        console.log('%c[AUTH] AWS Master Relay sequences complete.', 'color: #2e7d32; font-weight: bold;');
        await logRegistrationEvent(userCredential.user.uid, 'VERIFICATION_SENT', 'success');
      } catch (emailErr: any) {
        console.error('[AUTH] Relay Handshake failed:', emailErr);
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
          const { mailService } = await import('@/services/MailService');
          
          // Notify User of Pending Status
          await mailService.dispatch({
            to: email,
            subject: 'REH Digital — Account Created & Pending Clearance',
            type: 'ANNOUNCEMENT', // Using ANNOUNCEMENT as fallback for Pending Status
            payload: {
              name: fullName,
              title: 'Account Initialization Success',
              body: 'Your operative profile has been created and is now awaiting administrative clearance.'
            }
          });

          // Notify Admins
          const admins = ['Hesham.habib@insiteinternational.com', 'architect@rehdigital.com'];
          for (const adminEmail of admins) {
            await mailService.notifyAdminOfNewUser(fullName, email, adminEmail);
          }
        } catch (mailErr) {
          console.error('[AUTH] Notification dispatch failed:', mailErr);
        }
      };
      
      dispatchNotifications();

      setIsSubmitting(false);
      setAuthStatusMode('unverified');
      router.push('/auth/verify-success');
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
      
      const { mailService } = await import('@/services/MailService');
      await mailService.sendPasswordReset(email, 'User');
      
      setShowResetSuccess(true);
      setIsSubmitting(false);
    } catch (err: any) {
      console.error('SMTP Reset failed:', err);
      if (err.message?.includes('USER_NOT_FOUND')) {
        setEmailNotFound(true);
        setError('The security network does not recognize this email identity.');
      } else {
        setError(err.message || 'Service unavailable. Please try again later.');
      }
      setIsSubmitting(false);
    }
  };

  if (loading && !isSubmitting) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#002d35' }}>
        <Loader2 className="animate-spin" size={32} color="#d0ab82" />
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px 12px 44px', borderRadius: 12,
    background: '#eef2ff', border: '1px solid rgba(0, 63, 73, 0.15)',
    color: '#003f49', fontSize: 14, outline: 'none', transition: 'all 300ms',
    fontWeight: 600,
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8fafc',
      padding: 20, position: 'relative', overflow: 'hidden'
    }}>
      {/* Clean Light Background */}
      <div style={{ 
        position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none',
        background: 'radial-gradient(circle at 50% 0%, rgba(0, 242, 255, 0.05) 0%, transparent 70%)'
      }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '100%', maxWidth: 460,
          background: '#ffffff',
          border: '1px solid rgba(0, 63, 73, 0.05)',
          borderRadius: 32, overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 63, 73, 0.05)',
          position: 'relative', zIndex: 10,
        }}
      >
        <div style={{ padding: '40px 36px 24px' }}>
          {/* Home Button */}
          <motion.button
            onClick={() => router.push('/')}
            whileHover={{ scale: 1.05, background: 'rgba(208, 171, 130, 0.1)' }}
            style={{
              position: 'absolute', top: 20, right: 20, padding: 8,
              borderRadius: 12, border: '1px solid rgba(208, 171, 130, 0.2)',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 20, color: '#003f49'
            }}
          >
            <Home size={16} />
          </motion.button>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ 
              background: '#003f49', 
              padding: '10px 28px', 
              borderRadius: 16, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12,
              boxShadow: '0 8px 24px rgba(0, 63, 73, 0.15)'
            }}>
                <motion.img 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  src="/logos/modon_logo.png" 
                  alt="MODON" 
                  style={{ height: 20, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} 
                />
                <div style={{ width: 1, height: 14, background: 'rgba(255, 255, 255, 0.2)' }} />
                <motion.img 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  src="/logos/insite_logo.png" 
                  alt="INSITE" 
                  style={{ height: 16, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} 
                />
            </div>
          </div>
            
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 className="brand-heading" style={{
              fontSize: 26, color: '#003f49', margin: '0 0 4px',
              letterSpacing: '0.1em', fontWeight: 900,
              textTransform: 'uppercase',
            }}>
              {mode === 'login' ? 'Access Portal' : mode === 'register' ? 'Create Account' : 'Reset Password'}
            </h1>
            <p style={{ color: '#94A3B8', fontSize: 10, margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              {mode === 'login' ? 'Sign in to access the reporting dashboard' :
                mode === 'register' ? 'Register for project access' :
                  'Enter your email to receive a reset link'}
            </p>
          </div>

          <form
            onSubmit={mode === 'register' ? handleRegister : mode === 'forgot-password' ? handleResetPassword : handleLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
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
              <Mail size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0, 45, 53, 0.4)' }} />
              <input type="email" placeholder="Work Email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            </div>

            {mode !== 'forgot-password' && (
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0, 45, 53, 0.4)' }} />
                <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ ...inputStyle, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(0, 45, 53, 0.4)', cursor: 'pointer', padding: 0 }}>
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
                <button type="button" onClick={() => setMode('forgot-password')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em' }}>
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" disabled={isSubmitting} style={{
              width: 'fit-content', padding: '12px 40px', borderRadius: 12, marginTop: 4,
              background: '#003f49', color: 'white', fontSize: 13,
              fontWeight: 900, border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 8px 24px rgba(0, 63, 73, 0.15)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              transition: 'all 300ms', alignSelf: 'center'
            }}>
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> :
                mode === 'login' ? <>SIGN IN <ChevronRight size={18} /></> :
                  mode === 'register' ? <>INITIALIZE PROFILE <UserPlus size={18} /></> :
                    <>TRANSMIT RECOVERY <ChevronRight size={18} /></>}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button
              onClick={() => { setError(''); setMessage(''); setEmailNotFound(false); setMode(mode === 'login' ? 'register' : 'login'); }}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto' }}>
              {mode === 'login' ? <><UserPlus size={14} /> Don&apos;t have an account? Register</> :
                <><ArrowLeft size={14} /> Back to Sign In</>}
            </button>
            
            <button
              onClick={() => setIsTicketModalOpen(true)}
              style={{ background: 'none', border: 'none', color: '#003f49', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: '32px auto 0', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <LifeBuoy size={14} /> Need Technical Support?
            </button>
          </div>
        </div>
        
        <div style={{
          padding: '14px 36px', background: 'rgba(0, 63, 73, 0.03)',
          borderTop: '1px solid rgba(0, 63, 73, 0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <Globe size={12} color="#94A3B8" />
          <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Secure Project Access
          </span>
        </div>
      </motion.div>

      {/* Security Protocol Tracker Modal */}
      <AnimatePresence>
        {showRegistrationSuccess && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0, 45, 53, 0.6)', backdropFilter: 'blur(20px)' }} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ width: '100%', maxWidth: 460, background: 'rgba(0, 63, 73, 0.85)', backdropFilter: 'blur(40px)', border: '1px solid rgba(208, 171, 130, 0.3)', borderRadius: 32, padding: '48px 40px', position: 'relative', zIndex: 1, boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>
              
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg, #003f49 0%, #002d35 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(208, 171, 130, 0.4)', boxShadow: '0 0 30px rgba(208, 171, 130, 0.2)' }}>
                  <ShieldCheck size={40} color="#d0ab82" />
                </div>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: '0 0 10px', letterSpacing: '0.05em', textTransform: 'uppercase', fontStyle: 'italic' }}>
                  {authStatusMode === 'unapproved' ? 'CLEARANCE PENDING' : 'SECURITY PROTOCOL'}
                </h2>
                <p style={{ color: '#94A3B8', fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>
                  {authStatusMode === 'unapproved' ? 'Identity verified successfully. Your cryptographic signature has been validated against the REH registry.' : 'Your security profile has been initialized. Please complete the following stages:'}
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
                      display: 'flex', gap: 16, padding: '20px', borderRadius: 20, 
                      background: (isEmailVerified || authStatusMode === 'unapproved') ? 'rgba(208, 171, 130, 0.08)' : 'rgba(0, 63, 73, 0.2)', 
                      border: (isEmailVerified || authStatusMode === 'unapproved') ? '1px solid rgba(208, 171, 130, 0.3)' : '1px solid rgba(208, 171, 130, 0.1)',
                      transition: 'all 500ms ease'
                    }}
                  >
                    <div style={{ 
                      width: 28, height: 28, borderRadius: '50%', 
                      background: (isEmailVerified || authStatusMode === 'unapproved') ? '#d0ab82' : 'rgba(208, 171, 130, 0.15)', 
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
                            <CheckCircle2 size={16} color="#002d35" />
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
                          <h3 style={{ fontSize: 13, fontWeight: 900, color: (isEmailVerified || authStatusMode === 'unapproved') ? 'white' : '#d0ab82', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontStyle: 'italic' }}>
                            {(isEmailVerified || authStatusMode === 'unapproved') ? 'IDENTITY CONFIRMED' : 'IDENTITY VERIFICATION'}
                          </h3>
                          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.5, fontWeight: 600 }}>
                            {(isEmailVerified || authStatusMode === 'unapproved') ? 'Authentication successful. Your cryptographic signature has been validated.' : 'Verification link dispatched to your inbox. Please validate your operative identity to continue.'}
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

                <div style={{ 
                  display: 'flex', gap: 16, padding: '20px', borderRadius: 20, 
                  background: userProfile?.isApproved ? 'rgba(208, 171, 130, 0.08)' : 'rgba(0, 63, 73, 0.2)', 
                  border: userProfile?.isApproved ? '1px solid rgba(208, 171, 130, 0.3)' : '1px solid rgba(208, 171, 130, 0.1)' 
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: userProfile?.isApproved ? '#d0ab82' : 'rgba(208, 171, 130, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {userProfile?.isApproved ? <CheckCircle2 size={16} color="#002d35" /> : <span style={{ fontSize: 12, fontWeight: 900, color: '#d0ab82' }}>02</span>}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 900, color: userProfile?.isApproved ? 'white' : '#d0ab82', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontStyle: 'italic' }}>
                      {userProfile?.isApproved ? 'CLEARANCE AUTHORIZED' : 'MANUAL APPROVAL'}
                    </h3>
                    <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.5, fontWeight: 600 }}>
                      {userProfile?.isApproved ? 'Access authorized. All project modules have been bound to your operative profile.' : 'Manual review in progress. Our administrators are currently evaluating your access clearance.'}
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
                      width: '100%', padding: '18px', borderRadius: 20, 
                      background: '#d0ab82', color: '#002d35', 
                      fontSize: 14, fontWeight: 900, border: 'none', cursor: 'pointer', 
                      boxShadow: '0 15px 35px rgba(208, 171, 130, 0.3)', 
                      textTransform: 'uppercase', letterSpacing: '0.12em', fontStyle: 'italic',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                    }}
                  >
                    Enter Command Center
                    <ChevronRight size={20} />
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
