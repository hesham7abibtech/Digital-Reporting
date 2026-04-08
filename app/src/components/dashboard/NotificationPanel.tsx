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
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg z-50 bg-[rgba(10,10,16,0.98)] backdrop-blur-3xl border-l border-[rgba(255,255,255,0.08)] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 h-20 border-b border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-3 py-1 rounded-full bg-[rgba(59,130,246,0.1)] text-[#60a5fa] text-[10px] font-black uppercase border border-[rgba(59,130,246,0.2)] tracking-widest">
                    {unreadCount} Active
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl hover:bg-[rgba(255,255,255,0.06)] transition-all duration-300 border border-transparent hover:border-[rgba(255,255,255,0.1)] group"
              >
                <X size={22} className="text-[var(--text-muted)] group-hover:text-white transition-colors" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 px-8 py-4 border-b border-[rgba(255,255,255,0.04)] bg-black/20">
              {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300
                    ${filter === tab
                      ? 'bg-[rgba(59,130,246,0.15)] text-[#60a5fa] border border-[rgba(59,130,246,0.25)] shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                      : 'text-[var(--text-muted)] hover:text-white hover:bg-[rgba(255,255,255,0.03)] border border-transparent'
                    }`}
                >
                  {tab === 'ALL' ? 'All Channels' : tab}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filtered.map((notif, i) => {
                const config = severityConfig[notif.severity];
                const isRead = notif.read || readIds.has(notif.id);

                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className={`px-8 py-6 border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.03)] transition-all duration-300 cursor-pointer group ${!isRead ? 'bg-[rgba(59,130,246,0.02)]' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                        style={{ 
                          background: config.bgColor, 
                          color: config.color, 
                          border: `1px solid ${config.borderColor}`,
                          boxShadow: `0 0 15px ${config.borderColor}`
                        }}
                      >
                        {config.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          {!isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#3b82f6] shadow-[0_0_8px_#3b82f6] flex-shrink-0 animate-pulse" />
                          )}
                          <p className="text-[15px] font-bold text-[var(--text-primary)] truncate leading-none">
                            {notif.title}
                          </p>
                        </div>
                        <p className="text-[13px] text-[var(--text-muted)] leading-relaxed font-medium mb-3">{notif.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[var(--text-dim)] font-bold uppercase tracking-widest">{getRelativeTime(notif.timestamp)}</span>
                          {!isRead && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                              className="flex items-center gap-1.5 text-[10px] text-[#60a5fa] hover:text-white transition-colors font-black uppercase tracking-tighter"
                            >
                              <Check size={12} />
                              Confirm Receipt
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
