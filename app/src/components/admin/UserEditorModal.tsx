'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Mail, Shield, User, Info, Check, AlertCircle, ShieldCheck, CheckCircle2, UserCheck, Layout, BarChart2, Briefcase, Calendar, Clock } from 'lucide-react';
import { updateUserProfile, deleteUserProfile } from '@/services/FirebaseService';
import { useAuth } from '@/context/AuthContext';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';
import EliteConfirmModal from '@/components/shared/EliteConfirmModal';
import { useToast } from '@/components/shared/EliteToast';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserEditorProps {
  userRecord: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserEditorModal({ userRecord, isOpen, onClose }: UserEditorProps) {
  const { userProfile: currentUser } = useAuth();
  const [formData, setFormData] = useState<any>({
    name: '',
    role: 'TEAM_MATE',
    status: 'ACTIVE',
    isVerified: false,
    isApproved: false,
    isAdmin: false,
    access: {
      deliverablesRegistry: false,
      bimReviews: false
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { showToast } = useToast();
  
  const [policiesSnapshot] = useCollection(
    query(collection(db, 'policies'), orderBy('name', 'asc'))
  );
  const policies = policiesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || [];

  useEffect(() => {
    if (userRecord) {
      setFormData({
        ...userRecord,
        department: userRecord.department || '',
        isVerified: userRecord.isVerified || false,
        isApproved: userRecord.isApproved || false,
        isAdmin: userRecord.isAdmin || userRecord.role === 'ADMIN' || userRecord.role === 'OWNER',
        access: {
          deliverablesRegistry: userRecord.access?.deliverablesRegistry || false,
          bimReviews: userRecord.access?.bimReviews || false,
          ...(userRecord.access || {})
        }
      });
    }
  }, [userRecord, isOpen]);

  const handleSave = async () => {
    if (!userRecord) return;
    
    if (formData.isAdmin && !formData.policyId) {
      setErrorMsg("CLEARANCE OBLIGATION: Elevated Admin accounts must be strictly bound to a Group Policy.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      await updateUserProfile(userRecord.uid, {
        role: userRecord.role === 'OWNER' ? 'OWNER' : (formData.isAdmin ? 'ADMIN' : 'TEAM_MATE'),
        status: formData.status,
        name: formData.name,
        department: formData.department,
        isVerified: formData.isVerified,
        isApproved: formData.isApproved,
        isAdmin: formData.isAdmin,
        access: formData.access,
        policyId: formData.isAdmin ? formData.policyId : null,
        updatedAt: new Date().toISOString()
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
  const targetIsOwner = (userRecord as any).role === 'OWNER';

  const toggleFlag = (field: string) => {
    if (!isOwner && field === 'isAdmin') return;
    setFormData((prev: any) => {
      const newVal = !prev[field];
      const update: any = { [field]: newVal };
      if (field === 'isAdmin' && !newVal) update.policyId = null;
      if (field === 'isApproved') update.status = newVal ? 'ACTIVE' : 'PENDING_APPROVAL';
      return { ...prev, ...update };
    });
  };

  const toggleAccess = (module: string) => {
    setFormData((prev: any) => ({
      ...prev,
      access: {
        ...prev.access,
        [module]: !prev.access[module]
      }
    }));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Premium Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        style={{ position: 'absolute', inset: 0, background: 'rgba(0, 63, 73, 0.3)', backdropFilter: 'blur(12px)' }} 
      />
      
      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          width: '100%', maxWidth: 900, background: 'var(--cotton)', border: '1px solid var(--border)', borderRadius: 28, position: 'relative', zIndex: 1, overflow: 'hidden'
        }}
      >
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--teal)', letterSpacing: '0.01em' }}>TERMINAL ACCESS CONTROL</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>ID: {userRecord.uid.substring(0, 16)}...</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        {/* 2-COLUMN GRID FORM */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 32, padding: 32, maxHeight: '70vh', overflowY: 'auto' }}>
          
          {/* LEFT COLUMN: IDENTITY & SECURITY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Identity Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--teal)', opacity: 0.6 }} />
                <input 
                  type="text" 
                  value={formData.name ?? ''} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 16, background: 'var(--section-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontWeight: 600 }} 
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Authenticated Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input 
                  type="text" 
                  value={userRecord.email} 
                  disabled
                  style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 16, background: 'var(--section-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 14, cursor: 'not-allowed', fontWeight: 600 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Job Title / Designation</label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--teal)', opacity: 0.6 }} />
                <input 
                  type="text" 
                  value={formData.department ?? ''} 
                  onChange={e => setFormData({ ...formData, department: e.target.value })} 
                  style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 16, background: 'var(--section-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontWeight: 600 }} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 16px', borderRadius: 16, background: 'var(--section-bg)', border: '1px solid var(--border)' }}>
               <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Calendar size={10} color="var(--text-dim)" />
                    <span style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Profile Initialized</span>
                  </div>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 800 }}>{userRecord.createdAt ? new Date(userRecord.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
               </div>
               <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Clock size={10} color="var(--text-dim)" />
                    <span style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Last Authentication</span>
                  </div>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 800 }}>{userRecord.lastLoginAt ? new Date(userRecord.lastLoginAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <button
                onClick={() => toggleFlag('isVerified')}
                style={{
                  padding: '16px 8px', borderRadius: 16, background: formData.isVerified ? 'rgba(12, 169, 155, 0.08)' : 'var(--section-bg)',
                  border: `1px solid ${formData.isVerified ? 'var(--teal)' : 'var(--border)'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 300ms'
                }}
              >
                <UserCheck size={18} color={formData.isVerified ? 'var(--teal)' : 'var(--text-dim)'} />
                <span style={{ fontSize: 9, fontWeight: 900, color: formData.isVerified ? 'var(--teal)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified</span>
              </button>

              <button
                onClick={() => toggleFlag('isApproved')}
                style={{
                  padding: '16px 8px', borderRadius: 16, background: formData.isApproved ? 'rgba(12, 169, 155, 0.08)' : 'var(--section-bg)',
                  border: `1px solid ${formData.isApproved ? 'var(--teal)' : 'var(--border)'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 300ms'
                }}
              >
                <CheckCircle2 size={18} color={formData.isApproved ? 'var(--teal)' : 'var(--text-dim)'} />
                <span style={{ fontSize: 9, fontWeight: 900, color: formData.isApproved ? 'var(--teal)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved</span>
              </button>

              <button
                onClick={() => toggleFlag('isAdmin')}
                disabled={!isOwner}
                style={{
                  padding: '16px 8px', borderRadius: 16, background: formData.isAdmin ? 'rgba(0, 63, 73, 0.1)' : 'var(--section-bg)',
                  border: `1px solid ${formData.isAdmin ? 'var(--teal)' : 'var(--border)'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: isOwner ? 'pointer' : 'not-allowed', transition: 'all 300ms',
                  opacity: isOwner ? 1 : 0.5
                }}
              >
                <ShieldCheck size={18} color={formData.isAdmin ? 'var(--teal)' : 'var(--text-dim)'} />
                <span style={{ fontSize: 9, fontWeight: 900, color: formData.isAdmin ? 'var(--teal)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin</span>
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Access Status</label>
              <select 
                value={formData.status || 'ACTIVE'} 
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                style={{ width: '100%', padding: '14px 16px', borderRadius: 16, background: 'var(--section-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                <option value="ACTIVE">ACTIVE - FULL ACCESS</option>
                <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
                <option value="SUSPENDED">SUSPENDED - NO ACCESS</option>
              </select>
            </div>
          </div>

          {/* RIGHT COLUMN: MODULE ACCESS & POLICIES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: 'var(--teal)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Reports & Module Access</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* DELIVERABLES TOGGLE */}
                <button
                  onClick={() => toggleAccess('deliverablesRegistry')}
                  style={{
                    padding: '16px', borderRadius: 16, background: formData.access.deliverablesRegistry ? 'rgba(12, 169, 155, 0.08)' : 'var(--section-bg)',
                    border: `1px solid ${formData.access.deliverablesRegistry ? 'var(--teal)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 300ms'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Layout size={18} color={formData.access.deliverablesRegistry ? 'var(--teal)' : 'var(--text-dim)'} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: formData.access.deliverablesRegistry ? 'var(--teal)' : 'var(--text-primary)' }}>DELIVERABLES REGISTRY</div>
                      <div style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 500 }}>SUBMISSIONS & TRACKING ACCESS</div>
                    </div>
                  </div>
                  {formData.access.deliverablesRegistry && <Check size={14} color="var(--teal)" />}
                </button>

                {/* BIM REVIEWS TOGGLE */}
                <button
                  onClick={() => toggleAccess('bimReviews')}
                  style={{
                    padding: '16px', borderRadius: 16, background: formData.access.bimReviews ? 'rgba(12, 169, 155, 0.08)' : 'var(--section-bg)',
                    border: `1px solid ${formData.access.bimReviews ? 'var(--teal)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 300ms'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <BarChart2 size={18} color={formData.access.bimReviews ? 'var(--teal)' : 'var(--text-dim)'} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: formData.access.bimReviews ? 'var(--teal)' : 'var(--text-primary)' }}>BIM INTELLIGENCE REVIEWS</div>
                      <div style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 500 }}>MATRIX & ANALYTICS ACCESS</div>
                    </div>
                  </div>
                  {formData.access.bimReviews && <Check size={14} color="var(--teal)" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {formData.isAdmin && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                     Strict Group Policy Assignment <span style={{ color: 'var(--status-error)' }}>* REQUIRED</span>
                  </label>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: -6, marginBottom: 4, lineHeight: 1.5, fontWeight: 500 }}>
                     Administrative accounts cannot elevate without an active policy mapping. Select a clearance tier below.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 250, overflowY: 'auto', paddingRight: 4, padding: 4 }}>
                    {policies.map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => setFormData({ ...formData, policyId: p.id })}
                        style={{
                          padding: '16px 20px', borderRadius: 16, background: formData.policyId === p.id ? 'var(--teal)' : 'var(--section-bg)',
                          border: `2px solid ${formData.policyId === p.id ? 'var(--teal)' : 'var(--border)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 200ms',
                          boxShadow: formData.policyId === p.id ? '0 10px 30px rgba(0, 63, 73, 0.2)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Shield size={18} color={formData.policyId === p.id ? 'var(--cotton)' : 'var(--text-dim)'} opacity={formData.policyId === p.id ? 1 : 0.6} />
                          <div style={{ fontVariant: 'small-caps', fontWeight: 900, fontSize: 14, color: formData.policyId === p.id ? 'var(--cotton)' : 'var(--text-primary)', letterSpacing: '0.05em' }}>{p.name}</div>
                        </div>
                        {formData.policyId === p.id && <Check size={18} color="var(--cotton)" strokeWidth={3} />}
                      </button>
                    ))}
                    {policies.length === 0 && (
                      <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 16 }}>
                        <p style={{ fontSize: 12, color: 'var(--status-error)', margin: 0, fontWeight: 700, lineHeight: 1.5 }}>
                          FATAL ERROR: No policies established in the registry. You must forge a policy before elevating any accounts.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ERROR MESSAGE (FULL WIDTH) */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ padding: '0 32px 24px', overflow: 'hidden' }}
            >
              <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                <X size={18} color="var(--status-error)" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: 'var(--status-error)', margin: 0, fontWeight: 600 }}>{errorMsg}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FOOTER ACTIONS */}
        <div style={{ padding: '24px 32px', background: 'var(--section-bg)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => setIsConfirmOpen(true)} 
            disabled={isEditingSelf || (targetIsOwner && !isOwner)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, color: 'var(--status-error)', background: 'none', border: 'none', 
              fontSize: 13, fontWeight: 600, cursor: (isEditingSelf || (targetIsOwner && !isOwner)) ? 'not-allowed' : 'pointer',
              opacity: (isEditingSelf || (targetIsOwner && !isOwner)) ? 0.3 : 1
            }}
          >
            <Trash2 size={16} />
            Revoke Access
          </button>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: 12, background: 'var(--cotton)', color: 'var(--teal)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Cancel</button>
            <button 
              onClick={handleSave} 
              disabled={isSaving || (targetIsOwner && !isOwner && !isEditingSelf)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 32px', borderRadius: 12, 
                background: 'var(--teal)', color: 'var(--cotton)', border: 'none', 
                cursor: (isSaving || (targetIsOwner && !isOwner && !isEditingSelf)) ? 'not-allowed' : 'pointer',
                opacity: (targetIsOwner && !isOwner && !isEditingSelf) ? 0.5 : 1,
                fontSize: 14, fontWeight: 900,
                boxShadow: '0 10px 20px rgba(0, 63, 73, 0.15)'
              }}
            >
              {isSaving ? <Check size={18} className="animate-pulse" /> : <Save size={18} />}
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
