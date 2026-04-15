'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  isNotificationOpen?: boolean;
  project?: ProjectMetadata;
}

export default function Header({ onNotificationClick, isNotificationOpen = false, project }: HeaderProps) {
  const pathname = usePathname();
  const { selectedTimeZone, setTimeZone, isUpdating, timeZones } = useTimeZone();
  const [showTZMenu, setShowTZMenu] = useState(false);
  const [tzSearch, setTzSearch] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const { userProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const lastBroadcastIdRef = useRef<string | null>(null);
  const [isReceiving, setIsReceiving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'broadcasts'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const docs = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      const currentUserId = userProfile?.uid;
      
      // Surgical filter: Only count if user ID is definitively resolved and matches
      const unreadBroadcasts = docs.filter((b: any) => {
        if (!currentUserId) return false; // Prevent logic forcing during auth hydration
        return !b.readBy?.includes(currentUserId);
      });
      
      const newCount = unreadBroadcasts.length;
      
      // Trigger Receiving Effect if new notification arrives
      if (docs.length > 0) {
        const latestId = docs[0].id;
        // Compare with ref to avoid dependency cycle
        if (lastBroadcastIdRef.current && latestId !== lastBroadcastIdRef.current && !isNotificationOpen) {
          // Only pulse if it's genuinely new and unread
          const isActuallyNew = !docs[0].readBy?.includes(currentUserId);
          if (isActuallyNew) {
            setIsReceiving(true);
            setTimeout(() => setIsReceiving(false), 2000);
            
            if (docs[0].type === 'NOTIF') {
              showToast(`DECRYPTED PACKET: ${docs[0].title}`, docs[0].severity === 'CRITICAL' ? 'ERROR' : 'INFO');
            }
          }
        }
        lastBroadcastIdRef.current = latestId;
      }
      
      setUnreadCount(newCount);
    });

    return () => unsubscribe();
  }, [showToast, userProfile?.uid]);

  // Optimistic UI: Hide badge/glow if the panel is currently open
  const effectiveUnreadCount = isNotificationOpen ? 0 : unreadCount;
  const showEffects = effectiveUnreadCount > 0;

  const isAdminPage = pathname.startsWith('/admin');
  const isAuthPage = pathname === '/admin/login';

  useEffect(() => {
    setMounted(true);
  }, []);

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
        zIndex: 5000,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'var(--primary)',
        borderBottom: '1px solid rgba(249, 248, 242, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 63, 73, 0.15)',
      }}
    >
      {/* Logo Group */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginRight: 24 }}>
        {project?.partnerLogos?.map((logo, index) => (
          <React.Fragment key={`logo-${index}`}>
            {index > 0 && <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', borderRadius: 1 }} />}
            <div style={{ padding: '4px 0', display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8, paddingInline: 8 }}>
              <img src={logo} alt={`Partner Logo ${index + 1}`} style={{ height: 26, width: 'auto', maxWidth: 100, objectFit: 'contain', filter: 'brightness(0) invert(1) Contrast(100) drop-shadow(0 0 2px rgba(255,255,255,0.1))' }} />
            </div>
          </React.Fragment>
        ))}
        {(!project?.partnerLogos || project.partnerLogos.length === 0) && (
          <span className="brand-heading" style={{ fontSize: 16, fontWeight: 300, color: 'var(--text-on-primary)' }}>ROH Command Center</span>
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
              background: 'rgba(249, 248, 242, 0.08)',
              border: '1px solid rgba(249, 248, 242, 0.15)',
              color: 'var(--text-on-primary)', cursor: 'pointer', outline: 'none',
              transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={15} style={{ color: '#d0ab82' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>{selectedTimeZone.name}</span>
                <span style={{ fontSize: 10, color: 'rgba(249, 248, 242, 0.6)', marginTop: 2 }}>{selectedTimeZone.offset} Hub</span>
              </div>
            </div>
            <ChevronDown size={14} style={{ opacity: 0.6, transform: showTZMenu ? 'rotate(180deg)' : 'none', transition: 'transform 300ms' }} />
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
                    background: '#0c0c14', backdropFilter: 'blur(32px)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
                    boxShadow: '0 25px 80px rgba(0,0,0,0.8), 0 0 50px rgba(208, 171, 130, 0.05)',
                    overflow: 'hidden', zIndex: 2600
                  }}
                >
                  {/* Search Header */}
                  <div style={{ padding: '16px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: '#0f0f18' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#d0ab82', opacity: 0.6 }} />
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="Search for Hubs..." 
                        value={tzSearch}
                        onChange={(e) => setTzSearch(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8,
                          background: '#000000', border: '1px solid #d0ab82',
                          color: 'white', fontSize: 13, outline: 'none',
                          transition: 'all 200ms ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#d0ab82'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(208, 171, 130, 0.2)'}
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
                            width: '100%', textAlign: 'left', padding: '12px 12px', borderRadius: 12,
                            border: 'none', background: selectedTimeZone.id === tz.id ? 'rgba(208, 171, 130, 0.18)' : 'transparent',
                            color: selectedTimeZone.id === tz.id ? '#d0ab82' : 'rgba(255, 255, 255, 0.5)',
                            fontSize: 13, cursor: 'pointer', transition: 'all 250ms ease',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4
                          }}
                          onMouseEnter={e => { if (selectedTimeZone.id !== tz.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                          onMouseLeave={e => { if (selectedTimeZone.id !== tz.id) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: selectedTimeZone.id === tz.id ? '#d0ab82' : 'rgba(208, 171, 130, 0.15)', boxShadow: selectedTimeZone.id === tz.id ? '0 0 8px #d0ab82' : 'none' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <span style={{ fontWeight: selectedTimeZone.id === tz.id ? 900 : 700, color: selectedTimeZone.id === tz.id ? '#d0ab82' : 'rgba(255, 255, 255, 0.85)', letterSpacing: '0.01em' }}>
                                {tz.name} ({tz.code})
                              </span>
                              <span style={{ fontSize: 10, fontWeight: 600, color: selectedTimeZone.id === tz.id ? 'rgba(208, 171, 130, 0.7)' : 'rgba(208, 171, 130, 0.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {tz.id.split('/')[0]} Hub
                              </span>
                            </div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: selectedTimeZone.id === tz.id ? '#d0ab82' : 'rgba(208, 171, 130, 0.25)', opacity: selectedTimeZone.id === tz.id ? 1 : 0.6 }}>{tz.offset}</span>
                        </button>
                      ))
                    ) : (
                      <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                        No countries match your search.
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '14px 16px', background: '#14141c', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Globe size={13} style={{ color: '#d0ab82' }} />
                    <span style={{ fontSize: 10, fontWeight: 950, color: '#d0ab82', textTransform: 'uppercase', letterSpacing: '0.18em' }}>Select your country</span>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          {mounted ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.4)' }} className="pulse-dot" />
                <span className="font-mono-data" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-on-primary)', letterSpacing: '0.02em' }}>
                  {time.split(' ')[0]}
                  <span style={{ fontSize: 11, marginLeft: 4, fontWeight: 500, color: 'rgba(249, 248, 242, 0.6)', textTransform: 'uppercase' }}>{time.split(' ')[1]}</span>
                </span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(249, 248, 242, 0.5)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                {date}
              </span>
            </>
          ) : (
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              style={{ height: 32, width: 120, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }} 
            />
          )}
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
                          position: 'absolute', inset: 0, borderRadius: 12, border: '1px solid #3b82f6',
                          pointerEvents: 'none', zIndex: -1
                        }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>

              {/* Status Indicator Glow */}
              {showEffects && (
                <div 
                  style={{ position: 'absolute', inset: -4, borderRadius: 14, background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', opacity: 0.6 }} 
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
                <Bell size={20} color={showEffects ? "#3b82f6" : "white"} />
              </motion.div>

              <AnimatePresence>
                {showEffects && (
                  <motion.span 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    style={{ 
                      position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, 
                      borderRadius: 10, background: '#3b82f6', 
                      border: '2px solid #0c0c14', color: 'white', 
                      fontSize: 11, fontWeight: 900, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)' 
                    }}>
                    {effectiveUnreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )}
          
          <style jsx global>{`
            @keyframes notifGlow {
              0% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.1); opacity: 0.4; }
              50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); opacity: 0.8; }
              100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.1); opacity: 0.4; }
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
              background: 'rgba(249, 248, 242, 0.08)', 
              border: '1px solid var(--accent)', 
              borderRadius: 14,
              cursor: 'pointer',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, overflow: 'hidden', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 900, fontSize: 13 }}>
                {userProfile.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'AD'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-on-primary)', lineHeight: 1 }}>{userProfile.name}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 1 }}>{userProfile.role || 'ADMIN'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
