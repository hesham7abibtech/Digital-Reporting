import type { CSSProperties } from 'react';

/**
 * Unified typography + color tokens for the admin console.
 *
 * One source of truth so every tab shares the same readable scale instead of
 * ad-hoc inline `fontSize: 9…14` / `fontWeight: 900` values. The scale is
 * intentionally small (11 · 12 · 14 · 15 · 16 · 20 · 26) and uses weight — not
 * size — to carry hierarchy. All foreground/background pairs meet WCAG AA
 * (≥4.5:1) on white.
 */

// ── Brand + ink ────────────────────────────────────────────────────
export const TEAL = '#003f49';
export const TEAL_LIGHT = '#015a68';
export const GOLD = '#b58a3c';
export const GOLD_SOFT = 'rgba(181,138,60,0.10)';

export const INK = '#0f172a';        // primary text   — ~17:1 on #fff
export const INK_SOFT = '#334155';   // secondary text — ~9.7:1
export const MUTED = '#64748b';      // tertiary text  — ~4.8:1 (AA)
export const LINE = '#e2e8f0';
export const LINE_SOFT = '#eef2f5';
export const SURFACE_SOFT = '#f8fafc';

export const DANGER = '#dc2626';
export const SUCCESS = '#047857';

// ── Type scale ─────────────────────────────────────────────────────
// Use these directly (`style={{ ...t.body }}`) and override only color/margin.
export const t = {
  /** Tab / page header — e.g. "SECURITY & IDENTITY MANAGEMENT". */
  pageTitle: { fontSize: 20, fontWeight: 800, color: TEAL, letterSpacing: '0.01em', lineHeight: 1.2 },
  /** Sub-header beneath a page title. */
  pageSubtitle: { fontSize: 13, fontWeight: 500, color: MUTED, lineHeight: 1.5 },
  /** Section / panel heading. */
  sectionTitle: { fontSize: 16, fontWeight: 700, color: INK, lineHeight: 1.3 },
  /** Card / row title. */
  cardTitle: { fontSize: 15, fontWeight: 700, color: INK, lineHeight: 1.35 },
  /** Default reading text. Never below 14. */
  body: { fontSize: 14, fontWeight: 400, color: INK_SOFT, lineHeight: 1.55 },
  /** Emphasised body. */
  bodyStrong: { fontSize: 14, fontWeight: 600, color: INK, lineHeight: 1.5 },
  /** Field / form label (uppercase). */
  label: { fontSize: 12, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em' },
  /** Helper / caption text. */
  caption: { fontSize: 12, fontWeight: 500, color: MUTED, lineHeight: 1.45 },
  /** Smallest allowed — uppercase eyebrow / tag. */
  micro: { fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' },
} satisfies Record<string, CSSProperties>;

/** Shared control surface for text inputs / textareas. */
export const inputBase: CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 11,
  background: '#fff', border: `1.5px solid ${LINE}`, color: INK,
  fontSize: 14, fontWeight: 500, outline: 'none', transition: 'border-color 150ms, box-shadow 150ms',
};
