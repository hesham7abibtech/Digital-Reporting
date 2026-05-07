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
  const [previewData, setPreviewData] = useState<{ url: string; name: string } | null>(null);

  if (!task) return null;

  // Resolve department
  const depts = Array.isArray(task.department) ? task.department : (task.department ? [task.department] : []);
  const resolvedDeptNames = depts.map(deptIdOrName => {
    const d = (departments || []).find(d => d.id === deptIdOrName || d.name === deptIdOrName);
    return d ? d.name : deptIdOrName;
  });
  const resolvedDeptName = resolvedDeptNames.length > 0 ? resolvedDeptNames.join(', ') : 'General';
  const primaryDeptName = resolvedDeptNames[0] || 'General';

  // Resolve submitter profile
  const submitterEmails = Array.isArray(task.submitterEmail) ? task.submitterEmail : (task.submitterEmail ? [task.submitterEmail] : []);
  const submitterNames = Array.isArray(task.submitterName) ? task.submitterName : (task.submitterName ? [task.submitterName] : []);

  const submitterProfiles = members.filter(m =>
    submitterEmails.some(e => e?.toLowerCase() === m.email?.toLowerCase()) ||
    submitterNames.some(n => n?.toLowerCase() === m.name?.toLowerCase())
  );

  const resolvedSubmitterName = submitterNames.length > 0 ? submitterNames.join(', ') : 'Unassigned';
  const resolvedSubmitterEmail = submitterEmails.length > 0 ? submitterEmails.join(', ') : '';

  const filteredVectors = task.vectors?.filter(v => {
    if (!activeFilters) return true;
    const activeTypes = activeFilters.types?.filter(t => t !== 'All Types') || [];
    const activeCDEs = activeFilters.cdes?.filter(c => c !== 'All CDE') || [];

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
                  background: 'rgba(176, 141, 62, 0.15)',
                  border: '1px solid rgba(176, 141, 62, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B08D3E'
                }}>
                  <Building2 size={24} />
                </div>
                <div>
                  <h2 className="brand-heading" style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '0.01em', textTransform: 'uppercase' }}>{task.title}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', fontWeight: 800, letterSpacing: '0.05em' }}>{task.id}</span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(176, 141, 62, 0.4)' }} />
                    <span style={{ fontSize: 12, color: '#B08D3E', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
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
                        { label: 'Registry Category', value: resolvedDeptName, icon: Tag, color: getDepartmentColor(primaryDeptName) },
                        {
                          label: 'Responsible Entity',
                          value: resolvedSubmitterName,
                          subtitle: resolvedSubmitterEmail,
                          icon: UserCheck,
                          isSubmitters: true,
                          profiles: submitterProfiles
                        }
                      ].map((item, i) => (
                        <div key={i} style={{
                          padding: '24px', borderRadius: 20,
                          background: '#ffffff',
                          border: '1.5px solid rgba(0, 63, 73, 0.08)',
                          display: 'flex', 
                          flexDirection: (item as any).isSubmitters ? 'column' : 'row',
                          alignItems: 'center', 
                          gap: 16,
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.04)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'default'
                        }}>
                          <div
                            style={{
                              width: 40, height: 40, borderRadius: 12,
                              background: 'rgba(0, 63, 73, 0.05)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#003F49',
                              position: 'relative',
                              overflow: 'visible'
                            }}
                          >
                            {(item as any).isSubmitters ? (
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                {(item as any).profiles.length > 0 ? (
                                  (item as any).profiles.slice(0, 2).map((p: any, idx: number) => (
                                    <motion.div
                                      key={p.id}
                                      title={p.name}
                                      whileHover={{ scale: 1.25, rotate: 3, zIndex: 50, boxShadow: '0 15px 35px rgba(0,0,0,0.4)', borderColor: '#B08D3E' }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => {
                                        if (p.avatar) {
                                          setPreviewData({ url: p.avatar, name: p.name });
                                        } else {
                                          showToast('No profile photo has been added yet.', 'INFO');
                                        }
                                      }}
                                      style={{
                                        width: 38, height: 38, borderRadius: 12,
                                        border: '2.5px solid #ffffff',
                                        marginLeft: idx > 0 ? -12 : 0,
                                        zIndex: 10 - idx,
                                        overflow: 'hidden',
                                        cursor: p.avatar ? 'pointer' : 'default',
                                        background: p.avatar ? 'transparent' : 'linear-gradient(135deg, #003F49 0%, #000000 100%)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#B08D3E', fontSize: 11, fontWeight: 900,
                                        boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                      }}
                                    >
                                      {p.avatar ? (
                                        <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      ) : (
                                        p.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                                      )}
                                    </motion.div>
                                  ))
                                ) : (
                                  <item.icon size={20} />
                                )}
                                {(item as any).profiles.length > 2 && (
                                  <div style={{
                                    width: 24, height: 24, borderRadius: 8,
                                    background: '#B08D3E', color: '#ffffff',
                                    fontSize: 9, fontWeight: 900,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginLeft: -8, zIndex: 6, border: '2px solid #ffffff'
                                  }}>
                                    +{(item as any).profiles.length - 2}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <item.icon size={20} />
                            )}
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: 2,
                            alignItems: (item as any).isSubmitters ? 'center' : 'flex-start',
                            textAlign: (item as any).isSubmitters ? 'center' : 'left'
                          }}>
                            <span style={{ fontSize: 11, fontWeight: 950, color: 'rgba(0, 63, 73, 0.5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{item.label}</span>
                            <span style={{ 
                              fontSize: (item as any).isSubmitters ? 15 : 14, 
                              fontWeight: 950, 
                              color: item.color || '#003F49',
                              lineHeight: 1.2
                            }}>{item.value}</span>
                            {(item as any).subtitle && (
                              <span style={{ fontSize: 10, color: 'rgba(0, 63, 73, 0.4)', fontWeight: 700, marginTop: 1 }}>{(item as any).subtitle}</span>
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
                      <Globe size={18} color="#B08D3E" strokeWidth={2.5} />
                      <h4 style={{ fontSize: 13, fontWeight: 950, color: '#003F49', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>Delivrable Link</h4>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 1000, color: '#B08D3E', background: 'rgba(176, 141, 62, 0.12)', border: '1px solid rgba(176, 141, 62, 0.2)', padding: '5px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                          whileHover={{ x: 4, background: 'rgba(176, 141, 62, 0.05)', borderColor: 'rgba(176, 141, 62, 0.3)' }}
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
                                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#B08D3E' }} />
                                <span style={{ fontSize: 10, fontWeight: 1000, color: '#B08D3E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{vector.cde}</span>
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
            {previewData && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setPreviewData(null)}
                  style={{
                    position: 'fixed', inset: 0, zIndex: 10000,
                    background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(20px)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40,
                    cursor: 'zoom-out'
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}
                  >
                    <img
                      src={previewData.url}
                      alt={previewData.name}
                      style={{ 
                        maxWidth: '85vw', maxHeight: '70vh', 
                        borderRadius: 24, border: '4px solid #ffffff',
                        boxShadow: '0 30px 100px rgba(0,0,0,0.8)' 
                      }}
                    />
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ 
                        fontSize: 28, fontWeight: 900, color: '#ffffff', margin: 0, 
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        textShadow: '0 4px 20px rgba(0,0,0,0.5)'
                      }}>
                        {previewData.name}
                      </h3>
                      <div style={{ 
                        height: 2, width: 60, background: '#B08D3E', 
                        margin: '12px auto 0', borderRadius: 2 
                      }} />
                      <p style={{ 
                        fontSize: 12, color: '#B08D3E', fontWeight: 900, 
                        marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.2em'
                      }}>
                        Verified Identity Profile
                      </p>
                    </div>
                  </motion.div>
                  <button
                    onClick={() => setPreviewData(null)}
                    style={{ 
                      position: 'absolute', top: 30, right: 30, 
                      background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', 
                      borderRadius: '50%', width: 50, height: 50, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      cursor: 'pointer', color: 'white', transition: 'all 0.3s'
                    }}
                  >
                    <X size={24} />
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
