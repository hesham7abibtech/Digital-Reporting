'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Mail, Briefcase, Camera, 
  Save, Loader2, ShieldCheck, CreditCard,
  Building2, Hash, UploadCloud, Eye, Image as ImageIcon
} from 'lucide-react';
import { updateUserProfile, uploadFile } from '@/services/FirebaseService';
import { useToast } from '@/components/shared/EliteToast';
import { usePathname } from 'next/navigation';

interface ProfileInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
}

export default function ProfileInfoModal({ isOpen, onClose, userProfile }: ProfileInfoModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    avatar: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const pathname = usePathname();

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        department: userProfile.department || '',
        avatar: userProfile.avatar || '',
      });
    }
  }, [userProfile, isOpen]);

  const handleImageClick = () => {
    setIsAvatarMenuOpen(!isAvatarMenuOpen);
  };

  const handleChangePhoto = () => {
    setIsAvatarMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleViewPhoto = () => {
    setIsAvatarMenuOpen(false);
    if (!formData.avatar) {
      showToast('No photo available to view.', 'INFO');
      return;
    }
    setIsPreviewOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile?.uid) return;

    if (!file.type.startsWith('image/')) {
      showToast('INVALID FILE: Please select an image file.', 'ERROR');
      return;
    }

    setIsUploading(true);
    try {
      const path = `profiles/${userProfile.uid}/avatar_${Date.now()}`;
      const url = await uploadFile(file, path);
      setFormData(prev => ({ ...prev, avatar: url }));
      showToast('PHOTO UPLOADED: Identity visual synchronized.', 'SUCCESS');
    } catch (error: any) {
      console.error('Upload error:', error);
      showToast(error.message || 'UPLOAD FAILURE: Could not process identity visual.', 'ERROR');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid) return;

    setIsSaving(true);
    try {
      await updateUserProfile(userProfile.uid, formData);
      showToast('IDENTITY UPDATED: Profile changes synchronized with registry.', 'SUCCESS');
      onClose();
    } catch (error) {
      console.error('Profile update error:', error);
      showToast('SYNC FAILURE: Could not update profile information.', 'ERROR');
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px 14px 48px',
    background: 'rgba(0, 63, 73, 0.05)',
    border: '1px solid rgba(0, 63, 73, 0.1)',
    borderRadius: 14,
    color: '#003f49',
    fontSize: 14,
    fontWeight: 500,
    outline: 'none',
    transition: 'all 300ms',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 900,
    color: '#002a30', // Deepest Teal for labels
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    marginBottom: 8,
    display: 'block',
    paddingLeft: 4,
  };

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(isSaving || isUploading) ? undefined : onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0, 63, 73, 0.4)', backdropFilter: 'blur(16px)' }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            style={{
              width: '100%',
              maxWidth: 520,
              background: '#c6e0e0', // Branded Aqua
              borderRadius: 28,
              border: '1px solid rgba(0, 63, 73, 0.2)', // Branded Teal border
              position: 'relative',
              zIndex: 1,
              overflow: 'hidden',
              boxShadow: '0 30px 100px rgba(0,0,0,0.15), 0 0 40px rgba(0, 63, 73, 0.05)'
            }}
          >
            {/* Header */}
            <div style={{ padding: '32px 40px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#002a30', margin: 0, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>Identity Profile</h2>
                <p style={{ fontSize: 13, color: '#003f49', fontWeight: 600, marginTop: 4 }}>Manage your personal project credentials</p>
              </div>
              <button
                onClick={onClose}
                disabled={isSaving || isUploading}
                style={{ 
                  width: 44, height: 44, borderRadius: 14, 
                  background: 'rgba(0, 63, 73, 0.05)', border: '1px solid rgba(0, 63, 73, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  color: 'rgba(0, 63, 73, 0.4)', transition: 'all 200ms'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#003f49'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(0, 63, 73, 0.4)'}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '32px 40px 40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                {/* Profile Header Card */}
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(208, 171, 130, 0.1) 0%, rgba(208, 171, 130, 0.03) 100%)',
                  borderRadius: 28, padding: 20, border: '1px solid rgba(208, 171, 130, 0.15)',
                  display: 'flex', alignItems: 'center', gap: 20
                }}>
                  <div style={{ position: 'relative' }}>
                    <div 
                      onClick={isUploading ? undefined : handleImageClick}
                      style={{ 
                        width: 72, height: 72, borderRadius: 24, overflow: 'hidden', 
                        background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(208, 171, 130, 0.2)',
                        position: 'relative', cursor: isUploading ? 'default' : 'pointer'
                      }}
                    >
                      {formData.avatar ? (
                        <img src={formData.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={32} color="var(--primary)" />
                      )}
                      
                      {isUploading && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 63, 73, 0.3)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Loader2 className="animate-spin" size={24} color="var(--accent)" />
                        </div>
                      )}
                    </div>
                    
                    <div style={{ 
                      position: 'absolute', bottom: -5, right: -5, width: 28, height: 28, 
                      borderRadius: 10, background: '#c6e0e0', border: '2px solid #c6e0e0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}>
                      {isUploading ? <Loader2 className="animate-spin" size={12} /> : <Camera size={14} />}
                    </div>

                    {/* Avatar Menu Dropdown */}
                    <AnimatePresence>
                      {isAvatarMenuOpen && (
                        <>
                          <div 
                            style={{ position: 'fixed', inset: 0, zIndex: 50 }} 
                            onClick={() => setIsAvatarMenuOpen(false)} 
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 5 }}
                            style={{
                              position: 'absolute', top: '110%', left: 0, minWidth: 160,
                              background: '#002a30', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.3)', zIndex: 100, overflow: 'hidden'
                            }}
                          >
                            <button
                              type="button"
                              onClick={handleViewPhoto}
                              style={{ 
                                width: '100%', padding: '10px 14px', border: 'none', background: 'transparent',
                                color: 'white', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
                                cursor: 'pointer', textAlign: 'left'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <Eye size={14} color="var(--accent)" /> View Photo
                            </button>
                            <button
                              type="button"
                              onClick={handleChangePhoto}
                              style={{ 
                                width: '100%', padding: '10px 14px', border: 'none', background: 'transparent',
                                color: 'white', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
                                cursor: 'pointer', textAlign: 'left'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <UploadCloud size={14} color="var(--accent)" /> Change Photo
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }} 
                    accept="image/*"
                  />

                  <div>
                    {pathname?.startsWith('/admin') && (
                      <span style={{ 
                        fontSize: 10, fontWeight: 950, color: 'white', 
                        textTransform: 'uppercase', letterSpacing: '0.15em', 
                        background: 'var(--accent)', padding: '5px 12px', borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(208, 171, 130, 0.3)'
                      }}>
                        {userProfile?.isAdmin ? 'ADMINISTRATIVE CLEARANCE' : 'STAFF MEMBER'}
                      </span>
                    )}
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: '#002a30', marginTop: 10, marginBottom: 2, letterSpacing: '-0.01em' }}>{formData.name || 'Anonymous User'}</h3>
                    <p style={{ fontSize: 13, color: '#003f49', fontWeight: 600, margin: 0, opacity: 0.8 }}>{userProfile?.email}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Name */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Full Display Name</label>
                    <div style={{ position: 'relative' }}>
                      <User size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#003f49', opacity: 0.6 }} />
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. John Doe"
                        style={inputStyle}
                        required
                      />
                    </div>
                  </div>

                  {/* Email (Read-only) */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ ...labelStyle, color: 'rgba(0, 42, 48, 0.6)' }}>Registered Email (Secure Field)</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#00333a' }} />
                      <input 
                        type="email" 
                        value={userProfile?.email} 
                        readOnly 
                        style={{ ...inputStyle, background: 'rgba(0, 63, 73, 0.05)', color: '#003b44', cursor: 'not-allowed', borderStyle: 'solid' }} 
                      />
                    </div>
                  </div>

                  {/* Department */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Department</label>
                    <div style={{ position: 'relative' }}>
                      <Building2 size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#003f49', opacity: 0.6 }} />
                      <input 
                        type="text" 
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                        placeholder="e.g. Engineering"
                        style={inputStyle}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSaving || isUploading}
                    style={{ 
                      flex: 1, padding: '16px', borderRadius: 16, 
                      background: 'rgba(0, 63, 73, 0.05)', color: '#003f49', 
                      border: '1px solid rgba(0, 63, 73, 0.1)', cursor: 'pointer', 
                      fontSize: 14, fontWeight: 700 
                    }}
                  >
                    Abort Changes
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isUploading}
                    style={{ 
                      flex: 1.5, padding: '16px', borderRadius: 16, 
                      background: 'var(--accent)', color: 'var(--primary)', 
                      border: 'none', cursor: 'pointer', 
                      fontSize: 14, fontWeight: 900,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      boxShadow: '0 8px 24px rgba(208, 171, 130, 0.25)'
                    }}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        Authorize Sync
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            <div style={{ 
              padding: '16px 40px', background: 'rgba(0, 42, 48, 0.06)', 
              borderTop: '1px solid rgba(0, 42, 48, 0.1)',
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <ShieldCheck size={14} color="#002a30" />
              <span style={{ fontSize: 11, fontWeight: 900, color: '#002a30', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Verified Identity Data — PRJ-HUB-64</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Lightbox Preview */}
    <AnimatePresence>
      {isPreviewOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsPreviewOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)' }}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            style={{ position: 'relative', zIndex: 1, maxWidth: '90%', maxHeight: '90%' }}
          >
            <img 
              src={formData.avatar} 
              alt="Avatar Full View" 
              style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '80vh', borderRadius: 24, boxShadow: '0 30px 100px rgba(0,0,0,0.8)' }} 
            />
            <button
              onClick={() => setIsPreviewOpen(false)}
              style={{
                position: 'absolute', top: -60, right: 0, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', cursor: 'pointer'
              }}
            >
              <X size={24} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
