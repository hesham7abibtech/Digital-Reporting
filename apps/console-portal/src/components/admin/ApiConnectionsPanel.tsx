'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Plug, Cloud, KeyRound, Database, RefreshCw, Save,
  CheckCircle2, AlertTriangle, ShieldCheck, ExternalLink, Clock,
} from 'lucide-react';

const FREQS = [
  { v: 'realtime', l: 'Real-time', d: 'Always fresh (re-fetch within ~1 min)' },
  { v: 'hourly', l: 'Hourly', d: 'Cache Notion for 1 hour' },
  { v: 'daily', l: 'Daily', d: 'Refresh once per day' },
  { v: 'weekly', l: 'Weekly', d: 'Refresh once per week' },
  { v: 'monthly', l: 'Monthly', d: 'Refresh once per month' },
  { v: 'manual', l: 'Manual only', d: 'Only when you hit Re-test / save' },
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

type Clock = { day: number; hour: number; minute: string; period: 'AM' | 'PM' };

// Parse stored value ("09:30 AM", "1 09:30 AM", or legacy 24h "13:30") into 12h parts.
function parseSyncTime(s?: string): Clock {
  const out: Clock = { day: 1, hour: 9, minute: '00', period: 'AM' };
  if (!s) return out;
  let str = s.trim();
  const dm = str.match(/^(\d{1,2})\s+(.+)$/);
  if (dm && /\d{1,2}:\d{2}/.test(dm[2])) { out.day = Math.min(28, Math.max(1, parseInt(dm[1], 10))); str = dm[2].trim(); }
  const tm = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (tm) {
    let h = parseInt(tm[1], 10); let per = (tm[3] || '').toUpperCase();
    if (!per) { per = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; } // legacy 24h → 12h
    out.hour = Math.min(12, Math.max(1, h));
    out.minute = MINUTES.includes(tm[2]) ? tm[2] : '00';
    out.period = per === 'PM' ? 'PM' : 'AM';
  }
  return out;
}

function composeSyncTime(p: Clock, monthly: boolean): string {
  const t = `${String(p.hour).padStart(2, '0')}:${p.minute} ${p.period}`;
  return monthly ? `${p.day} ${t}` : t;
}

type ToastFn = (message: string, type?: 'SUCCESS' | 'ERROR' | 'INFO', progress?: number) => void;

interface ConnectionInfo {
  configured: boolean;
  source: 'supabase' | 'env' | 'mixed' | 'none';
  hasStoredToken: boolean;
  tokenHint?: string;
  databaseId?: string;
  version?: string;
  propertyMapSet: boolean;
  tested: boolean;
  connection: { ok: boolean; title?: string; error?: string };
}

const TEAL = '#003f49';

export default function ApiConnectionsPanel({ showToast }: { showToast?: ToastFn }) {
  const { user } = useAuth();
  const [info, setInfo] = useState<ConnectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // All fields start EMPTY; stored values are shown only as placeholder hints.
  const [token, setToken] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [version, setVersion] = useState('');
  const [propertyMap, setPropertyMap] = useState('');
  const [invalid, setInvalid] = useState<{ token?: boolean; databaseId?: boolean }>({});

  // Sync schedule (persisted to settings/bimReviewsSource via /api/admin/bim-source)
  const [syncFrequency, setSyncFrequency] = useState('realtime');
  const [syncTime, setSyncTime] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  const toast = useCallback(
    (m: string, t: 'SUCCESS' | 'ERROR' | 'INFO' = 'SUCCESS') => showToast?.(m, t),
    [showToast],
  );

  const authHeaders = useCallback(async (): Promise<Record<string, string>> => {
    if (!user) throw new Error('Not authenticated');
    const t = await user.getIdToken();
    return { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' };
  }, [user]);

  const clearFields = () => { setToken(''); setDatabaseId(''); setVersion(''); setPropertyMap(''); };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/bim-credentials', { headers: await authHeaders() });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load connection info');
      setInfo(await res.json());      // status/hints only — fields stay empty
      // load the sync schedule from the source config (non-fatal)
      try {
        const sres = await fetch('/api/admin/bim-source', { headers: await authHeaders() });
        if (sres.ok) {
          const cfg = (await sres.json()).config || {};
          setSyncFrequency(cfg.syncFrequency || 'realtime');
          setSyncTime(cfg.syncTime || '');
        }
      } catch { /* schedule is optional */ }
    } catch (e: any) {
      toast(e.message || 'Failed to load connection info', 'ERROR');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, toast]);

  useEffect(() => { if (user) load(); }, [user, load]);

  const save = useCallback(async () => {
    // Only send fields the admin actually typed; blanks keep the stored value.
    const payload: Record<string, string> = {};
    if (token.trim()) payload.token = token.trim();
    if (databaseId.trim()) payload.databaseId = databaseId.trim();
    if (version.trim()) payload.version = version.trim();
    if (propertyMap.trim()) payload.propertyMap = propertyMap.trim();
    if (Object.keys(payload).length === 0) { toast('Nothing changed to save', 'INFO'); return; }
    try {
      setSaving(true);
      const res = await fetch('/api/admin/bim-credentials', {
        method: 'PUT', headers: await authHeaders(), body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setInfo(data.info);
      clearFields();
      setInvalid({});
      if (data.info?.connection?.ok) toast(`Connected to Notion: ${data.info.connection.title || 'database'}`, 'SUCCESS');
      else if (data.info?.configured) toast(`Saved, but connection test failed`, 'ERROR');
      else toast('Saved. Add a token + database id to connect.', 'INFO');
    } catch (e: any) {
      toast(e.message || 'Save failed', 'ERROR');
    } finally {
      setSaving(false);
    }
  }, [authHeaders, token, databaseId, version, propertyMap, toast]);

  // Explicit live test (Re-test button) — pings Notion via ?test=1.
  const retest = useCallback(async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/bim-credentials?test=1', { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Test failed');
      setInfo(data);
      if (data.connection?.ok) toast(`Connected: ${data.connection.title || 'database'}`, 'SUCCESS');
      else if (data.configured) toast('Connection test failed', 'ERROR');
      else toast('Add a token + database id first', 'INFO');
    } catch (e: any) {
      toast(e.message || 'Test failed', 'ERROR');
    } finally {
      setSaving(false);
    }
  }, [authHeaders, toast]);

  const saveSchedule = useCallback(async () => {
    try {
      setSavingSchedule(true);
      const needsTime = ['daily', 'weekly', 'monthly'].includes(syncFrequency);
      const body = { syncFrequency, syncTime: needsTime ? syncTime : '' };
      const res = await fetch('/api/admin/bim-source', {
        method: 'PUT', headers: await authHeaders(), body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save schedule');
      toast('Sync schedule saved', 'SUCCESS');
    } catch (e: any) {
      toast(e.message || 'Failed to save schedule', 'ERROR');
    } finally {
      setSavingSchedule(false);
    }
  }, [authHeaders, syncFrequency, syncTime, toast]);

  if (loading || !info) {
    return (
      <div style={{ width: '100%', minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{'@keyframes apc-spin{to{transform:rotate(360deg)}}@keyframes apc-pulse{0%,100%{opacity:1}50%{opacity:.55}}'}</style>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <div style={{ position: 'relative', width: 62, height: 62 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(0,63,73,0.10)', borderTopColor: '#d0ab82', animation: 'apc-spin 0.85s linear infinite' }} />
            <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', border: '3px solid rgba(0,63,73,0.06)', borderBottomColor: TEAL, animation: 'apc-spin 1.3s linear infinite reverse' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cloud size={20} color={TEAL} style={{ animation: 'apc-pulse 1.5s ease-in-out infinite' }} />
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#64748b' }}>
            Loading API connections…
          </div>
        </div>
      </div>
    );
  }

  const conn = info.connection;
  const status: 'connected' | 'error' | 'unconfigured' | 'idle' =
    !info.configured ? 'unconfigured' : !info.tested ? 'idle' : conn.ok ? 'connected' : 'error';
  const shareHint = !!conn.error && /not.*shared|404|not.*found|could not find/i.test(conn.error);
  const showTime = ['daily', 'weekly', 'monthly'].includes(syncFrequency);

  // Required-field gating for Save & Test.
  const haveToken = !!(token.trim() || info.hasStoredToken);
  const haveDb = !!(databaseId.trim() || (info.databaseId && info.databaseId.length > 0));
  const canSave = haveToken && haveDb;
  const attemptSave = () => {
    if (!canSave) {
      setInvalid({ token: !haveToken, databaseId: !haveDb });
      toast('Please fill the required fields', 'ERROR');
      return;
    }
    save();
  };

  return (
    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 18, alignItems: 'start' }}>
      <style>{'@keyframes apc-shake{10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(2px)}30%,50%,70%{transform:translateX(-4px)}40%,60%{transform:translateX(4px)}}'}</style>
      <div style={card}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
          paddingBottom: 20, borderBottom: '1px solid var(--border,#e8edf2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,rgba(0,63,73,0.10),rgba(0,63,73,0.02))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,63,73,0.08)' }}>
              <Cloud size={24} color={TEAL} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: TEAL, letterSpacing: '-0.01em' }}>Notion — BIM Reviews Report</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Internal Integration Token authentication · live sync source</div>
            </div>
          </div>
          <StatusPill status={status} label={
            status === 'connected' ? `Connected${conn.title ? ` · ${conn.title}` : ''}`
              : status === 'error' ? 'Connection error'
              : status === 'idle' ? 'Saved · not tested' : 'Not configured'} />
        </div>

        {/* Status banners */}
        {status === 'idle' && (
          <div style={{ ...banner, borderColor: 'rgba(0,63,73,0.15)', background: 'rgba(0,63,73,0.03)', color: '#475569' }}>
            <Plug size={16} style={{ flexShrink: 0 }} /> Credentials are saved. Click <strong>&nbsp;Re-test&nbsp;</strong> to verify the live connection.
          </div>
        )}
        {status === 'unconfigured' && (
          <div style={{ ...banner, borderColor: 'rgba(0,63,73,0.15)', background: 'rgba(0,63,73,0.03)', color: '#475569' }}>
            <Plug size={16} style={{ flexShrink: 0 }} /> Enter your integration token and database id below, then Save &amp; Test.
          </div>
        )}
        {status === 'error' && conn.error && (
          <div style={{ ...banner, borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.05)', color: '#b91c1c' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 700, wordBreak: 'break-word' }}>{conn.error}</div>
              {shareHint && <div style={{ marginTop: 6, fontWeight: 600, opacity: 0.9 }}>
                Open the database in Notion → ••• → Connections → add your integration (it must be in the same workspace as the database).
              </div>}
            </div>
          </div>
        )}
        {status === 'connected' && (
          <div style={{ ...banner, borderColor: 'rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.06)', color: '#047857' }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> Integration is live and the BIM database is reachable.
          </div>
        )}

        {/* Fields — full-width responsive grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 18, marginTop: 22 }}>
          <div style={{ gridColumn: 'span 12' }}>
            <Field label="Integration Token *" icon={<KeyRound size={13} />}
              hint={info.hasStoredToken ? `Stored: ${info.tokenHint} — leave blank to keep` : 'Required · starts with ntn_ or secret_'}>
              <input type="password" value={token} autoComplete="off"
                onChange={(e) => { setToken(e.target.value); if (invalid.token) setInvalid((v) => ({ ...v, token: false })); }}
                placeholder={info.hasStoredToken ? '•••••••••• (leave blank to keep current)' : 'ntn_…'} style={fieldStyle(invalid.token)} />
            </Field>
          </div>

          <div style={{ gridColumn: 'span 8' }}>
            <Field label="Database ID *" icon={<Database size={13} />}
              hint={info.databaseId ? 'Stored — leave blank to keep' : 'Required · the 32-char id from the database URL'}>
              <input value={databaseId}
                onChange={(e) => { setDatabaseId(e.target.value); if (invalid.databaseId) setInvalid((v) => ({ ...v, databaseId: false })); }}
                placeholder={info.databaseId ? 'Stored — leave blank to keep' : 'Paste the Notion database ID'} style={fieldStyle(invalid.databaseId)} />
            </Field>
          </div>
          <div style={{ gridColumn: 'span 4' }}>
            <Field label="API Version" hint="blank = default">
              <input value={version} onChange={(e) => setVersion(e.target.value)}
                placeholder={info.version || '2022-06-28'} style={input} />
            </Field>
          </div>

          <div style={{ gridColumn: 'span 12' }}>
            <Field label="Property Map (optional)" hint='Columns auto-detected from your Notion DB. Only set to override a name: {"Project":"Project Name"}'>
              <textarea value={propertyMap} onChange={(e) => setPropertyMap(e.target.value)}
                placeholder={info.propertyMapSet ? '{ … } stored — type new JSON to replace' : '{ }'}
                style={{ ...input, minHeight: 84, fontFamily: 'ui-monospace, monospace', resize: 'vertical' }} />
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 24, flexWrap: 'wrap' }}>
          <button onClick={attemptSave} disabled={saving}
            title={canSave ? 'Save & test the connection' : 'Fill the required fields (token + database id) first'}
            style={{ ...primaryBtn, ...(canSave ? {} : disabledLook), opacity: saving ? 0.7 : 1 }}>
            <Save size={15} /> {saving ? 'Saving & testing…' : 'Save & Test Connection'}
          </button>
          <button onClick={retest} disabled={saving} style={ghostBtn}><RefreshCw size={13} /> Re-test</button>
          <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer" style={{ ...ghostBtn, textDecoration: 'none' }}>
            <ExternalLink size={13} /> Manage Integrations
          </a>
        </div>

        {/* Security footer */}
        <div style={{ ...banner, marginTop: 22, marginBottom: 0, background: 'rgba(0,63,73,0.03)', borderColor: 'rgba(0,63,73,0.10)', color: '#475569' }}>
          <ShieldCheck size={16} color={TEAL} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong style={{ color: TEAL }}>Enterprise-grade security.</strong> Credentials are encrypted at rest,
            held exclusively on the server, and never returned to the browser — only a masked fingerprint is shown.
            Every input is validated before storage. Active credential source: <strong style={{ color: TEAL }}>{info.source}</strong>.
          </span>
        </div>
      </div>

      {/* Sync Schedule */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 18, borderBottom: '1px solid var(--border,#e8edf2)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,rgba(0,63,73,0.10),rgba(0,63,73,0.02))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,63,73,0.08)' }}>
            <Clock size={24} color={TEAL} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: TEAL, letterSpacing: '-0.01em' }}>Sync Schedule</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>How often BIM Reviews data is pulled from Notion</div>
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <Field label="Frequency" icon={<RefreshCw size={13} />} hint={FREQS.find((f) => f.v === syncFrequency)?.d}>
            <select value={syncFrequency} onChange={(e) => setSyncFrequency(e.target.value)} style={input}>
              {FREQS.map((f) => <option key={f.v} value={f.v}>{f.l}</option>)}
            </select>
          </Field>
          {showTime && (
            <div style={{ marginTop: 18 }}>
              <Field label={syncFrequency === 'monthly' ? 'Day & time of month' : 'Time of day'} icon={<Clock size={13} />}
                hint="12-hour clock — choose the exact run time">
                <ClockPicker monthly={syncFrequency === 'monthly'} value={syncTime} onChange={setSyncTime} />
              </Field>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 24, flexWrap: 'wrap' }}>
          <button onClick={saveSchedule} disabled={savingSchedule} style={{ ...primaryBtn, opacity: savingSchedule ? 0.7 : 1 }}>
            <Save size={15} /> {savingSchedule ? 'Saving…' : 'Save Schedule'}
          </button>
          <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
            Controls how fresh the live data is. Exact clock-time runs (e.g. daily 09:00) require a scheduled job — can be enabled next.
          </span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, icon, children }: { label: string; hint?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon} {label}
      </span>
      {hint && <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginTop: 3 }}>{hint}</span>}
      <div style={{ marginTop: 8 }}>{children}</div>
    </label>
  );
}

