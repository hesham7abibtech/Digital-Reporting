'use client';

import React from 'react';

/**
 * Premium tab-transition loader. Rendered as an absolute overlay INSIDE the
 * dashboard <main> content region only — the sidebar and top bar stay visible.
 */
export default function TabLoader() {
  return (
    <div
      aria-busy="true"
      style={{
        position: 'absolute', inset: 0, zIndex: 60,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30,
        background: 'radial-gradient(circle at 50% 38%, rgba(255,255,255,0.94), rgba(243,247,250,0.97))',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        animation: 'reh-fade-in 240ms ease-out',
      }}
    >
      <style>{KEYFRAMES}</style>

      {/* Dual-ring spinner with brand core */}
      <div style={{ position: 'relative', width: 104, height: 104 }}>
        <div style={ring(0, '3px solid rgba(0,63,73,0.08)', '#d0ab82', 'reh-spin 0.95s linear infinite')} />
        <div style={ring(16, '3px solid rgba(0,63,73,0.06)', '#003f49', 'reh-spin 1.5s linear infinite reverse', 'borderBottomColor')} />
        <div
          style={{
            position: 'absolute', inset: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg,#003f49,#002B32)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,63,73,0.4)', animation: 'reh-pulse 1.6s ease-in-out infinite',
          }}
        >
          <span style={{ color: '#d0ab82', fontWeight: 900, fontSize: 15, letterSpacing: '0.04em' }}>R</span>
        </div>
      </div>

      {/* Animated gradient wordmark */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 30, fontWeight: 900, letterSpacing: '0.2em',
            background: 'linear-gradient(90deg,#d0ab82 0%,#003f49 35%,#002B32 50%,#003f49 65%,#d0ab82 100%)',
            backgroundSize: '200% auto', WebkitBackgroundClip: 'text', backgroundClip: 'text',
            color: 'transparent', WebkitTextFillColor: 'transparent', animation: 'reh-grad 2.4s linear infinite',
            fontFamily: 'var(--font-heading)',
          }}
        >
          REH&nbsp;DIGITAL
        </div>
        <div style={{ marginTop: 10, fontSize: 10, fontWeight: 800, letterSpacing: '0.4em', color: '#94a3b8', textTransform: 'uppercase' }}>
          Loading
          <span style={{ animation: 'reh-blink 1.4s ease-in-out infinite' }}>.</span>
          <span style={{ animation: 'reh-blink 1.4s ease-in-out 0.2s infinite' }}>.</span>
          <span style={{ animation: 'reh-blink 1.4s ease-in-out 0.4s infinite' }}>.</span>
        </div>
      </div>
    </div>
  );
}

function ring(inset: number, border: string, accent: string, animation: string, side: 'borderTopColor' | 'borderBottomColor' = 'borderTopColor'): React.CSSProperties {
  return { position: 'absolute', inset, borderRadius: '50%', border, [side]: accent, animation } as React.CSSProperties;
}

const KEYFRAMES = `
@keyframes reh-spin { to { transform: rotate(360deg); } }
@keyframes reh-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.86); opacity: 0.85; } }
@keyframes reh-grad { to { background-position: 200% center; } }
@keyframes reh-blink { 0%,100% { opacity: 0.2; } 50% { opacity: 1; } }
@keyframes reh-fade-in { from { opacity: 0; } to { opacity: 1; } }
`;
