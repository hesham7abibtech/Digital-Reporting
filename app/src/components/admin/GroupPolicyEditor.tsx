'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  X, Save, Trash2, ShieldCheck, Check, Eye, Pencil, Ban,
  BarChart3, Layers, Users, Image as ImageIcon, FileText, LayoutDashboard,
  Megaphone, Inbox, FolderOpen, Plug, Shield, KeyRound,
} from 'lucide-react';
import { GroupPolicy, PolicyActions } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/shared/EliteToast';

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
  { id: 'view', label: 'Visibility', icon: <Eye size={12} /> },
  { id: 'edit', label: 'Modify', icon: <Pencil size={12} /> },
  { id: 'delete', label: 'Terminate', icon: <Ban size={12} /> },
];

const TEAL = '#003f49';
const GOLD = '#b58a3c';

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

  const authHeaders = async (): Promise<Record<string, string>> => {
    if (!user) throw new Error('Not authenticated');
    return { Authorization: `Bearer ${await user.getIdToken()}`, 'Content-Type': 'application/json' };
  };

  const grantedCount = useMemo(() => {
    const mods = (formData.modules || {}) as Record<string, PolicyActions>;
    return Object.values(mods).reduce((n, a) => n + (a?.view ? 1 : 0) + (a?.edit ? 1 : 0) + (a?.delete ? 1 : 0), 0);
  }, [formData.modules]);

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

  const toggle = (modId: string, action: keyof PolicyActions) => {
    const modules = { ...(formData.modules || {}) } as any;
    const cur = modules[modId] || { view: false, edit: false, delete: false };
    modules[modId] = { ...cur, [action]: !cur[action] };
    setFormData({ ...formData, modules });
  };
  const grantAll = (modId: string) => {
    const modules = { ...(formData.modules || {}) } as any;
    const cur = modules[modId] || { view: false, edit: false, delete: false };
    const all = cur.view && cur.edit && cur.delete;
    modules[modId] = { view: !all, edit: !all, delete: !all };
    setFormData({ ...formData, modules });
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(2,17,20,0.78)', backdropFilter: 'blur(10px)' }} />

      <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 880, background: '#fff', borderRadius: 22, position: 'relative', zIndex: 1,
          overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #eef2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(0,63,73,0.05), rgba(181,138,60,0.04))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: `linear-gradient(135deg, ${TEAL}, #015a68)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(0,63,73,0.3)' }}>
              <ShieldCheck size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: TEAL, letterSpacing: '-0.01em' }}>
                {policy?.id ? 'Refine Access Policy' : 'Forge New Access Policy'}
              </h2>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Module-level authority across all admin sections
                <span style={{ marginLeft: 8, color: GOLD, fontWeight: 800 }}>· {grantedCount} grants</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}><X size={22} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
            <Field label="Policy Identity *">
              <input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Regional Manager Access" style={inputStyle} />
            </Field>
            <Field label="Strategic Intent">
              <input value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of authorization scope…" style={inputStyle} />
            </Field>
          </div>

          {/* Restriction toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, padding: '12px 16px',
            background: 'rgba(181,138,60,0.06)', borderRadius: 14, border: '1px solid rgba(181,138,60,0.2)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 900, color: TEAL, letterSpacing: '0.04em' }}>TEAM MATE RESTRICTION PROTOCOL</div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>When active, subjects only view their exclusively assigned Digital Deliverables.</div>
            </div>
            <button type="button" onClick={() => setFormData({ ...formData, isTeammatePolicy: !formData.isTeammatePolicy })}
              style={{ width: 48, height: 27, borderRadius: 14, border: 'none', position: 'relative', cursor: 'pointer', flexShrink: 0,
                background: formData.isTeammatePolicy ? TEAL : '#cbd5e1', transition: 'background 200ms' }}>
              <motion.div layout style={{ width: 21, height: 21, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3,
                left: formData.isTeammatePolicy ? 24 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
            </button>
          </div>

          {/* Module spectrum */}
          <div style={{ border: '1px solid #eef2f5', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 84px 84px 84px 92px', alignItems: 'center',
              padding: '11px 16px', background: '#f8fafc', borderBottom: '1px solid #eef2f5' }}>
              <div style={hCell}>Module Spectrum</div>
              {ACTIONS.map((a) => <div key={a.id} style={{ ...hCell, textAlign: 'center' }}>{a.label}</div>)}
              <div style={{ ...hCell, textAlign: 'center' }}>Grant All</div>
            </div>

            {MODULES.map((mod, i) => {
              const m = (formData.modules?.[mod.id as keyof GroupPolicy['modules']] || {}) as PolicyActions;
              const all = m.view && m.edit && m.delete;
              const Icon = mod.icon;
              return (
                <div key={mod.id} style={{ display: 'grid', gridTemplateColumns: '1fr 84px 84px 84px 92px', alignItems: 'center',
                  padding: '10px 16px', borderBottom: i < MODULES.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(0,63,73,0.06)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color={TEAL} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{mod.label}</div>
                      <div style={{ fontSize: 10.5, color: '#94a3b8' }}>{mod.description}</div>
                    </div>
                  </div>
                  {ACTIONS.map((a) => {
                    const active = !!m[a.id];
                    return (
                      <div key={a.id} style={{ textAlign: 'center' }}>
                        <button onClick={() => toggle(mod.id, a.id)} title={a.label}
                          style={{ width: 26, height: 26, borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            border: `1.5px solid ${active ? TEAL : '#cbd5e1'}`, background: active ? TEAL : '#fff',
                            color: '#fff', transition: 'all 150ms' }}>
                          {active && <Check size={15} />}
                        </button>
                      </div>
                    );
                  })}
                  <div style={{ textAlign: 'center' }}>
                    <button onClick={() => grantAll(mod.id)}
                      style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
                        border: `1px solid ${all ? 'rgba(239,68,68,0.3)' : 'rgba(181,138,60,0.4)'}`,
                        background: all ? 'rgba(239,68,68,0.06)' : 'rgba(181,138,60,0.08)', color: all ? '#b91c1c' : GOLD, transition: 'all 150ms' }}>
                      {all ? 'Revoke' : 'Select'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #eef2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
          {policy?.id ? (
            <button onClick={handleDelete} disabled={isDeleting}
              style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 800, opacity: isDeleting ? 0.5 : 1 }}>
              <Trash2 size={16} /> Purge Policy
            </button>
          ) : <div />}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ padding: '11px 22px', borderRadius: 11, background: '#fff', color: TEAL, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={isSaving}
              style={{ padding: '11px 26px', borderRadius: 11, background: `linear-gradient(135deg, ${TEAL}, #015a68)`, color: '#fff', border: 'none',
                fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 6px 18px rgba(0,63,73,0.28)', opacity: isSaving ? 0.7 : 1 }}>
              <Save size={16} /> {isSaving ? 'Synchronizing…' : 'Finalize Security Parameters'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 10, fontWeight: 900, color: TEAL, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 11,
  background: '#fbfcfe', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: 14, outline: 'none',
};
const hCell: React.CSSProperties = { fontSize: 10.5, fontWeight: 900, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.08em' };
