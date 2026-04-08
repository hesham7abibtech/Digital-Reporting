'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, getProjectMetadata } from '@/services/FirebaseService';
import { useAuth } from '@/context/AuthContext';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';
import { ProjectMetadata } from '@/lib/types';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  Lock, Mail, Loader2, Globe, ShieldCheck, 
  UserPlus, ArrowLeft, User, ShieldAlert,
  ChevronRight, Fingerprint, Database, Cpu,
  CheckCircle2
} from 'lucide-react';
import ParticleBackground from '@/components/layout/ParticleBackground';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'unauthorized';

function AdminLoginContent() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanned, setIsScanned] = useState(false);
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, loading, authError } = useAuth();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized') {
      setMode('unauthorized');
      setError('ACCESS DENIED: Insufficient administrative clearance detected.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (loading) return;

    // Handle Profile Fetch Errors (usually from Firestore rules)
    if (user && authError) {
      setError(`IDENTITY SYNC FAILURE: ${authError}`);
      setIsSubmitting(false);
      return;
    }

    // Handle Success and Role Check
    if (user && userProfile) {
      const isAuthorized = 
        userProfile.role === 'ADMIN' || 
        userProfile.role === 'SUPER_ADMIN' || 
        userProfile.role === 'OWNER';

      if (isAuthorized) {
        router.push('/admin/dashboard');
      } else {
        // User is logged in but lacks admin role
        setMode('unauthorized');
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
      if (projectMetadata?.allowedDomains && projectMetadata.allowedDomains.length > 0) {
        const userDomain = email.split('@')[1]?.toLowerCase();
        if (!userDomain || !projectMetadata.allowedDomains.includes(userDomain)) {
          setError(`ACCESS DENIED: Your identity domain (@${userDomain}) is not authorized for this project. Authorized domains: @${projectMetadata.allowedDomains.join(', @')}.`);
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Ensure strict session persistence before sign-in
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
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
      if (projectMetadata?.allowedDomains && projectMetadata.allowedDomains.length > 0) {
        const userDomain = email.split('@')[1]?.toLowerCase();
        if (!userDomain || !projectMetadata.allowedDomains.includes(userDomain)) {
          setError(`SECURITY ALERT: Unauthorized Domain Signature. Registration is restricted to authorized project domains (@${projectMetadata.allowedDomains.join(', @')}).`);
          setIsSubmitting(false);
          return;
        }
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      await createUserProfile(userCredential.user.uid, {
        name,
        email,
        role: 'USER',
        status: 'PENDING_APPROVAL'
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
      await sendPasswordResetEmail(auth, email);
      setMessage('A password reset link has been sent to your email. Please check your inbox.');
      setMode('login');
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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
        <Loader2 className="animate-spin" size={32} color="#D4AF37" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflow: 'hidden' }}>
      <ParticleBackground />
      
      <div style={{ position: 'absolute', top: '10%', left: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        key={mode}
        style={{
          width: '100%',
          maxWidth: 480,
          background: mode === 'unauthorized' ? 'rgba(24, 12, 12, 0.9)' : 'rgba(12, 12, 18, 0.8)',
          backdropFilter: 'blur(40px)',
          border: mode === 'unauthorized' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(255,255,255,0.06)',
          borderRadius: 32,
          boxShadow: mode === 'unauthorized' 
            ? '0 40px 100px -20px rgba(239, 68, 68, 0.2), inset 0 0 20px rgba(239, 68, 68, 0.05)'
            : '0 40px 100px -20px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.05)',
          overflow: 'hidden',
          zIndex: 10,
          position: 'relative'
        }}
        onMouseEnter={() => setIsScanned(true)}
        onMouseLeave={() => setIsScanned(false)}
      >
        <AnimatePresence>
          {isScanned && (
            <motion.div 
              initial={{ top: '0%' }}
              animate={{ top: '100%' }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', left: 0, right: 0, height: '2px',
                background: mode === 'unauthorized'
                  ? 'linear-gradient(to right, transparent, rgba(239, 68, 68, 0.5), transparent)'
                  : 'linear-gradient(to right, transparent, rgba(212, 175, 55, 0.5), transparent)',
                boxShadow: mode === 'unauthorized'
                  ? '0 0 15px rgba(239, 68, 68, 0.8)'
                  : '0 0 15px rgba(212, 175, 55, 0.8)',
                zIndex: 20, pointerEvents: 'none'
              }}
            />
          )}
        </AnimatePresence>

        <div style={{ padding: '48px 48px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <motion.div 
              animate={mode === 'unauthorized' ? {
                scale: [1, 1.05, 1],
                filter: ['drop-shadow(0 0 10px rgba(239, 68, 68, 0))', 'drop-shadow(0 0 30px rgba(239, 68, 68, 0.5))', 'drop-shadow(0 0 10px rgba(239, 68, 68, 0))'],
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ 
                width: 72, height: 72, borderRadius: 22, 
                background: mode === 'unauthorized' 
                  ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                  : 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden'
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)', opacity: 0.5 }} />
              {mode === 'unauthorized' ? <ShieldAlert size={36} color="white" /> : <ShieldCheck size={36} color="white" />}
            </motion.div>
          </div>
          
          <motion.h1 
            animate={mode === 'unauthorized' ? { x: [-1, 1, -1, 1, 0], opacity: [1, 0.8, 1] } : {}}
            transition={{ duration: 0.1, repeat: mode === 'unauthorized' ? 5 : 0 }}
            style={{ 
              fontSize: 32, fontWeight: 900, textAlign: 'center', margin: '0 0 10px', 
              letterSpacing: '-0.04em', background: mode === 'unauthorized' 
                ? 'linear-gradient(to bottom, #fca5a5, #ef4444)'
                : 'linear-gradient(to bottom, #fff, #94a3b8)', 
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              fontFamily: 'var(--font-heading)'
            }}
          >
            {mode === 'login' ? 'Auth Required' : 
             mode === 'register' ? 'Account Provision' : 
             mode === 'forgot-password' ? 'Recov Protocol' : 
             'Restricted Access'}
          </motion.h1>
          <p style={{ textAlign: 'center', color: mode === 'unauthorized' ? '#fca5a5' : '#64748b', fontSize: 15, marginBottom: 40, fontWeight: 500, letterSpacing: '0.01em', opacity: 0.8 }}>
            {mode === 'login' ? 'Sign in to access the admin dashboard' : 
             mode === 'register' ? 'Create a new account to get started' : 
             mode === 'forgot-password' ? 'Enter your email to reset your password' : 
             'UNAUTHORIZED CLEARANCE DETECTED'}
          </p>

          <AnimatePresence mode="wait">
            {mode === 'unauthorized' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{ padding: '24px', borderRadius: 24, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: 32, position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(45deg, transparent, rgba(239, 68, 68, 0.05), transparent)', animation: 'pulse 3s infinite' }} />
                   <p style={{ fontSize: 14, color: '#fca5a5', lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
                     Identity verified as <span style={{ color: 'white' }}>{user?.email}</span>. However, your account has not been granted administrative privileges for the Command Center.
                   </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button 
                    onClick={() => {
                       setMessage('ELEVATION REQUEST TRANSMITTED: Awaiting Admin approval.');
                       setTimeout(() => setMessage(''), 5000);
                    }}
                    style={{ 
                      width: '100%', padding: '16px', borderRadius: 16, 
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', 
                      color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 13,
                      textTransform: 'uppercase', letterSpacing: '0.1em'
                    }}
                  >
                    Request Elevated Clearance
                  </button>
                  
                  <button 
                    onClick={() => {
                      auth.signOut();
                      setMode('login');
                      setError('');
                    }}
                    style={{ width: '100%', padding: '12px', background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <ArrowLeft size={16} /> Terminate Connection
                  </button>
                </div>
              </motion.div>
            ) : (
              <form 
                onSubmit={mode === 'register' ? handleRegister : mode === 'forgot-password' ? handleResetPassword : handleLogin} 
                style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
              >
                {mode === 'register' && (
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
                    <input
                      type="text"
                      placeholder="FullName / ID"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={{
                        width: '100%', padding: '16px 16px 16px 48px', borderRadius: 16,
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                        color: 'white', fontSize: 16, outline: 'none', transition: 'all 300ms'
                      }}
                    />
                  </div>
                )}

                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
                  <input
                    type="email"
                    placeholder="Terminal Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '16px 16px 16px 48px', borderRadius: 16,
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                      color: 'white', fontSize: 16, outline: 'none', transition: 'all 300ms'
                    }}
                  />
                </div>

                {mode !== 'forgot-password' && (
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
                    <input
                      type="password"
                      placeholder="Security Signature (Password)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{
                        width: '100%', padding: '16px 16px 16px 48px', borderRadius: 16,
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                        color: 'white', fontSize: 16, outline: 'none', transition: 'all 300ms'
                      }}
                    />
                  </div>
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
                    <button type="button" onClick={() => setMode('forgot-password')} style={{ background: 'transparent', border: 'none', color: '#D4AF37', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Forgotten Credentials?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 16,
                    background: '#D4AF37',
                    color: '#0a0a0f', fontSize: 16, fontWeight: 800, border: 'none',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all 300ms',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                    boxShadow: '0 10px 30px rgba(212, 175, 55, 0.2)',
                    letterSpacing: '0.02em', textTransform: 'uppercase'
                  }}
                >
                  {isSubmitting ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Loader2 className="animate-spin" size={20} />
                      <span style={{ fontSize: 12 }}>Securing Link...</span>
                    </div>
                  ) : mode === 'login' ? (
                    <>Sign In <ChevronRight size={18} /></>
                  ) : mode === 'register' ? (
                    <>Create Account <UserPlus size={18} /></>
                  ) : (
                    <>Send Reset Link <ArrowLeft size={18} /></>
                  )}
                </button>
              </form>
            )}
          </AnimatePresence>

          {mode !== 'unauthorized' && (
            <div style={{ marginTop: 32, textAlign: 'center' }}>
              <button 
                onClick={() => {
                  setError('');
                  setMessage('');
                  setMode(mode === 'login' ? 'register' : 'login');
                }} 
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto' }}
              >
                {mode === 'login' ? (
                  <><UserPlus size={16} /> Don&apos;t have an account? Create one</>
                ) : (
                  <><ArrowLeft size={16} /> Back to Sign In</>
                )}
              </button>
            </div>
          )}
        </div>
        
        <div style={{ 
          padding: '16px 40px', background: 'rgba(0,0,0,0.3)', 
          borderTop: '1px solid rgba(255,255,255,0.03)', 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              <div style={{ width: 4, height: 10, background: '#10b981', borderRadius: 1 }} />
              <div style={{ width: 4, height: 10, background: '#10b981', borderRadius: 1 }} />
              <div style={{ width: 4, height: 10, background: isScanned ? '#10b981' : '#334155', borderRadius: 1 }} />
            </div>
            <span style={{ fontSize: 11, color: '#4b5563', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Signal Link High
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
             <Cpu size={14} color="#334155" />
             <Database size={14} color="#334155" />
             <Fingerprint size={14} color="#334155" />
          </div>
        </div>
      </motion.div>


      <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.5 }}>
        <Globe size={14} color="#4b5563" />
        <span style={{ fontSize: 12, color: '#4b5563', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Global Registry Monitoring Active
        </span>
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
                borderRadius: 28,
                padding: '48px 40px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
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
                <CheckCircle2 size={40} color="white" />
              </motion.div>

              <h2 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
                Account Created!
              </h2>
              <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7, margin: '0 0 12px' }}>
                Your account has been created successfully.
              </p>
              <div style={{
                padding: '16px 20px', borderRadius: 16,
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                marginBottom: 32
              }}>
                <p style={{ color: '#fbbf24', fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.6 }}>
                  ⏳ Your account is pending admin approval. You will be able to sign in once an administrator activates your account.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowRegistrationSuccess(false);
                  setMode('login');
                  setEmail('');
                  setPassword('');
                  setName('');
                }}
                style={{
                  width: '100%', padding: '16px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white', fontSize: 16, fontWeight: 800,
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(16, 185, 129, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                }}
              >
                <ArrowLeft size={18} />
                Back to Sign In
              </button>
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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
        <Loader2 className="animate-spin" size={32} color="#D4AF37" />
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}


