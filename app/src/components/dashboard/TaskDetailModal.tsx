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
              minWidth: 480,
              maxWidth: '95vw',
              maxHeight: '90vh',
              background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(10, 10, 10, 0.9) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 24,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              color: 'var(--text-primary)'
            }}
          >
            {/* Header */}
            <header style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: getDepartmentColor(task.department), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  <Building2 size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{task.title}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{task.id}</span>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                    <span style={{ fontSize: 13, color: getDepartmentColor(task.department), fontWeight: 600 }}>{task.department}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 200ms', flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              >
                <X size={20} />
              </button>
            </header>

            {/* Content Scroll Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32, width: '100%', minWidth: 400 }}>
                
                {/* Assignee & Status Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontWeight: 800 }}>Digital Lifecycle Status</p>
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <FileText size={16} style={{ color: 'var(--text-dim)' }} />
                    <h3 style={{ fontSize: 13, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Description</h3>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)' }}>
                    {task.description || "No description provided for this task record."}
                  </div>
                </section>

                {/* Timeline Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <Timer size={16} style={{ color: '#D4AF37' }} />
                      <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Start Date</span>
                    </div>
                    {task.actualStartDate ? (
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{formatDate(task.actualStartDate)}</p>
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>Not synchronized</p>
                    )}
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                      <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Finish Date</span>
                    </div>
                    {task.actualEndDate && task.status === 'COMPLETED' ? (
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{formatDate(task.actualEndDate)}</p>
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>Awaiting completion</p>
                    )}
                  </div>
                </div>

                {/* Deliverables Links Section */}
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <ExternalLink size={18} style={{ color: '#D4AF37' }} />
                    <h3 style={{ fontSize: 13, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Deliverables Links ({task.links.length})</h3>
                  </div>
                  
                  {task.links.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                      {task.links.map((link, i) => (
                        <motion.a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.02, background: 'rgba(212, 175, 55, 0.15)' }}
                          whileTap={{ scale: 0.98 }}
                          style={{ 
                            padding: '10px 14px', 
                            borderRadius: 12, 
                            background: 'rgba(212, 175, 55, 0.08)', 
                            border: '1px solid rgba(212, 175, 55, 0.15)',
                            color: '#D4AF37',
                            fontSize: 12,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            textDecoration: 'none',
                            transition: 'all 200ms'
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

              </div>
            </div>

            {/* Sticky Footer */}
            <footer style={{ padding: '20px 32px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={onClose}
                style={{ padding: '10px 48px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, transition: 'all 200ms' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                CLOSE TERMINAL
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
