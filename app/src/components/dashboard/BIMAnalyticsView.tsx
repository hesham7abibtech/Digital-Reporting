'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, Sector
} from 'recharts';
import {
  Shield, Layers, Users, Clock, Database, TrendingUp,
  Trophy, Crown, Zap, AlertTriangle,
  Search, CircleDot, RefreshCw
} from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import AnimatedCounter from '@/components/shared/AnimatedCounter';
import EliteDropdown from '@/components/dashboard/EliteDropdown';
import type { BIMReview } from '@/lib/types';
import { useTimeZone } from '@/context/TimeZoneContext';

/* ── Color Palette ── */
const CHART_COLORS = [
  '#D4AF37', '#94a3b8', '#10b981', '#f59e0b', '#ef4444',
  '#6366f1', '#06b6d4', '#ec4899', '#8b5cf6', '#a855f7'
];

const GOLD = '#d0ab82';

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
      {label && <p style={{ fontWeight: 950, color: '#003f49', marginBottom: 6, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill, boxShadow: `0 0 8px ${p.color || p.fill}40` }} />
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
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.payload.color || CHART_COLORS[0], boxShadow: `0 0 8px ${d.payload.color || CHART_COLORS[0]}40` }} />
        <span style={{ fontSize: 14, fontWeight: 950, color: '#003f49', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 950, color: d.payload.color || CHART_COLORS[0] }}>{d.value}</span>
        <span style={{ fontSize: 12, color: 'rgba(0, 63, 73, 0.5)', fontWeight: 700 }}>reviews</span>
      </div>
      <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(0, 63, 73, 0.05)', overflow: 'hidden', marginBottom: 4 }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: d.payload.color || CHART_COLORS[0] }} />
      </div>
      <span style={{ fontSize: 12, color: 'rgba(0, 63, 73, 0.4)', fontWeight: 800 }}>{pct}% of total</span>
    </div>
  );
}

