'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Mail, Briefcase, Camera, 
  Save, Loader2, ShieldCheck, CreditCard,
  Building2, Hash, UploadCloud, Eye, Image as ImageIcon, Trash2,
  Plus
} from 'lucide-react';
import Cropper from 'react-easy-crop';
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
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
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

  const handleDeletePhoto = () => {
    setIsAvatarMenuOpen(false);
    setFormData(prev => ({ ...prev, avatar: '' }));
    showToast('Photo removed.', 'INFO');
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file.', 'ERROR');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageToCrop(reader.result?.toString() || null);
    });
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels || !userProfile?.uid) return;

    setIsUploading(true);
    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedBlob) throw new Error('Could not generate cropped image.');

      const file = new File([croppedBlob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const path = `profiles/${userProfile.uid}/avatar_${Date.now()}`;
      const url = await uploadFile(file, path);
      
      setFormData(prev => ({ ...prev, avatar: url }));
      showToast('Photo updated.', 'SUCCESS');
      setImageToCrop(null);
    } catch (error: any) {
      console.error('Upload error:', error);
      showToast('Could not upload photo.', 'ERROR');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid) return;

    setIsSaving(true);
    try {
      await updateUserProfile(userProfile.uid, formData);
      showToast('Profile saved.', 'SUCCESS');
      onClose();
    } catch (error) {
      console.error('Profile update error:', error);
      showToast('Could not save profile.', 'ERROR');
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px 16px 16px 48px',
    background: 'rgba(0, 63, 73, 0.03)',
    border: '1px solid rgba(0, 63, 73, 0.15)',
    borderRadius: 16,
    color: '#003f49',
    fontSize: 15,
    fontWeight: 600,
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
              background: '#FFFFFF', // High contrast white
              borderRadius: 32,
              border: '1px solid rgba(0, 63, 73, 0.25)',
              position: 'relative',
              zIndex: 1,
              overflow: 'hidden',
              boxShadow: '0 40px 120px rgba(0,0,0,0.25), 0 0 50px rgba(0, 63, 73, 0.08)'
            }}
          >
            {/* Branded Header Section */}
            <div style={{ padding: '32px 40px 24px', position: 'relative', background: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(0, 63, 73, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: 12, 
                  padding: '6px 14px', background: 'var(--teal)', borderRadius: 12,
                  border: '1px solid var(--sunlit-rock)', boxShadow: '0 5px 10px rgba(0, 63, 73, 0.08)'
                }}>
                  <img src="/logos/modon_logo.png" alt="MODON" style={{ height: 18, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                  <div style={{ width: 1, height: 12, background: 'rgba(255, 255, 255, 0.2)' }} />
                  <img src="/logos/insite_logo.png" alt="INSITE" style={{ height: 14, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                </div>
                <button
                  onClick={onClose}
                  disabled={isSaving || isUploading}
                  style={{ 
                    width: 36, height: 36, borderRadius: 12, 
                    background: 'rgba(0, 63, 73, 0.05)', border: '1px solid rgba(0, 63, 73, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    color: 'rgba(0, 63, 73, 0.6)', transition: 'all 200ms'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#002a30', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-primary)' }}>Identity Profile</h2>
                <p style={{ fontSize: 12, color: 'rgba(0, 63, 73, 0.7)', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secure Identity Management Terminal</p>
              </div>
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
                      borderRadius: 10, background: '#002a30', border: '2px solid #c6e0e0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                    }}>
                      {isUploading ? <Loader2 className="animate-spin" size={12} /> : <Camera size={14} style={{ filter: 'drop-shadow(0 0 2px rgba(212, 175, 55, 0.5))' }} />}
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
                            {!formData.avatar ? (
                              <button
                                type="button"
                                onClick={handleChangePhoto}
                                style={{ 
                                  width: '100%', padding: '12px 14px', border: 'none', background: 'transparent',
                                  color: 'white', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
                                  cursor: 'pointer', textAlign: 'left'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <Plus size={16} color="var(--accent)" /> Add Profile Picture
                              </button>
                            ) : (
                              <>
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
                                  <UploadCloud size={14} color="#10b981" /> Change Photo
                                </button>
                                <button
                                  type="button"
                                  onClick={handleDeletePhoto}
                                  style={{ 
                                    width: '100%', padding: '10px 14px', border: 'none', background: 'transparent',
                                    color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
                                    cursor: 'pointer', textAlign: 'left', borderTop: '1px solid rgba(255,255,255,0.05)'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  <Trash2 size={14} /> Delete Photo
                                </button>
                              </>
                            )}
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
                    Cancel
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
                        Save Changes
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
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}
          >
            <img 
              src={formData.avatar} 
              alt="Avatar Full View" 
              style={{ 
                width: 'auto', height: 'auto', maxWidth: '85vw', maxHeight: '70vh', 
                borderRadius: 32, border: '4px solid #ffffff',
                boxShadow: '0 30px 100px rgba(0,0,0,0.8)' 
              }} 
            />
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ 
                fontSize: 28, fontWeight: 900, color: '#ffffff', margin: 0, 
                textTransform: 'uppercase', letterSpacing: '0.1em',
                textShadow: '0 4px 20px rgba(0,0,0,0.5)'
              }}>
                {formData.name}
              </h3>
              <div style={{ 
                height: 2, width: 60, background: '#B08D3E', 
                margin: '12px auto 0', borderRadius: 2 
              }} />
              <p style={{ 
                fontSize: 12, color: '#B08D3E', fontWeight: 900, 
                marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.2em'
              }}>
                Authenticated User Profile
              </p>
            </div>
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
    {/* Image Cropper Modal */}
    <AnimatePresence>
      {imageToCrop && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 30000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0, 42, 48, 0.8)', backdropFilter: 'blur(20px)' }}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            style={{
              width: '100%',
              maxWidth: 500,
              background: '#0c0c14',
              borderRadius: 28,
              border: '1px solid rgba(255,255,255,0.1)',
              position: 'relative',
              zIndex: 1,
              overflow: 'hidden',
              boxShadow: '0 40px 120px rgba(0,0,0,0.6)'
            }}
          >
            <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Precision Crop</h3>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Normalize identity visual - 1:1 ratio</p>
              </div>
              <button 
                onClick={() => setImageToCrop(null)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ position: 'relative', width: '100%', height: 350, background: '#000' }}>
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div style={{ padding: '24px 32px' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 900, color: 'white', textTransform: 'uppercase', opacity: 0.5 }}>Zoom Intensity</span>
                  <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--accent)' }}>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <button
                  onClick={() => setImageToCrop(null)}
                  style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                >
                  Discard
                </button>
                <button
                  onClick={handleCropSave}
                  disabled={isUploading}
                  style={{ 
                    flex: 2, padding: '14px', borderRadius: 14, background: 'var(--accent)', color: 'var(--primary)', 
                    border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                  }}
                >
                  {isUploading ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
                  Save Photo
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
