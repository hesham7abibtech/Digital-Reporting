'use client';

import React, { useState, useEffect } from 'react';
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
  Newspaper
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { collections, bulkDelete, getProjectMetadata, updateProjectMetadata, uploadFile } from '@/services/FirebaseService';
import { useToast } from '@/components/shared/EliteToast';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';
import { useDocument } from 'react-firebase-hooks/firestore';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import GlassCard from '@/components/shared/GlassCard';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Task, TeamMember, DashboardNavItem, ProjectMetadata } from '@/lib/types';
import TaskEditorModal from '@/components/admin/TaskEditorModal';
import MemberEditorModal from '@/components/admin/MemberEditorModal';
import RegistryEditorModal from '@/components/admin/RegistryEditorModal';
import UserEditorModal from '@/components/admin/UserEditorModal';
import GroupPolicyList from '@/components/admin/GroupPolicyList';
import GroupPolicyEditor from '@/components/admin/GroupPolicyEditor';
import BulkActionConfirmModal from '@/components/admin/BulkActionConfirmModal';
import EliteConfirmModal from '@/components/shared/EliteConfirmModal';

const DEFAULT_ALLOWED_DOMAINS = ['modon.com', 'insiteinternational.com'];

function BroadcastSender({ showToast }: { showToast: any }) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'NOTIF' | 'NEWS'>('NOTIF');
  const [severity, setSeverity] = useState<'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS'>('INFO');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [link, setLink] = useState('');

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      showToast('Payload validation failure: Missing title or content.', 'ERROR');
      return;
    }

    setLoading(true);
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      await addDoc(collection(db, 'broadcasts'), {
        title,
        description,
        type,
        severity,
        category,
        link,
        timestamp: new Date().toISOString(),
        readBy: []
      });

      showToast(`Communications dispatched: ${type} packet synchronized.`, 'SUCCESS');
      setTitle('');
      setDescription('');
      setCategory('');
      setLink('');
    } catch (error) {
       console.error('Dispatch failure:', error);
       showToast('Broadcast uplink interrupted.', 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48 }}>
      <form onSubmit={handleDispatch} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Packet Stream</label>
            <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
               {(['NOTIF', 'NEWS'] as const).map(t => (
                 <button
                   key={t}
                   type="button"
                   onClick={() => setType(t)}
                   style={{
                     flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                     background: type === t ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                     color: type === t ? '#D4AF37' : 'rgba(255,255,255,0.3)',
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
            <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Authority Classification</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'white', fontSize: 14, outline: 'none' }}
            >
              <option value="INFO">INFO / SYSTEM</option>
              <option value="SUCCESS">SUCCESS / COMPLETED</option>
              <option value="WARNING">WARNING / CAUTION</option>
              <option value="CRITICAL">CRITICAL / ALARM</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Broadcast Headline</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter high-impact title..."
            style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, color: 'white', fontSize: 15, outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Narrative Body</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed administrative context..."
            rows={4}
            style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, color: 'white', fontSize: 15, outline: 'none', resize: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Functional Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. SYSTEM, MARKET, TEAM"
              style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'white', fontSize: 14, outline: 'none' }}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Secure Attachment URL</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'white', fontSize: 14, outline: 'none' }}
            />
          </div>
        </div>

        <button
          disabled={loading}
          style={{
            marginTop: 12, padding: '16px', background: '#D4AF37', color: '#0a0a0f',
            border: 'none', borderRadius: 16, fontWeight: 900, fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            boxShadow: '0 10px 30px rgba(212, 175, 55, 0.3)', letterSpacing: '0.05em'
          }}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          DISPATCH BROADCAST
        </button>
      </form>

      <div style={{ padding: 40, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
           <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <Shield size={18} color="#D4AF37" />
           </div>
           <span style={{ fontSize: 12, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Transmission Preview</span>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div style={{
             width: '100%', maxWidth: 360, padding: 24, borderRadius: 24, background: 'rgba(255,255,255,0.03)',
             border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
             opacity: title || description ? 1 : 0.3, filter: title || description ? 'none' : 'grayscale(1)'
           }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'}` }}>
                   {type === 'NOTIF' ? <Bell size={18} color={severity === 'CRITICAL' ? '#ef4444' : '#60a5fa'} /> : <Newspaper size={18} color="#a78bfa" />}
                </div>
                <div>
                   <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                     {type} // {severity}
                   </span>
                   <h4 style={{ fontSize: 14, fontWeight: 800, color: 'white', margin: 0 }}>{title || 'Headline Protocol'}</h4>
                </div>
             </div>
             <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>
               {description || 'Establishing secure administrative narrative... awaiting payload input.'}
             </p>
             <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.2)' }}>RECEPTION TERMINAL PREVIEW</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { logout, userProfile } = useAuth();
  const { isVisible, can, userRole } = usePermissions();
  const router = useRouter();

  // Security Clearance Protocol: TEAM_MATE access to Command Center is restricted
  useEffect(() => {
    if (userProfile && userProfile.role === 'TEAM_MATE') {
      router.push('/');
    }
  }, [userProfile, router]);

  const [activeTab, setActiveTab] = useState<'tasks' | 'team' | 'branding' | 'registry' | 'users' | 'policies' | 'broadcast'>('tasks');
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'policies'>('users');
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

  // Elite Subtitles Manager state sync
  const [localTitle, setLocalTitle] = useState('');
  const [localProjectName, setLocalProjectName] = useState('');
  const [localLocation, setLocalLocation] = useState('');
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

  // Real-time metadata for Main Data tab
  const [projectSnapshot, projectLoading] = useDocument(doc(db, 'settings', 'project'));
  const projectData = projectSnapshot?.data() as ProjectMetadata | undefined;

  const { showToast } = useToast();
  // Selector state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedRegistry, setSelectedRegistry] = useState<DashboardNavItem | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
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
    setInitializedLocalFields(true);
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

  // Firestore Listeners
  const [tasksSnapshot, tasksLoading] = useCollection(collections.tasks);
  const [membersSnapshot, membersLoading] = useCollection(collections.members);
  const [registrySnapshot, registryLoading] = useCollection(collections.registry);
  const [usersSnapshot, usersLoading] = useCollection(collections.users);

  // Reset selection when tab changes
  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setSelectedIds(new Set());
  };

  const handleNewRecord = () => {
    if (!can(activeTab as any, 'edit')) {
      showToast('UNAUTHORIZED: Insufficient clearance to initiate new records.', 'ERROR');
      return;
    }
    if (activeTab === 'tasks') setSelectedTask(null);
    if (activeTab === 'team') setSelectedMember(null);
    if (activeTab === 'registry') setSelectedRegistry(null);
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
    if (activeTab === 'registry') setSelectedRegistry(item);
    if (activeTab === 'users') setSelectedUser(item);
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
    if (activeTab === 'team') return membersSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
    if (activeTab === 'registry') return registrySnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
    if (activeTab === 'users') return usersSnapshot?.docs.map(d => ({ id: d.id, ...d.data() })) || [];
    return [];
  };

  const handleBulkDelete = async () => {
    try {
      const colName = activeTab === 'team' ? 'members' : activeTab;
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
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--text-primary)' }}>
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            style={{
              position: 'fixed', top: 90, left: '50%', transform: 'translateX(-50%)',
              zIndex: 90,
              background: 'rgba(15, 15, 25, 0.98)',
              backdropFilter: 'blur(20px)',
              padding: '12px 24px',
              borderRadius: 16,
              border: '2px solid #ef4444',
              display: 'flex', alignItems: 'center', gap: 24,
              boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 20px rgba(239, 68, 68, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <Shield size={18} color="#ef4444" />
              </div>
              <div>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'white', display: 'block', letterSpacing: '0.05em' }}>{selectedIds.size} ITEMS SELECTED</span>
                <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>High Authority Mode Active</span>
              </div>
              <button
                onClick={() => setSelectedIds(new Set())}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontSize: 10, fontWeight: 800, padding: '4px 10px',
                  borderRadius: 6, cursor: 'pointer', marginLeft: 8
                }}
              >
                DISMISS
              </button>
            </div>
            <div style={{ width: 1, height: 32, background: 'rgba(239, 68, 68, 0.3)' }} />
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => showToast('Command Accepted: Exporting high-fidelity dataset...', 'INFO')}
                style={{
                  background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
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
                    background: '#ef4444', color: 'white', border: 'none',
                    padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 800,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    boxShadow: '0 8px 16px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  <Trash2 size={18} />
                  TERMINATE RECORDS
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 72, background: 'rgba(10, 10, 15, 0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Synchronized Partner Logos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginRight: 8 }}>
            {projectData?.partnerLogos?.map((logo, index) => (
              <React.Fragment key={`logo-${index}`}>
                {index > 0 && <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)', borderRadius: 1 }} />}
                <div style={{ padding: '4px 0', display: 'flex', alignItems: 'center' }}>
                  <img src={logo} alt={`Partner Logo ${index + 1}`} style={{ height: 26, width: 'auto', maxWidth: 120, objectFit: 'contain', filter: 'brightness(1.1)' }} />
                </div>
              </React.Fragment>
            ))}
          </div>

          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)', marginRight: 8 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' }}>
              <Shield size={22} color="#0a0a0f" />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: 'white' }}>DIGITAL Reporting MONITOR</h1>
              <p style={{ fontSize: 10, color: '#D4AF37', fontWeight: 800, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>KEO Digital Intelligence</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
              borderRadius: 12, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)',
              color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}
          >
            <LogOut size={16} />
            Exit Portal
          </button>

          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }} />

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '6px 14px 6px 6px',
            background: 'rgba(212, 175, 55, 0.1)', borderRadius: 16, border: '2px solid #D4AF37',
            boxShadow: '0 0 15px rgba(212, 175, 55, 0.15)'
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a0f', fontWeight: 900, fontSize: 15, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
              {userProfile?.name?.charAt(0) || 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'white', lineHeight: 1 }}>{userProfile?.name || 'Authorized Subject'}</span>
              <span style={{ fontSize: 10, color: '#D4AF37', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 1 }}>{userProfile?.role}</span>
            </div>
          </div>
        </div>
      </header>

      <main style={{ padding: '32px 40px', maxWidth: 1600, margin: '0 auto' }}>
        <nav style={{
          padding: '0 32px',
          display: 'flex',
          justifyContent: 'center',
          gap: 48,
          background: 'rgba(255,255,255,0.01)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          marginBottom: 24
        }}>
          {[
            { id: 'tasks', label: 'Digital Deliverables', icon: BarChart3, permission: 'tasks' },
            { id: 'team', label: 'Digital Project Team', icon: Users, permission: 'team' },
            { id: 'branding', label: 'Identity & Branding', icon: Database, permission: 'branding' },
            { id: 'registry', label: 'Digital Asset Registry', icon: LayoutDashboard, permission: 'registry' },
            { id: 'broadcast', label: 'Communications Hub', icon: Megaphone, permission: 'branding' },
            { id: 'users', label: 'Access Control', icon: Shield, permission: 'users' },
          ].filter(tab => isVisible(tab.permission as any)).map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setSelectedIds(new Set()); }}
              style={{
                padding: '24px 16px', border: 'none', background: 'none',
                color: activeTab === tab.id ? '#ffffff' : 'rgba(255, 255, 255, 0.25)',
                fontSize: 13, fontWeight: 900, cursor: 'pointer', position: 'relative',
                display: 'flex', alignItems: 'center', gap: 10,
                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}
            >
              <tab.icon
                size={18}
                style={{
                  opacity: activeTab === tab.id ? 1 : 0.3,
                  transition: 'all 300ms',
                  color: activeTab === tab.id ? '#D4AF37' : 'inherit'
                }}
              />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabGlow"
                  style={{
                    position: 'absolute', bottom: 0, left: 8, right: 8, height: 4,
                    background: '#D4AF37',
                    borderRadius: '4px 4px 0 0',
                    boxShadow: '0 -4px 15px rgba(212, 175, 55, 0.8), 0 0 10px rgba(212, 175, 55, 0.4)'
                  }}
                />
              )}
            </button>
          ))}
        </nav>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <GlassCard padding="none">
              <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                    {activeTab === 'tasks' ? 'Digital Deliverable Matrix' : activeTab === 'team' ? 'Active Digital Project Team' : activeTab === 'registry' ? 'Digital Asset Registry Index' : activeTab === 'branding' ? 'Project Identity & Branding' : activeTab === 'broadcast' ? 'Elite Broadcast Command' : 'Security Access Registry'}
                  </h2>
                  <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 4 }}>
                    {activeTab === 'users' ? 'Management of security clearances and administrative roles' : activeTab === 'branding' ? 'Configuration of project branding and site-wide metadata' : activeTab === 'broadcast' ? 'Dispatch real-time classified notifications and news updates' : 'Real-time synchronization with Digital Workflow Systems'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  {activeTab === 'users' && userProfile?.role === 'OWNER' && (
                    <div style={{ display: 'flex', background: 'rgba(212, 175, 55, 0.05)', padding: 4, borderRadius: 10, border: '1px solid rgba(212, 175, 55, 0.1)', marginRight: 20 }}>
                      <button 
                        onClick={() => setActiveSubTab('users')}
                        style={{ padding: '6px 16px', borderRadius: 8, background: activeSubTab === 'users' ? '#D4AF37' : 'transparent', color: activeSubTab === 'users' ? '#0a0a0f' : '#D4AF37', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 200ms' }}
                      >
                        USERS
                      </button>
                      <button 
                        onClick={() => setActiveSubTab('policies')}
                        style={{ padding: '6px 16px', borderRadius: 8, background: activeSubTab === 'policies' ? '#D4AF37' : 'transparent', color: activeSubTab === 'policies' ? '#0a0a0f' : '#D4AF37', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 200ms' }}
                      >
                        GROUP POLICY
                      </button>
                    </div>
                  )}
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                    <input
                      type="text"
                      placeholder="Filter records..."
                      style={{ padding: '10px 16px 10px 38px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none', width: 240 }}
                    />
                  </div>
                  {activeTab !== 'users' && activeTab !== 'branding' && activeTab !== 'broadcast' && can(activeTab as any, 'edit') && (
                    <button onClick={handleNewRecord} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: '#D4AF37', color: '#0a0a0f', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                      <Plus size={18} />
                      New Record
                    </button>
                  )}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  {activeTab !== 'branding' && (
                    <thead style={{ background: 'rgba(0,0,0,0.1)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <tr>
                        <th style={{ width: 60, padding: '16px 0', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.size > 0 && selectedIds.size === currentTabIds.length}
                            onChange={() => toggleSelectAll(currentTabIds)}
                            style={{ cursor: 'pointer', width: 18, height: 18 }}
                          />
                        </th>
                        <th style={{ textAlign: 'center', padding: '12px 32px', fontSize: 13, fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                          {activeTab === 'users' ? 'Staff Identity' : activeTab === 'team' ? 'Project Personnel' : 'Task Definition / Asset'}
                        </th>
                        <th style={{ textAlign: 'center', padding: '12px 32px', fontSize: 13, fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                          {activeTab === 'users' ? 'Designation' : activeTab === 'team' ? 'Job Title' : 'Delivery Status'}
                        </th>
                        <th style={{ textAlign: 'center', padding: '12px 32px', fontSize: 13, fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                          {activeTab === 'users' ? 'Access Control' : 'Action Hub'}
                        </th>
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {activeTab === 'tasks' && tasksSnapshot?.docs.map((doc: any) => {
                      const task = doc.data() as Task;
                      const isSelected = selectedIds.has(doc.id);
                      return (
                        <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', background: isSelected ? 'rgba(212, 175, 55, 0.05)' : 'transparent' }} onClick={() => handleEditRecord(task)}>
                          <td style={{ textAlign: 'center', padding: '16px 0' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => toggleSelect(doc.id, e as any)}
                              style={{ cursor: 'pointer', width: 16, height: 16 }}
                            />
                          </td>
                          <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>{task.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>ID: {doc.id}</div>
                          </td>
                          <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                            <span style={{ fontSize: 13, background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>{task.department}</span>
                          </td>
                          <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: task.status === 'COMPLETED' ? '#10b981' : '#f59e0b' }} />
                              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{task.status.replace(/_/g, ' ')}</span>
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
                    {activeTab === 'tasks' && !tasksLoading && tasksSnapshot?.docs.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '60px 40px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(212, 175, 55, 0.06)', border: '1px solid rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Inbox size={24} style={{ color: 'rgba(212, 175, 55, 0.4)' }} />
                            </div>
                            <div>
                              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No current data available</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {activeTab === 'team' && membersSnapshot?.docs.map((doc: any) => {
                      const member = doc.data() as TeamMember;
                      const isSelected = selectedIds.has(doc.id);
                      return (
                        <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', background: isSelected ? 'rgba(212, 175, 55, 0.05)' : 'transparent' }} onClick={() => handleEditRecord(member)}>
                          <td style={{ textAlign: 'center', padding: '16px 0' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => toggleSelect(doc.id, e as any)}
                              style={{ cursor: 'pointer', width: 16, height: 16 }}
                            />
                          </td>
                          <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>{member.name}</div>
                          </td>
                          <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                            <span style={{ fontSize: 13, background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>{member.department}</span>
                          </td>
                          <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Active Assignment</span>
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

                    {activeTab === 'registry' && registrySnapshot?.docs.map((doc: any) => {
                      const item = doc.data() as DashboardNavItem;
                      const isSelected = selectedIds.has(doc.id);
                      return (
                        <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', background: isSelected ? 'rgba(212, 175, 55, 0.05)' : 'transparent' }} onClick={() => handleEditRecord(item)}>
                          <td style={{ textAlign: 'center', padding: '16px 0' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => toggleSelect(doc.id, e as any)}
                              style={{ cursor: 'pointer', width: 16, height: 16 }}
                            />
                          </td>
                          <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{item.category}</div>
                          </td>
                          <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                               <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.status === 'LIVE' ? '#10b981' : item.status === 'MAINTENANCE' ? '#D4AF37' : '#64748b' }} />
                               <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.status}</span>
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

                    {activeTab === 'users' && activeSubTab === 'users' && usersSnapshot?.docs.map((doc: any) => {
                      const userRec = doc.data();
                      const isSelected = selectedIds.has(doc.id);
                      return (
                        <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', background: isSelected ? 'rgba(212, 175, 55, 0.05)' : 'transparent' }} onClick={() => handleEditRecord(userRec)}>
                          <td style={{ textAlign: 'center', padding: '16px 0' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => toggleSelect(doc.id, e as any)}
                              style={{ cursor: 'pointer', width: 16, height: 16 }}
                            />
                          </td>
                          <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>{userRec.name || 'Unknown Subject'}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{userRec.email}</div>
                          </td>
                          <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                            <span style={{ fontSize: 13, background: userRec.role === 'OWNER' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(212, 175, 55, 0.1)', color: userRec.role === 'OWNER' ? '#10b981' : '#D4AF37', padding: '4px 10px', borderRadius: 6, fontWeight: 700, letterSpacing: '0.05em' }}>{userRec.role}</span>
                          </td>
                          <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: userRec.status === 'ACTIVE' ? '#10b981' : '#ef4444' }} />
                              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{userRec.status || 'ACTIVE'}</span>
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

                    {activeTab === 'users' && activeSubTab === 'policies' && (
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
                            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Project Sector / Category</label>
                              <input
                                name="title"
                                value={localTitle}
                                onChange={(e) => setLocalTitle(e.target.value)}
                                placeholder="e.g. Infrastructure Hub"
                                style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, color: 'white', fontSize: 15, outline: 'none', transition: 'all 200ms' }}
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Primary Project Name</label>
                              <input
                                name="projectName"
                                value={localProjectName}
                                onChange={(e) => setLocalProjectName(e.target.value)}
                                placeholder="e.g. North Sector Expansion"
                                style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, color: 'white', fontSize: 15, outline: 'none', transition: 'all 200ms' }}
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, gridColumn: 'span 2' }}>
                              <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Dynamic Narrative Stack (Subtitles)</label>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                {subtitleList.map((sub, idx) => (
                                  <div
                                    key={sub.id}
                                    style={{
                                      display: 'flex', gap: 12, alignItems: 'center', padding: 12,
                                      background: idx === 0 ? 'rgba(212, 175, 55, 0.05)' : 'rgba(255,255,255,0.02)',
                                      border: idx === 0 ? '1px solid rgba(212, 175, 55, 0.2)' : '1px solid rgba(255,255,255,0.06)',
                                      borderRadius: 16, transition: 'all 200ms'
                                    }}
                                  >
                                    <div style={{ background: idx === 0 ? '#D4AF37' : 'rgba(255,255,255,0.05)', color: idx === 0 ? '#0a0a0f' : 'rgba(255,255,255,0.4)', width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, flexShrink: 0 }}>
                                      {idx + 1}
                                    </div>
                                    <input
                                      value={sub.text}
                                      onChange={(e) => {
                                        const newList = [...subtitleList];
                                        newList[idx].text = e.target.value;
                                        setSubtitleList(newList);
                                      }}
                                      placeholder={idx === 0 ? "Primary descriptor..." : "Secondary focus..."}
                                      style={{ flex: 1, background: 'none', border: 'none', color: 'white', fontSize: 13, outline: 'none', fontWeight: idx === 0 ? 600 : 400 }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setSubtitleList(prev => prev.filter((_, i) => i !== idx))}
                                      style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: idx === 0 ? 0.3 : 1 }}
                                      disabled={idx === 0}
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))}

                                <button
                                  type="button"
                                  onClick={() => setSubtitleList([...subtitleList, { id: `sub-new-${Date.now()}`, text: '' }])}
                                  style={{ padding: '12px', borderRadius: 16, background: 'rgba(212, 175, 55, 0.05)', border: '1px dashed rgba(212, 175, 55, 0.3)', color: '#D4AF37', fontSize: 11, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                >
                                  <Plus size={14} />
                                  Append Narrative
                                </button>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, gridColumn: 'span 2', padding: 24, background: 'rgba(212, 175, 55, 0.03)', border: '1px solid rgba(212, 175, 55, 0.1)', borderRadius: 20 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <label style={{ fontSize: 11, fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Authorized Domain Spectrum (Access Control)</label>
                                <span style={{ fontSize: 10, color: 'rgba(212, 175, 55, 0.5)', fontWeight: 700 }}>RESTRICTS NEW REGISTRATIONS</span>
                              </div>

                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                                {localAllowedDomains.length === 0 && (
                                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 500, fontStyle: 'italic' }}>No domain restrictions active — All identities allowed.</div>
                                )}
                                {localAllowedDomains.map((domain, idx) => (
                                  <motion.div
                                    key={domain}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: 8, color: '#D4AF37', fontSize: 12, fontWeight: 700 }}
                                  >
                                    <Globe size={12} />
                                    @{domain}
                                    <button
                                      type="button"
                                      onClick={() => setLocalAllowedDomains(prev => prev.filter((_, i) => i !== idx))}
                                      style={{ background: 'transparent', border: 'none', color: '#D4AF37', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2, opacity: 0.6 }}
                                    >
                                      <X size={12} />
                                    </button>
                                  </motion.div>
                                ))}

                                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
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
                                    style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontSize: 13, outline: 'none', padding: '4px 0' }}
                                  />
                                </div>
                              </div>
                              <p style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>Press <span style={{ color: 'white' }}>Enter</span> to add a domain signature to the spectrum.</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, gridColumn: 'span 2' }}>
                              <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Operational Workflow Region</label>
                              <div style={{ position: 'relative' }}>
                                <MapPin size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#ef4444' }} />
                                <input
                                  name="location"
                                  value={localLocation}
                                  onChange={(e) => setLocalLocation(e.target.value)}
                                  placeholder="Workflow Region / Sector"
                                  style={{ width: '100%', padding: '16px 20px 16px 48px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, color: 'white', fontSize: 15, outline: 'none', transition: 'all 200ms' }}
                                />
                              </div>
                            </div>

                            <div style={{ gridColumn: 'span 2', padding: 32, background: 'rgba(15, 15, 25, 0.4)', border: '1px solid rgba(212, 175, 55, 0.15)', borderRadius: 28, boxShadow: '0 20px 50px rgba(0,0,0,0.3)', marginTop: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(212, 175, 55, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(212, 175, 55, 0.3)', boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)' }}>
                                  <Settings size={22} color="#D4AF37" />
                                </div>
                                <div>
                                  <label style={{ fontSize: 14, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block' }}>Elite Environment Configuration Engine</label>
                                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Atmosphere, Focal Calibration & Deep Integration</span>
                                </div>
                              </div>

                              <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{
                                  width: '100%', minHeight: 180, borderRadius: 20, position: 'relative',
                                  overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)',
                                  background: '#0a0a0f', display: 'flex', alignItems: 'center', padding: '0 32px',
                                  boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)', marginBottom: 32
                                }}
                              >
                                {(localBgUrl || projectData?.headerBgUrl) && (
                                  <div
                                    style={{
                                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
                                      backgroundImage: `url(${localBgUrl || projectData?.headerBgUrl})`,
                                      backgroundSize: 'cover',
                                      backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                                      opacity: bgOpacity / 100,
                                      filter: 'brightness(0.7) contrast(1.1)',
                                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                  />
                                )}
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, background: 'radial-gradient(circle at 20% 50%, rgba(10,10,15,0.4) 0%, rgba(10,10,15,0.9) 100%)' }} />

                                <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 24, width: '100%' }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.03em' }}>
                                      {localTitle || 'Wadi Yemm'} - {localProjectName || 'Ras El Hekma'}
                                    </h1>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginTop: 8 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#ffffff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <Cpu size={14} style={{ color: '#D4AF37', filter: 'drop-shadow(0 0 5px rgba(212, 175, 55, 0.5))' }} />
                                        {subtitleList[0]?.text || 'Digital Operations'}
                                      </div>
                                      <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 300 }}>|</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>
                                        <MapPin size={14} style={{ color: '#ef4444', filter: 'drop-shadow(0 0 5px rgba(239, 68, 68, 0.3))' }} />
                                        {localLocation || 'Workflow Region'}
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ flexShrink: 0 }}>
                                    <div style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid rgba(212, 175, 55, 0.1)', background: 'rgba(212, 175, 55, 0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                                      <span style={{ fontSize: 16, fontWeight: 900, color: '#D4AF37', lineHeight: 1 }}>0%</span>
                                      <span style={{ fontSize: 7, fontWeight: 800, color: 'rgba(212, 175, 55, 0.5)', marginTop: 2, textTransform: 'uppercase' }}>Progress</span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                  <div
                                    onClick={() => document.getElementById('bg-upload-hidden')?.click()}
                                    style={{
                                      width: '100%', height: 180, borderRadius: 24, background: 'rgba(0,0,0,0.5)',
                                      border: '1px solid rgba(212, 175, 55, 0.2)', display: 'flex', flexDirection: 'column',
                                      alignItems: 'center', justifyContent: 'center', gap: 16, cursor: 'pointer',
                                      transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', overflow: 'hidden',
                                      boxShadow: 'inset 0 10px 30px rgba(0,0,0,0.5)'
                                    }}
                                  >
                                    {headerBgFile || projectData?.headerBgUrl ? (
                                      <div style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
                                        <img src={localBgUrl || projectData?.headerBgUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      </div>
                                    ) : null}
                                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(212, 175, 55, 0.1)' }}>
                                        <ImageIcon size={28} color="#D4AF37" />
                                      </div>
                                      <div style={{ textAlign: 'center' }}>
                                        <span style={{ fontSize: 11, fontWeight: 900, color: 'white', letterSpacing: '0.1em', display: 'block' }}>DEPLOY SOURCE ASSET</span>
                                        <span style={{ fontSize: 9, fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', marginTop: 4, display: 'block' }}>Support 4K High Dynamic Range</span>
                                      </div>
                                    </div>
                                    <input
                                      id="bg-upload-hidden"
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          setHeaderBgFile(file);
                                          setLocalBgUrl(URL.createObjectURL(file));
                                        }
                                      }}
                                      style={{ display: 'none' }}
                                    />
                                  </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4AF37' }} />
                                        <span style={{ fontSize: 10, color: 'white', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Atmospheric Density</span>
                                      </div>
                                      <span style={{ fontSize: 12, color: '#D4AF37', fontWeight: 900, background: 'rgba(212, 175, 55, 0.1)', padding: '2px 10px', borderRadius: 8, border: '1px solid rgba(212, 175, 55, 0.2)' }}>{bgOpacity}%</span>
                                    </div>
                                    <input type="range" min="0" max="100" value={bgOpacity} onChange={(e) => setBgOpacity(parseInt(e.target.value))} style={{ cursor: 'pointer', accentColor: '#D4AF37', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }} />
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                                        <span style={{ fontSize: 10, color: 'white', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Focal Calibration (Y-Axis)</span>
                                      </div>
                                      <span style={{ fontSize: 12, color: '#10b981', fontWeight: 900, background: 'rgba(16, 185, 129, 0.1)', padding: '2px 10px', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)' }}>{bgPosY}%</span>
                                    </div>
                                    <input type="range" min="0" max="100" value={bgPosY} onChange={(e) => setBgPosY(parseInt(e.target.value))} style={{ cursor: 'pointer', accentColor: '#10b981', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }} />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, gridColumn: 'span 2' }}>
                              <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: 8 }}>
                                Project Brand Portfolio Gallery
                                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>(Horizontal Scroller)</span>
                              </label>

                              <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 16, paddingTop: 4 }} className="custom-scrollbar">
                                {partnerLogosList.map((logo, idx) => (
                                  <motion.div
                                    key={logo.id}
                                    whileHover={{ y: -6, scale: 1.02 }}
                                    style={{
                                      display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center',
                                      padding: 20, borderRadius: 24, background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                                      border: '1px solid rgba(255,255,255,0.08)', minWidth: 160, position: 'relative',
                                      boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                                    }}
                                  >
                                    <div style={{ width: '100%', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <img src={logo.url} alt={`Partner Logo ${idx}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                                      <button type="button" onClick={() => movePartnerLogo(idx, 'up')} disabled={idx === 0} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', background: idx === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(212, 175, 55, 0.1)', color: idx === 0 ? 'rgba(255,255,255,0.2)' : '#D4AF37', cursor: idx === 0 ? 'not-allowed' : 'pointer', transition: 'all 200ms' }}><ArrowLeft size={14} style={{ margin: 'auto' }} /></button>
                                      <button type="button" onClick={() => removePartnerLogo(idx)} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer', transition: 'all 200ms' }}><X size={15} style={{ margin: 'auto' }} /></button>
                                      <button type="button" onClick={() => movePartnerLogo(idx, 'down')} disabled={idx === partnerLogosList.length - 1} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', background: idx === partnerLogosList.length - 1 ? 'rgba(255,255,255,0.02)' : 'rgba(212, 175, 55, 0.1)', color: idx === partnerLogosList.length - 1 ? 'rgba(255,255,255,0.2)' : '#D4AF37', cursor: idx === partnerLogosList.length - 1 ? 'not-allowed' : 'pointer', transition: 'all 200ms' }}><ArrowRight size={14} style={{ margin: 'auto' }} /></button>
                                    </div>
                                  </motion.div>
                                ))}

                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  onClick={() => document.getElementById('logo-upload-hidden')?.click()}
                                  style={{
                                    minWidth: 160, height: 136, borderRadius: 24,
                                    border: '2px dashed rgba(212, 175, 55, 0.3)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    justifyContent: 'center', gap: 10, cursor: 'pointer', color: '#D4AF37',
                                    background: 'rgba(212, 175, 55, 0.02)', transition: 'all 300ms'
                                  }}
                                >
                                  <Plus size={28} />
                                  <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em' }}>ADD PARTNER</span>
                                  <input
                                    id="logo-upload-hidden"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handlePartnerLogoSelect}
                                    style={{ display: 'none' }}
                                  />
                                </motion.div>
                              </div>
                            </div>

                            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                              <motion.button
                                whileHover={{ scale: 1.02, boxShadow: '0 15px 30px rgba(212, 175, 55, 0.4)' }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isBrandingUpdating}
                                style={{
                                  padding: '16px 48px',
                                  background: isBrandingUpdating ? 'rgba(212, 175, 55, 0.5)' : '#D4AF37',
                                  color: '#0a0a0f', border: 'none', borderRadius: 16, fontWeight: 900,
                                  cursor: isBrandingUpdating ? 'not-allowed' : 'pointer',
                                  fontSize: 15, letterSpacing: '0.05em',
                                  boxShadow: '0 8px 16px rgba(212, 175, 55, 0.3)',
                                  display: 'flex', alignItems: 'center', gap: 12
                                }}
                              >
                                {isBrandingUpdating ? (
                                  <>
                                    <Loader2 size={20} className="animate-spin" />
                                    SYNCHRONIZING ASSETS...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 size={20} />
                                    UPDATE PROJECT IDENTITY
                                  </>
                                )}
                              </motion.button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}
                    {activeTab === 'broadcast' && (
                      <tr style={{ background: 'transparent' }}>
                        <td colSpan={5} style={{ padding: '40px' }}>
                          <BroadcastSender showToast={showToast} />
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

      <div style={{ position: 'fixed', bottom: 24, right: 32, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} className="animate-pulse" />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>Live Edits</span>
      </div>

      <AnimatePresence>
        {isModalOpen && activeTab === 'tasks' && (
          <TaskEditorModal 
            task={selectedTask} 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            readOnly={!can('tasks', 'edit')}
            canDelete={can('tasks', 'delete')}
            canApprove={can('tasks', 'edit')}
          />
        )}
        
        {isModalOpen && activeTab === 'team' && (
          <MemberEditorModal 
            member={selectedMember} 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            readOnly={!can('team', 'edit')}
            canDelete={can('team', 'delete')}
          />
        )}
        
        {isModalOpen && activeTab === 'registry' && (
          <RegistryEditorModal 
            item={selectedRegistry} 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            readOnly={!can('registry', 'edit')}
            canDelete={can('registry', 'delete')}
          />
        )}
        {isModalOpen && activeTab === 'users' && activeSubTab === 'users' && (
          <UserEditorModal userRecord={selectedUser} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        )}
        {!!selectedPolicy && (
          <GroupPolicyEditor
            policy={selectedPolicy}
            isOpen={!!selectedPolicy}
            onClose={() => setSelectedPolicy(null)}
          />
        )}
        {isBulkModalOpen && (
          <BulkActionConfirmModal
            isOpen={isBulkModalOpen}
            onClose={() => setIsBulkModalOpen(false)}
            onConfirm={handleBulkDelete}
            count={selectedIds.size}
            actionName={activeTab === 'team' ? 'STAFF RECORDS' : activeTab === 'tasks' ? 'TASK ASSETS' : 'REGISTRY ITEMS'}
          />
        )}
        {eliteAlert.isOpen && (
          <EliteConfirmModal
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
      </AnimatePresence>
    </div>
  );
}
