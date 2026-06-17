'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  X, Save, Trash2, ShieldCheck, Check, Eye, Pencil, Ban,
  BarChart3, Layers, Users, Image as ImageIcon, FileText, LayoutDashboard,
  Megaphone, Inbox, FolderOpen, Plug, Shield, KeyRound, Lock, Sparkles,
} from 'lucide-react';
import { GroupPolicy, PolicyActions } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/shared/EliteToast';
import { t, TEAL, TEAL_LIGHT, GOLD, INK, MUTED, LINE, LINE_SOFT, SURFACE_SOFT, DANGER } from '@/lib/adminType';

interface GroupPolicyEditorProps {
  policy: GroupPolicy | null;
  isOpen: boolean;
  onClose: () => void;
}

// Every admin portal tab / section.
const MODULES = [
  { id: 'tasks', label: 'Deliverable Matrix', description: 'Digital deliverables & milestone tracking', icon: BarChart3 },
  { id: 'bimReviews', label: 'BIM Review Matrix', description: 'Cross-project BIM submission reviews', icon: Layers },
  { id: 'team', label: 'Team Orchestration', description: 'Personnel management & access', icon: Users },
  { id: 'branding', label: 'Identity & Branding', description: 'Global aesthetics & metadata', icon: ImageIcon },
  { id: 'reports', label: 'Report Settings', description: 'Report configuration & parameters', icon: FileText },
  { id: 'homePage', label: 'Home Page CMS', description: 'Home page content & display', icon: LayoutDashboard },
  { id: 'broadcast', label: 'Communications', description: 'Broadcasts & SMTP notifications', icon: Megaphone },
  { id: 'tickets', label: 'Access Tickets', description: 'Access requests & appeals', icon: Inbox },
  { id: 'registry', label: 'Asset Registry', description: 'Digital resource & navigation registry', icon: FolderOpen },
  { id: 'apiConnections', label: 'API Connections', description: 'Notion & integration credentials', icon: Plug },
  { id: 'users', label: 'Access Control', description: 'User accounts & clearance', icon: Shield },
  { id: 'policies', label: 'Group Policy', description: 'Permission infrastructure', icon: KeyRound },
] as const;

const ACTIONS: { id: keyof PolicyActions; label: string; icon: React.ReactNode }[] = [
  { id: 'view', label: 'View', icon: <Eye size={13} /> },
  { id: 'edit', label: 'Modify', icon: <Pencil size={13} /> },
  { id: 'delete', label: 'Delete', icon: <Ban size={13} /> },
];

const GRID = '1fr 60px 60px 60px 78px';
const MAX_GRANTS = MODULES.length * ACTIONS.length;

