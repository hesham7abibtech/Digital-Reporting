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

// ─── Live Review Timer ────────────────────────────────────────────
function ReviewTimer({ startDate, prefix = "Holding " }: { startDate: string, prefix?: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const start = new Date(startDate).getTime();
    if (isNaN(start)) return;

    const update = () => {
      const diff = Math.max(0, Date.now() - start);
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);
      
      setElapsed(parts.join(' '));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  return <span>{prefix}{elapsed}</span>;
}

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
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                              background: 'rgba(212, 175, 55, 0.1)', 
                              border: '1px solid rgba(212, 175, 55, 0.2)',
                              color: '#D4AF37',
                              fontSize: 13,
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              textDecoration: 'none',
                              transition: 'all 200ms'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)';
                                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
                                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.2)';
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

                  {/* Tags & Classification - Moved below Quick Links */}
                  <section style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--text-secondary)' }}>
                      <Tag size={16} />
                      <h3 style={{ fontSize: 16, fontWeight: 600 }}>Tags & Classification ({task.tags?.length || 0})</h3>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.04)' }}>
                      {task.tags && task.tags.length > 0 ? (
                        task.tags.map(tag => (
                          <span 
                            key={tag} 
                            style={{ 
                              padding: '6px 14px', 
                              borderRadius: 12, 
                              background: 'rgba(212, 175, 55, 0.08)', 
                              fontSize: 13, 
                              color: '#D4AF37', 
                              border: '1px solid rgba(212, 175, 55, 0.15)',
                              fontWeight: 500
                            }}
                          >
                            #{tag}
                          </span>
                        ))
                      ) : (
                        <p style={{ fontSize: 14, color: 'var(--text-dim)', margin: 0, opacity: 0.6 }}>No classification tags assigned to this task record.</p>
                      )}
                    </div>
                  </section>
                </div>

                {/* Right Column: Meta Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ marginBottom: 20 }}>
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

                    {/* Requester Info - Moved below Assignee */}
                    {task.requesterName && (
                      <div style={{ marginBottom: 20 }}>
                        <p style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, fontWeight: 700 }}>Requested By</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <UserCheck size={14} style={{ color: 'var(--text-dim)' }} />
                          <p style={{ fontSize: 13, fontWeight: 600 }}>{task.requesterName}</p>
                        </div>
                      </div>
                    )}

                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, fontWeight: 600 }}>Timeline</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Clock size={14} style={{ color: 'var(--text-dim)' }} />
                          <div>
                            <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Request Origin</p>
                            <p style={{ fontSize: 13, fontWeight: 500 }}>
                              {formatDate(task.requestDate || task.createdAt)} <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 4px' }}>•</span> {formatTime(task.requestDate || task.createdAt)}
                            </p>
                          </div>
                        </div>
                        {task.actualStartDate && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Timer size={14} style={{ color: '#D4AF37' }} />
                            <div>
                              <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Actual Start</p>
                              <p style={{ fontSize: 13, fontWeight: 500, color: '#D4AF37' }}>
                                {formatDate(task.actualStartDate)} <span style={{ color: 'rgba(212, 175, 55, 0.2)', margin: '0 4px' }}>•</span> {formatTime(task.actualStartDate)}
                              </p>
                            </div>
                          </div>
                        )}
                        {task.actualEndDate && task.status === 'COMPLETED' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                            <div>
                              <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Actual Finish</p>
                              <p style={{ fontSize: 13, fontWeight: 500, color: '#10b981' }}>
                                {formatDate(task.actualEndDate)} <span style={{ color: 'rgba(16, 185, 129, 0.2)', margin: '0 4px' }}>•</span> {formatTime(task.actualEndDate)}
                              </p>
                            </div>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Calendar size={14} style={{ color: 'var(--text-dim)' }} />
                          <div>
                            <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Due Date</p>
                            <p style={{ fontSize: 13, fontWeight: 500 }}>
                              {formatDate(task.dueDate)} <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 4px' }}>•</span> {formatTime(task.dueDate)}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.6 }}>
                          <Activity size={14} style={{ color: 'var(--text-dim)' }} />
                          <div>
                            <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>System Creation</p>
                            <p style={{ fontSize: 12 }}>
                              {formatDate(task.createdAt)} <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 4px' }}>•</span> {formatTime(task.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                  {/* Progress — Dynamic by Status */}
                    <div style={{ marginBottom: 0 }}>
                      <p style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, fontWeight: 600 }}>Progress</p>
                      {task.status === 'NOT_STARTED' ? (
                        <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#64748b' }} />
                          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Not Started — 0%</span>
                        </div>
                      ) : task.status === 'PENDING_REVIEW' ? (
                        <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.12)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Pause size={16} style={{ color: '#f59e0b' }} />
                              <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 700 }}>HOLDING</span>
                            </div>
                            <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>Pending Review</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: 'rgba(245, 158, 11, 0.15)', overflow: 'hidden', marginBottom: 8 }}>
                            <div style={{ height: '100%', borderRadius: 3, width: `${task.completion}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', boxShadow: '0 0 12px rgba(245, 158, 11, 0.3)' }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{task.completion}% at hold</span>
                            {task.pendingReviewDate && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Timer size={11} style={{ color: '#f59e0b', opacity: 0.7 }} />
                                <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, fontFamily: 'monospace' }}>
                                  <ReviewTimer startDate={task.pendingReviewDate} />
                                </span>
                              </div>
                            )}
                          </div>
                          {task.pendingReviewDate && (
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(245, 158, 11, 0.1)', display: 'flex', justifyContent: 'flex-end' }}>
                              <span style={{ fontSize: 9, color: 'rgba(245, 158, 11, 0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Started: {formatDate(task.pendingReviewDate)} • {formatTime(task.pendingReviewDate)}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : task.status === 'COMPLETED' ? (
                        <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.12)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                            <span style={{ fontSize: 13, color: '#34d399', fontWeight: 700 }}>Completed — 100%</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: 'rgba(16, 185, 129, 0.15)', overflow: 'hidden' }}>
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #10b981, #34d399)', boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)' }} 
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 8 }}>
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${task.completion}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              style={{ 
                                height: '100%', 
                                background: task.completion >= 80 ? '#10b981' : task.completion >= 50 ? '#D4AF37' : task.status === 'DELAYED' ? '#ef4444' : '#f59e0b',
                                boxShadow: `0 0 12px ${task.completion >= 80 ? 'rgba(16,185,129,0.3)' : task.completion >= 50 ? 'rgba(212, 175, 55, 0.3)' : 'rgba(245,158,11,0.3)'}`
                              }} 
                            />
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{task.completion}%</p>
                        </>
                      )}
                    </div>

                    {/* Administrative Calibration Metadata / Reviewer Details */}
                    {(task.reviewingEntity || task.responsiblePerson) && (
                      <div style={{ padding: 14, borderRadius: 12, background: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.1)', marginTop: 16 }}>
                        <p style={{ fontSize: 10, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, fontWeight: 800 }}>
                          {task.status === 'PENDING_REVIEW' ? 'Reviewer Details' : 'Administrative Metadata'}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {task.reviewingEntity && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Building2 size={13} style={{ color: '#f59e0b', opacity: 0.7 }} />
                              <div>
                                <p style={{ fontSize: 10, color: 'var(--text-dim)' }}>Reviewing Entity</p>
                                <p style={{ fontSize: 12, fontWeight: 600 }}>{task.reviewingEntity}</p>
                              </div>
                            </div>
                          )}
                          {task.responsiblePerson && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <User size={13} style={{ color: '#f59e0b', opacity: 0.7 }} />
                              <div>
                                <p style={{ fontSize: 10, color: 'var(--text-dim)' }}>Responsible Person</p>
                                <p style={{ fontSize: 12, fontWeight: 600 }}>{task.responsiblePerson}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
