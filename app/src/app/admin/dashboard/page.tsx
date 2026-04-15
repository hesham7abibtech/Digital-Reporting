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
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';

import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { collections, bulkDelete, getProjectMetadata, updateProjectMetadata, uploadFile } from '@/services/FirebaseService';
import { useToast } from '@/components/shared/EliteToast';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';
import { useDocument } from 'react-firebase-hooks/firestore';
import { doc, collection, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import GlassCard from '@/components/shared/GlassCard';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Task, TeamMember, DashboardNavItem, ProjectMetadata, Department, ReportSummaryField, HeaderBadge, BIMReview } from '@/lib/types';
import TaskEditorModal from '@/components/admin/TaskEditorModal';
import MemberEditorModal from '@/components/admin/MemberEditorModal';
import RegistryEditorModal from '@/components/admin/RegistryEditorModal';
import UserEditorModal from '@/components/admin/UserEditorModal';
import DepartmentEditorModal from '@/components/admin/DepartmentEditorModal';
import BIMReviewEditorModal from '@/components/admin/BIMReviewEditorModal';
import BIMImportConfirmModal from '@/components/admin/BIMImportConfirmModal';
import GroupPolicyList from '@/components/admin/GroupPolicyList';

import GroupPolicyEditor from '@/components/admin/GroupPolicyEditor';
import BulkActionConfirmModal from '@/components/admin/BulkActionConfirmModal';
import EliteConfirmModal from '@/components/shared/EliteConfirmModal';
import HeaderBgCropper from '@/components/admin/HeaderBgCropper';

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
            <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              {[
                { id: 'INFO', label: 'INFO', color: '#60a5fa' },
                { id: 'SUCCESS', label: 'SUCCESS', color: '#10b981' },
                { id: 'WARNING', label: 'WARNING', color: '#D4AF37' },
                { id: 'CRITICAL', label: 'CRITICAL', color: '#ef4444' }
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeverity(s.id as any)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                    background: severity === s.id ? `${s.color}20` : 'transparent',
                    color: severity === s.id ? s.color : 'rgba(255,255,255,0.3)',
                    fontSize: 10, fontWeight: 900, cursor: 'pointer', transition: 'all 200ms',
                    boxShadow: severity === s.id ? `inset 0 0 0 1px ${s.color}40` : 'none',
                    letterSpacing: '0.05em'
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
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
  const { isVisible, can, userRole, policy } = usePermissions();
  const router = useRouter();

  // Security Clearance Protocol: TEAM_MATE access to Command Center is restricted
  useEffect(() => {
    if (userProfile && userProfile.role === 'TEAM_MATE') {
      router.push('/');
    }
  }, [userProfile, router]);

  const [activeTab, setActiveTab] = useState<'tasks' | 'team' | 'branding' | 'registry' | 'users' | 'policies' | 'broadcast' | 'reports' | 'bim-reviews'>('tasks');

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
  // Selector state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedRegistry, setSelectedRegistry] = useState<DashboardNavItem | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<any | null>(null);
  const [selectedBimReview, setSelectedBimReview] = useState<BIMReview | null>(null);
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
      { id: 'status-line', label: 'Protocol Status Line', color: projectData.statusColor || '#f59e0b', isVisible: true, isAutomated: true },
      { id: 'date-range', label: 'Operational Period', color: '#D4AF37', isVisible: true, isAutomated: true },
      { id: 'task-count', label: 'Deliverables Count', color: '#818cf8', isVisible: true, isAutomated: true }
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

  // Firestore Listeners
  const [tasksSnapshot, tasksLoading] = useCollection(collections.tasks);
  const [registrySnapshot, registryLoading] = useCollection(collections.registry);
  const [usersSnapshot, usersLoading] = useCollection(collections.users);
  const [bimReviewsSnapshot, bimReviewsLoading] = useCollection(collections.bimReviews);


  // Dynamic linking: Team Members are now explicitly fueled by the registered Users registry
  const membersSnapshot = usersSnapshot;
  const membersLoading = usersLoading;

  const [broadcastsSnapshot, broadcastsLoading] = useCollection(query(collection(db, 'broadcasts'), orderBy('timestamp', 'desc')));
  const [departmentsSnapshot, departmentsLoading] = useCollection(query(collections.departments, orderBy('name', 'asc')));

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
      <div style={{ display: 'flex', height: '100vh' }}>
        {/* Elite Navigation Sidebar */}
        <aside style={{
          width: 280,
          minWidth: 280,
          background: 'rgba(10, 10, 15, 0.98)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          zIndex: 110,
          backdropFilter: 'blur(30px)',
          flexShrink: 0
        }}>
          <div style={{ padding: '32px 16px 24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: 'white', lineHeight: 1.1 }}>ADMIN PORTAL</h1>
              <p style={{ fontSize: 9, color: '#D4AF37', fontWeight: 800, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>Elite Command Center</p>
            </div>
            {projectData?.partnerLogos && projectData.partnerLogos.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%' }}>
                {projectData.partnerLogos.slice(0, 3).map((logo, index) => (
                  <img key={index} src={logo} alt="Partner" style={{ height: 20, opacity: 0.8 }} />
                ))}
              </div>
            )}
          </div>

          <nav className="custom-scrollbar" style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { id: 'tasks', label: 'Deliverable Matrix', icon: BarChart3, permission: 'tasks' },
              { id: 'bim-reviews', label: 'BIM Review Matrix', icon: Layers, permission: 'tasks' },
              { id: 'team', label: 'Project Team', icon: Users, permission: 'team' },
              { id: 'branding', label: 'Identity & Branding', icon: Database, permission: 'branding' },
              { id: 'reports', label: 'Report Settings', icon: Settings, permission: 'reports' },
              { id: 'broadcast', label: 'Communications', icon: Megaphone, permission: 'broadcast' },
              { id: 'users', label: 'Access Control', icon: Shield, permission: 'users' },
            ].filter(tab => tab.id === 'reports' || isVisible(tab.permission as any)).map((tab) => (

              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSelectedIds(new Set()); }}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: 14,
                  border: 'none',
                  background: activeTab === tab.id ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                  color: activeTab === tab.id ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  transition: 'all 300ms',
                  textAlign: 'left',
                  position: 'relative'
                }}
              >
                <tab.icon
                  size={18}
                  style={{
                    opacity: activeTab === tab.id ? 1 : 0.4,
                    color: activeTab === tab.id ? '#D4AF37' : 'inherit'
                  }}
                />
                <span style={{ flex: 1 }}>{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="sidebarActiveMarker"
                    style={{
                      position: 'absolute', left: 0, width: 4, height: 20,
                      background: '#D4AF37',
                      borderRadius: '0 4px 4px 0',
                      boxShadow: '4px 0 15px rgba(212, 175, 55, 0.5)'
                    }}
                  />
                )}
              </button>
            ))}
          </nav>

          <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <button
              onClick={() => setIsLogoutConfirmOpen(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px',
                borderRadius: 14, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)',
                color: '#ef4444', fontSize: 13, fontWeight: 800, cursor: 'pointer'
              }}
            >
              <LogOut size={18} />
              Terminte Protocol
            </button>
          </div>
        </aside>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>
          <header style={{
            height: 72, background: 'rgba(10, 10, 15, 0.85)', backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px',
            position: 'sticky', top: 0, zIndex: 100
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'white', letterSpacing: '-0.01em' }}>
                  {activeTab === 'tasks' ? 'Deliverable Registry' : activeTab === 'bim-reviews' ? 'BIM Review Matrix' : activeTab === 'reports' ? 'Report Configuration' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1) + ' Management'}
                </h2>

              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              {/* Partner Logos moved to Sidebar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{userProfile?.name}</div>
                  <div style={{ fontSize: 10, color: '#D4AF37', fontWeight: 900, textTransform: 'uppercase' }}>{userProfile?.role}</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#D4AF37', color: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                  {userProfile?.name?.charAt(0)}
                </div>
              </div>
            </div>
          </header>

          <main style={{ padding: '32px 40px', flex: 1, overflowY: 'auto', overflowX: 'hidden', height: 'calc(100vh - 72px)' }}>
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
                        {activeTab === 'tasks' ? 'Digital Deliverable Matrix' : activeTab === 'bim-reviews' ? 'BIM Review Intelligence Matrix' : activeTab === 'team' ? 'Active Digital Project Team' : activeTab === 'registry' ? 'Digital Asset Registry Index' : activeTab === 'branding' ? 'Project Identity & Branding' : activeTab === 'broadcast' ? 'Elite Broadcast Command' : 'Security Access Registry'}
                      </h2>

                      <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 4 }}>
                        {activeTab === 'bim-reviews' ? 'Strategic oversight of cross-project BIM submission reviews and status tracking' : activeTab === 'users' ? 'Management of security clearances and administrative roles' : activeTab === 'branding' ? 'Configuration of project branding and site-wide metadata' : activeTab === 'broadcast' ? 'Dispatch real-time classified notifications and news updates' : 'Real-time synchronization with Digital Workflow Systems'}
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
                      {activeTab === 'team' && (
                        <div style={{ display: 'flex', background: 'rgba(212, 175, 55, 0.05)', padding: 4, borderRadius: 10, border: '1px solid rgba(212, 175, 55, 0.1)', marginRight: 20 }}>
                          <button
                            onClick={() => setTeamActiveSubTab('personnel')}
                            style={{ padding: '6px 16px', borderRadius: 8, background: teamActiveSubTab === 'personnel' ? '#D4AF37' : 'transparent', color: teamActiveSubTab === 'personnel' ? '#0a0a0f' : '#D4AF37', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 200ms' }}
                          >
                            PERSONNEL
                          </button>
                          <button
                            onClick={() => setTeamActiveSubTab('departments')}
                            style={{ padding: '6px 16px', borderRadius: 8, background: teamActiveSubTab === 'departments' ? '#D4AF37' : 'transparent', color: teamActiveSubTab === 'departments' ? '#0a0a0f' : '#D4AF37', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 200ms' }}
                          >
                            TASK CATEGORIES
                          </button>
                        </div>
                      )}
                      {activeTab !== 'branding' && activeTab !== 'reports' && activeTab !== 'broadcast' && (
                        <div style={{ position: 'relative' }}>
                          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                          <input
                            type="text"
                            placeholder="Filter records..."
                            style={{ padding: '10px 16px 10px 38px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none', width: 240 }}
                          />
                        </div>
                      )}
                      {activeTab === 'bim-reviews' && can('tasks', 'edit') && (
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
                      {activeTab !== 'users' && activeTab !== 'branding' && activeTab !== 'reports' && activeTab !== 'broadcast' && can(activeTab as any, 'edit') && (
                        <button onClick={handleNewRecord} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: '#D4AF37', color: '#0a0a0f', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                          <Plus size={18} />
                          New Record
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ overflowX: (activeTab === 'reports' || activeTab === 'branding' || activeTab === 'broadcast') ? 'hidden' : 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: (activeTab === 'reports' || activeTab === 'branding' || activeTab === 'broadcast') ? 'fixed' : 'auto' }}>
                      {activeTab !== 'branding' && activeTab !== 'reports' && activeTab !== 'broadcast' && !(activeTab === 'users' && activeSubTab === 'policies') && (
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
                            {activeTab === 'bim-reviews' ? (
                              <>
                                <th style={{ textAlign: 'center', padding: '12px 24px', fontSize: 11, fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Project Identity</th>
                                <th style={{ textAlign: 'center', padding: '12px 24px', fontSize: 11, fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Stage</th>
                                <th style={{ textAlign: 'center', padding: '12px 24px', fontSize: 11, fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Status (InSite)</th>
                                <th style={{ textAlign: 'center', padding: '12px 24px', fontSize: 11, fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Status (Modon/Hill)</th>
                                <th style={{ textAlign: 'center', padding: '12px 24px', fontSize: 11, fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Reviewer</th>
                                <th style={{ textAlign: 'center', padding: '12px 24px', fontSize: 11, fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Due Date</th>
                                <th style={{ textAlign: 'center', padding: '12px 24px', fontSize: 11, fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Submission</th>
                                <th style={{ textAlign: 'center', padding: '12px 24px', fontSize: 11, fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Control</th>
                              </>
                            ) : (
                              <>
                                <th style={{ textAlign: 'center', padding: '12px 32px', fontSize: 13, fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                  {activeTab === 'users' ? 'Staff Identity' : activeTab === 'team' ? (teamActiveSubTab === 'personnel' ? 'Project Personnel' : 'Task Category') : 'Task Definition / Asset'}
                                </th>
                                <th style={{ textAlign: 'center', padding: '12px 32px', fontSize: 13, fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                  {activeTab === 'users' ? 'Designation' : activeTab === 'team' ? (teamActiveSubTab === 'personnel' ? 'Functional Category' : 'Abbreviation') : 'Task Category'}
                                </th>
                                <th style={{ textAlign: 'center', padding: '12px 32px', fontSize: 13, fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                  {activeTab === 'users' ? 'Access Control' : activeTab === 'tasks' ? 'Submitter' : activeTab === 'team' && teamActiveSubTab === 'personnel' ? 'Email Interface' : 'Action Hub'}
                                </th>
                                <th style={{ textAlign: 'center', padding: '12px 32px', fontSize: 13, fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                  {activeTab === 'users' ? 'Security Protocol' : activeTab === 'tasks' ? 'Submission Date' : 'Control'}
                                </th>
                                {activeTab === 'users' && (
                                  <th style={{ textAlign: 'center', padding: '12px 32px', fontSize: 13, fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                    Digital Signature
                                  </th>
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
                            <tr key={doc.id || `task-${i}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', background: isSelected ? 'rgba(212, 175, 55, 0.05)' : 'transparent' }} onClick={() => handleEditRecord(task)}>
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
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                  {task.submitterName && (
                                    <div style={{
                                      width: 28, height: 28, borderRadius: '50%',
                                      background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.2)',
                                      color: '#D4AF37', fontSize: 11, fontWeight: 700,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      flexShrink: 0
                                    }}>
                                      {task.submitterName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{task.submitterName || '—'}</span>
                                </div>
                              </td>
                              <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{formatDate(task.submittingDate || (task as any).actualEndDate || (task as any).actualStartDate)}</span>
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
                                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No current data</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                         {activeTab === 'team' && teamActiveSubTab === 'personnel' && membersSnapshot?.docs.map((doc: any, i: number) => {
                            const member = { id: doc.id, ...doc.data() } as any;
                            const isSelected = selectedIds.has(doc.id);
                            return (
                              <tr key={doc.id || `member-${i}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', background: isSelected ? 'rgba(212, 175, 55, 0.05)' : 'transparent' }} onClick={() => handleEditRecord(member)}>
                                <td style={{ textAlign: 'center', padding: '16px 0' }} onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => toggleSelect(doc.id, e as any)}
                                    style={{ cursor: 'pointer', width: 16, height: 16 }}
                                  />
                                </td>
                               <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                   <div style={{ width: 6, height: 6, borderRadius: '50%', background: member.status === 'ACTIVE' ? '#10b981' : '#f59e0b', flexShrink: 0 }} />
                                   <div style={{ fontWeight: 600, fontSize: 15 }}>{member.name || 'Anonymous User'}</div>
                                 </div>
                               </td>
                               <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                                 <span style={{ fontSize: 13, background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>{member.department || 'Awaiting Assignment'}</span>
                               </td>
                               <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                                 <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{member.email}</div>
                               </td>
                               <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                                 <button style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                                   <MoreVertical size={18} />
                                 </button>
                               </td>
                             </tr>
                           );
                         })}

                        {activeTab === 'team' && teamActiveSubTab === 'departments' && (departmentsSnapshot?.docs.length || 0) > 0 && departmentsSnapshot?.docs.map((doc: any) => {
                          const dept = { id: doc.id, ...doc.data() } as any;
                          const isSelected = selectedIds.has(doc.id);
                          return (
                            <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', background: isSelected ? 'rgba(212, 175, 55, 0.05)' : 'transparent' }} onClick={() => handleEditRecord(dept)}>
                              <td style={{ textAlign: 'center', padding: '16px 0' }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => toggleSelect(doc.id, e as any)}
                                  style={{ cursor: 'pointer', width: 16, height: 16 }}
                                />
                              </td>
                              <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                                <div style={{ fontWeight: 600, fontSize: 15 }}>{dept.name}</div>
                              </td>
                              <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                                <span style={{ fontSize: 13, background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', padding: '4px 10px', borderRadius: 6, fontWeight: 700, letterSpacing: '0.05em' }}>{dept.abbreviation}</span>
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
                            <td colSpan={5} style={{ padding: '60px 40px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(212, 175, 55, 0.06)', border: '1px solid rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Building2 size={24} style={{ color: 'rgba(212, 175, 55, 0.4)' }} />
                                </div>
                                <div>
                                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No current data</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        {activeTab === 'team' && !usersLoading && usersSnapshot?.docs.length === 0 && (
                          <tr>
                            <td colSpan={5} style={{ padding: '60px 40px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(212, 175, 55, 0.06)', border: '1px solid rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Users size={24} style={{ color: 'rgba(212, 175, 55, 0.4)' }} />
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
                            <tr key={doc.id || `bim-${i}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', background: isSelected ? 'rgba(212, 175, 55, 0.05)' : 'transparent' }} onClick={() => { setSelectedBimReview(review); setIsModalOpen(true); }}>
                              <td style={{ textAlign: 'center', padding: '16px 0' }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => toggleSelect(doc.id, e as any)}
                                  style={{ cursor: 'pointer', width: 16, height: 16 }}
                                />
                              </td>
                              <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: 'white' }}>{review.project}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{review.submissionDescription}</div>
                              </td>
                              <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                                <span style={{ fontSize: 10, background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', padding: '4px 8px', borderRadius: 6, fontWeight: 900, letterSpacing: '0.05em' }}>{review.designStage}</span>
                              </td>
                              <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>{review.insiteBimReviewStatus || '—'}</div>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{review.stakeholder}</div>
                              </td>
                              <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                                <div style={{ fontSize: 12, color: '#10b981', fontWeight: 800 }}>{review.modonHillFinalReviewStatus || '—'}</div>
                              </td>
                              <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{review.insiteReviewer || '—'}</div>
                              </td>
                              <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                                <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 800 }}>{review.insiteReviewDueDate || '—'}</div>
                              </td>
                              <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{review.submissionDate || '—'}</div>
                                <div style={{ fontSize: 10, color: review.onAcc === 'SHARED' ? '#10b981' : '#ef4444', fontWeight: 900, marginTop: 4 }}>{review.onAcc}</div>
                              </td>
                              <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                                <button style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                                  <MoreVertical size={18} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {activeTab === 'bim-reviews' && bimReviewsSnapshot?.docs.length === 0 && (
                          <tr>
                            <td colSpan={9} style={{ padding: '60px 40px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(212, 175, 55, 0.06)', border: '1px solid rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Layers size={24} style={{ color: 'rgba(212, 175, 55, 0.4)' }} />
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
                                <span style={{ fontSize: 13, background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>{item.department || 'General'}</span>
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
                                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(212, 175, 55, 0.06)', border: '1px solid rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <LayoutDashboard size={24} style={{ color: 'rgba(212, 175, 55, 0.4)' }} />
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
                        {activeTab === 'users' && activeSubTab === 'users' && !usersLoading && usersSnapshot?.docs.length === 0 && (
                          <tr>
                            <td colSpan={5} style={{ padding: '60px 40px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(212, 175, 55, 0.06)', border: '1px solid rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Shield size={24} style={{ color: 'rgba(212, 175, 55, 0.4)' }} />
                                </div>
                                <div>
                                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No current data</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

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

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, gridColumn: 'span 2', padding: 32, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 28, marginTop: 12 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4AF37' }} />
                                    <h3 style={{ fontSize: 13, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Global Project Identity & Metadata</h3>
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                    {/* Subtitles Section */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                      <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Subtitles</label>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {subtitleList.map((sub, idx) => (
                                          <div key={sub.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
                                            <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.2)', width: 16 }}>{idx + 1}</span>
                                            <input
                                              value={sub.text}
                                              onChange={(e) => {
                                                const newList = [...subtitleList];
                                                newList[idx].text = e.target.value;
                                                setSubtitleList(newList);
                                              }}
                                              style={{ flex: 1, background: 'none', border: 'none', color: 'white', fontSize: 13, outline: 'none' }}
                                            />
                                            <button type="button" onClick={() => setSubtitleList(prev => prev.filter((_, i) => i !== idx))} disabled={idx === 0} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: idx === 0 ? 0 : 0.6 }}><X size={14} /></button>
                                          </div>
                                        ))}
                                        <button type="button" onClick={() => setSubtitleList([...subtitleList, { id: `sub-${Date.now()}`, text: '' }])} style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(212, 175, 55, 0.05)', border: '1px dashed rgba(212, 175, 55, 0.2)', color: '#D4AF37', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>+ ADD SUBTITLE</button>
                                      </div>
                                    </div>

                                    {/* Region & Status Section */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Region</label>
                                        <div style={{ position: 'relative' }}>
                                          <MapPin size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
                                          <input value={localLocation} onChange={(e) => setLocalLocation(e.target.value)} style={{ width: '100%', padding: '12px 16px 12px 40px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'white', fontSize: 14, outline: 'none' }} />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Atmospheric Branding Section */}
                                      <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 24, padding: 32, background: 'rgba(212, 175, 55, 0.03)', border: '1px solid rgba(212, 175, 55, 0.1)', borderRadius: 28, marginTop: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4AF37' }} />
                                            <h3 style={{ fontSize: 13, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Atmospheric Branding (Header Banner)</h3>
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(212, 175, 55, 0.1)', padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                                            <ImageIcon size={14} color="#D4AF37" />
                                            <span style={{ fontSize: 10, fontWeight: 900, color: '#D4AF37' }}>REQUIRED SIZE: 2400 X 200 PX</span>
                                          </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1.2fr) 1fr', gap: 32 }}>
                                          {/* Banner Management */}
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            <div 
                                              style={{ 
                                                width: '100%', minHeight: 140, borderRadius: 16, border: '1px dashed rgba(212, 175, 55, 0.3)', 
                                                background: 'rgba(0,0,0,0.2)', overflow: 'hidden', position: 'relative',
                                                display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
                                                padding: '24px 32px'
                                              }}
                                            >
                                              {headerBgFile || localBgUrl || projectData?.headerBgUrl ? (
                                                <>
                                                  <img 
                                                    src={localBgUrl || projectData?.headerBgUrl} 
                                                    style={{ 
                                                      position: 'absolute',
                                                      inset: 0,
                                                      width: '100%', 
                                                      height: '100%', 
                                                      objectFit: 'cover', 
                                                      objectPosition: `${bgPosX}% ${bgPosY}%`,
                                                      opacity: bgOpacity / 100 
                                                    }} 
                                                    alt="Header Preview" 
                                                  />
                                                  {/* Dashboard Simulation Overlay */}
                                                  <div style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
                                                    <div style={{ fontSize: 18, fontWeight: 900, color: 'white', opacity: 0.6 }}>{localProjectName || projectData?.projectName}</div>
                                                    <div style={{ fontSize: 10, fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', marginTop: 4, letterSpacing: '0.1em' }}>PROJECT TERMINAL PREVIEW</div>
                                                  </div>
                                                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', display: 'flex', alignItems: 'flex-end', padding: 16 }}>
                                                    <button 
                                                      type="button" 
                                                      onClick={() => document.getElementById('header-bg-input')?.click()}
                                                      style={{ background: '#D4AF37', border: 'none', color: '#0a0a0f', padding: '8px 16px', borderRadius: 8, fontSize: 11, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                                                    >
                                                      <ImageIcon size={14} /> REPLACE ASSET
                                                    </button>
                                                  </div>
                                                </>
                                              ) : (
                                                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                                  <ImageIcon size={32} color="rgba(212, 175, 55, 0.2)" />
                                                  <button 
                                                    type="button" 
                                                    onClick={() => document.getElementById('header-bg-input')?.click()}
                                                    style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#D4AF37', padding: '10px 24px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                                                  >
                                                    UPLOAD BANNER
                                                  </button>
                                                </div>
                                              )}
                                              <input 
                                                id="header-bg-input" 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = () => {
                                                      setCropperSource(reader.result as string);
                                                      setShowCropper(true);
                                                    };
                                                    reader.readAsDataURL(file);
                                                  }
                                                }}
                                                style={{ display: 'none' }} 
                                              />
                                            </div>
                                            <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                                              Select a high-resolution panorama. The system will initiate a precision crop to ensure technical aspect ratio alignment.
                                            </p>
                                          </div>

                                          {/* Sliders */}
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '12px 24px', background: 'rgba(0,0,0,0.2)', borderRadius: 20 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <label style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Atmospheric Opacity</label>
                                                <span style={{ fontSize: 10, fontWeight: 900, color: '#D4AF37' }}>{bgOpacity}%</span>
                                              </div>
                                              <input type="range" min="0" max="100" value={bgOpacity} onChange={(e) => setBgOpacity(Number(e.target.value))} style={{ width: '100%', accentColor: '#D4AF37' }} />
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <label style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Vertical Focus Offset (Y)</label>
                                                <span style={{ fontSize: 10, fontWeight: 900, color: '#D4AF37' }}>{bgPosY}%</span>
                                              </div>
                                              <input type="range" min="0" max="100" value={bgPosY} onChange={(e) => setBgPosY(Number(e.target.value))} style={{ width: '100%', accentColor: '#D4AF37' }} />
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <label style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Horizontal Alignment (X)</label>
                                                <span style={{ fontSize: 10, fontWeight: 900, color: '#D4AF37' }}>{bgPosX}%</span>
                                              </div>
                                              <input type="range" min="0" max="100" value={bgPosX} onChange={(e) => setBgPosX(Number(e.target.value))} style={{ width: '100%', accentColor: '#D4AF37' }} />
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                    {/* Partner Logo Registry Section (Elite Vector Hub) */}
                                    <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 24, padding: 32, background: 'rgba(212, 175, 55, 0.03)', border: '1px solid rgba(212, 175, 55, 0.1)', borderRadius: 28, marginTop: 12 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4AF37' }} />
                                          <h3 style={{ fontSize: 13, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Partner Logo Registry (Top Bar Display)</h3>
                                        </div>
                                        <button 
                                          type="button" 
                                          onClick={() => document.getElementById('partner-logo-input')?.click()} 
                                          style={{ 
                                            padding: '8px 16px', borderRadius: 10, background: '#D4AF37', 
                                            border: 'none', color: '#0a0a0f', fontSize: 11, fontWeight: 900, 
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 
                                          }}
                                        >
                                          <Plus size={14} /> ADD PARTNER LOGO
                                        </button>
                                        <input 
                                          id="partner-logo-input" 
                                          type="file" 
                                          multiple 
                                          accept="image/*" 
                                          onChange={handlePartnerLogoSelect} 
                                          style={{ display: 'none' }} 
                                        />
                                      </div>

                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                                        {partnerLogosList.map((logo, idx) => (
                                          <motion.div 
                                            key={logo.id} 
                                            layout 
                                            initial={{ opacity: 0, scale: 0.9 }} 
                                            animate={{ opacity: 1, scale: 1 }} 
                                            style={{ 
                                              padding: 20, background: 'rgba(255,255,255,0.02)', 
                                              border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, 
                                              position: 'relative', display: 'flex', flexDirection: 'column', 
                                              alignItems: 'center', gap: 20,
                                              boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                                            }}
                                          >
                                            <div style={{ width: '100%', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 16, border: '1px solid rgba(212, 175, 55, 0.05)' }}>
                                              <img src={logo.url} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.2))' }} alt="Partner" />
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                                              <button type="button" onClick={() => movePartnerLogo(idx, 'up')} disabled={idx === 0} style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, color: '#D4AF37', cursor: 'pointer', opacity: idx === 0 ? 0.2 : 0.8 }} title="Move Left"><ChevronLeft size={16} /></button>
                                              <button type="button" onClick={() => movePartnerLogo(idx, 'down')} disabled={idx === partnerLogosList.length - 1} style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, color: '#D4AF37', cursor: 'pointer', opacity: idx === partnerLogosList.length - 1 ? 0.2 : 0.8 }} title="Move Right"><ChevronRight size={16} /></button>
                                              <button type="button" onClick={() => removePartnerLogo(idx)} style={{ flex: 1, padding: '8px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: 10, color: '#ef4444', cursor: 'pointer' }} title="Purge Logo"><Trash2 size={16} /></button>
                                            </div>
                                          </motion.div>
                                        ))}
                                        {partnerLogosList.length === 0 && (
                                          <div style={{ gridColumn: 'span 4', padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 20 }}>
                                            <ImageIcon size={32} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: 12 }} />
                                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>No partner identity vectors registered. Upload logos to populate the Top Bar.</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Badges Section */}
                                    <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Insight Badges</label>
                                        <button type="button" onClick={() => setLocalHeaderBadges([...localHeaderBadges, { id: `manual-${Date.now()}`, label: 'New Insight', color: '#D4AF37', isVisible: true }])} style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#D4AF37', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}>+ ADD BADGE</button>
                                      </div>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                                        {localHeaderBadges.map((badge, idx) => (
                                          <div key={badge.id} style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 12, alignItems: 'center' }}>
                                            <input type="color" value={badge.color} onChange={(e) => {
                                              const newList = [...localHeaderBadges];
                                              newList[idx].color = e.target.value;
                                              setLocalHeaderBadges(newList);
                                            }} style={{ width: 24, height: 24, padding: 0, border: 'none', background: 'none', cursor: 'pointer', borderRadius: '50%' }} />
                                            <input value={badge.label} onChange={(e) => {
                                              const newList = [...localHeaderBadges];
                                              newList[idx].label = e.target.value;
                                              setLocalHeaderBadges(newList);
                                            }} style={{ flex: 1, background: 'none', border: 'none', color: 'white', fontSize: 13, outline: 'none', fontWeight: 600 }} />
                                            <button type="button" onClick={() => {
                                              const newList = [...localHeaderBadges];
                                              newList[idx].isVisible = !newList[idx].isVisible;
                                              setLocalHeaderBadges(newList);
                                            }} style={{ background: badge.isVisible ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)', color: badge.isVisible ? '#10b981' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 9, fontWeight: 900 }}>{badge.isVisible ? 'LIVE' : 'HID'} {badge.isVisible ? <Check size={10} /> : <X size={10} />}</button>
                                            {!badge.isAutomated && (
                                              <button type="button" onClick={() => setLocalHeaderBadges(localHeaderBadges.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}><X size={14} /></button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
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
                        {activeTab === 'reports' && (
                          <tr style={{ background: 'transparent' }}>
                            <td colSpan={20} style={{ padding: 0, width: '100%' }}>
                              <div style={{ padding: '40px 8px', width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                                          <Settings size={18} color="#D4AF37" />
                                        </div>
                                        <h3 style={{ fontSize: 18, fontWeight: 900, color: 'white', margin: 0 }}>Reporting Engine Command Center</h3>
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
                                        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.06)', margin: '0 8px' }} />
                                        <button
                                          onClick={handleManualSync}
                                          disabled={isSavingReport}
                                          style={{
                                            padding: '10px 24px', borderRadius: 12, border: 'none',
                                            background: saveSuccess ? '#10b981' : '#D4AF37',
                                            color: '#0a0a0f', fontSize: 11, fontWeight: 900,
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                            transition: 'all 200ms', opacity: isSavingReport ? 0.7 : 1,
                                            boxShadow: saveSuccess ? '0 0 20px rgba(16, 185, 129, 0.2)' : '0 10px 20px rgba(212, 175, 55, 0.1)'
                                          }}
                                        >
                                          {saveSuccess ? <CheckCircle2 size={14} /> : <Save size={14} />}
                                          {saveSuccess ? 'CONFIG SAVED' : 'SAVE CHANGES'}
                                        </button>
                                      </div>
                                    </div>

                                    <div style={{ padding: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4AF37' }} />
                                        <span style={{ fontSize: 10, fontWeight: 900, color: 'white', letterSpacing: '0.1em' }}>GLOBAL REPORT TEMPLATE CONFIGURATION</span>
                                      </div>
                                      
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                          <label style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Report Title</label>
                                          <input
                                            value={localReportTitle}
                                            onChange={(e) => setLocalReportTitle(e.target.value)}
                                            placeholder="e.g. Executive Status Report"
                                            style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 13, outline: 'none' }}
                                          />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                          <label style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subtitle / Reference</label>
                                          <input
                                            value={localReportSubtitle}
                                            onChange={(e) => setLocalReportSubtitle(e.target.value)}
                                            placeholder="e.g. Q2 Performance Overview"
                                            style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 13, outline: 'none' }}
                                          />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, gridColumn: 'span 2' }}>
                                          <label style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cover Summary / Disclaimer</label>
                                          <textarea
                                            value={localReportSummary}
                                            onChange={(e) => setLocalReportSummary(e.target.value)}
                                            placeholder="Detailed project summary for the cover page..."
                                            rows={2}
                                            style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 13, outline: 'none', resize: 'none' }}
                                          />
                                        </div>
                                      </div>

                                      <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.04)', margin: '8px 0' }} />

                                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }} />
                                        <span style={{ fontSize: 10, fontWeight: 900, color: 'white', letterSpacing: '0.1em' }}>DOCUMENT HEADER REGISTRY</span>
                                      </div>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                        {localSummaryFields.map((field, idx) => (
                                            <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1.5fr', gap: 14, alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.04)', transition: 'all 200ms' }}>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updated = [...localSummaryFields];
                                                  updated[idx] = { ...updated[idx], isVisible: !updated[idx].isVisible };
                                                  setLocalSummaryFields(updated);
                                                }}
                                                style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: field.isVisible ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)', color: field.isVisible ? '#10b981' : 'rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 200ms' }}
                                              >
                                                {field.isVisible ? <CheckCircle2 size={14} /> : <X size={14} />}
                                              </button>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', minWidth: 40, letterSpacing: '0.05em' }}>Label</span>
                                                <input
                                                  value={field.label}
                                                  onChange={e => {
                                                    const updated = [...localSummaryFields];
                                                    updated[idx] = { ...updated[idx], label: e.target.value };
                                                    setLocalSummaryFields(updated);
                                                  }}
                                                  style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '4px 0', color: 'white', fontSize: 13, outline: 'none' }}
                                                  placeholder="Label Text"
                                                />
                                              </div>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', minWidth: 40, letterSpacing: '0.05em' }}>Value</span>
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
                                                  style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '4px 0', color: 'white', fontSize: 13, outline: 'none' }}
                                                  placeholder={['activeDate', 'generatedOn', 'totalTasks'].includes(field.id) ? "Dynamic Fallback" : (field.id === 'periodReference' ? "Operational Performance & Deliverables" : (field.id === 'temporalReference' ? "MAY 2026 HUB RECAP" : "Hardcoded Value"))}
                                                />
                                              </div>
                                            </div>
                                          ))}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(212, 175, 55, 0.05)', padding: '16px 20px', borderRadius: 16, border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                              <Globe size={14} color="#D4AF37" opacity={0.6} />
                                              <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(212,175,55,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Administrative Branding</span>
                                            </div>
                                            <input value={localReportBranding} onChange={(e) => setLocalReportBranding(e.target.value)} style={{ padding: '8px 0', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: '#D4AF37', fontSize: 13, outline: 'none', fontWeight: 800 }} placeholder="KEO DIGITAL INTELLIGENCE // MASTER TRANSCRIPT" />
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                              <Shield size={14} color="white" opacity={0.3} />
                                              <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Security Footer Protocol</span>
                                            </div>
                                            <input value={localReportFooter} onChange={(e) => setLocalReportFooter(e.target.value)} style={{ padding: '8px 0', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 13, outline: 'none', opacity: 0.8 }} placeholder="PRIVATE & CONFIDENTIAL // INTEGRATED DATA STREAM" />
                                          </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.03)' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Executive Narrative Overlay</span>
                                          </div>
                                          <textarea value={localReportSummary} onChange={(e) => setLocalReportSummary(e.target.value)} rows={2} style={{ padding: '8px 0', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'white', resize: 'none', fontSize: 12, outline: 'none', lineHeight: 1.5 }} placeholder="Enter official executive disclaimer narrative..." />
                                        </div>
                                      </div>
                                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0, fontStyle: 'italic' }}>* Toggling visibility off hides the entire header row from exported document structures.</p>
                                    </div>

                                    <div style={{ padding: 24, background: 'rgba(212, 175, 55, 0.03)', border: '1px solid rgba(212, 175, 55, 0.1)', borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4AF37' }} />
                                        <span style={{ fontSize: 10, fontWeight: 900, color: '#D4AF37', letterSpacing: '0.1em' }}>AESTHETIC VECTORS</span>
                                      </div>

                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                                        {/* PDF Section */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, borderLeft: '3px solid #60a5fa' }}>
                                            <span style={{ fontSize: 9, fontWeight: 900, color: '#60a5fa', letterSpacing: '0.1em' }}>PDF ATMOSPHERE CALIBRATION</span>
                                          </div>
                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <div>
                                              <label style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6 }}>PRIMARY BG</label>
                                              <input type="color" value={localReportBgColor} onChange={(e) => setLocalReportBgColor(e.target.value)} style={{ width: '100%', height: 32, border: 'none', background: 'none', cursor: 'pointer' }} title="Main background of PDF pages" />
                                            </div>
                                            <div>
                                              <label style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6 }}>ACCENT LINE</label>
                                              <input type="color" value={localReportAccentColor} onChange={(e) => setLocalReportAccentColor(e.target.value)} style={{ width: '100%', height: 32, border: 'none', background: 'none', cursor: 'pointer' }} title="Left-side vertical brand accent" />
                                            </div>
                                            <div>
                                              <label style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6 }}>HEADING TEXT</label>
                                              <input type="color" value={localReportHeaderTextColor} onChange={(e) => setLocalReportHeaderTextColor(e.target.value)} style={{ width: '100%', height: 32, border: 'none', background: 'none', cursor: 'pointer' }} title="Report Title & Unit labels" />
                                            </div>
                                            <div>
                                              <label style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6 }}>BODY TEXT</label>
                                              <input type="color" value={localReportPdfBodyTextColor} onChange={(e) => setLocalReportPdfBodyTextColor(e.target.value)} style={{ width: '100%', height: 32, border: 'none', background: 'none', cursor: 'pointer' }} title="General narrative and metadata text" />
                                            </div>
                                          </div>
                                        </div>

                                        {/* Excel Section */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, borderLeft: '3px solid #10b981' }}>
                                            <span style={{ fontSize: 9, fontWeight: 900, color: '#10b981', letterSpacing: '0.1em' }}>EXCEL FORGE CONFIGURATION</span>
                                          </div>
                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <div>
                                              <label style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6 }}>APP BAR BG</label>
                                              <input type="color" value={localReportExcelHeaderColor} onChange={(e) => setLocalReportExcelHeaderColor(e.target.value)} style={{ width: '100%', height: 32, border: 'none', background: 'none', cursor: 'pointer' }} title="Standard Excel header bar color" />
                                            </div>
                                            <div>
                                              <label style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6 }}>HEADER TEXT</label>
                                              <input type="color" value={localReportExcelHeaderTextColor} onChange={(e) => setLocalReportExcelHeaderTextColor(e.target.value)} style={{ width: '100%', height: 32, border: 'none', background: 'none', cursor: 'pointer' }} title="Color of text in the Excel header bar" />
                                            </div>
                                            <div>
                                              <label style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6 }}>SHEET ACCENT</label>
                                              <input type="color" value={localReportExcelAccentColor} onChange={(e) => setLocalReportExcelAccentColor(e.target.value)} style={{ width: '100%', height: 32, border: 'none', background: 'none', cursor: 'pointer' }} title="Sheet tab bottom border and active indicators" />
                                            </div>
                                            <div>
                                              <label style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6 }}>GRID TEXT</label>
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

                                  <div style={{ padding: '48px 24px', width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 48, position: 'relative', overflow: 'hidden' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, padding: '0 24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                          <div style={{ fontSize: 12, fontWeight: 900, color: 'white', letterSpacing: '0.1em' }}>LIVE REPORT SIMULATION</div>
                                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Ultra-accurate real-time visualization of the document identity</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.4)', padding: 6, borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
                                          <button type="button" onClick={() => setSimulationMode('PDF')} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: simulationMode === 'PDF' ? '#D4AF37' : 'transparent', color: simulationMode === 'PDF' ? '#0a0a0f' : 'white', fontSize: 11, fontWeight: 900, cursor: 'pointer', transition: 'all 200ms' }}>PDF ENGINE</button>
                                          <button type="button" onClick={() => setSimulationMode('EXCEL')} style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: simulationMode === 'EXCEL' ? '#10b981' : 'transparent', color: simulationMode === 'EXCEL' ? '#0a0a0f' : 'white', fontSize: 11, fontWeight: 900, cursor: 'pointer', transition: 'all 200ms' }}>EXCEL ENGINE</button>
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
                                              position: 'absolute', left: 0, zIndex: 10, width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 200ms', opacity: currentPdfPage === 0 ? 0.3 : 1, pointerEvents: currentPdfPage === 0 ? 'none' : 'auto'
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
                                                width: 842, height: 595, background: localReportBgColor, borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)',
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
                                                  <div style={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.9 }}>{localReportSubtitle || 'OPERATIONAL PERFORMANCE & DELIVERABLES'}</div>
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
                                                        <span style={{ color: 'white', opacity: 0.95 }}>{val}</span>
                                                      </div>
                                                    );
                                                  })}
                                                </div>

                                                {/* Security Footer Protocol (Narrow bottom margin) */}
                                                <div style={{ position: 'absolute', bottom: 42, left: 57, fontSize: 12, color: 'white', opacity: 0.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                  {localReportFooter || 'PRIVATE & CONFIDENTIAL // INTEGRATED DATA STREAM'}
                                                </div>
                                              </div>
                                            </div>

                                            {/* Slide 2 Container */}
                                            <div style={{ flex: '0 0 100%', display: 'flex', justifyContent: 'center', scrollSnapAlign: 'center' }}>
                                              {/* PDF Page 2: Table Data (LANDSCAPE) */}
                                              <div style={{
                                                width: 842, height: 595, background: 'white', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)',
                                                display: 'flex', flexDirection: 'column', padding: 48, flexShrink: 0, overflow: 'hidden',
                                                boxShadow: '0 40px 80px rgba(0,0,0,0.6)'
                                              }}>
                                                <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', letterSpacing: '0.05em', marginBottom: 24, textTransform: 'uppercase' }}>
                                                  {localReportBranding || 'KEO DIGITAL INTELLIGENCE // MASTER TRANSCRIPT'}
                                                </div>

                                                <div style={{ flex: 1, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                  {/* Table Header: Black background, Gold text */}
                                                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 100px 100px 100px 140px', background: '#0a0a0f', borderBottom: '1px solid #1e293b', padding: '12px' }}>
                                                    {[
                                                      { label: 'UID', width: 100 },
                                                      { label: 'ASSET TITLE', width: '1fr' },
                                                      { label: 'DEPT', width: 100 },
                                                      { label: 'STATUS', width: 100 },
                                                      { label: 'START (ACTUAL)', width: 100 },
                                                      { label: 'FINISH (ACTUAL)', width: 100 },
                                                      { label: 'DELIVERABLES LINKS', width: 140 }
                                                    ].map((h, i) => (
                                                      <span key={i} style={{ fontSize: 8, fontWeight: 900, color: localReportAccentColor, letterSpacing: '0.05em', textAlign: 'center' }}>{h.label}</span>
                                                    ))}
                                                  </div>

                                                  <div className="custom-scrollbar" style={{ overflowY: 'auto', maxHeight: 420 }}>
                                                    {(memoizedTasks.length > 0 ? memoizedTasks.slice(0, 12) : [
                                                      { id: 'BIM-100', title: 'BIM Task Test', department: 'BIM', status: 'COMPLETED', actualStartDate: '10-APR-2026', actualEndDate: '10-APR-2026' },
                                                      { id: 'DR-100', title: 'Monthly Task Test', department: 'Digital Reporting', status: 'COMPLETED', actualStartDate: '18-MAR-2026', actualEndDate: '10-APR-2026' },
                                                      { id: 'GIS-100', title: 'GIS Data Sync', department: 'GIS', status: 'COMPLETED', actualStartDate: '10-APR-2026', actualEndDate: '10-APR-2026' }
                                                    ]).map((task: any, idx) => (
                                                      <div key={task.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 100px 100px 100px 140px', borderBottom: '1px solid #e2e8f0', padding: '10px 12px', background: 'white', alignItems: 'center', minHeight: 44 }}>
                                                        <span style={{ fontSize: 9, color: '#475569', textAlign: 'center', fontWeight: 500 }}>REH-{task.id?.split('-').pop()?.toUpperCase() || 'DH-100'}</span>
                                                        <span style={{ fontSize: 9, color: '#1e293b', fontWeight: 600, paddingLeft: 12 }}>{task.title}</span>
                                                        <span style={{ fontSize: 8, color: '#64748b', textAlign: 'center' }}>{task.department || 'N/A'}</span>
                                                        <span style={{ fontSize: 8, color: '#475569', fontWeight: 700, textAlign: 'center' }}>{task.status?.toUpperCase()}</span>
                                                        <span style={{ fontSize: 8, color: '#64748b', textAlign: 'center' }}>{task.actualStartDate || 'N/A'}</span>
                                                        <span style={{ fontSize: 8, color: '#64748b', textAlign: 'center' }}>{task.actualEndDate || 'N/A'}</span>
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
                                              position: 'absolute', right: 0, zIndex: 10, width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 200ms', opacity: currentPdfPage === 1 ? 0.3 : 1, pointerEvents: currentPdfPage === 1 ? 'none' : 'auto'
                                            }}
                                          >
                                            <ChevronRight size={24} />
                                          </button>

                                          {/* Page Indicator */}
                                          <div style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
                                            {[0, 1].map(i => (
                                              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: currentPdfPage === i ? '#D4AF37' : 'rgba(255,255,255,0.2)', transition: 'all 300ms' }} />
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
                                        <div style={{ flex: 1, background: 'white', overflowX: 'auto', position: 'relative', padding: 20 }} className="custom-scrollbar">
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
                                                  background: excelActiveTab === sheet.id ? 'white' : 'transparent',
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
                        {activeTab === 'broadcast' && (
                          <tr style={{ background: 'transparent' }}>
                            <td colSpan={5} style={{ padding: '40px' }}>
                              <BroadcastSender showToast={showToast} />

                              {/* Broadcast History Log */}
                              <div style={{ marginTop: 64 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                  <Megaphone size={18} color="#D4AF37" />
                                  <span style={{ fontSize: 13, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Transmission History Log</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                  {broadcastsSnapshot?.docs.map(docSnap => {
                                    const b = docSnap.data();
                                    const timeStr = b.timestamp?.toDate
                                      ? b.timestamp.toDate().toLocaleString()
                                      : (b.timestamp ? new Date(b.timestamp).toLocaleString() : 'Pending...');

                                    return (
                                      <div key={docSnap.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)' }}>
                                        <div style={{ display: 'flex', gap: 16 }}>
                                          <div style={{ width: 40, height: 40, borderRadius: 12, background: b.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {b.type === 'NOTIF' ? <Bell size={18} color={b.severity === 'CRITICAL' ? '#ef4444' : '#60a5fa'} /> : <Newspaper size={18} color="#a78bfa" />}
                                          </div>
                                          <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                              <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', color: 'white' }}>{b.type}</span>
                                              <span style={{ fontSize: 9, fontWeight: 900, color: b.severity === 'CRITICAL' ? '#ef4444' : '#D4AF37' }}>{b.severity}</span>
                                            </div>
                                            <div style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>{b.title}</div>
                                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4, maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.description}</div>
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

          <div style={{ position: 'fixed', bottom: 24, right: 32, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} className="animate-pulse" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>Live Edits</span>
          </div>

          <AnimatePresence>
            {isModalOpen && activeTab === 'tasks' && (
              <TaskEditorModal
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
                  member={selectedMember}
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  readOnly={!can('team', 'edit')}
                  canDelete={can('team', 'delete')}
                />
              ) : (
                <DepartmentEditorModal
                  department={selectedDepartment}
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  canDelete={can('team', 'delete')}
                />
              )
            )}

            {isModalOpen && activeTab === 'registry' && (
              <RegistryEditorModal
                item={selectedRegistry}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                readOnly={!can('registry', 'edit')}
                canDelete={can('registry', 'delete')}
                departments={memoizedDepartments}
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
            {broadcastToDelete && (
              <EliteConfirmModal
                isOpen={!!broadcastToDelete}
                onClose={() => setBroadcastToDelete(null)}
                onConfirm={async () => {
                  if (!broadcastToDelete) return;
                  await deleteDoc(doc(db, 'broadcasts', broadcastToDelete.id));
                  showToast('Transmission purged securely.', 'SUCCESS');
                }}
                title="Purge Transmission"
                message={`Authorize the definitive eradication of "${broadcastToDelete?.title}"? This will be instantly removed from the live dashboard and cannot be reversed.`}
                confirmLabel="Execute Purge"
                severity="DANGER"
              />
            )}
            {isModalOpen && activeTab === 'bim-reviews' && (
              <BIMReviewEditorModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedBimReview(null); }}
                review={selectedBimReview}
                onSuccess={(msg) => showToast(msg, 'SUCCESS')}
                onError={(msg) => showToast(msg, 'ERROR')}
              />
            )}

      <BIMImportConfirmModal
        isOpen={bimImportConfirm.isOpen}
        onClose={() => setBimImportConfirm({ isOpen: false, records: [] })}
        onConfirm={handleImportConfirm}
        isLoading={isBimImportLoading}
        records={bimImportConfirm.records}
      />
          </AnimatePresence>

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
