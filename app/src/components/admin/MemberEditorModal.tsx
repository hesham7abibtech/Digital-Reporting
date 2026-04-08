'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Trash2, User, Mail, Shield, Briefcase, Loader2 } from 'lucide-react';
import { TeamMember } from '@/lib/types';
import { upsertMember, deleteMember } from '@/services/FirebaseService';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';
import EliteConfirmModal from '@/components/shared/EliteConfirmModal';
import { useToast } from '@/components/shared/EliteToast';

interface MemberEditorProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  readOnly?: boolean;
  canDelete?: boolean;
}

export default function MemberEditorModal({ member, isOpen, onClose, readOnly, canDelete }: MemberEditorProps) {
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    name: '',
    email: '',
    department: '',
    role: 'TEAM_MATE'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (member) {
      setFormData(member);
    } else {
      setFormData({
        id: `mem-${Date.now()}`,
        name: '',
        email: '',
        avatar: '',
        role: 'TEAM_MATE',
        department: 'Architecture',
        isOnline: true,
        lastActive: new Date().toISOString()
      });
    }
  }, [member, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await upsertMember(formData as TeamMember);
      showToast('Personnel record synchronized successfully.', 'SUCCESS');
      onClose();
    } catch (error) {
      console.error('Failed to save member:', error);
      setErrorMsg(getFirebaseErrorMessage(error));
      showToast('Synchronization failure. Reference console for logs.', 'ERROR');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    try {
      await deleteMember(member.id);
      showToast('Identity purged from registry.', 'SUCCESS');
      onClose();
    } catch (error) {
      console.error('Failed to delete member:', error);
      setErrorMsg(getFirebaseErrorMessage(error));
      showToast('Purge sequence failed.', 'ERROR');
      throw error; // Rethrow for modal error handling if needed
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '100%', maxWidth: 500, background: '#12121a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Team Personnel Record</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={24} /></button>
        </div>
        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {readOnly && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.1)', display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
              <Shield size={16} color="#D4AF37" />
              <p style={{ fontSize: 13, color: '#D4AF37', margin: 0, fontWeight: 600 }}>READ-ONLY ACCESS: Identity modification restricted.</p>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>Full Name</label>
            <input 
              type="text" 
              value={formData.name ?? ''} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              disabled={readOnly}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: readOnly ? 'rgba(255,255,255,0.4)' : 'white', outline: 'none', cursor: readOnly ? 'not-allowed' : 'text' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>Email Interface</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input 
                type="email" 
                value={formData.email ?? ''} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                disabled={readOnly}
                style={{ width: '100%', padding: '12px 16px 12px 38px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: readOnly ? 'rgba(255,255,255,0.4)' : 'white', outline: 'none', cursor: readOnly ? 'not-allowed' : 'text' }} 
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>Job Title</label>
            <input 
              type="text" 
              value={formData.department ?? ''} 
              onChange={e => setFormData({ ...formData, department: e.target.value })} 
              disabled={readOnly}
              placeholder="e.g. Senior Project Architect"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: readOnly ? 'rgba(255,255,255,0.4)' : 'white', outline: 'none', cursor: readOnly ? 'not-allowed' : 'text' }} 
            />
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
            disabled={!member || !canDelete}
            style={{ 
              color: '#ef4444', background: 'none', border: 'none', 
              cursor: (!member || !canDelete) ? 'not-allowed' : 'pointer',
              opacity: (!member || !canDelete) ? 0.3 : 1
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
                  'Commit Member'
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
        title="Identity Termination"
        message={`Are you sure you want to permanently revoke the credentials for ${member?.name || 'this member'}? This will purge their record from the secure registry.`}
        confirmLabel="Authorize Wipe"
        severity="DANGER"
      />
    </div>
  );
}
