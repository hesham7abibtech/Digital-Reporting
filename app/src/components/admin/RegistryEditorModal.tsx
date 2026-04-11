'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Trash2, Layout, Link as LinkIcon, Info, Loader2, Shield } from 'lucide-react';
import { DashboardNavItem } from '@/lib/types';
import { upsertRegistryItem, deleteRegistryItem } from '@/services/FirebaseService';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';
import EliteConfirmModal from '@/components/shared/EliteConfirmModal';
import { useToast } from '@/components/shared/EliteToast';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Department } from '@/lib/types';

interface RegistryEditorProps {
  item: DashboardNavItem | null;
  isOpen: boolean;
  onClose: () => void;
  readOnly?: boolean;
  canDelete?: boolean;
  departments?: Department[];
}

export default function RegistryEditorModal({ item, isOpen, onClose, readOnly, canDelete, departments: propsDepts }: RegistryEditorProps) {
  const [deptsSnapshot] = useCollection(query(collection(db, 'departments'), orderBy('name', 'asc')));
  const availableDepartments = useMemo(() => 
    propsDepts || deptsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() } as Department)) || [], 
  [propsDepts, deptsSnapshot]);

  const [formData, setFormData] = useState<Partial<DashboardNavItem>>({
    name: '',
    category: 'DASHBOARD',
    status: 'LIVE',
    links: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        id: `reg-${Date.now()}`,
        name: '',
        icon: 'LayoutDashboard',
        status: 'LIVE',
        category: 'DASHBOARD',
        department: '',
        links: []
      });
    }
  }, [item, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await upsertRegistryItem(formData as DashboardNavItem);
      showToast('Registry asset synchronized.', 'SUCCESS');
      onClose();
    } catch (error) {
      console.error('Failed to save registry item:', error);
      setErrorMsg(getFirebaseErrorMessage(error));
      showToast('Registry synchronization failure.', 'ERROR');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    try {
      await deleteRegistryItem(item.id);
      showToast('Asset purged from portal registry.', 'SUCCESS');
      onClose();
    } catch (error) {
      console.error('Failed to delete item:', error);
      setErrorMsg(getFirebaseErrorMessage(error));
      showToast('Registry purge sequence failed.', 'ERROR');
      throw error;
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '100%', maxWidth: 500, background: '#12121a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Portal Registry Config</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={24} /></button>
        </div>
        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {readOnly && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.1)', display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
              <Shield size={16} color="#D4AF37" />
              <p style={{ fontSize: 13, color: '#D4AF37', margin: 0, fontWeight: 600 }}>READ-ONLY ACCESS: Site registry modifications restricted.</p>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>File name</label>
            <input 
              type="text" 
              value={formData.name ?? ''} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              disabled={readOnly}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: readOnly ? 'rgba(255,255,255,0.4)' : 'white', outline: 'none', cursor: readOnly ? 'not-allowed' : 'text' }} 
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>Description</label>
            <textarea 
              value={formData.description ?? ''} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
              disabled={readOnly}
              placeholder="Portal functional overview..."
              style={{ width: '100%', minHeight: 80, padding: '12px 16px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: readOnly ? 'rgba(255,255,255,0.4)' : 'white', outline: 'none', cursor: readOnly ? 'not-allowed' : 'text', resize: 'vertical', fontSize: 13 }} 
            />
          </div>
          {/* Supplemental Links Management */}
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <LinkIcon size={14} /> Supplemental Resources
              </label>
              {!readOnly && (
                <button
                  onClick={() => setFormData({ 
                    ...formData, 
                    links: [...(formData.links || []), { label: '', url: '' }] 
                  })}
                  style={{ fontSize: 11, fontWeight: 700, color: '#D4AF37', background: 'rgba(212, 175, 55, 0.1)', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}
                >
                  + Add Link
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(formData.links || []).length === 0 ? (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', margin: '10px 0' }}>No supplemental links configured</p>
              ) : (
                formData.links?.map((link, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8, alignItems: 'center' }}>
                    <input 
                      type="text" 
                      placeholder="Label" 
                      value={link.label} 
                      onChange={e => {
                        const newLinks = [...(formData.links || [])];
                        newLinks[idx].label = e.target.value;
                        setFormData({ ...formData, links: newLinks });
                      }}
                      disabled={readOnly}
                      style={{ padding: '8px 10px', fontSize: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white' }}
                    />
                    <input 
                      type="text" 
                      placeholder="URL (https://...)" 
                      value={link.url} 
                      onChange={e => {
                        const newLinks = [...(formData.links || [])];
                        newLinks[idx].url = e.target.value;
                        setFormData({ ...formData, links: newLinks });
                      }}
                      disabled={readOnly}
                      style={{ padding: '8px 10px', fontSize: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white' }}
                    />
                    {!readOnly && (
                      <button 
                        onClick={() => {
                          const newLinks = formData.links?.filter((_, i) => i !== idx);
                          setFormData({ ...formData, links: newLinks });
                        }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>Task Category</label>
              <select 
                value={formData.department || ''} 
                onChange={e => setFormData({ ...formData, department: e.target.value })} 
                disabled={readOnly}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(20,20,30,1)', border: '1px solid rgba(255,255,255,0.06)', color: readOnly ? 'rgba(255,255,255,0.3)' : 'white', outline: 'none', cursor: readOnly ? 'not-allowed' : 'pointer' }}
              >
                <option value="">Select Category</option>
                {availableDepartments?.map(dept => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>Category</label>
              <select 
                value={formData.category || 'DASHBOARD'} 
                onChange={e => setFormData({ ...formData, category: e.target.value })} 
                disabled={readOnly}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(20,20,30,1)', border: '1px solid rgba(255,255,255,0.06)', color: readOnly ? 'rgba(255,255,255,0.3)' : 'white', outline: 'none', cursor: readOnly ? 'not-allowed' : 'pointer' }}
              >
                <option value="DASHBOARD">Dashboard</option>
                <option value="REPORT">Report</option>
                <option value="OTHER">Other (Manual Input)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>Status</label>
            <select 
              value={formData.status} 
              onChange={e => setFormData({ ...formData, status: e.target.value as any })} 
              disabled={readOnly}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(20,20,30,1)', border: '1px solid rgba(255,255,255,0.06)', color: readOnly ? 'rgba(255,255,255,0.3)' : 'white', outline: 'none', cursor: readOnly ? 'not-allowed' : 'pointer' }}
            >
              <option value="LIVE">Live</option>
              <option value="HOLD">Hold</option>
              <option value="BLOCKED">Blocked</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>

          {formData.category === 'OTHER' && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>Custom Category</label>
              <input 
                type="text" 
                value={formData.customCategory ?? ''} 
                onChange={e => setFormData({ ...formData, customCategory: e.target.value })} 
                placeholder="Enter category name..."
                disabled={readOnly}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: readOnly ? 'rgba(255,255,255,0.4)' : 'white', outline: 'none', cursor: readOnly ? 'not-allowed' : 'text' }} 
              />
            </div>
          )}

          {errorMsg && (
            <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
              <X size={16} color="#ef4444" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#f87171', margin: 0, fontWeight: 600 }}>{errorMsg}</p>
            </div>
          )}
        </div>
        <div style={{ padding: '24px 32px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => setIsConfirmOpen(true)} 
            disabled={!item || !canDelete}
            style={{ 
              color: '#ef4444', background: 'none', border: 'none', 
              cursor: (!item || !canDelete) ? 'not-allowed' : 'pointer',
              opacity: (!item || !canDelete) ? 0.3 : 1
            }}
          >
            <Trash2 size={18} />
          </button>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', color: 'white', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>Dismiss</button>
            {!readOnly && (
              <button 
                onClick={handleSave} 
                disabled={isSaving} 
                style={{ 
                  padding: '10px 24px', borderRadius: 10, 
                  background: isSaving ? 'rgba(212, 175, 55, 0.5)' : '#D4AF37', 
                  color: '#0a0a0f', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', 
                  fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    SYNCING...
                  </>
                ) : (
                  'Commit Portal'
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <EliteConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Registry Purge"
        message={`Permanently remove the ${item?.name || 'this portal'} from the administrative registry? Access to this specific dashboard link will be revoked.`}
        confirmLabel="Authorize Wipe"
        severity="DANGER"
      />
    </div>
  );
}
