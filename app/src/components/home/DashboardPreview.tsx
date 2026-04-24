'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Lock, ArrowRight } from 'lucide-react';

interface DashboardPreviewProps {
  screenshotUrl: string;
  isBlurred: boolean;
  overlayText: string;
  onLoginClick: () => void;
}

export default function DashboardPreview({ screenshotUrl, isBlurred, overlayText, onLoginClick }: DashboardPreviewProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} style={{
      padding: '100px 24px',
      background: 'linear-gradient(180deg, var(--haze) 0%, var(--aqua) 100%)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 40, height: 1, background: 'var(--sunlit-rock)' }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
              Dashboard Preview
            </span>
            <div style={{ width: 40, height: 1, background: 'var(--sunlit-rock)' }} />
          </div>
          <h2 className="brand-heading" style={{ fontSize: 'clamp(24px, 4vw, 38px)', color: 'var(--teal)', margin: '0 0 14px' }}>
            Powerful Insights Await
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-dim)', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            Access comprehensive analytics, real-time KPIs, and professional reports — all in one secure platform.
          </p>
        </motion.div>

        {/* Preview Container */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.7 }}
          style={{
            position: 'relative', borderRadius: 24, overflow: 'hidden',
            border: '1px solid rgba(0, 63, 73, 0.1)',
            boxShadow: '0 25px 80px rgba(0, 63, 73, 0.1), 0 8px 24px rgba(0, 63, 73, 0.05)',
          }}
        >
          {/* Screenshot */}
          <img
            src={screenshotUrl}
            alt="Dashboard Preview"
            style={{
              width: '100%', height: 'auto', display: 'block',
              filter: isBlurred ? 'blur(8px) brightness(0.85)' : 'none',
              transition: 'filter 500ms',
            }}
          />

          {/* Overlay */}
          {isBlurred && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(0,63,73,0.2) 0%, rgba(0,63,73,0.5) 100%)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 20, padding: 40,
            }}>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                style={{
                  width: 64, height: 64, borderRadius: 20,
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Lock size={28} color="var(--cotton)" />
              </motion.div>

              <p style={{
                fontSize: 18, fontWeight: 700, color: 'var(--cotton)',
                textAlign: 'center', textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              }}>
                {overlayText}
              </p>

              <motion.button
                whileHover={{ scale: 1.05, background: 'rgba(208, 171, 130, 0.9)', boxShadow: '0 12px 40px rgba(208, 171, 130, 0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={onLoginClick}
                style={{
                  padding: '18px 42px', borderRadius: 20,
                  background: 'var(--gold)',
                  color: '#000000', fontSize: 15, fontWeight: 900,
                  border: 'none', cursor: 'pointer',
                  textTransform: 'uppercase', letterSpacing: '0.15em',
                  display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: '0 8px 30px rgba(208, 171, 130, 0.3)',
                  transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                Access Dashboard <ArrowRight size={18} />
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
