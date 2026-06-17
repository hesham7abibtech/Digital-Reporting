'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldOff, Clock, Ban } from 'lucide-react';
import type { SuspensionInfo } from '@/context/AuthContext';

/**
 * Premium account-suspension notice shown on the login screen after a blocked
 * user authenticates. Permanent bans read as severe/terminal (red, no timer);
 * timed bans show an amber live countdown of the remaining duration.
 */
function remaining(expiresAt: string | null): { d: number; h: number; m: number; s: number; over: boolean } | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, over: true };
  const s = Math.floor(diff / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60, over: false };
}

export default function SuspensionNotice({ suspension }: { suspension: SuspensionInfo }) {
  const permanent = suspension.type === 'permanent';
  const [, setTick] = useState(0);

  // Live countdown for timed bans (one re-render per second).
  useEffect(() => {
    if (permanent) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [permanent]);

  const rem = remaining(suspension.expiresAt);
  const accent = permanent ? '#dc2626' : '#d97706';
  const tint = permanent ? 'rgba(220,38,38,0.06)' : 'rgba(217,119,6,0.06)';
  const border = permanent ? 'rgba(220,38,38,0.28)' : 'rgba(217,119,6,0.28)';

  const Unit = ({ value, label }: { value: number; label: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 52 }}>
      <span style={{ fontSize: 24, fontWeight: 800, color: accent, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {String(value).padStart(2, '0')}
      </span>
      <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 5 }}>{label}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 24, stiffness: 280 }}
      role="alert"
      style={{ borderRadius: 18, overflow: 'hidden', border: `1px solid ${border}`, background: '#fff', boxShadow: '0 18px 50px rgba(0,0,0,0.12)' }}
    >
      <div style={{ height: 4, background: permanent ? 'linear-gradient(90deg,#dc2626,#7f1d1d)' : 'linear-gradient(90deg,#d97706,#b45309)' }} />
      <div style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: tint, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {permanent ? <Ban size={24} color={accent} /> : <ShieldOff size={24} color={accent} />}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: accent, letterSpacing: '0.02em' }}>
              {permanent ? 'Access Permanently Revoked' : 'Account Temporarily Suspended'}
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b', fontWeight: 500, marginTop: 2 }}>
              {permanent
                ? 'This account has been permanently disabled by an administrator.'
                : 'Your access is temporarily restricted. It will be restored automatically.'}
            </div>
          </div>
        </div>

        {/* Reason */}
        <div style={{ background: '#f8fafc', border: '1px solid #eef2f5', borderRadius: 12, padding: '12px 14px', marginBottom: permanent ? 0 : 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Reason</div>
          <div style={{ fontSize: 13.5, color: '#334155', fontWeight: 500, lineHeight: 1.5 }}>{suspension.reason}</div>
        </div>

        {/* Remaining countdown — timed only */}
        {!permanent && (
          <div style={{ background: tint, border: `1px solid ${border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              <Clock size={13} color={accent} />
              <span style={{ fontSize: 10, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {rem?.over ? 'Restoring access…' : 'Access restored in'}
              </span>
            </div>
            {rem && !rem.over && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                {rem.d > 0 && <Unit value={rem.d} label="Days" />}
                <Unit value={rem.h} label="Hours" />
                <Unit value={rem.m} label="Mins" />
                <Unit value={rem.s} label="Secs" />
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
