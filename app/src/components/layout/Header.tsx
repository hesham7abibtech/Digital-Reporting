'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Search, Globe, ChevronDown, Loader2, X, Clock as ClockIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { notifications } from '@/lib/data';
import { useTimeZone } from '@/context/TimeZoneContext';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/shared/EliteToast';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { ProjectMetadata } from '@/lib/types';

interface HeaderProps {
  onNotificationClick: () => void;
  project?: ProjectMetadata;
}

export default function Header({ onNotificationClick, project }: HeaderProps) {
  const pathname = usePathname();
  const { selectedTimeZone, setTimeZone, isUpdating, timeZones } = useTimeZone();
  const [showTZMenu, setShowTZMenu] = useState(false);
  const [tzSearch, setTzSearch] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const { userProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastBroadcastId, setLastBroadcastId] = useState<string | null>(null);
  const [isReceiving, setIsReceiving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'broadcasts'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const docs = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      const currentUserId = auth.currentUser?.uid;
      
      const unreadBroadcasts = docs.filter((b: any) => 
        (!currentUserId || !b.readBy?.includes(currentUserId))
      );
      
      const newCount = unreadBroadcasts.length;
      
      // Trigger Receiving Effect if new notification arrives
      if (docs.length > 0) {
        const latestId = docs[0].id;
        if (lastBroadcastId && latestId !== lastBroadcastId) {
          setIsReceiving(true);
          setTimeout(() => setIsReceiving(false), 2000);
          
          if (docs[0].type === 'NOTIF') {
            showToast(`DECRYPTED PACKET: ${docs[0].title}`, docs[0].severity === 'CRITICAL' ? 'ERROR' : 'INFO');
          }
        }
        setLastBroadcastId(latestId);
      }
      
      setUnreadCount(newCount);
    });

    return () => unsubscribe();
  }, [lastBroadcastId, showToast]);

  const isAdminPage = pathname.startsWith('/admin');
  const isAuthPage = pathname === '/admin/login';

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      setTime(new Intl.DateTimeFormat('en-US', {
        timeZone: selectedTimeZone.id,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(now));

      setDate(new Intl.DateTimeFormat('en-US', {
        timeZone: selectedTimeZone.id,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(now));
    }
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [selectedTimeZone]);

  const filteredTimeZones = useMemo(() => {
    if (!tzSearch) return timeZones;
    const q = tzSearch.toLowerCase();
    return timeZones.filter(tz => 
      tz.name.toLowerCase().includes(q) || 
      tz.id.toLowerCase().includes(q) || 
      tz.offset.toLowerCase().includes(q)
    );
  }, [timeZones, tzSearch]);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 2500,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(10,10,15,0.8)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Logo Group */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginRight: 24 }}>
        {project?.partnerLogos?.map((logo, index) => (
          <React.Fragment key={`logo-${index}`}>
            {index > 0 && <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)', borderRadius: 1 }} />}
            <div style={{ padding: '4px 0', display: 'flex', alignItems: 'center' }}>
              <img src={logo} alt={`Partner Logo ${index + 1}`} style={{ height: 26, width: 'auto', maxWidth: 120, objectFit: 'contain', filter: 'brightness(1.1)' }} />
            </div>
          </React.Fragment>
        ))}
        {(!project?.partnerLogos || project.partnerLogos.length === 0) && (
          <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: '0.1em', color: 'white' }}>COMMAND CENTER</span>
        )}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {/* Time Zone Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowTZMenu(!showTZMenu);
              if (!showTZMenu) setTzSearch('');
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 16px', borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(184, 134, 11, 0.05) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              color: 'var(--text-primary)', cursor: 'pointer', outline: 'none',
              transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={15} style={{ color: '#D4AF37' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>{selectedTimeZone.name} ({selectedTimeZone.code})</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{selectedTimeZone.offset} Hub</span>
              </div>
            </div>
            <ChevronDown size={14} style={{ opacity: 0.4, transform: showTZMenu ? 'rotate(180deg)' : 'none', transition: 'transform 300ms' }} />
          </button>

          <AnimatePresence>
            {showTZMenu && (
              <>
                {/* Backdrop to close */}
                <div 
                  onClick={() => setShowTZMenu(false)} 
                  style={{ position: 'fixed', inset: 0, zIndex: -1 }} 
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  style={{
                    position: 'absolute', top: '130%', right: 0, width: 320,
                    background: 'rgba(12,12,20,0.98)', backdropFilter: 'blur(32px)',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(212, 175, 55, 0.1)',
                    overflow: 'hidden', zIndex: 2600
                  }}
                >
                  {/* Search Header */}
                  <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="Search country or code..." 
                        value={tzSearch}
                        onChange={(e) => setTzSearch(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10,
                          background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                          color: 'white', fontSize: 13, outline: 'none'
                        }}
                      />
                      {tzSearch && (
                        <button 
                          onClick={() => setTzSearch('')}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* List Content */}
                  <div style={{ maxHeight: 360, overflowY: 'auto', padding: 8 }} className="custom-scrollbar">
                    {filteredTimeZones.length > 0 ? (
                      filteredTimeZones.map((tz) => (
                        <button
                          key={tz.id}
                          onClick={() => {
                            setTimeZone(tz.id);
                            setShowTZMenu(false);
                          }}
                          style={{
                            width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10,
                            border: 'none', background: selectedTimeZone.id === tz.id ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                            color: selectedTimeZone.id === tz.id ? '#D4AF37' : 'var(--text-secondary)',
                            fontSize: 13, cursor: 'pointer', transition: 'all 200ms',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2
                          }}
                        >
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: selectedTimeZone.id === tz.id ? '#D4AF37' : 'rgba(255,255,255,0.1)' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: selectedTimeZone.id === tz.id ? 600 : 400 }}>{tz.name} ({tz.code})</span>
                              <span style={{ fontSize: 10, opacity: 0.4 }}>{tz.id.split('/')[0]} Hub</span>
                            </div>
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)' }}>{tz.offset}</span>
                        </button>
                      ))
                    ) : (
                      <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                        No countries match your search.
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '10px 16px', background: 'rgba(212, 175, 55, 0.05)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Globe size={12} style={{ color: '#D4AF37' }} />
                    <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select your country</span>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Live Clock Display */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.4)' }} className="pulse-dot" />
            <span className="font-mono-data" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
              {time.split(' ')[0]}
              <span style={{ fontSize: 11, marginLeft: 4, fontWeight: 500, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{time.split(' ')[1]}</span>
            </span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textAlign: 'right', whiteSpace: 'nowrap', opacity: 0.8 }}>
            {date}
          </span>
        </div>

        <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)' }} />

        {/* Notifications & User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isAuthPage && (
            <motion.button
              whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.95 }}
              onClick={onNotificationClick}
              style={{
                position: 'relative', padding: 10, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', background: 'rgba(255,255,255,0.03)', transition: 'all 200ms',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: unreadCount > 0 ? '0 0 20px rgba(212, 175, 55, 0.15)' : 'none'
              }}
            >
              {/* Resonant Receiving Rings */}
              <AnimatePresence>
                {isReceiving && (
                  <>
                    {[1, 2, 3].map((ring) => (
                      <motion.div
                        key={`ring-${ring}`}
                        initial={{ scale: 0.8, opacity: 0.8 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, delay: ring * 0.2, ease: "easeOut" }}
                        style={{
                          position: 'absolute', inset: 0, borderRadius: 12, border: '1px solid #D4AF37',
                          pointerEvents: 'none', zIndex: -1
                        }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>

              {/* Status Indicator Glow */}
              {unreadCount > 0 && (
                <div 
                  style={{ position: 'absolute', inset: -4, borderRadius: 14, background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.2)', opacity: 0.6 }} 
                  className="notification-glow"
                />
              )}

              <motion.div
                animate={isReceiving ? {
                  rotate: [0, -20, 20, -15, 15, -10, 10, 0],
                  scale: [1, 1.2, 1.1, 1.2, 1],
                  transition: { duration: 0.8 }
                } : {}}
              >
                <Bell size={20} color={unreadCount > 0 ? "#D4AF37" : "white"} />
              </motion.div>

              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    style={{ position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, borderRadius: 10, background: '#ef4444', border: '2px solid #0c0c14', color: 'white', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)' }}>
                    {unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )}
          
          <style jsx global>{`
            @keyframes notifGlow {
              0% { box-shadow: 0 0 5px rgba(212, 175, 55, 0.1); opacity: 0.4; }
              50% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.3); opacity: 0.8; }
              100% { box-shadow: 0 0 5px rgba(212, 175, 55, 0.1); opacity: 0.4; }
            }
            .notification-glow {
              animation: notifGlow 2s infinite ease-in-out;
            }
          `}</style>
          
          {/* Elite User Card Trigger - Hidden during Auth - Dynamic after Login */}
          {isAdminPage && !isAuthPage && userProfile && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              padding: '4px 14px 4px 6px', 
              background: 'rgba(212, 175, 55, 0.05)', 
              border: '2px solid #D4AF37', 
              borderRadius: 14,
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(212, 175, 55, 0.15)'
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, overflow: 'hidden', background: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a0f', fontWeight: 900, fontSize: 13, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                {userProfile.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'AD'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'white', lineHeight: 1 }}>{userProfile.name}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 1 }}>{userProfile.role || 'ADMIN'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
