'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Check, 
  Newspaper, 
  Bell, 
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Broadcast, BroadcastSeverity } from '@/lib/types';
import { getRelativeTime } from '@/lib/utils';

const severityConfig: Record<string, { icon: any; color: string; bgColor: string; borderColor: string; glow: string }> = {
  CRITICAL: {
    icon: ShieldAlert,
    color: '#ef4444', // Red-500
    bgColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    glow: 'rgba(239, 68, 68, 0.4)'
  },
  WARNING: {
    icon: AlertTriangle,
    color: '#f59e0b', // Amber-500
    bgColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    glow: 'rgba(245, 158, 11, 0.4)'
  },
  INFO: {
    icon: Info,
    color: '#3b82f6', // Blue-500
    bgColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    glow: 'rgba(59, 130, 246, 0.4)'
  },
  SUCCESS: {
    icon: Check,
    color: '#10b981', // Emerald-500
    bgColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    glow: 'rgba(16, 185, 129, 0.4)'
  }
};

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [activeTab, setActiveTab] = useState<'ALERTS' | 'NEWS'>('ALERTS');
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'broadcasts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Broadcast));
      setBroadcasts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const userId = auth.currentUser?.uid;

  const filtered = broadcasts.filter(b => {
    if (activeTab === 'ALERTS') return b.type === 'NOTIF';
    return b.type === 'NEWS';
  });

  const unreadAlerts = broadcasts.filter(b => b.type === 'NOTIF' && (!userId || !b.readBy?.includes(userId))).length;

  async function handleConfirmReceipt(id: string) {
    if (!userId) return;
    try {
      const ref = doc(db, 'broadcasts', id);
      await updateDoc(ref, {
        readBy: arrayUnion(userId)
      });
    } catch (error) {
      console.error('Error confirming receipt:', error);
    }
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
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Elite Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[500px] z-[101] bg-[#050508] border-l border-white/5 flex flex-col shadow-[-40px_0_100px_rgba(0,0,0,0.9)]"
          >
            {/* Top Gloss Header */}
            <div className="relative overflow-hidden pt-12 pb-8 px-10 border-b border-white/[0.03] bg-gradient-to-b from-white/[0.02] to-transparent">
              {/* Decorative radial glows */}
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/[0.08] blur-[150px] pointer-events-none" />
              <div className="absolute top-40 -left-32 w-80 h-80 bg-purple-500/[0.05] blur-[120px] pointer-events-none" />

              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                       <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]">Secure Link Portal</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-[-0.03em] mb-1 uppercase leading-tight">Communications</h2>
                  <p className="text-[9px] text-white/20 font-black tracking-[0.3em] uppercase pl-0.5">Command Center Protocol v2.5</p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
                >
                  <X size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                </button>
              </div>

              {/* Specialized Elite Tabs */}
              <div className="flex gap-2 mt-8 p-1.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] backdrop-blur-xl">
                <button
                  onClick={() => setActiveTab('ALERTS')}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 relative overflow-hidden group/tab
                    ${activeTab === 'ALERTS' ? 'text-white bg-white/[0.06] shadow-xl' : 'text-white/20 hover:text-white/40 hover:bg-white/[0.01]'}`}
                >
                  {activeTab === 'ALERTS' && (
                    <motion.div layoutId="tab-glow" className="absolute inset-0 bg-blue-500/[0.06] blur-xl" />
                  )}
                  <Bell size={12} className={`transition-transform duration-500 ${activeTab === 'ALERTS' ? 'text-blue-400 scale-110' : 'group-hover/tab:scale-110'}`} />
                  Operational Alerts
                  {unreadAlerts > 0 && (
                    <span className="ml-1 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] font-black shadow-lg shadow-blue-500/20">
                      {unreadAlerts}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('NEWS')}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 relative overflow-hidden group/tab
                    ${activeTab === 'NEWS' ? 'text-white bg-white/[0.06] shadow-xl' : 'text-white/20 hover:text-white/40 hover:bg-white/[0.01]'}`}
                >
                  {activeTab === 'NEWS' && (
                    <motion.div layoutId="tab-glow" className="absolute inset-0 bg-purple-500/[0.06] blur-xl" />
                  )}
                  <Newspaper size={12} className={`transition-transform duration-500 ${activeTab === 'NEWS' ? 'text-purple-400 scale-110' : 'group-hover/tab:scale-110'}`} />
                  Global News
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pt-6 pb-20 space-y-4">
              {filtered.map((item, i) => {
                const config = severityConfig[item.severity] || severityConfig.INFO;
                const Icon = config.icon;
                const isRead = userId && item.readBy?.includes(userId);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 + 0.2 }}
                    className={`group relative p-6 rounded-[2rem] border transition-all duration-500 cursor-pointer overflow-hidden
                      ${!isRead && item.type === 'NOTIF' 
                         ? 'bg-white/[0.04] border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]' 
                         : 'bg-white/[0.01] border-white/[0.04] opacity-70 hover:opacity-100 hover:bg-white/[0.02]'}`}
                  >
                    {/* Pulsing Aura for Critical alerts */}
                    {!isRead && item.severity === 'CRITICAL' && (
                      <div className="absolute inset-0 bg-red-500/[0.03] animate-pulse" />
                    )}

                    <div className="flex items-start gap-5 relative z-10">
                      {/* Icon Cluster */}
                      <div className="relative">
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110"
                          style={{ 
                            background: config.bgColor, 
                            borderColor: config.borderColor,
                            color: config.color,
                            boxShadow: `0 8px 16px -4px ${config.glow}`
                          }}
                        >
                          <Icon size={20} />
                        </div>
                        {!isRead && (
                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#050508] p-0.5">
                            <div className="w-full h-full rounded-full bg-blue-500 animate-ping" />
                          </div>
                        )}
                      </div>

                      {/* Content Stack */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                           <span style={{ color: config.color }} className="text-[10px] font-black uppercase tracking-[0.15em] opacity-80">
                             {item.severity} // {item.category || (item.type === 'NEWS' ? 'MARKET' : 'SYSTEM')}
                           </span>
                           <div className="flex items-center gap-1.5 text-white/20">
                             <Clock size={10} />
                             <span className="text-[9px] font-bold uppercase tracking-widest">{getRelativeTime(item.timestamp)}</span>
                           </div>
                        </div>
                        <h3 className={`text-[16px] font-bold tracking-tight mb-2 leading-tight transition-colors duration-300
                          ${!isRead ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                          {item.title}
                        </h3>
                        <p className={`text-[13px] leading-relaxed mb-4 transition-colors duration-300
                          ${!isRead ? 'text-white/50' : 'text-white/30 group-hover:text-white/40'}`}>
                          {item.description}
                        </p>

                        <div className="flex items-center gap-4">
                          {item.link && (
                            <a 
                              href={item.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/5 text-[11px] font-black text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2 group/btn"
                            >
                               VIEW ATTACHMENT
                               <TrendingUp size={12} className="text-blue-400 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                            </a>
                          )}
                          
                          {!isRead && item.type === 'NOTIF' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleConfirmReceipt(item.id); }}
                              className="px-4 py-2 rounded-xl border border-blue-500/20 text-[11px] font-black text-blue-400 hover:text-white hover:bg-blue-500/20 transition-all flex items-center gap-2"
                            >
                              <Check size={12} />
                              CONFIRM RECEIPT
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {!loading && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-40 opacity-20 group">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-6 group-hover:rotate-45 transition-transform duration-700">
                    {activeTab === 'ALERTS' ? <Bell size={32} /> : <Newspaper size={32} />}
                  </div>
                  <p className="text-[12px] font-black uppercase tracking-[0.3em] text-center">Protocol Idle: No active packets</p>
                </div>
              )}
            </div>

            {/* Bottom Status Bar */}
            <div className="px-10 py-6 border-t border-white/[0.03] bg-black flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                 <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest">ENCRYPTED STREAM ACTIVE</span>
               </div>
               <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">VER: ELITE_BROADCAST_X</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
