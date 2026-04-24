'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, CheckCircle2, AlertTriangle, Users, FolderOpen,
  TrendingUp, TrendingDown, Minus, ShieldCheck, Inbox, Zap, Info
} from 'lucide-react';
import AnimatedCounter from '@/components/shared/AnimatedCounter';
import MiniChart from '@/components/shared/MiniChart';
import { tasks } from '@/lib/data';
import type { Task } from '@/lib/types';

// 5 High-Fidelity KPIs for Execution Phase
const kpiData = [
  { id: 'kpi1', label: 'Global Registry', value: 0, prev: 0, icon: <BarChart3 size={18} />, color: 'var(--aqua)', trend: 'neutral' as 'up' | 'down' | 'neutral', spark: [], hoverable: false },
  { id: 'kpi2', label: 'Collaboration Sync', value: 0, prev: 0, icon: <Users size={18} />, color: 'var(--haze)', trend: 'neutral' as 'up' | 'down' | 'neutral', spark: [], hoverable: true },
  { id: 'kpi3', label: 'Category Reach', value: 0, prev: 0, icon: <FolderOpen size={18} />, color: 'var(--sunlit-rock)', trend: 'neutral' as 'up' | 'down' | 'neutral', spark: [], hoverable: true },
  { id: 'kpi4', label: 'Data Density', value: 0, prev: 0, icon: <Zap size={18} />, color: '#B0B540', trend: 'neutral' as 'up' | 'down' | 'neutral', spark: [], hoverable: true },
  { id: 'kpi5', label: 'Verified Records', value: 0, prev: 0, icon: <ShieldCheck size={18} />, color: '#10b981', trend: 'neutral' as 'up' | 'down' | 'neutral', spark: [], hoverable: true },
];

// Map KPI labels to task filter functions
function getRelatedTasks(label: string, taskList: Task[]) {
  switch (label) {
    case 'Collaboration Sync': return taskList.filter((t: Task) => t.links && t.links.length > 0);
    case 'Category Reach': return taskList.filter((t: Task) => t.department);
    case 'Data Density': return taskList.filter((t: Task) => t.files && t.files.length > 0);
    case 'Verified Records': return taskList.filter((t: Task) => t.id);
    default: return [];
  }
}


function getStatusColor(s?: string) {
  if (!s) return 'rgba(255, 255, 255, 0.4)';
  switch (s) {
    case 'DELAYED': return '#FF4C4F';
    case 'BLOCKED': return '#FF4C4F';
    case 'PENDING_REVIEW': return '#FF7908';
    case 'IN_PROGRESS': return 'rgb(198, 224, 224)';
    case 'COMPLETED': return '#B0B540';
    default: return 'rgba(255, 255, 255, 0.4)';
  }
}

