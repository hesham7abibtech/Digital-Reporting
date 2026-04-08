'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Calendar, User, Tag, Activity, Loader2 } from 'lucide-react';
import { Task, Priority, TaskStatus, TeamMember } from '@/lib/types';
import { upsertTask, deleteTask } from '@/services/FirebaseService';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';

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
  });
  const [showCustomDept, setShowCustomDept] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      setErrorMsg(getFirebaseErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (confirm('Are you sure you want to delete this task? This action is irreversible.')) {
      try {
        await deleteTask(task.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete task:', error);
        setErrorMsg(getFirebaseErrorMessage(error));
      }
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
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 15, outline: 'none' }}
              placeholder="System migration..."
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
                      assigneeAvatar: m.avatar || '' 
                    });
                  }
                }}
                style={{ width: '100%', padding: '12px 16px 12px 38px', borderRadius: 12, background: '#1a1a24', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none', appearance: 'none' }}
              >
                <option value="">Select Team Member</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.department})</option>
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
                value={formData.requesterName} 
                onChange={e => setFormData({ ...formData, requesterName: e.target.value })}
                style={{ width: '100%', padding: '12px 16px 12px 38px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none' }}
                placeholder="Name of entity requesting task"
              />
            </div>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operational Time Zone (Deadlines Intelligence)</label>
            <select 
              value={formData.timeZone} 
              onChange={e => handleTZChange(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#1a1a24', border: '1px solid rgba(59, 130, 246, 0.3)', color: 'white', fontSize: 14, outline: 'none', boxShadow: '0 0 15px rgba(59, 130, 246, 0.05)' }}
            >
              <optgroup label="Quick Access (Regional Core)">
                {commonTimeZones.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
              </optgroup>
              <optgroup label="All Global Nodes">
                {allTimeZones.map((tz: string) => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
              </optgroup>
            </select>
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
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                style={{ width: '100%', padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59, 130, 246, 0.3)', color: 'white', fontSize: 13, outline: 'none', marginTop: 8 }}
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
                    background: formData.priority === p ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                    color: formData.priority === p ? '#3b82f6' : '#64748b',
                    border: formData.priority === p ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255,255,255,0.04)',
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
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#1a1a24', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none' }}
            >
              {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completion Density (%)</label>
            <input 
              type="number" 
              min="0" max="100"
              value={formData.completion} 
              onChange={e => setFormData({ ...formData, completion: parseInt(e.target.value) || 0 })}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none' }}
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>File Share Node (Link)</label>
            <div style={{ position: 'relative' }}>
              <Tag size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input 
                type="url" 
                value={formData.fileShareLink} 
                onChange={e => setFormData({ ...formData, fileShareLink: e.target.value })}
                style={{ width: '100%', padding: '12px 16px 12px 38px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none' }}
                placeholder="SharePoint/OneDrive/Server Link"
              />
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
             <button onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
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
                borderRadius: 10, background: isSaving ? 'rgba(59, 130, 246, 0.5)' : '#3b82f6', 
                color: 'white', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', 
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
    </div>
  );
}
