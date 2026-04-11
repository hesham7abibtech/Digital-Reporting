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
import { onAuthStateChanged } from 'firebase/auth';
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
    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const rawData = doc.data({ serverTimestamps: 'estimate' });
        // Handle Firestore Timestamp vs ISO String gracefully for real-time injections
        const timestamp = rawData.timestamp?.toDate ? rawData.timestamp.toDate().toISOString() : rawData.timestamp;
        return { 
          id: doc.id, 
          ...rawData,
          timestamp 
        } as Broadcast;
      });
      setBroadcasts(data);
      setLoading(false);
    }, (error) => {
      console.warn("Secure Feed Hydration Delayed:", error.message);
      if (error.code === 'permission-denied') {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, user => setUserId(user?.uid || null));
    return () => unsubAuth();
  }, []);

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
            className="fixed inset-0 z-[4000] bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Elite Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[500px] z-[4001] bg-[#050508] border-l border-white/5 flex flex-col shadow-[-40px_0_100px_rgba(0,0,0,0.9)]"
          >
            <div 
              className="relative overflow-hidden border-b border-white/[0.03] bg-gradient-to-b from-white/[0.02] to-transparent"
              style={{ paddingTop: '20px', paddingBottom: '16px', paddingLeft: '32px', paddingRight: '32px' }}
            >
              {/* Decorative radial glows */}
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/[0.08] blur-[150px] pointer-events-none" />
              <div className="absolute top-40 -left-32 w-80 h-80 bg-purple-500/[0.05] blur-[120px] pointer-events-none" />

              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="px-3 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)] flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                       <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]">Secure Link Portal</span>
                    </div>
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-[-0.04em] mb-1 uppercase leading-tight">Communications</h2>
                  <p className="text-[9px] text-white/20 font-black tracking-[0.3em] uppercase pl-1">Command Center Protocol v2.5</p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-11 h-11 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
                >
                  <X size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                </button>
              </div>

              {/* Specialized Elite Tabs - Guaranteed height and layout */}
              <div 
                className="flex gap-2 p-1 border border-white/[0.04] backdrop-blur-xl"
                style={{ marginTop: '20px', borderRadius: '24px', backgroundColor: 'rgba(255,255,255,0.02)' }}
              >
                <button
                  onClick={() => setActiveTab('ALERTS')}
                  className={`flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 relative overflow-hidden group/tab
                    ${activeTab === 'ALERTS' ? 'text-white shadow-xl' : 'text-white/20 hover:text-white/40'}`}
                  style={{ 
                    height: '44px', 
                    borderRadius: '20px',
                    backgroundColor: activeTab === 'ALERTS' ? 'rgba(255,255,255,0.06)' : 'transparent' 
                  }}
                >
                  {activeTab === 'ALERTS' && (
                    <motion.div layoutId="tab-glow" className="absolute inset-0 bg-blue-500/[0.06] blur-xl" />
                  )}
                  <Bell size={14} className={`transition-transform duration-500 ${activeTab === 'ALERTS' ? 'text-blue-400 scale-110' : 'group-hover/tab:scale-110'}`} />
                  <span className="leading-none" style={{ paddingTop: '1.5px' }}>Operational Alerts</span>
                  {unreadAlerts > 0 && (
                    <span className="ml-1.5 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-black shadow-lg shadow-blue-500/20">
                      {unreadAlerts}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('NEWS')}
                  className={`flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 relative overflow-hidden group/tab
                    ${activeTab === 'NEWS' ? 'text-white shadow-xl' : 'text-white/20 hover:text-white/40'}`}
                  style={{ 
                    height: '44px', 
                    borderRadius: '20px',
                    backgroundColor: activeTab === 'NEWS' ? 'rgba(255,255,255,0.06)' : 'transparent' 
                  }}
                >
                  {activeTab === 'NEWS' && (
                    <motion.div layoutId="tab-glow" className="absolute inset-0 bg-purple-500/[0.06] blur-xl" />
                  )}
                  <Newspaper size={14} className={`transition-transform duration-500 ${activeTab === 'NEWS' ? 'text-purple-400 scale-110' : 'group-hover/tab:scale-110'}`} />
                  <span className="leading-none" style={{ paddingTop: '1.5px' }}>Global News</span>
                </button>
              </div>
            </div>

            {/* Content Area - Hardened centering for empty state */}
            <div 
              className={`flex-1 overflow-y-auto custom-scrollbar px-6 pb-20 space-y-3 ${filtered.length === 0 ? 'flex flex-col' : ''}`}
              style={{ paddingTop: filtered.length === 0 ? '0' : '16px' }}
            >
              {filtered.map((item, i) => {
                const config = severityConfig[item.severity] || severityConfig.INFO;
                const Icon = config.icon;
                const isRead = userId && item.readBy?.includes(userId);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 + 0.1 }}
                    onClick={() => !isRead && handleConfirmReceipt(item.id)}
                    className={`group relative border transition-all duration-500 cursor-pointer
                      ${!isRead && item.type === 'NOTIF' ? 'shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)]' : 'hover:opacity-100'}`}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '20px',
                      backgroundColor: !isRead && item.type === 'NOTIF' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)',
                      borderColor: !isRead && item.type === 'NOTIF' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                      opacity: !isRead && item.type === 'NOTIF' ? 1 : 0.8,
                      transform: 'translateZ(0)'
                    }}
                  >
                    {/* Pulsing Aura for Critical alerts */}
                    {!isRead && item.severity === 'CRITICAL' && (
                      <div className="absolute inset-0 bg-red-500/[0.03] animate-pulse pointer-events-none" style={{ borderRadius: '24px' }} />
                    )}

                    <div className="flex items-center relative z-10" style={{ gap: '16px' }}>
                      {/* Icon Cluster */}
                      <div className="relative shrink-0">
                        <div 
                          className="flex items-center justify-center border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                          style={{ 
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: config.bgColor, 
                            borderColor: config.borderColor,
                            color: config.color,
                            boxShadow: `0 4px 12px -4px ${config.glow}`
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        {!isRead && (
                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#050508] p-0.5">
                            <div className="w-full h-full rounded-full bg-blue-500 animate-ping" />
                          </div>
                        )}
                      </div>

                      {/* Content Stack - Horizontal layout focused */}
                      <div className="flex-1 min-w-0 py-0.5">
                         <div className="flex items-center justify-between mb-1">
                           <div className="flex items-center gap-2">
                             <span style={{ color: config.color }} className="text-[10px] font-black uppercase tracking-[0.15em] opacity-90 drop-shadow-md">
                               {item.severity} // {item.category || (item.type === 'NEWS' ? 'MARKET' : 'SYSTEM')}
                             </span>
                           </div>
                           <div className="flex items-center gap-1.5 text-white/30">
                             <Clock size={10} />
                             <span className="text-[9px] font-bold uppercase tracking-widest">{getRelativeTime(item.timestamp)}</span>
                           </div>
                         </div>
                         <h3 className={`text-[15px] font-bold tracking-tight leading-tight truncate transition-colors duration-300
                           ${!isRead ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                           {item.title}
                         </h3>
                         <p className={`text-[12px] leading-snug truncate mt-1 transition-colors duration-300
                           ${!isRead ? 'text-white/60' : 'text-white/40 group-hover:text-white/50'}`}>
                           {item.description}
                         </p>
                      </div>

                      {/* Actions Cluster */}
                      <div className="shrink-0 flex items-center gap-2 pl-2">
                        {item.link && (
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isRead) handleConfirmReceipt(item.id);
                            }}
                            className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/5 flex items-center justify-center text-white/60 hover:text-white transition-all hover:bg-white/10"
                          >
                            <TrendingUp size={13} />
                          </a>
                        )}
                        
                        {!isRead && item.type === 'NOTIF' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleConfirmReceipt(item.id); }}
                            className="px-3 py-1.5 rounded-lg border border-blue-500/20 text-[9px] font-black text-blue-400 focus:outline-none hover:text-white hover:bg-blue-500/20 transition-all flex items-center gap-1.5"
                          >
                            <Check size={10} />
                            RECEIPT
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {!loading && filtered.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center pb-20 group">
                  <div 
                    className="w-20 h-20 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center group-hover:rotate-45 transition-transform duration-700 relative"
                    style={{ marginBottom: '40px' }}
                  >
                    <div className="absolute inset-0 rounded-full bg-white/[0.05] blur-xl" />
                    {activeTab === 'ALERTS' ? <Bell size={40} className="text-blue-400" /> : <Newspaper size={40} className="text-purple-400" />}
                  </div>
                  <p className="text-[13px] font-black uppercase tracking-[0.4em] text-white text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    No active packets
                  </p>
                  <div className="mt-4 w-12 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
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
