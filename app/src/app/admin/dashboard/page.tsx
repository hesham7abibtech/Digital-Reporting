'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Users,
  LayoutDashboard,
  Plus,
  Settings,
  LogOut,
  Database,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Shield,
  Trash2,
  User,
  Loader2,
  Inbox,
  X,
  Check,
  MapPin,
  Building2,
  Cpu,
  Image as ImageIcon,
  ArrowLeft,
  ArrowRight,
  Globe,
  Megaphone,
  Clock,
  Send,
  Bell,
  Newspaper,
  Save,
  ChevronLeft,
  ChevronRight,
  Table,
  FileText,
  Layers,
  FileSpreadsheet,
  Type,
  Activity,
  Upload,
  Grid,
  Zap,
  EyeOff,
  Eye,
  Mail,
  UserPlus
} from 'lucide-react';
import * as XLSX from 'xlsx';

import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { collections, bulkDelete, getProjectMetadata, updateProjectMetadata, uploadFile } from '@/services/FirebaseService';
import { useToast } from '@/components/shared/EliteToast';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';
import { useDocument } from 'react-firebase-hooks/firestore';
import { doc, collection, query, orderBy, deleteDoc, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import GlassCard from '@/components/shared/GlassCard';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Task, TaskStatus, TeamMember, DashboardNavItem, ProjectMetadata, Department, ReportSummaryField, HeaderBadge, BIMReview } from '@/lib/types';
import { PRECINCTS } from '@/lib/constants';
import TaskEditorModal from '@/components/admin/TaskEditorModal';
import MemberEditorModal from '@/components/admin/MemberEditorModal';
import RegistryEditorModal from '@/components/admin/RegistryEditorModal';
import UserEditorModal from '@/components/admin/UserEditorModal';
import DepartmentEditorModal from '@/components/admin/DepartmentEditorModal';
import BIMReviewEditorModal from '@/components/admin/BIMReviewEditorModal';
import BIMImportConfirmModal from '@/components/admin/BIMImportConfirmModal';
import TaskImportConfirmModal from '@/components/admin/TaskImportConfirmModal';
import GroupPolicyList from '@/components/admin/GroupPolicyList';

import GroupPolicyEditor from '@/components/admin/GroupPolicyEditor';
import BulkActionConfirmModal from '@/components/admin/BulkActionConfirmModal';
import EliteConfirmModal from '@/components/shared/EliteConfirmModal';
import HeaderBgCropper from '@/components/admin/HeaderBgCropper';
import HomePageEditor from '@/components/admin/HomePageEditor';

const DEFAULT_ALLOWED_DOMAINS = ['modon.com', 'insiteinternational.com'];

const DEFAULT_SUMMARY_FIELDS: ReportSummaryField[] = [
  { id: 'projectName', label: 'Project Name', value: '', isVisible: true },
  { id: 'reportTitle', label: 'Report Title', value: '', isVisible: true },
  { id: 'periodReference', label: 'Period Reference', value: '', isVisible: true },
  { id: 'temporalReference', label: 'Temporal Period', value: '', isVisible: true },
  { id: 'activeDate', label: 'Active Date Range', value: '', isVisible: true },
  { id: 'generatedOn', label: 'Generated On', value: '', isVisible: true },
  { id: 'totalTasks', label: 'Total Tasks Count', value: '', isVisible: true }
];

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-').toUpperCase();
}

