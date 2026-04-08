'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Calendar, User, Tag, Activity, Loader2, Pause, Timer, Search, Globe, ChevronDown, Check, Building2, Plus, Link, Paperclip, Download, FileText } from 'lucide-react';
import { Task, Priority, TaskStatus, TeamMember, TaskLink, TaskFile } from '@/lib/types';
import { upsertTask, deleteTask } from '@/services/FirebaseService';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';
import EliteConfirmModal from '@/components/shared/EliteConfirmModal';
import { useToast } from '@/components/shared/EliteToast';

interface TaskEditorProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  members: TeamMember[];
}

const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const statuses: TaskStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED', 'DELAYED', 'BLOCKED'];

// Helpers for TimeZone conversion without external libraries
const toLocalISO = (utcString: string, timeZone: string) => {
  try {
    const date = new Date(utcString);
    // Use Intl to get parts for the specific timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
      timeZone
    });
    
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value;
    
    // YYYY-MM-DDTHH:mm
    return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}`;
  } catch (e) {
    return new Date().toISOString().slice(0, 16);
  }
};

const fromLocalISO = (localString: string, timeZone: string) => {
  try {
    // Create a date in the specific timezone
    // We can't easily "create" a date in a TZ with native Date, 
    // so we use the offset trick or just parse and adjust.
    // A robust way with native JS:
    const [datePart, timePart] = localString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    // Create as UTC first
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
    
    // Adjust by the difference between UTC and the target timezone at that date
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
    const offset = utcDate.getTime() - tzDate.getTime();
    
    return new Date(date.getTime() + offset).toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
};

const commonTimeZones = [
  'Africa/Cairo',
  'Asia/Dubai',
  'Asia/Riyadh',
  'Europe/London',
  'America/New_York',
  'Asia/Singapore'
];

export default function TaskEditorModal({ task, isOpen, onClose, members }: TaskEditorProps) {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    assigneeName: '',
    department: 'Architecture',
    priority: 'MEDIUM',
    status: 'NOT_STARTED',
    completion: 0,
    dueDate: new Date().toISOString(),
    requestDate: new Date().toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    fileShareLink: '',
    requesterName: '',
    reviewingEntity: '',
    responsiblePerson: '',
    actualStartDate: '',
    pendingReviewDate: null,
  });
  const [showCustomDept, setShowCustomDept] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tzSearch, setTzSearch] = useState('');
  const [tzOpen, setTzOpen] = useState(false);
  const tzRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  // Local state for adding new files/links
  const [newLink, setNewLink] = useState({ label: '', url: '' });
  const [newFile, setNewFile] = useState({ name: '', url: '', type: 'pdf' as any });

  // Available Time Zones
  const allTimeZones = typeof Intl !== 'undefined' && (Intl as any).supportedValuesOf 
    ? (Intl as any).supportedValuesOf('timeZone') 
    : commonTimeZones;

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        title: task.title || '',
        description: task.description || '',
        assigneeName: task.assigneeName || '',
        department: task.department || 'Architecture',
        priority: task.priority || 'MEDIUM',
        status: task.status || 'NOT_STARTED',
        completion: task.completion || 0,
        dueDate: task.dueDate || new Date().toISOString(),
        requestDate: task.requestDate || new Date().toISOString(),
        timeZone: task.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        fileShareLink: task.fileShareLink || '',
        requesterName: task.requesterName || '',
        reviewingEntity: task.reviewingEntity || '',
        responsiblePerson: task.responsiblePerson || '',
        actualStartDate: task.actualStartDate || '',
      });
      
      const standardDepts = ['Architecture', 'MEP', 'Structural', 'Design', 'Project Management', 'QA/QC', 'HSE', 'IT'];
      setShowCustomDept(!standardDepts.includes(task.department || 'Architecture'));
    } else {
      setFormData({
        id: `task-${Date.now()}`,
        title: '',
        description: '',
        assigneeId: 'current-admin',
        assigneeName: '',
        assigneeAvatar: '',
        department: 'Architecture',
        priority: 'MEDIUM',
        status: 'NOT_STARTED',
        completion: 0,
        attachments: 0,
        files: [],
        links: [],
        tags: [],
        dueDate: new Date().toISOString(),
        requestDate: new Date().toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        fileShareLink: '',
        requesterName: '',
        reviewingEntity: '',
        responsiblePerson: '',
        actualStartDate: '',
        pendingReviewDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setShowCustomDept(false);
    }
  }, [task, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const finalTask = {
        ...formData,
        updatedAt: new Date().toISOString(),
      } as Task;
      await upsertTask(finalTask);
      showToast('Task asset synchronized successfully.', 'SUCCESS');
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      setErrorMsg(getFirebaseErrorMessage(error));
      showToast('Access denied or sync failure.', 'ERROR');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    try {
      await deleteTask(task.id);
      showToast('Task record successfully terminated.', 'SUCCESS');
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
      setErrorMsg(getFirebaseErrorMessage(error));
      showToast('Termination protocol failed.', 'ERROR');
      throw error;
    }
  };

  if (!isOpen) return null;

  const handleDeptChange = (val: string) => {
    if (val === 'Other') {
      setShowCustomDept(true);
      setFormData({ ...formData, department: '' });
    } else {
      setShowCustomDept(false);
      setFormData({ ...formData, department: val });
    }
  };

  const handleTZChange = (newTZ: string) => {
    setFormData({ ...formData, timeZone: newTZ });
    // Note: The dates in UTC don't change, but the toLocalISO helper 
    // will now render them for the new timezone in the next render cycle.
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          width: '100%', maxWidth: 700, background: '#12121a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, position: 'relative', zIndex: 1, overflow: 'hidden'
        }}
      >
        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{task ? 'Edit Task Record' : 'Create New Task'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <div style={{ padding: 32, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, maxHeight: '80vh', overflowY: 'auto' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task Title</label>
            <input 
              type="text" 
              value={formData.title ?? ''} 
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 15, outline: 'none' }}
              placeholder="System migration..."
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
            <textarea 
              value={formData.description ?? ''} 
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none', resize: 'vertical' }}
              placeholder="Detailed task mission parameters..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignee Profile</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <select 
                value={formData.assigneeId} 
                onChange={e => {
                  const m = members.find(mem => mem.id === e.target.value);
                  if (m) {
                    setFormData({ 
                      ...formData, 
                      assigneeId: m.id, 
                      assigneeName: m.name, 
                      assigneeAvatar: m.avatar || '',
                      department: m.department 
                    });
                  }
                }}
                style={{ width: '100%', padding: '12px 16px 12px 38px', borderRadius: 12, background: '#1a1a24', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none', appearance: 'none' }}
              >
                <option value="">Select Team Member</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requester Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input 
                type="text" 
                value={formData.requesterName ?? ''} 
                onChange={e => setFormData({ ...formData, requesterName: e.target.value })}
                style={{ width: '100%', padding: '12px 16px 12px 38px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none' }}
                placeholder="Name of entity requesting task"
              />
            </div>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={13} style={{ color: '#D4AF37' }} />
                Operational Time Zone (Deadlines Intelligence)
              </div>
            </label>
            <div ref={tzRef} style={{ position: 'relative' }}>
              {/* Selected Value Button */}
              <button
                type="button"
                onClick={() => { setTzOpen(!tzOpen); setTzSearch(''); }}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(20, 20, 35, 0.95) 100%)',
                  border: tzOpen ? '1px solid rgba(212, 175, 55, 0.5)' : '1px solid rgba(212, 175, 55, 0.2)',
                  color: 'white', fontSize: 14, outline: 'none', cursor: 'pointer',
                  boxShadow: tzOpen ? '0 0 20px rgba(212, 175, 55, 0.1), inset 0 0 30px rgba(212, 175, 55, 0.03)' : '0 0 15px rgba(212, 175, 55, 0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 200ms',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Globe size={16} style={{ color: '#D4AF37' }} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, display: 'block', fontSize: 14 }}>{(formData.timeZone || '').replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600, letterSpacing: '0.03em' }}>
                      UTC {(() => { try { const f = new Intl.DateTimeFormat('en-US',{timeZone: formData.timeZone, timeZoneName:'shortOffset'}); const p = f.formatToParts(new Date()); return p.find(x=>x.type==='timeZoneName')?.value?.replace('GMT','') || ''; } catch { return ''; } })()}
                      {' • '}{new Date().toLocaleTimeString('en-US', { timeZone: formData.timeZone, hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                </div>
                <ChevronDown size={18} style={{ color: '#64748b', transition: 'transform 200ms', transform: tzOpen ? 'rotate(180deg)' : 'none' }} />
              </button>

              {/* Dropdown Panel */}
              <AnimatePresence>
                {tzOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6,
                      zIndex: 50, borderRadius: 14, overflow: 'hidden',
                      background: 'rgba(12, 12, 20, 0.98)',
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(212, 175, 55, 0.08)',
                      backdropFilter: 'blur(20px)',
                    }}
                  >
                    {/* Search Input */}
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                        <input
                          type="text"
                          autoFocus
                          value={tzSearch}
                          onChange={e => setTzSearch(e.target.value)}
                          placeholder="Search timezone..."
                          style={{
                            width: '100%', padding: '10px 14px 10px 36px', borderRadius: 10,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            color: 'white', fontSize: 13, outline: 'none',
                          }}
                          onFocus={e => e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)'}
                          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                        />
                      </div>
                    </div>

                    {/* Timezone List */}
                    <div style={{ maxHeight: 280, overflowY: 'auto', padding: '6px 0' }}>
                      {/* Quick Access */}
                      {(!tzSearch || commonTimeZones.some(tz => tz.toLowerCase().includes(tzSearch.toLowerCase()))) && (
                        <>
                          <div style={{ padding: '6px 16px', fontSize: 9, fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Quick Access — Regional Core</div>
                          {commonTimeZones.filter(tz => !tzSearch || tz.toLowerCase().includes(tzSearch.toLowerCase())).map(tz => (
                            <button
                              key={`quick-${tz}`}
                              type="button"
                              onClick={() => { handleTZChange(tz); setTzOpen(false); }}
                              style={{
                                width: '100%', padding: '10px 16px', border: 'none', cursor: 'pointer',
                                background: formData.timeZone === tz ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                                color: 'white', fontSize: 13, textAlign: 'left',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                transition: 'background 100ms',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = formData.timeZone === tz ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)'}
                              onMouseLeave={e => e.currentTarget.style.background = formData.timeZone === tz ? 'rgba(212, 175, 55, 0.1)' : 'transparent'}
                            >
                              <span style={{ fontWeight: formData.timeZone === tz ? 600 : 400 }}>{tz.replace(/_/g, ' ')}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                                  {(() => { try { const f = new Intl.DateTimeFormat('en-US',{timeZone:tz,timeZoneName:'shortOffset'}); return f.formatToParts(new Date()).find(x=>x.type==='timeZoneName')?.value || ''; } catch { return ''; } })()}
                                </span>
                                {formData.timeZone === tz && <Check size={14} style={{ color: '#D4AF37' }} />}
                              </div>
                            </button>
                          ))}
                        </>
                      )}

                      {/* Divider */}
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '6px 16px' }} />

                      {/* All Zones (filtered) */}
                      <div style={{ padding: '6px 16px', fontSize: 9, fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em' }}>All Global Regions</div>
                      {allTimeZones
                        .filter((tz: string) => !tzSearch || tz.toLowerCase().includes(tzSearch.toLowerCase()))
                        .slice(0, 50)
                        .map((tz: string) => (
                          <button
                            key={tz}
                            type="button"
                            onClick={() => { handleTZChange(tz); setTzOpen(false); }}
                            style={{
                              width: '100%', padding: '8px 16px', border: 'none', cursor: 'pointer',
                              background: formData.timeZone === tz ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                              color: 'white', fontSize: 12, textAlign: 'left',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              transition: 'background 100ms',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = formData.timeZone === tz ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)'}
                            onMouseLeave={e => e.currentTarget.style.background = formData.timeZone === tz ? 'rgba(212, 175, 55, 0.1)' : 'transparent'}
                          >
                            <span style={{ fontWeight: formData.timeZone === tz ? 600 : 400 }}>{tz.replace(/_/g, ' ')}</span>
                            {formData.timeZone === tz && <Check size={12} style={{ color: '#D4AF37' }} />}
                          </button>
                        ))}
                      {tzSearch && allTimeZones.filter((tz: string) => tz.toLowerCase().includes(tzSearch.toLowerCase())).length === 0 && (
                        <div style={{ padding: '20px 16px', textAlign: 'center', color: '#475569', fontSize: 12 }}>No timezone matches "{tzSearch}"</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Click-away listener */}
              {tzOpen && <div onClick={() => setTzOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operational Department</label>
            <select 
              value={showCustomDept ? 'Other' : formData.department} 
              onChange={e => handleDeptChange(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#1a1a24', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none' }}
            >
              {[
                'Architecture', 'MEP', 'Structural', 'Design', 
                'Project Management', 'QA/QC', 'HSE', 'IT'
              ].map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
              <option value="Other">OTHER (MANUAL ENTRY)</option>
            </select>
            {showCustomDept && (
              <motion.input 
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                type="text" 
                placeholder="Enter department name..."
                value={formData.department ?? ''}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                style={{ width: '100%', padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212, 175, 55, 0.3)', color: 'white', fontSize: 13, outline: 'none', marginTop: 8 }}
              />
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operational Priority</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {priorities.map(p => (
                <button
                  key={p}
                  onClick={() => setFormData({ ...formData, priority: p })}
                  style={{
                    flex: 1, padding: '8px 0', fontSize: 10, fontWeight: 700, borderRadius: 8,
                    background: formData.priority === p ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.02)',
                    color: formData.priority === p ? '#D4AF37' : '#64748b',
                    border: formData.priority === p ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status Track</label>
             <select 
              value={formData.status} 
              onChange={e => {
                const newStatus = e.target.value as TaskStatus;
                const updates: Partial<Task> = { status: newStatus };
                // Auto-set pendingReviewDate when entering PENDING_REVIEW
                if (newStatus === 'PENDING_REVIEW' && formData.status !== 'PENDING_REVIEW') {
                  updates.pendingReviewDate = new Date().toISOString();
                }
                // Clear pendingReviewDate when leaving PENDING_REVIEW
                if (newStatus !== 'PENDING_REVIEW') {
                  updates.pendingReviewDate = null;
                }
                // Auto-set actualStartDate when entering IN_PROGRESS if not set
                if (newStatus === 'IN_PROGRESS' && !formData.actualStartDate) {
                  updates.actualStartDate = new Date().toISOString();
                }
                // Auto-set completion based on status
                if (newStatus === 'NOT_STARTED') updates.completion = 0;
                if (newStatus === 'COMPLETED') updates.completion = 100;
                setFormData({ ...formData, ...updates });
              }}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#1a1a24', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none' }}
            >
              {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          {/* Conditional Administrative Calibration Fields */}
          <AnimatePresence>
            {formData.status === 'PENDING_REVIEW' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, overflow: 'hidden' }}
              >
                <div style={{ padding: 20, borderRadius: 16, background: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#fbbf24', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reviewing Entity</label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(245, 158, 11, 0.4)' }} />
                    <input 
                      type="text" 
                      value={formData.reviewingEntity ?? ''} 
                      onChange={e => setFormData({ ...formData, reviewingEntity: e.target.value })}
                      style={{ width: '100%', padding: '10px 16px 10px 38px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(245, 158, 11, 0.15)', color: 'white', fontSize: 13, outline: 'none' }}
                      placeholder="e.g. Municipal Authority"
                    />
                  </div>
                </div>
                <div style={{ padding: 20, borderRadius: 16, background: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#fbbf24', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Responsible Person (if known)</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(245, 158, 11, 0.4)' }} />
                    <input 
                      type="text" 
                      value={formData.responsiblePerson ?? ''} 
                      onChange={e => setFormData({ ...formData, responsiblePerson: e.target.value })}
                      style={{ width: '100%', padding: '10px 16px 10px 38px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(245, 158, 11, 0.15)', color: 'white', fontSize: 13, outline: 'none' }}
                      placeholder="e.g. Lead Engineer"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {formData.status === 'IN_PROGRESS' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ gridColumn: 'span 2', overflow: 'hidden' }}
              >
                <div style={{ padding: 20, borderRadius: 16, background: 'rgba(212, 175, 55, 0.03)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#D4AF37', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operational Sync: Actual Start Date</label>
                  <div style={{ position: 'relative' }}>
                    <Timer size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(212, 175, 55, 0.4)' }} />
                    <input 
                      type="datetime-local" 
                      value={toLocalISO(formData.actualStartDate || '', formData.timeZone || '')} 
                      onChange={e => setFormData({ ...formData, actualStartDate: fromLocalISO(e.target.value, formData.timeZone || '') })}
                      style={{ width: '100%', padding: '10px 16px 10px 38px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(212, 175, 55, 0.15)', color: 'white', fontSize: 13, outline: 'none' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dynamic Completion Density — changes based on status */}
          {formData.status === 'NOT_STARTED' ? (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completion Density (%)</label>
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#64748b' }} />
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Not Started — 0%</span>
              </div>
            </div>
          ) : formData.status === 'PENDING_REVIEW' ? (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completion Density (%)</label>
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Pause size={16} style={{ color: '#f59e0b' }} />
                  <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 700 }}>HOLDING — Pending Review</span>
                </div>
                {formData.pendingReviewDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Timer size={12} style={{ color: '#f59e0b', opacity: 0.7 }} />
                    <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, fontFamily: 'monospace' }}>
                      {(() => {
                        const ms = Date.now() - new Date(formData.pendingReviewDate).getTime();
                        const hrs = Math.floor(ms / 3600000);
                        const mins = Math.floor((ms % 3600000) / 60000);
                        if (hrs >= 24) {
                          const days = Math.floor(hrs / 24);
                          return `${days}d ${hrs % 24}h`;
                        }
                        return `${hrs}h ${mins}m`;
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : formData.status === 'COMPLETED' ? (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completion Density (%)</label>
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                <span style={{ fontSize: 13, color: '#34d399', fontWeight: 700 }}>Complete — 100%</span>
              </div>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completion Density ({formData.completion}%)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input 
                  type="range" 
                  min="0" max="100"
                  value={formData.completion} 
                  onChange={e => setFormData({ ...formData, completion: parseInt(e.target.value) || 0 })}
                  style={{ flex: 1, accentColor: (formData.completion || 0) >= 80 ? '#10b981' : (formData.completion || 0) >= 50 ? '#D4AF37' : '#f59e0b', height: 6 }}
                />
                <span className="font-mono-data" style={{ fontSize: 15, fontWeight: 700, color: 'white', minWidth: 40, textAlign: 'right' }}>{formData.completion}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: 8 }}>
                <div style={{ height: '100%', borderRadius: 2, width: `${formData.completion}%`, background: (formData.completion || 0) >= 80 ? '#10b981' : (formData.completion || 0) >= 50 ? '#D4AF37' : '#f59e0b', transition: 'width 200ms' }} />
              </div>
            </div>
          )}

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>File Share Link</label>
            <div style={{ position: 'relative' }}>
              <Tag size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input 
                type="url" 
                value={formData.fileShareLink ?? ''} 
                onChange={e => setFormData({ ...formData, fileShareLink: e.target.value })}
                style={{ width: '100%', padding: '12px 16px 12px 38px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none' }}
                placeholder="SharePoint/OneDrive/Server Link"
              />
            </div>
          </div>

          {/* Related Files Section */}
          <div style={{ gridColumn: 'span 2', padding: '24px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Paperclip size={16} style={{ color: '#D4AF37' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Related Files Index</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {formData.files?.map((file, idx) => (
                <div key={file.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{file.name}</p>
                      <p style={{ fontSize: 10, color: 'var(--text-dim)', margin: 0 }}>{file.type.toUpperCase()} • {file.size}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const newFiles = [...(formData.files || [])];
                      newFiles.splice(idx, 1);
                      setFormData({ ...formData, files: newFiles, attachments: newFiles.length });
                    }}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {(!formData.files || formData.files.length === 0) && (
                <p style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', padding: '10px 0', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 10 }}>No documents linked to this record.</p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10 }}>
              <input 
                type="text" 
                placeholder="File name (e.g. Design Specs)"
                value={newFile.name}
                onChange={e => setNewFile({ ...newFile, name: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 12, outline: 'none' }}
              />
              <input 
                type="url" 
                placeholder="File URL link"
                value={newFile.url}
                onChange={e => setNewFile({ ...newFile, url: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 12, outline: 'none' }}
              />
              <button 
                onClick={() => {
                  if (newFile.name && newFile.url) {
                    const file: TaskFile = {
                      id: `file-${Date.now()}`,
                      name: newFile.name,
                      url: newFile.url,
                      type: 'pdf',
                      size: 'MB',
                      updatedAt: new Date().toISOString()
                    };
                    const newFiles = [...(formData.files || []), file];
                    setFormData({ ...formData, files: newFiles, attachments: newFiles.length });
                    setNewFile({ name: '', url: '', type: 'pdf' });
                    showToast('Document record appended.', 'SUCCESS');
                  }
                }}
                style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700 }}
              >
                <Plus size={14} /> ADD
              </button>
            </div>
          </div>

          {/* Quick Links Section */}
          <div style={{ gridColumn: 'span 2', padding: '24px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Link size={16} style={{ color: '#D4AF37' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operational Quick Links</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {formData.links?.map((link, idx) => (
                <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: 10, border: '1px solid rgba(212, 175, 55, 0.15)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#D4AF37' }}>{link.label}</span>
                  <button 
                    onClick={() => {
                      const newLinks = [...(formData.links || [])];
                      newLinks.splice(idx, 1);
                      setFormData({ ...formData, links: newLinks });
                    }}
                    style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', padding: 2, display: 'flex', opacity: 0.6 }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {(!formData.links || formData.links.length === 0) && (
                <p style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', width: '100%', padding: '10px 0' }}>No external link vectors configured.</p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10 }}>
              <input 
                type="text" 
                placeholder="Link label (e.g. Dashboard)"
                value={newLink.label}
                onChange={e => setNewLink({ ...newLink, label: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 12, outline: 'none' }}
              />
              <input 
                type="url" 
                placeholder="Target URL address"
                value={newLink.url}
                onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 12, outline: 'none' }}
              />
              <button 
                onClick={() => {
                  if (newLink.label && newLink.url) {
                    const link: TaskLink = {
                      id: `link-${Date.now()}`,
                      label: newLink.label,
                      url: newLink.url
                    };
                    setFormData({ ...formData, links: [...(formData.links || []), link] });
                    setNewLink({ label: '', url: '' });
                    showToast('Network vector appended.', 'SUCCESS');
                  }
                }}
                style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700 }}
              >
                <Plus size={14} /> CONNECT
              </button>
            </div>
          </div>


          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Request Origin Date/Time</label>
            <input 
              type="datetime-local"
              value={toLocalISO(formData.requestDate || '', formData.timeZone || '')} 
              onChange={e => setFormData({ ...formData, requestDate: fromLocalISO(e.target.value, formData.timeZone || '') })}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operational Deadline (Due)</label>
            <input 
              type="datetime-local"
              value={toLocalISO(formData.dueDate || '', formData.timeZone || '')} 
              onChange={e => setFormData({ ...formData, dueDate: fromLocalISO(e.target.value, formData.timeZone || '') })}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none' }}
            />
          </div>

          {errorMsg && (
            <div style={{ gridColumn: 'span 2', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
              <X size={16} color="#ef4444" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#f87171', margin: 0, fontWeight: 600 }}>{errorMsg}</p>
            </div>
          )}
        </div>

        <div style={{ padding: '24px 32px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {task ? (
             <button onClick={() => setIsConfirmOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Trash2 size={16} />
              Terminate Record
            </button>
          ) : <div />}
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', color: 'white', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Cancel</button>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', 
                borderRadius: 10, background: isSaving ? 'rgba(212, 175, 55, 0.5)' : '#D4AF37', 
                color: '#0a0a0f', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', 
                fontSize: 14, fontWeight: 700 
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  SYNCHING...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Commit Changes
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      <EliteConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Asset Termination"
        message={`Authorize the irreversible destruction of record: ${task?.title || 'this task'}? This action will purge all associated lifecycle data.`}
        confirmLabel="Authorize Wipe"
        severity="DANGER"
      />
    </div>
  );
}
