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
          width: '100%', maxWidth: 900, background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, position: 'relative', zIndex: 1, overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
              <Shield size={18} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '0.02em' }}>{policy?.id ? 'Refine Security Policy' : 'Forge New Security Policy'}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <div style={{ padding: '32px', maxHeight: '75vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: '#D4AF37', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Policy Identity</label>
              <input 
                type="text" 
                value={formData.name || ''} 
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 15, outline: 'none' }}
                placeholder="e.g., Regional Manager Access"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: '#D4AF37', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Strategic Intent</label>
              <input 
                type="text" 
                value={formData.description || ''} 
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={{ width: '100%', padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 15, outline: 'none' }}
                placeholder="Brief description of authorization scope..."
              />
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.01)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.03)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: 13, fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase' }}>Module Spectrum</th>
                   {ACTIONS.map(action => (
                    <th key={action.id} style={{ textAlign: 'center', padding: '16px 8px', fontSize: 12, fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase' }}>{action.label}</th>
                  ))}
                  <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: 12, fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase' }}>Grant All</th>
                </tr>
              </thead>
              <tbody>
                {MODULES.map(mod => (
                  <tr key={mod.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{mod.label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{mod.description}</div>
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
                              width: 24, height: 24, borderRadius: 6, border: '1px solid ' + (isActive ? '#D4AF37' : 'rgba(255,255,255,0.1)'),
                              background: isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                              color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.1)',
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
                          background: 'rgba(212, 175, 55, 0.05)', color: '#D4AF37',
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

        <div style={{ padding: '24px 32px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)' }}>
          {policy?.id ? (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: isDeleting ? 0.5 : 1 }}
            >
              <Trash2 size={16} />
              Purge Policy
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              style={{ padding: '12px 32px', borderRadius: 12, background: '#D4AF37', color: '#0a0a0f', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 20px rgba(212, 175, 55, 0.2)' }}
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