export default function GroupPolicyEditor({ policy, isOpen, onClose }: GroupPolicyEditorProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<GroupPolicy>>({ name: '', description: '', modules: {} as any });

  useEffect(() => {
    if (policy && policy.id) setFormData(policy);
    else setFormData({
      name: '', description: '',
      modules: MODULES.reduce((acc, m) => ({ ...acc, [m.id]: { view: false, edit: false, delete: false } }), {}) as any,
    });
  }, [policy, isOpen]);

  // Close on Escape (escape-routes / modal-escape).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const authHeaders = async (): Promise<Record<string, string>> => {
    if (!user) throw new Error('Not authenticated');
    return { Authorization: `Bearer ${await user.getIdToken()}`, 'Content-Type': 'application/json' };
  };

  const grantedCount = useMemo(() => {
    const mods = (formData.modules || {}) as Record<string, PolicyActions>;
    return Object.values(mods).reduce((n, a) => n + (a?.view ? 1 : 0) + (a?.edit ? 1 : 0) + (a?.delete ? 1 : 0), 0);
  }, [formData.modules]);

  const grantedModules = useMemo(() =>
    MODULES.filter((m) => {
      const a = (formData.modules?.[m.id as keyof GroupPolicy['modules']] || {}) as PolicyActions;
      return a.view || a.edit || a.delete;
    }), [formData.modules]);

  const handleSave = async () => {
    if (!formData.name?.trim()) { showToast('Policy name is required.', 'ERROR'); return; }
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/policies', {
        method: 'POST', headers: await authHeaders(),
        body: JSON.stringify({ ...formData, id: policy?.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      showToast('Security policy synchronized.', 'SUCCESS');
      window.dispatchEvent(new Event('policies:changed')); // realtime refresh for the list
      onClose();
    } catch (e: any) {
      showToast(e.message || 'Synchronization error.', 'ERROR');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!policy?.id) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/policies?id=${encodeURIComponent(policy.id)}`, { method: 'DELETE', headers: await authHeaders() });
      if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
      showToast('Policy purged.', 'SUCCESS');
      window.dispatchEvent(new Event('policies:changed'));
      onClose();
    } catch (e: any) {
      showToast(e.message || 'Termination failure.', 'ERROR');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggle = useCallback((modId: string, action: keyof PolicyActions) => {
    setFormData((prev) => {
      const modules = { ...(prev.modules || {}) } as any;
      const cur = modules[modId] || { view: false, edit: false, delete: false };
      modules[modId] = { ...cur, [action]: !cur[action] };
      return { ...prev, modules };
    });
  }, []);
  const grantAll = useCallback((modId: string) => {
    setFormData((prev) => {
      const modules = { ...(prev.modules || {}) } as any;
      const cur = modules[modId] || { view: false, edit: false, delete: false };
      const all = cur.view && cur.edit && cur.delete;
      modules[modId] = { view: !all, edit: !all, delete: !all };
      return { ...prev, modules };
    });
  }, []);

  if (!isOpen) return null;

  const isNew = !policy?.id;
  const pct = Math.round((grantedCount / MAX_GRANTS) * 100);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(2,17,20,0.80)', backdropFilter: 'blur(10px)' }} />

      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 18 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        role="dialog" aria-modal="true" aria-label={isNew ? 'Forge New Access Policy' : 'Refine Access Policy'}
        style={{ width: '94vw', maxWidth: 1180, height: '90vh', background: '#fff', borderRadius: 24, position: 'relative', zIndex: 1,
          overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '94vh' }}>

        {/* Accent rail */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${TEAL}, ${GOLD})` }} />

        {/* Header */}
        <div style={{ padding: '20px 26px', borderBottom: `1px solid ${LINE_SOFT}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(0,63,73,0.05), rgba(181,138,60,0.05))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${TEAL}, ${TEAL_LIGHT})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,63,73,0.32)' }}>
              <ShieldCheck size={24} color="#fff" />
            </div>
            <div>
              <h2 style={{ ...t.pageTitle, margin: 0, fontSize: 19 }}>
                {isNew ? 'Forge New Access Policy' : 'Refine Access Policy'}
              </h2>
              <div style={{ ...t.caption, marginTop: 3 }}>Module-level authority across all administrative sections</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', border: `1px solid ${LINE}`, color: MUTED, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body — two columns: control rail + permission matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 332px) 1fr', gap: 0, overflow: 'hidden', flex: 1, minHeight: 0 }}>

          {/* ── Left rail ── */}
          <div style={{ padding: '22px 24px', borderRight: `1px solid ${LINE_SOFT}`, overflowY: 'auto', background: SURFACE_SOFT, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Field label="Policy Identity" required>
              <input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Regional Manager Access" style={inputStyle} autoFocus
                onFocus={focusRing} onBlur={blurRing} />
            </Field>

            <Field label="Strategic Intent">
              <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the authorization scope and who this policy is for…" rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} onFocus={focusRing} onBlur={blurRing} />
            </Field>

            {/* Team-mate restriction */}
            <div style={{ padding: '14px 16px', background: 'rgba(181,138,60,0.07)', borderRadius: 14, border: '1px solid rgba(181,138,60,0.22)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Lock size={16} color={GOLD} style={{ marginTop: 1, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ ...t.micro, color: '#8a6a2c' }}>Team-Mate Restriction</div>
                  <div style={{ ...t.caption, marginTop: 4 }}>Subjects see only their exclusively assigned Digital Deliverables.</div>
                </div>
                <button type="button" role="switch" aria-checked={!!formData.isTeammatePolicy} aria-label="Team-mate restriction"
                  onClick={() => setFormData({ ...formData, isTeammatePolicy: !formData.isTeammatePolicy })}
                  style={{ width: 46, height: 26, borderRadius: 13, border: 'none', position: 'relative', cursor: 'pointer', flexShrink: 0,
                    background: formData.isTeammatePolicy ? TEAL : '#cbd5e1', transition: 'background 200ms' }}>
                  <motion.div layout transition={{ type: 'spring', damping: 20, stiffness: 360 }}
                    style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3,
                      left: formData.isTeammatePolicy ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                </button>
              </div>
            </div>

            {/* Authority summary */}
            <div style={{ marginTop: 'auto', padding: '16px 18px', borderRadius: 16, background: `linear-gradient(135deg, ${TEAL}, ${TEAL_LIGHT})`, color: '#fff', boxShadow: '0 10px 26px rgba(0,63,73,0.28)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Sparkles size={15} color={GOLD} />
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.85)' }}>Authority Summary</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{grantedCount}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>/ {MAX_GRANTS} grants · {grantedModules.length} modules</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.18)', marginTop: 12, overflow: 'hidden' }}>
                <motion.div animate={{ width: `${pct}%` }} transition={{ type: 'spring', damping: 24, stiffness: 220 }}
                  style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${GOLD}, #e3c79a)` }} />
              </div>
            </div>
          </div>

          {/* ── Right: permission matrix ── */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '16px 24px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ ...t.sectionTitle }}>Module Spectrum</h3>
                <div style={{ ...t.caption, marginTop: 2 }}>Toggle per-section visibility, modification, and deletion authority.</div>
              </div>
            </div>

            <div style={{ margin: '0 24px 4px', border: `1px solid ${LINE_SOFT}`, borderRadius: 14, overflow: 'hidden', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              {/* sticky column header */}
              <div style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', padding: '11px 16px', background: SURFACE_SOFT, borderBottom: `1px solid ${LINE_SOFT}` }}>
                <div style={t.micro}>Module</div>
                {ACTIONS.map((a) => <div key={a.id} style={{ ...t.micro, textAlign: 'center' }}>{a.label}</div>)}
                <div style={{ ...t.micro, textAlign: 'center' }}>All</div>
              </div>

              <div style={{ overflowY: 'auto', flex: 1 }}>
                {MODULES.map((mod, i) => {
                  const m = (formData.modules?.[mod.id as keyof GroupPolicy['modules']] || {}) as PolicyActions;
                  const all = m.view && m.edit && m.delete;
                  const Icon = mod.icon;
                  return (
                    <div key={mod.id} style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center',
                      padding: '10px 16px', borderBottom: i < MODULES.length - 1 ? `1px solid ${LINE_SOFT}` : 'none',
                      background: (m.view || m.edit || m.delete) ? 'rgba(0,63,73,0.025)' : '#fff', transition: 'background 150ms' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(0,63,73,0.06)', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={16} color={TEAL} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ ...t.bodyStrong, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.label}</div>
                          <div style={{ ...t.caption, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.description}</div>
                        </div>
                      </div>
                      {ACTIONS.map((a) => {
                        const active = !!m[a.id];
                        const danger = a.id === 'delete';
                        const onColor = danger ? DANGER : TEAL;
                        return (
                          <div key={a.id} style={{ textAlign: 'center' }}>
                            <button onClick={() => toggle(mod.id, a.id)} aria-label={`${a.label} ${mod.label}`} aria-pressed={active} title={`${a.label} · ${mod.label}`}
                              style={{ width: 30, height: 30, borderRadius: 9, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                border: `1.5px solid ${active ? onColor : '#cbd5e1'}`, background: active ? onColor : '#fff',
                                color: active ? '#fff' : '#cbd5e1', transition: 'all 150ms' }}>
                              {active ? <Check size={16} /> : a.icon}
                            </button>
                          </div>
                        );
                      })}
                      <div style={{ textAlign: 'center' }}>
                        <button onClick={() => grantAll(mod.id)} aria-label={all ? `Revoke all for ${mod.label}` : `Grant all for ${mod.label}`}
                          style={{ padding: '6px 11px', borderRadius: 8, cursor: 'pointer', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
                            border: `1px solid ${all ? 'rgba(220,38,38,0.3)' : 'rgba(181,138,60,0.4)'}`,
                            background: all ? 'rgba(220,38,38,0.06)' : 'rgba(181,138,60,0.08)', color: all ? '#b91c1c' : GOLD, transition: 'all 150ms' }}>
                          {all ? 'Revoke' : 'All'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '15px 26px', borderTop: `1px solid ${LINE_SOFT}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: SURFACE_SOFT }}>
          {!isNew ? (
            <button onClick={handleDelete} disabled={isDeleting}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', color: DANGER, cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: isDeleting ? 0.5 : 1 }}>
              <Trash2 size={16} /> Purge Policy
            </button>
          ) : <div style={{ ...t.caption }}>Define authority, then finalize to delegate.</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ padding: '11px 22px', borderRadius: 11, background: '#fff', color: TEAL, border: `1px solid ${LINE}`, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={isSaving}
              style={{ padding: '11px 26px', borderRadius: 11, background: `linear-gradient(135deg, ${TEAL}, ${TEAL_LIGHT})`, color: '#fff', border: 'none',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 20px rgba(0,63,73,0.3)', opacity: isSaving ? 0.7 : 1 }}>
              <Save size={16} /> {isSaving ? 'Synchronizing…' : isNew ? 'Forge Policy' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ ...t.label, display: 'block', marginBottom: 8 }}>
        {label}{required && <span style={{ color: DANGER, marginLeft: 4 }}>*</span>}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 11,
  background: '#fff', border: `1.5px solid ${LINE}`, color: INK, fontSize: 14, fontWeight: 500,
  outline: 'none', transition: 'border-color 150ms, box-shadow 150ms', fontFamily: 'inherit',
};
const focusRing = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = TEAL;
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,63,73,0.10)';
};
const blurRing = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = LINE;
  e.currentTarget.style.boxShadow = 'none';
};
