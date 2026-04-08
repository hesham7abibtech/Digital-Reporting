'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Trash2, Mail, Shield, User, Info } from 'lucide-react';
import { UserRole } from '@/lib/types';
import { updateUserProfile, deleteUserProfile } from '@/services/FirebaseService';
import { useAuth } from '@/context/AuthContext';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';
import EliteConfirmModal from '@/components/shared/EliteConfirmModal';
import { useToast } from '@/components/shared/EliteToast';

interface UserEditorProps {
  userRecord: any | null;
  isOpen: boolean;
  onClose: () => void;
}

const roles: UserRole[] = ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'DEPARTMENT_HEAD', 'VIEWER', 'USER'];

export default function UserEditorModal({ userRecord, isOpen, onClose }: UserEditorProps) {
  const { userProfile: currentUser } = useAuth();
  const [formData, setFormData] = useState<any>({
    name: '',
    role: 'VIEWER',
    status: 'ACTIVE'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (userRecord) {
      setFormData(userRecord);
    }
  }, [userRecord, isOpen]);

  const handleSave = async () => {
    if (!userRecord) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await updateUserProfile(userRecord.uid, {
        role: formData.role,
        status: formData.status,
        name: formData.name
      });
      showToast('Security credentials updated.', 'SUCCESS');
      onClose();
    } catch (error) {
      console.error('Failed to update user:', error);
      setErrorMsg(getFirebaseErrorMessage(error));
      showToast('Access control update failure.', 'ERROR');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userRecord) return;
    try {
      await deleteUserProfile(userRecord.uid);
      showToast('User access revoked and purged.', 'SUCCESS');
      onClose();
    } catch (error) {
      console.error('Failed to delete user:', error);
      setErrorMsg(getFirebaseErrorMessage(error));
      showToast('Access revocation failed.', 'ERROR');
      throw error;
    }
  };

  if (!isOpen || !userRecord) return null;

  const isOwner = currentUser?.role === 'OWNER';
  const isEditingSelf = currentUser?.uid === userRecord.uid;
  const targetIsOwner = userRecord.role === 'OWNER';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          width: '100%', maxWidth: 500, background: '#12121a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, position: 'relative', zIndex: 1, overflow: 'hidden'
        }}
      >
        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Terminal Access Control</h2>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>ID: {userRecord.uid.substring(0, 12)}...</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identity Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input 
                type="text" 
                value={formData.name ?? ''} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                style={{ width: '100%', padding: '12px 16px 12px 38px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none' }} 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Authenticated Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input 
                type="text" 
                value={userRecord.email} 
                disabled
                style={{ width: '100%', padding: '12px 16px 12px 38px', borderRadius: 12, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)', fontSize: 14, cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Clearance (Role)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {roles.map(role => {
                const isRoleDisabled = (role === 'OWNER' && !isOwner) || (targetIsOwner && !isOwner && !isEditingSelf);
                return (
                  <button
                    key={role}
                    disabled={isRoleDisabled}
                    onClick={() => setFormData({ ...formData, role: role })}
                    style={{
                      padding: '10px', fontSize: 11, fontWeight: 700, borderRadius: 10,
                      background: formData.role === role ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.02)',
                      color: formData.role === role ? '#D4AF37' : isRoleDisabled ? 'rgba(255,255,255,0.1)' : 'var(--text-secondary)',
                      border: formData.role === role ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(255,255,255,0.04)',
                      cursor: isRoleDisabled ? 'not-allowed' : 'pointer',
                      transition: 'all 200ms',
                      display: 'flex', alignItems: 'center', gap: 6
                    }}
                  >
                    <Shield size={12} />
                    {role.replace(/_/g, ' ')}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Status</label>
            <select 
              value={formData.status || 'ACTIVE'} 
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#1a1a24', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none' }}
            >
              <option value="ACTIVE">ACTIVE - FULL ACCESS</option>
              <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
              <option value="SUSPENDED">SUSPENDED - NO ACCESS</option>
            </select>
          </div>

          {!isOwner && targetIsOwner && (
            <div style={{ padding: '12px 16px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', borderRadius: 12, display: 'flex', gap: 10 }}>
              <Info size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 12, color: '#f59e0b', margin: 0 }}>Only an existing Owner can modify Owner-level credentials.</p>
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
            disabled={isEditingSelf || (targetIsOwner && !isOwner)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', background: 'none', border: 'none', 
              fontSize: 13, fontWeight: 600, cursor: (isEditingSelf || (targetIsOwner && !isOwner)) ? 'not-allowed' : 'pointer',
              opacity: (isEditingSelf || (targetIsOwner && !isOwner)) ? 0.3 : 1
            }}
          >
            <Trash2 size={16} />
            Revoke Access
          </button>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', color: 'white', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Cancel</button>
            <button 
              onClick={handleSave} 
              disabled={isSaving || (targetIsOwner && !isOwner && !isEditingSelf)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 10, 
                background: '#D4AF37', color: '#0a0a0f', border: 'none', 
                cursor: (isSaving || (targetIsOwner && !isOwner && !isEditingSelf)) ? 'not-allowed' : 'pointer',
                opacity: (targetIsOwner && !isOwner && !isEditingSelf) ? 0.5 : 1,
                fontSize: 14, fontWeight: 700 
              }}
            >
              <Save size={18} />
              {isSaving ? 'Syncing...' : 'Commit Changes'}
            </button>
          </div>
        </div>
      </motion.div>

      <EliteConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Access Revocation"
        message={`Authorize the immediate termination of terminal access for ${userRecord.name || userRecord.email}? This will invalidate their security clearance and purge their identity profile.`}
        confirmLabel="Authorize Revocation"
        severity="DANGER"
      />
    </div>
  );
}
