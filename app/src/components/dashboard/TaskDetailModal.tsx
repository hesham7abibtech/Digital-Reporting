'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, User, Tag, Paperclip, Clock, 
  FileText, FileCode, FileImage, FileArchive, 
  Download, ExternalLink, Activity
} from 'lucide-react';
import type { Task, TaskFile } from '@/lib/types';
import StatusBadge from '@/components/shared/StatusBadge';
import PriorityBadge from '@/components/shared/PriorityBadge';
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
              width: '100%',
              maxWidth: 900,
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
            <header style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: getDepartmentColor(task.department), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  {task.assigneeName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{task.title}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{task.id}</span>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                    <span style={{ fontSize: 13, color: getDepartmentColor(task.department), fontWeight: 600 }}>{task.department}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 200ms' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              >
                <X size={20} />
              </button>
            </header>

            {/* Content Scroll Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 40 }}>
                {/* Left Column: Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  {/* Status & Priority Row */}
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
                      <p style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>Status</p>
                      <StatusBadge status={task.status} />
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
                      <p style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>Priority</p>
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </div>

                  {/* Description */}
                  <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--text-secondary)' }}>
                      <Activity size={16} />
                      <h3 style={{ fontSize: 16, fontWeight: 600 }}>Description</h3>
                    </div>
                    <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)' }}>
                      {task.description || "No description provided for this task."}
                    </p>
                  </section>

                  {/* Related Files */}
                  <section>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                        <Paperclip size={16} />
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Related Files ({task.files.length})</h3>
                      </div>
                    </div>
                    
                    {task.files.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                        {task.files.map((file, i) => (
                          <motion.div
                            key={file.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                            style={{ 
                              padding: '14px', 
                              borderRadius: 16, 
                              background: 'rgba(255,255,255,0.03)', 
                              border: '1px solid rgba(255,255,255,0.05)',
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 12,
                              transition: 'all 200ms',
                              cursor: 'pointer'
                            }}
                            className="group hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]"
                          >
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {getFileIcon(file.type)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</p>
                              <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{file.size} • {file.type.toUpperCase()}</p>
                            </div>
                            <button style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 4 }}>
                              <Download size={14} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '32px', textAlign: 'center', borderRadius: 16, border: '2px dashed rgba(255,255,255,0.04)', color: 'var(--text-dim)', fontSize: 14 }}>
                        No files attached to this task.
                      </div>
                    )}
                  </section>

                  {/* External Links */}
                  <section style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--text-secondary)' }}>
                      <ExternalLink size={16} />
                      <h3 style={{ fontSize: 16, fontWeight: 600 }}>Quick Links ({task.links.length})</h3>
                    </div>
                    
                    {task.links.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {task.links.map((link, i) => (
                          <motion.a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.05 }}
                            style={{ 
                              padding: '10px 18px', 
                              borderRadius: 14, 
                              background: 'rgba(59,130,246,0.1)', 
                              border: '1px solid rgba(59,130,246,0.2)',
                              color: '#60a5fa',
                              fontSize: 13,
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              textDecoration: 'none',
                              transition: 'all 200ms'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(59,130,246,0.15)';
                                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)';
                            }}
                          >
                            {link.label}
                            <ExternalLink size={12} />
                          </motion.a>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', borderRadius: 16, border: '1px solid rgba(255,255,255,0.02)', color: 'var(--text-dim)', fontSize: 13, background: 'rgba(255,255,255,0.01)' }}>
                        No external links provided.
                      </div>
                    )}
                  </section>
                </div>

                {/* Right Column: Meta Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: 24, borderRadius: 20, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ marginBottom: 24 }}>
                      <p style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, fontWeight: 600 }}>Assignee</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                          {task.assigneeName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600 }}>{task.assigneeName}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>{task.department}</p>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <p style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, fontWeight: 600 }}>Timeline</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Calendar size={14} style={{ color: 'var(--text-dim)' }} />
                          <div>
                            <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Due Date</p>
                            <p style={{ fontSize: 13, fontWeight: 500 }}>{formatDate(task.dueDate)}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Clock size={14} style={{ color: 'var(--text-dim)' }} />
                          <div>
                            <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Created</p>
                            <p style={{ fontSize: 13, fontWeight: 500 }}>{formatDate(task.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, fontWeight: 600 }}>Progress</p>
                      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 8 }}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${task.completion}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          style={{ 
                            height: '100%', 
                            background: task.completion >= 80 ? '#10b981' : task.completion >= 50 ? '#3b82f6' : '#f59e0b',
                            boxShadow: '0 0 12px rgba(59,130,246,0.3)'
                          }} 
                        />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{task.completion}%</p>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: 24, borderRadius: 20, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, fontWeight: 600 }}>Tags</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {task.tags.map(tag => (
                        <span key={tag} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', fontSize: 11, color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <footer style={{ padding: '20px 32px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                onClick={onClose}
                style={{ padding: '10px 24px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'all 200ms' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Close View
              </button>
              <button 
                style={{ padding: '10px 24px', borderRadius: 12, background: '#3b82f6', border: 'none', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 200ms', boxShadow: '0 8px 16px -4px rgba(59,130,246,0.4)' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Open in Full Editor
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
