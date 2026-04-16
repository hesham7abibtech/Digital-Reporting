'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface TrustBandProps {
  logos: Array<{ id: string; url: string; name: string }>;
  statement: string;
}

export default function TrustBand({ logos, statement }: TrustBandProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref} style={{
      padding: '80px 24px',
      background: 'rgba(0, 63, 73, 0.03)',
      borderTop: '1px solid rgba(0, 63, 73, 0.06)',
      borderBottom: '1px solid rgba(0, 63, 73, 0.06)',
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 40, height: 1, background: 'var(--sunlit-rock)' }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
              Trusted Partners
            </span>
            <div style={{ width: 40, height: 1, background: 'var(--sunlit-rock)' }} />
          </div>

          <p style={{
            fontSize: 15, color: 'var(--text-dim)', maxWidth: 600, margin: '0 auto 40px',
            lineHeight: 1.7,
          }}>
            {statement}
          </p>
        </motion.div>

        {/* Logos */}
        {logos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 40, flexWrap: 'wrap',
            }}
          >
            {logos.map((logo, i) => (
              <motion.div
                key={logo.id}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.4 + i * 0.1 }}
                style={{
                  padding: '12px 20px', borderRadius: 12,
                  filter: 'grayscale(100%) opacity(0.5)',
                  transition: 'all 300ms',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.filter = 'grayscale(0%) opacity(1)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.filter = 'grayscale(100%) opacity(0.5)';
                }}
              >
                <img src={logo.url} alt={logo.name} style={{ height: 40, width: 'auto', maxWidth: 120, objectFit: 'contain' }} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {logos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
            style={{
              display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap',
            }}
          >
            {['MODON', 'KEO International', 'Insite International'].map((name, i) => (
              <div key={i} style={{
                padding: '12px 28px', borderRadius: 12,
                background: 'rgba(0, 63, 73, 0.04)',
                border: '1px solid rgba(0, 63, 73, 0.06)',
                color: 'var(--text-dim)', fontSize: 12, fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                {name}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
