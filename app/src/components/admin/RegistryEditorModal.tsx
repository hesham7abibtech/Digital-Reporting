'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Trash2, Layout, Link as LinkIcon, Info, Loader2 } from 'lucide-react';
import { DashboardNavItem } from '@/lib/types';
import { upsertRegistryItem, deleteRegistryItem } from '@/services/FirebaseService';

interface RegistryEditorProps {
  item: DashboardNavItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RegistryEditorModal({ item, isOpen, onClose }: RegistryEditorProps) {
  const [formData, setFormData] = useState<Partial<DashboardNavItem>>({});
  const [isSaving, setIsSaving] = useState(false);

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
    try {
      await upsertRegistryItem(formData as DashboardNavItem);
      onClose();
    } catch (error) {
      console.error('Failed to save registry item:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (confirm('Permanently remove this dashboard from the registry?')) {
      try {
        await deleteRegistryItem(item.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
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
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>Dashboard Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>Target URL</label>
            <input type="text" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', outline: 'none' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>Group / Category</label>
              <input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>Access Status</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: 'rgba(20,20,30,1)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', outline: 'none' }}>
                {['LIVE', 'UPDATING', 'MAINTENANCE', 'OFFLINE'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{ padding: '24px 32px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {item ? <button onClick={handleDelete} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button> : <div />}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', color: 'white', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>Cancel</button>
            <button 
              onClick={handleSave} 
              disabled={isSaving} 
              style={{ 
                padding: '10px 24px', borderRadius: 10, 
                background: isSaving ? 'rgba(59, 130, 246, 0.5)' : '#3b82f6', 
                color: 'white', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', 
                fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  SYNCHING...
                </>
              ) : (
                'Commit Portal'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
