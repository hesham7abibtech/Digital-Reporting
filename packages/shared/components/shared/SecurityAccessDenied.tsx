'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  Lock, 
  ChevronRight, 
  LifeBuoy, 
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import TicketRequestModal from './TicketRequestModal';

export default function SecurityAccessDenied() {
  const router = useRouter();
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#0a0a0f',
      padding: 24,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient backgrounds */}
      <div style={{ position: 'absolute', top: '10%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.03) 0%, transparent 70%)', filter: 'blur(80px)' }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: 540,
          background: 'rgba(15, 15, 25, 0.7)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(212, 175, 55, 0.15)',
          borderRadius: 32,
          padding: '60px 48px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
          boxShadow: '0 40px 100px rgba(0, 0, 0, 0.6), inset 0 0 40px rgba(212, 175, 55, 0.05)'
        }}
      >
        <div style={{ 
          width: 80, height: 80, borderRadius: 28, 
          background: 'linear-gradient(135deg, #D4AF37 0%, #8B6B1D 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 32px',
          boxShadow: '0 15px 35px rgba(212, 175, 55, 0.3)',
          position: 'relative'
        }}>
          <Lock size={36} color="#050510" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: 'absolute', inset: -4, borderRadius: 32, border: '2px solid #D4AF37' }} 
          />
        </div>

        <h1 style={{ 
          fontSize: 32, 
          fontWeight: 900, 
          color: 'white', 
          margin: '0 0 16px', 
          letterSpacing: '-0.02em',
          textTransform: 'uppercase'
        }}>
          Security Lockdown
        </h1>
        
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 8, 
          padding: '6px 14px', 
          borderRadius: 100, 
          background: 'rgba(212, 175, 55, 0.1)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          marginBottom: 24
        }}>
          <ShieldAlert size={14} color="#D4AF37" />
          <span style={{ fontSize: 11, fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Insufficient Credentials
          </span>
        </div>

        <p style={{ 
          fontSize: 16, 
          color: 'rgba(255, 255, 255, 0.5)', 
          lineHeight: 1.7,
          margin: '0 0 40px',
          fontWeight: 500
        }}>
          Your security profile does not currently hold administrative clearance for this terminal. 
          If you believe this is a technical oversight, please initiate a clearance request below.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button
            onClick={() => setIsTicketModalOpen(true)}
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: 18,
              background: '#D4AF37',
              color: '#050510',
              fontSize: 15,
              fontWeight: 900,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              boxShadow: '0 10px 25px rgba(212, 175, 55, 0.2)',
              transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Request Access Clearance
            <KeyRound size={18} />
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                padding: '16px',
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: 13,
                fontWeight: 800,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 300ms ease'
              }}
            >
              <ArrowLeft size={16} />
              Return Home
            </button>

            <button
              onClick={() => setIsTicketModalOpen(true)}
              style={{
                padding: '16px',
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: 13,
                fontWeight: 800,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 300ms ease'
              }}
            >
              <LifeBuoy size={16} />
              Contact Support
            </button>
          </div>
        </div>
      </motion.div>

      <TicketRequestModal 
        isOpen={isTicketModalOpen} 
        onClose={() => setIsTicketModalOpen(false)} 
        defaultReason="Administrative Access Request"
        defaultMessage="I encountered a security lockdown while attempting to access the Administrative Command Center. Please review my credentials for elevated access."
      />
    </div>
  );
}
