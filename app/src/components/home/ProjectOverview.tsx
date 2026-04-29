'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Building2, MapPin, Users, Target, Sparkles } from 'lucide-react';
import type { HomeOverviewConfig } from '@/lib/types';

interface ProjectOverviewProps {
  config: HomeOverviewConfig;
}

const iconMap: Record<string, any> = {
  developer: Building2,
  consultant: Users,
  location: MapPin,
  scope: Target,
};

export default function ProjectOverview({ config }: ProjectOverviewProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const infoCards = [
    { key: 'developer', label: 'Developer', value: config.developer },
    { key: 'consultant', label: 'Consultant', value: config.consultant },
    { key: 'location', label: 'Location', value: config.location },
    { key: 'scope', label: 'Scope', value: config.scope },
  ];

  return (
    <section ref={ref} style={{
      padding: '100px 24px', maxWidth: 1200, margin: '0 auto', position: 'relative',
    }}>
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        style={{ textAlign: 'center', marginBottom: 60 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 1, background: 'var(--sunlit-rock)' }} />
          <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
            Project Overview
          </span>
          <div style={{ width: 40, height: 1, background: 'var(--sunlit-rock)' }} />
        </div>
        <h2 className="brand-heading" style={{
          fontSize: 'clamp(24px, 4vw, 40px)', color: 'var(--teal)', margin: '0 0 20px',
        }}>
          Redefining Mega-Scale Development
        </h2>
        <p style={{
          fontSize: 16, color: 'var(--text-dim)', maxWidth: 700, margin: '0 auto',
          lineHeight: 1.7,
        }}>
          {config.description}
        </p>
      </motion.div>

      {/* Info Cards Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20, marginBottom: 60,
      }}>
        {infoCards.map((card, i) => {
          const Icon = iconMap[card.key] || Target;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              style={{
                padding: '28px 24px', borderRadius: 20,
                background: 'rgba(255, 255, 255, 0.55)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 63, 73, 0.08)',
                boxShadow: '0 4px 20px rgba(0, 63, 73, 0.04)',
                transition: 'all 300ms ease',
                cursor: 'default',
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0, 63, 73, 0.08)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(208, 171, 130, 0.3)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0, 63, 73, 0.04)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0, 63, 73, 0.08)';
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: 'rgba(0, 63, 73, 0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
                border: '1px solid rgba(0, 63, 73, 0.1)',
              }}>
                <Icon size={20} color="var(--teal)" />
              </div>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--sunlit-rock)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>
                {card.label}
              </p>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--teal)', margin: 0, lineHeight: 1.4 }}>
                {card.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Highlights */}
      {config.highlights?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7, duration: 0.6 }}
          style={{
            display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center',
          }}
        >
          {config.highlights.map((hl, i) => (
            <span key={i} style={{
              padding: '10px 20px', borderRadius: 100,
              background: 'rgba(0, 63, 73, 0.05)',
              border: '1px solid rgba(0, 63, 73, 0.1)',
              fontSize: 12, fontWeight: 700, color: 'var(--teal)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Sparkles size={12} color="var(--sunlit-rock)" /> {hl}
            </span>
          ))}
        </motion.div>
      )}
    </section>
  );
}
