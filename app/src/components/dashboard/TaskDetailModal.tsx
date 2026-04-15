'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, User, Tag, Paperclip, Clock, 
  FileText, FileCode, FileImage, FileArchive, 
  Download, ExternalLink, Activity, Pause, Timer, CheckCircle2,
  Building2, UserCheck
} from 'lucide-react';
import type { Task, TaskFile } from '@/lib/types';
import StatusBadge from '@/components/shared/StatusBadge';
import { getDepartmentColor } from '@/lib/utils';
import { useTimeZone } from '@/context/TimeZoneContext';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
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


export default function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
  const { formatDate, formatTime } = useTimeZone();

  if (!task) return null;

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
              background: 'rgba(0,0,0,0.6)', 
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
              width: 'fit-content',
              minWidth: 520,
              maxWidth: '95vw',
              maxHeight: '90vh',
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              color: 'var(--text-primary)'
            }}
          >
            {/* Header */}
            <header style={{ padding: '24px 32px', background: 'var(--primary)', borderBottom: '1px solid rgba(249, 248, 242, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(249, 248, 242, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-on-primary)' }}>
                  <Building2 size={24} />
                </div>
                <div>
                  <h2 className="brand-heading" style={{ fontSize: 20, color: 'var(--text-on-primary)', margin: 0 }}>{task.title}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 13, color: 'rgba(249, 248, 242, 0.6)', fontWeight: 600 }}>{task.id}</span>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(249, 248, 242, 0.2)' }} />
                    <span style={{ fontSize: 13, color: 'var(--secondary)', fontWeight: 700 }}>{task.department}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(249, 248, 242, 0.08)', border: 'none', color: 'var(--text-on-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 200ms', flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(249, 248, 242, 0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(249, 248, 242, 0.08)'}
              >
                <X size={20} />
              </button>
            </header>

            {/* Content Scroll Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32, width: '100%', minWidth: 400 }}>
                


                {/* Timeline & Metadata Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
                  <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: '#C5A059', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Submission Date</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{formatDate(task.submittingDate || (task as any).actualEndDate || (task as any).actualStartDate)}</span>
                  </div>
 
                  <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: '#C5A059', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Task Category</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: getDepartmentColor(task.department) }}>{task.department}</span>
                  </div>
 
                  <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: '#C5A059', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Submitter</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{task.submitterName || 'Unassigned'}</span>
                  </div>
                  
                  {task.deliverableType && task.deliverableType.length > 0 && (
                    <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: '#C5A059', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Deliverable Type</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {task.deliverableType.map((type, i) => (
                          <span key={i} style={{ 
                            fontSize: 10, fontWeight: 950, padding: '4px 12px', 
                            background: 'linear-gradient(135deg, rgba(198, 224, 224, 0.15) 0%, rgba(0, 63, 73, 0.7) 100%)', 
                            border: '1px solid rgba(198, 224, 224, 0.4)', borderRadius: 20, color: '#FFFFFF',
                            textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 0 10px rgba(198, 224, 224, 0.1)'
                          }}>
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {task.cde && task.cde.length > 0 && (
                    <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: '#C5A059', textTransform: 'uppercase', letterSpacing: '0.1em' }}>CDE Environment</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {task.cde.map((env, i) => (
                          <span key={i} style={{ 
                            fontSize: 10, fontWeight: 950, padding: '4px 12px', 
                            background: 'linear-gradient(135deg, rgba(249, 248, 242, 0.15) 0%, rgba(0, 63, 73, 0.7) 100%)', 
                            border: '1px solid rgba(249, 248, 242, 0.3)', borderRadius: 20, color: '#FFFFFF',
                            textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 0 10px rgba(249, 248, 242, 0.08)'
                          }}>
                            {env}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Deliverables Links Section */}
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <ExternalLink size={18} style={{ color: 'var(--accent)' }} />
                    <h3 className="brand-heading" style={{ fontSize: 14, color: '#C5A059', margin: 0 }}>Deliverables Links ({task.links.length})</h3>
                  </div>
                  
                  {task.links.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                      {task.links.map((link, i) => (
                        <motion.a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.02, background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)' }}
                          whileTap={{ scale: 0.98 }}
                          style={{ 
                            padding: '12px 14px', 
                            borderRadius: 12, 
                            background: 'rgba(255, 255, 255, 0.05)', 
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'var(--text-primary)',
                            fontSize: 12,
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            textDecoration: 'none',
                            transition: 'all 200ms',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.label}</span>
                          <ExternalLink size={10} style={{ flexShrink: 0 }} />
                        </motion.a>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', borderRadius: 16, border: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-dim)', fontSize: 12, background: 'rgba(255,255,255,0.01)' }}>
                      No external links provided.
                    </div>
                  )}
                </section>

                {/* Notes */}
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <FileText size={16} style={{ color: 'var(--text-muted)' }} />
                    <h3 className="brand-heading" style={{ fontSize: 13, color: '#C5A059', margin: 0 }}>Notes</h3>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.04)', padding: '20px', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.12)', whiteSpace: 'pre-wrap', fontWeight: 500 }}>
                    {task.description || "No additional notes provided for this task record."}
                  </div>
                </section>
              </div>
            </div>

            {/* Sticky Footer */}
            <footer style={{ padding: '24px 32px', background: 'var(--section-bg)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={onClose}
                style={{ padding: '12px 64px', borderRadius: 10, background: 'var(--primary)', border: 'none', color: 'var(--text-on-primary)', cursor: 'pointer', fontSize: 14, fontWeight: 700, transition: 'all 200ms', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
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
