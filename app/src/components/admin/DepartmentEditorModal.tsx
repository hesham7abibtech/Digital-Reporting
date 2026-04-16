'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Trash2, Building2, Tag, Loader2 } from 'lucide-react';
import { Department } from '@/lib/types';
import { upsertDepartment, deleteDepartment } from '@/services/FirebaseService';
import { useToast } from '@/components/shared/EliteToast';
import EliteConfirmModal from '@/components/shared/EliteConfirmModal';

interface DepartmentEditorProps {
  department: Department | null;
  isOpen: boolean;
  onClose: () => void;
  canDelete?: boolean;
}

export default function DepartmentEditorModal({ department, isOpen, onClose, canDelete }: DepartmentEditorProps) {
  const [formData, setFormData] = useState<Partial<Department>>({
    name: '',
    abbreviation: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (department) {
      setFormData(department);
    } else {
      setFormData({
        id: `new-dept-${Date.now()}`,
        name: '',
        abbreviation: ''
      });
    }
  }, [department, isOpen]);

  const handleSave = async () => {
    if (!formData.name || !formData.abbreviation) {
      showToast('Validation Error: Name and Abbreviation are mandatory.', 'ERROR');
      return;
    }

    setIsSaving(true);
    try {
      await upsertDepartment({
        id: formData.id!,
        name: formData.name,
        abbreviation: formData.abbreviation.toUpperCase().trim()
      });
      showToast('Operational category synchronized.', 'SUCCESS');
      onClose();
    } catch (error) {
      console.error('Failed to save category:', error);
      showToast('Category synchronization failure.', 'ERROR');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!department) return;
    try {
      await deleteDepartment(department.id);
      showToast('Category purged from production protocols.', 'SUCCESS');
      onClose();
    } catch (error) {
      console.error('Failed to delete category:', error);
      showToast('Purge sequence failed.', 'ERROR');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0, 63, 73, 0.3)', backdropFilter: 'blur(12px)' }} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '100%', maxWidth: 450, background: 'var(--cotton)', border: '1px solid var(--border)', borderRadius: 28, position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--teal)', letterSpacing: '-0.02em', margin: 0 }}>Category Registry Entry</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Category Name</label>
            <div style={{ position: 'relative' }}>
              <Building2 size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(212, 175, 55, 0.4)' }} />
              <input 
                type="text" 
                value={formData.name || ''} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                placeholder="e.g. Building Information Modeling"
                style={{ width: '100%', padding: '14px 16px 14px 42px', borderRadius: 12, background: 'var(--section-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontSize: 14 }} 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Protocol Abbreviation</label>
            <div style={{ position: 'relative' }}>
              <Tag size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(212, 175, 55, 0.4)' }} />
              <input 
                type="text" 
                value={formData.abbreviation || ''} 
                onChange={e => setFormData({ ...formData, abbreviation: e.target.value })} 
                placeholder="e.g. BIM"
                maxLength={4}
                style={{ width: '100%', padding: '14px 16px 14px 42px', borderRadius: 12, background: 'var(--section-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontSize: 14, fontWeight: 800, letterSpacing: '0.1em' }} 
              />
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 8 }}>Used for generating automated Task IDs (e.g., REH-BIM-123)</p>
          </div>
        </div>

        <div style={{ padding: '24px 32px', background: 'var(--section-bg)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => setIsConfirmOpen(true)} 
            disabled={!department || !canDelete}
            style={{ 
              color: 'var(--status-error)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', 
              padding: 10, borderRadius: 10, cursor: (!department || !canDelete) ? 'not-allowed' : 'pointer',
              opacity: (!department || !canDelete) ? 0.3 : 1
            }}
          >
            <Trash2 size={18} />
          </button>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--section-bg)', color: 'var(--teal)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Discard</button>
            <button 
              onClick={handleSave} 
              disabled={isSaving} 
              style={{ 
                padding: '10px 24px', borderRadius: 10, 
                background: isSaving ? 'rgba(212, 175, 55, 0.5)' : 'var(--teal)', 
                color: '#ffffff', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', 
                fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, letterSpacing: '0.05em' 
              }}
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              SYNC CATEGORY
            </button>
          </div>
        </div>
      </motion.div>

      <EliteConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Category Purge Sequence"
        message={`Are you sure you want to permanently delete the ${department?.name} category? This may affect records linked to this operational vector.`}
        confirmLabel="Authorize Deletion"
        severity="DANGER"
      />
    </div>
  );
}
