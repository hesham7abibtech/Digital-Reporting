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
import { formatDate } from '@/lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { createUserProfile, getProjectMetadata } from '@/services/FirebaseService';
import { useAuth } from '@/context/AuthContext';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';
import { ProjectMetadata } from '@/lib/types';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Lock, Mail, Loader2, Globe, ShieldCheck,
  UserPlus, ArrowLeft, User, ShieldAlert,
  ChevronRight, Fingerprint, Database, Cpu,
  CheckCircle2, Eye, EyeOff, Circle, Briefcase, Home, LifeBuoy,
  RefreshCw, ShieldCheck as ShieldCheckIcon, ShieldAlert as ShieldAlertIcon, Trash2, X
} from 'lucide-react';
import TicketRequestModal from '@/components/shared/TicketRequestModal';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'unauthorized';

const DEFAULT_ALLOWED_DOMAINS = ['modon.com', 'insiteinternational.com'];

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'SECURITY REQUIREMENT: Password must be at least 8 characters long.';
  if (!/\d/.test(password)) return 'SECURITY REQUIREMENT: Password must contain at least one numerical digit.';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'SECURITY REQUIREMENT: Password must contain at least one special character (e.g. !@#$%).';
  return null;
}

function AdminLoginContent() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanned, setIsScanned] = useState(false);
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const [projectMetadata, setProjectMetadata] = useState<ProjectMetadata | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [revocationData, setRevocationData] = useState<{ reason: string; duration: string; blockedAt?: string; expiresAt?: string | null } | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [hasPendingAppeal, setHasPendingAppeal] = useState(false);
  const [latestAppeal, setLatestAppeal] = useState<{ status: string; message?: string | null; adminResponse: string | null; createdAt?: string | null; updatedAt: string | Date | null } | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, loading, authError } = useAuth();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized') {
      setError('ACCESS DENIED: Insufficient administrative clearance. Please authenticate with an Admin profile.');
    }
  }, [searchParams]);

  useEffect(() => {
    getProjectMetadata().then(meta => {
      if (meta) setProjectMetadata(meta as ProjectMetadata);
    }).catch(console.error);
  }, []);

  // Polling Watchdog for Real-time Synchronization
  useEffect(() => {
    if (error !== 'ACCESS_REVOKED' || !email) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/auth/blocking-details?email=${encodeURIComponent(email)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.suspended && data.blockingDetails) {
            setRevocationData(data.blockingDetails);
            setLatestAppeal(data.latestAppeal);
            setHasPendingAppeal(data.latestAppeal?.status === 'OPEN');
          }
        }
      } catch (e) {
        console.error('Polling sync failure:', e);
      }
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [error, email]);

  useEffect(() => {
    if (loading) return;

    // ISOLATION PROTOCOL: Only react to auth state if admin_session is active.
    // This prevents cross-contamination from the regular /login portal.
    const isAdminSession = sessionStorage.getItem('admin_session');
    if (!isAdminSession || isAdminSession !== 'active') {
      // No admin session flag — do NOT auto-redirect or react to shared Firebase auth.
      // The user may be signed in via the regular dashboard portal, but that's irrelevant here.
      return;
    }

    // Handle Profile Fetch Errors (usually from Firestore rules)
    if (user && authError) {
      setError(`IDENTITY SYNC FAILURE: ${authError}`);
      setIsSubmitting(false);
      return;
    }

    // Handle Success and Clearance Check (only for admin sessions)
    if (user && userProfile) {
      const isVerified = user.emailVerified || userProfile.isVerified === true;
      if (!isVerified) {
        setError('CLEARANCE BLOCKED: Email not verified. Please verify your identity protocol.');
        auth.signOut();
        sessionStorage.removeItem('admin_session');
        setIsSubmitting(false);
        return;
      }

      if (userProfile.isAdmin) {
        router.push('/admin/dashboard');
      } else {
        // User is logged in but lacks admin role - Keep form visible but show error
        setError('CLEARANCE REJECTED: Your identity is recognized but your account lacks administrative authority.');
        setIsSubmitting(false);
      }
    }
  }, [user, userProfile, loading, authError, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      // 1. Domain Clearance Check (Pre-flight)
      const projectMetadata = await getProjectMetadata() as ProjectMetadata | null;
      const allowed = projectMetadata?.allowedDomains?.length ? projectMetadata.allowedDomains : DEFAULT_ALLOWED_DOMAINS;

      const userDomain = email.split('@')[1]?.toLowerCase();
      if (!userDomain || !allowed.includes(userDomain)) {
        setError(`ACCESS DENIED: Your identity domain (@${userDomain}) is not authorized for this project. Authorized domains: @${allowed.join(', @')}.`);
        setIsSubmitting(false);
        return;
      }

      // 2. Sign out any existing session to prevent cross-portal contamination
      if (auth.currentUser) {
        await auth.signOut();
      }

      // 3. Ensure strict session persistence is initialized
      // (Global persistence is already initialized in AuthContext, these are fast sync checks)
      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // 4. Fire-and-forget telemetry (Non-blocking)
      updateDoc(doc(db, 'users', userCredential.user.uid), {
        lastLoginAt: new Date().toISOString()
      }).catch(e => console.error('Failed to sync admin login timestamp:', e));
      // Mark this as an admin session (separate from dashboard)
      // Clear dashboard session flag to prevent bleed-through
      sessionStorage.removeItem('dashboard_session');
      sessionStorage.setItem('admin_session', 'active');
      // Wait for AuthContext redirect logic above
    } catch (err: any) {
      // Don't flood console with expected disabled errors in dev
      if (err.code !== 'auth/user-disabled') {
        console.error('Login error:', err);
      }

      if (err.code === 'auth/user-disabled' || err.message?.includes('disabled') || err.message?.includes('user-disabled')) {
        try {
          const response = await fetch(`/api/auth/blocking-details?email=${encodeURIComponent(email)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.suspended && data.blockingDetails) {
              setRevocationData(data.blockingDetails);
              setLatestAppeal(data.latestAppeal);
              setHasPendingAppeal(data.latestAppeal?.status === 'OPEN');
              setError('ACCESS_REVOKED');
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      // 1. Domain Clearance Check
      const projectMetadata = await getProjectMetadata() as ProjectMetadata | null;
      const allowed = projectMetadata?.allowedDomains?.length ? projectMetadata.allowedDomains : DEFAULT_ALLOWED_DOMAINS;

      const userDomain = email.split('@')[1]?.toLowerCase();
      if (!userDomain || !allowed.includes(userDomain)) {
        setError(`SECURITY ALERT: Unauthorized Domain Signature. Registration is strictly restricted to authorized project domains (@${allowed.join(', @')}).`);
        setIsSubmitting(false);
        return;
      }

      // 2. Password Strength Check
      const pwdError = validatePassword(password);
      if (pwdError) {
        setError(pwdError);
        setIsSubmitting(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });

      // 1. Send Email Verification
      await sendEmailVerification(userCredential.user);

      // 2. Initialize Firestore Profile
      await createUserProfile(userCredential.user.uid, {
        name,
        email,
        department
      });

      // Sign out user immediately (they need an admin approval first)
      await auth.signOut();
      setIsSubmitting(false);
      setShowRegistrationSuccess(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(getFirebaseErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const actionCodeSettings = {
        url: window.location.origin + '/auth/reset',
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setShowResetSuccess(true);
      setIsSubmitting(false);
    } catch (err: any) {
      console.error('Reset error:', err);
      setError(getFirebaseErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1, scale: 1, y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    },
    exit: {
      opacity: 0, scale: 0.95, y: -20,
      transition: { duration: 0.3 }
    }
  };

  if (loading && !isSubmitting) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a1220' }}>
        <Loader2 className="animate-spin" size={32} color="var(--teal)" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', background: '#001519' }}>
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflow: 'hidden' }}>
        {/* Deep Green Ambient Glow */}
        <div style={{ 
          position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none',
          background: 'radial-gradient(circle at 50% 0%, rgba(0, 242, 255, 0.1) 0%, transparent 70%)'
        }} />
        <div style={{ 
          position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none',
          background: 'radial-gradient(circle at 50% 100%, rgba(208, 171, 130, 0.05) 0%, transparent 70%)'
        }} />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          key={mode}
          style={{
            width: '100%',
            maxWidth: 460,
            background: '#ffffff',
            border: '1px solid rgba(0, 63, 73, 0.05)',
            borderRadius: 32,
            boxShadow: '0 20px 60px rgba(0, 63, 73, 0.05)',
            overflow: 'hidden',
            zIndex: 10,
            position: 'relative'
          }}
        >

          <div style={{ padding: '24px 32px 16px', position: 'relative' }}>
            <motion.button
              onClick={() => router.push('/')}
              whileHover={{ scale: 1.05, background: 'rgba(0, 63, 73, 0.05)' }}
              style={{
                position: 'absolute', top: 20, right: 20, padding: 8,
                borderRadius: 12, border: '1px solid rgba(0, 63, 73, 0.1)',
                background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 20, color: '#003f49'
              }}
            >
              <Home size={16} />
            </motion.button>

            {/* Branding Header - Pill Container (100% Match) */}
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
                {mode === 'login' ? 'Admin Portal' : mode === 'register' ? 'Provisioning' : 'Reset Protocol'}
              </h1>
              <p style={{ color: '#94A3B8', fontSize: 10, margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                {mode === 'login' ? 'Sign in to access administrative modules' :
                  mode === 'register' ? 'Initialize new administrator identity' :
                    'Enter your work email for recovery'}
              </p>
            </div>

            <AnimatePresence mode="wait">
                  {error === 'ACCESS_REVOKED' && revocationData ? (
                    <motion.div 
                      key="revocation-hub"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      style={{ background: '#fef2f2', borderRadius: 20, padding: '24px', border: '1px solid rgba(153, 27, 27, 0.1)', position: 'relative' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(153, 27, 27, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShieldAlertIcon size={20} color="#991b1b" />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 900, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Blocked</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#991b1b', opacity: 0.7, textTransform: 'uppercase' }}>Identity Restricted</div>
                        </div>
                      </div>

                      <div style={{ background: '#ffffff', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(153, 27, 27, 0.1)', marginBottom: 12 }}>
                        <div style={{ fontSize: 9, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Reason</div>
                        <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 800, lineHeight: 1.4 }}>{revocationData.reason}</div>
                      </div>

                      <div style={{ background: '#fef2f2', padding: '10px 12px', borderRadius: 10, border: '1px solid #fee2e2' }}>
                        <div style={{ fontSize: 8, fontWeight: 900, color: '#991b1b', textTransform: 'uppercase', marginBottom: 2 }}>Duration</div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#1e293b' }}>{revocationData.duration}</div>
                      </div>

                      {latestAppeal?.adminResponse && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          style={{ marginTop: 12, background: latestAppeal?.status === 'RESOLVED' ? 'rgba(46, 125, 50, 0.05)' : '#f1f5f9', padding: '12px', borderRadius: 12, border: latestAppeal?.status === 'RESOLVED' ? '1px solid rgba(46, 125, 50, 0.2)' : '1px solid #e2e8f0', position: 'relative' }}
                        >
                          <div style={{ fontSize: 8, fontWeight: 900, color: latestAppeal?.status === 'RESOLVED' ? '#2e7d32' : '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Admin Response</div>
                          <div style={{ fontSize: 12, color: '#1e293b', fontWeight: 700, lineHeight: 1.4 }}>{latestAppeal.adminResponse}</div>
                        </motion.div>
                      )}

                      <div style={{ marginTop: 12, borderTop: '1px solid rgba(153, 27, 27, 0.1)', paddingTop: 12 }}>
                        <button 
                          type="button"
                          disabled={hasPendingAppeal}
                          onClick={() => setIsReviewModalOpen(true)}
                          style={{ 
                            width: '100%', padding: '10px', borderRadius: 10, 
                            background: hasPendingAppeal ? 'rgba(15, 23, 42, 0.05)' : '#991b1b', 
                            color: hasPendingAppeal ? '#64748b' : 'white', 
                            border: hasPendingAppeal ? '1px solid rgba(153, 27, 27, 0.2)' : 'none', 
                            fontSize: 11, fontWeight: 800, 
                            cursor: hasPendingAppeal ? 'not-allowed' : 'pointer', 
                            transition: 'all 200ms',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            textTransform: 'uppercase', letterSpacing: '0.05em'
                          }}
                        >
                          {hasPendingAppeal ? (
                            <><ShieldCheckIcon size={14} /> REQUEST ACTIVE</>
                          ) : (
                            <><RefreshCw size={14} /> REQUEST REVISION</>
                          )}
                        </button>
                      </div>

                      {latestAppeal?.status === 'OPEN' && latestAppeal?.message && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          style={{ marginTop: 16, background: 'rgba(245, 158, 11, 0.05)', padding: '16px', borderRadius: 16, border: '1px solid rgba(245, 158, 11, 0.2)', position: 'relative', overflow: 'hidden' }}
                        >
                          <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: '#f59e0b' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <div>
                              <div style={{ fontSize: 9, fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Previous Submitted Request</div>
                              <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8' }}>{formatDate(latestAppeal.createdAt)}</div>
                            </div>
                            <div style={{ 
                              padding: '4px 8px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.1)', 
                              fontSize: 9, fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em',
                              border: '1px solid rgba(245, 158, 11, 0.2)'
                            }}>
                              Decision: PENDING
                            </div>
                          </div>
                          <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 600, lineHeight: 1.5, fontStyle: 'italic' }}>"{latestAppeal.message}"</div>
                        </motion.div>
                      )}

                      <div style={{ marginTop: 16, textAlign: 'center', fontSize: 8, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Hash: ERR_AUTH_REVOKED_{revocationData.blockedAt?.split('T')[0].replace(/-/g, '') || '0000'}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="auth-gateway"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onSubmit={mode === 'register' ? handleRegister : mode === 'forgot-password' ? handleResetPassword : handleLogin}
                      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                    >
                        {mode === 'register' && (
                          <>
                            <div style={{ position: 'relative' }}>
                              <User size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0, 63, 73, 0.4)' }} />
                              <input
                                type="text"
                                placeholder="FullName / ID"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                style={{
                                  width: '100%', padding: '12px 16px 12px 42px', borderRadius: 12,
                                  background: '#eef2ff', border: '1px solid rgba(0, 63, 73, 0.15)',
                                  color: '#003f49', fontSize: 14, outline: 'none', transition: 'all 300ms',
                                  fontWeight: 600
                                }}
                              />
                            </div>
                            <div style={{ position: 'relative' }}>
                              <Briefcase size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0, 63, 73, 0.4)' }} />
                              <input
                                type="text"
                                placeholder="Job Title / Designation"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                required
                                style={{
                                  width: '100%', padding: '12px 16px 12px 42px', borderRadius: 12,
                                  background: '#eef2ff', border: '1px solid rgba(0, 63, 73, 0.15)',
                                  color: '#003f49', fontSize: 14, outline: 'none', transition: 'all 300ms',
                                  fontWeight: 600
                                }}
                              />
                            </div>
                          </>
                        )}

                        <div style={{ position: 'relative' }}>
                          <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0, 63, 73, 0.4)' }} />
                          <input
                            type="email"
                            placeholder="Work Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                              width: '100%', padding: '12px 16px 12px 42px', borderRadius: 12,
                              background: '#eef2ff', border: '1px solid rgba(0, 63, 73, 0.15)',
                              color: '#003f49', fontSize: 14, outline: 'none', transition: 'all 300ms',
                              fontWeight: 600
                            }}
                          />
                        </div>

                        {mode !== 'forgot-password' && (
                          <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0, 63, 73, 0.4)' }} />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              style={{
                                width: '100%', padding: '12px 42px 12px 42px', borderRadius: 12,
                                background: '#eef2ff', border: '1px solid rgba(0, 63, 73, 0.15)',
                                color: '#003f49', fontSize: 14, outline: 'none', transition: 'all 300ms',
                                fontWeight: 600
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{
                                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', color: 'rgba(0, 63, 73, 0.4)', cursor: 'pointer',
                                padding: 0, display: 'flex', alignItems: 'center', zIndex: 10
                              }}
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        )}

                        {/* Password Strength Checklist / Success Indicator (Register Mode Only) */}
                        {mode === 'register' && password.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            style={{ marginTop: -12 }}
                          >
                            {(() => {
                              const reqs = [
                                { label: '8+ Characters Cluster', met: password.length >= 8 },
                                { label: 'Numerical Digit Inclusion', met: /\d/.test(password) },
                                { label: 'Special Character Signature', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
                              ];
                              const allMet = reqs.every(r => r.met);

                              if (allMet) {
                                return (
                                  <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: 10,
                                      padding: '12px 16px', borderRadius: 12,
                                      background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)',
                                      color: '#34d399'
                                    }}
                                  >
                                    <CheckCircle2 size={16} />
                                    <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Requirements Satisfied</span>
                                  </motion.div>
                                );
                              }

                              return (
                                <div style={{
                                  display: 'flex', flexDirection: 'column', gap: 8,
                                  padding: '16px', borderRadius: 16,
                                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                  {reqs.map((req, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: req.met ? '#34d399' : '#4b5563', transition: 'all 300ms' }}>
                                      {req.met ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{req.label}</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </motion.div>
                        )}

                        {error && error !== 'ACCESS_REVOKED' && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', fontSize: 13, fontWeight: 600, display: 'flex', gap: 10, lineHeight: 1.5 }}>
                            <ShieldAlertIcon size={18} style={{ flexShrink: 0 }} />
                            {error}
                          </motion.div>
                        )}

                        {message && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: 13, fontWeight: 600, display: 'flex', gap: 10 }}>
                            <ShieldCheckIcon size={18} style={{ flexShrink: 0 }} />
                            {message}
                          </motion.div>
                        )}

                        {mode === 'login' && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setMode('forgot-password')} style={{ background: 'transparent', border: 'none', color: '#003f49', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                              Forgotten Credentials?
                            </button>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmitting || (mode === 'register' && !!validatePassword(password))}
                          style={{
                            width: '100%', padding: '14px', borderRadius: 14, background: '#003f49',
                            color: 'white', fontSize: 14, fontWeight: 900, border: 'none',
                            cursor: (isSubmitting || (mode === 'register' && !!validatePassword(password))) ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                            boxShadow: '0 10px 25px rgba(0, 63, 73, 0.2)', textTransform: 'uppercase', letterSpacing: '0.05em',
                            opacity: (isSubmitting || (mode === 'register' && !!validatePassword(password))) ? 0.7 : 1,
                            transition: 'all 300ms', marginTop: 12
                          }}
                        >
                          {isSubmitting ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Loader2 className="animate-spin" size={20} />
                              <span style={{ fontSize: 12 }}>{mode === 'forgot-password' ? 'Transmitting Protocol...' : 'Securing Link...'}</span>
                            </div>
                          ) : mode === 'login' ? (
                            <>Establish Session <ChevronRight size={18} /></>
                          ) : mode === 'register' ? (
                            <>Authorize Identity <UserPlus size={18} /></>
                          ) : (
                            <>Request Recovery <ChevronRight size={18} /></>
                          )}
                        </button>
                    </motion.form>
                  )}
            </AnimatePresence>

            {mode !== 'unauthorized' && (
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <button
                  onClick={() => {
                    setError('');
                    setMessage('');
                    setMode(mode === 'login' ? 'register' : 'login');
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto' }}
                >
                  {mode === 'login' ? (
                    <><UserPlus size={16} /> Don&apos;t have an account? Create one</>
                  ) : (
                    <><ArrowLeft size={16} /> Back to Sign In</>
                  )}
                </button>
              </div>
            )}
            
            <button
               onClick={() => setIsTicketModalOpen(true)}
               style={{ background: 'transparent', border: 'none', color: '#003f49', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, margin: '20px auto 0', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
               <LifeBuoy size={14} /> Engaged Technical Support Cluster
            </button>
          </div>

          <div style={{
            padding: '16px 40px', background: 'rgba(0, 63, 73, 0.03)',
            borderTop: '1px solid rgba(0, 63, 73, 0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={12} color="#94A3B8" />
              <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Secure Admin Access
              </span>
            </div>
          </div>
        </motion.div>


      </div>

        {/* Registration Success Modal */}
        <AnimatePresence>
          {showRegistrationSuccess && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <motion.div
                key="modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
              />
              <motion.div
                key="modal-content"
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                style={{
                  width: '100%', maxWidth: 440,
                  background: 'rgba(12, 12, 18, 0.95)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: 28, padding: '48px 40px',
                  textAlign: 'center', position: 'relative', zIndex: 1,
                  boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 40px rgba(16, 185, 129, 0.1)'
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2, damping: 15 }}
                  style={{
                    width: 80, height: 80, borderRadius: 24,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 28px',
                    boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <CheckCircle2 size={40} color="#0a0a0f" />
                </motion.div>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: '0 0 12px', letterSpacing: '-0.02em' }}>Verification Sent</h2>
                <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7, margin: '0 0 12px' }}>Check your email to verify your identity.</p>
                <div style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: 32 }}>
                  <p style={{ color: '#fbbf24', fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.6 }}>
                    ⏳ Once verified, your account must be granted administrative clearance before you can access the Command Center.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowRegistrationSuccess(false);
                    setMode('login');
                    setEmail('');
                    setPassword('');
                    setName('');
                    setDepartment('');
                  }}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 16,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#0a0a0f', fontSize: 16, fontWeight: 800,
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 10px 30px rgba(16, 185, 129, 0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                  }}
                >
                  <ArrowLeft size={18} color="#0a0a0f" />
                  Back to Sign In
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Password Reset Success Modal */}
        <AnimatePresence>
          {showResetSuccess && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <motion.div
                key="modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
              />
              <motion.div
                key="modal-content"
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                style={{
                  width: '100%', maxWidth: 440,
                  background: 'rgba(12, 12, 18, 0.95)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  borderRadius: 28, padding: '48px 40px',
                  textAlign: 'center', position: 'relative', zIndex: 1,
                  boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 40px rgba(212, 175, 55, 0.1)'
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2, damping: 15 }}
                  style={{
                    width: 80, height: 80, borderRadius: 24,
                    background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 28px',
                    boxShadow: '0 10px 30px rgba(212, 175, 55, 0.3)'
                  }}
                >
                  <Mail size={40} color="#0a0a0f" />
                </motion.div>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: '0 0 12px', letterSpacing: '-0.02em' }}>Link Transmitted!</h2>
                <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7, margin: '0 0 12px' }}>A secure recovery protocol has been engaged.</p>
                <div style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.2)', marginBottom: 32 }}>
                  <p style={{ color: '#D4AF37', fontSize: 13, fontWeight: 600, margin: 0, lineHeight: 1.6 }}>
                    Check your Work Email for the verification cluster. Follow the instructions to reset your security signature.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowResetSuccess(false);
                    setMode('login');
                    setEmail('');
                  }}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 16,
                    background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                    color: '#0a0a0f', fontSize: 16, fontWeight: 800,
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 10px 30px rgba(212, 175, 55, 0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                  }}
                >
                  <ArrowLeft size={18} color="#0a0a0f" />
                  Back to Sign In
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      <AnimatePresence>
        {isReviewModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div 
              key="modal-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isReviewSubmitting && setIsReviewModalOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(20px)' }} 
            />
            <motion.div
              key="modal-frame"
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              style={{
                width: '100%', maxWidth: 540, background: 'white', borderRadius: 32,
                border: '1px solid rgba(153, 27, 27, 0.1)', overflow: 'hidden', position: 'relative',
                boxShadow: '0 40px 100px rgba(15, 23, 42, 0.3)'
              }}
            >
              {/* Close Button X */}
              <button 
                onClick={() => setIsReviewModalOpen(false)}
                style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(15, 23, 42, 0.05)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
              >
                <X size={18} />
              </button>

              <div style={{ padding: '40px' }}>
                {hasPendingAppeal && message.includes('successfully') ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
                    <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                      <CheckCircle2 size={40} color="#10b981" />
                    </div>
                    <h3 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '0 0 12px' }}>Transmission Successful</h3>
                    <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: '0 0 32px' }}>
                      Your revision request has been securely transmitted to the administrative board. A confirmation email has been dispatched to your registered address.
                    </p>
                    <button 
                      onClick={() => setIsReviewModalOpen(false)}
                      style={{ width: '100%', padding: '16px', borderRadius: 16, background: '#0f172a', color: 'white', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    >
                      Close Protocol
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(153, 27, 27, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RefreshCw size={28} color="#991b1b" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>Revision Request</h3>
                        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Account Restriction Appeal Protocol</p>
                      </div>
                    </div>

                    <div style={{ marginBottom: 32 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Justification Narrative</label>
                      <textarea 
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Provide professional context regarding your access requirements..."
                        style={{ 
                          width: '100%', minHeight: 140, padding: 20, borderRadius: 20, 
                          border: '1px solid #e2e8f0', background: '#f8fafc', 
                          fontSize: 14, color: '#1e293b', resize: 'none', outline: 'none',
                          lineHeight: 1.6, transition: 'border-color 0.2s'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 16 }}>
                      <button 
                        onClick={() => setIsReviewModalOpen(false)}
                        style={{ flex: 1, padding: '16px', borderRadius: 16, background: '#f1f5f9', color: '#475569', border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      >
                        Cancel
                      </button>
                      <button 
                        disabled={isReviewSubmitting || !reviewNotes.trim()}
                        onClick={async () => {
                          setIsReviewSubmitting(true);
                          try {
                            const response = await fetch('/api/auth/submit-appeal', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                email,
                                notes: reviewNotes,
                                originalReason: revocationData?.reason,
                                originalDuration: revocationData?.duration
                              })
                            });

                            if (!response.ok) {
                              const errData = await response.json();
                              throw new Error(errData.error || 'Submission failed');
                            }

                            setReviewNotes('');
                            setHasPendingAppeal(true);
                            setLatestAppeal({ status: 'OPEN', updatedAt: new Date().toISOString(), adminResponse: null, message: reviewNotes, createdAt: new Date().toISOString() });
                            setMessage('Your revision request has been transmitted successfully. Please check your inbox for confirmation.');
                          } catch (err: any) {
                            console.error('Review submission error:', err);
                            setError(`Failed to transmit revision request: ${err.message}`);
                            setIsReviewModalOpen(false);
                          } finally {
                            setIsReviewSubmitting(false);
                          }
                        }}
                        style={{ 
                          flex: 2, padding: '16px', borderRadius: 16, 
                          background: '#991b1b', color: 'white', border: 'none', 
                          fontSize: 13, fontWeight: 900, cursor: (isReviewSubmitting || !reviewNotes.trim()) ? 'not-allowed' : 'pointer', 
                          textTransform: 'uppercase', letterSpacing: '0.1em',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          opacity: (isReviewSubmitting || !reviewNotes.trim()) ? 0.5 : 1,
                          boxShadow: (isReviewSubmitting || !reviewNotes.trim()) ? 'none' : '0 8px 20px rgba(153, 27, 27, 0.3)',
                          transition: 'all 300ms ease'
                        }}
                      >
                        {isReviewSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Transmit Appeal'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#001519' }}>
        <Loader2 className="animate-spin" size={32} color="#003f49" />
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}
