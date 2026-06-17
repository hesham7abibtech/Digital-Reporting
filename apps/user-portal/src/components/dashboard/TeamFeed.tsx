'use client';

import { motion } from 'framer-motion';
import GlassCard from '@/components/shared/GlassCard';
import { activities } from '@/lib/data';
import { getRelativeTime, getDepartmentColor } from '@/lib/utils';

const actionVerbs: Record<string, string> = {
  task_completed: 'completed',
  file_uploaded: 'uploaded files for',
  approval: 'approved',
  comment: 'commented on',
  status_change: 'updated status of',
  meeting: 'scheduled',
  issue_closed: 'closed',
};

export default function TeamFeed() {
  const feedItems = activities.slice(0, 15);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
    >
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Team Feed</h2>
      <GlassCard padding="sm" hover={false} className="max-h-[520px] overflow-y-auto">
        <div className="space-y-0">
          {feedItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 + i * 0.04, duration: 0.3 }}
              className="flex items-start gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer border-b border-[rgba(255,255,255,0.02)] last:border-0"
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5"
                style={{ background: getDepartmentColor('Project Management') }}
              >
                {item.userName.split(' ').map(n => n[0]).join('')}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  <span className="font-medium text-[var(--text-primary)]">{item.userName}</span>
                  {' '}
                  <span className="text-[var(--text-muted)]">{actionVerbs[item.type] || 'updated'}</span>
                  {' '}
                  <span className="text-[#60a5fa]">{item.title}</span>
                </p>
                <p className="text-[11px] text-[var(--text-dim)] mt-0.5">{getRelativeTime(item.timestamp)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}
