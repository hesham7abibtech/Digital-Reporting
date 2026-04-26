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
  CheckCircle2, Eye, EyeOff, Circle, Briefcase, Home, LifeBuoy
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
      setPersistence(auth, browserSessionPersistence);
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
      console.error('Login error:', err);
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
              <form
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

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', fontSize: 13, fontWeight: 600, display: 'flex', gap: 10, lineHeight: 1.5 }}>
                      <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                      {error}
                    </motion.div>
                  )}

                  {message && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: 13, fontWeight: 600, display: 'flex', gap: 10 }}>
                      <ShieldCheck size={18} style={{ flexShrink: 0 }} />
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
                    disabled={isSubmitting}
                    style={{
                      width: 'fit-content', padding: '12px 40px', borderRadius: 12, marginTop: 4,
                      background: '#003f49', color: 'white', fontSize: 13,
                      fontWeight: 900, border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: '0 8px 24px rgba(0, 63, 73, 0.15)',
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      transition: 'all 300ms', alignSelf: 'center'
                    }}
                  >
                    {isSubmitting ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Loader2 className="animate-spin" size={20} />
                        <span style={{ fontSize: 12 }}>{mode === 'forgot-password' ? 'Transmitting Protocol...' : 'Securing Link...'}</span>
                      </div>
                    ) : mode === 'login' ? (
                      <>Sign In <ChevronRight size={18} /></>
                    ) : mode === 'register' ? (
                      <>Create Account <UserPlus size={18} /></>
                    ) : (
                      <>Send Reset Link <ChevronRight size={18} /></>
                    )}
                  </button>
              </form>
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
              />
              <motion.div
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
              />
              <motion.div
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

        <TicketRequestModal 
        isOpen={isTicketModalOpen} 
        onClose={() => setIsTicketModalOpen(false)} 
        defaultReason="Administrative Access Request"
        defaultMessage="I am requesting administrative clearance for the project Command Center. Please review my identity signature."
      />
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
