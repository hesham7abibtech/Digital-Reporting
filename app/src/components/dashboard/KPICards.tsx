'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, CheckCircle2, AlertTriangle,
  TrendingUp, TrendingDown, Minus, ShieldCheck, Inbox, Zap, Info
} from 'lucide-react';
import AnimatedCounter from '@/components/shared/AnimatedCounter';
import MiniChart from '@/components/shared/MiniChart';
import { tasks } from '@/lib/data';
import type { Task } from '@/lib/types';

// 5 High-Fidelity KPIs for Execution Phase
const kpiData = [
  { id: 'kpi1', label: 'Global Registry', value: 0, prev: 0, icon: <BarChart3 size={18} />, color: '#6366f1', trend: 'neutral' as 'up' | 'down' | 'neutral', spark: [], hoverable: false },
  { id: 'kpi2', label: 'Execution Velocity', value: 0, prev: 0, icon: <Zap size={18} />, color: '#10b981', trend: 'neutral' as 'up' | 'down' | 'neutral', spark: [], hoverable: false, isPercent: true },
  { id: 'kpi3', label: 'Critical Blockers', value: 0, prev: 0, icon: <AlertTriangle size={18} />, color: '#f43f5e', trend: 'neutral' as 'up' | 'down' | 'neutral', spark: [], hoverable: true, isBadMetric: true },
  { id: 'kpi4', label: 'Operational Risks', value: 0, prev: 0, icon: <AlertTriangle size={18} />, color: '#f59e0b', trend: 'neutral' as 'up' | 'down' | 'neutral', spark: [], hoverable: true, isBadMetric: true },
  { id: 'kpi5', label: 'Success Milestone', value: 0, prev: 0, icon: <CheckCircle2 size={18} />, color: '#06b6d4', trend: 'neutral' as 'up' | 'down' | 'neutral', spark: [], hoverable: true },
];

// Map KPI labels to task filter functions
function getRelatedTasks(label: string, taskList: Task[]) {
  switch (label) {
    case 'Critical Blockers': return taskList.filter((t: Task) => t.status === 'BLOCKED');
    case 'Operational Risks': return taskList.filter((t: Task) => t.status === 'DELAYED');
    case 'Success Milestone': return taskList.filter((t: Task) => t.status === 'COMPLETED');
    default: return [];
  }
}


function getStatusColor(s: string) {
  switch (s) {
    case 'DELAYED': return '#ef4444';
    case 'BLOCKED': return '#ef4444';
    case 'PENDING_REVIEW': return '#f59e0b';
    case 'IN_PROGRESS': return '#D4AF37';
    default: return '#94a3b8';
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
        case 'Execution Velocity':
          value = dataToUse.length > 0 
            ? Math.round((dataToUse.filter(t => t.status === 'COMPLETED').length / dataToUse.length) * 100) 
            : 0;
          prevValue = prevTasks.length > 0 
            ? Math.round((prevTasks.filter(t => t.status === 'COMPLETED').length / prevTasks.length) * 100) 
            : 0;
          break;
        case 'Critical Blockers':
          value = dataToUse.filter(t => t.status === 'BLOCKED').length;
          prevValue = prevTasks.filter(t => t.status === 'BLOCKED').length;
          break;
        case 'Operational Risks':
          value = dataToUse.filter(t => t.status === 'DELAYED').length;
          prevValue = prevTasks.filter(t => t.status === 'DELAYED').length;
          break;
        case 'Success Milestone':
          value = dataToUse.filter(t => t.status === 'COMPLETED').length;
          prevValue = prevTasks.filter(t => t.status === 'COMPLETED').length;
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
            style={{ padding: '14px 16px', position: 'relative', overflow: 'visible', cursor: kpi.hoverable ? 'pointer' : 'default' }}
            onMouseEnter={() => kpi.hoverable && setHoveredId(kpi.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Left accent */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: kpi.color, borderRadius: '12px 0 0 12px' }} />

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
                <AnimatedCounter value={kpi.value} className="text-2xl font-bold text-[var(--text-primary)]" />
                {(kpi as any).isPercent && <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dim)' }}>%</span>}
                <div 
                  style={{ 
                    width: 6, height: 6, borderRadius: '50%', background: '#10b981', 
                    boxShadow: '0 0 10px rgba(16,185,129,0.6)', 
                    display: kpi.value > 0 ? 'block' : 'none',
                    marginLeft: 4
                  }} 
                  className="pulse-dot" 
                />
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, marginBottom: 0 }}>{kpi.label}</p>
              </div>
              <MiniChart data={kpi.spark} color={kpi.color} width={80} height={32} />
            </div>

            {/* Hover Tooltip — premium floating card */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 8, x: '-50%', scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
                  exit={{ opacity: 0, y: 6, x: '-50%', scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    right: 'auto',
                    marginTop: 8,
                    zIndex: 5000,
                    width: 340,
                    borderRadius: 14,
                    background: 'rgba(12, 12, 20, 0.96)',
                    backdropFilter: 'blur(24px)',
                    border: `1px solid ${kpi.color}30`,
                    boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 30px ${kpi.color}15`,
                    padding: '14px 16px',
                  }}
                >
                  {/* Arrow */}
                  <div style={{
                    position: 'absolute', top: -6, 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    width: 12, height: 12, borderRadius: 2, rotate: '45deg',
                    background: 'rgba(12, 12, 20, 0.96)',
                    borderLeft: `1px solid ${kpi.color}30`,
                    borderTop: `1px solid ${kpi.color}30`,
                  }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${kpi.color}20`, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {kpi.icon}
                    </div>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{kpi.label} Tasks</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>({relatedTasks.length})</span>
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
                            padding: '8px 10px', borderRadius: 8,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.04)',
                            cursor: 'pointer',
                            transition: 'background 200ms',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {task.title}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{task.department}</span>
                            </div>
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap',
                            color: getStatusColor(task.status), background: `${getStatusColor(task.status)}15`,
                            marginLeft: 8,
                          }}>
                            {task.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))}
                      {relatedTasks.length > 5 && (
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 2 }}>
                          +{relatedTasks.length - 5} more
                        </p>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '20px 0', textAlign: 'center' }}>
                      <Inbox size={24} style={{ color: kpi.color, margin: '0 auto 10px', opacity: 0.5 }} />
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 2 }}>No current data</p>
                      <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>Waiting for system activity</p>
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
