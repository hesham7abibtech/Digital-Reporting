'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle, Upload, ThumbsUp, MessageSquare, GitMerge,
  Calendar, Lock
} from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import { activities } from '@/lib/data';
import { getRelativeTime } from '@/lib/utils';

const typeIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  task_completed: { icon: <CheckCircle size={16} />, color: '#10b981' },
  file_uploaded: { icon: <Upload size={16} />, color: '#3b82f6' },
  approval: { icon: <ThumbsUp size={16} />, color: '#8b5cf6' },
  comment: { icon: <MessageSquare size={16} />, color: '#06b6d4' },
  status_change: { icon: <GitMerge size={16} />, color: '#f59e0b' },
  meeting: { icon: <Calendar size={16} />, color: '#ec4899' },
  issue_closed: { icon: <Lock size={16} />, color: '#10b981' },
};

export default function RecentActivity() {
  const recentActivities = activities.slice(0, 12);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.5 }}
    >
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Activity</h2>
      <GlassCard padding="sm" hover={false} className="max-h-[520px] overflow-y-auto">
        <div className="relative pl-8">
          {/* Timeline Line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-[rgba(255,255,255,0.06)]" />

          <div className="space-y-1">
            {recentActivities.map((activity, i) => {
              const typeConfig = typeIcons[activity.type] || typeIcons.task_completed;

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.05, duration: 0.4 }}
                  className="relative flex items-start gap-3 py-3 px-3 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer"
                >
                  {/* Timeline Dot */}
                  <div
                    className="absolute left-[-17px] top-4 w-7 h-7 rounded-full flex items-center justify-center z-10"
                    style={{
                      background: `${typeConfig.color}15`,
                      color: typeConfig.color,
                    }}
                  >
                    {typeConfig.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 ml-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                        style={{ background: typeConfig.color }}
                      >
                        {activity.userName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-xs font-medium text-[var(--text-primary)]">{activity.userName}</span>
                      <span className="text-[10px] text-[var(--text-dim)]">{getRelativeTime(activity.timestamp)}</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{activity.title}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{activity.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
