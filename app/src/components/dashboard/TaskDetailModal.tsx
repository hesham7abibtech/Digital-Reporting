'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Calendar, User, Tag, Paperclip, Clock,
  FileText, FileCode, FileImage, FileArchive,
  Download, ExternalLink, Activity, Pause, Timer, CheckCircle2,
  Building2, UserCheck, Globe
} from 'lucide-react';
import type { Task, TaskFile, TeamMember, Department } from '@/lib/types';
import StatusBadge from '@/components/shared/StatusBadge';
import { getDepartmentColor } from '@/lib/utils';
import { useTimeZone } from '@/context/TimeZoneContext';
import { useToast } from '@/components/shared/EliteToast';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  activeFilters?: { types: string[], cdes: string[] };
  members?: TeamMember[];
  departments?: Department[];
}

const getFileIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'pdf':
    case 'doc':
    case 'docx':
      return <FileText size={20} />;
    case 'dwg':
    case 'rvt':
      return <FileCode size={20} />;
    case 'jpg':
    case 'png':
      return <FileImage size={20} />;
    case 'zip':
      return <FileArchive size={20} />;
    default:
      return <FileText size={20} />;
  }
};


export default function TaskDetailModal({ task, isOpen, onClose, activeFilters, members = [], departments = [] }: TaskDetailModalProps) {
  const { formatDate, formatTime } = useTimeZone();
  const { showToast } = useToast();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!task) return null;

  // Resolve department
  const dept = (departments || []).find(d => d.id === task.department || d.name === task.department);
  const resolvedDeptName = dept ? dept.name : (task.department || 'General');

  // Resolve submitter profile
  const submitterProfile = members.find(m =>
    (task.submitterEmail && m.email.toLowerCase() === task.submitterEmail.toLowerCase()) ||
    (task.submitterName && m.name.toLowerCase() === task.submitterName.toLowerCase())
  );
  const submitterAvatar = submitterProfile?.avatar;
  const resolvedSubmitterName = submitterProfile?.name || task.submitterName || 'Unassigned';

  const filteredVectors = task.vectors?.filter(v => {
    if (!activeFilters) return true;
    const activeTypes = activeFilters.types?.filter(t => t !== 'All Types') || [];
    const activeCDEs = activeFilters.cdes?.filter(c => c !== 'All Environments') || [];

    const typeMatch = activeTypes.length === 0 || activeTypes.includes(v.type);
    const cdeMatch = activeCDEs.length === 0 || activeCDEs.includes(v.cde);
    return typeMatch && cdeMatch;
  }) || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(10, 18, 32, 0.4)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 720,
              maxHeight: '90vh',
              background: '#F9F8F2',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: 24,
              boxShadow: '0 40px 100px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              color: '#0a1220'
            }}
          >
            {/* Header */}
            <header style={{
              padding: '20px 32px',
              background: '#003F49',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37'
                }}>
                  <Building2 size={24} />
                </div>
                <div>
                  <h2 className="brand-heading" style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '0.01em', textTransform: 'uppercase' }}>{task.title}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', fontWeight: 800, letterSpacing: '0.05em' }}>{task.id}</span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(212, 175, 55, 0.4)' }} />
                    <span style={{ fontSize: 12, color: '#D4AF37', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {resolvedDeptName}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
              >
                <X size={22} />
              </button>
            </header>

            {/* Content Scroll Area */}
            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: 32,
                  alignItems: 'start'
                }}
              >
                {/* Column 1: Context & Intelligence */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  {/* Timeline & Metadata Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <Activity size={18} color="#003F49" strokeWidth={2.5} />
                      <h4 style={{ fontSize: 13, fontWeight: 950, color: '#003F49', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>Case Information</h4>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 16
                    }}>
                      {[
                        { label: 'Submission Date', value: formatDate(task.submittingDate || (task as any).actualEndDate || (task as any).actualStartDate), icon: Calendar },
                        { label: 'Project Precinct', value: task.precinct || 'General', icon: Building2 },
                        { label: 'Registry Category', value: resolvedDeptName, icon: Tag, color: getDepartmentColor(resolvedDeptName) },
                        {
                          label: 'Responsible Entity',
                          value: resolvedSubmitterName,
                          subtitle: submitterProfile?.email || task.submitterEmail,
                          icon: UserCheck,
                          isAvatar: true,
                          avatarUrl: submitterAvatar,
                          onAvatarClick: () => {
                            if (submitterAvatar) {
                              setPreviewImage(submitterAvatar);
                            } else {
                              showToast('No profile photo has been added yet.', 'INFO');
                            }
                          }
                        }
                      ].map((item, i) => (
                        <div key={i} style={{
                          padding: '20px 24px', borderRadius: 16,
                          background: '#ffffff',
                          border: '1.5px solid rgba(0, 63, 73, 0.12)',
                          display: 'flex', alignItems: 'center', gap: 16,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                          transition: 'all 0.2s'
                        }}>
                          <div
                            onClick={(item as any).onAvatarClick}
                            style={{
                              width: 40, height: 40, borderRadius: 12,
                              background: 'rgba(0, 63, 73, 0.05)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#003F49',
                              overflow: 'hidden',
                              cursor: (item as any).isAvatar ? 'pointer' : 'default',
                              border: (item as any).isAvatar && (item as any).avatarUrl ? '1.5px solid #003F49' : '1px solid rgba(0, 63, 73, 0.1)'
                            }}
                          >
                            {(item as any).isAvatar && (item as any).avatarUrl ? (
                              <img src={(item as any).avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <item.icon size={20} />
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: 950, color: 'rgba(0, 63, 73, 0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.label}</span>
                            <span style={{ fontSize: 14, fontWeight: 950, color: item.color || '#003F49' }}>{item.value}</span>
                            {(item as any).subtitle && (
                              <span style={{ fontSize: 11, color: 'rgba(0, 63, 73, 0.4)', fontWeight: 700, marginTop: -1 }}>{(item as any).subtitle}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Column 2: Deliverable Matrix Terminal */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0 4px', marginBottom: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Globe size={18} color="#D4AF37" strokeWidth={2.5} />
                        <h4 style={{ fontSize: 13, fontWeight: 950, color: '#003F49', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>Associated Records</h4>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 1000, color: '#D4AF37', background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.2)', padding: '5px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {filteredVectors.length} Linked Items
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 14
                    }}>
                    {filteredVectors.length > 0 ? (
                      filteredVectors.map((vector, i) => (
                        <motion.a
                          key={vector.id || i}
                          href={vector.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ x: 4, background: 'rgba(212, 175, 55, 0.05)', borderColor: 'rgba(212, 175, 55, 0.3)' }}
                          style={{
                            background: '#ffffff',
                            borderRadius: 16,
                            border: '1.5px solid rgba(0, 63, 73, 0.15)',
                            padding: '20px 24px',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                            transition: 'all 200ms ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0, 63, 73, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#003F49' }}>
                              <FileCode size={20} />
                            </div>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                               <span style={{ fontSize: 14, fontWeight: 950, color: '#003F49' }}>{vector.label}</span>
                               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                 <span style={{ fontSize: 10, fontWeight: 1000, color: 'rgba(0, 63, 73, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{vector.type}</span>
                                 <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#D4AF37' }} />
                                 <span style={{ fontSize: 10, fontWeight: 1000, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{vector.cde}</span>
                               </div>
                             </div>
                          </div>
                          <ExternalLink size={14} color="#003F49" style={{ opacity: 0.4 }} />
                        </motion.a>
                      ))
                    ) : (
                      // Fallback for empty or legacy
                      <div style={{
                        padding: '40px 20px', textAlign: 'center', borderRadius: 20,
                        border: '2px dashed rgba(0,0,0,0.05)', color: 'rgba(0,0,0,0.3)',
                        fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.5)'
                      }}>
                        No active deliverable vectors matched the current filter protocol.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes Section - Moved to End */}
              <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <FileText size={18} color="#003F49" strokeWidth={2.5} />
                  <h4 style={{ fontSize: 13, fontWeight: 950, color: '#003F49', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>Notes</h4>
                </div>
                <div style={{
                  fontSize: 13, lineHeight: 1.7, color: '#0a1220',
                  background: 'rgba(0, 63, 73, 0.03)', padding: '24px 30px',
                  borderRadius: 24, border: '1.5px solid rgba(0, 63, 73, 0.1)',
                  whiteSpace: 'pre-wrap', fontWeight: 700,
                  boxShadow: 'inset 0 3px 10px rgba(0, 63, 73, 0.04)',
                  minHeight: 100
                }}>
                  {task.description || "No current notes added."}
                </div>
              </div>
            </div>

            {/* Image Preview Overlay */}
            <AnimatePresence>
              {previewImage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setPreviewImage(null)}
                  style={{
                    position: 'fixed', inset: 0, zIndex: 10000,
                    background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40,
                    cursor: 'zoom-out'
                  }}
                >
                  <motion.img
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    src={previewImage}
                    alt="Preview"
                    style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                  />
                  <button
                    onClick={() => setPreviewImage(null)}
                    style={{ position: 'absolute', top: 30, right: 30, background: 'white', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <X size={20} color="#000" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sticky Footer */}
            <footer style={{
              padding: '20px 32px',
              background: '#ffffff',
              borderTop: '1px solid rgba(0, 0, 0, 0.08)',
              display: 'flex', justifyContent: 'flex-end',
              backdropFilter: 'blur(10px)'
            }}>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 36px', borderRadius: 10,
                  background: '#003F49', border: 'none',
                  color: '#ffffff', cursor: 'pointer',
                  fontSize: 12, fontWeight: 900,
                  transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  boxShadow: '0 6px 20px rgba(0, 63, 73, 0.2)',
                  fontFamily: 'var(--font-heading)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 63, 73, 0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 63, 73, 0.2)';
                }}
              >
                Close Record
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
