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

  const unreadCount = userId ? broadcasts.filter(b => (!b.readBy?.includes(userId))).length : 0;
  const unreadAlerts = userId ? broadcasts.filter(b => b.type === 'NOTIF' && (!b.readBy?.includes(userId))).length : 0;
  const unreadNews = userId ? broadcasts.filter(b => b.type === 'NEWS' && (!b.readBy?.includes(userId))).length : 0;

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

  // Auto-read logic has been explicitly removed.
  // Packets now strictly require physical user interaction (clicks) to mark as read.

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[6000] bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Elite Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[500px] z-[6001] flex flex-col"
            style={{
              background: 'var(--background)',
              borderLeft: '1px solid var(--border)',
              boxShadow: '-40px 0 100px rgba(0,0,0,0.8)'
            }}
          >
            <div 
              className="relative overflow-hidden"
              style={{ paddingTop: '24px', paddingBottom: '20px', paddingLeft: '32px', paddingRight: '32px', borderBottom: '1px solid var(--border)', background: 'var(--card-haze)', backdropFilter: 'blur(20px)' }}
            >
              {/* Decorative radial glows */}
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/[0.08] blur-[150px] pointer-events-none" />
              <div className="absolute top-40 -left-32 w-80 h-80 bg-purple-500/[0.05] blur-[120px] pointer-events-none" />

              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <div style={{ padding: '2px 12px', borderRadius: 20, background: 'var(--secondary)', border: '1px solid var(--border)', boxShadow: '0 0 20px rgba(0,204,255,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ backgroundColor: 'var(--aqua)' }} />
                       <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Secure Link Portal</span>
                    </div>
                  </div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'var(--font-heading)' }}>Communications</h2>
                  <p style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', paddingLeft: 4 }}>Command Center Protocol v2.5</p>
                </div>
                <button 
                  onClick={onClose}
                  style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', cursor: 'pointer', transition: 'all 300ms' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--hover-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'var(--secondary)'; }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Specialized Elite Tabs - Guaranteed height and layout */}
              <div 
                className="flex gap-2 p-1"
                style={{ marginTop: '20px', borderRadius: '24px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)' }}
              >
                <button
                  onClick={() => setActiveTab('ALERTS')}
                  className="flex-1 flex items-center justify-center gap-2 relative overflow-hidden group/tab"
                  style={{ 
                    height: '44px', 
                    borderRadius: '20px',
                    fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'all 300ms',
                    color: activeTab === 'ALERTS' ? 'var(--text-on-primary)' : 'var(--text-muted)',
                    background: activeTab === 'ALERTS' ? 'var(--teal)' : 'transparent',
                    boxShadow: activeTab === 'ALERTS' ? '0 8px 24px rgba(0, 204, 255, 0.2)' : 'none'
                  }}
                >
                  <Bell size={14} style={{ color: activeTab === 'ALERTS' ? 'inherit' : 'var(--text-muted)' }} />
                  <span className="leading-none" style={{ paddingTop: '1.5px' }}>Operational Alerts</span>
                  {unreadAlerts > 0 && (
                    <span style={{ marginLeft: 6, width: 18, height: 18, borderRadius: '50%', background: 'var(--status-error)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900 }}>
                      {unreadAlerts}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('NEWS')}
                  className="flex-1 flex items-center justify-center gap-2 relative overflow-hidden group/tab"
                  style={{ 
                    height: '44px', 
                    borderRadius: '20px',
                    fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'all 300ms',
                    color: activeTab === 'NEWS' ? 'var(--text-on-primary)' : 'var(--text-muted)',
                    background: activeTab === 'NEWS' ? 'var(--teal)' : 'transparent',
                    boxShadow: activeTab === 'NEWS' ? '0 8px 24px rgba(0, 204, 255, 0.2)' : 'none'
                  }}
                >
                  <Newspaper size={14} style={{ color: activeTab === 'NEWS' ? 'inherit' : 'var(--text-muted)' }} />
                  <span className="leading-none" style={{ paddingTop: '1.5px' }}>Global News</span>
                  {unreadNews > 0 && (
                    <span style={{ marginLeft: 6, width: 18, height: 18, borderRadius: '50%', background: 'var(--status-error)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900 }}>
                      {unreadNews}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Content Area - Hardened centering for empty state */}
            <div 
              className="flex-1 overflow-y-auto custom-scrollbar px-12 pb-24 flex flex-col gap-4"
              style={{ paddingTop: filtered.length === 0 ? '0' : '20px' }}
            >
              {filtered.map((item, i) => {
                const config = severityConfig[item.severity] || severityConfig.INFO;
                const Icon = config.icon;
                // Explicit unread check: Only true if we have a user and they are NOT in the readBy list
                const isUnread = !!(userId && !item.readBy?.includes(userId));
                const isRead = !isUnread;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 + 0.1 }}
                    onClick={() => !isRead && handleConfirmReceipt(item.id)}
                    className="group relative transition-all duration-500 cursor-pointer mx-auto w-full max-w-[420px]"
                    style={{
                      padding: '16px 20px',
                      borderRadius: '16px',
                      background: !isRead ? '#ffffff' : 'var(--card-haze)',
                      border: `1.5px solid ${!isRead ? config.color : 'var(--border)'}`,
                      opacity: !isRead ? 1 : 0.7,
                      boxShadow: !isRead ? `0 12px 40px -12px ${config.glow}, 0 0 10px ${config.bgColor}` : 'none',
                      transform: 'translateZ(0)'
                    }}
                  >
                    {/* Pulsing Aura for Critical alerts */}
                    {!isRead && item.severity === 'CRITICAL' && (
                      <div className="absolute inset-0 border border-red-500/20 animate-pulse pointer-events-none" style={{ borderRadius: '16px' }} />
                    )}

                    <div className="flex items-center relative z-10" style={{ gap: '12px' }}>
                      {/* Icon Cluster */}
                      <div className="relative shrink-0">
                        <div 
                          className="flex items-center justify-center border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                          style={{ 
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: config.bgColor, 
                            borderColor: config.borderColor,
                            color: config.color,
                            boxShadow: `0 4px 12px -4px ${config.glow}`
                          }}
                        >
                          <Icon size={15} />
                        </div>
                        {!isRead && (
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#050508] p-0.5">
                            <div className="w-full h-full rounded-full bg-blue-500 animate-ping" />
                          </div>
                        )}
                      </div>

                      {/* Content Stack - Horizontal layout focused */}
                      <div className="flex-1 min-w-0 py-0">
                         <div className="flex items-center justify-between mb-0.5">
                           <div className="flex items-center gap-2">
                             <span style={{ color: config.color, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }} className="drop-shadow-md">
                               {item.severity} <span style={{ color: 'var(--text-dim)' }}>//</span> {item.category || (item.type === 'NEWS' ? 'MARKET' : 'SYSTEM')}
                             </span>
                           </div>
                           <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                             <Clock size={9} />
                             <span style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{getRelativeTime(item.timestamp)}</span>
                           </div>
                         </div>
                         <h3 style={{ fontSize: 13, fontWeight: 800, color: !isRead ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'all 300ms', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                           {item.title}
                         </h3>
                         <p style={{ fontSize: 11, lineHeight: '1.4', color: !isRead ? 'var(--text-secondary)' : 'var(--text-dim)', transition: 'all 300ms', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
                            style={{ padding: '4px 10px', borderRadius: 6, background: config.bgColor, border: `1px solid ${config.borderColor}`, color: config.color, fontSize: 9, fontWeight: 900, outline: 'none', cursor: 'pointer', transition: 'all 200ms', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = config.color; e.currentTarget.style.borderColor = config.color; e.currentTarget.style.color = '#ffffff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = config.bgColor; e.currentTarget.style.borderColor = config.borderColor; e.currentTarget.style.color = config.color; }}
                          >
                            <Check size={10} strokeWidth={3} />
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
                    className="flex items-center justify-center group-hover:scale-110 transition-transform duration-700"
                    style={{ marginBottom: '40px', width: 80, height: 80, borderRadius: '50%', background: 'var(--secondary)', border: '1px solid var(--border)' }}
                  >
                    {activeTab === 'ALERTS' ? <Bell size={32} color="var(--teal)" /> : <Newspaper size={32} color="var(--status-warning)" />}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', color: 'var(--text-secondary)' }}>
                    No active packets
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Status Bar */}
            <div style={{ padding: '24px 40px', borderTop: '1px solid var(--border)', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <div className="flex items-center gap-3">
                 <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-success)', boxShadow: '0 0 12px var(--status-success)' }} />
                 <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>ENCRYPTED STREAM ACTIVE</span>
               </div>
               <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>VER: ELITE_BROADCAST_X</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
