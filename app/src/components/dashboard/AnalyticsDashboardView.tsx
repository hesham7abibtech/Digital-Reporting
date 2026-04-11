'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, Sector
} from 'recharts';
import {
  Database, Users, FolderOpen, CloudCog, CalendarClock, TrendingUp,
  TrendingDown, Minus, Lightbulb, AlertTriangle, Crown, Trophy, Zap,
  Search, CircleDot, RefreshCw
} from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import AnimatedCounter from '@/components/shared/AnimatedCounter';
import EliteDropdown from '@/components/dashboard/EliteDropdown';
import type { Task } from '@/lib/types';
import { useTimeZone } from '@/context/TimeZoneContext';

/* ── Color Palette ── */
const CHART_COLORS = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899',
  '#6366f1', '#f43f5e', '#14b8a6', '#a855f7', '#eab308',
  '#3b82f6', '#ef4444', '#84cc16', '#d946ef', '#0ea5e9'
];

const GOLD = '#D4AF37';

/* ── Shared Chart Helpers ── */
function PremiumTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 12, fontSize: 13,
      background: 'rgba(10, 10, 18, 0.95)',
      border: '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      {label && <p style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 4, fontSize: 12 }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill, boxShadow: `0 0 6px ${p.color || p.fill}80` }} />
          <span style={{ color: '#94a3b8', fontSize: 12 }}>{p.name}:</span>
          <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function DonutTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 14, minWidth: 160,
      background: 'rgba(8, 8, 16, 0.97)',
      border: `1px solid ${d.payload.color || CHART_COLORS[0]}40`,
      backdropFilter: 'blur(20px)',
      boxShadow: `0 12px 40px rgba(0,0,0,0.5)`,
      pointerEvents: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.payload.color || CHART_COLORS[0], boxShadow: `0 0 8px ${d.payload.color || CHART_COLORS[0]}80` }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{d.name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: d.payload.color || CHART_COLORS[0] }}>{d.value}</span>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>deliverables</span>
      </div>
      <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 4 }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: d.payload.color || CHART_COLORS[0] }} />
      </div>
      <span style={{ fontSize: 12, color: '#64748b' }}>{pct}% of total</span>
    </div>
  );
}

function renderDonutLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={800} style={{ pointerEvents: 'none' }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

const axisProps = {
  tick: { fill: '#64748b', fontSize: 10 },
  axisLine: false,
  tickLine: false,
};

/* ── Interactive Pie Chart Component ── */
function InteractivePieChart({ data, total, onClick }: { data: any[], total: number, onClick?: (data: any) => void }) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(-1);
  };

  const onLegendEnter = (e: any) => {
    const index = data.findIndex(d => d.name === e.value);
    setActiveIndex(index);
  };

  const onLegendLeave = () => {
    setActiveIndex(-1);
  };

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
      <PieChart>
        <Pie
          {...({ activeIndex } as any)}
          activeShape={(props: any) => {
            return (
              <g>
                <Sector
                  {...props}
                  outerRadius={props.outerRadius + 6}
                  style={{ 
                    filter: `drop-shadow(0 0 12px ${props.fill}80)`,
                    cursor: 'pointer'
                  }}
                />
                {renderDonutLabel(props)}
              </g>
            );
          }}
          data={data}
          cx="38%"
          cy="50%"
          innerRadius={35}
          outerRadius={62}
          paddingAngle={3}
          dataKey="value"
          stroke="none"
          labelLine={false}
          label={renderDonutLabel}
          onMouseEnter={onPieEnter}
          onMouseLeave={onPieLeave}
          onClick={onClick}
          cursor="pointer"
        >
          {data.map((entry, i) => (
            <Cell 
              key={i} 
              fill={entry.color} 
              style={{ 
                filter: activeIndex === i ? `drop-shadow(0 0 12px ${entry.color}80)` : 'none',
                opacity: activeIndex === -1 || activeIndex === i ? 1 : 0.4,
                transition: 'all 0.3s ease'
              }} 
            />
          ))}
        </Pie>
        <Tooltip 
          content={<DonutTooltip total={total} />} 
          trigger="hover"
        />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          onMouseEnter={onLegendEnter}
          onMouseLeave={onLegendLeave}
          formatter={(value: string) => {
            const index = data.findIndex(d => d.name === value);
            const isHovered = activeIndex === index;
            return (
              <span style={{ 
                color: isHovered ? '#fff' : '#cbd5e1', 
                fontSize: 11, 
                fontWeight: isHovered ? 700 : 500,
                transition: 'all 0.2s ease',
                display: 'inline-block',
                transform: isHovered ? 'translateX(4px)' : 'none'
              }}>
                {value}
              </span>
            );
          }}
          iconType="circle"
          iconSize={7}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ── Chart Card Wrapper ── */