export default function KPICards({ tasks: externalTasks, prevTasks = [], onTaskClick }: { tasks?: Task[]; prevTasks?: Task[]; onTaskClick?: (task: Task) => void }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Use external tasks if provided, otherwise fallback to mock
  const dataToUse = externalTasks || tasks;

  // Dynamic values based on tasks data
  const dynamicKpiData = useMemo(() => {
    return kpiData.map(kpi => {
      let value = 0;
      let prevValue = 0;

      switch (kpi.label) {
        case 'Global Registry':
          value = dataToUse.length;
          prevValue = prevTasks.length;
          break;
        case 'Collaboration Sync':
          value = new Set(dataToUse.map(t => t.submitterEmail).filter(Boolean)).size;
          prevValue = new Set(prevTasks.map(t => t.submitterEmail).filter(Boolean)).size;
          break;
        case 'Category Reach':
          value = new Set(dataToUse.map(t => t.department)).size;
          prevValue = new Set(prevTasks.map(t => t.department)).size;
          break;
        case 'Data Density':
          value = dataToUse.filter(t => (t.links?.length || 0) > 0).length;
          prevValue = prevTasks.filter(t => (t.links?.length || 0) > 0).length;
          break;
        case 'Verified Records':
          value = dataToUse.filter(t => t.id).length;
          prevValue = prevTasks.filter(t => t.id).length;
          break;
      }

      const trend = value > prevValue ? 'up' : value < prevValue ? 'down' : 'neutral';
      return { ...kpi, value, prev: prevValue, trend };
    });
  }, [dataToUse, prevTasks]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
      {dynamicKpiData.map((kpi, i) => {
        const pctChange = kpi.prev > 0 ? Math.abs(Math.round(((kpi.value - kpi.prev) / kpi.prev) * 100)) : 0;
        const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
        const isBadMetric = (kpi as any).isBadMetric || false;
        const trendColor = isBadMetric
          ? (kpi.trend === 'up' ? '#f43f5e' : kpi.trend === 'down' ? '#10b981' : '#94a3b8')
          : (kpi.trend === 'up' ? '#10b981' : kpi.trend === 'down' ? '#f43f5e' : '#94a3b8');

        const relatedTasks = kpi.hoverable ? getRelatedTasks(kpi.label, dataToUse) : [];
        const isHovered = hoveredId === kpi.id;

        return (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.05, duration: 0.4 }}
            className="glass-card"
            style={{ padding: '16px 20px', position: 'relative', overflow: 'visible', cursor: kpi.hoverable ? 'pointer' : 'default', border: '1px solid rgba(0, 63, 73, 0.15)', background: 'rgba(255, 255, 255, 0.4)' }}
            onMouseEnter={() => kpi.hoverable && setHoveredId(kpi.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Left accent */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: kpi.color, borderRadius: '4px 0 0 4px' }} />

            {/* Top row: Icon + Trend */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${kpi.color}15`, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {kpi.icon}
              </div>
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: 3, 
                color: trendColor,
                visibility: kpi.label === 'Tasks Count' ? 'hidden' : 'visible'
              }}>
                <TrendIcon size={14} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{pctChange}%</span>
              </div>
            </div>

            {/* Bottom row: Value+Label left, Sparkline right */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <AnimatedCounter value={kpi.value} className="text-2xl font-black text-[#003f49]" />
                {(kpi as any).isPercent && <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--teal)' }}>%</span>}
                <div 
                  style={{ 
                    width: 6, height: 6, borderRadius: '50%', background: 'var(--sunlit-rock)', 
                    boxShadow: '0 0 10px rgba(197, 160, 89, 0.4)', 
                    display: kpi.value > 0 ? 'block' : 'none',
                    marginLeft: 4
                  }} 
                  className="pulse-dot" 
                />
              </div>
              <p style={{ fontSize: 11, color: '#003f49', marginTop: 3, marginBottom: 0, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{kpi.label}</p>
              </div>
              <MiniChart data={kpi.spark} color={kpi.color} width={80} height={32} />
            </div>

            {/* Hover Tooltip — premium floating card */}
            <AnimatePresence>
              {isHovered && (                <motion.div
                  initial={{ opacity: 0, y: 8, x: '-50%', scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
                  exit={{ opacity: 0, y: 6, x: '-50%', scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    right: 'auto',
                    marginTop: 12,
                    zIndex: 5000,
                    width: 340,
                    borderRadius: 16,
                    background: '#ffffff',
                    border: `1.5px solid ${kpi.color}`,
                    boxShadow: '0 15px 35px rgba(0, 63, 73, 0.08)',
                    padding: '16px',
                  }}
                >
                  {/* Arrow */}
                  <div style={{
                    position: 'absolute', top: -7, 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    width: 14, height: 14, borderRadius: 2, rotate: '45deg',
                    background: '#ffffff',
                    borderLeft: `1.5px solid ${kpi.color}`,
                    borderTop: `1.5px solid ${kpi.color}`,
                  }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${kpi.color}15`, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {kpi.icon}
                    </div>
                    <div>
                      <span className="brand-heading" style={{ fontSize: 13, color: '#003f49', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label} Breakdown</span>
                      <span style={{ fontSize: 11, color: 'rgba(0, 63, 73, 0.5)', marginLeft: 6, fontWeight: 800 }}>({relatedTasks.length})</span>
                    </div>
                  </div>

                  {relatedTasks.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {relatedTasks.slice(0, 5).map(task => (
                        <div
                          key={task.id}
                          onClick={() => onTaskClick?.(task)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 12px', borderRadius: 10,
                            background: 'rgba(0, 63, 73, 0.02)',
                            border: '1px solid rgba(0, 63, 73, 0.05)',
                            cursor: 'pointer',
                            transition: 'all 200ms',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 63, 73, 0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 63, 73, 0.02)'}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontSize: 12, fontWeight: 950, color: 'rgba(0, 63, 73, 0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                              {task.title}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <span style={{ fontSize: 10, color: 'rgba(0, 63, 73, 0.4)', fontWeight: 800 }}>{task.department}</span>
                            </div>
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap',
                            color: getStatusColor(task.status), background: `${getStatusColor(task.status)}15`,
                            marginLeft: 8,
                            textTransform: 'uppercase'
                          }}>
                            {task.status?.replace(/_/g, ' ') || 'UNTRACKED'}
                          </span>
                        </div>
                      ))}
                      {relatedTasks.length > 5 && (
                        <p style={{ fontSize: 11, color: 'rgba(0, 63, 73, 0.4)', textAlign: 'center', marginTop: 2, fontWeight: 700 }}>
                          +{relatedTasks.length - 5} MORE RECORDS
                        </p>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '20px 0', textAlign: 'center' }}>
                      <Inbox size={24} style={{ color: kpi.color, margin: '0 auto 10px', opacity: 0.5 }} />
                      <p style={{ fontSize: 13, fontWeight: 950, color: '#003f49', marginBottom: 2 }}>NO CURRENT DATA</p>
                      <p style={{ fontSize: 11, color: 'rgba(0, 63, 73, 0.4)', fontWeight: 700 }}>Waiting for system activity</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
