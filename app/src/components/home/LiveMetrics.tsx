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
  const sectionRef = useRef(null);
  const gridRef = useRef(null);
  const sectionInView = useInView(sectionRef, { once: true, margin: '-40px' });
  const gridInView = useInView(gridRef, { once: true, margin: '0px' });
  const visibleItems = items.filter(m => m.isVisible);

  return (
    <section ref={sectionRef} style={{
      padding: '40px 24px 100px',
      background: 'var(--teal)',
      position: 'relative', overflow: 'hidden',
      height: 'fit-content'
    }}>
      {/* Background decorations */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse 60% 50% at 20% 50%, rgba(212, 175, 55, 0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse 50% 60% at 80% 50%, rgba(0, 242, 255, 0.03) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={sectionInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 18 }}>
            <div style={{ width: 40, height: 1, background: 'rgba(212, 175, 55, 0.3)' }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.4em' }}>
              Strategic Intelligence
            </span>
            <div style={{ width: 40, height: 1, background: 'rgba(212, 175, 55, 0.3)' }} />
          </div>
          <h2 className="brand-heading" style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: 'white', margin: 0, fontWeight: 300 }}>
            Project <span style={{ fontWeight: 900, color: 'var(--gold)' }}>at a Glance</span>
          </h2>
        </motion.div>

        {/* Metrics Grid */}
        <div ref={gridRef} style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(visibleItems.length, 4)}, 1fr)`,
          gap: 24,
        }}>
          {visibleItems.map((metric, i) => {
            const Icon = lucideIconMap[metric.icon] || Activity;
            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 30 }}
                animate={gridInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  padding: '40px 32px', borderRadius: 24, textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 24px',
                  color: 'var(--gold)'
                }}>
                  <Icon size={24} />
                </div>

                <div style={{ fontSize: 'clamp(32px, 4vw, 40px)', fontWeight: 900, color: 'white', lineHeight: 1, marginBottom: 12, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                  <AnimatedCounter value={metric.value} duration={2500} prefix={metric.prefix || ''} suffix={metric.suffix || ''} startCounting={gridInView} />
                </div>

                <p style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>
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