function PremiumLegend({ payload }: any) {
  if (!payload) return null;
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 16,
      marginTop: 4,
      padding: '4px 20px'
    }}>
      {payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '2px',
            background: entry.color || entry.payload?.fill || GOLD,
            boxShadow: `0 0 8px ${entry.color || entry.payload?.fill || GOLD}40`
          }} />
          <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(0, 63, 73, 0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {entry.value}
          </span>
        </div>
      ))}
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
    <text
      x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={10} fontWeight={900}
      style={{ pointerEvents: 'none', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

/* ── Chart Card Wrapper ── */
function ChartCard({ title, subtitle, children, delay, height = 350, titleColor = '#003f49' }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{ height: '100%', minHeight: height }}
    >
      <GlassCard padding="none" hover={false} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0, 63, 73, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="brand-heading" style={{ fontSize: 13, fontWeight: 950, color: titleColor, margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</h3>
            {subtitle && <p style={{ fontSize: 10, color: 'rgba(0, 63, 73, 0.4)', margin: '2px 0 0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{subtitle}</p>}
          </div>
        </div>
        <div style={{ flex: 1, padding: '12px', minHeight: 0, position: 'relative' }}>
          {children}
        </div>
      </GlassCard>
    </motion.div>
  );
}

function NoDataPlaceholder() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(0, 63, 73, 0.2)', gap: 10 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0, 63, 73, 0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Database size={20} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Insufficient Analytics Data</span>
    </div>
  );
}

function InteractivePieChart({ data, total, onClick }: any) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <PieChart>
        <Pie
          data={data}
          innerRadius={55}
          outerRadius={75}
          paddingAngle={4}
          dataKey="value"
          onMouseEnter={(_, index) => index}
          onClick={(data) => onClick && onClick(data.name)}
          cursor="pointer"
          stroke="none"
          label={renderDonutLabel}
          labelLine={false}
        >
          {data.map((entry: any, i: number) => (
            <Cell 
              key={i} 
              fill={entry.color} 
              style={{ filter: `drop-shadow(0 4px 10px ${entry.color}30)` }}
            />
          ))}
        </Pie>
        <Tooltip content={<DonutTooltip total={total} />} />
        <Legend content={<PremiumLegend />} verticalAlign="bottom" />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ── KPI Card with Hover Tooltip ── */
function KPICard({ label, value, icon, color, trend, pctChange, suffix, delay, displayValue, tooltipTitle, tooltipDetails, tooltipAlign = 'center' }: {
  label: string; value: number; icon: React.ReactNode; color: string;
  trend: 'up' | 'down' | 'neutral'; pctChange: number; suffix?: string; delay: number;
  displayValue?: string;
  tooltipTitle?: string;
  tooltipDetails?: { label: string; value: string; color?: string }[];
  tooltipAlign?: 'start' | 'center' | 'end';
}) {
  const [isHovered, setIsHovered] = useState(false);
  const tooltipPlacement = tooltipAlign === 'start'
    ? { left: 0, x: '0%' }
    : tooltipAlign === 'end'
      ? { right: 0, x: '0%' }
      : { left: '50%', x: '-50%' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02, boxShadow: `0 15px 35px rgba(0,0,0,0.4), 0 0 20px ${color}15` }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card"
      style={{
        padding: '12px 14px',
        position: 'relative',
        overflow: 'visible',
        cursor: 'pointer',
        border: isHovered ? `1px solid ${color}40` : '1px solid rgba(255,255,255,0.08)',
        transition: 'border 0.3s ease',
        zIndex: isHovered ? 1000 : 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 85
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: color, borderRadius: '0 4px 4px 0' }} />
      <div style={{ position: 'absolute', top: -30, right: -30, width: 80, height: 80, background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          {displayValue ? (
            <span style={{ fontSize: 18, fontWeight: 950, color: '#003f49', letterSpacing: '-0.02em' }}>{displayValue}</span>
          ) : (
            <AnimatedCounter value={value} className="text-lg font-black text-[#003f49]" />
          )}
          {suffix && <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(0, 63, 73, 0.5)' }}>{suffix}</span>}
        </div>
      </div>
      <div style={{ marginTop: 'auto' }}>
        <p style={{ 
          fontSize: 11, 
          color: 'rgba(0, 63, 73, 0.85)', 
          margin: 0, 
          fontWeight: 950, 
          textTransform: 'uppercase', 
          letterSpacing: '0.06em',
          lineHeight: 1.2
        }}>
          {label}
        </p>
      </div>

      <AnimatePresence>
        {isHovered && tooltipDetails && (
          <motion.div
            initial={{ opacity: 0, y: 8, x: tooltipPlacement.x, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, x: tooltipPlacement.x, scale: 1 }}
            exit={{ opacity: 0, y: 6, x: tooltipPlacement.x, scale: 0.97 }}
            style={{ position: 'absolute', top: '100%', ...(tooltipAlign === 'end' ? { right: 0 } : { left: tooltipPlacement.left }), marginTop: 12, zIndex: 10000, width: 280, borderRadius: 16, background: '#ffffff', border: `1.5px solid ${color}`, boxShadow: '0 15px 35px rgba(0, 63, 73, 0.08)', padding: '16px' }}
          >
            <div style={{ position: 'absolute', top: -7, ...(tooltipAlign === 'start' ? { left: 28 } : tooltipAlign === 'end' ? { right: 28 } : { left: '50%', marginLeft: -7 }), width: 14, height: 14, rotate: '45deg', background: '#ffffff', borderLeft: `1.5px solid ${color}`, borderTop: `1.5px solid ${color}` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
              <span style={{ fontSize: 13, fontWeight: 950, color: '#003f49', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tooltipTitle || label} Breakdown</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tooltipDetails.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: 'rgba(0, 63, 73, 0.02)', border: '1px solid rgba(0, 63, 73, 0.05)', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'rgba(0, 63, 73, 0.6)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 950, color: d.color || color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface BIMAnalyticsViewProps {
  data: BIMReview[];
  previousPeriodData?: BIMReview[];
  search?: string;
  setSearch?: (v: string) => void;
  filterStage?: string[];
  setFilterStage?: (v: string[]) => void;
  availableStages?: string[];
  filterStatus?: string[];
  setFilterStatus?: (v: string[]) => void;
  availableStatuses?: string[];
  filterStakeholder?: string[];
  setFilterStakeholder?: (v: string[]) => void;
  availableStakeholders?: string[];
  filterReviewer?: string[];
  setFilterReviewer?: (v: string[]) => void;
  availableReviewers?: string[];
  filterPrecinct?: string[];
  setFilterPrecinct?: (v: string[]) => void;
  availablePrecincts?: string[];
}

export default function BIMAnalyticsView({
  data,
  previousPeriodData = [],
  search,
  setSearch,
  filterStage = [],
  setFilterStage,
  availableStages = [],
  filterStatus = [],
  setFilterStatus,
  availableStatuses = [],
  filterStakeholder = [],
  setFilterStakeholder,
  availableStakeholders = [],
  filterReviewer = [],
  setFilterReviewer,
  availableReviewers = [],
  filterPrecinct = [],
  setFilterPrecinct,
  availablePrecincts = []
}: BIMAnalyticsViewProps) {
  const { formatDate } = useTimeZone();
  const SECTION_GAP = 10;
  const HEADER_BLOCK_PADDING = '12px 18px';
  const CHART_TITLE_PADDING = '12px 16px';
  const CHART_BODY_PADDING = '8px 12px 12px';

  const stakeholderData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(r => { if (r.Stakeholder) counts[r.Stakeholder] = (counts[r.Stakeholder] || 0) + 1; });
    return Object.entries(counts)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value).slice(0, 8);
  }, [data]);

  const {
    total, prevTotal, totalPct, totalTrend, approvalRate, statusCounts, modonCounts, activeStakeholders,
    stageData, reviewerData, timelineData, approvedPct, rejectedPct, pendingPct,
    insights
  } = useMemo(() => {
    const total = data.length;
    const prevTotal = previousPeriodData.length;

    const statusCounts: Record<string, number> = {};
    const modonCounts: Record<string, number> = {};
    const stageCounts: Record<string, number> = {};
    const reviewerCounts: Record<string, number> = {};
    const timelineRaw: Record<string, number> = {};

    data.forEach(r => {
      const s = (r["InSite Review Status"] || 'PENDING').toUpperCase();
      statusCounts[s] = (statusCounts[s] || 0) + 1;

      // ACC Status as a proxy for final review if modon is missing
      const acc = (r["ACC Status"]?.[0] || 'AWAITING').toUpperCase();
      modonCounts[acc] = (modonCounts[acc] || 0) + 1;

      const priority = r.Priority || 'Medium';
      stageCounts[priority] = (stageCounts[priority] || 0) + 1;

      const reviewersRaw = r["InSite Reviewer"] || [];
      if (reviewersRaw.length === 0) {
        reviewerCounts['Unassigned'] = (reviewerCounts['Unassigned'] || 0) + 1;
      } else {
        // Handle both arrays and comma-separated strings within arrays
        const taskReviewers = new Set<string>();
        reviewersRaw.forEach(rev => {
          if (typeof rev === 'string') {
            rev.split(',').forEach(p => {
              const cleaned = p.trim();
              if (cleaned) taskReviewers.add(cleaned);
            });
          }
        });

        if (taskReviewers.size === 0) {
          reviewerCounts['Unassigned'] = (reviewerCounts['Unassigned'] || 0) + 1;
        } else {
          taskReviewers.forEach(revName => {
            reviewerCounts[revName] = (reviewerCounts[revName] || 0) + 1;
          });
        }
      }

      // Timeline processing
      const firstDate = r["Planned Submission Date"]?.[0];
      if (firstDate) {
        let d = new Date(firstDate);
        if (!isNaN(d.getTime())) {
          const monthYear = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
          if (!timelineRaw[monthYear]) {
            (timelineRaw as any)[monthYear] = { count: 0, date: new Date(d.getFullYear(), d.getMonth(), 1) };
          }
          (timelineRaw as any)[monthYear].count++;
        }
      }
    });

    const approvedCount = modonCounts['APPROVED'] || 0;
    const rejectedCount = modonCounts['REJECTED'] || 0;
    const pendingCount = total - (approvedCount + rejectedCount);

    const approvalRate = total > 0 ? Math.round((approvedCount / total) * 100) : 0;
    const approvedPct = total > 0 ? Math.round((approvedCount / total) * 100) : 0;
    const rejectedPct = total > 0 ? Math.round((rejectedCount / total) * 100) : 0;
    const pendingPct = 100 - (approvedPct + rejectedPct);

    const stakeholderSet = new Set(data.map(r => r.Stakeholder));
    const activeStakeholders = stakeholderSet.size;

    const calcPct = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.abs(Math.round(((curr - prev) / prev) * 100));
    };
    const calcTrend = (curr: number, prev: number): 'up' | 'down' | 'neutral' => curr > prev ? 'up' : curr < prev ? 'down' : 'neutral';

    const stageData = Object.entries(stageCounts).map(([name, value], i) => ({
      name, value, color: CHART_COLORS[i % CHART_COLORS.length]
    })).sort((a, b) => b.value - a.value);

    const reviewerData = Object.entries(reviewerCounts).map(([name, value], i) => ({
      name, value, color: CHART_COLORS[(i + 4) % CHART_COLORS.length]
    })).sort((a, b) => b.value - a.value).slice(0, 6);

    const timelineData = Object.entries(timelineRaw).map(([name, data]: [string, any]) => ({
      name,
      value: data.count,
      sortDate: data.date.getTime()
    })).sort((a, b) => a.sortDate - b.sortDate);

    const insights = (() => {
      const list = [];
      if (approvalRate > 80) list.push({ text: "High Submission Integrity: 80%+ of reviews are meeting Modon approval standards.", color: '#10b981', icon: <Trophy size={14} /> });
      else if (approvalRate < 50 && total > 0) list.push({ text: "Quality Alert: Approval rate is currently below 50%. Review project priority alignment.", color: '#f43f5e', icon: <AlertTriangle size={14} /> });

      const pendingCount = statusCounts['PENDING'] || 0;
      if (pendingCount > 10) list.push({ text: `Backlog Detected: ${pendingCount} reviews are awaiting InSite action. Allocate resources to clear latency.`, color: '#f59e0b', icon: <Clock size={14} /> });
      
      const topStakeholder = stakeholderData[0]?.name;
      if (topStakeholder) list.push({ text: `Critical Path: ${topStakeholder} is the highest contributor this period. Monitor for bottlenecks.`, color: '#6366f1', icon: <Zap size={14} /> });

      return list.slice(0, 3);
    })();

    return {
      total, prevTotal, totalPct: calcPct(total, prevTotal), totalTrend: calcTrend(total, prevTotal),
      approvalRate, statusCounts, modonCounts, activeStakeholders,
      stageData, reviewerData, timelineData, approvedPct, rejectedPct, pendingPct,
      insights
    };
  }, [data, previousPeriodData]);


  const statusDonutData = useMemo(() => {
    return Object.entries(statusCounts).map(([name, value], i) => ({
      name, value, color: CHART_COLORS[(i + 2) % CHART_COLORS.length]
    }));
  }, [statusCounts]);

  return (
    <motion.div id="bim-analytics-export-root" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ display: 'flex', flexDirection: 'column', gap: SECTION_GAP, width: '100%', maxWidth: '100%', minHeight: '100%', overflow: 'visible' }}>
      <GlassCard style={{ padding: 0, overflow: 'visible' }}>
        <div style={{ padding: HEADER_BLOCK_PADDING, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, rowGap: 10, flexWrap: 'wrap', position: 'relative', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 950, color: '#003f49', margin: 0 }}>BIM Reviews Dashboard</h2>
              <p style={{ fontSize: 11, color: 'rgba(0, 63, 73, 0.7)', margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}> {activeStakeholders} Consultants</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, rowGap: 8, marginLeft: 'auto', flexWrap: 'nowrap', justifyContent: 'flex-end', maxWidth: '100%', overflow: 'hidden' }}>
            {setSearch && (
              <motion.div
                style={{ position: 'relative', width: 240, minWidth: 240, maxWidth: 240, flex: '0 0 240px' }}
              >
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#003f49' }} />
                <input
                  type="text"
                  placeholder="Search BIM Reviews"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    padding: '10px 14px 10px 38px', borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(0, 63, 73, 0.2)',
                    fontSize: 12, color: '#003f49', outline: 'none', width: '100%',
                    fontWeight: 600,
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#003f49';
                    e.target.style.boxShadow = '0 0 10px rgba(0, 63, 73, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(0, 63, 73, 0.2)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </motion.div>
            )}
            {setFilterStage && (
              <EliteDropdown value={filterStage} options={availableStages.map(s => ({ label: s, value: s }))} onChange={setFilterStage} menuLabel="Design Stage" isMulti allLabel="All Stages" />
            )}
            {setFilterStatus && (
              <EliteDropdown value={filterStatus} options={availableStatuses.map(s => ({ label: s, value: s }))} onChange={setFilterStatus} menuLabel="Status" isMulti allLabel="All Statuses" />
            )}
            {setFilterStakeholder && (
              <EliteDropdown value={filterStakeholder} options={availableStakeholders.map(s => ({ label: s, value: s }))} onChange={setFilterStakeholder} menuLabel="Stakeholder" isMulti allLabel="All Stakeholders" />
            )}
            {setFilterReviewer && (
              <EliteDropdown value={filterReviewer} options={availableReviewers.map(s => ({ label: s, value: s }))} onChange={setFilterReviewer} menuLabel="Reviewer" isMulti allLabel="All Reviewers" />
            )}
            {setFilterPrecinct && (
              <EliteDropdown value={filterPrecinct} options={availablePrecincts.map(s => ({ label: s, value: s }))} onChange={setFilterPrecinct} menuLabel="Precinct" isMulti allLabel="All Precincts" />
            )}
            {(search ||
              (filterStage.length > 0 && !filterStage.includes('All Stages')) ||
              (filterStatus.length > 0 && !filterStatus.includes('All Statuses')) ||
              (filterStakeholder.length > 0 && !filterStakeholder.includes('All Stakeholders')) ||
              (filterReviewer.length > 0 && !filterReviewer.includes('All Reviewers')) ||
              (filterPrecinct.length > 0 && !filterPrecinct.includes('All Precincts'))
            ) && (
                <button
                  onClick={() => {
                    if (setSearch) setSearch('');
                    if (setFilterStage) setFilterStage([]);
                    if (setFilterStatus) setFilterStatus([]);
                    if (setFilterStakeholder) setFilterStakeholder([]);
                    if (setFilterReviewer) setFilterReviewer([]);
                    if (setFilterPrecinct) setFilterPrecinct([]);
                  }}
                  style={{
                    padding: '10px 16px', borderRadius: 10,
                    background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                  }}
                >
                  <RefreshCw size={14} />
                  Reset All
                </button>
              )}
          </div>
        </div>
      </GlassCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: SECTION_GAP, flexShrink: 0 }}>
        <KPICard
          label="Total BIM Reviews" value={total} icon={<Layers size={16} />} color="#6366f1" trend={totalTrend} pctChange={totalPct} delay={0.05}
          tooltipAlign="start"
          tooltipTitle="Volume Breakdown"
          tooltipDetails={[
            { label: 'Active Dataset', value: `${total} Records` },
            { label: 'Previous Period', value: `${prevTotal} Records` },
            { label: 'Growth Delta', value: `${total - prevTotal} Units`, color: totalTrend === 'up' ? '#10b981' : '#f43f5e' }
          ]}
        />
        <KPICard
          label="Submission Health" value={approvalRate} suffix="%" icon={<Trophy size={16} />} color="#10b981" trend="neutral" pctChange={0} delay={0.1}
          tooltipTitle="Quality Distribution"
          tooltipDetails={[
            { label: 'Approved (Modon)', value: `${approvedPct}%`, color: '#10b981' },
            { label: 'Rejected/Hold', value: `${rejectedPct}%`, color: '#f43f5e' },
            { label: 'Awaiting Final', value: `${pendingPct}%`, color: '#f59e0b' }
          ]}
        />
        <KPICard
          label="Stakeholder Load" value={activeStakeholders} icon={<Users size={16} />} color="#06b6d4" trend="neutral" pctChange={0} delay={0.15}
          tooltipTitle="Top Contributors"
          tooltipDetails={stakeholderData.slice(0, 3).map(s => ({ label: s.name, value: `${s.value} Reviews` }))}
        />
        <KPICard
          label="System Latency" value={statusCounts['PENDING'] || 0} icon={<Clock size={16} />} color="#f59e0b" trend="neutral" pctChange={0} delay={0.2}
          tooltipAlign="end"
          tooltipTitle="Pending Action Logic"
          tooltipDetails={[
            { label: 'InSite Review', value: `${statusCounts['PENDING'] || 0} Units` },
            { label: 'Modon Final', value: `${modonCounts['AWAITING'] || 0} Units` }
          ]}
        />
      </div>

      <div id="bim-analytics-charts" style={{ width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: SECTION_GAP }}>
        {/* Row 1: 3-Column Performance Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: SECTION_GAP }}>
          <ChartCard title="Stakeholder Submission Volume" subtitle="Top contributing partners" delay={0.1}>
            {stakeholderData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={100}>
                <BarChart data={stakeholderData} layout="vertical" margin={{ left: 40, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 63, 73, 0.05)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#003f49', fontSize: 11, fontWeight: 950 }} width={120} />
                  <Tooltip content={<PremiumTooltip />} cursor={{ fill: 'rgba(0, 63, 73, 0.02)' }} />
                  <Bar name="Review Volume" dataKey="value" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', fill: GOLD, fontSize: 11, fontWeight: 950 }}>
                    {stakeholderData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <NoDataPlaceholder />}
          </ChartCard>

          <ChartCard title="Review Progression Timeline" subtitle="Submission activity trend" delay={0.15}>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={100}>
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 63, 73, 0.05)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#003f49', fontSize: 11, fontWeight: 950 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#003f49', fontSize: 11, fontWeight: 950 }} dx={-10} />
                  <Tooltip content={<PremiumTooltip />} />
                  <Area
                    name="Submission Trend"
                    type="monotone"
                    dataKey="value"
                    stroke={GOLD}
                    fillOpacity={1}
                    fill="url(#colorVal)"
                    strokeWidth={3}
                    activeDot={{ r: 6, strokeWidth: 0, fill: GOLD }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : <NoDataPlaceholder />}
          </ChartCard>

          <ChartCard title="Reviewer Workload" subtitle="Internal resource distribution" delay={0.2}>
            {reviewerData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={reviewerData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={(props: any) => {
                      const { x, y, payload } = props;
                      const text = payload.value;
                      const truncated = text.length > 20 ? text.slice(0, 18) + '…' : text;
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text 
                            x={-10} 
                            y={0} 
                            dy={4} 
                            textAnchor="end" 
                            fill="#003f49" 
                            style={{ fontSize: 11, fontWeight: 950 }}
                          >
                            {truncated}
                          </text>
                        </g>
                      );
                    }} 
                    width={140} 
                  />
                  <Tooltip content={<PremiumTooltip />} />
                  <Bar name="Reviewer Load" dataKey="value" radius={[0, 4, 4, 0]} barSize={12} label={{ position: 'right', fill: GOLD, fontSize: 10, fontWeight: 950 }}>
                    {reviewerData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <NoDataPlaceholder />}
          </ChartCard>
        </div>

        {/* Row 2: Donuts + AI Insights */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: SECTION_GAP }}>
          <ChartCard title="InSite Status Breakdown" subtitle="Current review lifecycle" delay={0.25}>
            {statusDonutData.length > 0 ? (
              <InteractivePieChart data={statusDonutData} total={total} />
            ) : <NoDataPlaceholder />}
          </ChartCard>

          <ChartCard title="Design Stage Distribution" subtitle="Project priority mapping" delay={0.3}>
            {stageData.length > 0 ? (
              <InteractivePieChart data={stageData} total={total} />
            ) : <NoDataPlaceholder />}
          </ChartCard>

          {/* Smart Insights Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <GlassCard padding="none" hover={false} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(0, 63, 73, 0.05)' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(208, 171, 130, 0.15)', color: '#d0ab82', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={16} />
                </div>
                <h3 className="brand-heading" style={{ fontSize: 13, fontWeight: 950, color: '#d0ab82', margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>BIM AI INSIGHTS</h3>
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
                {insights.length > 0 ? insights.map((insight, i) => (
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
                    <p style={{ fontSize: 12, fontWeight: 900, color: '#003f49', lineHeight: 1.4, margin: 0 }}>
                      {insight.text}
                    </p>
                  </motion.div>
                )) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                    <Zap size={24} style={{ marginBottom: 8 }} />
                    <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>Intelligence Offline</span>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div> {/* End #bim-analytics-charts */}
    </motion.div>
  );
}
