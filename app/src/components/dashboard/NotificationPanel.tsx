'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, AlertCircle, Info, Check } from 'lucide-react';
import { notifications } from '@/lib/data';
import { getRelativeTime } from '@/lib/utils';

const severityConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
  CRITICAL: {
    icon: <AlertTriangle size={16} />,
    color: '#fca5a5',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  WARNING: {
    icon: <AlertCircle size={16} />,
    color: '#fbbf24',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  INFO: {
    icon: <Info size={16} />,
    color: '#60a5fa',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
};

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const filtered = notifications.filter(n =>
    filter === 'ALL' || n.severity === filter
  );

  const unreadCount = notifications.filter(n => !n.read && !readIds.has(n.id)).length;

  function markAsRead(id: string) {
    setReadIds(prev => new Set(prev).add(id));
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 bg-[rgba(12,12,18,0.97)] backdrop-blur-2xl border-l border-[rgba(255,255,255,0.06)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-[rgba(255,255,255,0.04)]">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[rgba(239,68,68,0.15)] text-[#f87171] text-xs font-medium border border-[rgba(239,68,68,0.3)]">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors"
              >
                <X size={20} className="text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 px-6 py-3 border-b border-[rgba(255,255,255,0.04)]">
              {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${filter === tab
                      ? 'bg-[rgba(59,130,246,0.12)] text-[#60a5fa]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.03)]'
                    }`}
                >
                  {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {filtered.map((notif, i) => {
                const config = severityConfig[notif.severity];
                const isRead = notif.read || readIds.has(notif.id);

                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className={`px-6 py-4 border-b border-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer ${!isRead ? 'bg-[rgba(255,255,255,0.01)]' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: config.bgColor, color: config.color, border: `1px solid ${config.borderColor}` }}
                      >
                        {config.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {!isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] flex-shrink-0" />
                          )}
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {notif.title}
                          </p>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">{notif.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-[var(--text-dim)]">{getRelativeTime(notif.timestamp)}</span>
                          {!isRead && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                              className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                            >
                              <Check size={10} />
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {filtered.length === 0 && (
                <div className="py-16 text-center text-sm text-[var(--text-muted)]">
                  No notifications in this category.
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
