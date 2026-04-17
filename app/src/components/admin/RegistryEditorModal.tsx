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
      showToast('Item saved successfully.', 'SUCCESS');
      onClose();
    } catch (error) {
      console.error('Failed to save registry item:', error);
      setErrorMsg(getFirebaseErrorMessage(error));
      showToast('Could not save item.', 'ERROR');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    try {
      await deleteRegistryItem(item.id);
      showToast('Item deleted successfully.', 'SUCCESS');
      onClose();
    } catch (error) {
      console.error('Failed to delete item:', error);
      setErrorMsg(getFirebaseErrorMessage(error));
      showToast('Could not delete item.', 'ERROR');
      throw error;
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0, 63, 73, 0.3)', backdropFilter: 'blur(12px)' }} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '100%', maxWidth: 500, background: 'var(--cotton)', border: '1px solid var(--border)', borderRadius: 28, position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--teal)', letterSpacing: '-0.02em', margin: 0 }}>Portal Registry Config</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={24} /></button>
        </div>
        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {readOnly && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(212, 175, 55, 0.05)', border: '1px solid var(--secondary)', display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
              <Shield size={16} color="var(--teal)" />
              <p style={{ fontSize: 13, color: 'var(--teal)', margin: 0, fontWeight: 600 }}>READ-ONLY ACCESS: Site registry modifications restricted.</p>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase' }}>File name</label>
            <input 
              type="text" 
              value={formData.name ?? ''} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              disabled={readOnly}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: readOnly ? 'var(--text-muted)' : 'white', outline: 'none', cursor: readOnly ? 'not-allowed' : 'text' }} 
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase' }}>Description</label>
            <textarea 
              value={formData.description ?? ''} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
              disabled={readOnly}
              placeholder="Portal functional overview..."
              style={{ width: '100%', minHeight: 80, padding: '12px 16px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: readOnly ? 'var(--text-muted)' : 'white', outline: 'none', cursor: readOnly ? 'not-allowed' : 'text', resize: 'vertical', fontSize: 13 }} 
            />
          </div>
          {/* Supplemental Links Management */}
          <div style={{ padding: '16px', background: 'var(--section-bg)', borderRadius: 16, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <LinkIcon size={14} /> Supplemental Resources
              </label>
              {!readOnly && (
                <button
                  onClick={() => setFormData({ 
                    ...formData, 
                    links: [...(formData.links || []), { label: '', url: '' }] 
                  })}
                  style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', background: 'var(--secondary)', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}
                >
                  + Add Link
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(formData.links || []).length === 0 ? (
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', margin: '10px 0' }}>No supplemental links configured</p>
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
                      style={{ padding: '8px 10px', fontSize: 12, borderRadius: 8, background: 'var(--section-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
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
                      style={{ padding: '8px 10px', fontSize: 12, borderRadius: 8, background: 'var(--section-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                    {!readOnly && (
                      <button 
                        onClick={() => {
                          const newLinks = formData.links?.filter((_, i) => i !== idx);
                          setFormData({ ...formData, links: newLinks });
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--status-error)', cursor: 'pointer', opacity: 0.6 }}
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
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase' }}>Task Category</label>
              <select 
                value={availableDepartments?.find(d => d.id === formData.department || d.name === formData.department)?.id || ''} 
                onChange={e => setFormData({ ...formData, department: e.target.value })} 
                disabled={readOnly}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(20,20,30,1)', border: '1px solid var(--border)', color: readOnly ? 'var(--text-dim)' : 'white', outline: 'none', cursor: readOnly ? 'not-allowed' : 'pointer' }}
              >
                <option value="">Select Category</option>
                {availableDepartments?.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase' }}>Category</label>
              <select 
                value={formData.category || 'DASHBOARD'} 
                onChange={e => setFormData({ ...formData, category: e.target.value })} 
                disabled={readOnly}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(20,20,30,1)', border: '1px solid var(--border)', color: readOnly ? 'var(--text-dim)' : 'white', outline: 'none', cursor: readOnly ? 'not-allowed' : 'pointer' }}
              >
                <option value="DASHBOARD">Dashboard</option>
                <option value="REPORT">Report</option>
                <option value="OTHER">Other (Manual Input)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase' }}>Status</label>
            <select 
              value={formData.status} 
              onChange={e => setFormData({ ...formData, status: e.target.value as any })} 
              disabled={readOnly}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(20,20,30,1)', border: '1px solid var(--border)', color: readOnly ? 'var(--text-dim)' : 'white', outline: 'none', cursor: readOnly ? 'not-allowed' : 'pointer' }}
            >
              <option value="LIVE">Live</option>
              <option value="HOLD">Hold</option>
              <option value="BLOCKED">Blocked</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>

          {formData.category === 'OTHER' && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase' }}>Custom Category</label>
              <input 
                type="text" 
                value={formData.customCategory ?? ''} 
                onChange={e => setFormData({ ...formData, customCategory: e.target.value })} 
                placeholder="Enter category name..."
                disabled={readOnly}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: readOnly ? 'var(--text-muted)' : 'white', outline: 'none', cursor: readOnly ? 'not-allowed' : 'text' }} 
              />
            </div>
          )}

          {errorMsg && (
            <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
              <X size={16} color="#ef4444" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: 'var(--status-error)', margin: 0, fontWeight: 600 }}>{errorMsg}</p>
            </div>
          )}
        </div>
        <div style={{ padding: '24px 32px', background: 'var(--section-bg)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => setIsConfirmOpen(true)} 
            disabled={!item || !canDelete}
            style={{ 
              color: 'var(--status-error)', background: 'none', border: 'none', 
              cursor: (!item || !canDelete) ? 'not-allowed' : 'pointer',
              opacity: (!item || !canDelete) ? 0.3 : 1
            }}
          >
            <Trash2 size={18} />
          </button>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--section-bg)', color: 'var(--teal)', border: '1px solid var(--border)', cursor: 'pointer' }}>Dismiss</button>
            {!readOnly && (
              <button 
                onClick={handleSave} 
                disabled={isSaving} 
                style={{ 
                  padding: '10px 24px', borderRadius: 10, 
                  background: isSaving ? 'rgba(212, 175, 55, 0.5)' : 'var(--teal)', 
                  color: '#ffffff', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', 
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
