'use client';

import { useState, useMemo } from 'react';
import ParticleBackground from '@/components/layout/ParticleBackground';
import Header from '@/components/layout/Header';
import ProjectHeader from '@/components/dashboard/ProjectHeader';
import KPICards from '@/components/dashboard/KPICards';
import ActiveTasks from '@/components/dashboard/ActiveTasks';
import CompletedTasks from '@/components/dashboard/CompletedTasks';
import DashboardRegistry from '@/components/dashboard/DashboardRegistry';
import ChartsSection from '@/components/dashboard/ChartsSection';
import NotificationPanel from '@/components/dashboard/NotificationPanel';
import TaskDetailModal from '@/components/dashboard/TaskDetailModal';
import type { Task } from '@/lib/types';
import { useTimeZone } from '@/context/TimeZoneContext';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from 'lucide-react';

export default function Dashboard() {
  const { isUpdating, selectedTimeZone } = useTimeZone();
  const { tasks: syncedTasks, members: syncedMembers, registry: syncedRegistry, project: syncedProject, isLoading } = useRealtimeData();
  const { userProfile } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    if (!userProfile) return syncedTasks;
    // TEAM_MATE protocol: Only visible items are those assigned to the current user
    if (userProfile.role === 'TEAM_MATE') {
      return syncedTasks.filter(t => t.assigneeId === userProfile.uid);
    }
    return syncedTasks;
  }, [syncedTasks, userProfile]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <ParticleBackground />

      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header project={syncedProject || undefined} onNotificationClick={() => setNotifOpen(true)} />

        <main style={{ flex: 1, padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 'calc(100vh - 100px)' }}>
          {isLoading && syncedTasks.length === 0 && !syncedProject ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', flexDirection: 'column', gap: 16 }}>
              <div style={{ width: 40, height: 40, border: '2px solid rgba(212, 175, 55, 0.1)', borderTopColor: '#D4AF37', borderRadius: '50%' }} className="animate-spin" />
              <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.05em' }}>ESTABLISHING SECURE CONNECTION...</p>
            </div>
          ) : (
            <>
              {(() => {
                const progress = filteredTasks.length > 0 
                  ? Math.round((filteredTasks.filter(t => t.status === 'COMPLETED').length / filteredTasks.length) * 100) 
                  : 0;
                return <ProjectHeader project={syncedProject || undefined} members={syncedMembers} progress={progress} tasks={filteredTasks} />;
              })()}
              <KPICards tasks={filteredTasks} />

              {/* Tasks (left) + ALL Charts (right, single spanning column) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 440px',
                  gap: 14,
                  alignItems: 'start',
                }}
              >
                {/* Left: task sections stacked */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <ActiveTasks tasks={filteredTasks} onTaskClick={handleTaskClick} />
                  <CompletedTasks tasks={filteredTasks} onTaskClick={handleTaskClick} />
                  <DashboardRegistry items={syncedRegistry} />
                </div>

                {/* Right: all charts in one column, independent of task expand/collapse */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <ChartsSection position="right" tasks={filteredTasks} />
                  <ChartsSection position="right-bottom" tasks={filteredTasks} />
                </div>
              </div>
            </>
          )}
        </main>

        <footer style={{ padding: '10px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>© 2026 Insite (KEO) — REH Command Center v1.0</p>
        </footer>
      </div>

      <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      <TaskDetailModal 
        task={selectedTask ? (syncedTasks.find(t => t.id === selectedTask.id) || selectedTask) : null} 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)} 
      />

      {/* Global Sync Overlay */}
      <AnimatePresence>
        {isUpdating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', 
              inset: 0,
              zIndex: 10000,
              background: 'radial-gradient(circle at center, rgba(10, 15, 30, 0.9) 0%, rgba(5, 5, 10, 0.95) 100%)', 
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'white',
              gap: 48
            }}
          >
            {/* Elite Animated Core */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Outer scanning rings */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                style={{
                  position: 'absolute',
                  width: 220, height: 220, borderRadius: '50%',
                  border: '1px solid rgba(212, 175, 55, 0.05)',
                  borderTop: '1px solid rgba(212, 175, 55, 0.4)',
                }}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                style={{
                  position: 'absolute',
                  width: 180, height: 180, borderRadius: '50%',
                  border: '1px solid rgba(139, 92, 246, 0.05)',
                  borderBottom: '1px solid rgba(139, 92, 246, 0.4)',
                }}
              />

              {/* Main Spinner */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                style={{
                  width: 140, height: 140, borderRadius: '50%',
                  border: '3px solid rgba(212, 175, 55, 0.05)',
                  borderTop: '3px solid #D4AF37',
                  boxShadow: '0 0 60px rgba(212, 175, 55, 0.2), inset 0 0 30px rgba(212, 175, 55, 0.1)',
                }}
              />
              
              <motion.div
                animate={{ 
                  scale: [1, 1.15, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                style={{ position: 'absolute' }}
              >
                <Globe size={60} style={{ color: 'white', filter: 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.6))' }} />
              </motion.div>
            </div>
            
            {/* Text Information Group */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ textAlign: 'center' }}
              >
                <h2 style={{ 
                  fontSize: 36, 
                  fontWeight: 900, 
                  letterSpacing: '-0.04em', 
                  margin: 0, 
                  background: 'linear-gradient(to bottom, #ffffff 0%, #cbd5e1 100%)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.1))'
                }}>
                  Synchronizing Global Data
                </h2>
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  padding: '8px 24px', 
                  borderRadius: 100, 
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4AF37', boxShadow: '0 0 12px #D4AF37' }} className="animate-pulse" />
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: 600, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                  Applying Regional Offsets: <span style={{ color: '#fff' }}>{selectedTimeZone.name}</span>
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Real-time Status */}
      <div style={{ 
        position: 'fixed', bottom: 24, right: 32, 
        display: 'flex', alignItems: 'center', gap: 10, 
        background: 'rgba(10, 10, 15, 0.7)', 
        padding: '8px 16px', borderRadius: 12, 
        border: '1px solid rgba(255,255,255,0.08)', 
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        pointerEvents: 'none'
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} className="pulse-dot" />
        <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {isLoading ? 'SYNCING...' : 'LIVE SECURE LINK'}
        </span>
      </div>
    </div>
  );
}