function CommunicationsHub({ showToast, usersSnapshot }: { showToast: any, usersSnapshot: any }) {
  const router = useRouter();
  const [activeHubTab, setActiveHubTab] = useState<'BROADCAST' | 'MAIL'>('BROADCAST');
  const [loading, setLoading] = useState(false);
  
  // Broadcast State
  const [broadcastType, setBroadcastType] = useState<'NOTIF' | 'NEWS'>('NOTIF');
  const [broadcastSeverity, setBroadcastSeverity] = useState<'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS'>('INFO');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastDescription, setBroadcastDescription] = useState('');
  
  // Mail State
  const [mailTarget, setMailTarget] = useState<'ALL' | 'ROLE' | 'SPECIFIC'>('ALL');
  const [targetRole, setTargetRole] = useState('TEAM');
  const [toEmails, setToEmails] = useState('');
  const [ccEmails, setCcEmails] = useState('');
  const [bccEmails, setBccEmails] = useState('');
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');
  const [mailCategory, setMailCategory] = useState('ANNOUNCEMENT');

  const [activeSelectorField, setActiveSelectorField] = useState<'TO' | 'CC' | 'BCC' | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const addEmailToField = (email: string, field: 'TO' | 'CC' | 'BCC') => {
    const setters = { TO: setToEmails, CC: setCcEmails, BCC: setBccEmails };
    const values = { TO: toEmails, CC: ccEmails, BCC: bccEmails };
    
    const current = values[field].split(',').map(e => e.trim()).filter(Boolean);
    if (!current.includes(email)) {
      setters[field]([...current, email].join(', '));
    }
    setActiveSelectorField(null);
  };

  const handleBroadcastDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastDescription) {
      showToast('Payload validation failure: Missing title or content.', 'ERROR');
      return;
    }

    setLoading(true);
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      await addDoc(collection(db, 'broadcasts'), {
        title: broadcastTitle,
        description: broadcastDescription,
        type: broadcastType,
        severity: broadcastSeverity,
        timestamp: new Date().toISOString(),
        readBy: []
      });

      showToast(`Communications dispatched: ${broadcastType} packet synchronized.`, 'SUCCESS');
      setBroadcastTitle('');
      setBroadcastDescription('');
    } catch (error) {
      console.error('Dispatch failure:', error);
      showToast('Broadcast uplink interrupted.', 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleMailDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailSubject || !mailBody) {
      showToast('Mail validation failure: Missing subject or body.', 'ERROR');
      return;
    }

    setLoading(true);
    try {
      let toList: string[] = [];
      let ccList = ccEmails.split(',').map(e => e.trim()).filter(Boolean);
      let bccList = bccEmails.split(',').map(e => e.trim()).filter(Boolean);

      if (mailTarget === 'ALL') {
        // For mass broadcasts, we BCC everyone to ensure privacy as requested
        bccList = [...new Set([...bccList, ...(usersSnapshot?.docs.map((d: any) => d.data().email).filter(Boolean) || [])])];
      } else if (mailTarget === 'ROLE') {
        bccList = [...new Set([...bccList, ...(usersSnapshot?.docs
          .filter((d: any) => d.data().role === targetRole)
          .map((d: any) => d.data().email)
          .filter(Boolean) || [])])];
      } else {
        toList = toEmails.split(',').map(e => e.trim()).filter(Boolean);
      }

      // Final check across all tiers
      if (toList.length === 0 && ccList.length === 0 && bccList.length === 0) {
        showToast('Dispatch aborted: No recipients defined in TO, CC, or BCC.', 'WARNING');
        setLoading(false);
        return;
      }

      // Professional handling of 'Undisclosed Recipients'
      const primaryTo = toList.length > 0 ? toList.join(', ') : 'Undisclosed Recipients <info@rehdigital.com>';

      // Unified SMTP Dispatch
      const response = await fetch('/api/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: primaryTo,
          cc: ccList.length > 0 ? ccList.join(', ') : undefined,
          bcc: bccList.length > 0 ? bccList.join(', ') : undefined,
          type: 'CUSTOM',
          payload: {
            title: mailSubject,
            body: mailBody,
            category: mailCategory
          }
        })
      });

      if (!response.ok) throw new Error('Uplink rejected by SMTP gateway');

      showToast(`SMTP Dispatch successful: Transmission synchronized via Elite Gateway.`, 'SUCCESS');
      setMailSubject('');
      setMailBody('');
      setToEmails('');
      setCcEmails('');
      setBccEmails('');
    } catch (error) {
      console.error('Mail dispatch failure:', error);
      showToast('SMTP uplink interrupted.', 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', position: 'relative' }}>
      {/* Hub Navigation */}
      <div style={{ display: 'flex', gap: 12, background: 'var(--secondary)', padding: 6, borderRadius: 16, border: '1px solid var(--border)', width: 'fit-content' }}>
        <button
          onClick={() => setActiveHubTab('BROADCAST')}
          style={{
            padding: '12px 24px', borderRadius: 12, border: 'none',
            background: activeHubTab === 'BROADCAST' ? 'var(--teal)' : 'transparent',
            color: activeHubTab === 'BROADCAST' ? '#ffffff' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 900, cursor: 'pointer', transition: 'all 300ms',
            display: 'flex', alignItems: 'center', gap: 10
          }}
        >
          <Megaphone size={18} />
          DASHBOARD BROADCAST
        </button>
        <button
          onClick={() => setActiveHubTab('MAIL')}
          style={{
            padding: '12px 24px', borderRadius: 12, border: 'none',
            background: activeHubTab === 'MAIL' ? 'var(--teal)' : 'transparent',
            color: activeHubTab === 'MAIL' ? '#ffffff' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 900, cursor: 'pointer', transition: 'all 300ms',
            display: 'flex', alignItems: 'center', gap: 10
          }}
        >
          <Mail size={18} />
          PREMIUM MAIL DISPATCH
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', gap: 32 }}>
        {activeHubTab === 'BROADCAST' ? (
          <form onSubmit={handleBroadcastDispatch} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Packet Stream</label>
                <div style={{ display: 'flex', gap: 8, background: 'var(--secondary)', padding: 4, borderRadius: 12, border: '1px solid var(--border)' }}>
                  {(['NOTIF', 'NEWS'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setBroadcastType(t)}
                      style={{
                        flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                        background: broadcastType === t ? 'var(--teal)' : 'transparent',
                        color: broadcastType === t ? '#ffffff' : 'var(--text-muted)',
                        fontSize: 11, fontWeight: 900, cursor: 'pointer', transition: 'all 200ms',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                      }}
                    >
                      {t === 'NOTIF' ? <Bell size={14} /> : <Newspaper size={14} />}
                      {t === 'NOTIF' ? 'NOTIFICATION' : 'NEWS FEED'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Authority Classification</label>
                <div style={{ display: 'flex', gap: 6, background: 'var(--secondary)', padding: 4, borderRadius: 12, border: '1px solid var(--border)' }}>
                  {[
                    { id: 'INFO', label: 'INFO', color: 'var(--primary-light)' },
                    { id: 'SUCCESS', label: 'SUCCESS', color: 'var(--status-success)' },
                    { id: 'WARNING', label: 'WARNING', color: 'var(--status-warning)' },
                    { id: 'CRITICAL', label: 'CRITICAL', color: 'var(--status-error)' }
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setBroadcastSeverity(s.id as any)}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                        background: broadcastSeverity === s.id ? `${s.color}` : 'transparent',
                        color: broadcastSeverity === s.id ? '#ffffff' : 'var(--text-muted)',
                        fontSize: 10, fontWeight: 900, cursor: 'pointer', transition: 'all 200ms',
                        letterSpacing: '0.05em', opacity: broadcastSeverity === s.id ? 1 : 0.8
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 9, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Broadcast Headline</label>
              <input
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="Enter high-impact title..."
                style={{ padding: '12px 16px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 9, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Narrative Body</label>
              <textarea
                value={broadcastDescription}
                onChange={(e) => setBroadcastDescription(e.target.value)}
                placeholder="Detailed administrative context..."
                rows={3}
                style={{ padding: '12px 16px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 14, outline: 'none', resize: 'none' }}
              />
            </div>

            <button
              disabled={loading}
              style={{
                marginTop: 8, padding: '12px 24px', background: 'var(--teal)', color: '#ffffff',
                border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 13,
                cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: 'var(--shadow-premium)', letterSpacing: '0.1em', textTransform: 'uppercase', width: 'fit-content', alignSelf: 'center'
              }}
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              Authorize Broadcast Dispatch
            </button>
          </form>
        ) : (
          <form onSubmit={handleMailDispatch} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Target Spectrum</label>
                <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.4)', padding: 6, borderRadius: 14, border: '1px solid var(--border)' }}>
                  {[
                    { id: 'ALL', label: 'ALL USERS' },
                    { id: 'ROLE', label: 'BY ROLE' },
                    { id: 'SPECIFIC', label: 'SPECIFIC' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMailTarget(t.id as any)}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                        background: mailTarget === t.id ? 'var(--teal)' : 'transparent',
                        color: mailTarget === t.id ? '#ffffff' : 'var(--text-muted)',
                        fontSize: 10, fontWeight: 900, cursor: 'pointer', transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Configuration Mode</label>
                {mailTarget === 'ROLE' ? (
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', borderRadius: 14, color: '#ffffff', fontSize: 14, outline: 'none', appearance: 'none' }}
                  >
                    <option value="TEAM">PROJECT TEAM</option>
                    <option value="ADMIN">ADMINISTRATORS</option>
                    <option value="OWNER">SYSTEM OWNERS</option>
                  </select>
                ) : (
                  <div style={{ padding: '12px 16px', background: 'rgba(0, 242, 255, 0.03)', borderRadius: 14, border: '1px solid rgba(0, 242, 255, 0.1)', color: 'var(--teal)', fontSize: 12, fontWeight: 800, letterSpacing: '0.05em' }}>
                    {mailTarget === 'ALL' ? 'GLOBAL BROADCAST ENABLED' : 'SPECIFIC ROUTING ACTIVE'}
                  </div>
                )}
              </div>
            </div>

            {mailTarget === 'SPECIFIC' && (
              <div style={{ 
                display: 'flex', flexDirection: 'column', gap: 24, padding: 32, 
                background: 'rgba(0,0,0,0.6)', borderRadius: 28, border: '1px solid var(--border)',
                boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)', position: 'relative', overflow: 'visible'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 2, background: 'linear-gradient(90deg, transparent, var(--teal), transparent)', opacity: 0.5 }} />
                
                {/* Direct Recipients (TO) - High Density Field */}
                <div style={{ width: '100%' }}>
                  {[
                    { id: 'TO', label: 'Direct Recipients (TO)', value: toEmails, setter: setToEmails, accent: 'var(--teal)', icon: <Send size={16} /> },
                  ].map(field => (
                    <div 
                      key={field.id} 
                      style={{ 
                        display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', 
                        background: 'rgba(0, 242, 255, 0.02)', padding: '28px', borderRadius: 24, 
                        border: '1px solid rgba(0, 242, 255, 0.1)', borderLeft: `8px solid ${field.accent}`,
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0, 242, 255, 0.1)', color: field.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0, 242, 255, 0.15)' }}>{field.icon}</div>
                          <div>
                            <label style={{ fontSize: 12, fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block' }}>{field.label}</label>
                            <span style={{ fontSize: 9, color: 'var(--teal)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Primary Destination Node</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSelectorField(activeSelectorField === field.id ? null : field.id as any);
                            setUserSearchQuery('');
                          }}
                          style={{ 
                            padding: '12px 24px', borderRadius: 14, border: 'none', 
                            background: field.accent, color: '#050a0b', fontSize: 11, 
                            fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)', textTransform: 'uppercase', letterSpacing: '0.15em',
                            boxShadow: '0 10px 30px rgba(0, 242, 255, 0.3)'
                          }}
                        >
                          <UserPlus size={18} /> OPEN REGISTRY
                        </button>
                      </div>
                      <textarea
                        value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                        placeholder="Establish primary communication uplink (semicolon separated)..."
                        rows={Math.max(2, field.value.split('\n').length + (field.value.match(/;/g) || []).length / 2, Math.ceil(field.value.length / 100))}
                        style={{ 
                          padding: '20px', background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(0, 242, 255, 0.2)', 
                          borderRadius: 16, color: '#ffffff', fontSize: 15, outline: 'none', 
                          resize: 'none', fontWeight: 500, lineHeight: '1.6', transition: 'all 300ms',
                          boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.5)', fontFamily: 'var(--font-mono)'
                        }}
                      />
                      
                      <AnimatePresence>
                        {activeSelectorField === field.id && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                            style={{ 
                              position: 'absolute', top: '100%', right: 0, zIndex: 1500, 
                              width: 440, marginTop: 16, background: '#0a1112', 
                              border: '1px solid var(--teal)', borderRadius: 24, 
                              boxShadow: '0 50px 100px rgba(0,0,0,0.9)', padding: 20, 
                              display: 'flex', flexDirection: 'column', gap: 16,
                              backdropFilter: 'blur(30px)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.6)', padding: '14px 20px', borderRadius: 16, border: '1px solid rgba(0, 242, 255, 0.2)' }}>
                              <Search size={20} color="var(--teal)" />
                              <input 
                                autoFocus
                                value={userSearchQuery}
                                onChange={e => setUserSearchQuery(e.target.value)}
                                placeholder="Locate personnel identity..." 
                                style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: 15, outline: 'none', width: '100%' }} 
                              />
                            </div>
                            <div style={{ maxHeight: 350, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 8 }} className="custom-scrollbar">
                              {usersSnapshot?.docs
                                .filter((d: any) => {
                                  const data = d.data();
                                  const search = userSearchQuery.toLowerCase();
                                  return data.name?.toLowerCase().includes(search) || data.email?.toLowerCase().includes(search);
                                })
                                .map((d: any) => (
                                  <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => addEmailToField(d.data().email, field.id as any)}
                                    style={{ 
                                      textAlign: 'left', padding: '16px 20px', borderRadius: 16, 
                                      border: '1px solid transparent', background: 'rgba(255,255,255,0.03)', 
                                      cursor: 'pointer', transition: 'all 200ms', display: 'flex', 
                                      flexDirection: 'column', gap: 4 
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.background = 'rgba(0, 242, 255, 0.1)';
                                      e.currentTarget.style.borderColor = 'rgba(0, 242, 255, 0.3)';
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                      e.currentTarget.style.borderColor = 'transparent';
                                    }}
                                  >
                                    <span style={{ fontSize: 14, fontWeight: 900, color: '#ffffff' }}>{d.data().name}</span>
                                    <span style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 800, letterSpacing: '0.05em', opacity: 0.8 }}>{d.data().email}</span>
                                  </button>
                                ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  {[
                    { id: 'CC', label: 'Carbon Copy (CC)', value: ccEmails, setter: setCcEmails, accent: 'var(--teal)', icon: <Users size={16} /> },
                    { id: 'BCC', label: 'Blind Copy (BCC)', value: bccEmails, setter: setBccEmails, accent: 'var(--gold)', icon: <EyeOff size={16} /> }
                  ].map(field => (
                    <div 
                      key={field.id} 
                      style={{ 
                        display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', 
                        background: 'rgba(0,0,0,0.5)', padding: '24px', borderRadius: 20, 
                        border: '1px solid rgba(255,255,255,0.05)', borderTop: `4px solid ${field.accent}`,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ color: field.accent, opacity: 1 }}>{field.icon}</div>
                          <label style={{ fontSize: 11, fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{field.label}</label>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSelectorField(activeSelectorField === field.id ? null : field.id as any);
                            setUserSearchQuery('');
                          }}
                          style={{ 
                            padding: '8px 16px', borderRadius: 10, border: `1px solid ${field.accent}`, 
                            background: 'transparent', color: field.accent, fontSize: 10, 
                            fontWeight: 900, cursor: 'pointer', transition: 'all 200ms', letterSpacing: '0.1em',
                            textTransform: 'uppercase'
                          }}
                        >
                          Registry
                        </button>
                      </div>
                      <textarea
                        value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                        placeholder={`Draft ${field.id} identities...`}
                        rows={Math.max(2, field.value.split('\n').length + (field.value.match(/;/g) || []).length / 2, Math.ceil(field.value.length / 50))}
                        style={{ 
                          padding: '16px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.08)', 
                          borderRadius: 14, color: '#ffffff', fontSize: 13, outline: 'none', 
                          resize: 'none', fontWeight: 500, lineHeight: '1.5', fontFamily: 'var(--font-mono)'
                        }}
                      />
                      
                      <AnimatePresence>
                        {activeSelectorField === field.id && (
                          <motion.div 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 15 }}
                            style={{ 
                              position: 'absolute', top: '100%', left: 0, zIndex: 1500, 
                              width: 320, marginTop: 16, background: '#0a1112', 
                              border: `1px solid ${field.accent}`, borderRadius: 20, 
                              boxShadow: '0 30px 80px rgba(0,0,0,0.8)', padding: 16, 
                              display: 'flex', flexDirection: 'column', gap: 14,
                              backdropFilter: 'blur(25px)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.4)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                              <Search size={16} color={field.accent} />
                              <input 
                                autoFocus
                                value={userSearchQuery}
                                onChange={e => setUserSearchQuery(e.target.value)}
                                placeholder="Search..." 
                                style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: 13, outline: 'none', width: '100%' }} 
                              />
                            </div>
                            <div style={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }} className="custom-scrollbar">
                              {usersSnapshot?.docs
                                .filter((d: any) => {
                                  const data = d.data();
                                  const search = userSearchQuery.toLowerCase();
                                  return data.name?.toLowerCase().includes(search) || data.email?.toLowerCase().includes(search);
                                })
                                .map((d: any) => (
                                  <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => addEmailToField(d.data().email, field.id as any)}
                                    style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 12, border: 'none', background: 'transparent', cursor: 'pointer', transition: 'all 200ms' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                  >
                                    <span style={{ fontSize: 13, fontWeight: 900, color: '#ffffff', display: 'block' }}>{d.data().name}</span>
                                    <span style={{ fontSize: 11, color: field.accent, opacity: 0.8 }}>{d.data().email}</span>
                                  </button>
                                ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Subject Line</label>
                <input
                  value={mailSubject}
                  onChange={(e) => setMailSubject(e.target.value)}
                  placeholder="Official dispatch subject..."
                  style={{ padding: '14px 20px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', borderRadius: 14, color: '#ffffff', fontSize: 15, outline: 'none', transition: 'all 300ms' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--teal)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Dispatch Priority</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={mailCategory}
                    onChange={(e) => setMailCategory(e.target.value)}
                    style={{ width: '100%', padding: '14px 20px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', borderRadius: 14, color: '#ffffff', fontSize: 15, outline: 'none', appearance: 'none' }}
                  >
                    <option value="ANNOUNCEMENT">SYSTEM ANNOUNCEMENT</option>
                    <option value="NEWS">PROJECT NEWS FEED</option>
                    <option value="SECURITY">SECURITY ADVISORY</option>
                    <option value="URGENT">URGENT ACTION REQUIRED</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Communication Payload (Body)</label>
              <textarea
                value={mailBody}
                onChange={(e) => setMailBody(e.target.value)}
                placeholder="Draft your professional industrial dispatch here..."
                rows={4}
                style={{ 
                  padding: '16px 20px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', 
                  borderRadius: 16, color: '#ffffff', fontSize: 15, outline: 'none', resize: 'none', 
                  lineHeight: '1.7', transition: 'all 300ms' 
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--teal)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
              />
            </div>

            <button
              disabled={loading}
              style={{
                marginTop: 10, padding: '16px 40px', background: 'var(--teal)', color: '#050a0b',
                border: 'none', borderRadius: 16, fontWeight: 900, fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                boxShadow: '0 15px 40px rgba(0, 242, 255, 0.2)', letterSpacing: '0.2em', textTransform: 'uppercase', width: 'fit-content', alignSelf: 'center',
                transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 20px 50px rgba(0, 242, 255, 0.3)';
                }
              }}
              onMouseLeave={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 242, 255, 0.2)';
                }
              }}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              Authorize SMTP Dispatch
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { logout, userProfile } = useAuth();
  const { isVisible, can, isAdmin, policy } = usePermissions();
  const router = useRouter();

  // Security Clearance Protocol: TEAM_MATE access to Digital Reporting is restricted
  // Also verify this is a proper admin session (not just dashboard login)
  useEffect(() => {
    const isAdminSession = sessionStorage.getItem('admin_session');
    if (!isAdminSession || isAdminSession !== 'active') {
      router.push('/admin/login');
      return;
    }
    if (userProfile && !userProfile.isAdmin) {
      router.push('/');
    }
  }, [userProfile, router]);

  const [activeTab, setActiveTab] = useState<'tasks' | 'team' | 'branding' | 'registry' | 'users' | 'policies' | 'communications' | 'reports' | 'bim-reviews' | 'homepage' | 'tickets'>('tasks');
  const [taskImportConfirm, setTaskImportConfirm] = useState<{ isOpen: boolean; records: Task[] }>({ isOpen: false, records: [] });
  const [isTaskImportLoading, setIsTaskImportLoading] = useState(false);
  const taskFileInputRef = useRef<HTMLInputElement>(null);

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'policies'>('users');
  const [teamActiveSubTab, setTeamActiveSubTab] = useState<'personnel' | 'departments'>('personnel');
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [isBrandingUpdating, setIsBrandingUpdating] = useState(false);

  // Elite Partner Logos Manager
  const [partnerLogosList, setPartnerLogosList] = useState<{ id: string, url: string, file?: File }[]>([]);
  const [initializedLogos, setInitializedLogos] = useState(false);

  // Elite Subtitles Manager
  const [subtitleList, setSubtitleList] = useState<{ id: string, text: string }[]>([]);
  const [initializedSubtitles, setInitializedSubtitles] = useState(false);

  // Elite Header Background Designer
  const [headerBgFile, setHeaderBgFile] = useState<File | null>(null);
  const [bgOpacity, setBgOpacity] = useState(20);
  const [bgPosY, setBgPosY] = useState(50);
  const [bgPosX, setBgPosX] = useState(50);
  const [initializedBg, setInitializedBg] = useState(false);
  const [localBgUrl, setLocalBgUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropperSource, setCropperSource] = useState<string | null>(null);

  // Elite Subtitles Manager state sync
  const [localTitle, setLocalTitle] = useState('');
  const [localProjectName, setLocalProjectName] = useState('wadi yemm');
  const [localLocation, setLocalLocation] = useState('');
  const [localStatusLine, setLocalStatusLine] = useState('');
  const [localAllowedDomains, setLocalAllowedDomains] = useState<string[]>([]);
  const [initializedLocalFields, setInitializedLocalFields] = useState(false);
  const [initializedDomains, setInitializedDomains] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [eliteAlert, setEliteAlert] = useState<{ isOpen: boolean, title: string, message: string, severity: 'INFO' | 'WARNING' }>({
    isOpen: false,
    title: '',
    message: '',
    severity: 'INFO'
  });
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [localReportTitle, setLocalReportTitle] = useState('Executive Summary Report');
  const [localReportSubtitle, setLocalReportSubtitle] = useState('Operational Performance & Deliverables');
  const [localReportSummary, setLocalReportSummary] = useState('Official administrative project summary and executive disclaimer narrative for the KEO Digital Hub.');
  const [localSummaryFields, setLocalSummaryFields] = useState<ReportSummaryField[]>(DEFAULT_SUMMARY_FIELDS);
  
  // PDF Color Vectors
  const [localReportBgColor, setLocalReportBgColor] = useState('#0a0a0f');
  const [localReportAccentColor, setLocalReportAccentColor] = useState('#D4AF37');
  const [localReportHeaderTextColor, setLocalReportHeaderTextColor] = useState('#D4AF37');
  const [localReportPdfBodyTextColor, setLocalReportPdfBodyTextColor] = useState('rgba(255,255,255,0.7)');

  // Excel Color Vectors
  const [localReportExcelHeaderColor, setLocalReportExcelHeaderColor] = useState('#107c41');
  const [localReportExcelHeaderTextColor, setLocalReportExcelHeaderTextColor] = useState('#ffffff');
  const [localReportExcelAccentColor, setLocalReportExcelAccentColor] = useState('#107c41');
  const [localReportExcelBodyTextColor, setLocalReportExcelBodyTextColor] = useState('#475569');

  const [localPeriodReference, setLocalPeriodReference] = useState('MAY 2026 STATUS RECAP');
  const [localTemporalReference, setLocalTemporalReference] = useState('MAY 2026 HUB RECAP');
  const [localReportBranding, setLocalReportBranding] = useState('KEO DIGITAL INTELLIGENCE // MASTER TRANSCRIPT');
  const [localReportFooter, setLocalReportFooter] = useState('PRIVATE & CONFIDENTIAL // INTEGRATED DATA STREAM');
  const [localExcludedFields, setLocalExcludedFields] = useState<string[]>([]);
  const [simulationMode, setSimulationMode] = useState<'PDF' | 'EXCEL'>('PDF');
  const [excelActiveTab, setExcelActiveTab] = useState<'summary' | 'matrix'>('summary');
  const pdfScrollRef = useRef<HTMLDivElement>(null);
  const [currentPdfPage, setCurrentPdfPage] = useState(0);
  const [localHeaderBadges, setLocalHeaderBadges] = useState<HeaderBadge[]>([]);
  const [initializedBadges, setInitializedBadges] = useState(false);
  const [broadcastToDelete, setBroadcastToDelete] = useState<{ id: string, title: string } | null>(null);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isBimImportLoading, setIsBimImportLoading] = useState(false);
  const [bimImportConfirm, setBimImportConfirm] = useState<{ isOpen: boolean, records: any[] }>({ isOpen: false, records: [] });
  const bimFileInputRef = useRef<HTMLInputElement>(null);


  // Real-time metadata for Main Data tab
  const [projectSnapshot, projectLoading] = useDocument(doc(db, 'settings', 'project'));
  const projectData = projectSnapshot?.data() as ProjectMetadata | undefined;

  const { showToast } = useToast();
  
  // Strict Security Handshake: Only attempt collection synchronization if authorized
  const isAdminSession = typeof window !== 'undefined' ? sessionStorage.getItem('admin_session') === 'active' : false;
  const isAuthorized = userProfile?.isAdmin && isAdminSession;

  // Firestore Listeners (Gated for Security)
  const [tasksSnapshot, tasksLoading, tasksError] = useCollection(isAuthorized ? collections.tasks : null);
  const [registrySnapshot, registryLoading, registryError] = useCollection(isAuthorized ? collections.registry : null);
  const [usersSnapshot, usersLoading, usersError] = useCollection(isAuthorized ? collections.users : null);
  const [bimReviewsSnapshot, bimReviewsLoading, bimReviewsError] = useCollection(isAuthorized ? collections.bimReviews : null);
  const [ticketsSnapshot, ticketsLoading] = useCollection(isAuthorized ? query(collection(db, 'tickets'), orderBy('createdAt', 'desc')) : null);
  const [membersSnapshot, membersLoading, membersError] = useCollection(isAuthorized ? collections.members : null);
  
  // High-performance avatar lookups from BOTH collections
  const userAvatarByUid = useMemo(() => {
    const map: Record<string, string> = {};
    usersSnapshot?.docs.forEach(doc => {
      const data = doc.data();
      if (data.avatar) map[doc.id] = data.avatar;
    });
    membersSnapshot?.docs.forEach(doc => {
      const data = doc.data();
      if (data.avatar) map[doc.id] = data.avatar;
    });
    return map;
  }, [usersSnapshot, membersSnapshot]);

  const userAvatarByExactName = useMemo(() => {
    const map: Record<string, string> = {};
    const processDoc = (doc: any) => {
      const data = doc.data();
      if (data.name && data.avatar) map[data.name.trim()] = data.avatar;
    }
    usersSnapshot?.docs.forEach(processDoc);
    membersSnapshot?.docs.forEach(processDoc);
    return map;
  }, [usersSnapshot, membersSnapshot]);

  const userAvatarByName = useMemo(() => {
    const map: Record<string, string> = {};
    const processDoc = (doc: any) => {
      const data = doc.data();
      if (data.name && data.avatar) map[data.name.toLowerCase().trim()] = data.avatar;
    }
    usersSnapshot?.docs.forEach(processDoc);
    membersSnapshot?.docs.forEach(processDoc);
    return map;
  }, [usersSnapshot, membersSnapshot]);

  const userAvatarByEmail = useMemo(() => {
    const map: Record<string, string> = {};
    const processDoc = (doc: any) => {
      const data = doc.data();
      if (data.email && data.avatar) map[data.email.toLowerCase()] = data.avatar;
    }
    usersSnapshot?.docs.forEach(processDoc);
    membersSnapshot?.docs.forEach(processDoc);
    return map;
  }, [usersSnapshot, membersSnapshot]);


  const [broadcastsSnapshot, broadcastsLoading] = useCollection(isAuthorized ? query(collection(db, 'broadcasts'), orderBy('timestamp', 'desc')) : null);
  const [departmentsSnapshot, departmentsLoading] = useCollection(isAuthorized ? query(collections.departments, orderBy('name', 'asc')) : null);

  // Selector state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedRegistry, setSelectedRegistry] = useState<DashboardNavItem | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<any | null>(null);
  const [selectedBimReview, setSelectedBimReview] = useState<BIMReview | null>(null);
  const [ticketToResolve, setTicketToResolve] = useState<any | null>(null);
  const [ticketToReject, setTicketToReject] = useState<any | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  // Sync projectData partnerLogos exactly once initially
  if (projectData?.partnerLogos && !initializedLogos) {
    setPartnerLogosList(projectData.partnerLogos.map((url, i) => ({ id: `remote-${i}`, url })));
    setInitializedLogos(true);
  }

  // Sync projectData subtitles exactly once initially
  if (projectData?.subtitles && !initializedSubtitles) {
    setSubtitleList(projectData.subtitles.map((text, i) => ({ id: `sub-${i}-${Date.now()}`, text })));
    setInitializedSubtitles(true);
  }

  // Sync projectData background settings exactly once initially
  if (projectData && !initializedBg) {
    setBgOpacity(projectData.headerBgOpacity ?? 20);
    setBgPosY(projectData.headerBgPositionY ?? 50);
    setBgPosX(projectData.headerBgPositionX ?? 50);
    setInitializedBg(true);
  }

  // Sync title/project/location fields for real-time preview
  if (projectData && !initializedLocalFields) {
    setLocalTitle(projectData.title || '');
    setLocalProjectName(projectData.projectName || '');
    setLocalLocation(projectData.location || '');
    setLocalStatusLine(projectData.statusLine || 'Digital Workflow Online');
    setLocalReportTitle(projectData.reportTitle || 'Executive Summary Report');
    setLocalReportSubtitle(projectData.reportSubtitle || 'Operational Performance & Deliverables');
    setLocalReportSummary(projectData.reportSummary || '');
    setLocalReportBgColor(projectData.reportBgColor || '#0a0a0f');
    setLocalReportAccentColor(projectData.reportAccentColor || '#D4AF37');
    setLocalReportHeaderTextColor(projectData.reportHeaderTextColor || '#D4AF37');
    setLocalReportPdfBodyTextColor(projectData.reportPdfBodyTextColor || 'rgba(255,255,255,0.7)');
    setLocalReportExcelHeaderColor(projectData.reportExcelHeaderColor || '#107c41');
    setLocalReportExcelHeaderTextColor(projectData.reportExcelHeaderTextColor || '#ffffff');
    setLocalReportExcelAccentColor(projectData.reportExcelAccentColor || '#107c41');
    setLocalReportExcelBodyTextColor(projectData.reportExcelBodyTextColor || '#475569');
    setLocalPeriodReference(projectData.reportPeriodReference || '');
    setLocalReportBranding(projectData.reportBranding || 'KEO DIGITAL INTELLIGENCE // MASTER TRANSCRIPT');
    setLocalReportFooter(projectData.reportFooter || 'PRIVATE & CONFIDENTIAL // INTEGRATED DATA STREAM');
    setLocalExcludedFields(projectData.reportExcludedFields || []);
    setLocalSummaryFields(projectData.reportSummaryFields || DEFAULT_SUMMARY_FIELDS);
    setInitializedLocalFields(true);
  }

  // Sync header badges exactly once initially
  if (projectData && !initializedBadges) {
    const defaultBadges: HeaderBadge[] = [
      { id: 'status-line', label: 'SECURITY SPECTRUM', color: projectData.statusColor || '#f59e0b', isVisible: true, isAutomated: true },
      { id: 'date-range', label: 'MONTHLY PERFORMANCE', color: '#D4AF37', isVisible: true, isAutomated: true },
      { id: 'task-count', label: 'DELIVERABLES REGISTRY', color: '#818cf8', isVisible: true, isAutomated: true }
    ];
    setLocalHeaderBadges(projectData.headerBadges || defaultBadges);
    setInitializedBadges(true);
  }

  // Sync allowed domains exactly once initially
  if (projectData && !initializedDomains) {
    setLocalAllowedDomains(projectData.allowedDomains?.length ? projectData.allowedDomains : DEFAULT_ALLOWED_DOMAINS);
    setInitializedDomains(true);
  }

  const handlePartnerLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: `local-${Date.now()}-${Math.random()}`,
        url: URL.createObjectURL(file), // for preview
        file
      }));
      setPartnerLogosList(prev => [...prev, ...newFiles]);
    }
  };

  const movePartnerLogo = (index: number, direction: 'up' | 'down') => {
    const list = [...partnerLogosList];
    if (direction === 'up' && index > 0) {
      [list[index - 1], list[index]] = [list[index], list[index - 1]];
    } else if (direction === 'down' && index < list.length - 1) {
      [list[index + 1], list[index]] = [list[index], list[index + 1]];
    }
    setPartnerLogosList(list);
  };

  const removePartnerLogo = (index: number) => {
    setPartnerLogosList(prev => prev.filter((_, i) => i !== index));
  };



  // Snapshot Memoization to stabilize array references and prevent update depth loops
  const memoizedTasks = useMemo(() =>
    tasksSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)) || [],
    [tasksSnapshot]);

  const memoizedRegistry = useMemo(() =>
    registrySnapshot?.docs.map(d => ({ id: d.id, ...d.data() } as DashboardNavItem)) || [],
    [registrySnapshot]);

  const memoizedUsers = useMemo(() =>
    usersSnapshot?.docs.map(d => ({ id: d.id, ...d.data() } as any)) || [],
    [usersSnapshot]);

  const memoizedDepartments = useMemo(() =>
    departmentsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() } as Department)) || [],
    [departmentsSnapshot]);

  const memoizedMembers = useMemo(() =>
    membersSnapshot?.docs.map(d => ({ id: d.id, ...d.data() } as TeamMember)) || [],
    [membersSnapshot]);

  const handleManualSync = async () => {
    setIsSavingReport(true);
    try {
      await updateProjectMetadata({
        reportTitle: localReportTitle,
        reportSubtitle: localReportSubtitle,
        reportSummary: localReportSummary,
        reportBgColor: localReportBgColor,
        reportAccentColor: localReportAccentColor,
        reportHeaderTextColor: localReportHeaderTextColor,
        reportPdfBodyTextColor: localReportPdfBodyTextColor,
        reportExcelHeaderColor: localReportExcelHeaderColor,
        reportExcelHeaderTextColor: localReportExcelHeaderTextColor,
        reportExcelAccentColor: localReportExcelAccentColor,
        reportExcelBodyTextColor: localReportExcelBodyTextColor,
        reportPeriodReference: localPeriodReference,
        reportTemporalReference: localTemporalReference,
        reportBranding: localReportBranding,
        reportFooter: localReportFooter,
        reportExcludedFields: localExcludedFields,
        reportSummaryFields: localSummaryFields,
        projectName: localProjectName,
        statusLine: localStatusLine
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      showToast('Configuration Synchronized', 'SUCCESS');
    } catch (e) {
      showToast('Synchronization Failed', 'ERROR');
    } finally {
      setIsSavingReport(false);
    }
  };

  // Real-Time Auto Sync Protocol for Report Configurations
  useEffect(() => {
    if (!initializedLocalFields) return;
    const timer = setTimeout(() => {
      updateProjectMetadata({
        reportTitle: localReportTitle,
        reportSubtitle: localReportSubtitle,
        reportSummary: localReportSummary,
        reportBgColor: localReportBgColor,
        reportAccentColor: localReportAccentColor,
        reportHeaderTextColor: localReportHeaderTextColor,
        reportPdfBodyTextColor: localReportPdfBodyTextColor,
        reportExcelHeaderColor: localReportExcelHeaderColor,
        reportExcelHeaderTextColor: localReportExcelHeaderTextColor,
        reportExcelAccentColor: localReportExcelAccentColor,
        reportExcelBodyTextColor: localReportExcelBodyTextColor,
        reportPeriodReference: localPeriodReference,
        reportTemporalReference: localTemporalReference,
        reportBranding: localReportBranding,
        reportFooter: localReportFooter,
        reportExcludedFields: localExcludedFields,
        reportSummaryFields: localSummaryFields,
        projectName: localProjectName
      }).catch(console.error);
    }, 1000);
    return () => clearTimeout(timer);
  }, [
    localReportTitle, localReportSubtitle, localReportSummary, localReportBgColor,
    localReportAccentColor, localReportHeaderTextColor, localReportPdfBodyTextColor,
    localReportExcelHeaderColor, localReportExcelHeaderTextColor, localReportExcelAccentColor,
    localReportExcelBodyTextColor, localPeriodReference, localTemporalReference,
    localReportBranding, localReportFooter, localExcludedFields, localSummaryFields,
    localProjectName, initializedLocalFields
  ]);

  const handleLiveTestExport = async (format: 'pdf' | 'excel') => {
    const localMetadata: ProjectMetadata = {
      ...projectData,
      reportTitle: localReportTitle,
      reportSubtitle: localReportSubtitle,
      reportSummary: localReportSummary,
      reportBgColor: localReportBgColor,
      reportAccentColor: localReportAccentColor,
      reportHeaderTextColor: localReportHeaderTextColor,
      reportPdfBodyTextColor: localReportPdfBodyTextColor,
      reportExcelHeaderColor: localReportExcelHeaderColor,
      reportExcelHeaderTextColor: localReportExcelHeaderTextColor,
      reportExcelAccentColor: localReportExcelAccentColor,
      reportExcelBodyTextColor: localReportExcelBodyTextColor,
      reportBranding: localReportBranding,
      reportFooter: localReportFooter,
      reportSummaryFields: localSummaryFields,
      reportExcludedFields: localExcludedFields,
      reportPeriodReference: localPeriodReference,
      reportTemporalReference: localTemporalReference,
      projectName: localProjectName,
    } as any;

    try {
      if (format === 'excel') {
        const { exportToExcel } = await import('@/lib/exportUtils');
        const { blob, filename } = await exportToExcel(memoizedTasks, localMetadata, undefined, 'table');
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
      } else {
        const { exportToPDF } = await import('@/lib/exportUtils');
        const { blob, filename } = await exportToPDF(memoizedTasks, localMetadata, undefined, 'table');
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
      }
      showToast('Live Test Report Generated', 'SUCCESS');
    } catch (e) {
      showToast('Live Test Failed', 'ERROR');
    }
  };


  const handleBimExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          showToast('Packet analysis failure: Data stream is empty.', 'INFO');
          return;
        }

        const normalizeExcelDate = (val: any) => {
          if (!val) return null;
          if (typeof val === 'number') {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000));
            return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
          }
          return String(val);
        };

        const sanitizeProjectName = (name: any) => {
          if (!name || typeof name !== 'string') return name || '';
          return name.replace(/\s*\(https?:\/\/[^\)]+\)/g, '').trim();
        };

        let lastProject = '';
        const mappedRecords = json.map((row: any) => {
          const currentProject = row['Project'] ? sanitizeProjectName(row['Project']) : '';
          if (currentProject) lastProject = currentProject;
          
          return {
            submissionDescription: row['Submission Description'] || '',
            comments: row['Comments'] || '',
            designStage: row['Design Stage'] || '',
            insiteBimReviewStatus: row['InSite BIM Review Status'] || '',
            insiteReviewDueDate: normalizeExcelDate(row['InSite Review Due Date']),
            insiteReviewOutputUrl: row['InSite Review Output URL'] || '',
            insiteReviewer: row['InSite Reviewer'] || '',
            modonHillFinalReviewStatus: row['Modon/Hill Final Review Status'] || '',
            onAcc: row['On ACC'] || 'NOT SHARED',
            project: lastProject,
            reviewNumber: row['Review Number'] ? String(row['Review Number']) : '',
            stakeholder: row['Stakeholder'] || '',
            submissionCategory: row['Submission Category'] 
              ? String(row['Submission Category']).split(',').map((s: string) => s.trim()) 
              : [],
            submissionDate: normalizeExcelDate(row['Submission Date'])
          };
        });

        setBimImportConfirm({ isOpen: true, records: mappedRecords });
      } catch (err) {
        console.error('BIM Import Failure:', err);
        showToast('Digital transport integrity error: Ingestion failed.', 'ERROR');
      } finally {
        if (bimFileInputRef.current) bimFileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportConfirm = async (strategy: 'APPEND' | 'OVERWRITE') => {
    setIsBimImportLoading(true);
    try {
      const { bulkUpsertBimReviews } = await import('@/services/FirebaseService');
      await bulkUpsertBimReviews(bimImportConfirm.records, strategy as any);
      showToast(`Intelligence Matrix synchronized: ${bimImportConfirm.records.length} records ingested in ${strategy} mode.`, 'SUCCESS');
      setBimImportConfirm({ isOpen: false, records: [] });
    } catch (err) {
      console.error('Import Commit Failure:', err);
      showToast('Administrative protocol failure: Batch commit interrupted.', 'ERROR');
    } finally {
      setIsBimImportLoading(false);
    }
  };

  // Reset selection when tab changes
  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setSelectedIds(new Set());
  };

  const handleDelete = async (id: string, collection: string) => {
    try {
      const { deleteDoc, doc: fsDoc } = await import('firebase/firestore');
      if (collection === 'tasks') await deleteDoc(fsDoc(db, 'tasks', id));
      else if (collection === 'members') await deleteDoc(fsDoc(db, 'members', id));
      else if (collection === 'registry') await deleteDoc(fsDoc(db, 'registry', id));
      else if (collection === 'departments') await deleteDoc(fsDoc(db, 'departments', id));
      else if (collection === 'bim-reviews') await deleteDoc(fsDoc(db, 'bimReviews', id));
      else if (collection === 'tickets') await deleteDoc(fsDoc(db, 'tickets', id));
      showToast('Administrative protocol: Asset record terminated.', 'SUCCESS');
    } catch (err) {
      showToast('Security system failure: Record deletion denied.', 'ERROR');
    }
  };

  const handleDownloadTaskTemplate = async () => {
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Digital Deliverable Matrix');
      
      const columns = [
        { header: 'ID', key: 'id', width: 25 },
        { header: 'Task Definition / Asset', key: 'title', width: 50 },
        { header: 'Project Precinct', key: 'precinct', width: 25 },
        { header: 'Task Category', key: 'department', width: 20 },
        { header: 'Submitter', key: 'submitterName', width: 25 },
        { header: 'Submission Date', key: 'submittingDate', width: 20 },
        { header: 'Deliverable Type', key: 'deliverableType', width: 25 },
        { header: 'CDE Node', key: 'cde', width: 20 },
        { header: 'Link Label', key: 'linkLabel', width: 25 },
        { header: 'URL', key: 'url', width: 40 }
      ];
      
      sheet.columns = columns;
      
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003F49' } };
      headerRow.alignment = { horizontal: 'center' };

      // Add Data Validations for dropdowns
      const deptNames = memoizedDepartments.map(d => d.name);
      
      // Precinct Dropdown (Column C)
      (sheet as any).dataValidations.add('C2:C500', {
        type: 'list',
        allowBlank: true,
        formulae: [`"${PRECINCTS.join(',')}"`],
        showErrorMessage: true,
        errorTitle: 'Invalid Precinct',
        error: 'Please select a precinct from the list.'
      });

      // Category Dropdown (Column D)
      if (deptNames.length > 0) {
        (sheet as any).dataValidations.add('D2:D500', {
          type: 'list',
          allowBlank: true,
          formulae: [`"${deptNames.join(',')}"`],
          showErrorMessage: true,
          errorTitle: 'Invalid Category',
          error: 'Please select a valid Task Category.'
        });
      }


      
      sheet.addRow({
        id: 'T-001 (Optional)',
        title: 'Sample Asset Title',
        precinct: PRECINCTS[0],
        department: deptNames[0] || 'BIM',
        submittingDate: '11-APR-2026',
        deliverableType: 'RVT | IFC',
        cde: 'ACC | BIM360',
        linkLabel: 'Access Description',
        url: 'https://...'
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Digital_Deliverable_Matrix_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      
      showToast('Digital Template transmitted successfully.', 'SUCCESS');
    } catch (err) {
      console.error('Template Download Failure:', err);
      showToast('System Protocol Error: Template generation failed.', 'ERROR');
    }
  };

  const handleTaskExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (json.length === 0) {
          showToast('Packet analysis failure: Data stream is empty.', 'INFO');
          return;
        }

        const expectedHeaders = ['Task Definition / Asset', 'Task Category', 'Submitter', 'Submission Date'];
        const firstRow = json[0];
        const missingHeaders = expectedHeaders.filter(h => !Object.keys(firstRow).includes(h));
        
        if (missingHeaders.length > 0) {
          showToast(`Schema Mismatch: Missing required fields [${missingHeaders.join(', ')}]`, 'ERROR');
          return;
        }

        const normalizeExcelDate = (val: any) => {
          if (!val) return null;
          if (typeof val === 'number') {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000));
            return date.toISOString();
          }
          const parsed = new Date(val);
          return isNaN(parsed.getTime()) ? String(val) : parsed.toISOString();
        };



        const nextIdsByPrefix: Record<string, number> = {};
        const getImportNextId = (deptName: string) => {
          const dept = memoizedDepartments.find(d => d.id === deptName || d.name === deptName);
          const abbr = dept?.abbreviation || (deptName ? deptName.slice(0, 3).toUpperCase() : 'GEN');
          const prefix = `REH - ${abbr} - `;
          
          if (!nextIdsByPrefix[prefix]) {
            const deptTasks = memoizedTasks.filter(t => t.id?.startsWith(prefix)) || [];
            let maxNum = 99;
            if (deptTasks.length > 0) {
              const nums = deptTasks.map(t => {
                const parts = t.id.split(' - ');
                return parseInt(parts[parts.length - 1]);
              }).filter(n => !isNaN(n));
              maxNum = Math.max(...nums, 99);
            }
            nextIdsByPrefix[prefix] = maxNum + 1;
          }
          
          const newId = `${prefix}${nextIdsByPrefix[prefix]}`;
          nextIdsByPrefix[prefix]++;
          return newId;
        };

        const mappedTasks = json.map((row: any) => {
          const category = String(row['Task Category'] || '');
          const importId = String(row['ID'] || '').replace(' (Optional)', '').trim();
          
          const vectorType = String(row['Deliverable Type'] || '');
          const vectorCde = String(row['CDE Node'] || '');
          const vectorLabel = String(row['Link Label'] || '');
          const vectorUrl = String(row['URL'] || '');

          const vectors = [];
          if (vectorUrl) {
            vectors.push({
              id: `vec-${Date.now()}-${Math.random()}`,
              type: vectorType || 'UNSPECIFIED',
              cde: vectorCde || 'UNSPECIFIED',
              label: vectorLabel || vectorType || 'Access Link',
              url: vectorUrl
            });
          }

          const rawSubmitter = String(row['Submitter'] || '').trim();
          const matchedMember = memoizedMembers.find(m => 
            m.name?.toLowerCase().trim() === rawSubmitter.toLowerCase() ||
            m.email?.toLowerCase().trim() === rawSubmitter.toLowerCase()
          );

          return {
            id: importId && !importId.startsWith('T-001') ? importId : getImportNextId(category),
            title: String(row['Task Definition / Asset'] || ''),
            precinct: row['Project Precinct'] || '',
            department: category,
            submitterName: matchedMember ? matchedMember.name : rawSubmitter,
            submitterId: matchedMember ? matchedMember.id : '',
            submitterEmail: matchedMember ? matchedMember.email : '',
            submittingDate: normalizeExcelDate(row['Submission Date']),
            deliverableType: vectorType ? vectorType.split('|').map(s => s.trim()) : [],
            cde: vectorCde ? vectorCde.split('|').map(s => s.trim()) : [],
            fileShareLink: vectorUrl,
            description: '',
            completion: 0,
            attachments: 0,
            files: [],
            links: [],
            vectors: vectors,
            tags: [],
            fileZone: 'INTERNAL',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        });

        setTaskImportConfirm({ isOpen: true, records: mappedTasks as Task[] });
      } catch (err) {
        console.error('Task Import Failure:', err);
        showToast('Digital transport integrity error: Task ingestion failed.', 'ERROR');
      } finally {
        if (taskFileInputRef.current) taskFileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCommitTaskImport = async (strategy: 'APPEND' | 'OVERWRITE') => {
    setIsTaskImportLoading(true);
    try {
      const { bulkUpsertTasks } = await import('@/services/FirebaseService');
      await bulkUpsertTasks(taskImportConfirm.records, strategy);
      showToast(`Deliverable Matrix synchronized: ${taskImportConfirm.records.length} records ingested in ${strategy} mode.`, 'SUCCESS');
      setTaskImportConfirm({ isOpen: false, records: [] });
    } catch (err) {
      console.error('Task Import Commit Failure:', err);
      showToast('Administrative protocol failure: Batch commit interrupted.', 'ERROR');
    } finally {
      setIsTaskImportLoading(false);
    }
  };

  const handleNewRecord = () => {
    if (!can(activeTab as any, 'edit')) {
      showToast('UNAUTHORIZED: Insufficient clearance to initiate new records.', 'ERROR');
      return;
    }
    if (activeTab === 'tasks') setSelectedTask(null);
    if (activeTab === 'team') {
      if (teamActiveSubTab === 'personnel') setSelectedMember(null);
      else {
        setSelectedDepartment(null);
        setIsModalOpen(true);
        return;
      }
    }
    if (activeTab === 'registry') setSelectedRegistry(null);
    if (activeTab === 'bim-reviews') setSelectedBimReview(null);
    if (activeTab === 'users') {
      setEliteAlert({
        isOpen: true,
        title: 'Security Protocol: User Creation',
        message: 'Users can only be initiated via the Registration terminal for security audit reasons. Manual creation is restricted to prevent unauthorized identity injection.',
        severity: 'WARNING'
      });
      return;
    }
    setIsModalOpen(true);
  };

  const handleEditRecord = (item: any) => {
    // If user cannot edit, the modal will be in Read-Only mode (passed via props later)
    if (!can(activeTab as any, 'view')) {
      showToast('ACCESS DENIED: Insufficient clearance to view this record.', 'ERROR');
      return;
    }
    if (activeTab === 'tasks') setSelectedTask(item);
    if (activeTab === 'team') setSelectedMember(item);
    if (activeTab === 'users') setSelectedUser(item);
    if (activeTab === 'team') {
      if (teamActiveSubTab === 'personnel') setSelectedMember(item);
      else setSelectedDepartment(item);
    }
    setIsModalOpen(true);
  };

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = (ids: string[]) => {
    if (selectedIds.size === ids.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ids));
    }
  };

  const getCurrentTabItems = () => {
    if (activeTab === 'tasks') return tasksSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
    if (activeTab === 'team') {
      return teamActiveSubTab === 'personnel'
        ? membersSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || []
        : departmentsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
    }
    if (activeTab === 'registry') return registrySnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
    if (activeTab === 'users') return usersSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
    if (activeTab === 'bim-reviews') return bimReviewsSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
    return [];
  };

  const handleBulkDelete = async () => {
    try {
      const colName = activeTab === 'team' ? 'users' : (activeTab === 'bim-reviews' ? 'bimReviews' : activeTab);
      await bulkDelete(colName, Array.from(selectedIds));
      showToast(`${selectedIds.size} records successfully purged from production.`, 'SUCCESS');
      setSelectedIds(new Set());
      setIsBulkModalOpen(false);
    } catch (error) {
      console.error('Bulk deletion failed:', error);
      showToast('Bulk termination protocol failure.', 'ERROR');
      throw error;
    }
  };

  const currentTabIds = getCurrentTabItems().map((item: any) => item.id);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--text-primary)', overflowX: 'hidden', overflow: 'hidden', height: '100vh' }}>
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            style={{
              position: 'fixed', top: 90, left: '50%', transform: 'translateX(-50%)',
              zIndex: 90,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              padding: '12px 24px',
              borderRadius: 16,
              border: '2px solid var(--status-error)',
              display: 'flex', alignItems: 'center', gap: 24,
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <Shield size={18} color="var(--status-error)" />
              </div>
              <div>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', display: 'block', letterSpacing: '0.05em' }}>{selectedIds.size} ITEMS SELECTED</span>
                <span style={{ fontSize: 10, color: 'var(--status-error)', fontWeight: 700, textTransform: 'uppercase' }}>High Authority Mode Active</span>
              </div>
              <button
                onClick={() => setSelectedIds(new Set())}
                style={{
                  background: 'var(--secondary)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', fontSize: 10, fontWeight: 800, padding: '4px 10px',
                  borderRadius: 6, cursor: 'pointer', marginLeft: 8
                }}
              >
                DISMISS
              </button>
            </div>
            <div style={{ width: 1, height: 32, background: 'var(--border)' }} />

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => showToast('Command Accepted: Exporting high-fidelity dataset...', 'INFO')}
                style={{
                  background: 'var(--secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)',
                  padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10
                }}
              >
                <Database size={16} />
                EXTRACT REGISTRY
              </button>

              {can(activeTab as any, 'delete') && (
                <button
                  onClick={() => setIsBulkModalOpen(true)}
                  style={{
                    background: 'var(--status-error)', 
                    color: 'white', border: 'none',
                    padding: '12px 28px', borderRadius: 12, fontSize: 13, fontWeight: 900,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                    boxShadow: '0 8px 30px rgba(239, 68, 68, 0.4)',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase'
                  }}
                >
                  <Trash2 size={18} />
                  SECURITY PURGE PROTOCOL
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ display: 'flex', height: '100vh' }}>
        {/* Elite Navigation Sidebar */}
        <aside style={{ 
          width: 280, 
          minWidth: 280,
          background: '#0a1112', 
          borderRight: '1px solid rgba(0, 242, 255, 0.1)', 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100vh',
          zIndex: 150,
          boxShadow: '10px 0 40px rgba(0,0,0,0.4)',
          flexShrink: 0
        }}>
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <h1 style={{ fontSize: 13, fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>Admin Portal</h1>
                  <span style={{ fontSize: 9, color: 'var(--teal)', fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Digital Architecture</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, width: '100%', padding: '12px 24px', background: 'rgba(0,0,0,0.3)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <img src="/logos/modon_logo.png" alt="MODON" style={{ height: 16, objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
                  <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
                  <img src="/logos/insite_logo.png" alt="Insite" style={{ height: 16, objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
                </div>
            </div>
          </div>

          <nav className="custom-scrollbar" style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { id: 'tasks', label: 'Deliverable Matrix', icon: BarChart3, permission: 'tasks' },
              { id: 'bim-reviews', label: 'BIM Review Matrix', icon: Layers, permission: 'bimReviews' },
              { id: 'team', label: 'Project Team', icon: Users, permission: 'team' },
              { id: 'branding', label: 'Identity & Branding', icon: ImageIcon, permission: 'branding' },
              { id: 'reports', label: 'Report Settings', icon: FileText, permission: 'reports' },
              { id: 'homepage', label: 'Home Page CMS', icon: LayoutDashboard, permission: 'homePage' },
              { id: 'communications', label: 'Communications', icon: Megaphone, permission: 'broadcast' },
              { id: 'tickets', label: 'Access Tickets', icon: Inbox, permission: 'tickets' },
              { id: 'users', label: 'Access Control', icon: Shield, permission: 'users' }
            ].map((tab) => {
              if (tab.permission && !can(tab.permission as any, 'view')) return null;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 16,
                    background: isActive ? 'rgba(0, 242, 255, 0.08)' : 'transparent',
                    color: isActive ? 'var(--teal)' : 'rgba(255,255,255,0.5)',
                    border: isActive ? '1px solid rgba(0, 242, 255, 0.2)' : '1px solid transparent', 
                    cursor: 'pointer', transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    width: '100%', textAlign: 'left', position: 'relative', overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <tab.icon size={18} style={{ opacity: isActive ? 1 : 0.6, color: isActive ? 'var(--teal)' : 'inherit' }} />
                    <span style={{ fontSize: 13, fontWeight: isActive ? 800 : 500, letterSpacing: isActive ? '0.05em' : 'normal' }}>{tab.label}</span>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      initial={false}
                      style={{
                        position: 'absolute', left: 0, top: '15%', bottom: '15%', width: 3, background: 'var(--teal)', borderRadius: '0 4px 4px 0',
                        boxShadow: '0 0 15px rgba(0, 242, 255, 0.6)'
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => setIsLogoutConfirmOpen(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
                borderRadius: 16, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)',
                color: '#ef4444', fontSize: 12, fontWeight: 900, cursor: 'pointer', transition: 'all 200ms',
                letterSpacing: '0.15em', textTransform: 'uppercase'
              }}
            >
              <LogOut size={18} />
              Logout System
            </button>
          </div>
        </aside>

        <div className="admin-dashboard-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden', background: 'var(--background)', backgroundImage: 'radial-gradient(rgba(0, 242, 255, 0.05) 1px, transparent 1px)', backgroundSize: '32px 32px', backgroundPosition: 'center center' }}>
          <header style={{
            height: 72, 
            background: 'rgba(5, 10, 11, 0.8)', 
            backdropFilter: 'blur(30px)',
            borderBottom: '1px solid rgba(0, 242, 255, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '0 40px',
            position: 'sticky', 
            top: 0, 
            zIndex: 100
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <h2 style={{ 
                  fontSize: 14, 
                  fontWeight: 900, 
                  margin: 0, 
                  color: '#ffffff', 
                  letterSpacing: '0.25em', 
                  textTransform: 'uppercase', 
                  fontFamily: 'var(--font-heading)' 
                }}>
                  {activeTab === 'tasks' ? 'Deliverable Registry' : activeTab === 'bim-reviews' ? 'BIM Review Matrix' : activeTab === 'reports' ? 'Report Configuration' : activeTab === 'homepage' ? 'Home Page CMS' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1) + ' Management'}
                </h2>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <div style={{ fontSize: 13, color: '#ffffff', fontWeight: 800, letterSpacing: '0.02em' }}>{userProfile?.name || 'Administrator'}</div>
                  <div style={{ fontSize: 10, color: 'var(--teal)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{userProfile?.role || 'ADMIN'}</div>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--teal)', color: '#050a0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, boxShadow: '0 0 20px rgba(0, 242, 255, 0.3)' }}>
                  {userProfile?.name?.charAt(0)}
                </div>
              </div>
            </div>
          </header>

          <main style={{ 
            padding: '40px', 
            flex: 1, 
            overflowY: 'auto', 
            overflowX: 'hidden', 
            height: 'calc(100vh - 72px)',
            background: 'transparent' 
          }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                <GlassCard padding="none">
                  <div style={{ padding: '32px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)' }}>
                    <div>
                      <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#ffffff', letterSpacing: '0.02em' }}>
                        {activeTab === 'tasks' ? 'Digital Deliverable Matrix' : activeTab === 'bim-reviews' ? 'BIM Review Intelligence Matrix' : activeTab === 'team' ? 'Active Digital Project Team' : activeTab === 'registry' ? 'Digital Asset Registry Index' : activeTab === 'branding' ? 'Project Identity & Branding' : activeTab === 'communications' ? 'Elite Communications Hub' : 'Security Access Registry'}
                      </h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8, fontWeight: 500, letterSpacing: '0.01em' }}>
                        {activeTab === 'bim-reviews' ? 'Strategic oversight of cross-project BIM submission reviews and status tracking' : activeTab === 'users' ? 'Management of security clearances and administrative roles' : activeTab === 'branding' ? 'Configuration of project branding and site-wide metadata' : activeTab === 'communications' ? 'Dispatch real-time broadcasts and premium SMTP mail notifications' : 'Real-time synchronization with Digital Workflow Systems'}
                      </p>
                    </div>
                  </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                      {activeTab === 'users' && userProfile?.isAdmin && (
                        <div style={{ display: 'flex', background: 'var(--secondary)', padding: 4, borderRadius: 10, border: '1px solid var(--border)', marginRight: 20 }}>
                          <button
                            onClick={() => setActiveSubTab('users')}
                            style={{ padding: '6px 16px', borderRadius: 8, background: activeSubTab === 'users' ? 'var(--teal)' : 'transparent', color: activeSubTab === 'users' ? 'var(--text-on-primary)' : 'var(--teal)', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 200ms' }}
                          >
                            USERS
                          </button>
                          {userProfile?.role === 'OWNER' && (
                            <button
                              onClick={() => setActiveSubTab('policies')}
                              style={{ padding: '6px 16px', borderRadius: 8, background: activeSubTab === 'policies' ? 'var(--teal)' : 'transparent', color: activeSubTab === 'policies' ? 'var(--text-on-primary)' : 'var(--teal)', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 200ms' }}
                            >
                              GROUP POLICY
                            </button>
                          )}
                        </div>
                      )}
                      {activeTab === 'team' && (
                        <div style={{ display: 'flex', background: 'var(--secondary)', padding: 4, borderRadius: 10, border: '1px solid var(--border)', marginRight: 20 }}>
                          <button
                            onClick={() => setTeamActiveSubTab('personnel')}
                            style={{ padding: '6px 16px', borderRadius: 8, background: teamActiveSubTab === 'personnel' ? 'var(--teal)' : 'transparent', color: teamActiveSubTab === 'personnel' ? 'var(--text-on-primary)' : 'var(--teal)', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 200ms' }}
                          >
                            PERSONNEL
                          </button>
                          <button
                            onClick={() => setTeamActiveSubTab('departments')}
                            style={{ padding: '6px 16px', borderRadius: 8, background: teamActiveSubTab === 'departments' ? 'var(--teal)' : 'transparent', color: teamActiveSubTab === 'departments' ? 'var(--text-on-primary)' : 'var(--teal)', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 200ms' }}
                          >
                            TASK CATEGORIES
                          </button>
                        </div>
                      )}
                      {activeTab !== 'branding' && activeTab !== 'reports' && activeTab !== 'communications' && (
                        <div style={{ position: 'relative' }}>
                          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input
                            type="text"
                            placeholder="Filter records..."
                            style={{ 
                              padding: '12px 20px 12px 42px', 
                              borderRadius: 14, 
                              background: 'var(--card-haze)', 
                              border: '1px solid var(--border)', 
                              color: 'var(--text-primary)', 
                              fontSize: 14, 
                              outline: 'none', 
                              width: 280,
                              transition: 'all 300ms',
                              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                            }}
                          />
                        </div>
                      )}
                      {activeTab === 'bim-reviews' && can('bimReviews', 'edit') && (
                        <>
                          <input 
                            type="file" 
                            ref={bimFileInputRef} 
                            onChange={handleBimExcelImport} 
                            accept=".xlsx, .xls, .csv" 
                            style={{ display: 'none' }} 
                          />
                          <button 
                            onClick={() => bimFileInputRef.current?.click()} 
                            style={{ 
                              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', 
                              borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', 
                              color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', 
                              cursor: 'pointer', fontSize: 13, fontWeight: 800 
                            }}
                          >
                            <FileSpreadsheet size={18} />
                            Import Matrix
                          </button>
                        </>
                      )}
                      
                      {activeTab === 'tasks' && can('tasks', 'edit') && (
                        <>
                          <input 
                            type="file" 
                            ref={taskFileInputRef} 
                            onChange={handleTaskExcelImport} 
                            accept=".xlsx, .xls, .csv" 
                            style={{ display: 'none' }} 
                          />
                          <button 
                            onClick={handleDownloadTaskTemplate}
                            style={{ 
                              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', 
                              borderRadius: 10, background: 'rgba(212, 175, 55, 0.1)', 
                              color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.2)', 
                              cursor: 'pointer', fontSize: 13, fontWeight: 800 
                            }}
                          >
                            <FileSpreadsheet size={18} />
                            Template
                          </button>
                          <button 
                            onClick={() => taskFileInputRef.current?.click()} 
                            style={{ 
                              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', 
                              borderRadius: 10, background: 'rgba(0, 128, 128, 0.1)', 
                              color: 'var(--teal)', border: '1px solid rgba(0, 128, 128, 0.2)', 
                              cursor: 'pointer', fontSize: 13, fontWeight: 800 
                            }}
                          >
                            <Database size={18} />
                            Import Matrix
                          </button>
                        </>
                      )}

                      {(activeTab === 'tasks' || activeTab === 'team' || activeTab === 'registry' || activeTab === 'bim-reviews') && can(activeTab as any, 'edit') && (
                        <button 
                          onClick={handleNewRecord} 
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 32px', 
                            borderRadius: 16, 
                            background: 'var(--teal)', color: 'var(--cotton)', border: 'none', cursor: 'pointer', 
                            fontSize: 13, fontWeight: 900,
                            boxShadow: 'var(--shadow-premium)',
                            transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            fontFamily: 'var(--font-heading)'
                          }}
                          onMouseEnter={(e: any) => e.currentTarget.style.boxShadow = '0 10px 35px rgba(0, 63, 73, 0.3)'}
                          onMouseLeave={(e: any) => e.currentTarget.style.boxShadow = 'var(--shadow-premium)'}
                        >
                          <Plus size={18} />
                          Authorized Entry
                        </button>
                      )}
                      {activeTab === 'tickets' && (
                        <div style={{ display: 'flex', gap: 12 }}>
                          <button 
                            onClick={async () => {
                              showToast('Feature engaged: Automatic ticket prioritization scheduled.', 'INFO');
                            }} 
                            style={{ 
                              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', 
                              borderRadius: 10, background: 'rgba(212, 175, 55, 0.1)', 
                              color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.2)', 
                              cursor: 'pointer', fontSize: 13, fontWeight: 800 
                            }}
                          >
                            <CheckCircle2 size={18} />
                            Quick Triage
                          </button>
                        </div>
                      )}
                    </div>
                  <div style={{ overflowX: (activeTab === 'reports' || activeTab === 'branding' || activeTab === 'communications' || activeTab === 'homepage') ? 'hidden' : 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: (activeTab === 'reports' || activeTab === 'branding' || activeTab === 'communications' || activeTab === 'homepage') ? 'fixed' : 'auto' }}>
                      {activeTab !== 'branding' && activeTab !== 'reports' && activeTab !== 'communications' && activeTab !== 'homepage' && !(activeTab === 'users' && activeSubTab === 'policies') && (
                        <thead style={{ background: 'transparent', borderBottom: '2px solid var(--border)' }}>
                          <tr>
                            <th style={{ width: 80, padding: '24px 0', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={currentTabIds.length > 0 && currentTabIds.every(id => selectedIds.has(id))}
                                onChange={() => toggleSelectAll(currentTabIds)}
                                style={{ cursor: 'pointer', width: 20, height: 20, accentColor: 'var(--teal)' }}
                              />
                            </th>
                            {activeTab === 'bim-reviews' ? (
                              <>
                                <th style={{ textAlign: 'center', padding: '24px 32px', fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Project Detail</th>
                                <th style={{ textAlign: 'center', padding: '24px 32px', fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Phase</th>
                                <th style={{ textAlign: 'center', padding: '24px 32px', fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Gate Status</th>
                                <th style={{ textAlign: 'center', padding: '24px 32px', fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Final Audit</th>
                                <th style={{ textAlign: 'center', padding: '24px 32px', fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Lead Reviewer</th>
                                <th style={{ textAlign: 'center', padding: '24px 32px', fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Target Date</th>
                                <th style={{ textAlign: 'center', padding: '24px 32px', fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Log History</th>
                                <th style={{ textAlign: 'center', padding: '24px 32px', fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Control</th>
                              </>
                            ) : activeTab === 'tickets' ? (
                              <>
                                <th style={{ textAlign: 'center', padding: '24px 32px', fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Ticket ID & Requester</th>
                                <th style={{ textAlign: 'center', padding: '24px 32px', fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Reason & Message</th>
                                <th style={{ textAlign: 'center', padding: '24px 32px', fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Priority & Status</th>
                                <th style={{ textAlign: 'center', padding: '24px 32px', fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Lifecycle Control</th>
                              </>
                            ) : (
                              <>
                                {activeTab === 'tasks' && (
                                  <th style={{ textAlign: 'center', padding: '24px 16px', fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', whiteSpace: 'nowrap', width: 120 }}>ID</th>
                                )}
                                <th style={{ textAlign: 'center', padding: '24px 16px', fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', width: 400 }}>
                                  {activeTab === 'users' ? 'Staff Identity' : activeTab === 'team' ? (teamActiveSubTab === 'personnel' ? 'Project Personnel' : 'Task Category') : (activeTab === 'tasks' ? 'Task Name' : 'Task Definition / Asset')}
                                </th>
                                <th style={{ textAlign: 'center', padding: '24px 16px', fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', whiteSpace: 'nowrap', width: 200 }}>
                                  {activeTab === 'users' ? 'Protocol Clearance' : (activeTab === 'team' ? (teamActiveSubTab === 'personnel' ? 'Department' : 'Abbreviation') : (activeTab === 'registry' ? 'Category' : 'Project Precinct'))}
                                </th>
                                <th style={{ textAlign: 'center', padding: '24px 16px', fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', whiteSpace: 'nowrap', width: 130 }}>
                                  {activeTab === 'users' ? 'Admin Access' : (activeTab === 'team' ? (teamActiveSubTab === 'personnel' ? 'Email' : 'Last Updated') : (activeTab === 'registry' ? 'Department' : 'Task Category'))}
                                </th>
                                {activeTab !== 'tasks' && (
                                  <th style={{ textAlign: 'center', padding: '24px 16px', fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', whiteSpace: 'nowrap', width: activeTab === 'users' ? 240 : 160 }}>
                                    {activeTab === 'users' ? 'Feature Modules' : 'Control'}
                                  </th>
                                )}
                                {(activeTab === 'tasks' || activeTab === 'users') && (
                                  <th style={{ textAlign: 'center', padding: '24px 16px', fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', whiteSpace: 'nowrap', width: activeTab === 'tasks' ? 180 : 150 }}>
                                    {activeTab === 'tasks' ? 'Submitter' : 'Control'}
                                  </th>
                                )}
                                {activeTab === 'tasks' && (
                                  <>
                                    <th style={{ textAlign: 'center', padding: '24px 16px', fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', whiteSpace: 'nowrap', width: 150 }}>
                                      Submission Date
                                    </th>
                                    <th style={{ textAlign: 'center', padding: '24px 16px', fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', whiteSpace: 'nowrap', width: 120 }}>
                                      Control
                                    </th>
                                  </>
                                )}
                              </>
                            )}
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {activeTab === 'tasks' && tasksSnapshot?.docs.map((doc: any, i: number) => {
                          const task = doc.data() as Task;
                          const isSelected = selectedIds.has(doc.id);
                          return (
                            <motion.tr 
                              key={doc.id || `task-${i}`} 
                              whileHover={{ background: 'var(--card-haze)' }}
                              style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isSelected ? 'var(--secondary)' : 'rgba(0, 63, 73, 0.01)', transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} 
                              onClick={() => handleEditRecord(task)}
                            >
                              <td style={{ textAlign: 'center', padding: '32px 0' }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => toggleSelect(doc.id, e as any)}
                                  style={{ cursor: 'pointer', width: 20, height: 20, accentColor: 'var(--teal)' }}
                                />
                              </td>
                              <td style={{ padding: '24px 16px', textAlign: 'center' }}>
                                <div style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{task.id || '—'}</div>
                              </td>
                              <td style={{ padding: '24px 16px', textAlign: 'center' }}>
                                <div style={{ 
                                  fontWeight: 800, 
                                  fontSize: 13, 
                                  color: 'var(--text-primary)', 
                                  letterSpacing: '0.01em', 
                                  fontFamily: 'var(--font-heading)',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  lineHeight: '1.4',
                                  width: '400px',
                                  margin: '0 auto'
                                }}>{task.title}</div>
                              </td>
                              {/* Project Precinct */}
                              <td style={{ padding: '24px 16px', textAlign: 'center' }}>
                                {task.precinct ? (
                                  <span style={{ fontSize: 10, background: 'rgba(0, 63, 73, 0.05)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: 8, fontWeight: 800, letterSpacing: '0.05em', border: '1px solid var(--border)' }}>
                                    {task.precinct}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>
                                )}
                              </td>
                              {/* Task Category */}
                              <td style={{ padding: '24px 16px', textAlign: 'center' }}>
                                {(() => {
                                  const d = memoizedDepartments.find(dept => dept.id === task.department || dept.name === task.department);
                                  return (
                                    <span style={{ fontSize: 10, background: 'var(--secondary)', color: 'var(--teal)', padding: '8px 16px', borderRadius: 10, fontWeight: 900, letterSpacing: '0.1em', border: '1px solid var(--border)', textTransform: 'uppercase' }}>
                                      {d ? d.name : task.department || '—'}
                                    </span>
                                  );
                                })()}
                              </td>

                              {/* Submitter */}
                              <td style={{ padding: '24px 16px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                  {task.submitterName && (
                                    <div style={{
                                      width: 32, height: 32, borderRadius: 10,
                                      background: 'var(--secondary)', border: '1px solid var(--border)',
                                      color: 'var(--teal)', fontSize: 12, fontWeight: 900,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      flexShrink: 0, overflow: 'hidden'
                                    }}>
                                      {userAvatarByUid[task.submitterId || ''] ? (
                                        <img src={userAvatarByUid[task.submitterId || '']} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      ) : (
                                        task.submitterName.charAt(0).toUpperCase()
                                      )}
                                    </div>
                                  )}
                                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{task.submitterName || '—'}</span>
                                </div>
                              </td>
                              {/* Submission Date - Date Only */}
                              <td style={{ padding: '24px 16px', textAlign: 'center' }}>
                                <div style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 800, letterSpacing: '0.05em' }}>
                                  {formatDate(task.submittingDate)}
                                </div>
                              </td>
                              <td style={{ padding: '24px 16px', textAlign: 'center' }} onClick={(e) => { e.stopPropagation(); handleEditRecord(task); }}>
                                <MoreVertical size={20} color="var(--text-muted)" />
                              </td>
                            </motion.tr>
                          );
                        })}
                        {activeTab === 'tasks' && tasksError && (
                          <tr>
                            <td colSpan={5} style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--status-error)' }}>
                              <p>Error querying tasks: {tasksError.message}</p>
                            </td>
                          </tr>
                        )}
                        {activeTab === 'tasks' && (!tasksSnapshot || tasksSnapshot.docs.length === 0) && !tasksLoading && !tasksError && (
                          <tr>
                            <td colSpan={5} style={{ padding: '60px 40px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Inbox size={24} style={{ color: 'var(--text-muted)' }} />
                                </div>
                                <div>
                                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No current data</p>
                                  {!isAuthorized && <p style={{ fontSize: 12, color: 'var(--status-error)' }}>Authorization rejected by client state.</p>}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                         {activeTab === 'team' && teamActiveSubTab === 'personnel' && membersSnapshot?.docs.map((doc: any, i: number) => {
                            const member = { id: doc.id, ...doc.data() } as any;
                            const isSelected = selectedIds.has(doc.id);
                            
                            const matchedDept = departmentsSnapshot?.docs.find((d: any) => d.id === member.department || d.data().name === member.department)?.data();
                            const deptDisplay = matchedDept ? matchedDept.name : member.department || 'Awaiting Assignment';

                             return (
                            <motion.tr 
                              key={doc.id || `member-${i}`} 
                              whileHover={{ background: 'var(--card-haze)' }}
                              style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isSelected ? 'var(--secondary)' : 'rgba(0, 63, 73, 0.01)', transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} 
                              onClick={() => handleEditRecord(member)}
                            >
                              <td style={{ textAlign: 'center', padding: '32px 0' }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => toggleSelect(doc.id, e as any)}
                                  style={{ cursor: 'pointer', width: 20, height: 20, accentColor: 'var(--teal)' }}
                                />
                              </td>
                               <td style={{ padding: '24px 32px', textAlign: 'center' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                                   {member.avatar ? (
                                     <img src={member.avatar} style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }} alt={member.name} />
                                   ) : (
                                     <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(0, 63, 73, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#003F49', fontSize: 11, fontWeight: 900 }}>
                                       {(member.name || 'A').charAt(0).toUpperCase()}
                                     </div>
                                   )}
                                   <div style={{ width: 8, height: 8, borderRadius: '50%', background: member.status === 'ACTIVE' ? '#10b981' : '#f59e0b', flexShrink: 0, marginLeft: -4, marginTop: 22, border: '2px solid white', zIndex: 1 }} />
                                   <div style={{ fontWeight: 950, fontSize: 17, color: '#000000', letterSpacing: '-0.01em', fontFamily: 'var(--font-heading)' }}>{member.name || 'Anonymous User'}</div>
                                 </div>
                               </td>
                               <td style={{ padding: '24px 32px', textAlign: 'center' }}>
                                 <span style={{ fontSize: 10, background: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6', padding: '8px 16px', borderRadius: 10, fontWeight: 900, letterSpacing: '0.1em', border: '1px solid rgba(139, 92, 246, 0.15)' }}>{deptDisplay}</span>
                               </td>
                               <td style={{ padding: '24px 32px', textAlign: 'center' }}>
                                 <div style={{ fontSize: 15, color: '#000000', fontWeight: 900 }}>{member.email}</div>
                               </td>
                               <td style={{ padding: '24px 32px', textAlign: 'center' }}>
                                 <button style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                                   <MoreVertical size={20} />
                                 </button>
                               </td>
                             </motion.tr>
                           );
                         })}

                        {activeTab === 'team' && teamActiveSubTab === 'departments' && (departmentsSnapshot?.docs.length || 0) > 0 && departmentsSnapshot?.docs.map((doc: any) => {
                          const dept = { id: doc.id, ...doc.data() } as any;
                          const isSelected = selectedIds.has(doc.id);
                          return (
                            <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isSelected ? 'var(--secondary)' : 'rgba(0, 63, 73, 0.01)' }} onClick={() => handleEditRecord(dept)}>
                              <td style={{ textAlign: 'center', padding: '16px 0' }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => toggleSelect(doc.id, e as any)}
                                  style={{ cursor: 'pointer', width: 16, height: 16, accentColor: 'var(--teal)' }}
                                />
                              </td>
                              <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{dept.name}</div>
                              </td>
                              <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                                <span style={{ fontSize: 13, background: 'var(--secondary)', color: 'var(--teal)', padding: '4px 10px', borderRadius: 6, fontWeight: 700, letterSpacing: '0.05em' }}>{dept.abbreviation}</span>
                              </td>
                              <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                                <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                                  {new Date(dept.updatedAt || dept.createdAt).toLocaleDateString()}
                                </div>
                              </td>
                              <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                                <button style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                                  <MoreVertical size={18} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {activeTab === 'team' && teamActiveSubTab === 'departments' && !departmentsLoading && (departmentsSnapshot?.docs.length || 0) === 0 && (
                          <tr>
                            <td colSpan={7} style={{ padding: '60px 40px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Building2 size={24} style={{ color: 'var(--teal)' }} />
                                </div>
                                <div>
                                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No current data</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        {activeTab === 'team' && teamActiveSubTab === 'personnel' && !membersLoading && (!membersSnapshot || membersSnapshot.docs.length === 0) && (
                          <tr>
                            <td colSpan={7} style={{ padding: '60px 40px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Users size={24} style={{ color: 'var(--teal)' }} />
                                </div>
                                <div>
                                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No current data</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        {activeTab === 'bim-reviews' && bimReviewsSnapshot?.docs.map((doc: any, i: number) => {
                          const review = { id: doc.id, ...doc.data() } as BIMReview;
                          const isSelected = selectedIds.has(doc.id);
                          return (
                            <motion.tr 
                              key={doc.id || `bim-${i}`} 
                              whileHover={{ background: 'var(--card-haze)' }}
                              style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isSelected ? 'var(--secondary)' : 'rgba(0, 63, 73, 0.01)', transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} 
                              onClick={() => { setSelectedBimReview(review); setIsModalOpen(true); }}
                            >
                              <td style={{ textAlign: 'center', padding: '32px 0' }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => toggleSelect(doc.id, e as any)}
                                  style={{ cursor: 'pointer', width: 20, height: 20, accentColor: 'var(--teal)' }}
                                />
                              </td>
                              <td style={{ padding: '24px 32px', textAlign: 'center' }}>
                                <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-primary)', letterSpacing: '0.02em', fontFamily: 'var(--font-heading)' }}>{review.project}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220, fontWeight: 700, letterSpacing: '0.05em' }}>{review.submissionDescription}</div>
                              </td>
                              <td style={{ padding: '24px 32px', textAlign: 'center' }}>
                                <span style={{ fontSize: 10, background: 'var(--secondary)', color: 'var(--teal)', padding: '8px 16px', borderRadius: 10, fontWeight: 900, letterSpacing: '0.1em', border: '1px solid var(--border)', textTransform: 'uppercase' }}>{review.designStage}</span>
                              </td>
                              <td style={{ padding: '24px 32px', textAlign: 'center' }}>
                                <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 800 }}>{review.insiteBimReviewStatus || '—'}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{review.stakeholder}</div>
                              </td>
                              <td style={{ padding: '24px 32px', textAlign: 'center' }}>
                                <div style={{ fontSize: 13, color: 'var(--status-success)', fontWeight: 900 }}>{review.modonHillFinalReviewStatus || '—'}</div>
                              </td>
                              <td style={{ padding: '24px 32px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                  {review.insiteReviewer && (
                                    <div style={{
                                      width: 32, height: 32, borderRadius: 10,
                                      background: 'var(--secondary)', border: '1px solid var(--border)',
                                      color: 'var(--teal)', fontSize: 12, fontWeight: 900,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      flexShrink: 0, overflow: 'hidden', position: 'relative'
                                    }}>
                                      {userAvatarByUid[review.insiteReviewerId || ''] ? (
                                        <img 
                                          src={userAvatarByUid[review.insiteReviewerId || '']} 
                                          alt={review.insiteReviewer} 
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                      ) : userAvatarByEmail[review.insiteReviewerEmail?.toLowerCase() || ''] ? (
                                        <img 
                                          src={userAvatarByEmail[review.insiteReviewerEmail?.toLowerCase() || '']} 
                                          alt={review.insiteReviewer} 
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                      ) : userAvatarByExactName[review.insiteReviewer || ''] ? (
                                        <img 
                                          src={userAvatarByExactName[review.insiteReviewer || '']} 
                                          alt={review.insiteReviewer} 
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                      ) : (
                                        review.insiteReviewer?.charAt(0).toUpperCase()
                                      )}
                                    </div>
                                  )}
                                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 700 }}>{review.insiteReviewer || '—'}</div>
                                </div>
                              </td>
                              <td style={{ padding: '24px 32px', textAlign: 'center' }}>
                                <div style={{ fontSize: 14, color: 'var(--status-warning)', fontWeight: 900, letterSpacing: '0.02em' }}>{review.insiteReviewDueDate || '—'}</div>
                              </td>
                              <td style={{ padding: '24px 32px', textAlign: 'center' }}>
                                <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 700 }}>{review.submissionDate || '—'}</div>
                                <div style={{ fontSize: 10, color: review.onAcc === 'SHARED' ? 'var(--status-success)' : 'var(--status-error)', fontWeight: 900, marginTop: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{review.onAcc}</div>
                              </td>
                              <td style={{ padding: '24px 32px', textAlign: 'center' }} onClick={(e) => { e.stopPropagation(); setSelectedBimReview(review); setIsModalOpen(true); }}>
                                <MoreVertical size={22} color="var(--text-muted)" />
                              </td>
                            </motion.tr>
                          );
                        })}
                        {activeTab === 'bim-reviews' && bimReviewsSnapshot?.docs.length === 0 && (
                          <tr>
                            <td colSpan={9} style={{ padding: '60px 40px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Layers size={24} style={{ color: 'var(--teal)' }} />
                                </div>
                                <div>
                                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No intelligence records found</p>
                                  <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0 }}>The repository contains no active records for the Matrix.</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {activeTab === 'registry' && registrySnapshot?.docs.map((doc: any) => {
                          const item = doc.data() as DashboardNavItem;
                          const isSelected = selectedIds.has(doc.id);
                            const regMatchedDept = departmentsSnapshot?.docs.find((d: any) => d.id === item.department || d.data().name === item.department)?.data();
                            const regDeptDisplay = regMatchedDept ? regMatchedDept.name : item.department || 'General';

                            return (
                              <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isSelected ? 'var(--secondary)' : 'rgba(0, 63, 73, 0.01)' }} onClick={() => handleEditRecord(item)}>
                                <td style={{ textAlign: 'center', padding: '16px 0' }} onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => toggleSelect(doc.id, e as any)}
                                    style={{ cursor: 'pointer', width: 16, height: 16, accentColor: 'var(--teal)' }}
                                  />
                                </td>
                                <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{item.name}</div>
                                </td>
                                <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{item.category}</div>
                                </td>
                                <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                                  <span style={{ fontSize: 13, background: 'var(--secondary)', color: 'var(--teal)', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>{regDeptDisplay}</span>
                                </td>
                              <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                                <button style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                                  <MoreVertical size={18} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {activeTab === 'registry' && !registryLoading && registrySnapshot?.docs.length === 0 && (
                          <tr>
                            <td colSpan={5} style={{ padding: '60px 40px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <LayoutDashboard size={24} style={{ color: 'var(--teal)' }} />
                                </div>
                                <div>
                                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No current data</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {activeTab === 'users' && activeSubTab === 'users' && usersSnapshot?.docs.map((doc: any) => {
                          const userRec = doc.data();
                          const isSelected = selectedIds.has(doc.id);
                          return (
                            <motion.tr 
                              key={doc.id} 
                              whileHover={{ background: 'var(--card-haze)' }}
                              style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isSelected ? 'var(--secondary)' : 'rgba(0, 63, 73, 0.01)', transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} 
                              onClick={() => handleEditRecord(userRec)}
                            >
                              <td style={{ textAlign: 'center', padding: '16px 0' }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => toggleSelect(doc.id, e as any)}
                                  style={{ cursor: 'pointer', width: 20, height: 20, accentColor: 'var(--teal)' }}
                                />
                              </td>
                              <td style={{ padding: '24px 16px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                                  {userRec.avatar ? (
                                    <img src={userRec.avatar} style={{ width: 36, height: 36, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--border)' }} alt={userRec.name} />
                                  ) : (
                                    <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(0, 63, 73, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#003F49', fontSize: 12, fontWeight: 950 }}>
                                      {(userRec.name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <div style={{ fontWeight: 950, fontSize: 16, color: '#000000', letterSpacing: '-0.01em', fontFamily: 'var(--font-heading)' }}>{userRec.name || 'Unknown Subject'}</div>
                                    <div style={{ fontSize: 13, color: '#000000', marginTop: 2, fontWeight: 800 }}>{userRec.email}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: userRec.isVerified ? '#10b981' : '#f59e0b' }} />
                                      <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{userRec.isVerified ? 'Access Verified' : 'Handshake Pending'}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                  <span style={{ fontSize: 10, background: userRec.isApproved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: userRec.isApproved ? 'var(--status-success)' : 'var(--status-error)', border: `1px solid ${userRec.isApproved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, padding: '6px 14px', borderRadius: 12, fontWeight: 900, letterSpacing: '0.1em', display: 'flex', alignItems: 'center' }}>
                                    {userRec.isApproved ? 'APPROVED' : 'PENDING'}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                                {(() => {
                                  const roleLabel = (userRec.role === 'OWNER' || userRec.email?.toLowerCase() === 'hesham.habib@insiteinternational.com') ? 'OWNER' : (userRec.isAdmin ? 'ADMIN' : 'USER');
                                  const roleColor = roleLabel === 'OWNER' ? '#d4af37' : roleLabel === 'ADMIN' ? 'var(--teal)' : 'var(--text-secondary)';
                                  const roleBg = roleLabel === 'OWNER' ? 'rgba(212, 175, 55, 0.1)' : roleLabel === 'ADMIN' ? 'rgba(0, 63, 73, 0.08)' : 'transparent';
                                  
                                  return (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: roleBg, padding: '6px 12px', borderRadius: 8, border: roleBg !== 'transparent' ? `1px solid ${roleColor}` : '1px solid transparent' }}>
                                      <Shield size={14} color={roleColor} style={{ filter: roleLabel === 'OWNER' ? 'drop-shadow(0 0 4px rgba(212,175,55,0.4))' : 'none' }} />
                                      <span style={{ fontSize: 11, color: roleColor, fontWeight: 900, letterSpacing: '0.05em' }}>{roleLabel}</span>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                                  {userRec.access?.deliverablesRegistry && (
                                    <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--teal)', background: 'var(--cotton)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 6, letterSpacing: '0.05em', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>DELIVERABLES</span>
                                  )}
                                  {userRec.access?.bimReviews && (
                                    <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--accent)', background: 'var(--cotton)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 6, letterSpacing: '0.05em', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>BIM REVIEWS</span>
                                  )}
                                  {!userRec.access?.deliverablesRegistry && !userRec.access?.bimReviews && (
                                    <span style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 700, fontStyle: 'italic' }}>None Assigned</span>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                                <button style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                                  <MoreVertical size={18} />
                                </button>
                              </td>
                            </motion.tr>
                          );
                        })}
                        {activeTab === 'users' && activeSubTab === 'users' && !usersLoading && usersSnapshot?.docs.length === 0 && (
                          <tr>
                            <td colSpan={5} style={{ padding: '60px 40px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Shield size={24} style={{ color: 'var(--teal)' }} />
                                </div>
                                <div>
                                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No current data</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {activeTab === 'tickets' && ticketsSnapshot?.docs.map((doc: any) => {
                          const ticket = doc.data() as any;
                          const isSelected = selectedIds.has(doc.id);
                          const statusColors: Record<string, string> = {
                            PENDING: '#f59e0b',
                            IN_PROGRESS: '#3b82f6',
                            RESOLVED: '#10b981',
                            REJECTED: '#ef4444'
                          };

                          return (
                            <motion.tr 
                              key={doc.id} 
                              whileHover={{ background: 'var(--card-haze)' }}
                              style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isSelected ? 'var(--secondary)' : 'rgba(0, 63, 73, 0.01)', transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} 
                            >
                              <td style={{ textAlign: 'center', padding: '32px 0' }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => toggleSelect(doc.id, e as any)}
                                  style={{ cursor: 'pointer', width: 20, height: 20, accentColor: 'var(--teal)' }}
                                />
                              </td>
                              <td style={{ padding: '32px' }}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
                                  <div style={{
                                    width: 36, height: 36, borderRadius: 12,
                                    background: 'var(--secondary)', border: '1px solid var(--border)',
                                    color: 'var(--teal)', fontSize: 13, fontWeight: 900,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, overflow: 'hidden', position: 'relative'
                                  }}>
                                    {userAvatarByEmail[ticket.email?.toLowerCase()] ? (
                                      <img 
                                        src={userAvatarByEmail[ticket.email?.toLowerCase()]} 
                                        alt={ticket.email} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                      />
                                    ) : (
                                      ticket.email?.charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: 16, fontWeight: 900, color: '#D4AF37', letterSpacing: '0.05em' }}>{ticket.id}</span>
                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{ticket.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '32px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', maxWidth: 400 }}>
                                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ticket.reason}</span>
                                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>{ticket.message}</div>
                                </div>
                              </td>
                              <td style={{ padding: '32px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                                  <div style={{ padding: '6px 16px', borderRadius: 100, background: `${statusColors[ticket.status]}20`, border: `1px solid ${statusColors[ticket.status]}40`, color: statusColors[ticket.status], fontSize: 10, fontWeight: 900, letterSpacing: '0.1em' }}>
                                    {ticket.status}
                                  </div>
                                  <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700 }}>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                </div>
                              </td>
                              <td style={{ padding: '32px' }} onClick={(e) => e.stopPropagation()}>
                                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                                  <button
                                    onClick={() => setTicketToResolve({ id: doc.id, ticketId: ticket.id })}
                                    className="elite-action-btn"
                                    style={{ padding: 12, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', cursor: 'pointer' }}
                                    title="Mark Resolved"
                                  >
                                    <Check size={18} />
                                  </button>
                                  <button
                                    onClick={() => setTicketToReject({ id: doc.id, ticketId: ticket.id })}
                                    className="elite-action-btn"
                                    style={{ padding: 12, borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', cursor: 'pointer' }}
                                    title="Reject Ticket"
                                  >
                                    <X size={18} />
                                  </button>
                                  <button
                                    onClick={() => setTicketToDelete({ id: doc.id, ticketId: ticket.id })}
                                    className="elite-action-btn"
                                    style={{ padding: 12, borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', cursor: 'pointer' }}
                                    title="Delete Record"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                        {activeTab === 'tickets' && (!ticketsSnapshot || ticketsSnapshot.docs.length === 0) && !ticketsLoading && (
                          <tr>
                            <td colSpan={5} style={{ padding: '60px 40px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Inbox size={24} style={{ color: 'var(--teal)' }} />
                                </div>
                                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>No active support tickets found</p>
                              </div>
                            </td>
                          </tr>
                        )}

                        {activeTab === 'users' && activeSubTab === 'policies' && userProfile?.role === 'OWNER' && (
                          <tr style={{ background: 'transparent' }}>
                            <td colSpan={5} style={{ padding: '0' }}>
                              <GroupPolicyList onEditPolicy={(p: any) => setSelectedPolicy(p)} />
                            </td>
                          </tr>
                        )}

                        {activeTab === 'branding' && (
                          <tr style={{ background: 'transparent' }}>
                            <td colSpan={5} style={{ padding: '40px' }}>
                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  setIsBrandingUpdating(true);
                                  try {
                                    const formData = new FormData(e.currentTarget);
                                    const updates: any = Object.fromEntries(formData.entries());

                                    updates.title = localTitle;
                                    updates.projectName = localProjectName;
                                    updates.location = localLocation;
                                    updates.reportTitle = localReportTitle;
                                    updates.reportSubtitle = localReportSubtitle;
                                    updates.reportSummary = localReportSummary;

                                    const finalPartnerLogosUrls: string[] = [];
                                    for (let i = 0; i < partnerLogosList.length; i++) {
                                      const item = partnerLogosList[i];
                                      if (item.file) {
                                        const uploadedUrl = await uploadFile(item.file, `branding/partner-logo-${Date.now()}-${i}`);
                                        finalPartnerLogosUrls.push(uploadedUrl);
                                      } else {
                                        finalPartnerLogosUrls.push(item.url);
                                      }
                                    }
                                    updates.partnerLogos = finalPartnerLogosUrls;

                                    updates.subtitles = subtitleList.map(s => s.text).filter(t => t.trim() !== '');

                                    if (headerBgFile) {
                                      const bgUrl = await uploadFile(headerBgFile, `branding/header-bg-${Date.now()}`);
                                      updates.headerBgUrl = bgUrl;
                                    }
                                    updates.headerBgOpacity = bgOpacity;
                                    updates.headerBgPositionY = bgPosY;
                                    updates.headerBgPositionX = bgPosX;
                                    updates.allowedDomains = localAllowedDomains;
                                    updates.headerBadges = localHeaderBadges;

                                    await updateProjectMetadata(updates);
                                    showToast('Global branding synchronized across all terminals.', 'SUCCESS');
                                    setInitializedLogos(false);
                                    setInitializedLocalFields(false);
                                    setHeaderBgFile(null);
                                  } catch (err: any) {
                                    console.error('[UPLINK_FAILURE]', err);
                                    showToast('Branding synchronization failure.', 'ERROR');
                                  } finally {
                                    setIsBrandingUpdating(false);
                                  }
                                }}
                                style={{ display: 'flex', flexDirection: 'column', gap: 32 }}
                              >
                                {/* Section 1: Core Project Identity */}
                                <div style={{ 
                                  padding: 32, background: 'var(--secondary)', border: '1px solid var(--border)', 
                                  borderRadius: 28, display: 'flex', flexDirection: 'column', gap: 24 
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(208,171,130,0.1)', border: '1px solid rgba(208,171,130,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Type size={20} color="var(--sunlit-rock)" />
                                    </div>
                                    <div>
                                      <h3 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Core Project Identity</h3>
                                      <p style={{ fontSize: 10, color: 'var(--text-dim)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary metadata for the project ecosystem</p>
                                    </div>
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                      <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Project Sector / Category</label>
                                      <input
                                        name="title"
                                        value={localTitle}
                                        onChange={(e) => setLocalTitle(e.target.value)}
                                        placeholder="e.g. Infrastructure Hub"
                                        style={{ padding: '16px 20px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 16, color: 'var(--text-primary)', fontSize: 15, outline: 'none', transition: 'all 200ms' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                      <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Primary Project Name</label>
                                      <input
                                        name="projectName"
                                        value={localProjectName}
                                        onChange={(e) => setLocalProjectName(e.target.value)}
                                        placeholder="e.g. North Sector Expansion"
                                        style={{ padding: '16px 20px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 16, color: 'var(--text-primary)', fontSize: 15, outline: 'none', transition: 'all 200ms' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                      <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Region / Location</label>
                                      <div style={{ position: 'relative' }}>
                                        <MapPin size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--border)' }} />
                                        <input 
                                          value={localLocation} 
                                          onChange={(e) => setLocalLocation(e.target.value)} 
                                          style={{ width: '100%', padding: '16px 16px 16px 44px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 16, color: 'var(--text-primary)', fontSize: 15, outline: 'none' }} 
                                        />
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                      <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Project Subtitles</label>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {subtitleList.map((sub, idx) => (
                                          <div key={sub.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 12 }}>
                                            <input
                                              value={sub.text}
                                              onChange={(e) => {
                                                const newList = [...subtitleList];
                                                newList[idx].text = e.target.value;
                                                setSubtitleList(newList);
                                              }}
                                              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: 140 }}
                                              placeholder="Subtitle text..."
                                            />
                                            <button type="button" onClick={() => setSubtitleList(prev => prev.filter((_, i) => i !== idx))} disabled={idx === 0} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: idx === 0 ? 0 : 0.6 }}><X size={14} /></button>
                                          </div>
                                        ))}
                                        <button type="button" onClick={() => setSubtitleList([...subtitleList, { id: `sub-${Date.now()}`, text: '' }])} style={{ padding: '8px 16px', borderRadius: 12, background: 'var(--border)', border: '1px solid var(--border)', color: 'var(--teal)', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}>+ ADD SUBTITLE</button>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Section 2: Visual Atmosphere */}
                                <div style={{ 
                                  padding: 32, background: 'var(--secondary)', border: '1px solid var(--border)', 
                                  borderRadius: 28, display: 'flex', flexDirection: 'column', gap: 24 
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ImageIcon size={20} color="#3b82f6" />
                                      </div>
                                      <div>
                                        <h3 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Atmospheric Branding (Header)</h3>
                                        <p style={{ fontSize: 10, color: 'var(--text-dim)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Banner visuals and cinematic backdrop controls</p>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
                                      <Activity size={14} color="var(--teal)" />
                                      <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--teal)' }}>OPTIMAL: 2400 X 200 PX</span>
                                    </div>
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
                                    {/* Banner Preview & Upload */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                      <div 
                                        style={{ 
                                          width: '100%', minHeight: 180, borderRadius: 20, border: '1px dashed var(--teal)', 
                                          background: 'var(--section-bg)', overflow: 'hidden', position: 'relative',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                      >
                                        {headerBgFile || localBgUrl || projectData?.headerBgUrl ? (
                                          <>
                                            <img 
                                              src={localBgUrl || projectData?.headerBgUrl} 
                                              style={{ 
                                                position: 'absolute', inset: 0, width: '100%', height: '100%', 
                                                objectFit: 'cover', objectPosition: `${bgPosX}% ${bgPosY}%`,
                                                opacity: bgOpacity / 100 
                                              }} 
                                              alt="Header Preview" 
                                            />
                                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', display: 'flex', alignItems: 'flex-end', padding: 20 }}>
                                              <button 
                                                type="button" 
                                                onClick={() => document.getElementById('header-bg-input')?.click()}
                                                style={{ background: 'var(--teal)', border: 'none', color: '#ffffff', padding: '10px 20px', borderRadius: 12, fontSize: 11, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 16px rgba(20, 184, 166, 0.3)' }}
                                              >
                                                <ImageIcon size={14} /> REPLACE BANNER ASSET
                                              </button>
                                            </div>
                                          </>
                                        ) : (
                                          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                              <Upload size={32} color="var(--border)" />
                                            </div>
                                            <button 
                                              type="button" 
                                              onClick={() => document.getElementById('header-bg-input')?.click()}
                                              style={{ background: 'var(--border)', border: '1px solid var(--border)', color: 'var(--teal)', padding: '12px 32px', borderRadius: 14, fontSize: 13, fontWeight: 900, cursor: 'pointer' }}
                                            >
                                              UPLOAD CINEMATIC BANNER
                                            </button>
                                          </div>
                                        )}
                                        <input 
                                          id="header-bg-input" type="file" accept="image/*" 
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              const reader = new FileReader();
                                              reader.onload = () => { setCropperSource(reader.result as string); setShowCropper(true); };
                                              reader.readAsDataURL(file);
                                            }
                                          }}
                                          style={{ display: 'none' }} 
                                        />
                                      </div>
                                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid var(--border)' }}>
                                        <Shield size={16} color="var(--teal)" style={{ marginTop: 2 }} />
                                        <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
                                          System supports ultra-high-resolution panoramas. Precision cropping will be applied to maintain strict terminal aspect ratios.
                                        </p>
                                      </div>
                                    </div>

                                    {/* Sliders & Controls */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24, background: 'var(--section-bg)', borderRadius: 20, border: '1px solid var(--border)' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Atmospheric Opacity</label>
                                          <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--teal)' }}>{bgOpacity}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={bgOpacity} onChange={(e) => setBgOpacity(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--teal)', height: 4 }} />
                                      </div>

                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Vertical Focus Offset (Y)</label>
                                          <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--teal)' }}>{bgPosY}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={bgPosY} onChange={(e) => setBgPosY(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--teal)', height: 4 }} />
                                      </div>

                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Horizontal Alignment (X)</label>
                                          <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--teal)' }}>{bgPosX}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={bgPosX} onChange={(e) => setBgPosX(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--teal)', height: 4 }} />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Section 3: Partner Registry */}
                                <div style={{ 
                                  padding: 32, background: 'var(--secondary)', border: '1px solid var(--border)', 
                                  borderRadius: 28, display: 'flex', flexDirection: 'column', gap: 24 
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Grid size={20} color="#10b981" />
                                      </div>
                                      <div>
                                        <h3 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Partner Logo Registry</h3>
                                        <p style={{ fontSize: 10, color: 'var(--text-dim)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Managing entity branding for the top-tier display</p>
                                      </div>
                                    </div>
                                    <button 
                                      type="button" 
                                      onClick={() => document.getElementById('partner-logo-input')?.click()} 
                                      style={{ 
                                        padding: '12px 28px', borderRadius: 14, background: 'var(--teal)', 
                                        border: 'none', color: '#ffffff', fontSize: 12, fontWeight: 900, 
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, 
                                        boxShadow: '0 8px 20px rgba(16,185,129,0.25)',
                                        letterSpacing: '0.05em'
                                      }}
                                    >
                                      <Plus size={16} /> REGISTER NEW LOGO
                                    </button>
                                    <input id="partner-logo-input" type="file" multiple accept="image/*" onChange={handlePartnerLogoSelect} style={{ display: 'none' }} />
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
                                    {partnerLogosList.map((logo, idx) => (
                                      <motion.div 
                                        key={logo.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} 
                                        style={{ 
                                          padding: 24, background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 24, 
                                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                                        }}
                                      >
                                        <div style={{ width: '100%', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1d1f', borderRadius: 18, padding: 20, border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.2)' }}>
                                          <img src={logo.url} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.1))' }} alt="Partner" />
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                                          <button type="button" onClick={() => movePartnerLogo(idx, 'up')} disabled={idx === 0} style={{ flex: 1, padding: '10px', background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--teal)', cursor: 'pointer', opacity: idx === 0 ? 0.2 : 1 }}><ChevronLeft size={16} /></button>
                                          <button type="button" onClick={() => movePartnerLogo(idx, 'down')} disabled={idx === partnerLogosList.length - 1} style={{ flex: 1, padding: '10px', background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--teal)', cursor: 'pointer', opacity: idx === partnerLogosList.length - 1 ? 0.2 : 1 }}><ChevronRight size={16} /></button>
                                          <button type="button" onClick={() => removePartnerLogo(idx)} style={{ flex: 1, padding: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: 12, color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                        </div>
                                      </motion.div>
                                    ))}
                                    {partnerLogosList.length === 0 && (
                                      <div style={{ gridColumn: 'span 4', padding: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '2px dashed var(--border)', borderRadius: 24 }}>
                                        <ImageIcon size={48} style={{ color: 'var(--border)', marginBottom: 16, opacity: 0.5 }} />
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>No partner identity vectors registered.</p>
                                        <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>Upload logos to populate the Project Terminal top bar.</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Section 4: Insight Badges */}
                                <div style={{ 
                                  padding: 32, background: 'var(--secondary)', border: '1px solid var(--border)', 
                                  borderRadius: 28, display: 'flex', flexDirection: 'column', gap: 24 
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Zap size={20} color="var(--sunlit-rock)" />
                                      </div>
                                      <div>
                                        <h3 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Project Insight Badges</h3>
                                        <p style={{ fontSize: 10, color: 'var(--text-dim)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dynamic status tags and informational highlight labels</p>
                                      </div>
                                    </div>
                                    <button 
                                      type="button" 
                                      onClick={() => setLocalHeaderBadges([...localHeaderBadges, { id: `manual-${Date.now()}`, label: 'New Insight', color: 'var(--teal)', isVisible: true }])} 
                                      style={{ padding: '10px 20px', borderRadius: 12, background: 'var(--teal)', border: 'none', color: '#ffffff', fontSize: 11, fontWeight: 900, cursor: 'pointer', letterSpacing: '0.05em' }}
                                    >
                                      + CREATE NEW BADGE
                                    </button>
                                  </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
                                      {localHeaderBadges.map((badge, idx) => (
                                        <motion.div 
                                          key={badge.id} 
                                          whileHover={{ scale: 1.01, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
                                          style={{ 
                                            padding: '20px 24px', borderRadius: 24, background: 'var(--section-bg)', 
                                            border: '1px solid var(--border)', display: 'flex', gap: 18, alignItems: 'center', 
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'all 0.3s ease'
                                          }}
                                        >
                                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <input type="color" value={badge.color} onChange={(e) => {
                                              const newList = [...localHeaderBadges];
                                              newList[idx].color = e.target.value;
                                              setLocalHeaderBadges(newList);
                                            }} style={{ width: 44, height: 44, padding: 0, border: 'none', background: 'none', cursor: 'pointer', borderRadius: '50%', position: 'absolute', opacity: 0, zIndex: 10 }} />
                                            <div style={{ 
                                              padding: '8px 16px', borderRadius: 10, background: 'rgba(0, 63, 73, 0.4)', 
                                              border: '1px solid rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', gap: 8,
                                              backdropFilter: 'blur(10px)', minWidth: 120, position: 'relative'
                                            }}>
                                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: badge.color, boxShadow: `0 0 10px ${badge.color}` }} className="animate-pulse" />
                                              <span style={{ fontSize: 11, fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {badge.label === 'New Insight' ? 'PREVIEW' : (badge.label === 'DEILVARABLES REPOERT' ? 'Deliverables Report' : badge.label)}
                                              </span>
                                            </div>
                                          </div>
                                          <input 
                                            value={badge.label === 'DEILVARABLES REPOERT' ? 'Deliverables Report' : (badge.label === 'New Insight' ? '' : badge.label)} 
                                            placeholder="Enter Badge Label..." 
                                            onChange={(e) => {
                                              const newList = [...localHeaderBadges];
                                              newList[idx].label = e.target.value;
                                              setLocalHeaderBadges(newList);
                                            }} 
                                            style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }} 
                                          />
                                          <button 
                                            type="button" 
                                            onClick={() => {
                                              const newList = [...localHeaderBadges];
                                              newList[idx].isVisible = !newList[idx].isVisible;
                                              setLocalHeaderBadges(newList);
                                            }} 
                                            style={{ 
                                              minWidth: 100,
                                              background: badge.isVisible ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.1)', 
                                              color: badge.isVisible ? '#10b981' : '#64748b', 
                                              border: '1px solid ' + (badge.isVisible ? 'rgba(16, 185, 129, 0.3)' : 'rgba(100, 116, 139, 0.2)'), 
                                              borderRadius: 12, padding: '10px 16px', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 
                                            }}
                                          >
                                            {badge.isVisible ? 'ACTIVE' : 'STAGED'}
                                            {badge.isVisible ? <Check size={14} /> : <EyeOff size={14} />}
                                          </button>
                                          <button type="button" onClick={() => setLocalHeaderBadges(localHeaderBadges.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6, padding: 8 }}><Trash2 size={18} /></button>
                                        </motion.div>
                                      ))}
                                      {localHeaderBadges.length === 0 && (
                                        <div style={{ gridColumn: 'span 2', padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '2px dashed var(--border)', borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                          <Zap size={32} style={{ color: 'var(--border)', opacity: 0.5 }} />
                                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>No active insight protocols registered.</p>
                                          <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: 0 }}>Add status badges to populate the Project Terminal header interface.</p>
                                        </div>
                                      )}
                                    </div>
                                </div>

                                {/* Section 5: Security Spectrum */}
                                <div style={{ 
                                  padding: 32, background: 'var(--secondary)', border: '1px solid var(--border)', 
                                  borderRadius: 28, display: 'flex', flexDirection: 'column', gap: 24 
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Shield size={20} color="#ef4444" />
                                    </div>
                                    <div>
                                      <h3 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Authorized Identity Spectrum</h3>
                                      <p style={{ fontSize: 10, color: 'var(--text-dim)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access control restricting registrations to specific email domains</p>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 24, background: 'var(--section-bg)', borderRadius: 20, border: '1px solid var(--border)' }}>
                                    {localAllowedDomains.length === 0 && (
                                      <div style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 500, fontStyle: 'italic', padding: '8px 0' }}>No domain restrictions active — All verified identities allowed.</div>
                                    )}
                                    {localAllowedDomains.map((domain, idx) => (
                                      <motion.div
                                        key={domain} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                        style={{ 
                                          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', 
                                          background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 16, 
                                          color: 'var(--teal)', fontSize: 13, fontWeight: 900,
                                          boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                                          letterSpacing: '0.02em'
                                        }}
                                      >
                                        <Globe size={14} />
                                        @{domain}
                                        <button
                                          type="button" onClick={() => setLocalAllowedDomains(prev => prev.filter((_, i) => i !== idx))}
                                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2, marginLeft: 6, opacity: 0.8 }}
                                        >
                                          <X size={14} />
                                        </button>
                                      </motion.div>
                                    ))}

                                    <div style={{ flex: 1, minWidth: 280, display: 'flex', alignItems: 'center', background: 'var(--border)', borderRadius: 14, padding: '0 16px', border: '1px solid var(--border)' }}>
                                      <Plus size={16} color="var(--teal)" style={{ marginRight: 12 }} />
                                      <input
                                        value={domainInput}
                                        onChange={(e) => setDomainInput(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const domain = domainInput.trim().toLowerCase().replace(/^@/, '');
                                            if (domain && !localAllowedDomains.includes(domain)) {
                                              setLocalAllowedDomains([...localAllowedDomains, domain]);
                                              setDomainInput('');
                                            }
                                          }
                                        }}
                                        placeholder="Add authorized domain (e.g. keoic.com)..."
                                        style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 14, outline: 'none', padding: '14px 0', fontWeight: 600 }}
                                      />
                                    </div>
                                  </div>
                                  <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: 0 }}>
                                    Press <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>ENTER</span> to register a new domain signature to the security spectrum.
                                  </p>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
                                  <motion.button
                                    whileHover={{ scale: 1.01, boxShadow: '0 15px 35px rgba(20, 184, 166, 0.3)' }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={isBrandingUpdating}
                                    style={{
                                      padding: '18px 64px',
                                      background: isBrandingUpdating ? 'rgba(20, 184, 166, 0.4)' : 'var(--teal)',
                                      color: '#ffffff', border: 'none', borderRadius: 20, fontWeight: 900,
                                      cursor: isBrandingUpdating ? 'not-allowed' : 'pointer',
                                      fontSize: 14, letterSpacing: '0.15em',
                                      boxShadow: '0 10px 25px rgba(20, 184, 166, 0.2)',
                                      display: 'flex', alignItems: 'center', gap: 12, textTransform: 'uppercase',
                                      transition: 'all 0.3s ease'
                                    }}
                                  >
                                    {isBrandingUpdating ? (
                                      <>
                                        <Loader2 size={24} className="animate-spin" />
                                        SYNCHRONIZING ASSETS...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 size={24} />
                                        UPDATE PROJECT IDENTITY
                                      </>
                                    )}
                                  </motion.button>
                                </div>
                              </form>
                            </td>
                          </tr>
                        )}
                        {activeTab === 'reports' && (
                          <tr style={{ background: 'transparent' }}>
                            <td colSpan={20} style={{ padding: 0, width: '100%' }}>
                              <div style={{ padding: '40px 8px', width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                          <Settings size={18} color="var(--teal)" />
                                        </div>
                                        <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>REH Digital Reporting Hub</h3>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <button
                                          onClick={() => handleLiveTestExport('excel')}
                                          style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.05)', color: '#10b981', fontSize: 11, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                                        >
                                          <Table size={14} /> TEST EXCEL
                                        </button>
                                        <button
                                          onClick={() => handleLiveTestExport('pdf')}
                                          style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', fontSize: 11, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                                        >
                                          <FileText size={14} /> TEST PDF
                                        </button>
                                        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />
                                        <button
                                          onClick={handleManualSync}
                                          disabled={isSavingReport}
                                          style={{
                                            padding: '10px 24px', borderRadius: 12, border: 'none',
                                            background: saveSuccess ? '#10b981' : 'var(--teal)',
                                            color: '#ffffff', fontSize: 11, fontWeight: 900,
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                            transition: 'all 200ms', opacity: isSavingReport ? 0.7 : 1,
                                            boxShadow: saveSuccess ? '0 0 20px rgba(16, 185, 129, 0.2)' : '0 10px 20px var(--border)'
                                          }}
                                        >
                                          {saveSuccess ? <CheckCircle2 size={14} /> : <Save size={14} />}
                                          {saveSuccess ? 'CONFIG SAVED' : 'SAVE CHANGES'}
                                        </button>
                                      </div>
                                    </div>

                                    <div style={{ padding: 24, background: 'var(--section-bg)', border: '1px solid var(--section-bg)', borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)' }} />
                                        <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.1em' }}>GLOBAL REPORT TEMPLATE CONFIGURATION</span>
                                      </div>
                                      
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                          <label style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Report Title</label>
                                          <input
                                            value={localReportTitle}
                                            onChange={(e) => setLocalReportTitle(e.target.value)}
                                            placeholder="e.g. Executive Status Report"
                                            style={{ padding: '12px 14px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                                          />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                          <label style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subtitle / Reference</label>
                                          <input
                                            value={localReportSubtitle}
                                            onChange={(e) => setLocalReportSubtitle(e.target.value)}
                                            placeholder="e.g. Q2 Performance Overview"
                                            style={{ padding: '12px 14px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                                          />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, gridColumn: 'span 2' }}>
                                          <label style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cover Summary / Disclaimer</label>
                                          <textarea
                                            value={localReportSummary}
                                            onChange={(e) => setLocalReportSummary(e.target.value)}
                                            placeholder="Detailed project summary for the cover page..."
                                            rows={2}
                                            style={{ padding: '12px 14px', background: 'var(--section-bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, outline: 'none', resize: 'none' }}
                                          />
                                        </div>
                                      </div>

                                      <div style={{ width: '100%', height: 1, background: 'var(--section-bg)', margin: '8px 0' }} />

                                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }} />
                                        <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.1em' }}>DOCUMENT HEADER REGISTRY</span>
                                      </div>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                        {localSummaryFields.map((field, idx) => (
                                            <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1.5fr', gap: 14, alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '12px 14px', borderRadius: 14, border: '1px solid var(--section-bg)', transition: 'all 200ms' }}>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updated = [...localSummaryFields];
                                                  updated[idx] = { ...updated[idx], isVisible: !updated[idx].isVisible };
                                                  setLocalSummaryFields(updated);
                                                }}
                                                style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: field.isVisible ? 'rgba(16, 185, 129, 0.1)' : 'var(--section-bg)', color: field.isVisible ? '#10b981' : 'var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 200ms' }}
                                              >
                                                {field.isVisible ? <CheckCircle2 size={14} /> : <X size={14} />}
                                              </button>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', minWidth: 40, letterSpacing: '0.05em' }}>Label</span>
                                                <input
                                                  value={field.label}
                                                  onChange={e => {
                                                    const updated = [...localSummaryFields];
                                                    updated[idx] = { ...updated[idx], label: e.target.value };
                                                    setLocalSummaryFields(updated);
                                                  }}
                                                  style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', padding: '4px 0', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                                                  placeholder="Label Text"
                                                />
                                              </div>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', minWidth: 40, letterSpacing: '0.05em' }}>Value</span>
                                                <input
                                                  value={field.value || (field.id === 'reportTitle' ? localReportTitle : field.id === 'projectName' ? localProjectName : field.id === 'periodReference' ? localReportSubtitle : field.id === 'temporalReference' ? localTemporalReference : '')}
                                                  onChange={e => {
                                                    const updated = [...localSummaryFields];
                                                    updated[idx] = { ...updated[idx], value: e.target.value };
                                                    setLocalSummaryFields(updated);

                                                    if (field.id === 'reportTitle') setLocalReportTitle(e.target.value);
                                                    if (field.id === 'projectName') setLocalProjectName(e.target.value);
                                                    if (field.id === 'periodReference') setLocalReportSubtitle(e.target.value);
                                                    if (field.id === 'temporalReference') setLocalTemporalReference(e.target.value);
                                                  }}
                                                  style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', padding: '4px 0', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                                                  placeholder={['activeDate', 'generatedOn', 'totalTasks'].includes(field.id) ? "Dynamic Fallback" : (field.id === 'periodReference' ? "Operational Performance & Deliverables" : (field.id === 'temporalReference' ? "MAY 2026 HUB RECAP" : "Hardcoded Value"))}
                                                />
                                              </div>
                                            </div>
                                          ))}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--secondary)', padding: '16px 20px', borderRadius: 16, border: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                              <Globe size={14} color="var(--teal)" opacity={0.6} />
                                              <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(212,175,55,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Administrative Branding</span>
                                            </div>
                                            <input value={localReportBranding} onChange={(e) => setLocalReportBranding(e.target.value)} style={{ padding: '8px 0', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--teal)', fontSize: 13, outline: 'none', fontWeight: 800 }} placeholder="KEO DIGITAL INTELLIGENCE // MASTER TRANSCRIPT" />
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--section-bg)', padding: '16px 20px', borderRadius: 16, border: '1px solid var(--section-bg)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                              <Shield size={14} color='var(--text-primary)' opacity={0.3} />
                                              <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Security Footer Protocol</span>
                                            </div>
                                            <input value={localReportFooter} onChange={(e) => setLocalReportFooter(e.target.value)} style={{ padding: '8px 0', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', opacity: 0.8 }} placeholder="PRIVATE & CONFIDENTIAL // INTEGRATED DATA STREAM" />
                                          </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--section-bg)' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Executive Narrative Overlay</span>
                                          </div>
                                          <textarea value={localReportSummary} onChange={(e) => setLocalReportSummary(e.target.value)} rows={2} style={{ padding: '8px 0', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', resize: 'none', fontSize: 12, outline: 'none', lineHeight: 1.5 }} placeholder="Enter official executive disclaimer narrative..." />
                                        </div>
                                      </div>
                                      <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>* Toggling visibility off hides the entire header row from exported document structures.</p>
                                    </div>

                                    <div style={{ padding: 24, background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)' }} />
                                        <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--teal)', letterSpacing: '0.1em' }}>AESTHETIC VECTORS</span>
                                      </div>

                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                                        {/* PDF Section */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                          <div style={{ padding: '8px 12px', background: 'var(--section-bg)', borderRadius: 10, borderLeft: '3px solid #60a5fa' }}>
                                            <span style={{ fontSize: 9, fontWeight: 900, color: '#60a5fa', letterSpacing: '0.1em' }}>PDF ATMOSPHERE CALIBRATION</span>
                                          </div>
                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <div>
                                              <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>PRIMARY BG</label>
                                              <input type="color" value={localReportBgColor} onChange={(e) => setLocalReportBgColor(e.target.value)} style={{ width: '100%', height: 32, border: 'none', background: 'none', cursor: 'pointer' }} title="Main background of PDF pages" />
                                            </div>
                                            <div>
                                              <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>ACCENT LINE</label>
                                              <input type="color" value={localReportAccentColor} onChange={(e) => setLocalReportAccentColor(e.target.value)} style={{ width: '100%', height: 32, border: 'none', background: 'none', cursor: 'pointer' }} title="Left-side vertical brand accent" />
                                            </div>
                                            <div>
                                              <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>HEADING TEXT</label>
                                              <input type="color" value={localReportHeaderTextColor} onChange={(e) => setLocalReportHeaderTextColor(e.target.value)} style={{ width: '100%', height: 32, border: 'none', background: 'none', cursor: 'pointer' }} title="Report Title & Unit labels" />
                                            </div>
                                            <div>
                                              <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>BODY TEXT</label>
                                              <input type="color" value={localReportPdfBodyTextColor} onChange={(e) => setLocalReportPdfBodyTextColor(e.target.value)} style={{ width: '100%', height: 32, border: 'none', background: 'none', cursor: 'pointer' }} title="General narrative and metadata text" />
                                            </div>
                                          </div>
                                        </div>

                                        {/* Excel Section */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                          <div style={{ padding: '8px 12px', background: 'var(--section-bg)', borderRadius: 10, borderLeft: '3px solid #10b981' }}>
                                            <span style={{ fontSize: 9, fontWeight: 900, color: '#10b981', letterSpacing: '0.1em' }}>EXCEL FORGE CONFIGURATION</span>
                                          </div>
                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <div>
                                              <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>APP BAR BG</label>
                                              <input type="color" value={localReportExcelHeaderColor} onChange={(e) => setLocalReportExcelHeaderColor(e.target.value)} style={{ width: '100%', height: 32, border: 'none', background: 'none', cursor: 'pointer' }} title="Standard Excel header bar color" />
                                            </div>
                                            <div>
                                              <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>HEADER TEXT</label>
                                              <input type="color" value={localReportExcelHeaderTextColor} onChange={(e) => setLocalReportExcelHeaderTextColor(e.target.value)} style={{ width: '100%', height: 32, border: 'none', background: 'none', cursor: 'pointer' }} title="Color of text in the Excel header bar" />
                                            </div>
                                            <div>
                                              <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>SHEET ACCENT</label>
                                              <input type="color" value={localReportExcelAccentColor} onChange={(e) => setLocalReportExcelAccentColor(e.target.value)} style={{ width: '100%', height: 32, border: 'none', background: 'none', cursor: 'pointer' }} title="Sheet tab bottom border and active indicators" />
                                            </div>
                                            <div>
                                              <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>GRID TEXT</label>
                                              <input type="color" value={localReportExcelBodyTextColor} onChange={(e) => setLocalReportExcelBodyTextColor(e.target.value)} style={{ width: '100%', height: 32, border: 'none', background: 'none', cursor: 'pointer' }} title="Color of alphanumeric data in grid cells" />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <span style={{ fontSize: 10, fontWeight: 900, color: '#10b981', letterSpacing: '0.1em', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 16px', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                        ✓ PARAMETERS ARE INSTANTLY SYNCHRONIZED IN THE LIVE ENGINE
                                      </span>
                                    </div>

                                  <div style={{ padding: '48px 24px', width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)', borderRadius: 48, position: 'relative', overflow: 'hidden' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, padding: '0 24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                          <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.1em' }}>LIVE REPORT SIMULATION</div>
                                          <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Ultra-accurate real-time visualization of the document identity</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.4)', padding: 6, borderRadius: 14, border: '1px solid var(--section-bg)' }}>
                                          <button type="button" onClick={() => setSimulationMode('PDF')} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: simulationMode === 'PDF' ? 'var(--teal)' : 'transparent', color: simulationMode === 'PDF' ? 'var(--surface)' : 'var(--text-primary)', fontSize: 11, fontWeight: 900, cursor: 'pointer', transition: 'all 200ms' }}>PDF ENGINE</button>
                                          <button type="button" onClick={() => setSimulationMode('EXCEL')} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: simulationMode === 'EXCEL' ? '#10b981' : 'transparent', color: simulationMode === 'EXCEL' ? 'var(--surface)' : 'var(--text-primary)', fontSize: 11, fontWeight: 900, cursor: 'pointer', transition: 'all 200ms' }}>EXCEL ENGINE</button>
                                        </div>
                                      </div>

                                      {simulationMode === 'PDF' ? (
                                        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                                          {/* Navigation Arrows */}
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              if (pdfScrollRef.current) {
                                                const prevIdx = Math.max(currentPdfPage - 1, 0);
                                                pdfScrollRef.current.scrollTo({ left: prevIdx * pdfScrollRef.current.clientWidth, behavior: 'smooth' });
                                                setCurrentPdfPage(prevIdx);
                                              }
                                            }}
                                            style={{
                                              position: 'absolute', left: 0, zIndex: 10, width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--border)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 200ms', opacity: currentPdfPage === 0 ? 0.3 : 1, pointerEvents: currentPdfPage === 0 ? 'none' : 'auto'
                                            }}
                                          >
                                            <ChevronLeft size={24} />
                                          </button>

                                          <div 
                                            ref={pdfScrollRef}
                                            onScroll={(e) => {
                                              const target = e.currentTarget;
                                              const pageIndex = Math.round(target.scrollLeft / target.clientWidth);
                                              if (pageIndex !== currentPdfPage) setCurrentPdfPage(pageIndex);
                                            }}
                                            style={{
                                              display: 'flex',
                                              gap: 0,
                                              padding: '20px 0',
                                              overflowX: 'auto',
                                              scrollSnapType: 'x mandatory',
                                              alignItems: 'flex-start',
                                              WebkitOverflowScrolling: 'touch',
                                              scrollbarWidth: 'none',
                                              msOverflowStyle: 'none',
                                              width: '100%'
                                            }} 
                                            className="hide-scrollbar"
                                          >
                                            <style>{`
                                              .hide-scrollbar::-webkit-scrollbar { display: none; }
                                            `}</style>
                                            
                                            {/* Slide 1 Container */}
                                            <div style={{ flex: '0 0 100%', display: 'flex', justifyContent: 'center', scrollSnapAlign: 'center' }}>
                                              {/* PDF Page 1: Cover */}
                                              <div style={{
                                                width: 842, height: 595, background: localReportBgColor, borderRadius: 24, border: '1px solid var(--border)',
                                                display: 'flex', flexDirection: 'column', padding: 0, position: 'relative', flexShrink: 0, overflow: 'hidden',
                                                boxShadow: '0 40px 80px rgba(0,0,0,0.6)', textAlign: 'left'
                                              }}>
                                                {/* Gold Vertical Accent Bar */}
                                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 14, background: localReportAccentColor }} />

                                                {/* Brand Logos (Symmetrical Placement - Swapped) */}
                                                <div style={{ position: 'absolute', top: 35, left: 57, height: 55, display: 'flex', alignItems: 'center' }}>
                                                  <img src="/logos/insite_logo.png" style={{ height: '100%', width: 'auto', filter: 'brightness(0) invert(1)' }} alt="InSite" />
                                                </div>
                                                <div style={{ position: 'absolute', top: 40, right: 57, height: 32, display: 'flex', alignItems: 'center' }}>
                                                  <img src="/logos/modon_logo.png" style={{ height: '100%', width: 'auto', filter: 'brightness(0) invert(1)' }} alt="Modon" />
                                                </div>

                                                {/* Branding Line (Exactly 35mm from top, 20mm from left) */}
                                                <div style={{ position: 'absolute', top: 99, left: 57 }}>
                                                  <div style={{ fontSize: 11, fontWeight: 900, color: localReportHeaderTextColor, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                                    {localReportBranding || 'KEO DIGITAL INTELLIGENCE // MASTER TRANSCRIPT'}
                                                  </div>
                                                </div>

                                                {/* Title & Subtitle (Matched vertical offsets) */}
                                                <div style={{ position: 'absolute', top: 156, left: 57, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                  <div style={{ fontSize: 48, fontWeight: 900, color: localReportHeaderTextColor, lineHeight: 1 }}>{localReportTitle || 'Digital Team Report'}</div>
                                                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.9 }}>{localReportSubtitle || 'OPERATIONAL PERFORMANCE & DELIVERABLES'}</div>
                                                </div>

                                                {/* Data Fields Registry (Scaled for full height utilization) */}
                                                <div style={{ position: 'absolute', top: 269, left: 57, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                                  {localSummaryFields.map((field) => {
                                                    if (!field.isVisible || field.id === 'reportTitle' || field.id === 'periodReference') return null;
                                                    
                                                    let val = field.value || '';
                                                    if (!val) {
                                                      if (field.id === 'projectName') val = localProjectName || 'RHK - Wadi Yemm';
                                                      if (field.id === 'temporalReference') val = localTemporalReference || 'MAY 2026 HUB RECAP';
                                                      if (field.id === 'activeDate') val = 'MAY 01 - MAY 31, 2026';
                                                      if (field.id === 'generatedOn') {
                                                        const now = new Date();
                                                        const day = String(now.getDate()).padStart(2, '0');
                                                        const month = now.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
                                                        const year = now.getFullYear();
                                                        const time = now.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase();
                                                        val = `${day}-${month}-${year} ${time}`;
                                                      }
                                                      if (field.id === 'totalTasks') val = memoizedTasks.length.toString();
                                                    }
                                                    
                                                    return (
                                                      <div key={field.id} style={{ display: 'flex', gap: 10, fontSize: 15, fontWeight: 700 }}>
                                                        <span style={{ color: localReportAccentColor }}>{field.label}:</span>
                                                        <span style={{ color: 'var(--text-primary)', opacity: 0.95 }}>{val}</span>
                                                      </div>
                                                    );
                                                  })}
                                                </div>

                                                {/* Security Footer Protocol (Narrow bottom margin) */}
                                                <div style={{ position: 'absolute', bottom: 42, left: 57, fontSize: 12, color: 'var(--text-primary)', opacity: 0.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                  {localReportFooter || 'PRIVATE & CONFIDENTIAL // INTEGRATED DATA STREAM'}
                                                </div>
                                              </div>
                                            </div>

                                            {/* Slide 2 Container */}
                                            <div style={{ flex: '0 0 100%', display: 'flex', justifyContent: 'center', scrollSnapAlign: 'center' }}>
                                              {/* PDF Page 2: Table Data (LANDSCAPE) */}
                                              <div style={{
                                                width: 842, height: 595, background: 'var(--text-primary)', borderRadius: 24, border: '1px solid var(--border)',
                                                display: 'flex', flexDirection: 'column', padding: 48, flexShrink: 0, overflow: 'hidden',
                                                boxShadow: '0 40px 80px rgba(0,0,0,0.6)'
                                              }}>
                                                <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', letterSpacing: '0.05em', marginBottom: 24, textTransform: 'uppercase' }}>
                                                  {localReportBranding || 'KEO DIGITAL INTELLIGENCE // MASTER TRANSCRIPT'}
                                                </div>

                                                <div style={{ flex: 1, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                  {/* Table Header: Black background, Gold text */}
                                                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 100px 100px 140px', background: 'var(--surface)', borderBottom: '1px solid #1e293b', padding: '12px' }}>
                                                    {[
                                                      { label: 'UID', width: 100 },
                                                      { label: 'ASSET TITLE', width: '1fr' },
                                                      { label: 'DEPT', width: 100 },
                                                      { label: 'START (ACTUAL)', width: 100 },
                                                      { label: 'FINISH (ACTUAL)', width: 100 },
                                                      { label: 'DELIVERABLES LINKS', width: 140 }
                                                    ].map((h, i) => (
                                                      <span key={i} style={{ fontSize: 8, fontWeight: 900, color: localReportAccentColor, letterSpacing: '0.05em', textAlign: 'center' }}>{h.label}</span>
                                                    ))}
                                                  </div>

                                                  <div className="custom-scrollbar" style={{ overflowY: 'auto', maxHeight: 420 }}>
                                                    {(memoizedTasks.length > 0 ? memoizedTasks.slice(0, 12) : [
                                                      { id: 'BIM-100', title: 'BIM Task Test', department: 'BIM', actualStartDate: '10-APR-2026', actualEndDate: '10-APR-2026' },
                                                      { id: 'DR-100', title: 'Monthly Task Test', department: 'Digital Reporting', actualStartDate: '18-MAR-2026', actualEndDate: '10-APR-2026' },
                                                      { id: 'GIS-100', title: 'GIS Data Sync', department: 'GIS', actualStartDate: '10-APR-2026', actualEndDate: '10-APR-2026' }
                                                    ]).map((task: any, idx) => (
                                                      <div key={task.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 100px 100px 140px', borderBottom: '1px solid #e2e8f0', padding: '10px 12px', background: 'var(--text-primary)', alignItems: 'center', minHeight: 44 }}>
                                                        <span style={{ fontSize: 9, color: '#475569', textAlign: 'center', fontWeight: 500 }}>REH-{task.id?.split('-').pop()?.toUpperCase() || 'DH-100'}</span>
                                                        <span style={{ fontSize: 9, color: '#1e293b', fontWeight: 600, paddingLeft: 12 }}>{task.title}</span>
                                                        <span style={{ fontSize: 8, color: '#64748b', textAlign: 'center' }}>{task.department || 'N/A'}</span>
                                                        <span style={{ fontSize: 8, color: '#475569', fontWeight: 700, textAlign: 'center' }}>{task.actualStartDate || 'N/A'}</span>
                                                        <span style={{ fontSize: 8, color: '#475569', fontWeight: 700, textAlign: 'center' }}>{task.actualEndDate || 'N/A'}</span>
                                                        <div style={{ fontSize: 8, textAlign: 'center' }}>
                                                          {task.links && task.links.length > 0 ? (
                                                            <a href={task.links[0].url} style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 600 }}>Preveiw Dashboard | Dash</a>
                                                          ) : (
                                                            <span style={{ color: '#2563eb', opacity: 0.6 }}>-</span>
                                                          )}
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>

                                                <div style={{ marginTop: 'auto', fontSize: 9, color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '12px 0' }}>
                                                  {localReportFooter || 'PRIVATE & CONFIDENTIAL // INTEGRATED DATA STREAM'}
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          <button 
                                            type="button"
                                            onClick={() => {
                                              if (pdfScrollRef.current) {
                                                const nextIdx = Math.min(currentPdfPage + 1, 1);
                                                pdfScrollRef.current.scrollTo({ left: nextIdx * pdfScrollRef.current.clientWidth, behavior: 'smooth' });
                                                setCurrentPdfPage(nextIdx);
                                              }
                                            }}
                                            style={{
                                              position: 'absolute', right: 0, zIndex: 10, width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--border)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 200ms', opacity: currentPdfPage === 1 ? 0.3 : 1, pointerEvents: currentPdfPage === 1 ? 'none' : 'auto'
                                            }}
                                          >
                                            <ChevronRight size={24} />
                                          </button>

                                          {/* Page Indicator */}
                                          <div style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
                                            {[0, 1].map(i => (
                                              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: currentPdfPage === i ? 'var(--teal)' : 'var(--border)', transition: 'all 300ms' }} />
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                      <div style={{ display: 'flex', flexDirection: 'column', padding: 1, background: '#cbd5e1', borderRadius: 12, overflow: 'hidden', width: '100%', margin: '40px auto', boxShadow: '0 30px 60px rgba(0,0,0,0.3)', minHeight: 400 }}>
                                        {/* Excel Fake App Bar */}
                                        <div style={{ background: localReportExcelHeaderColor, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                                          <div style={{ width: 12, height: 12, borderRadius: 2, background: localReportExcelHeaderTextColor, opacity: 0.2 }} />
                                          <span style={{ fontSize: 12, fontWeight: 800, color: localReportExcelHeaderTextColor, letterSpacing: '0.05em' }}>Excel Live Simulation - {excelActiveTab === 'summary' ? 'Master Summary' : 'Asset Matrix'}</span>
                                        </div>

                                        {/* Excel Workspace */}
                                        <div style={{ flex: 1, background: 'var(--text-primary)', overflowX: 'auto', position: 'relative', padding: 20 }} className="custom-scrollbar">
                                          {excelActiveTab === 'summary' && (
                                            <div style={{ display: 'flex', gap: 40, marginBottom: 20, paddingLeft: 10 }}>
                                              <img src="/logos/modon_logo.png" style={{ height: 45, opacity: 0.9 }} alt="Modon" />
                                              <img src="/logos/insite_logo.png" style={{ height: 45, opacity: 0.9 }} alt="InSite" />
                                            </div>
                                          )}
                                          <style>{`
                                            .custom-scrollbar::-webkit-scrollbar { height: 8px; }
                                            .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
                                            .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 4px; }
                                            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
                                            .excel-table { border-collapse: collapse; width: max-content; min-width: 100%; }
                                            .excel-table th, .excel-table td { white-space: nowrap; padding: 5px 10px; }
                                          `}</style>
                                          {excelActiveTab === 'summary' ? (
                                            <table className="excel-table">
                                              <thead>
                                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                                                  <th style={{ width: 30, background: '#f1f5f9', borderRight: '1px solid #cbd5e1', padding: '4px' }}></th>
                                                  <th style={{ fontSize: 9, fontWeight: 700, color: '#475569', textAlign: 'center', borderRight: '1px solid #cbd5e1', padding: '4px 10px' }}>A</th>
                                                  <th style={{ fontSize: 9, fontWeight: 700, color: '#475569', textAlign: 'center', padding: '4px 10px' }}>B</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {/* Title Row */}
                                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                  <td style={{ background: '#f1f5f9', borderRight: '1px solid #cbd5e1', fontSize: 8, color: '#64748b', textAlign: 'center', padding: '4px' }}>1</td>
                                                  <td style={{ fontSize: 9, fontWeight: 800, color: '#b45309', borderRight: '1px solid #e2e8f0' }}>PROJECT EXECUTIVE SUMMARY</td>
                                                  <td></td>
                                                </tr>
                                                {/* Data Rows */}
                                                {localSummaryFields.filter(f => f.isVisible).map((f, i) => (
                                                  <tr key={f.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ background: '#f1f5f9', borderRight: '1px solid #cbd5e1', fontSize: 8, color: '#64748b', textAlign: 'center', padding: '4px' }}>{i + 3}</td>
                                                    <td style={{ fontSize: 9, fontWeight: 800, color: '#0f172a', borderRight: '1px solid #e2e8f0' }}>{f.label}</td>
                                                    <td style={{ fontSize: 9, color: localReportExcelBodyTextColor }}>
                                                      {f.value || (f.id === 'reportTitle' ? localReportTitle : f.id === 'projectName' ? localProjectName : f.id === 'periodReference' ? localReportSubtitle : f.id === 'temporalReference' ? localTemporalReference :
                                                        f.id === 'activeDate' ? 'May 01 - May 31, 2026' : f.id === 'generatedOn' ? (() => {
                                                        const now = new Date();
                                                        const day = String(now.getDate()).padStart(2, '0');
                                                        const month = now.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
                                                        const year = now.getFullYear();
                                                        const time = now.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase();
                                                        return `${day}-${month}-${year} ${time}`;
                                                      })() : f.id === 'totalTasks' ? memoizedTasks.length : '')}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          ) : (
                                            <table className="excel-table">
                                              <thead>
                                                {/* Column Letter Headers */}
                                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                                                  <th style={{ width: 30, background: '#f1f5f9', borderRight: '1px solid #cbd5e1', padding: '4px' }}></th>
                                                  <th style={{ fontSize: 9, fontWeight: 700, color: '#475569', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>A</th>
                                                  <th style={{ fontSize: 9, fontWeight: 700, color: '#475569', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>B</th>
                                                  <th style={{ fontSize: 9, fontWeight: 700, color: '#475569', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>C</th>
                                                  <th style={{ fontSize: 9, fontWeight: 700, color: '#475569', textAlign: 'center' }}>D</th>
                                                </tr>
                                                {/* Data Column Headers */}
                                                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                                                  <th style={{ background: '#f1f5f9', borderRight: '1px solid #cbd5e1', fontSize: 8, color: '#64748b', textAlign: 'center', padding: '4px' }}>1</th>
                                                  <th style={{ fontSize: 8, fontWeight: 900, color: '#475569', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>UID</th>
                                                  <th style={{ fontSize: 8, fontWeight: 900, color: '#475569', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>DELIVERABLE NAME</th>
                                                  <th style={{ fontSize: 8, fontWeight: 900, color: '#475569', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>DEPARTMENT</th>
                                                  <th style={{ fontSize: 8, fontWeight: 900, color: '#475569', textAlign: 'center' }}>STATUS</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {memoizedTasks.slice(0, 10).map((task, i) => (
                                                  <tr key={task.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ background: '#f1f5f9', borderRight: '1px solid #cbd5e1', fontSize: 8, color: '#64748b', textAlign: 'center', padding: '4px' }}>{i + 2}</td>
                                                    <td style={{ fontSize: 8, color: localReportExcelBodyTextColor, borderRight: '1px solid #e2e8f0' }}>{task.id.slice(0, 6)}</td>
                                                    <td style={{ fontSize: 8, color: localReportExcelBodyTextColor, borderRight: '1px solid #e2e8f0', fontWeight: 600 }}>{task.title}</td>
                                                    <td style={{ fontSize: 8, color: localReportExcelHeaderColor, borderRight: '1px solid #e2e8f0' }}>{task.department}</td>
                                                    <td style={{ fontSize: 8, color: localReportExcelBodyTextColor }}>{task.status}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          )}
                                        </div>

                                        {/* Excel Sheet Tabs Footer */}
                                        <div style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                                          <div style={{ display: 'flex', gap: 0 }}>
                                            {[
                                              { id: 'summary', label: 'Master Summary' },
                                              { id: 'matrix', label: 'Asset Matrix' }
                                            ].map(sheet => (
                                              <div 
                                                key={sheet.id}
                                                onClick={() => setExcelActiveTab(sheet.id as any)}
                                                style={{
                                                  padding: '10px 24px',
                                                  background: excelActiveTab === sheet.id ? 'var(--text-primary)' : 'transparent',
                                                  borderRight: '1px solid #cbd5e1',
                                                  borderTop: excelActiveTab === sheet.id ? `3px solid ${localReportExcelAccentColor}` : 'none',
                                                  fontSize: 10,
                                                  fontWeight: excelActiveTab === sheet.id ? 800 : 500,
                                                  color: excelActiveTab === sheet.id ? localReportExcelAccentColor : '#64748b',
                                                  cursor: 'pointer',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 8,
                                                  transition: 'all 200ms'
                                                }}
                                              >
                                                <div style={{ width: 8, height: 8, borderRadius: 1, border: `1px solid ${excelActiveTab === sheet.id ? localReportExcelAccentColor : '#cbd5e1'}`, background: excelActiveTab === sheet.id ? `${localReportExcelAccentColor}20` : 'transparent' }} />
                                                {sheet.label}
                                              </div>
                                            ))}
                                          </div>
                                          <div style={{ flex: 1 }} />
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.3 }}>
                                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#64748b' }} />
                                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#64748b' }} />
                                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#64748b' }} />
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        {activeTab === 'homepage' && (
                          <tr style={{ background: 'transparent' }}>
                            <td colSpan={5} style={{ padding: '40px' }}>
                              <HomePageEditor showToast={showToast} />
                            </td>
                          </tr>
                        )}
                        {activeTab === 'communications' && (
                          <tr style={{ background: 'transparent' }}>
                            <td colSpan={5} style={{ padding: '40px' }}>
                              <CommunicationsHub showToast={showToast} usersSnapshot={usersSnapshot} />

                              {/* Broadcast History Log */}
                              <div style={{ marginTop: 64 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--section-bg)' }}>
                                  <Megaphone size={18} color="var(--teal)" />
                                  <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Transmission History Log</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                  {broadcastsSnapshot?.docs.map(docSnap => {
                                    const b = docSnap.data();
                                    const timeStr = b.timestamp?.toDate
                                      ? b.timestamp.toDate().toLocaleString()
                                      : (b.timestamp ? new Date(b.timestamp).toLocaleString() : 'Pending...');

                                    return (
                                      <div key={docSnap.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: 'var(--section-bg)', borderRadius: 16, border: '1px solid var(--section-bg)' }}>
                                        <div style={{ display: 'flex', gap: 16 }}>
                                          <div style={{ width: 40, height: 40, borderRadius: 12, background: b.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {b.type === 'NOTIF' ? <Bell size={18} color={b.severity === 'CRITICAL' ? '#ef4444' : '#60a5fa'} /> : <Newspaper size={18} color="#a78bfa" />}
                                          </div>
                                          <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                              <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 4, background: 'var(--border)', color: 'var(--text-primary)' }}>{b.type}</span>
                                              <span style={{ fontSize: 9, fontWeight: 900, color: b.severity === 'CRITICAL' ? '#ef4444' : 'var(--teal)' }}>{b.severity}</span>
                                            </div>
                                            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{b.title}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.description}</div>
                                          </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>{timeStr}</span>
                                          <button
                                            onClick={() => setBroadcastToDelete({ id: docSnap.id, title: b.title || 'Untitled Broadcast' })}
                                            title="Purge Transmission"
                                            style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 200ms' }}
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {!broadcastsLoading && broadcastsSnapshot?.docs.length === 0 && (
                                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, fontWeight: 600 }}>No current data</div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {(tasksLoading || membersLoading || registryLoading || usersLoading) && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>Accessing secure database...</div>}
                </GlassCard>
              </motion.div>
            </AnimatePresence>
          </main>



          <AnimatePresence>
            {isModalOpen && activeTab === 'tasks' && (
              <TaskEditorModal
                key="task-editor"
                task={selectedTask}
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedTask(null); }}
                readOnly={!can('tasks', 'edit')}
                canDelete={can('tasks', 'delete')}
                canApprove={can('tasks', 'edit')}
                tasks={memoizedTasks}
              />
            )}

            {isModalOpen && activeTab === 'team' && (
              teamActiveSubTab === 'personnel' ? (
                <MemberEditorModal
                  key="member-editor"
                  member={selectedMember}
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  readOnly={!can('team', 'edit')}
                  canDelete={can('team', 'delete')}
                />
              ) : (
                <DepartmentEditorModal
                  key="dept-editor"
                  department={selectedDepartment}
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  canDelete={can('team', 'delete')}
                />
              )
            )}

            {isModalOpen && activeTab === 'registry' && (
              <RegistryEditorModal
                key="registry-editor"
                item={selectedRegistry}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                readOnly={!can('registry', 'edit')}
                canDelete={can('registry', 'delete')}
                departments={memoizedDepartments}
              />
            )}
            {isModalOpen && activeTab === 'users' && activeSubTab === 'users' && (
              <UserEditorModal key="user-editor" userRecord={selectedUser} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            )}
            {!!selectedPolicy && (
              <GroupPolicyEditor
                key="policy-editor"
                policy={selectedPolicy}
                isOpen={!!selectedPolicy}
                onClose={() => setSelectedPolicy(null)}
              />
            )}
            {isBulkModalOpen && (
              <BulkActionConfirmModal
                key="bulk-modal"
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onConfirm={handleBulkDelete}
                count={selectedIds.size}
                actionName={activeTab === 'team' ? 'STAFF RECORDS' : activeTab === 'tasks' ? 'TASK ASSETS' : 'REGISTRY ITEMS'}
              />
            )}
            {eliteAlert.isOpen && (
              <EliteConfirmModal
                key="elite-alert"
                isOpen={eliteAlert.isOpen}
                onClose={() => setEliteAlert(prev => ({ ...prev, isOpen: false }))}
                title={eliteAlert.title}
                message={eliteAlert.message}
                severity={eliteAlert.severity}
                confirmLabel="Acknowledge"
                isReadOnly={true}
              />
            )}
            {isLogoutConfirmOpen && (
              <EliteConfirmModal
                key="logout-confirm"
                isOpen={isLogoutConfirmOpen}
                onClose={() => setIsLogoutConfirmOpen(false)}
                onConfirm={async () => {
                  await logout();
                  showToast('Security session terminated successfully.', 'SUCCESS');
                }}
                title="Terminal Exit Protocol"
                message="Authorize the immediate termination of this administrative session? All secure connections will be severed."
                confirmLabel="Authorize Exit"
                severity="WARNING"
              />
            )}
            {broadcastToDelete && (
              <EliteConfirmModal
                key="broadcast-delete"
                isOpen={!!broadcastToDelete}
                onClose={() => setBroadcastToDelete(null)}
                onConfirm={async () => {
                  if (!broadcastToDelete) return;
                  await deleteDoc(doc(db, 'broadcasts', broadcastToDelete.id));
                  showToast('Transmission purged securely.', 'SUCCESS');
                  setBroadcastToDelete(null);
                }}
                title="Purge Transmission"
                message={`Authorize the definitive eradication of "${broadcastToDelete?.title}"? This will be instantly removed from the live dashboard and cannot be reversed.`}
                confirmLabel="Execute Purge"
                severity="DANGER"
              />
            )}

            {ticketToResolve && (
              <EliteConfirmModal
                isOpen={!!ticketToResolve}
                onClose={() => setTicketToResolve(null)}
                onConfirm={async () => {
                  const { updateDoc, doc: fsDoc } = await import('firebase/firestore');
                  await updateDoc(fsDoc(db, 'tickets', ticketToResolve.id), { status: 'RESOLVED', updatedAt: new Date().toISOString() });
                  showToast(`Ticket ${ticketToResolve.ticketId} resolved.`, 'SUCCESS');
                  setTicketToResolve(null);
                }}
                title="Authorize Clearance"
                message={`Authorize the resolution and approval of Access Ticket ${ticketToResolve.ticketId}? This will grant the requested protocols.`}
                confirmLabel="Confirm Resolution"
                severity="SUCCESS"
              />
            )}

            {ticketToReject && (
              <EliteConfirmModal
                isOpen={!!ticketToReject}
                onClose={() => setTicketToReject(null)}
                onConfirm={async () => {
                  const { updateDoc, doc: fsDoc } = await import('firebase/firestore');
                  await updateDoc(fsDoc(db, 'tickets', ticketToReject.id), { status: 'REJECTED', updatedAt: new Date().toISOString() });
                  showToast(`Ticket ${ticketToReject.ticketId} rejected.`, 'INFO');
                  setTicketToReject(null);
                }}
                title="Deny Access"
                message={`Formally deny and reject Access Ticket ${ticketToReject.ticketId}? This action will terminate the request.`}
                confirmLabel="Confirm Rejection"
                severity="WARNING"
              />
            )}

            {ticketToDelete && (
              <EliteConfirmModal
                isOpen={!!ticketToDelete}
                onClose={() => setTicketToDelete(null)}
                onConfirm={async () => {
                  await handleDelete(ticketToDelete.id, 'tickets');
                  setTicketToDelete(null);
                }}
                title="Eradicate Ticket"
                message={`Authorize the permanent eradication of Access Ticket ${ticketToDelete.ticketId}? This record will be purged from the security database.`}
                confirmLabel="Execute Eradication"
                severity="DANGER"
              />
            )}
            {isModalOpen && activeTab === 'bim-reviews' && (
              <BIMReviewEditorModal
                key="bim-review-editor"
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedBimReview(null); }}
                review={selectedBimReview}
                onSuccess={(msg) => showToast(msg, 'SUCCESS')}
                onError={(msg) => showToast(msg, 'ERROR')}
              />
            )}

      <BIMImportConfirmModal
        key="bim-import-confirm"
        isOpen={bimImportConfirm.isOpen}
        onClose={() => setBimImportConfirm({ isOpen: false, records: [] })}
        onConfirm={handleImportConfirm}
        isLoading={isBimImportLoading}
        records={bimImportConfirm.records}
      />
      <TaskImportConfirmModal
        key="task-import-confirm"
        isOpen={taskImportConfirm.isOpen}
        onClose={() => setTaskImportConfirm({ isOpen: false, records: [] })}
        onConfirm={handleCommitTaskImport}
        isLoading={isTaskImportLoading}
        records={taskImportConfirm.records}
      />      </AnimatePresence>
 

          {/* Header Background Cropper Protocol */}
          {showCropper && cropperSource && (
            <HeaderBgCropper 
              image={cropperSource} 
              onCropComplete={(blob) => {
                const file = new File([blob], `header-bg-${Date.now()}.jpg`, { type: 'image/jpeg' });
                setHeaderBgFile(file);
                // Create a local preview URL
                const previewUrl = URL.createObjectURL(blob);
                setLocalBgUrl(previewUrl);
                setShowCropper(false);
                setCropperSource(null);
                showToast('Banner optimization complete. Ready for synchronization.', 'SUCCESS');
              }}
              onCancel={() => {
                setShowCropper(false);
                setCropperSource(null);
              }}
            />
          )}

        </div>
      </div>
    </div>
  );
}
