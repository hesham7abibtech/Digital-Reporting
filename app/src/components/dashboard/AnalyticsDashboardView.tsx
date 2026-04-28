'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, Sector
} from 'recharts';
import {
  Database, Users, FolderOpen, CloudCog, CalendarClock, TrendingUp,
  TrendingDown, Lightbulb, AlertTriangle, Crown, Trophy, Zap,
  Search, CircleDot, RefreshCw
} from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import AnimatedCounter from '@/components/shared/AnimatedCounter';
import EliteDropdown from '@/components/dashboard/EliteDropdown';
import type { Task } from '@/lib/types';
import { useTimeZone } from '@/context/TimeZoneContext';

/* ── Color Palette (Strictly Brand Aligned) ── */
const CHART_COLORS = [
  '#003f49', /* Corporate Teal */
  '#C5A059', /* Sunlit Rock Gold */
  '#70ADC4', /* Mid Blue */
  '#003f49', /* Dark Teal */
  '#FF7908', /* Dark Orange */
  '#984495', /* Dark Purple */
  '#FF4C4F'  /* Dark Pink */
];

const ACCENT = '#C5A059'; /* Sunlit Rock */
const PRIMARY_TEAL = '#003F49';

/* ── Shared Chart Helpers ── */
function PremiumTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 12, fontSize: 13,
      background: '#ffffff',
      border: '1.5px solid rgba(0, 63, 73, 0.2)',
      boxShadow: '0 15px 35px rgba(0, 63, 73, 0.08)',
      zIndex: 10000
    }}>
      {label && <p style={{ fontWeight: 950, color: '#003f49', marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '2px', background: p.color || p.fill, boxShadow: `0 0 8px ${p.color || p.fill}40` }} />
          <span style={{ color: 'rgba(0, 63, 73, 0.6)', fontSize: 12, fontWeight: 700 }}>{p.name}:</span>
          <span style={{ color: p.color || p.fill, fontWeight: 950, fontSize: 13 }}>{p.value}</span>
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
      padding: '14px 18px', borderRadius: 14, minWidth: 180,
      background: '#ffffff',
      border: `1.5px solid ${d.payload.color || CHART_COLORS[0]}`,
      boxShadow: '0 15px 35px rgba(0, 63, 73, 0.08)',
      pointerEvents: 'none',
      zIndex: 10000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: '2px', background: d.payload.color || CHART_COLORS[0], boxShadow: `0 0 8px ${d.payload.color || CHART_COLORS[0]}40` }} />
        <span style={{ fontSize: 12, fontWeight: 950, color: '#003f49', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 24, fontWeight: 950, color: '#003f49' }}>{d.value}</span>
        <span style={{ fontSize: 11, color: 'rgba(0, 63, 73, 0.5)', fontWeight: 800 }}>DELIVERABLES</span>
      </div>
      <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(0, 63, 73, 0.05)', overflow: 'hidden', marginBottom: 6 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: d.payload.color || CHART_COLORS[0] }} />
      </div>
      <span style={{ fontSize: 11, color: 'rgba(0, 63, 73, 0.4)', fontWeight: 700 }}>{pct}% OF TOTAL</span>
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
    <text x={x} y={y} fill="var(--text-on-primary)" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={800} style={{ pointerEvents: 'none' }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

const axisProps = {
  tick: { fill: '#003f49', fontSize: 13, fontWeight: 950 },
  axisLine: { stroke: '#003f49', strokeWidth: 2.5, opacity: 0.3 },
  tickLine: { stroke: '#003f49', strokeWidth: 2, opacity: 0.2 },
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
                color: '#003f49', 
                fontSize: 12, 
                fontWeight: isHovered ? 950 : 800,
                transition: 'all 0.2s ease',
                display: 'inline-block',
                transform: isHovered ? 'translateX(4px)' : 'none',
                opacity: isHovered ? 1 : 0.8
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
interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
  height?: number | string;
  titleColor?: string;
}

function ChartCard({ title, subtitle, children, delay = 0, height = 200, titleColor = PRIMARY_TEAL }: ChartCardProps) {
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
            <h3 className="brand-heading" style={{ fontSize: 13, color: titleColor, margin: 0, fontWeight: 950, letterSpacing: '0.08em' }}>{title}</h3>
            {subtitle && <p style={{ fontSize: 10, color: 'rgba(0, 63, 73, 0.8)', margin: '4px 0 0', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{subtitle}</p>}
          </div>
        </div>
        <div style={{ 
          width: '100%', 
          height: typeof height === 'number' ? `${height}px` : height,
          minHeight: typeof height === 'number' ? `${height}px` : height,
          padding: '2px 8px 10px', 
          position: 'relative', 
          overflow: 'hidden' 
        }}>
          {mounted ? children : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#003f49', fontSize: 12, fontWeight: 800 }}>Loading Registry Data…</div>
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card"
      style={{ 
        padding: '12px 14px', 
        position: 'relative', 
        overflow: 'visible', 
        cursor: 'pointer',
        zIndex: isHovered ? 10001 : 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 85
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left accent */}
      <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: color, borderRadius: '0 4px 4px 0' }} />

      {/* Glow */}
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 80, height: 80,
        background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: `${color}15`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {icon}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          {displayValue ? (
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{displayValue}</span>
          ) : (
            <AnimatedCounter value={value} className="text-lg font-black text-[#003f49]" />
          )}
          {suffix && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)' }}>{suffix}</span>}
        </div>
      </div>
      <div style={{ marginTop: 'auto' }}>
        <p style={{ 
          fontSize: 11, 
          color: '#003f49', 
          margin: 0, 
          fontWeight: 950, 
          textTransform: 'uppercase', 
          letterSpacing: '0.06em',
          lineHeight: 1.2
        }}>
          {label}
        </p>
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
              top: 'calc(100% + 8px)',
              left: '50%',
              zIndex: 9999,
              width: 280,
              borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(32px)',
              border: `1.5px solid ${color}`,
              boxShadow: `0 20px 50px rgba(0,0,0,0.1), 0 0 30px ${color}15`,
              padding: '16px 20px',
            }}
          >
            {/* Arrow */}
            <div style={{
              position: 'absolute', top: -6,
              left: '50%',
              marginLeft: -6, // Center half of 12px width
              width: 12, height: 12, borderRadius: 2, rotate: '45deg',
              background: 'rgba(255, 255, 255, 0.98)',
              borderLeft: `1.5px solid ${color}`,
              borderTop: `1.5px solid ${color}`,
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: `${color}20`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
              </div>
              <span style={{ fontSize: 14, fontWeight: 950, color: '#003f49', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{tooltipTitle || label}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tooltipDetails.map((d, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 10,
                  background: 'rgba(0, 63, 73, 0.03)',
                  border: '1px solid rgba(0, 63, 73, 0.08)',
                }}>
                  <span style={{ fontSize: 12, color: 'rgba(0, 63, 73, 0.6)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 950, color: d.color || '#003f49' }}>{d.value}</span>
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
  filterPrecinct?: string[];
  setFilterPrecinct?: (v: string[]) => void;
  availablePrecincts?: string[];
  onTaskClick?: (task: Task) => void;
  departments?: any[];
  members?: any[];
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
  filterPrecinct = [],
  setFilterPrecinct,
  availablePrecincts = [],
  onTaskClick,
  departments = [],
  members = []
}: AnalyticsDashboardViewProps) {
  const { formatDate } = useTimeZone();
  const topChartContentHeight = 'clamp(140px, calc((100vh - 360px) / 2), 220px)';
  const bottomChartContentHeight = 'clamp(140px, calc((100vh - 360px) / 2), 220px)';
  const insightCardHeight = `calc(${bottomChartContentHeight} + 46px)`;

  // ─── KPI Computations ────────────────────────────────────────
  const kpiStats = useMemo(() => {
    const totalDeliverables = tasks.length;
    const prevTotal = previousPeriodTasks.length;

    const getResolvedDept = (raw: string) => {
      const d = (departments || []).find(dept => dept.id === raw || dept.name === raw);
      return d ? d.name : (raw || 'General');
    };

    const getResolvedSubmitter = (name: string, email?: string) => {
      const m = (members || []).find(mem => 
        (email && mem.email.toLowerCase() === email.toLowerCase()) || 
        (name && mem.name.toLowerCase() === name.toLowerCase())
      );
      return m ? m.name : (name || 'Unassigned');
    };

    const categoriesSet = new Set(tasks.map(t => getResolvedDept(t.department || '')));
    const categoriesActive = categoriesSet.size;
    const categoriesList = Array.from(categoriesSet);
    const prevCategories = new Set(previousPeriodTasks.map(t => getResolvedDept(t.department))).size;

    const submittersSet = new Set(tasks.map(t => getResolvedSubmitter(t.submitterName || '', t.submitterEmail)));
    const activeSubmitters = submittersSet.size;
    const topSubmitters = (() => {
      const counts: Record<string, number> = {};
      tasks.forEach(t => { 
        const name = getResolvedSubmitter(t.submitterName || '', t.submitterEmail);
        counts[name] = (counts[name] || 0) + 1; 
      });
      return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    })();
    const prevSubmitters = new Set(previousPeriodTasks.map(t => getResolvedSubmitter(t.submitterName || '', t.submitterEmail))).size;

    // Most used CDE
    const cdeCounts: Record<string, number> = {};
    tasks.forEach(t => (t.vectors || []).forEach(v => { cdeCounts[v.cde] = (cdeCounts[v.cde] || 0) + 1; }));
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
    const getResolvedDept = (raw: string) => {
      const d = (departments || []).find(dept => dept.id === raw || dept.name === raw);
      return d ? d.name : (raw || 'General');
    };

    tasks.forEach(t => { 
      const name = getResolvedDept(t.department);
      counts[name] = (counts[name] || 0) + 1; 
    });
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
    const getResolvedSubmitter = (name: string, email?: string) => {
      const m = (members || []).find(mem => 
        (email && mem.email.toLowerCase() === email.toLowerCase()) || 
        (name && mem.name.toLowerCase() === name.toLowerCase())
      );
      return m ? m.name : (name || 'Unassigned');
    };

    tasks.forEach(t => {
      const name = getResolvedSubmitter(t.submitterName || '', t.submitterEmail);
      counts[name] = (counts[name] || 0) + 1;
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
      result.push({ icon: <Trophy size={16} />, text: `${top.name || 'Unknown'} leads with ${pct}% of total deliverables (${top.value} submissions)`, color: '#003f49', type: 'success' });
    }
    if (submitterData.length > 0) {
      const top = submitterData[0];
      result.push({ icon: <Crown size={16} />, text: `Top performer: ${top.name} with ${top.value} submissions`, color: '#C5A059', type: 'info' });
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
      result.push({ icon: <Zap size={16} />, text: `Deliverables grew ${kpiStats.growthPct}% compared to the previous period`, color: '#003f49', type: 'success' });
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
      return { label: String(c), value: `${count} deliverables`, color: categoryData.find(d => d.name === c)?.color };
    }), [kpiStats.categoriesList, categoryData]);

  const submitterDetails = useMemo(() =>
    kpiStats.topSubmitters.map(([name, count]) => ({
      label: name, value: `${count} submissions`, color: '#C5A059'
    })), [kpiStats.topSubmitters]);

  const cdeDetails = useMemo(() =>
    kpiStats.cdeRanked.slice(0, 4).map(([name, count]) => ({
      label: name, value: `${count} uses`, color: '#10b981'
    })), [kpiStats.cdeRanked]);

  const latestDetails = useMemo(() => {
    if (!kpiStats.latestDate) return [{ label: 'No submissions', value: '—' }];
    return [
      { label: 'Date', value: formatDate(kpiStats.latestDate), color: '#C5A059' },
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
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    fontSize: 13,
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'all 0.2s ease',
    width: 220,
  };

  return (
    <motion.div
      id="analytics-dashboard-export-root"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      {/* ══════════ DASHBOARD FILTER BAR ══════════ */}
        <div style={{
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          position: 'relative',
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(0, 63, 73, 0.12)',
          borderRadius: 20,
          boxShadow: '0 4px 20px rgba(0, 63, 73, 0.05)',
          marginBottom: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(208, 171, 130, 0.1)', color: '#d0ab82', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircleDot size={18} />
            </div>
            <div>
              <h2 className="brand-heading" style={{ fontSize: 16, color: '#003f49', margin: 0, fontWeight: 900 }}>Analytics Command Center</h2>
              <p style={{ fontSize: 11, color: 'rgba(0, 63, 73, 0.7)', margin: 0, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tasks.length} deliverables in scope</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginLeft: 'auto', flex: 1, justifyContent: 'flex-end' }}>
            {setSearch && (
              <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#003f49' }} />
                <input
                  type="text"
                  placeholder="Search Deliverables..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    padding: '10px 14px 10px 38px', borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(0, 63, 73, 0.2)',
                    color: '#003f49',
                    fontWeight: 600,
                    fontSize: 13,
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    width: '100%',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#003f49';
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 63, 73, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 63, 73, 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
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

            {setFilterPrecinct && (
              <EliteDropdown
                value={filterPrecinct}
                options={availablePrecincts.map(p => ({ label: p, value: p }))}
                onChange={setFilterPrecinct}
                menuLabel="Precinct"
                isMulti={true}
                allLabel="All Precincts"
              />
            )}

            {(search || 
              (filterDept.length > 0 && !filterDept.includes('All Categories')) || 
              (filterType.length > 0 && !filterType.includes('All Types')) || 
              (filterCDE.length > 0 && !filterCDE.includes('All Environments')) ||
              (filterPrecinct.length > 0 && !filterPrecinct.includes('All Precincts'))
            ) && (
              <button
                onClick={() => {
                  if (setSearch) setSearch('');
                  if (setFilterDept) setFilterDept([]);
                  if (setFilterType) setFilterType([]);
                  if (setFilterCDE) setFilterCDE([]);
                  if (setFilterPrecinct) setFilterPrecinct([]);
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

      {/* ══════════ KPI SUMMARY CARDS ══════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
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
          color="#C5A059"
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
      <div id="analytics-chart-grid">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>

        {/* Category Performance Bar Chart */}
        <ChartCard title="Category Performance" subtitle={`${categoryData.length} categories tracked`} delay={0.1} height={topChartContentHeight} titleColor="#C5A059">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
              <BarChart data={categoryData} barSize={16} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(198, 224, 224, 0.12)" />
                <XAxis dataKey="name" tick={{ fill: '#003f49', fontSize: 13, fontWeight: 950 }} axisLine={{ stroke: '#003f49', strokeWidth: 2.5, opacity: 0.3 }} tickLine={{ stroke: '#003f49', strokeWidth: 2, opacity: 0.2 }} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#003f49', fontSize: 13, fontWeight: 950 }} axisLine={{ stroke: '#003f49', strokeWidth: 2.5, opacity: 0.3 }} tickLine={{ stroke: '#003f49', strokeWidth: 2, opacity: 0.2 }} />
                <Tooltip content={<PremiumTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="value" name="Deliverables" radius={[4, 4, 0, 0]} onClick={handleCategoryClick} cursor="pointer" label={{ position: 'top', fill: '#d0ab82', fontSize: 11, fontWeight: 950 }}>
                  {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <NoDataPlaceholder />}
        </ChartCard>

        {/* Submission Timeline */}
        <ChartCard title="Submission Timeline" subtitle={`${timelineData.length} months of data`} delay={0.15} height={topChartContentHeight} titleColor="#C5A059">
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
              <AreaChart data={timelineData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C5A059" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#C5A059" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(198, 224, 224, 0.12)" />
                <XAxis dataKey="name" tick={{ fill: '#003f49', fontSize: 13, fontWeight: 950 }} axisLine={{ stroke: '#003f49', strokeWidth: 2.5, opacity: 0.3 }} tickLine={{ stroke: '#003f49', strokeWidth: 2, opacity: 0.2 }} />
                <YAxis tick={{ fill: '#003f49', fontSize: 13, fontWeight: 950 }} axisLine={{ stroke: '#003f49', strokeWidth: 2.5, opacity: 0.3 }} tickLine={{ stroke: '#003f49', strokeWidth: 2, opacity: 0.2 }} />
                <Tooltip content={<PremiumTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#C5A059" fill="url(#timelineGrad)" strokeWidth={2} name="Submissions"
                  dot={{ fill: '#C5A059', r: 3, stroke: 'rgba(10,10,15,0.8)', strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: '#C5A059', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : <NoDataPlaceholder />}
        </ChartCard>

        {/* Top Submitters */}
        <ChartCard title="Top Submitters" subtitle={`${submitterData.length} active contributors`} delay={0.2} height={topChartContentHeight} titleColor="#C5A059">
          {submitterData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
              <BarChart data={submitterData} layout="vertical" barSize={12} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(198, 224, 224, 0.12)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#003f49', fontSize: 11, fontWeight: 950 }} axisLine={{ stroke: '#003f49', strokeWidth: 2.5, opacity: 0.3 }} tickLine={{ stroke: '#003f49', strokeWidth: 2, opacity: 0.2 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#003f49', fontSize: 11, fontWeight: 950 }} axisLine={{ stroke: '#003f49', strokeWidth: 2.5, opacity: 0.3 }} tickLine={{ stroke: '#003f49', strokeWidth: 2, opacity: 0.2 }} width={80} />
                <Tooltip content={<PremiumTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="value" name="Submissions" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#d0ab82', fontSize: 11, fontWeight: 950, offset: 10 }}>
                  {submitterData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <NoDataPlaceholder />}
        </ChartCard>
      </div>

      {/* ══════════ BOTTOM ROW — DONUTS + INSIGHTS ══════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>

        {/* Deliverable Types Donut */}
        <ChartCard title="Deliverable Types" subtitle={`${typeData.length} types identified`} delay={0.25} height={bottomChartContentHeight} titleColor="#C5A059">
          {typeData.length > 0 ? (
            <InteractivePieChart
              data={typeData}
              total={typeTotal}
              onClick={handleTypeClick}
            />
          ) : <NoDataPlaceholder />}
        </ChartCard>

        {/* CDE Usage Donut */}
        <ChartCard title="CDE Environment Usage" subtitle={`${cdeData.length} environments in use`} delay={0.3} height={bottomChartContentHeight} titleColor="#C5A059">
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
            <GlassCard padding="none" hover={false} style={{ height: insightCardHeight }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '10px 14px 0' }}>
                <div style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(208, 171, 130, 0.15)', color: '#d0ab82', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lightbulb size={18} />
                </div>
                <h3 className="brand-heading" style={{ fontSize: 14, color: '#d0ab82', margin: 0, fontWeight: 950, letterSpacing: '0.1em' }}>AI STRATEGY INSIGHTS</h3>
              </div>
              <div style={{ padding: '6px 12px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {insights.map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 14px', borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.7)',
                      border: `1px solid rgba(0, 63, 73, 0.1)`,
                      boxShadow: '0 2px 8px rgba(0, 63, 73, 0.05)'
                    }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                      background: `${insight.color}15`, color: insight.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1
                    }}>
                      {insight.icon}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 900, color: '#003f49', lineHeight: 1.5, margin: 0 }}>
                      {insight.text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
      </div> {/* End #analytics-chart-grid */}
    </motion.div>
  );
}
