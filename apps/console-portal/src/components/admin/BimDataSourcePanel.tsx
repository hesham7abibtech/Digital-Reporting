'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Database, Cloud, HardDrive, Layers, RefreshCw, Plus,
  CheckCircle2, AlertTriangle, Power,
} from 'lucide-react';

type ToastFn = (message: string, type?: 'SUCCESS' | 'ERROR' | 'INFO', progress?: number) => void;

type Mode = 'notion' | 'manual' | 'hybrid';
type MergeStrategy = 'manual_override' | 'notion_override';

interface SourceConfig {
  mode: Mode;
  notionSyncEnabled: boolean;
  mergeStrategy: MergeStrategy;
  updatedAt?: string;
  updatedBy?: string;
}
interface NotionStatus {
  configured: boolean;
  ok: boolean;
  title?: string;
  error?: string;
}

const TEAL = '#003f49';

const MODES: { id: Mode; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'notion', label: 'Notion Only', desc: 'Strictly from the Notion API', icon: <Cloud size={16} /> },
  { id: 'manual', label: 'Manual Only', desc: 'Ignore Notion; manual entries only', icon: <HardDrive size={16} /> },
  { id: 'hybrid', label: 'Hybrid', desc: 'Merge Notion (primary) + manual', icon: <Layers size={16} /> },
];

