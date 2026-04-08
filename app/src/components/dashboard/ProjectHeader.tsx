'use client';

import { motion } from 'framer-motion';
import { Building2, MapPin, Users } from 'lucide-react';
import ProgressRing from '@/components/shared/ProgressRing';
import type { TeamMember, ProjectMetadata, Task } from '@/lib/types';

interface ProjectHeaderProps {
  members?: TeamMember[];
  progress?: number;
  project?: ProjectMetadata;
  tasks?: Task[];
}

export default function ProjectHeader({ 
  members, 
  progress,
  project,
  tasks
}: ProjectHeaderProps) {
  const onlineMembers = members?.filter(m => m.isOnline).length ?? 0;
  const progressScore = progress ?? 0;

  // AI Status Intelligence
  const { statusLine, statusColor } = (() => {
    const delayedCount = tasks?.filter(t => t.status === 'DELAYED').length ?? 0;
    
    if (delayedCount > 0) return { statusLine: 'Critical Delay Detected', statusColor: '#ef4444' };
    if (progressScore >= 90) return { statusLine: 'Finalizing Hub Node', statusColor: '#10b981' };
    if (progressScore >= 50) return { statusLine: 'Optimized / In-Progress', statusColor: '#3b82f6' };
    return { statusLine: project?.statusLine || 'Node Operational', statusColor: project?.statusColor || '#f59e0b' };
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-card"
      style={{ padding: '16px 24px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        {/* Left - Project Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(to right, #fff, #e2e8f0, #94a3b8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
              }}
            >
              {project?.title} - {project?.projectName}
            </h1>
            {/* Members count — in title row */}
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 9999,
                background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)',
                fontSize: 14, fontWeight: 500, color: '#06b6d4', flexShrink: 0,
              }}
            >
              <Users size={14} />
              {(() => {
                const totalMembers = members?.length || 0;
                // Try to extract capacity from memberCount string (e.g. "10/15" or "15")
                const capacityMatch = project?.memberCount?.match(/\/?(\d+)/);
                const capacity = capacityMatch ? capacityMatch[capacityMatch.length - 1] : totalMembers;
                return `${totalMembers} / ${capacity} Members`;
              })()}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, fontSize: 15, color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={14} style={{ color: 'var(--text-muted)' }} />
                {project?.subtitle}
              </span>
              <span style={{ color: 'var(--text-dim)' }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                {project?.location}
              </span>
            </div>
          </div>

          {/* Health Badge */}
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 9999,
              background: `${statusColor}15`, border: `1px solid ${statusColor}40`,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{statusLine}</span>
          </span>
        </div>

        {/* Right - Progress Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          style={{ flexShrink: 0 }}
        >
          <ProgressRing
            score={progressScore}
            size={120}
            strokeWidth={9}
            label="Overall Progress"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
