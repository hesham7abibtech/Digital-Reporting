'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function PublicPageHeader() {
  const { user } = useAuth();
  const router = useRouter();
  const isLoggedIn = !!user;

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      padding: '20px 24px',
      background: 'rgba(0, 63, 73, 0.8)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            borderRadius: 10, 
            background: 'linear-gradient(135deg, var(--sunlit-rock) 0%, #003f49 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            <ShieldCheck size={24} color="white" />
          </div>
          <div>
            <h1 className="brand-heading" style={{ 
              fontSize: 16, 
              color: 'var(--cotton)', 
              margin: 0, 
              letterSpacing: '0.15em',
              fontWeight: 600
            }}>
              REH COMMAND CENTER
            </h1>
            <p style={{ 
              fontSize: 9, 
              color: 'var(--sunlit-rock)', 
              margin: 0, 
              textTransform: 'uppercase', 
              letterSpacing: '0.2em',
              fontWeight: 800
            }}>
              Digital Reporting Platform
            </p>
          </div>
        </Link>
      </div>

      <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/" style={{
          fontSize: 12,
          color: 'rgba(249, 248, 242, 0.7)',
          textDecoration: 'none',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 600,
          transition: 'color 200ms'
        }} className="hover:!text-[var(--sunlit-rock)]">
          Home
        </Link>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push(isLoggedIn ? '/dashboard' : '/login')}
          style={{
            padding: '10px 24px',
            borderRadius: 12,
            background: 'var(--sunlit-rock)',
            color: 'var(--teal)',
            fontSize: 12,
            fontWeight: 900,
            border: 'none',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            boxShadow: '0 4px 12px rgba(208, 171, 130, 0.3)'
          }}
        >
          {isLoggedIn ? 'Dashboard' : 'Login'}
        </motion.button>
      </nav>
    </header>
  );
}