function StatusPill({ status, label }: { status: 'connected' | 'error' | 'unconfigured' | 'idle'; label: string }) {
  const map = {
    connected: { bg: 'rgba(16,185,129,0.12)', fg: '#047857', icon: <CheckCircle2 size={14} /> },
    error: { bg: 'rgba(239,68,68,0.12)', fg: '#b91c1c', icon: <AlertTriangle size={14} /> },
    idle: { bg: 'rgba(0,63,73,0.10)', fg: TEAL, icon: <Plug size={14} /> },
    unconfigured: { bg: 'rgba(100,116,139,0.12)', fg: '#475569', icon: <Plug size={14} /> },
  }[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 999, fontSize: 11.5, fontWeight: 800,
      textTransform: 'uppercase', letterSpacing: '0.06em', background: map.bg, color: map.fg }}>
      {map.icon} {label}
    </span>
  );
}

function ClockPicker({ monthly, value, onChange }: { monthly: boolean; value: string; onChange: (v: string) => void }) {
  const tp = parseSyncTime(value);
  const set = (patch: Partial<Clock>) => onChange(composeSyncTime({ ...tp, ...patch }, monthly));
  const picker: React.CSSProperties = { ...input, width: 'auto', minWidth: 78, padding: '11px 12px', textAlign: 'center', cursor: 'pointer', fontWeight: 700 };
  const sep: React.CSSProperties = { fontWeight: 900, color: '#cbd5e1', fontSize: 20, alignSelf: 'flex-end', paddingBottom: 9 };
  const mini: React.CSSProperties = { fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 };
  const cell = (label: string, node: React.ReactNode) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}><span style={mini}>{label}</span>{node}</div>
  );
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      {monthly && <>
        {cell('Day', <select value={tp.day} onChange={(e) => set({ day: Number(e.target.value) })} style={picker}>
          {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}</select>)}
        <span style={sep}>·</span>
      </>}
      {cell('Hour', <select value={tp.hour} onChange={(e) => set({ hour: Number(e.target.value) })} style={picker}>
        {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}</select>)}
      <span style={sep}>:</span>
      {cell('Min', <select value={tp.minute} onChange={(e) => set({ minute: e.target.value })} style={picker}>
        {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}</select>)}
      {cell('Period',
        <div style={{ display: 'inline-flex', border: '1px solid var(--border,#dde3ea)', borderRadius: 12, overflow: 'hidden' }}>
          {(['AM', 'PM'] as const).map((p) => (
            <button key={p} type="button" onClick={() => set({ period: p })}
              style={{ padding: '11px 18px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13, transition: 'all 150ms',
                background: tp.period === p ? TEAL : '#fff', color: tp.period === p ? '#fff' : TEAL }}>{p}</button>
          ))}
        </div>)}
    </div>
  );
}

