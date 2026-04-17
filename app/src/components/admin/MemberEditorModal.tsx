'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Trash2, User, Mail, Shield, Briefcase, Loader2, Camera, Upload } from 'lucide-react';
import { TeamMember } from '@/lib/types';
import { updateUserProfile, deleteUserProfile, uploadFile } from '@/services/FirebaseService';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';
import EliteConfirmModal from '@/components/shared/EliteConfirmModal';
import { useToast } from '@/components/shared/EliteToast';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { collections } from '@/services/FirebaseService';

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
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { showToast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uid = (formData as any).uid || formData.id || `temp-${Date.now()}`;
      const url = await uploadFile(file, `avatars/${uid}`);
      setFormData(prev => ({ ...prev, avatar: url }));
      showToast('Member updated successfully.', 'SUCCESS');
    } catch (err) {
      console.error('Upload failed:', err);
      showToast('Could not update member.', 'ERROR');
    } finally {
      setIsUploading(false);
    }
  };
  
  const [deptsSnapshot] = useCollection(query(collection(db, 'departments'), orderBy('name', 'asc')));
  const departments = deptsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() } as any)) || [];

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
        department: '',
        status: 'ACTIVE',
        isOnline: true,
        lastActive: new Date().toISOString()
      });
    }
  }, [member, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      if (!formData.id && !(formData as any).uid) throw new Error('No Identity Component Provided');
      const uid = (formData as any).uid || formData.id;
      
      const memberRef = doc(collections.members, uid);
      await setDoc(memberRef, {
        name: formData.name || '',
        email: formData.email || '',
        department: formData.department || '',
        role: formData.role || 'TEAM_MATE',
        status: formData.status || 'ACTIVE',
        avatar: formData.avatar || '',
        isOnline: formData.isOnline ?? true,
        lastActive: formData.lastActive ?? new Date().toISOString()
      }, { merge: true });

      showToast('Member saved successfully.', 'SUCCESS');
      onClose();
    } catch (error) {
      console.error('Failed to save member:', error);
      setErrorMsg(getFirebaseErrorMessage(error));
      showToast('Could not save member.', 'ERROR');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    try {
      const uid = (member as any).uid || member.id;
      await deleteDoc(doc(collections.members, uid));
      showToast('Member removed successfully.', 'SUCCESS');
      onClose();
    } catch (error) {
      console.error('Failed to revoke member:', error);
      setErrorMsg(getFirebaseErrorMessage(error));
      showToast('Could not remove member.', 'ERROR');
      throw error;
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0, 63, 73, 0.3)', backdropFilter: 'blur(12px)' }} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '100%', maxWidth: 500, background: 'var(--cotton)', border: '1px solid var(--border)', borderRadius: 28, position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--teal)', letterSpacing: '-0.02em', margin: 0 }}>Team Personnel Record</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={24} /></button>
        </div>
        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {readOnly && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(212, 175, 55, 0.05)', border: '1px solid var(--secondary)', display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
              <Shield size={16} color="var(--teal)" />
              <p style={{ fontSize: 13, color: 'var(--teal)', margin: 0, fontWeight: 600 }}>READ-ONLY ACCESS: Identity modification restricted.</p>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase' }}>Full Name</label>
            <input 
              type="text" 
              value={formData.name ?? ''} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              disabled={readOnly}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: readOnly ? 'var(--text-muted)' : '#003F49', outline: 'none', cursor: readOnly ? 'not-allowed' : 'text', fontWeight: 600 }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase' }}>Email Interface</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input 
                type="email" 
                value={formData.email ?? ''} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                disabled={readOnly}
                style={{ width: '100%', padding: '12px 16px 12px 38px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: readOnly ? 'var(--text-muted)' : '#003F49', outline: 'none', cursor: readOnly ? 'not-allowed' : 'text', fontWeight: 600 }} 
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase' }}>TASK CATEGORIES</label>
            <select 
              value={departments.find(d => d.id === formData.department || d.name === formData.department)?.id || ''} 
              onChange={e => setFormData({ ...formData, department: e.target.value })} 
              disabled={readOnly}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: readOnly ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: readOnly ? 'var(--text-muted)' : '#003F49', outline: 'none', cursor: readOnly ? 'not-allowed' : 'pointer', fontWeight: 600 }}
            >
              <option value="" disabled>Select Task Category</option>
              {departments.length > 0 ? (
                departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))
              ) : (
                <option value="" disabled>No categories available</option>
              )}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--teal)', marginBottom: 12, textTransform: 'uppercase' }}>Identity Asset (Avatar)</label>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ 
                width: 64, height: 64, borderRadius: 16, 
                background: 'rgba(0, 63, 73, 0.05)', 
                border: '2.5px solid var(--border)', 
                overflow: 'hidden', flexShrink: 0,
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {isUploading ? (
                  <Loader2 size={24} className="animate-spin" color="var(--teal)" />
                ) : formData.avatar ? (
                  <img src={formData.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)', fontWeight: 950, fontSize: 24, background: 'rgba(0, 63, 73, 0.08)' }}>
                    {(formData.name || 'P')[0].toUpperCase()}
                  </div>
                )}
              </div>
              
              {!readOnly && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label 
                    style={{ 
                      padding: '10px 16px', borderRadius: 10, 
                      background: 'var(--teal)', color: 'white', 
                      fontSize: 12, fontWeight: 800, cursor: isUploading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8,
                      opacity: isUploading ? 0.7 : 1,
                      transition: 'all 200ms'
                    }}
                  >
                    <Upload size={14} />
                    {isUploading ? 'Uploading...' : 'Upload Photo'}
                    <input type="file" accept="image/*" onChange={handleFileUpload} disabled={isUploading} style={{ display: 'none' }} />
                  </label>
                  <p style={{ fontSize: 10, color: 'var(--text-dim)', margin: 0, fontWeight: 600 }}>Recommended: Square JPG or PNG (Max 2MB)</p>
                </div>
              )}
            </div>
          </div>

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
            disabled={!member || !canDelete}
            style={{ 
              color: 'var(--status-error)', background: 'none', border: 'none', 
              cursor: (!member || !canDelete) ? 'not-allowed' : 'pointer',
              opacity: (!member || !canDelete) ? 0.3 : 1
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
