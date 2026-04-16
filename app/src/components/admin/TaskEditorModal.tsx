'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Calendar, Search, ChevronDown, Check, Plus, Link, Shield, Lock, Clock, CheckCircle2 } from 'lucide-react';
import { Task, TaskStatus, TaskLink, Department } from '@/lib/types';
import { upsertTask, deleteTask, updateMetadataSuggestions } from '@/services/FirebaseService';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';
import EliteConfirmModal from '@/components/shared/EliteConfirmModal';
import { useToast } from '@/components/shared/EliteToast';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TaskEditorProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  readOnly?: boolean;
  canDelete?: boolean;
  canApprove?: boolean;
  tasks?: Task[];
}

const statuses: TaskStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED', 'DELAYED', 'BLOCKED'];

// Helpers for Date-only display (YYYY-MM-DD)
const toLocalISO = (utcString: string | null | undefined, timeZone: string) => {
  if (!utcString) return new Date().toISOString().split('T')[0];
  try {
    const date = new Date(utcString);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      timeZone
    });
    return formatter.format(date); // YYYY-MM-DD
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
};

const fromLocalISO = (localString: string, timeZone: string) => {
  try {
    const [year, month, day] = localString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
    const offset = utcDate.getTime() - tzDate.getTime();
    return new Date(date.getTime() + offset).toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
};

export default function TaskEditorModal({ task, isOpen, onClose, readOnly, canDelete, canApprove, tasks }: TaskEditorProps) {
  const [deptsSnapshot] = useCollection(query(collection(db, 'departments'), orderBy('name', 'asc')));
  const departments = useMemo(() => 
    deptsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() } as Department)) || [], 
  [deptsSnapshot]);

  const [usersSnapshot] = useCollection(query(collection(db, 'users'), orderBy('name', 'asc')));
  const personnel = useMemo(() => 
    usersSnapshot?.docs.map(d => (d.data() as any).name as string) || [], 
  [usersSnapshot]);

  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    department: 'BIM',
    status: 'NOT_STARTED',
    completion: 0,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    fileShareLink: '',
    deliverableType: [],
    cde: [],
    submittingDate: new Date().toISOString(),
    pendingReviewDate: null,
    submitterName: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { showToast } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [newLink, setNewLink] = useState({ label: '', url: '' });
  const [newType, setNewType] = useState('');
  const [newCde, setNewCde] = useState('');
  const originalIdRef = useRef<string | null>(null);

  const [metadataSnapshot] = useDocument(doc(db, 'settings', 'taskMetadata'));
  const suggestions = useMemo(() => {
    const data = metadataSnapshot?.data();
    return {
      types: (data?.deliverableTypes || []) as string[],
      cdes: (data?.cdeEnvironments || []) as string[]
    };
  }, [metadataSnapshot]);

  const getAbbr = useCallback((name: string) => {
    const d = departments.find(dept => dept.name === name);
    return d?.abbreviation || (name ? name.slice(0, 3).toUpperCase() : '???');
  }, [departments]);

  const generateNewId = useCallback((deptName: string) => {
    const abbr = getAbbr(deptName);
    const deptPrefix = `REH-${abbr}-`;
    const deptTasks = (tasks || []).filter(t => t.id?.startsWith(deptPrefix));
    let nextCount = 100;
    if (deptTasks.length > 0) {
      const counts = deptTasks.map(t => {
        const parts = t.id.split('-');
        const lastPart = parts[parts.length - 1];
        const num = parseInt(lastPart);
        return isNaN(num) ? 0 : num;
      });
      nextCount = Math.max(...counts, 99) + 1;
    }
    return `${deptPrefix}${nextCount}`;
  }, [getAbbr, tasks]);

  useEffect(() => {
    if (task) {
      originalIdRef.current = task.id;
      setFormData({
        ...task,
        title: task.title || '',
        description: task.description || '',
        department: task.department || 'BIM',
        status: task.status || 'NOT_STARTED',
        completion: task.completion || 0,
        timeZone: task.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        fileShareLink: task.fileShareLink || '',
        deliverableType: Array.isArray(task.deliverableType) ? task.deliverableType : (task.deliverableType ? [task.deliverableType] : []),
        cde: Array.isArray(task.cde) ? task.cde : (task.cde ? [task.cde] : []),
        submittingDate: task.submittingDate || (task as any).actualEndDate || (task as any).actualStartDate || new Date().toISOString(),
        submitterName: task.submitterName || '',
      });
    } else if (isOpen) {
      originalIdRef.current = null;
      const defaultDept = departments.length > 0 ? departments[0].name : 'BIM';
      const newId = generateNewId(defaultDept);
      setFormData({
        id: newId,
        title: '',
        description: '',
        department: defaultDept,
        status: 'NOT_STARTED',
        completion: 0,
        attachments: 0,
        files: [],
        links: [],
        tags: [],
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        fileShareLink: '',
        deliverableType: [],
        cde: [],
        submittingDate: new Date().toISOString(),
        pendingReviewDate: null,
        submitterName: '',
        updatedAt: new Date().toISOString(),
      });
    }
  }, [task, isOpen, departments, tasks, generateNewId]);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const finalTask = {
        ...formData,
        updatedAt: new Date().toISOString(),
      } as Task;
      
      // Update global suggestions
      if (formData.deliverableType || formData.cde) {
        await updateMetadataSuggestions(formData.deliverableType || [], formData.cde || []);
      }

      const idChanged = originalIdRef.current && finalTask.id !== originalIdRef.current;
      await upsertTask(finalTask);
      if (idChanged && originalIdRef.current) await deleteTask(originalIdRef.current);
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

  const isActuallyReadOnly = readOnly || (!task && readOnly);

  const handleDeptChange = (val: string) => {
    const newId = generateNewId(val);
    setFormData(prev => ({ ...prev, department: val, id: newId }));
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0, 63, 73, 0.3)', backdropFilter: 'blur(12px)' }}></motion.div>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '100%', maxWidth: 700, background: 'var(--cotton)', border: '1px solid var(--border)', borderRadius: 28, position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--teal)', letterSpacing: '-0.02em', margin: 0 }}>{task ? 'Edit Task Record' : 'Create New Task'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={24} /></button>
        </div>
        <div style={{ padding: 32, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, maxHeight: '80vh', overflowY: 'auto' }}>
          {isActuallyReadOnly && (
            <div style={{ gridColumn: 'span 2', padding: '12px 16px', borderRadius: 12, background: 'rgba(212, 175, 55, 0.05)', border: '1px solid var(--secondary)', display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
              <Shield size={16} color="var(--teal)" />
              <p style={{ fontSize: 13, color: 'var(--teal)', margin: 0, fontWeight: 600 }}>READ-ONLY ACCESS: Your security clearance does not permit modification of this asset.</p>
            </div>
          )}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task Title</label>
            <input type="text" value={formData.title ?? ''} onChange={e => setFormData({ ...formData, title: e.target.value })} disabled={isActuallyReadOnly} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: isActuallyReadOnly ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: isActuallyReadOnly ? '1px solid var(--section-bg)' : '1px solid var(--border)', color: isActuallyReadOnly ? 'var(--text-muted)' : 'white', fontSize: 15, outline: 'none', cursor: isActuallyReadOnly ? 'not-allowed' : 'text' }} placeholder="System migration..." />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Submission Date</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input type="date" value={toLocalISO(formData.submittingDate || '', formData.timeZone || '')} onChange={e => setFormData({ ...formData, submittingDate: fromLocalISO(e.target.value, formData.timeZone || '') })} style={{ width: '100%', padding: '12px 16px 12px 38px', borderRadius: 12, background: 'var(--section-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task Category</label>
            <select value={formData.department} onChange={e => handleDeptChange(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'var(--section-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}>
              <option value="" disabled>Select Category</option>
              {departments.map(d => (<option key={d.id} value={d.name}>{d.name} ({d.abbreviation})</option>))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Submitter (PERSONNEL)</label>
            <select value={formData.submitterName || ''} onChange={e => setFormData({ ...formData, submitterName: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'var(--section-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}>
              <option value="">Unassigned</option>
              {personnel.map(name => (<option key={name} value={name}>{name}</option>))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deliverable Type</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {formData.deliverableType?.map((type, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', background: 'var(--section-bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{type}</span>
                  <button onClick={() => {
                      const newTypes = [...(formData.deliverableType || [])];
                      newTypes.splice(idx, 1);
                      setFormData({ ...formData, deliverableType: newTypes });
                    }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, display: 'flex' }}><X size={10} /></button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" list="type-suggestions" value={newType} onChange={e => setNewType(e.target.value)} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: 'var(--section-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} placeholder="e.g. RVT, DWG" />
              <datalist id="type-suggestions">
                {suggestions.types.map(t => <option key={t} value={t} />)}
              </datalist>
              <button 
                onClick={() => {
                  if (newType.trim()) {
                    setFormData({ ...formData, deliverableType: [...(formData.deliverableType || []), newType.trim()] });
                    setNewType('');
                  }
                }}
                style={{ padding: '0 14px', borderRadius: 10, background: 'var(--section-bg)', color: 'var(--teal)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
              >ADD</button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CDE (Environment)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {formData.cde?.map((env, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', background: 'var(--section-bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{env}</span>
                  <button onClick={() => {
                      const newCdes = [...(formData.cde || [])];
                      newCdes.splice(idx, 1);
                      setFormData({ ...formData, cde: newCdes });
                    }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, display: 'flex' }}><X size={10} /></button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" list="cde-suggestions" value={newCde} onChange={e => setNewCde(e.target.value)} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: 'var(--section-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} placeholder="e.g. Onedrive, ACC" />
              <datalist id="cde-suggestions">
                {suggestions.cdes.map(c => <option key={c} value={c} />)}
              </datalist>
              <button 
                onClick={() => {
                  if (newCde.trim()) {
                    setFormData({ ...formData, cde: [...(formData.cde || []), newCde.trim()] });
                    setNewCde('');
                  }
                }}
                style={{ padding: '0 14px', borderRadius: 10, background: 'var(--section-bg)', color: 'var(--teal)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
              >ADD</button>
            </div>
          </div>
          <div style={{ gridColumn: 'span 2', padding: '24px', borderRadius: 16, background: 'var(--section-bg)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Link size={16} style={{ color: 'var(--teal)' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deliverables Links</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {formData.links?.map((link, idx) => (
                <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: 10, border: '1px solid rgba(212, 175, 55, 0.15)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--teal)' }}>{link.label}</span>
                  <button onClick={() => {
                      const newLinks = [...(formData.links || [])];
                      newLinks.splice(idx, 1);
                      setFormData({ ...formData, links: newLinks });
                    }} style={{ background: 'none', border: 'none', color: 'var(--teal)', cursor: 'pointer', padding: 2, display: 'flex', opacity: 0.6 }}><X size={12} /></button>
                </div>
              ))}
              {(!formData.links || formData.links.length === 0) && (<p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', width: '100%', padding: '10px 0' }}>No external deliverables link vectors configured.</p>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10 }}>
              <input type="text" placeholder="Link label (e.g. Dashboard)" value={newLink.label} onChange={e => setNewLink({ ...newLink, label: e.target.value })} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--section-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }} />
              <input type="url" placeholder="Target URL address" value={newLink.url} onChange={e => setNewLink({ ...newLink, url: e.target.value })} style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--section-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }} />
              <button onClick={() => {
                  if (newLink.label && newLink.url) {
                    const link: TaskLink = { id: `link-${Date.now()}`, label: newLink.label, url: newLink.url };
                    setFormData({ ...formData, links: [...(formData.links || []), link] });
                    setNewLink({ label: '', url: '' });
                    showToast('Network vector appended.', 'SUCCESS');
                  }
                }} style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--secondary)', color: 'var(--teal)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700 }}><Plus size={14} /> CONNECT</button>
            </div>
          </div>
          <div style={{ gridColumn: 'span 2', marginTop: 10 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--teal)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</label>
            <textarea value={formData.description ?? ''} onChange={e => setFormData({ ...formData, description: e.target.value })} disabled={isActuallyReadOnly} rows={4} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: isActuallyReadOnly ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', border: isActuallyReadOnly ? '1px solid var(--section-bg)' : '1px solid var(--border)', color: isActuallyReadOnly ? 'var(--text-muted)' : 'white', fontSize: 15, outline: 'none', cursor: isActuallyReadOnly ? 'not-allowed' : 'text', resize: 'vertical' }} placeholder="Additional notes or parameters..." />
          </div>
        </div>
        <div style={{ padding: '24px 32px', background: 'var(--section-bg)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setIsConfirmOpen(true)} disabled={!task || !canDelete} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--status-error)', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, cursor: (!task || !canDelete) ? 'not-allowed' : 'pointer', opacity: (!task || !canDelete) ? 0.3 : 1 }}>
            <Trash2 size={16} /> Terminate Record
          </button>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--section-bg)', color: 'var(--teal)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Dismiss</button>
            {!isActuallyReadOnly && (<button onClick={handleSave} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 10, background: 'var(--teal)', color: '#ffffff', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700 }}><Save size={18} /> {isSaving ? 'Syncing...' : 'Commit Changes'}</button>)}
          </div>
        </div>
      </motion.div>
      <EliteConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} title="Asset Termination" message={`Authorize the irreversible destruction of record: ${task?.title || 'this task'}?`} confirmLabel="Authorize Wipe" severity="DANGER" />
    </div>
  );
}
