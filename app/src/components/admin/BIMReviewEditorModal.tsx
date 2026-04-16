'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Shield, Info, Link as LinkIcon, Calendar, Hash, User, Building2, Layers, Tag as TagIcon } from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import { BIMReview } from '@/lib/types';
import { upsertBimReview } from '@/services/FirebaseService';

interface BIMReviewEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: BIMReview | null;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  readOnly?: boolean;
}

export default function BIMReviewEditorModal({ isOpen, onClose, review, onSuccess, onError, readOnly }: BIMReviewEditorModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<BIMReview>>({
    submissionDescription: '',
    comments: '',
    designStage: '',
    insiteBimReviewStatus: '',
    insiteReviewDueDate: '',
    insiteReviewOutputUrl: '',
    insiteReviewer: '',
    modonHillFinalReviewStatus: '',
    onAcc: 'NOT SHARED',
    project: '',
    reviewNumber: '',
    stakeholder: '',
    submissionCategory: [],
    submissionDate: ''
  });

  const [categoryInput, setCategoryInput] = useState('');

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (review) {
      setFormData(review);
    } else {
      setFormData({
        submissionDescription: '',
        comments: '',
        designStage: '',
        insiteBimReviewStatus: '',
        insiteReviewDueDate: '',
        insiteReviewOutputUrl: '',
        insiteReviewer: '',
        modonHillFinalReviewStatus: '',
        onAcc: 'NOT SHARED',
        project: '',
        reviewNumber: '',
        stakeholder: '',
        submissionCategory: [],
        submissionDate: ''
      });
    }
  }, [review, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        id: review?.id || `bim-${Date.now()}`,
      };
      await upsertBimReview(payload);
      onSuccess(`Record ${review ? 'synchronized' : 'initiated'} successfully.`);
      onClose();
    } catch (err) {
      console.error(err);
      onError('Record transmission failure.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (cat: string) => {
    const current = formData.submissionCategory || [];
    if (current.includes(cat)) {
      setFormData({ ...formData, submissionCategory: current.filter(c => c !== cat) });
    } else {
      setFormData({ ...formData, submissionCategory: [...current, cat] });
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0, 63, 73, 0.3)', backdropFilter: 'blur(12px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{ width: '100%', maxWidth: 1000, maxHeight: '90vh', overflowY: 'auto' }}
        className="custom-scrollbar"
      >
        <GlassCard padding="none">
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--section-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                  <Layers size={20} color="var(--teal)" />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{readOnly ? 'VIEW BIM REVIEW RECORD' : (review ? 'EDIT BIM REVIEW RECORD' : 'INITIATE NEW BIM REVIEW')}</h2>
                  <p style={{ fontSize: 11, color: readOnly ? '#FF7908' : 'rgba(212, 175, 55, 0.6)', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{readOnly ? 'Read Only Mode' : 'Registry Protocol Alpha-1'}</p>
                </div>
              </div>
              <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} className="hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <fieldset disabled={readOnly} style={{ margin: 0, padding: 0, border: 'none' }}>
              <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Primary Identification */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Project</label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                      required
                      value={formData.project}
                      onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                      placeholder="e.g. REH-MD01-DP01 (AED NORTH PLOTS)"
                      style={{ width: '100%', padding: '10px 14px 10px 36px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 14, color: 'var(--text-primary)', fontSize: 15, outline: 'none' }}
                    />
                  </div>
                </div>


                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Submission Description</label>
                  <textarea
                    required
                    rows={2}
                    value={formData.submissionDescription}
                    onChange={(e) => setFormData({ ...formData, submissionDescription: e.target.value })}
                    placeholder="Technical narrative of the submission..."
                    style={{ width: '100%', padding: 12, background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 14, color: 'var(--text-primary)', fontSize: 14, outline: 'none', resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Stakeholder</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input
                        value={formData.stakeholder}
                        onChange={(e) => setFormData({ ...formData, stakeholder: e.target.value })}
                        placeholder="e.g. M1-DP01-AEDAS"
                        style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Design Stage</label>
                    <select
                      value={formData.designStage}
                      onChange={(e) => setFormData({ ...formData, designStage: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
                    >
                      <option value="">Select Stage</option>
                      <option value="Concept Design">Concept Design</option>
                      <option value="Schematic Design">Schematic Design</option>
                      <option value="Detailed Design">Detailed Design</option>
                      <option value="Construction">Construction</option>
                      <option value="Concept Masterplan">Concept Masterplan</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Submission Category</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['BIM Milestone', 'BIM Documentation', 'Technical Submittal', 'Design Review'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        style={{
                          padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 200ms',
                          background: formData.submissionCategory?.includes(cat) ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${formData.submissionCategory?.includes(cat) ? 'rgba(212, 175, 55, 0.4)' : 'rgba(255,255,255,0.08)'}`,
                          color: formData.submissionCategory?.includes(cat) ? 'var(--teal)' : 'var(--text-muted)'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Comments</label>
                  <textarea
                    rows={2}
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    placeholder="Technical audit notes..."
                    style={{ width: '100%', padding: 12, background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 14, color: 'var(--text-primary)', fontSize: 14, outline: 'none', resize: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px 28px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>Review Metadata</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>InSite BIM Review Status</label>
                      <input
                        value={formData.insiteBimReviewStatus}
                        onChange={(e) => setFormData({ ...formData, insiteBimReviewStatus: e.target.value })}
                        placeholder="e.g. With EGIS"
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Modon/Hill Status</label>
                      <input
                        value={formData.modonHillFinalReviewStatus}
                        onChange={(e) => setFormData({ ...formData, modonHillFinalReviewStatus: e.target.value })}
                        placeholder="e.g. Approved"
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Submission Date</label>
                      <div style={{ position: 'relative' }}>
                        <Calendar size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                          type="text"
                          value={formData.submissionDate || ''}
                          onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                          placeholder="DD-MMM-YY"
                          style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>InSite Review Due Date</label>
                      <div style={{ position: 'relative' }}>
                        <Calendar size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                          type="text"
                          value={formData.insiteReviewDueDate || ''}
                          onChange={(e) => setFormData({ ...formData, insiteReviewDueDate: e.target.value })}
                          placeholder="DD-MMM-YY"
                          style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>InSite Reviewer</label>
                    <div style={{ position: 'relative' }}>
                      <Shield size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input
                        value={formData.insiteReviewer}
                        onChange={(e) => setFormData({ ...formData, insiteReviewer: e.target.value })}
                        placeholder="Reviewer Name"
                        style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Review Report Links</label>
                    <div style={{ position: 'relative' }}>
                      <LinkIcon size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input
                        value={formData.insiteReviewOutputUrl}
                        onChange={(e) => setFormData({ ...formData, insiteReviewOutputUrl: e.target.value })}
                        placeholder="https://acc.autodesk.com/..."
                        style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Review Number</label>
                      <div style={{ position: 'relative' }}>
                        <Hash size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                          value={formData.reviewNumber}
                          onChange={(e) => setFormData({ ...formData, reviewNumber: e.target.value })}
                          placeholder="e.g. 30"
                          style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ACC Submission Status</label>
                      <select
                        value={formData.onAcc}
                        onChange={(e) => setFormData({ ...formData, onAcc: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                      >
                        <option value="SHARED">SHARED</option>
                        <option value="NOT SHARED">NOT SHARED</option>
                        <option value="AWAITING">AWAITING</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {!readOnly && (
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        width: '100%', padding: '12px', background: 'var(--teal)', color: '#ffffff',
                        border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 14,
                        cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        boxShadow: '0 10px 30px var(--border)', transition: 'all 200ms'
                      }}
                    >
                      {loading ? <span className="animate-spin">◌</span> : <Save size={18} />}
                      {review ? 'SYNCHRONIZE RECORD' : 'COMMIT REGISTRY PACKET'}
                    </button>
                  )}
                  <p style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center', margin: 0, letterSpacing: '0.05em' }}>
                    Authenticated as Admin // Secure Uplink Active
                  </p>
                </div>
              </div>
            </div>
            </fieldset>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