export default function BimDataSourcePanel({ showToast }: { showToast?: ToastFn }) {
  const { user } = useAuth();
  const [config, setConfig] = useState<SourceConfig | null>(null);
  const [notion, setNotion] = useState<NotionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const toast = useCallback(
    (m: string, t: 'SUCCESS' | 'ERROR' | 'INFO' = 'SUCCESS') => showToast?.(m, t),
    [showToast],
  );

  const authHeaders = useCallback(async (): Promise<Record<string, string>> => {
    if (!user) throw new Error('Not authenticated');
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, [user]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/bim-source', { headers: await authHeaders() });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load configuration');
      const data = await res.json();
      setConfig(data.config);
      setNotion(data.notion);
    } catch (e: any) {
      toast(e.message || 'Failed to load BIM data source config', 'ERROR');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, toast]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const patch = useCallback(
    async (body: Partial<SourceConfig>) => {
      const prev = config;
      // optimistic
      setConfig((c) => (c ? { ...c, ...body } : c));
      try {
        setSaving(true);
        const res = await fetch('/api/admin/bim-source', {
          method: 'PUT',
          headers: await authHeaders(),
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Update failed');
        const data = await res.json();
        setConfig(data.config);
        toast('Data source configuration updated', 'SUCCESS');
      } catch (e: any) {
        setConfig(prev); // rollback
        toast(e.message || 'Update failed', 'ERROR');
      } finally {
        setSaving(false);
      }
    },
    [authHeaders, config, toast],
  );

  if (loading || !config) {
    return (
      <div style={{ padding: 24, color: TEAL, fontSize: 12, fontWeight: 700 }}>
        <RefreshCw size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Loading data source control…
      </div>
    );
  }

  const card: React.CSSProperties = {
    background: '#fff',
    border: '1px solid var(--border, #e2e8f0)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  };
  const sectionTitle: React.CSSProperties = {
    fontSize: 11, fontWeight: 900, color: TEAL, textTransform: 'uppercase',
    letterSpacing: '0.12em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
  };

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Status header */}
      <div style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={sectionTitle}><Database size={16} /> BIM Reviews · Data Source Control</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusPill
            ok={config.mode === 'manual' ? true : notion?.ok ?? false}
            label={
              config.mode === 'manual'
                ? 'Manual store active'
                : !config.notionSyncEnabled
                ? 'Notion sync OFF'
                : notion?.configured
                ? notion?.ok
                  ? `Notion: ${notion.title || 'connected'}`
                  : `Notion error`
                : 'Notion not configured'
            }
          />
          <button onClick={load} disabled={saving} style={ghostBtn}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Mode selection */}
      <div style={card}>
        <div style={sectionTitle}>Active Mode</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {MODES.map((m) => {
            const active = config.mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => !active && patch({ mode: m.id })}
                disabled={saving}
                style={{
                  textAlign: 'left', cursor: active ? 'default' : 'pointer', padding: 14, borderRadius: 12,
                  border: active ? `2px solid ${TEAL}` : '1px solid var(--border, #e2e8f0)',
                  background: active ? 'rgba(0,63,73,0.04)' : '#fff', transition: 'all 150ms',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: TEAL, fontWeight: 800, fontSize: 13 }}>
                  {m.icon} {m.label}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{m.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notion sync toggle + merge strategy */}
      <div style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={sectionTitle}><Power size={15} /> Notion Sync</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={config.notionSyncEnabled}
              disabled={saving}
              onChange={(e) => patch({ notionSyncEnabled: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: TEAL, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
              {config.notionSyncEnabled ? 'Enabled — Notion is read live' : 'Disabled — Notion reads halted'}
            </span>
          </label>
        </div>

        {config.mode === 'hybrid' && (
          <div>
            <div style={sectionTitle}>Merge Strategy</div>
            <select
              value={config.mergeStrategy}
              disabled={saving}
              onChange={(e) => patch({ mergeStrategy: e.target.value as MergeStrategy })}
              style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border,#e2e8f0)', fontSize: 12, fontWeight: 700, color: TEAL }}
            >
              <option value="manual_override">Manual overrides Notion (same ID)</option>
              <option value="notion_override">Notion overrides Manual (same ID)</option>
            </select>
          </div>
        )}
      </div>

      {notion?.error && config.notionSyncEnabled && config.mode !== 'manual' && (
        <div style={{ ...card, borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)', color: '#b91c1c', fontSize: 12 }}>
          <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Notion connection issue: {notion.error}
        </div>
      )}

      <ManualEntryForm authHeaders={authHeaders} toast={toast} />

      {config.updatedBy && (
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
          Last updated by {config.updatedBy}{config.updatedAt ? ` · ${new Date(config.updatedAt).toLocaleString()}` : ''}
        </div>
      )}
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999,
        fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
        background: ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
        color: ok ? '#047857' : '#b91c1c',
      }}
    >
      {ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />} {label}
    </span>
  );
}

const ghostBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10,
  border: '1px solid var(--border,#e2e8f0)', background: '#fff', color: TEAL, fontSize: 11,
  fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em',
};

function ManualEntryForm({
  authHeaders,
  toast,
}: {
  authHeaders: () => Promise<Record<string, string>>;
  toast: (m: string, t?: 'SUCCESS' | 'ERROR' | 'INFO') => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    ID: '', Project: '', Stakeholder: '', Status: '', Reviewer: '', Category: '', Comments: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const toArr = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

  const submit = async () => {
    if (!form.Project.trim()) { toast('Project is required', 'ERROR'); return; }
    try {
      setBusy(true);
      const res = await fetch('/api/admin/bim-reviews', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          ...(form.ID.trim() ? { ID: form.ID.trim() } : {}),
          Project: form.Project.trim(),
          Stakeholder: form.Stakeholder.trim(),
          'InSite Review Status': form.Status.trim(),
          'InSite Reviewer': toArr(form.Reviewer),
          'Submission Category': toArr(form.Category),
          'General Comments': form.Comments.trim(),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save entry');
      const data = await res.json();
      toast(`Manual entry saved (${data.id})`, 'SUCCESS');
      setForm({ ID: '', Project: '', Stakeholder: '', Status: '', Reviewer: '', Category: '', Comments: '' });
      setOpen(false);
    } catch (e: any) {
      toast(e.message || 'Failed to save entry', 'ERROR');
    } finally {
      setBusy(false);
    }
  };

  const input: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border,#e2e8f0)',
    fontSize: 12, marginTop: 4,
  };
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' };

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border,#e2e8f0)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <button onClick={() => setOpen((o) => !o)} style={{ ...ghostBtn, border: 'none', padding: 0, background: 'transparent' }}>
        <Plus size={14} /> {open ? 'Hide manual entry form' : 'Add manual BIM review'}
      </button>
      {open && (
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 12 }}>
          <label style={lbl}>ID (optional — set to override existing)
            <input style={input} value={form.ID} onChange={set('ID')} placeholder="auto-generated if blank" />
          </label>
          <label style={lbl}>Project *
            <input style={input} value={form.Project} onChange={set('Project')} />
          </label>
          <label style={lbl}>Stakeholder
            <input style={input} value={form.Stakeholder} onChange={set('Stakeholder')} />
          </label>
          <label style={lbl}>InSite Review Status
            <input style={input} value={form.Status} onChange={set('Status')} />
          </label>
          <label style={lbl}>Reviewer (comma-separated)
            <input style={input} value={form.Reviewer} onChange={set('Reviewer')} />
          </label>
          <label style={lbl}>Submission Category (comma-separated)
            <input style={input} value={form.Category} onChange={set('Category')} />
          </label>
          <label style={{ ...lbl, gridColumn: '1 / -1' }}>General Comments
            <textarea style={{ ...input, minHeight: 60, resize: 'vertical' }} value={form.Comments} onChange={set('Comments')} />
          </label>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10 }}>
            <button onClick={submit} disabled={busy} style={{ ...ghostBtn, background: TEAL, color: '#fff', border: 'none' }}>
              {busy ? 'Saving…' : 'Save Entry'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