function ChartCard({ title, subtitle, children, delay = 0, height = 200 }: {
  title: string; subtitle?: string; children: React.ReactNode; delay?: number; height?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <GlassCard padding="none" hover={false}>
        <div style={{
          padding: '12px 16px 4px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em', margin: 0 }}>{title}</h3>
            {subtitle && <p style={{ fontSize: 10, color: 'var(--text-dim)', margin: '2px 0 0', fontWeight: 500 }}>{subtitle}</p>}
          </div>
        </div>
        <div style={{ 
          width: '100%', 
          height: `${height}px`, 
          minHeight: `${height}px`,
          padding: '2px 8px 10px', 
          position: 'relative', 
          overflow: 'hidden' 
        }}>
          {mounted ? children : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 12 }}>Loading…</div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

/* ── KPI Card with Hover Tooltip ── */
function KPICard({ label, value, icon, color, trend, pctChange, suffix, delay, displayValue, tooltipTitle, tooltipDetails }: {
  label: string; value: number; icon: React.ReactNode; color: string;
  trend: 'up' | 'down' | 'neutral'; pctChange: number; suffix?: string; delay: number;
  displayValue?: string;
  tooltipTitle?: string;
  tooltipDetails?: { label: string; value: string; color?: string }[];
}) {
  const [isHovered, setIsHovered] = useState(false);
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#f43f5e' : '#64748b';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card"
      style={{ padding: '14px 16px', position: 'relative', overflow: 'visible', cursor: 'pointer' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left accent */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: color, borderRadius: '16px 0 0 16px' }} />

      {/* Glow */}
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 80, height: 80,
        background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: `${color}15`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {icon}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: trendColor }}>
          <TrendIcon size={12} />
          <span style={{ fontSize: 11, fontWeight: 600 }}>{pctChange}%</span>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          {displayValue ? (
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{displayValue}</span>
          ) : (
            <AnimatedCounter value={value} className="text-xl font-bold text-[var(--text-primary)]" />
          )}
          {suffix && <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)' }}>{suffix}</span>}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{label}</p>
      </div>

      {/* ── Hover Tooltip ── */}
      <AnimatePresence>
        {isHovered && tooltipDetails && tooltipDetails.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8, x: '-50%', scale: 0.96 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: 6, x: '-50%', scale: 0.97 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              marginTop: 8,
              zIndex: 5000,
              width: 280,
              borderRadius: 14,
              background: 'rgba(12, 12, 20, 0.97)',
              backdropFilter: 'blur(24px)',
              border: `1px solid ${color}30`,
              boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 30px ${color}10`,
              padding: '14px 16px',
            }}
          >
            {/* Arrow */}
            <div style={{
              position: 'absolute', top: -6,
              left: '50%',
              marginLeft: -6, // Center half of 12px width
              width: 12, height: 12, borderRadius: 2, rotate: '45deg',
              background: 'rgba(12, 12, 20, 0.97)',
              borderLeft: `1px solid ${color}30`,
              borderTop: `1px solid ${color}30`,
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: `${color}20`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{tooltipTitle || label}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tooltipDetails.map((d, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 10px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{d.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: d.color || 'var(--text-primary)' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── No Data Placeholder ── */
function NoDataPlaceholder() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-dim)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Database size={18} style={{ opacity: 0.4 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500 }}>No data available</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

interface AnalyticsDashboardViewProps {
  tasks: Task[];
  previousPeriodTasks?: Task[];
  // Filter state for dashboard filter bar
  search?: string;
  setSearch?: (v: string) => void;
  filterDept?: string[];
  setFilterDept?: (v: string[]) => void;
  availableDepts?: string[];
  filterType?: string[];
  setFilterType?: (v: string[]) => void;
  availableTypes?: string[];
  filterCDE?: string[];
  setFilterCDE?: (v: string[]) => void;
  availableCDEs?: string[];
  onTaskClick?: (task: Task) => void;
}

export default function AnalyticsDashboardView({
  tasks,
  previousPeriodTasks = [],
  search = '',
  setSearch,
  filterDept = [],
  setFilterDept,
  availableDepts = [],
  filterType = [],
  setFilterType,
  availableTypes = [],
  filterCDE = [],
  setFilterCDE,
  availableCDEs = [],
  onTaskClick,
}: AnalyticsDashboardViewProps) {
  const { formatDate } = useTimeZone();

  // ─── KPI Computations ────────────────────────────────────────
  const kpiStats = useMemo(() => {
    const totalDeliverables = tasks.length;
    const prevTotal = previousPeriodTasks.length;

    const categoriesSet = new Set(tasks.map(t => t.department));
    const categoriesActive = categoriesSet.size;
    const categoriesList = Array.from(categoriesSet);
    const prevCategories = new Set(previousPeriodTasks.map(t => t.department)).size;

    const submittersSet = new Set(tasks.filter(t => t.submitterName).map(t => t.submitterName));
    const activeSubmitters = submittersSet.size;
    const topSubmitters = (() => {
      const counts: Record<string, number> = {};
      tasks.forEach(t => { if (t.submitterName) counts[t.submitterName] = (counts[t.submitterName] || 0) + 1; });
      return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    })();
    const prevSubmitters = new Set(previousPeriodTasks.filter(t => t.submitterName).map(t => t.submitterName)).size;

    // Most used CDE
    const cdeCounts: Record<string, number> = {};
    tasks.forEach(t => (t.cde || []).forEach(c => { cdeCounts[c] = (cdeCounts[c] || 0) + 1; }));
    const cdeRanked = Object.entries(cdeCounts).sort((a, b) => b[1] - a[1]);
    const mostUsedCDE = cdeRanked[0]?.[0] || '—';

    // Latest submission
    let latestDate = '';
    let latestTask = '';
    tasks.forEach(t => {
      if (t.submittingDate && t.submittingDate > latestDate) {
        latestDate = t.submittingDate;
        latestTask = t.title;
      }
    });

    // Type stats
    const typeCounts: Record<string, number> = {};
    tasks.forEach(t => (t.deliverableType || []).forEach(dt => { typeCounts[dt] = (typeCounts[dt] || 0) + 1; }));
    const typeRanked = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

    // Growth %
    const growthPct = prevTotal > 0 ? Math.round(((totalDeliverables - prevTotal) / prevTotal) * 100) : 0;
    const growthTrend: 'up' | 'down' | 'neutral' = growthPct > 0 ? 'up' : growthPct < 0 ? 'down' : 'neutral';

    const calcPct = (curr: number, prev: number) => prev > 0 ? Math.abs(Math.round(((curr - prev) / prev) * 100)) : 0;
    const calcTrend = (curr: number, prev: number): 'up' | 'down' | 'neutral' => curr > prev ? 'up' : curr < prev ? 'down' : 'neutral';

    return {
      totalDeliverables, prevTotal,
      totalPct: calcPct(totalDeliverables, prevTotal),
      totalTrend: calcTrend(totalDeliverables, prevTotal),
      categoriesActive, categoriesList,
      catPct: calcPct(categoriesActive, prevCategories),
      catTrend: calcTrend(categoriesActive, prevCategories),
      activeSubmitters, topSubmitters,
      subPct: calcPct(activeSubmitters, prevSubmitters),
      subTrend: calcTrend(activeSubmitters, prevSubmitters),
      mostUsedCDE, cdeRanked,
      latestDate, latestTask,
      typeRanked,
      growthPct: Math.abs(growthPct),
      growthTrend,
    };
  }, [tasks, previousPeriodTasks]);

  // ─── Category Bar Chart Data ─────────────────────────────────
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => { counts[t.department] = (counts[t.department] || 0) + 1; });
    return Object.entries(counts)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [tasks]);

  // ─── Submission Timeline Data ────────────────────────────────
  const timelineData = useMemo(() => {
    const monthMap: Record<string, number> = {};
    tasks.forEach(t => {
      const dateStr = t.submittingDate || t.createdAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = (monthMap[key] || 0) + 1;
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => {
        const [y, m] = month.split('-');
        const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return { name: `${mNames[parseInt(m) - 1]} ${y.slice(2)}`, value: count };
      });
  }, [tasks]);

  // ─── Submitter Rankings Data ─────────────────────────────────
  const submitterData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      if (t.submitterName) counts[t.submitterName] = (counts[t.submitterName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [tasks]);

  // ─── Deliverable Types Donut Data ────────────────────────────
  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => (t.deliverableType || []).forEach(dt => { counts[dt] = (counts[dt] || 0) + 1; }));
    return Object.entries(counts)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [tasks]);
  const typeTotal = useMemo(() => typeData.reduce((s, d) => s + d.value, 0), [typeData]);

  // ─── CDE Usage Donut Data ──────────────────────────────────
  const cdeData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => (t.cde || []).forEach(c => { counts[c] = (counts[c] || 0) + 1; }));
    return Object.entries(counts)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[(i + 5) % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [tasks]);
  const cdeTotal = useMemo(() => cdeData.reduce((s, d) => s + d.value, 0), [cdeData]);

  // ─── Auto-Generated Insights ─────────────────────────────────
  const insights = useMemo(() => {
    const result: { icon: React.ReactNode; text: string; color: string; type: 'success' | 'warning' | 'info' }[] = [];

    if (categoryData.length > 0) {
      const top = categoryData[0];
      const pct = tasks.length > 0 ? ((top.value / tasks.length) * 100).toFixed(0) : 0;
      result.push({ icon: <Trophy size={16} />, text: `${top.name} leads with ${pct}% of total deliverables (${top.value} submissions)`, color: '#10b981', type: 'success' });
    }
    if (submitterData.length > 0) {
      const top = submitterData[0];
      result.push({ icon: <Crown size={16} />, text: `Top performer: ${top.name} with ${top.value} submissions`, color: GOLD, type: 'info' });
    }
    if (categoryData.length > 1) {
      const least = categoryData[categoryData.length - 1];
      result.push({ icon: <AlertTriangle size={16} />, text: `${least.name} has the least activity with only ${least.value} deliverable${least.value !== 1 ? 's' : ''} — needs attention`, color: '#f59e0b', type: 'warning' });
    }
    if (cdeData.length > 0) {
      const top = cdeData[0];
      const pct = cdeTotal > 0 ? ((top.value / cdeTotal) * 100).toFixed(0) : 0;
      result.push({ icon: <CloudCog size={16} />, text: `${top.name} is the primary CDE environment, used in ${pct}% of deliverables`, color: '#06b6d4', type: 'info' });
    }
    if (kpiStats.growthTrend === 'up') {
      result.push({ icon: <Zap size={16} />, text: `Deliverables grew ${kpiStats.growthPct}% compared to the previous period`, color: '#10b981', type: 'success' });
    } else if (kpiStats.growthTrend === 'down') {
      result.push({ icon: <TrendingDown size={16} />, text: `Deliverables decreased ${kpiStats.growthPct}% compared to the previous period`, color: '#f43f5e', type: 'warning' });
    }
    return result;
  }, [categoryData, submitterData, cdeData, cdeTotal, tasks.length, kpiStats]);

  // ─── Cross-Filter Handlers ─────────────────────────────────
  const handleCategoryClick = (data: any) => {
    if (data?.name && setFilterDept) setFilterDept([data.name]);
  };
  const handleTypeClick = (data: any) => {
    if (data?.name && setFilterType) setFilterType([data.name]);
  };
  const handleCDEClick = (data: any) => {
    if (data?.name && setFilterCDE) setFilterCDE([data.name]);
  };

  // ─── KPI Tooltip Details ─────────────────────────────────────
  const totalDetails = useMemo(() => {
    const details: { label: string; value: string; color?: string }[] = [
      { label: 'Current Period', value: `${kpiStats.totalDeliverables}`, color: '#f1f5f9' },
      { label: 'Previous Period', value: `${kpiStats.prevTotal}`, color: '#64748b' },
    ];
    if (categoryData.length > 0) {
      details.push({ label: 'Top Category', value: `${categoryData[0].name} (${categoryData[0].value})`, color: categoryData[0].color });
    }
    return details;
  }, [kpiStats, categoryData]);

  const categoryDetails = useMemo(() =>
    kpiStats.categoriesList.slice(0, 5).map(c => {
      const count = categoryData.find(d => d.name === c)?.value || 0;
      return { label: c, value: `${count} deliverables`, color: categoryData.find(d => d.name === c)?.color };
    }), [kpiStats.categoriesList, categoryData]);

  const submitterDetails = useMemo(() =>
    kpiStats.topSubmitters.map(([name, count]) => ({
      label: name, value: `${count} submissions`, color: GOLD
    })), [kpiStats.topSubmitters]);

  const cdeDetails = useMemo(() =>
    kpiStats.cdeRanked.slice(0, 4).map(([name, count]) => ({
      label: name, value: `${count} uses`, color: '#10b981'
    })), [kpiStats.cdeRanked]);

  const latestDetails = useMemo(() => {
    if (!kpiStats.latestDate) return [{ label: 'No submissions', value: '—' }];
    return [
      { label: 'Date', value: formatDate(kpiStats.latestDate), color: GOLD },
      { label: 'Task', value: kpiStats.latestTask.length > 30 ? kpiStats.latestTask.slice(0, 30) + '…' : kpiStats.latestTask },
    ];
  }, [kpiStats, formatDate]);

  const growthDetails = useMemo(() => [
    { label: 'Current', value: `${kpiStats.totalDeliverables}`, color: kpiStats.growthTrend === 'up' ? '#10b981' : kpiStats.growthTrend === 'down' ? '#f43f5e' : '#64748b' },
    { label: 'Previous', value: `${kpiStats.prevTotal}` },
    { label: 'Change', value: `${kpiStats.growthTrend === 'down' ? '-' : '+'}${kpiStats.growthPct}%`, color: kpiStats.growthTrend === 'up' ? '#10b981' : kpiStats.growthTrend === 'down' ? '#f43f5e' : '#64748b' },
  ], [kpiStats]);

  const headerInputStyle: React.CSSProperties = {
    padding: '8px 14px 8px 38px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(212, 175, 55, 0.1)',
    fontSize: 13,
    color: 'white',
    outline: 'none',
    transition: 'all 0.2s ease',
    width: 220,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      {/* ══════════ DASHBOARD FILTER BAR ══════════ */}
      <GlassCard style={{ padding: 0, overflow: 'visible' }}>
        <div style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          position: 'relative',
          zIndex: 100,
          overflow: 'visible',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircleDot size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Analytics Dashboard</h2>
              <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: 0, fontWeight: 500 }}>{tasks.length} deliverables in scope</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginLeft: 'auto' }}>
            {setSearch && (
              <div style={{ position: 'relative', flex: 1, maxWidth: 240 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(212, 175, 55, 0.4)' }} />
                <input
                  type="text"
                  placeholder="Search Deliverables..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={headerInputStyle}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.1)'}
                />
              </div>
            )}

            {setFilterDept && (
              <EliteDropdown
                value={filterDept}
                options={availableDepts.map(d => ({ label: d, value: d }))}
                onChange={setFilterDept}
                menuLabel="Categories"
                isMulti={true}
                allLabel="All Categories"
              />
            )}

            {setFilterType && (
              <EliteDropdown
                value={filterType}
                options={availableTypes.map(t => ({ label: t, value: t }))}
                onChange={setFilterType}
                menuLabel="Deliverable Type"
                isMulti={true}
                allLabel="All Types"
              />
            )}

            {setFilterCDE && (
              <EliteDropdown
                value={filterCDE}
                options={availableCDEs.map(c => ({ label: c, value: c }))}
                onChange={setFilterCDE}
                menuLabel="CDE (Environment)"
                isMulti={true}
                allLabel="All Environments"
              />
            )}

            {(search || 
              (filterDept.length > 0 && !filterDept.includes('All Categories')) || 
              (filterType.length > 0 && !filterType.includes('All Types')) || 
              (filterCDE.length > 0 && !filterCDE.includes('All Environments'))
            ) && (
              <button
                onClick={() => {
                  if (setSearch) setSearch('');
                  if (setFilterDept) setFilterDept([]);
                  if (setFilterType) setFilterType([]);
                  if (setFilterCDE) setFilterCDE([]);
                }}
                style={{
                  padding: '10px 16px', borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                }}
                className="hover:bg-[rgba(239, 68, 68, 0.15)]"
              >
                <RefreshCw size={14} />
                Reset All
              </button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* ══════════ KPI SUMMARY CARDS ══════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
        <KPICard
          label="Total Deliverables"
          value={kpiStats.totalDeliverables}
          icon={<Database size={16} />}
          color="#6366f1"
          trend={kpiStats.totalTrend}
          pctChange={kpiStats.totalPct}
          delay={0.05}
          tooltipTitle="Total Deliverables Breakdown"
          tooltipDetails={totalDetails}
        />
        <KPICard
          label="Categories Active"
          value={kpiStats.categoriesActive}
          icon={<FolderOpen size={16} />}
          color="#8b5cf6"
          trend={kpiStats.catTrend}
          pctChange={kpiStats.catPct}
          delay={0.1}
          tooltipTitle="Active Categories Detail"
          tooltipDetails={categoryDetails}
        />
        <KPICard
          label="Active Submitters"
          value={kpiStats.activeSubmitters}
          icon={<Users size={16} />}
          color="#06b6d4"
          trend={kpiStats.subTrend}
          pctChange={kpiStats.subPct}
          delay={0.15}
          tooltipTitle="Top Submitters"
          tooltipDetails={submitterDetails}
        />
        <KPICard
          label="Most Used CDE"
          value={0}
          displayValue={kpiStats.mostUsedCDE}
          icon={<CloudCog size={16} />}
          color="#10b981"
          trend="neutral"
          pctChange={0}
          delay={0.2}
          tooltipTitle="CDE Usage Breakdown"
          tooltipDetails={cdeDetails}
        />
        <KPICard
          label="Latest Submission"
          value={0}
          displayValue={kpiStats.latestDate ? formatDate(kpiStats.latestDate) : '—'}
          icon={<CalendarClock size={16} />}
          color={GOLD}
          trend="neutral"
          pctChange={0}
          delay={0.25}
          tooltipTitle="Latest Submission Details"
          tooltipDetails={latestDetails}
        />
        <KPICard
          label="Period Growth"
          value={kpiStats.growthPct}
          icon={<TrendingUp size={16} />}
          color={kpiStats.growthTrend === 'up' ? '#10b981' : kpiStats.growthTrend === 'down' ? '#f43f5e' : '#64748b'}
          trend={kpiStats.growthTrend}
          pctChange={kpiStats.growthPct}
          suffix="%"
          delay={0.3}
          tooltipTitle="Growth Analysis"
          tooltipDetails={growthDetails}
        />
      </div>

      {/* ══════════ CHARTS GRID — 3 COLUMN COMPACT ══════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>

        {/* Category Performance Bar Chart */}
        <ChartCard title="Category Performance" subtitle={`${categoryData.length} categories tracked`} delay={0.1} height={200}>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
              <BarChart data={categoryData} barSize={16} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" {...axisProps} interval={0} angle={-25} textAnchor="end" height={45} tick={{ fill: '#64748b', fontSize: 9 }} />
                <YAxis {...axisProps} tick={{ fill: '#64748b', fontSize: 9 }} />
                <Tooltip content={<PremiumTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="value" name="Deliverables" radius={[4, 4, 0, 0]} onClick={handleCategoryClick} cursor="pointer">
                  {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <NoDataPlaceholder />}
        </ChartCard>

        {/* Submission Timeline */}
        <ChartCard title="Submission Timeline" subtitle={`${timelineData.length} months of data`} delay={0.15} height={200}>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
              <AreaChart data={timelineData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={GOLD} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" {...axisProps} tick={{ fill: '#64748b', fontSize: 9 }} />
                <YAxis {...axisProps} tick={{ fill: '#64748b', fontSize: 9 }} />
                <Tooltip content={<PremiumTooltip />} />
                <Area type="monotone" dataKey="value" stroke={GOLD} fill="url(#timelineGrad)" strokeWidth={2} name="Submissions"
                  dot={{ fill: GOLD, r: 3, stroke: 'rgba(10,10,15,0.8)', strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: GOLD, stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : <NoDataPlaceholder />}
        </ChartCard>

        {/* Top Submitters */}
        <ChartCard title="Top Submitters" subtitle={`${submitterData.length} active contributors`} delay={0.2} height={200}>
          {submitterData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
              <BarChart data={submitterData} layout="vertical" barSize={12} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                <XAxis type="number" {...axisProps} tick={{ fill: '#64748b', fontSize: 9 }} />
                <YAxis type="category" dataKey="name" {...axisProps} width={80} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <Tooltip content={<PremiumTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="value" name="Submissions" radius={[0, 4, 4, 0]}>
                  {submitterData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <NoDataPlaceholder />}
        </ChartCard>
      </div>

      {/* ══════════ BOTTOM ROW — DONUTS + INSIGHTS ══════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

        {/* Deliverable Types Donut */}
        <ChartCard title="Deliverable Types" subtitle={`${typeData.length} types identified`} delay={0.25} height={190}>
          {typeData.length > 0 ? (
            <InteractivePieChart
              data={typeData}
              total={typeTotal}
              onClick={handleTypeClick}
            />
          ) : <NoDataPlaceholder />}
        </ChartCard>

        {/* CDE Usage Donut */}
        <ChartCard title="CDE Environment Usage" subtitle={`${cdeData.length} environments in use`} delay={0.3} height={190}>
          {cdeData.length > 0 ? (
            <InteractivePieChart
              data={cdeData}
              total={cdeTotal}
              onClick={handleCDEClick}
            />
          ) : <NoDataPlaceholder />}
        </ChartCard>

        {/* Smart Insights */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <GlassCard padding="none" hover={false} style={{ height: '100%' }}>
              <div style={{
                padding: '12px 16px 4px',
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7,
                  background: 'rgba(245, 158, 11, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#f59e0b'
                }}>
                  <Lightbulb size={14} />
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Smart Insights</h3>
              </div>
              <div style={{ padding: '8px 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {insights.map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '8px 12px', borderRadius: 10,
                      background: `${insight.color}08`,
                      border: `1px solid ${insight.color}15`,
                    }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                      background: `${insight.color}15`, color: insight.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1
                    }}>
                      {insight.icon}
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.7)', lineHeight: 1.45, margin: 0 }}>
                      {insight.text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
