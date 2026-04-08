'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Trash2, Layout, Link as LinkIcon, Info, Loader2, Shield } from 'lucide-react';
import { DashboardNavItem } from '@/lib/types';
import { upsertRegistryItem, deleteRegistryItem } from '@/services/FirebaseService';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';
import EliteConfirmModal from '@/components/shared/EliteConfirmModal';
import { useToast } from '@/components/shared/EliteToast';

interface RegistryEditorProps {
  item: DashboardNavItem | null;
  isOpen: boolean;
  onClose: () => void;
  readOnly?: boolean;
  canDelete?: boolean;
}

export default function RegistryEditorModal({ item, isOpen, onClose, readOnly, canDelete }: RegistryEditorProps) {
  const [formData, setFormData] = useState<Partial<DashboardNavItem>>({
    name: '',
    link: '',
    category: '',
    status: 'LIVE'
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
        link: '',
        icon: 'LayoutDashboard',
        status: 'LIVE',
        category: 'Project Operations'
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
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>Dashboard Name</label>
            <input 
              type="text" 
              value={formData.name ?? ''} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              disabled={readOnly}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: readOnly ? 'rgba(255,255,255,0.4)' : 'white', outline: 'none', cursor: readOnly ? 'not-allowed' : 'text' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>Target URL</label>
            <input 
              type="text" 
              value={formData.link ?? ''} 
              onChange={e => setFormData({ ...formData, link: e.target.value })} 
              disabled={readOnly}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: readOnly ? 'rgba(255,255,255,0.4)' : 'white', outline: 'none', cursor: readOnly ? 'not-allowed' : 'text' }} 
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>Group / Category</label>
              <input 
                type="text" 
                value={formData.category ?? ''} 
                onChange={e => setFormData({ ...formData, category: e.target.value })} 
                disabled={readOnly}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: readOnly ? 'rgba(255,255,255,0.4)' : 'white', outline: 'none', cursor: readOnly ? 'not-allowed' : 'text' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>Access Status</label>
              <select 
                value={formData.status} 
                onChange={e => setFormData({ ...formData, status: e.target.value as any })} 
                disabled={readOnly}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(20,20,30,1)', border: '1px solid rgba(255,255,255,0.06)', color: readOnly ? 'rgba(255,255,255,0.3)' : 'white', outline: 'none', cursor: readOnly ? 'not-allowed' : 'pointer' }}
              >
                {['LIVE', 'UPDATING', 'MAINTENANCE', 'OFFLINE'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

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
