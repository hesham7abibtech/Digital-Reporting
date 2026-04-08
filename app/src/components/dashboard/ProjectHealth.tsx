'use client';

import { motion } from 'framer-motion';
import ProgressRing from '@/components/shared/ProgressRing';
import GlassCard from '@/components/shared/GlassCard';
import { projectHealth } from '@/lib/data';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const trendIcons = {
  improving: <TrendingUp size={13} color="#10b981" />,
  declining: <TrendingDown size={13} color="#ef4444" />,
  stable: <Minus size={13} color="#f59e0b" />,
};

export default function ProjectHealth() {
  const metrics = [
    projectHealth.overall,
    projectHealth.schedule,
    projectHealth.cost,
    projectHealth.resource,
    projectHealth.documentation,
    projectHealth.communication,
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
    >
      <GlassCard padding="sm" hover={false}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 20px',
            gap: 8,
          }}
        >
          {/* Title */}
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', marginRight: 16 }}>
            Project Health
          </h3>

          {/* Metrics in a horizontal row */}
          <div style={{ display: 'flex', flex: 1, justifyContent: 'space-around', gap: 12 }}>
            {metrics.map((metric, i) => (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.05, duration: 0.4 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <ProgressRing score={metric.score} size={56} strokeWidth={4} showLabel={false} />
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{metric.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    {trendIcons[metric.trend]}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{metric.trend}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
