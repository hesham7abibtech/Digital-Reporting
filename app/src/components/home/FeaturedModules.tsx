'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Box, FileText, BarChart3, Database, Globe, Shield, Activity, Layers, Cpu, Zap } from 'lucide-react';
import type { HomeModuleItem } from '@/lib/types';

interface FeaturedModulesProps {
  items: HomeModuleItem[];
}

const lucideIconMap: Record<string, any> = {
  Box, FileText, BarChart3, Database, Globe, Shield, Activity, Layers, Cpu, Zap,
};

export default function FeaturedModules({ items }: FeaturedModulesProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const sorted = [...items].sort((a, b) => a.order - b.order);

  return (
    <section ref={ref} style={{ padding: '100px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: 56 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 40, height: 1, background: 'var(--sunlit-rock)' }} />
          <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
            Platform Capabilities
          </span>
          <div style={{ width: 40, height: 1, background: 'var(--sunlit-rock)' }} />
        </div>
        <h2 className="brand-heading" style={{ fontSize: 'clamp(24px, 4vw, 38px)', color: 'var(--teal)', margin: '0 0 16px' }}>
          Featured Modules
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-dim)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          An integrated suite of enterprise-grade digital tools designed to streamline every aspect of mega-project delivery.
        </p>
      </motion.div>

      {/* Modules Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 20,
      }}>
        {sorted.map((mod, i) => {
          const Icon = lucideIconMap[mod.icon] || Activity;
          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 25 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}
              style={{
                padding: '32px 28px', borderRadius: 22,
                background: 'rgba(255, 255, 255, 0.55)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 63, 73, 0.08)',
                boxShadow: '0 4px 20px rgba(0, 63, 73, 0.03)',
                transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'default', position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(-6px)';
                el.style.boxShadow = '0 20px 50px rgba(0, 63, 73, 0.08)';
                el.style.borderColor = 'rgba(208, 171, 130, 0.25)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = '0 4px 20px rgba(0, 63, 73, 0.03)';
                el.style.borderColor = 'rgba(0, 63, 73, 0.08)';
              }}
            >
              {/* Subtle gradient accent */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: 'linear-gradient(90deg, var(--teal), var(--sunlit-rock))',
                opacity: 0.4, borderRadius: '22px 22px 0 0',
              }} />

              <div style={{
                width: 50, height: 50, borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(0, 63, 73, 0.08), rgba(208, 171, 130, 0.08))',
                border: '1px solid rgba(0, 63, 73, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 18,
              }}>
                <Icon size={22} color="var(--teal)" />
              </div>

              <h3 style={{
                fontSize: 16, fontWeight: 800, color: 'var(--teal)',
                margin: '0 0 10px', letterSpacing: '0.02em',
                fontFamily: 'var(--font-sans)',
              }}>
                {mod.title}
              </h3>

              <p style={{
                fontSize: 13, color: 'var(--text-dim)', margin: 0, lineHeight: 1.7,
              }}>
                {mod.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
