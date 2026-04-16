'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Shield, Check, Info, AlertCircle } from 'lucide-react';
import { GroupPolicy, PolicyActions } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/components/shared/EliteToast';

interface GroupPolicyEditorProps {
  policy: GroupPolicy | null;
  isOpen: boolean;
  onClose: () => void;
}

const MODULES = [
  { id: 'tasks', label: 'Tasks Matrix', description: 'Digital Deliverables & Milestone tracking' },
  { id: 'team', label: 'Team Orchestration', description: 'Personnel management & access' },
  { id: 'branding', label: 'Identity Designer', description: 'Global aesthetics & metadata' },
  { id: 'registry', label: 'Asset Registry', description: 'Digital resource management' },
  { id: 'broadcast', label: 'Communications Hub', description: 'Real-time alert dispatch & transmission' },
  { id: 'users', label: 'Access Control', description: 'User account security' },
  { id: 'policies', label: 'Group Policy', description: 'Permission infrastructure' },
];

const ACTIONS: { id: keyof PolicyActions; label: string }[] = [
  { id: 'view', label: 'Visibility' },
  { id: 'edit', label: 'Modify' },
  { id: 'delete', label: 'Terminate' },
];

export default function GroupPolicyEditor({ policy, isOpen, onClose }: GroupPolicyEditorProps) {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<GroupPolicy>>({
    name: '',
    description: '',
    modules: {} as any
  });

  useEffect(() => {
    if (policy && policy.id) {
      setFormData(policy);
    } else {
      setFormData({
        name: '',
        description: '',
        modules: MODULES.reduce((acc, mod) => ({
          ...acc,
          [mod.id]: { view: false, edit: false, delete: false }
        }), {}) as any
      });
    }
  }, [policy, isOpen]);

  const handleSave = async () => {
    if (!formData.name) {
      showToast('Policy name is required.', 'ERROR');
      return;
    }

    setIsSaving(true);
    try {
      const id = policy?.id || `policy-${Date.now()}`;
      const finalPolicy = {
        ...formData,
        id,
        updatedAt: new Date().toISOString(),
        createdAt: policy?.createdAt || new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'policies', id), finalPolicy);
      showToast('Security Policy synchronized.', 'SUCCESS');
      onClose();
    } catch (error) {
      console.error('Policy sync failure:', error);
      showToast('Database synchronization error.', 'ERROR');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!policy?.id) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'policies', policy.id));
      showToast('Policy purged successfully.', 'SUCCESS');
      onClose();
    } catch (error) {
      showToast('Termination protocol failure.', 'ERROR');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }} />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        style={{
          width: '100%', maxWidth: 900, background: 'var(--cotton)', border: '1px solid var(--border)', borderRadius: 24, position: 'relative', zIndex: 1, overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--section-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)' }}>
              <Shield size={18} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '0.02em' }}>{policy?.id ? 'Refine Security Policy' : 'Forge New Security Policy'}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <div style={{ padding: '32px', maxHeight: '75vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Policy Identity</label>
              <input 
                type="text" 
                value={formData.name || ''} 
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '14px 18px', borderRadius: 12, background: 'var(--section-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 15, outline: 'none' }}
                placeholder="e.g., Regional Manager Access"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Strategic Intent</label>
              <input 
                type="text" 
                value={formData.description || ''} 
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={{ width: '100%', padding: '14px 18px', borderRadius: 12, background: 'var(--section-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 15, outline: 'none' }}
                placeholder="Brief description of authorization scope..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40, background: 'rgba(212, 175, 55, 0.05)', borderRadius: 16, border: '1px solid var(--secondary)', padding: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--teal)' }}>TEAM MATE RESTRICTION PROTOCOL</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>When activated, subjects are restricted to viewing only their exclusively assigned Digital Deliverables.</div>
            </div>
            <button
               type="button"
               onClick={() => setFormData({ ...formData, isTeammatePolicy: !formData.isTeammatePolicy })}
               style={{
                 width: 50, height: 28, borderRadius: 14, border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 200ms',
                 background: formData.isTeammatePolicy ? 'var(--teal)' : 'var(--text-dim)'
               }}
            >
               <motion.div
                 layout
                 style={{
                   width: 20, height: 20, borderRadius: '50%', background: formData.isTeammatePolicy ? '#0a0a0f' : 'white',
                   position: 'absolute', top: 4, left: formData.isTeammatePolicy ? 26 : 4
                 }}
               />
            </button>
          </div>

          <div style={{ background: 'var(--section-bg)', borderRadius: 28, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--section-bg)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 13, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase' }}>Module Spectrum</th>
                   {ACTIONS.map(action => (
                    <th key={action.id} style={{ textAlign: 'center', padding: '16px 8px', fontSize: 12, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase' }}>{action.label}</th>
                  ))}
                  <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: 12, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase' }}>Grant All</th>
                </tr>
              </thead>
              <tbody>
                {MODULES.map(mod => (
                  <tr key={mod.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{mod.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{mod.description}</div>
                    </td>
                    {ACTIONS.map(action => {
                      const isActive = !!formData.modules?.[mod.id as keyof GroupPolicy['modules']]?.[action.id as keyof PolicyActions];
                      return (
                        <td key={action.id} style={{ textAlign: 'center', padding: '8px' }}>
                          <button
                            onClick={() => {
                              const modules = { ...formData.modules } as GroupPolicy['modules'];
                              if (!modules[mod.id as keyof GroupPolicy['modules']]) {
                                modules[mod.id as keyof GroupPolicy['modules']] = { view: false, edit: false, delete: false };
                              }
                              modules[mod.id as keyof GroupPolicy['modules']][action.id as keyof PolicyActions] = !isActive;
                              setFormData({ ...formData, modules });
                            }}
                            style={{
                              width: 24, height: 24, borderRadius: 6, border: '1px solid ' + (isActive ? 'var(--teal)' : 'var(--text-dim)'),
                              background: isActive ? 'var(--secondary)' : 'transparent',
                              color: isActive ? 'var(--teal)' : 'var(--text-dim)',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', transition: 'all 200ms'
                            }}
                          >
                            {isActive && <Check size={14} />}
                          </button>
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center', padding: '8px 24px' }}>
                      <button
                        onClick={() => {
                          const modules = { ...formData.modules } as GroupPolicy['modules'];
                          const currentModule = modules[mod.id as keyof GroupPolicy['modules']] || { view: false, edit: false, delete: false };
                          const allActive = Object.values(currentModule).every(v => v === true);
                          
                          modules[mod.id as keyof GroupPolicy['modules']] = {
                            view: !allActive,
                            edit: !allActive,
                            delete: !allActive,
                          };
                          setFormData({ ...formData, modules });
                        }}
                        style={{
                          padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(212, 175, 55, 0.3)',
                          background: 'rgba(212, 175, 55, 0.05)', color: 'var(--teal)',
                          fontSize: 10, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', transition: 'all 200ms'
                        }}
                      >
                        {Object.values(formData.modules?.[mod.id as keyof GroupPolicy['modules']] || {}).every(v => v === true) ? 'Revoke' : 'Select'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--section-bg)' }}>
          {policy?.id ? (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--status-error)', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: isDeleting ? 0.5 : 1 }}
            >
              <Trash2 size={16} />
              Purge Policy
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: 12, background: 'var(--section-bg)', color: 'var(--teal)', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              style={{ padding: '12px 32px', borderRadius: 12, background: 'var(--teal)', color: '#ffffff', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 20px var(--border)' }}
            >
              {isSaving ? <Shield size={18} className="animate-spin" /> : <Save size={18} />}
              Finalize Security Parameters
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
