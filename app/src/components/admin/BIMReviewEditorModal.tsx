'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Shield, Info, Link as LinkIcon, Calendar, Hash, User, Building2, Layers, Tag as TagIcon, MapPin, Database, Activity, Globe, FileText, ExternalLink, ChevronRight } from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import { BIMReview, TeamMember } from '@/lib/types';
import { upsertBimReview } from '@/services/FirebaseService';
import EliteDatePicker from '@/components/shared/EliteDatePicker';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import { PRECINCTS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

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
  const [membersSnapshot] = useCollection(query(collection(db, 'members'), orderBy('name', 'asc')));
  
  const [formData, setFormData] = useState<Partial<BIMReview>>({
    "ID": '',
    "Precinct": [],
    "Stakeholder": '',
    "Project": '',
    "Milestone Submissions": [],
    "Submission Category": [],
    "Planned Submission Date": [],
    "ACC Status": [],
    "Priority": 'MEDIUM',
    "ACC Review ID": '',
    "InSite Review Status": '',
    "InSite Review Due Date": '',
    "InSite Reviewer": [],
    "InSite Review Output ACC URL": '',
    "Comments": ''
  });

  const defaultFormData: Partial<BIMReview> = {
    "ID": '',
    "Precinct": [],
    "Stakeholder": '',
    "Project": '',
    "Milestone Submissions": [],
    "Submission Category": [],
    "Planned Submission Date": [],
    "ACC Status": [],
    "Priority": 'MEDIUM',
    "ACC Review ID": '',
    "InSite Review Status": '',
    "InSite Review Due Date": '',
    "InSite Reviewer": [],
    "InSite Review Output ACC URL": '',
    "Comments": ''
  };

  const personnel = React.useMemo<{ name: string; email: string; id: string; status?: string }[]>(() => {
    const list = (membersSnapshot?.docs
      .map((d: any) => {
        const data = d.data();
        return { 
          name: data.name || 'Anonymous', 
          email: data.email || '',
          id: d.id,
          status: data.status
        };
      }) || []).filter((p: { email: string }) => p.email);

    return list.filter(p => {
      const isStatusValid = p.status === 'ACTIVE' || !p.status;
      return isStatusValid || (formData["InSite Reviewer"] || []).includes(p.name);
    });
  }, [membersSnapshot, formData["InSite Reviewer"]]);

  // Lock background scroll
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
      setFormData({ ...defaultFormData, ...review });
    } else {
      setFormData(defaultFormData);
    }
  }, [review, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        "ID": formData.ID || review?.["ID"] || `bim-${Date.now()}`,
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

  const toggleMultiValue = (field: keyof BIMReview, val: string) => {
    const current = (formData[field] as string[]) || [];
    if (current.includes(val)) {
      setFormData({ ...formData, [field]: current.filter(v => v !== val) });
    } else {
      setFormData({ ...formData, [field]: [...current, val] });
    }
  };

  const addMultiValue = (field: keyof BIMReview, val: string) => {
    if (!val) return;
    const current = (formData[field] as string[]) || [];
    if (!current.includes(val)) {
      setFormData({ ...formData, [field]: [...current, val] });
    }
  };

  const removeMultiValue = (field: keyof BIMReview, val: string) => {
    const current = (formData[field] as string[]) || [];
    setFormData({ ...formData, [field]: current.filter(v => v !== val) });
  };

  if (!isOpen) return null;

  if (readOnly) {
    const reviewerName = formData["InSite Reviewer"]?.[0] || 'Unassigned';
    const reviewer = personnel.find(p => p.name === reviewerName);

    return (
      <div 
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0, 63, 73, 0.3)', backdropFilter: 'blur(12px)' }}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{ width: '100%', maxWidth: 800, background: '#ffffff', borderRadius: 28, overflow: 'hidden', boxShadow: '0 30px 100px rgba(0, 63, 73, 0.2)' }}
        >
          {/* Header - Executive Protocol */}
          <div style={{ padding: '28px 32px', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={24} color="#d0ab82" />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{formData.Project || 'REGISTRY RECORD'}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>REH - {formData.ID} . {formData["Submission Category"]?.[0] || 'BIM'}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={24} />
            </button>
          </div>

          {/* Body - Dashboard Grid */}
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 32, maxHeight: '70vh', overflowY: 'auto', background: '#fcfdfa' }} className="custom-scrollbar">
            
            {/* Case Information Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Activity size={18} color="var(--teal)" />
                <h3 style={{ fontSize: 12, fontWeight: 950, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>Case Information</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                
                {/* Planned Submission Date */}
                <div style={{ padding: '18px 20px', background: '#ffffff', borderRadius: 20, border: '1px solid rgba(0, 63, 73, 0.05)', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0, 63, 73, 0.01)', border: '1px solid rgba(0, 63, 73, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={16} color="var(--teal)" opacity={0.5} />
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Planned Submission Date</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {(formData["Planned Submission Date"] || []).map((date, i) => (
                              <span key={`${date}-${i}`} style={{ padding: '6px 10px', background: 'rgba(0, 63, 73, 0.03)', border: '1px solid rgba(0, 63, 73, 0.1)', borderRadius: 8, fontSize: 10, fontWeight: 900, color: 'var(--teal)', textAlign: 'center', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
                                {formatDate(date)}
                              </span>
                            ))}
                  </div>
                </div>

                {/* Precinct */}
                <div style={{ padding: '18px 20px', background: '#ffffff', borderRadius: 20, border: '1px solid rgba(0, 63, 73, 0.05)', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0, 63, 73, 0.01)', border: '1px solid rgba(0, 63, 73, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={16} color="var(--teal)" opacity={0.5} />
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Precinct</div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(formData.Precinct || []).map((p, i) => (
                        <span key={`${p}-${i}`} style={{ padding: '4px 10px', background: 'rgba(0, 63, 73, 0.03)', border: '1px solid rgba(0, 63, 73, 0.1)', borderRadius: 8, fontSize: 12, fontWeight: 800, color: 'var(--teal)' }}>
                          {p}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Submission Category */}
                <div style={{ padding: '18px 20px', background: '#ffffff', borderRadius: 20, border: '1px solid rgba(0, 63, 73, 0.05)', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0, 63, 73, 0.01)', border: '1px solid rgba(0, 63, 73, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TagIcon size={16} color="var(--teal)" opacity={0.5} />
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Submission Category</div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(formData["Submission Category"] || []).map((cat, i) => (
                        <span key={`${cat}-${i}`} style={{ padding: '4px 10px', background: 'rgba(255, 121, 8, 0.03)', border: '1px solid rgba(255, 121, 8, 0.1)', borderRadius: 8, fontSize: 12, fontWeight: 800, color: '#FF7908' }}>
                          {cat}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Stakeholder */}
                <div style={{ padding: '18px 20px', background: '#ffffff', borderRadius: 20, border: '1px solid rgba(0, 63, 73, 0.05)', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0, 63, 73, 0.01)', border: '1px solid rgba(0, 63, 73, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={20} color="var(--teal)" opacity={0.5} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2 }}>Stakeholder</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--teal)' }}>{formData.Stakeholder || '---'}</div>
                  </div>
                </div>

                {/* Priority */}
                <div style={{ padding: '18px 20px', background: '#ffffff', borderRadius: 20, border: '1px solid rgba(0, 63, 73, 0.05)', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0, 63, 73, 0.01)', border: '1px solid rgba(0, 63, 73, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={20} color="var(--teal)" opacity={0.5} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2 }}>Priority</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--teal)' }}>
                      {formData.Priority ? (formData.Priority.charAt(0).toUpperCase() + formData.Priority.slice(1).toLowerCase()) : 'Medium'}
                    </div>
                  </div>
                </div>

                {/* InSite Reviewer */}
                <div style={{ padding: '18px 20px', background: '#ffffff', borderRadius: 20, border: '1px solid rgba(0, 63, 73, 0.05)', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0, 63, 73, 0.01)', border: '1px solid rgba(0, 63, 73, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={16} color="var(--teal)" opacity={0.5} />
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>InSite Reviewer</div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(formData["InSite Reviewer"] || []).map((rev, i) => (
                        <div key={`${rev}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: 'rgba(0, 63, 73, 0.03)', border: '1px solid rgba(0, 63, 73, 0.1)', borderRadius: 8 }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 900, fontSize: 9 }}>{rev.charAt(0)}</div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--teal)' }}>{rev}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Review Status Matrix Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Layers size={18} color="var(--teal)" />
                <h3 style={{ fontSize: 12, fontWeight: 950, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>Review & Status Matrix</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <div style={{ padding: '20px', background: 'rgba(0, 63, 73, 0.015)', borderRadius: 20, border: '1px solid rgba(0, 63, 73, 0.05)' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>InSite Review Status</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--teal)' }}>{formData["InSite Review Status"] || '---'}</div>
                </div>
                <div style={{ padding: '20px', background: 'rgba(0, 63, 73, 0.015)', borderRadius: 20, border: '1px solid rgba(0, 63, 73, 0.05)' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>ACC Review ID</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--teal)' }}>{formData["ACC Review ID"] || '---'}</div>
                </div>
                <div style={{ padding: '20px', background: 'rgba(0, 63, 73, 0.015)', borderRadius: 20, border: '1px solid rgba(0, 63, 73, 0.05)' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>InSite Review Due Date</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#ef4444', whiteSpace: 'nowrap' }}>{formData["InSite Review Due Date"] ? formatDate(formData["InSite Review Due Date"]) : '---'}</div>
                </div>
                <div style={{ padding: '20px', background: 'rgba(0, 63, 73, 0.015)', borderRadius: 20, border: '1px solid rgba(0, 63, 73, 0.05)' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>ACC Status</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(formData["ACC Status"] || []).map((st, i) => (
                        <span key={`${st}-${i}`} style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(255, 121, 8, 0.1)', border: '1px solid rgba(255, 121, 8, 0.2)', fontSize: 10, fontWeight: 900, color: '#FF7908' }}>{st}</span>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Milestone Submissions Section */}
            {(formData["Milestone Submissions"] || []).length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <Database size={18} color="var(--teal)" />
                  <h3 style={{ fontSize: 13, fontWeight: 950, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>Milestone Submissions</h3>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {(formData["Milestone Submissions"] || []).map((ms, i) => (
                    <div key={`ms-${i}`} style={{ padding: '10px 16px', background: '#ffffff', border: '1px solid rgba(0, 63, 73, 0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d0ab82' }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{ms}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* InSite Review Output ACC URL Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Globe size={18} color="var(--teal)" />
                  <h3 style={{ fontSize: 12, fontWeight: 950, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>InSite Review Output ACC URL</h3>
                </div>
                {formData["InSite Review Output ACC URL"] && (
                  <div style={{ padding: '4px 12px', background: '#fffbeb', color: '#d97706', borderRadius: 10, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>1 Linked Items</div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {formData["InSite Review Output ACC URL"] ? (
                  <a 
                    href={formData["InSite Review Output ACC URL"]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      padding: '20px 24px', background: '#ffffff', borderRadius: 20, border: '1px solid rgba(0, 63, 73, 0.06)', 
                      display: 'flex', alignItems: 'center', gap: 20, textDecoration: 'none', transition: 'all 200ms', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' 
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--teal)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(0, 63, 73, 0.06)'}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0, 63, 73, 0.02)', border: '1px solid rgba(0, 63, 73, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={20} color="var(--teal)" opacity={0.6} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--teal)' }}>Autodesk Construction Cloud (ACC)</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Review Link</span>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#d0ab82' }} />
                        <span style={{ fontSize: 10, fontWeight: 900, color: '#d0ab82', textTransform: 'uppercase' }}>External Asset</span>
                      </div>
                    </div>
                    <ExternalLink size={20} color="var(--text-dim)" opacity={0.4} />
                  </a>
                ) : (
                  <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(0, 63, 73, 0.02)', borderRadius: 24, border: '1.5px dashed rgba(0, 63, 73, 0.1)' }}>
                    <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0, fontWeight: 700, fontStyle: 'italic' }}>No active network vectors established for this record.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer - Command Center */}
          <div style={{ padding: '24px 32px', borderTop: '1px solid rgba(0, 63, 73, 0.1)', display: 'flex', justifyContent: 'flex-end', background: '#ffffff' }}>
            <button 
              onClick={onClose}
              style={{ padding: '12px 32px', background: 'var(--teal)', color: '#ffffff', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: 13, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 8px 24px rgba(0, 63, 73, 0.2)' }}
            >
              Close Record
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0, 63, 73, 0.3)', backdropFilter: 'blur(12px)' }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{ width: '100%', maxWidth: 1000, maxHeight: '90vh', overflowY: 'auto' }}
        className="custom-scrollbar"
      >
        <GlassCard padding="none">
          <form onSubmit={handleSubmit}>
            <div style={{ 
              padding: '16px 24px', 
              borderBottom: '1px solid var(--border)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              background: '#ffffff',
              position: 'sticky',
              top: 0,
              zIndex: 100,
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                  <Layers size={20} color="var(--teal)" />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{readOnly ? 'VIEW BIM REVIEW RECORD' : (review ? 'EDIT BIM REVIEW RECORD' : 'INITIATE NEW BIM REVIEW')}</h2>
                  <p style={{ fontSize: 11, color: readOnly ? '#FF7908' : 'rgba(212, 175, 55, 0.6)', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>Registry Protocol Alpha-1 // STRICT SCHEMA</p>
                </div>
              </div>
              <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} className="hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <fieldset disabled={readOnly} style={{ margin: 0, padding: 0, border: 'none' }}>
              <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ID (Primary Key)</label>
                    <div style={{ position: 'relative' }}>
                      <Database size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                          readOnly
                          value={formData.ID || 'AUTO-GENERATED'}
                          style={{ width: '100%', padding: '10px 14px 10px 36px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 14, color: 'var(--text-dim)', fontSize: 13, outline: 'none', cursor: 'not-allowed' }}
                        />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Project</label>
                    <div style={{ position: 'relative' }}>
                      <Building2 size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input
                        required
                        value={formData.Project || ''}
                        onChange={(e) => setFormData({ ...formData, Project: e.target.value })}
                        placeholder="e.g. REH-MD01-DP01 (AED NORTH PLOTS)"
                        style={{ width: '100%', padding: '10px 14px 10px 36px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 14, color: 'var(--text-primary)', fontSize: 15, outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Precinct</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {(formData.Precinct || []).map((p, i) => (
                        <span key={`${p}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: 'rgba(0, 63, 73, 0.05)', border: '1px solid rgba(0, 63, 73, 0.1)', fontSize: 11, fontWeight: 800, color: 'var(--teal)' }}>
                          {p}
                          {!readOnly && <X size={10} style={{ cursor: 'pointer' }} onClick={() => removeMultiValue('Precinct', p)} />}
                        </span>
                      ))}
                    </div>
                    {!readOnly && (
                      <div style={{ position: 'relative' }}>
                        <MapPin size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <select
                          onChange={(e) => {
                            addMultiValue('Precinct', e.target.value);
                            e.target.value = '';
                          }}
                          style={{ width: '100%', padding: '10px 14px 10px 36px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 14, color: 'var(--text-primary)', fontSize: 15, outline: 'none', appearance: 'none' }}
                        >
                          <option value="">Add Precinct...</option>
                          {PRECINCTS.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Milestone Submissions</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(formData["Milestone Submissions"] || []).map((ms, i) => (
                        <div key={`ms-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(0, 63, 73, 0.02)', border: '1px solid var(--border)', borderRadius: 12 }}>
                          <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{ms}</span>
                          {!readOnly && <X size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => removeMultiValue('Milestone Submissions', ms)} />}
                        </div>
                      ))}
                      {!readOnly && (
                        <input
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addMultiValue('Milestone Submissions', (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                          placeholder="Add milestone and press Enter..."
                          style={{ width: '100%', padding: 12, background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 14, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
                        />
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Stakeholder</label>
                      <div style={{ position: 'relative' }}>
                        <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                          value={formData.Stakeholder || ''}
                          onChange={(e) => setFormData({ ...formData, Stakeholder: e.target.value })}
                          placeholder="e.g. M1-DP01-AEDAS"
                          style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Priority</label>
                      <select
                        value={formData.Priority || 'MEDIUM'}
                        onChange={(e) => setFormData({ ...formData, Priority: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Submission Category</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {['BIM Milestone', 'BIM Documentation', 'Technical Submittal', 'Design Review'].map((cat, i) => (
                        <button
                          key={`${cat}-${i}`}
                          type="button"
                          onClick={() => toggleMultiValue('Submission Category', cat)}
                          style={{
                            padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 200ms',
                            background: (formData["Submission Category"] || []).includes(cat) ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${(formData["Submission Category"] || []).includes(cat) ? 'rgba(212, 175, 55, 0.4)' : 'rgba(255,255,255,0.08)'}`,
                            color: (formData["Submission Category"] || []).includes(cat) ? 'var(--teal)' : 'var(--text-muted)'
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
                      value={formData.Comments || ''}
                      onChange={(e) => setFormData({ ...formData, Comments: e.target.value })}
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
                        <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>InSite Review Status</label>
                        <input
                          value={formData["InSite Review Status"] || ''}
                          onChange={(e) => setFormData({ ...formData, "InSite Review Status": e.target.value })}
                          placeholder="e.g. With EGIS"
                          style={{ width: '100%', padding: '10px 12px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ACC Review ID</label>
                        <input
                          value={formData["ACC Review ID"] || ''}
                          onChange={(e) => setFormData({ ...formData, "ACC Review ID": e.target.value })}
                          placeholder="e.g. REV-001"
                          style={{ width: '100%', padding: '10px 12px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Planned Submission Date</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                          {(formData["Planned Submission Date"] || []).map((date, i) => (
                            <span key={`${date}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, padding: '4px 10px', borderRadius: 8, background: 'rgba(0, 63, 73, 0.05)', border: '1px solid var(--border)', fontSize: 10, color: 'var(--teal)', whiteSpace: 'nowrap', fontWeight: 800 }}>
                              {formatDate(date)}
                              {!readOnly && <X size={10} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => removeMultiValue('Planned Submission Date', date)} />}
                            </span>
                          ))}
                        </div>
                        <EliteDatePicker
                          value={''}
                          onChange={val => addMultiValue('Planned Submission Date', val)}
                          disabled={readOnly}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>InSite Review Due Date</label>
                        <EliteDatePicker
                          value={formData["InSite Review Due Date"] || ''}
                          onChange={val => setFormData({ ...formData, "InSite Review Due Date": val })}
                          disabled={readOnly}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>InSite Reviewer</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                        {(formData["InSite Reviewer"] || []).map((rev, i) => (
                          <span key={`${rev}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: 'rgba(0, 63, 73, 0.05)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 800, color: 'var(--teal)' }}>
                            {rev}
                            {!readOnly && <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeMultiValue('InSite Reviewer', rev)} />}
                          </span>
                        ))}
                      </div>
                      {!readOnly && (
                        <div style={{ position: 'relative' }}>
                          <Shield size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 1 }} />
                          <select
                            onChange={(e) => {
                              const p = personnel.find(p => p.id === e.target.value);
                              if (p) addMultiValue('InSite Reviewer', p.name);
                              e.target.value = '';
                            }}
                            style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none', appearance: 'none' }}
                          >
                            <option value="">Add InSite Reviewer...</option>
                            {personnel.map(p => (<option key={p.id} value={p.id}>{p.name} ({p.email})</option>))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>InSite Review Output ACC URL</label>
                      <div style={{ position: 'relative' }}>
                        <LinkIcon size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        {readOnly && formData["InSite Review Output ACC URL"] ? (
                          <a 
                            href={formData["InSite Review Output ACC URL"]} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              display: 'block',
                              width: '100%', 
                              padding: '10px 12px 10px 36px', 
                              background: 'var(--secondary)', 
                              border: '1px solid var(--border)', 
                              borderRadius: 10, 
                              color: 'var(--teal)', 
                              fontSize: 13, 
                              textDecoration: 'none',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              transition: 'all 200ms'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(0, 63, 73, 0.08)';
                              e.currentTarget.style.borderColor = 'var(--teal)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'var(--secondary)';
                              e.currentTarget.style.borderColor = 'var(--border)';
                            }}
                          >
                            {formData["InSite Review Output ACC URL"]}
                          </a>
                        ) : (
                          <input
                            value={formData["InSite Review Output ACC URL"] || ''}
                            onChange={(e) => setFormData({ ...formData, "InSite Review Output ACC URL": e.target.value })}
                            placeholder="https://acc.autodesk.com/..."
                            style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                          />
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ACC Status</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                        {['SHARED', 'NOT SHARED', 'AWAITING', 'PENDING'].map((st, i) => (
                          <button
                            key={`${st}-${i}`}
                            type="button"
                            onClick={() => toggleMultiValue('ACC Status', st)}
                            style={{
                              padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 200ms',
                              background: (formData["ACC Status"] || []).includes(st) ? 'rgba(255, 121, 8, 0.15)' : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${(formData["ACC Status"] || []).includes(st) ? 'rgba(255, 121, 8, 0.4)' : 'rgba(255,255,255,0.08)'}`,
                              color: (formData["ACC Status"] || []).includes(st) ? '#FF7908' : 'var(--text-muted)'
                            }}
                          >
                            {st}
                          </button>
                        ))}
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
                        {loading ? <span className="animate-spin">...</span> : <Save size={18} />}
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
