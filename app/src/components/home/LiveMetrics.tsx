'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FileText, Layers, Box, BarChart3, Database, Globe, Shield, Activity } from 'lucide-react';
import AnimatedCounter from '@/components/shared/AnimatedCounter';
import type { HomeMetricItem } from '@/lib/types';

interface LiveMetricsProps {
  items: HomeMetricItem[];
}

const lucideIconMap: Record<string, any> = {
  FileText, Layers, Box, BarChart3, Database, Globe, Shield, Activity,
};

export default function LiveMetrics({ items }: LiveMetricsProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const visibleItems = items.filter(m => m.isVisible);

  return (
    <section ref={ref} style={{
      padding: '80px 24px',
      background: 'var(--teal)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background decorations */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse 60% 50% at 20% 50%, rgba(208,171,130,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse 50% 60% at 80% 50%, rgba(198,224,224,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 50 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 40, height: 1, background: 'rgba(208,171,130,0.4)' }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
              Live Metrics
            </span>
            <div style={{ width: 40, height: 1, background: 'rgba(208,171,130,0.4)' }} />
          </div>
          <h2 className="brand-heading" style={{ fontSize: 'clamp(24px, 4vw, 38px)', color: 'var(--cotton)', margin: 0 }}>
            Project at a Glance
          </h2>
        </motion.div>

        {/* Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(visibleItems.length, 4)}, 1fr)`,
          gap: 20,
        }}>
          {visibleItems.map((metric, i) => {
            const Icon = lucideIconMap[metric.icon] || Activity;
            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ delay: 0.2 + i * 0.12, duration: 0.6, ease: 'easeOut' }}
                style={{
                  padding: '32px 24px', borderRadius: 22, textAlign: 'center',
                  background: 'rgba(249, 248, 242, 0.06)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(249, 248, 242, 0.08)',
                  transition: 'all 300ms ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(249, 248, 242, 0.1)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(208,171,130,0.3)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(249, 248, 242, 0.06)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(249, 248, 242, 0.08)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'rgba(208, 171, 130, 0.12)',
                  border: '1px solid rgba(208, 171, 130, 0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 18px',
                }}>
                  <Icon size={22} color="var(--sunlit-rock)" />
                </div>

                <div style={{ fontSize: 'clamp(30px, 4vw, 42px)', fontWeight: 900, color: 'var(--cotton)', lineHeight: 1, marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                  {inView ? (
                    <AnimatedCounter value={metric.value} duration={2000} suffix={metric.suffix || ''} />
                  ) : (
                    '0'
                  )}
                </div>

                <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(249, 248, 242, 0.5)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>
                  {metric.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