const card: React.CSSProperties = {
  width: '100%', background: '#fff', border: '1px solid var(--border,#e8edf2)', borderRadius: 20,
  padding: 28, boxShadow: '0 1px 3px rgba(16,24,40,0.04)',
};
const input: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12,
  border: '1px solid var(--border,#dde3ea)', fontSize: 14, color: '#0f172a', outline: 'none', background: '#fbfcfe',
};
// Red border + shake when a required field is missing on a save attempt.
function fieldStyle(bad?: boolean): React.CSSProperties {
  return bad
    ? { ...input, border: '1.5px solid #ef4444', background: 'rgba(239,68,68,0.05)', animation: 'apc-shake 0.4s ease' }
    : input;
}
const disabledLook: React.CSSProperties = {
  background: '#cbd5e1', color: '#fff', boxShadow: 'none', cursor: 'not-allowed',
};
const banner: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 10, border: '1px solid var(--border,#e8edf2)', borderRadius: 14,
  padding: '14px 16px', fontSize: 12.5, lineHeight: 1.5, marginTop: 20, marginBottom: 0,
};
const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 26px', borderRadius: 13, border: 'none',
  background: `linear-gradient(135deg, ${TEAL}, #015a68)`, color: '#fff', fontSize: 12.5, fontWeight: 800,
  cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', boxShadow: '0 4px 14px rgba(0,63,73,0.25)',
};
const ghostBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 7, padding: '12px 18px', borderRadius: 13,
  border: '1px solid var(--border,#dde3ea)', background: '#fff', color: TEAL, fontSize: 11.5, fontWeight: 800,
  cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em',
};
