'use client';

import { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { collections, bulkDelete, getProjectMetadata, updateProjectMetadata, uploadFile } from '@/services/FirebaseService';
import { useToast } from '@/components/shared/EliteToast';
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
import BulkActionConfirmModal from '@/components/admin/BulkActionConfirmModal';

export default function AdminDashboardPage() {
  const { logout, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'tasks' | 'team' | 'branding' | 'registry' | 'users'>('tasks');
  const [isBrandingUpdating, setIsBrandingUpdating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  
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
    if (activeTab === 'tasks') setSelectedTask(null);
    if (activeTab === 'team') setSelectedMember(null);
    if (activeTab === 'registry') setSelectedRegistry(null);
    if (activeTab === 'users') {
      alert('Users can only be created via the Registration portal for security reasons.');
      return;
    }
    setIsModalOpen(true);
  };

  const handleEditRecord = (item: any) => {
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
    const colName = activeTab === 'team' ? 'members' : activeTab;
    await bulkDelete(colName, Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const currentTabIds = getCurrentTabItems().map((item: any) => item.id);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--text-primary)' }}>
      {/* Bulk Action Bar */}
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
              border: '2px solid #ef4444', // Neon Red Frame
              display: 'flex', alignItems: 'center', gap: 24, 
              boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 20px rgba(239, 68, 68, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <Shield size={18} color="#ef4444" />
              </div>
              <div>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'white', display: 'block', letterSpacing: '0.05em' }}>{selectedIds.size} NODES SELECTED</span>
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
              EXECUTE BULK TERMINATION
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header style={{ 
        position: 'sticky', top: 0, zIndex: 100,
        height: 72, background: 'rgba(10, 10, 15, 0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }}>
             <Shield size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: 'white' }}>MANAGEMENT HUB</h1>
            <p style={{ fontSize: 10, color: '#3b82f6', fontWeight: 800, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>KEO Digital Reporting</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Action Hub */}
            <button 
              onClick={logout}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', 
                borderRadius: 12, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)',
                color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer'
              }}
            >
              <LogOut size={16} />
              Termination
            </button>

          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }} />

          {/* User Card - High Contrast Elite */}
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 12, padding: '6px 14px 6px 6px', 
            background: 'rgba(59, 130, 246, 0.1)', borderRadius: 16, border: '2px solid #3b82f6',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.15)'
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 15, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
              {userProfile?.name?.charAt(0) || 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'white', lineHeight: 1 }}>{userProfile?.name || 'Authorized Subject'}</span>
              <span style={{ fontSize: 10, color: '#3b82f6', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 1 }}>{userProfile?.role}</span>
            </div>
          </div>
        </div>
      </header>

      <main style={{ padding: '32px 40px', maxWidth: 1600, margin: '0 auto' }}>
        {/* Navigation Tabs */}
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
          { id: 'tasks', label: 'Tasks Control', icon: BarChart3 },
          { id: 'team', label: 'Team members', icon: Users },
          { id: 'branding', label: 'Branding Settings', icon: Database, ownerOnly: true },
          { id: 'registry', label: 'Portal Registry', icon: LayoutDashboard },
          { id: 'users', label: 'Access Control', icon: Shield, ownerOnly: true },
        ].filter(tab => !tab.ownerOnly || userProfile?.role === 'OWNER').map((tab) => (
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
            className="group"
          >
            <tab.icon 
              size={18} 
              style={{ 
                opacity: activeTab === tab.id ? 1 : 0.3, 
                transition: 'all 300ms',
                color: activeTab === tab.id ? '#3b82f6' : 'inherit'
              }} 
            />
            <span style={{ transition: 'all 300ms' }} className={activeTab === tab.id ? '' : 'group-hover:text-[rgba(255,255,255,0.6)]'}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTabGlow"
                style={{ 
                  position: 'absolute', bottom: 0, left: 8, right: 8, height: 4, 
                  background: '#3b82f6', 
                  borderRadius: '4px 4px 0 0',
                  boxShadow: '0 -4px 15px rgba(59, 130, 246, 0.8), 0 0 10px rgba(59, 130, 246, 0.4)' 
                }} 
              />
            )}
          </button>
        ))}
      </nav>

        {/* Content Area */}
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
                    {activeTab === 'tasks' ? 'Master Task List' : activeTab === 'team' ? 'Project Personnel' : activeTab === 'registry' ? 'Dashboard Index' : activeTab === 'branding' ? 'Branding & Identity' : 'Terminal Access Registry'}
                  </h2>
                  <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 4 }}>
                    {activeTab === 'users' ? 'Management of security clearances and administrative roles' : activeTab === 'branding' ? 'Configuration of project branding and global metadata' : 'Real-time synchronization with Digital Reporting node'}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: 12 }}>
                   <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                    <input 
                      type="text" 
                      placeholder="Filter records..."
                      style={{ padding: '10px 16px 10px 38px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none', width: 240 }}
                    />
                  </div>
                  {activeTab !== 'users' && (
                    <button onClick={handleNewRecord} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                      <Plus size={18} />
                      New Record
                    </button>
                  )}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                       <th style={{ textAlign: 'center', padding: '12px 32px', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                          {activeTab === 'users' ? 'Subject Identity' : 'Technical Scope'}
                        </th>
                        <th style={{ textAlign: 'center', padding: '12px 32px', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                          {activeTab === 'users' ? 'Registry Role' : 'Operational Status'}
                        </th>
                        <th style={{ textAlign: 'center', padding: '12px 32px', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                          {activeTab === 'users' ? 'Auth Command' : 'Command'}
                        </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTab === 'tasks' && tasksSnapshot?.docs.map((doc: any) => {
                      const task = doc.data() as Task;
                      const isSelected = selectedIds.has(doc.id);
                      return (
                        <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }} className="hover:bg-[rgba(255,255,255,0.01)] transition-colors" onClick={() => handleEditRecord(task)}>
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
                            <span style={{ fontSize: 13, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>{task.department}</span>
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
                    
                    {activeTab === 'team' && membersSnapshot?.docs.map((doc: any) => {
                      const member = doc.data() as TeamMember;
                      const isSelected = selectedIds.has(doc.id);
                      return (
                        <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }} className="hover:bg-[rgba(255,255,255,0.01)] transition-colors" onClick={() => handleEditRecord(member)}>
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
                            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{member.role}</div>
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
                        <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }} className="hover:bg-[rgba(255,255,255,0.01)] transition-colors" onClick={() => handleEditRecord(item)}>
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
                            <code style={{ fontSize: 11, color: '#3b82f6', background: 'rgba(59, 130, 246, 0.05)', padding: '2px 6px', borderRadius: 4 }}>{item.link}</code>
                          </td>
                          <td style={{ padding: '12px 32px', textAlign: 'center' }}>
                             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.status === 'LIVE' ? '#10b981' : item.status === 'UPDATING' ? '#3b82f6' : '#64748b' }} />
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

                    {activeTab === 'users' && usersSnapshot?.docs.map((doc: any) => {
                      const userRec = doc.data();
                      const isSelected = selectedIds.has(doc.id);
                      return (
                        <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }} className="hover:bg-[rgba(255,255,255,0.01)] transition-colors" onClick={() => handleEditRecord(userRec)}>
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
                            <span style={{ fontSize: 13, background: userRec.role === 'OWNER' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: userRec.role === 'OWNER' ? '#10b981' : '#3b82f6', padding: '4px 10px', borderRadius: 6, fontWeight: 700, letterSpacing: '0.05em' }}>{userRec.role}</span>
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
                    {activeTab === 'users' && usersSnapshot?.docs.length === 0 && (
                       <tr>
                        <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                          No accounts found in this terminal. Verify administrative clearance.
                        </td>
                       </tr>
                    )}

                    {activeTab === 'branding' && (
                      <tr>
                        <td colSpan={5} style={{ padding: '40px' }}>
                          <form 
                            onSubmit={async (e) => {
                              e.preventDefault();
                              setIsBrandingUpdating(true);
                              try {
                                const formData = new FormData(e.currentTarget);
                                const updates: any = Object.fromEntries(formData.entries());
                                
                                // Handle File Upload if selected
                                if (selectedFile) {
                                  const fileUrl = await uploadFile(selectedFile, `branding/project-logo-${Date.now()}`);
                                  updates.logoUrl = fileUrl;
                                }

                                await updateProjectMetadata(updates);
                                showToast('Project identity updated successfully.', 'SUCCESS');
                                setSelectedFile(null); // Reset
                              } catch (err: any) {
                                console.error('[UPLINK_FAILURE]', err);
                                showToast('Configuration uplink failed.', 'ERROR');
                              } finally {
                                setIsBrandingUpdating(false);
                              }
                            }}
                            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Wadi Yemm / Project Category</label>
                              <input name="title" defaultValue={projectData?.title} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Ras El Hekma / Specific Name</label>
                              <input name="projectName" defaultValue={projectData?.projectName} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Subtitle (e.g. Insite KEO)</label>
                              <input name="subtitle" defaultValue={projectData?.subtitle} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white' }} />
                            </div>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                               <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Location (e.g. North Coast, Egypt)</label>
                               <input name="location" defaultValue={projectData?.location} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white' }} />
                             </div>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                               <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Project Logo (Select Hi-Res Image)</label>
                               <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                 <input 
                                   type="file" 
                                   accept="image/*"
                                   onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                   style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 12 }} 
                                 />
                                 {selectedFile && <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700, whiteSpace: 'nowrap' }}>READY FOR UPLINK</div>}
                               </div>
                             </div>
                            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                               <button 
                                 type="submit" 
                                 disabled={isBrandingUpdating}
                                 style={{ 
                                   padding: '12px 32px', 
                                   background: isBrandingUpdating ? 'rgba(59, 130, 246, 0.5)' : '#3b82f6', 
                                   color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, 
                                   cursor: isBrandingUpdating ? 'not-allowed' : 'pointer', 
                                   boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)',
                                   display: 'flex', alignItems: 'center', gap: 10
                                 }}
                               >
                                 {isBrandingUpdating ? (
                                   <>
                                     <Loader2 size={18} className="animate-spin" />
                                     UPLINKING...
                                   </>
                                 ) : 'UPDATE BRANDING'}
                               </button>
                            </div>
                          </form>
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

      {/* Floating Info */}
      <div style={{ position: 'fixed', bottom: 24, right: 32, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} className="animate-pulse" />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>FIREBASE REALTIME LINK ACTIVE</span>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isModalOpen && activeTab === 'tasks' && (
          <TaskEditorModal 
            task={selectedTask} 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            members={membersSnapshot?.docs.map(doc => {
              const data = doc.data() as TeamMember;
              return { ...data, id: doc.id };
            }) || []}
          />
        )}
        {isModalOpen && activeTab === 'team' && (
          <MemberEditorModal member={selectedMember} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        )}
        {isModalOpen && activeTab === 'registry' && (
          <RegistryEditorModal item={selectedRegistry} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        )}
        {isModalOpen && activeTab === 'users' && (
          <UserEditorModal userRecord={selectedUser} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        )}
        {isBulkModalOpen && (
          <BulkActionConfirmModal 
            isOpen={isBulkModalOpen} 
            count={selectedIds.size} 
            actionName="Deletion" 
            onClose={() => setIsBulkModalOpen(false)} 
            onConfirm={handleBulkDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

