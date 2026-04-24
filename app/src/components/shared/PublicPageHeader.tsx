'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

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
      padding: '16px 24px',
      background: 'rgba(0, 63, 73, 0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(208, 171, 130, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ 
            width: 44, 
            height: 44, 
            borderRadius: 12, 
            background: 'linear-gradient(135deg, var(--sunlit-rock) 0%, #003f49 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <ShieldCheck size={26} color="white" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 className="brand-heading" style={{ 
              fontSize: 15, 
              color: 'var(--cotton)', 
              margin: 0, 
              letterSpacing: '0.2em',
              fontWeight: 400
            }}>
              REH COMMAND CENTER
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                padding: '3px 10px', 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <img src="/logos/modon_logo.png" alt="MODON" style={{ height: 8, opacity: 0.9, filter: 'brightness(0) invert(1)' }} />
                <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.15)' }} />
                <img src="/logos/insite_logo.png" alt="INSITE" style={{ height: 8, opacity: 0.9, filter: 'brightness(0) invert(1)' }} />
              </div>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--sunlit-rock)', opacity: 0.6 }} />
              <span style={{ fontSize: 8, color: 'var(--sunlit-rock)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                Official Platform
              </span>
            </div>
          </div>
        </Link>
      </div>

      <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link href="/" style={{
          fontSize: 11,
          color: 'rgba(249, 248, 242, 0.6)',
          textDecoration: 'none',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          fontWeight: 800,
          transition: 'all 200ms'
        }} className="hover:!text-[var(--sunlit-rock)]">
          Home
        </Link>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(208, 171, 130, 0.4)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push(isLoggedIn ? '/dashboard' : '/login')}
          style={{
            padding: '12px 28px',
            borderRadius: 14,
            background: 'var(--sunlit-rock)',
            color: 'var(--teal)',
            fontSize: 11,
            fontWeight: 900,
            border: 'none',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            boxShadow: '0 4px 15px rgba(208, 171, 130, 0.25)',
            transition: 'all 250ms'
          }}
        >
          {isLoggedIn ? 'Access Dashboard' : 'Member Login'}
        </motion.button>
      </nav>
    </header>
  );
}
