'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Calendar, Search, ChevronDown, Check, Plus, Link, Shield, Lock, Clock, CheckCircle2, Globe, FileCode, Loader2, UserCheck, Activity, Tag, Building2, Pencil } from 'lucide-react';
import { Task, TaskStatus, TaskLink, Department, NetworkVector } from '@/lib/types';
import { upsertTask, deleteTask, updateMetadataSuggestions, atomicRenumberTask } from '@/services/FirebaseService';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';
import EliteConfirmModal from '@/components/shared/EliteConfirmModal';
import { useToast } from '@/components/shared/EliteToast';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import EliteDatePicker from '@/components/shared/EliteDatePicker';
import { PRECINCTS } from '@/lib/constants';

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
  if (!utcString) return '';
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

  const [membersSnapshot] = useCollection(query(collection(db, 'members'), orderBy('name', 'asc')));
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
    vectors: [],
    submittingDate: new Date().toISOString(),
    pendingReviewDate: null,
    submitterName: '',
    submitterEmail: '',
    submitterId: '',
    precinct: ''
  });

  const personnel = useMemo<{ name: string; email: string; id: string; status?: string; department: string }[]>(() => {
    const list = (membersSnapshot?.docs
      .map((d: any) => {
        const data = d.data();
        return {
          name: data.name || 'Anonymous',
          email: data.email || '',
          id: d.id,
          status: data.status,
          department: data.department || ''
        };
      }) || []);

    // Only show ACTIVE project team members within the selected department (or legacy members without status)
    const selectedDept = departments.find(d => d.id === formData.department || d.name === formData.department);
    const selectedDeptId = selectedDept?.id;
    const selectedDeptName = selectedDept?.name;

    return list.filter(p => {
      const isStatusValid = p.status === 'ACTIVE' || !p.status;

      // Real-time filtering based on category ID (Normalized) or Name (Legacy)
      const matchesId = selectedDeptId && p.department === selectedDeptId;
      const matchesName = selectedDeptName && p.department?.toLowerCase() === selectedDeptName.toLowerCase();
      const respondsToDepartment = matchesId || matchesName;

      return isStatusValid && respondsToDepartment;
    });
  }, [membersSnapshot, formData.department, departments]);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { showToast } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [newVector, setNewVector] = useState<Partial<NetworkVector>>({ type: '', cde: '', label: '', url: '' });
  const [showErrors, setShowErrors] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const originalIdRef = useRef<string | null>(null);

  const [metadataSnapshot] = useDocument(doc(db, 'settings', 'taskMetadata'));
  const suggestions = useMemo(() => {
    const data = metadataSnapshot?.data();
    return {
      types: Array.from(new Set((data?.deliverableTypes || []) as string[])),
      cdes: Array.from(new Set((data?.cdeEnvironments || []) as string[]))
    };
  }, [metadataSnapshot]);

  const getAbbr = useCallback((identifier: string) => {
    // Lookup by ID first, then by name
    const d = departments.find(dept => dept.id === identifier || dept.name === identifier);
    return d?.abbreviation || (identifier ? identifier.slice(0, 3).toUpperCase() : '???');
  }, [departments]);

  const generateNewId = useCallback((deptName: string) => {
    const abbr = getAbbr(deptName);
    const deptPrefix = `REH - ${abbr} - `;
    const deptTasks = (tasks || []).filter(t => t.id?.startsWith(deptPrefix));
    let nextCount = 100;
    if (deptTasks.length > 0) {
      const counts = deptTasks.map(t => {
        const parts = t.id.split(' - ');
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
        vectors: task.vectors || [],
        submittingDate: task.submittingDate || (task as any).actualEndDate || (task as any).actualStartDate || new Date().toISOString(),
        submitterName: task.submitterName || '',
        submitterEmail: task.submitterEmail || '',
        submitterId: task.submitterId || '',
        precinct: task.precinct || '',
      });

      // Migration check: if vectors missing but types/cdes/links exist, attempt simple mapping
      if (!task.vectors || task.vectors.length === 0) {
        const legacyLinks = task.links || [];
        const legacyTypes = task.deliverableType || [];
        const legacyCdes = task.cde || [];

        if (legacyLinks.length > 0) {
          const migratedVectors: NetworkVector[] = legacyLinks.map((link, i) => ({
            id: link.id || `migrated-${i}-${Date.now()}`,
            label: link.label,
            url: link.url,
            type: legacyTypes[i] || legacyTypes[0] || 'UNSPECIFIED',
            cde: legacyCdes[i] || legacyCdes[0] || 'UNSPECIFIED'
          }));
          setFormData(prev => ({ ...prev, vectors: migratedVectors }));
        }
      }
    } else if (isOpen) {
      originalIdRef.current = null;
      const newId = generateNewId('BIM'); // Prefix still needs a fallback for generating the numeric part
      setFormData({
        id: newId,
        title: '',
        description: '',
        department: '',
        status: '' as any,
        completion: 0,
        attachments: 0,
        files: [],
        links: [],
        vectors: [],
        tags: [],
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        fileShareLink: '',
        deliverableType: [],
        cde: [],
        submittingDate: '',
        pendingReviewDate: null,
        submitterName: '',
        submitterEmail: '',
        submitterId: '',
        precinct: '',
        updatedAt: new Date().toISOString(),
      });
      setShowErrors(false);
    }
  }, [task, isOpen, departments, tasks, generateNewId]);

  const handleSave = async () => {
    // Blocking Validation for Mandatory Fields
    const hasVectors = (formData.vectors || []).length > 0;
    if (!formData.title?.trim() || !formData.department || !formData.precinct?.trim() || !formData.submitterId || !formData.status || !formData.submittingDate || !hasVectors) {
      setShowErrors(true);
      showToast('Please fill in all fields. Only Notes are optional.', 'ERROR');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      const finalTask = {
        ...formData,
        updatedAt: new Date().toISOString(),
      } as Task;

      // Update global suggestions (Non-blocking background sync)
      if (formData.deliverableType || formData.cde) {
        updateMetadataSuggestions(formData.deliverableType || [], formData.cde || []);
      }

      const idChanged = originalIdRef.current && finalTask.id !== originalIdRef.current;

      if (idChanged && originalIdRef.current) {
        await atomicRenumberTask(originalIdRef.current, finalTask);
      } else {
        await upsertTask(finalTask);
      }

      showToast('Task saved successfully.', 'SUCCESS');
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      setErrorMsg(getFirebaseErrorMessage(error));
      showToast('Could not save task. Please try again.', 'ERROR');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    try {
      await deleteTask(task.id);
      showToast('Task deleted successfully.', 'SUCCESS');
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
      setErrorMsg(getFirebaseErrorMessage(error));
      showToast('Could not delete task.', 'ERROR');
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0, 63, 73, 0.45)', backdropFilter: 'blur(16px)' }}></motion.div>
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '100%', maxWidth: 780, background: 'linear-gradient(165deg, #F9F8F2 0%, #FFFFFF 100%)', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: 28, position: 'relative', zIndex: 1, overflow: 'hidden', boxShadow: '0 30px 100px rgba(0, 63, 73, 0.15)' }}>

        {/* Header - Executive Protocol */}
        <div style={{ padding: '24px 32px', borderBottom: '1.5px solid rgba(0, 63, 73, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0, 63, 73, 0.03)' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 950, color: '#003F49', letterSpacing: '0.08em', margin: 0, textTransform: 'uppercase' }}>{task ? 'Edit Task Protocol' : 'Create New Task'}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Shield size={10} color="#D4AF37" />
              <p style={{ fontSize: 10, color: '#003F49', margin: 0, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 900 }}>Protocol ID: {formData.id || 'Registry Pending'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#ffffff', border: '1px solid rgba(0, 63, 73, 0.15)', color: '#003F49', cursor: 'pointer', width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 200ms', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#003F49'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0, 63, 73, 0.15)'}><X size={20} /></button>
        </div>

        {/* Form Body - Performance Spacing & Dual Column Grid */}
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 32, maxHeight: '72vh', overflowY: 'auto' }} className="elite-scrollbar">

          {isActuallyReadOnly && (
            <div style={{ padding: '14px 20px', borderRadius: 14, background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)', display: 'flex', gap: 12, alignItems: 'center' }}>
              <Lock size={16} color="#D4AF37" />
              <p style={{ fontSize: 12, color: '#003F49', margin: 0, fontWeight: 800 }}>READ-ONLY ACCESS: Administrative override signature required for mutation.</p>
            </div>
          )}

          {/* Primary Header Fields Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 32px' }}>
            {/* Task Title - Full Span */}
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 950, color: '#003F49', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Unified Task Title</span>
              </div>
              <input
                type="text"
                value={formData.title ?? ''}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                disabled={isActuallyReadOnly}
                style={{
                  width: '100%', padding: '14px 18px', borderRadius: 14, background: '#ffffff',
                  border: (showErrors && !formData.title?.trim()) ? '2px solid #ef4444' : '1px solid rgba(0, 0, 0, 0.12)',
                  color: '#0a1220', fontSize: 15, fontWeight: 800, outline: 'none', transition: 'all 200ms', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                }}
                onFocus={e => e.target.style.borderColor = (showErrors && !formData.title?.trim()) ? '#ef4444' : '#003F49'}
                onBlur={e => e.target.style.borderColor = (showErrors && !formData.title?.trim()) ? '#ef4444' : 'rgba(0, 0, 0, 0.12)'}
                placeholder="Enter task name"
              />
            </div>


            {/* Submission Date */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Calendar size={12} color="#D4AF37" />
                <span style={{ fontSize: 10, fontWeight: 950, color: '#003F49', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Submission Date</span>
              </div>
              <EliteDatePicker
                value={formData.submittingDate || ''}
                onChange={val => setFormData({ ...formData, submittingDate: val })}
                disabled={isActuallyReadOnly}
                error={showErrors && !formData.submittingDate}
              />
            </div>

            {/* Project Precinct */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Building2 size={12} color="#003F49" />
                <span style={{ fontSize: 10, fontWeight: 950, color: '#003F49', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Project Precinct</span>
              </div>
              <div style={{ position: 'relative' }}>
                <select
                  value={formData.precinct ?? ''}
                  onChange={e => setFormData({ ...formData, precinct: e.target.value })}
                  disabled={isActuallyReadOnly}
                  style={{
                    width: '100%', padding: '14px 18px', borderRadius: 14, background: '#ffffff',
                    border: (showErrors && !formData.precinct?.trim()) ? '2px solid #ef4444' : '1px solid rgba(0, 0, 0, 0.12)',
                    color: '#0a1220', fontSize: 14, fontWeight: 700, outline: 'none', appearance: 'none'
                  }}
                >
                  <option value="">Select Precinct</option>
                  {PRECINCTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <div style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#003F49', opacity: 0.5 }}>
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Tag size={12} color="#003F49" />
                <span style={{ fontSize: 10, fontWeight: 950, color: '#003F49', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Task Category</span>
              </div>
              <select
                value={departments.find(d => d.id === formData.department || d.name === formData.department)?.id || ''}
                onChange={e => handleDeptChange(e.target.value)}
                disabled={isActuallyReadOnly}
                style={{
                  width: '100%', padding: '14px 18px', borderRadius: 14, background: '#ffffff',
                  border: (showErrors && !formData.department) ? '2px solid #ef4444' : '1px solid rgba(0, 0, 0, 0.12)',
                  color: '#0a1220', fontSize: 14, fontWeight: 700, outline: 'none', appearance: 'none'
                }}
              >
                <option value="">Select Category</option>
                {departments.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
            </div>

            {/* Submitter */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <UserCheck size={12} color="#D4AF37" />
                <span style={{ fontSize: 10, fontWeight: 950, color: '#003F49', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Submitter Signature</span>
              </div>
              <select
                value={formData.submitterId || ''}
                onChange={e => {
                  const selected = personnel.find(p => p.id === e.target.value);
                  setFormData({
                    ...formData,
                    submitterId: e.target.value,
                    submitterEmail: selected ? selected.email : '',
                    submitterName: selected ? selected.name : ''
                  });
                }}
                disabled={isActuallyReadOnly || !formData.department}
                style={{
                  width: '100%', padding: '14px 18px', borderRadius: 14,
                  background: (!formData.department || isActuallyReadOnly) ? 'rgba(0,0,0,0.02)' : '#ffffff',
                  border: (showErrors && !formData.submitterId) ? '2px solid #ef4444' : '1px solid rgba(0, 0, 0, 0.12)',
                  color: '#0a1220', fontSize: 14, fontWeight: 700, outline: 'none',
                  cursor: (!formData.department || isActuallyReadOnly) ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="">{formData.department ? 'Unassigned Personnel' : 'Select Task Category First'}</option>
                {personnel.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>

            {/* Operational Status */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Activity size={12} color="#003F49" />
                <span style={{ fontSize: 10, fontWeight: 950, color: '#003F49', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Operational Status</span>
              </div>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                disabled={isActuallyReadOnly}
                style={{
                  width: '100%', padding: '14px 18px', borderRadius: 14, background: '#ffffff',
                  border: (showErrors && !formData.status) ? '2px solid #ef4444' : '1px solid rgba(0, 0, 0, 0.12)',
                  color: '#0a1220', fontSize: 14, fontWeight: 700, outline: 'none'
                }}
              >
                <option value="">Select Status</option>
                {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>

          {/* Network Vector Terminal */}
          <div style={{
            padding: '12px 24px', borderRadius: 24, background: 'rgba(0, 63, 73, 0.02)',
            border: (showErrors && (!formData.vectors || formData.vectors.length === 0)) ? '2px solid #ef4444' : '1.5px solid rgba(0, 63, 73, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#003F49', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: '0 8px 20px rgba(0, 63, 73, 0.2)' }}>
                <Link size={20} />
              </div>
              <div>
                <span style={{ fontSize: 13, fontWeight: 950, color: '#003F49', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Network Vector Terminal</span>
                <span style={{ fontSize: 10, color: 'rgba(0, 63, 73, 0.5)', fontWeight: 800 }}>Unified Deliverable Triplet Synchronization</span>
              </div>
            </div>

            {/* Vector Entries */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {(formData.vectors || []).map((vector, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={vector.id || idx}
                  style={{
                    display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) minmax(100px, 0.8fr) minmax(200px, 2fr) auto auto',
                    gap: 16, alignItems: 'center', padding: '14px 20px', background: editIndex === idx ? 'rgba(212, 175, 55, 0.05)' : '#ffffff', borderRadius: 16,
                    border: editIndex === idx ? '1px solid #D4AF37' : '1px solid rgba(0, 0, 0, 0.08)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileCode size={14} color="#003F49" />
                    <span style={{ fontSize: 11, fontWeight: 900, color: '#003F49', textTransform: 'uppercase' }}>{vector.type}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Globe size={14} color="#D4AF37" />
                    <span style={{ fontSize: 11, fontWeight: 950, color: '#D4AF37' }}>{vector.cde}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0a1220', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {vector.label}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        setNewVector({ ...vector });
                        setEditIndex(idx);
                      }}
                      style={{ background: 'rgba(0, 63, 73, 0.05)', border: 'none', color: '#003F49', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex', transition: 'all 200ms' }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => {
                        const newVectors = [...(formData.vectors || [])];
                        newVectors.splice(idx, 1);
                        setFormData({ ...formData, vectors: newVectors });
                        if (editIndex === idx) {
                          setEditIndex(null);
                          setNewVector({ type: '', cde: '', label: '', url: '' });
                        }
                      }}
                      style={{ background: 'rgba(239, 68, 68, 0.05)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
              {(!formData.vectors || formData.vectors.length === 0) && (
                <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.5)', borderRadius: 20, border: '1.5px dashed rgba(0, 63, 73, 0.1)' }}>
                  <p style={{ fontSize: 12, color: 'rgba(0, 63, 73, 0.4)', margin: 0, fontWeight: 700, fontStyle: 'italic' }}>No technical vectors established for this protocol.</p>
                </div>
              )}
            </div>

            {/* Connector Form */}
            {!isActuallyReadOnly && (
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: 20, border: '1px solid rgba(0, 63, 73, 0.15)', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 9, fontWeight: 950, color: '#003F49', textTransform: 'uppercase' }}>Deliverable Type</label>
                    <input type="text" list="type-suggestions" placeholder="e.g. RVT, PDF" value={newVector.type} onChange={e => setNewVector({ ...newVector, type: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#F9F8F2', border: '1px solid rgba(0, 0, 0, 0.1)', color: '#0a1220', fontSize: 13, fontWeight: 700, outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 9, fontWeight: 950, color: '#D4AF37', textTransform: 'uppercase' }}>CDE Node</label>
                    <input type="text" list="cde-suggestions" placeholder="e.g. ACC, Viewpoint" value={newVector.cde} onChange={e => setNewVector({ ...newVector, cde: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#F9F8F2', border: '1px solid rgba(0, 0, 0, 0.1)', color: '#0a1220', fontSize: 13, fontWeight: 700, outline: 'none' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr auto', gap: 16, alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 9, fontWeight: 950, color: '#0a1220', textTransform: 'uppercase', opacity: 0.6 }}>Link Label</label>
                    <input type="text" placeholder="Access Description" value={newVector.label} onChange={e => setNewVector({ ...newVector, label: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#F9F8F2', border: '1px solid rgba(0, 0, 0, 0.1)', color: '#0a1220', fontSize: 13, fontWeight: 700, outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 9, fontWeight: 950, color: '#0a1220', textTransform: 'uppercase', opacity: 0.6 }}>URL</label>
                    <input type="url" placeholder="https://..." value={newVector.url} onChange={e => setNewVector({ ...newVector, url: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#F9F8F2', border: '1px solid rgba(0, 0, 0, 0.1)', color: '#0a1220', fontSize: 13, fontWeight: 700, outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {editIndex !== null && (
                      <button
                        onClick={() => {
                          setEditIndex(null);
                          setNewVector({ type: '', cde: '', label: '', url: '' });
                        }}
                        style={{ padding: '12px 24px', borderRadius: 12, background: 'transparent', color: '#003F49', border: '1px solid rgba(0, 63, 73, 0.15)', cursor: 'pointer', fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (newVector.type && newVector.cde && newVector.url) {
                          const vector: NetworkVector = {
                            id: editIndex !== null ? (formData.vectors?.[editIndex]?.id || `vec-${Date.now()}`) : `vec-${Date.now()}`,
                            type: newVector.type,
                            cde: newVector.cde,
                            label: newVector.label || newVector.type,
                            url: newVector.url
                          };
                          
                          const newVectors = [...(formData.vectors || [])];
                          if (editIndex !== null) {
                            newVectors[editIndex] = vector;
                          } else {
                            newVectors.push(vector);
                          }
                          
                          setFormData({ ...formData, vectors: newVectors });
                          setNewVector({ type: '', cde: '', label: '', url: '' });
                          setEditIndex(null);
                          showToast(editIndex !== null ? 'Link updated successfully.' : 'Link added successfully.', 'SUCCESS');
                        } else {
                          showToast('Please fill in all link details.', 'INFO');
                        }
                      }}
                      style={{ padding: '12px 24px', borderRadius: 12, background: '#003F49', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 4px 12px rgba(0, 63, 73, 0.2)' }}
                    >
                      {editIndex !== null ? 'Update Vector' : 'Connect Vector'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 950, color: '#003F49', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Notes (Optional)</span>
            </div>
            <textarea
              value={formData.description ?? ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              disabled={isActuallyReadOnly}
              rows={3}
              style={{ width: '100%', padding: '14px 18px', borderRadius: 18, background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.12)', color: '#0a1220', fontSize: 14, fontWeight: 700, outline: 'none', resize: 'none', transition: 'all 200ms' }}
              placeholder="Additional operational parameters..."
              onFocus={e => e.target.style.borderColor = '#003F49'}
              onBlur={e => e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)'}
            />
          </div>
        </div>

        {/* Footer - Command Center */}
        <div style={{ padding: '24px 32px', background: 'rgba(0, 63, 73, 0.04)', borderTop: '1.5px solid rgba(0, 63, 73, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setIsConfirmOpen(true)} disabled={!task || !canDelete} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '10px 16px', borderRadius: 12, fontSize: 11, fontWeight: 900, cursor: (!task || !canDelete) ? 'not-allowed' : 'pointer', opacity: (!task || !canDelete) ? 0.3 : 1, transition: 'all 200ms' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}>
            <Trash2 size={16} /> TERMINATE RECORD
          </button>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: 14, background: '#ffffff', color: '#003F49', border: '1px solid rgba(0, 63, 73, 0.15)', cursor: 'pointer', fontSize: 13, fontWeight: 800, transition: 'all 200ms' }}>Dismiss</button>
            {!isActuallyReadOnly && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 32px', borderRadius: 14, background: 'linear-gradient(to right, #003F49, #005663)', color: '#ffffff', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 950, boxShadow: '0 8px 24px rgba(0, 63, 73, 0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? 'Synching...' : 'Commit Changes'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
      <EliteConfirmModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} title="Asset Termination Request" message={`Authorize the irreversible destruction of record: ${task?.title || 'this task'}?`} confirmLabel="Authorize Wipe" severity="DANGER" />
      <style jsx>{`
        .elite-scrollbar::-webkit-scrollbar { width: 6px; }
        .elite-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .elite-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 63, 73, 0.1); border-radius: 10px; }
        .elite-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 63, 73, 0.2); }
      `}</style>
    </div>
  );
}
