'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, Sector
} from 'recharts';
import {
  Shield, Layers, Users, Clock, Database, TrendingUp,
  Trophy, Crown, Zap, AlertTriangle,
  Search, CircleDot, RefreshCw, Activity
} from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import AnimatedCounter from '@/components/shared/AnimatedCounter';
import EliteDropdown from '@/components/shared/EliteDropdown';
import type { BIMReview } from '@/lib/types';
import { useTimeZone } from '@/context/TimeZoneContext';

/* ── Elite Dark Theme Color Palette ── */
const THEME = {
  bgBase: 'transparent', // Neutralized from Deep Teal
  cardBg: 'rgba(0, 0, 0, 0.75)', // Slightly more opaque for better text grounding
  cardBorder: 'rgba(255, 255, 255, 0.2)', // Sharper borders
  textPrimary: '#ffffff',
  textSecondary: '#d1d5db', // Light gray for labels
  textMuted: 'rgba(255, 255, 255, 0.85)', // Very bright for axis ticks
  primary: '#e6c29a', // Brighter Gold
  secondary: '#a5f3fc', // Brighter Cyan
  accent: '#34d399', // Brighter Emerald
  warning: '#fbbf24', // Brighter Amber
  danger: '#f87171', // Brighter Red
};

const darkAxisProps = {
  tick: { fill: THEME.textMuted, fontSize: 12, fontWeight: 700, fontFamily: 'Inter' },
  axisLine: { stroke: THEME.cardBorder, strokeWidth: 1.5 },
  tickLine: { stroke: THEME.cardBorder, strokeWidth: 1.5 },
};

const CHART_COLORS = [
  '#e6c29a', // Brighter Gold
  '#34d399', // Emerald
  '#a5f3fc', // Cyan
  '#fb923c', // Orange
  '#c084fc', // Purple
  '#f472b6', // Pink
  '#ffffff', // White
];

const GOLD = '#d0ab82';

/* ── Shared UI Components ── */

function DarkGlassCard({ children, style = {}, className = '' }: { children: React.ReactNode, style?: React.CSSProperties, className?: string }) {
  return (
    <div
      className={`glass-card ${className}`}
      style={{
        background: THEME.cardBg,
        border: `1px solid ${THEME.cardBorder}`,
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.02) inset',
        overflow: 'hidden',
        position: 'relative',
        ...style
      }}
    >
      {children}
    </div>
  );
}

function DarkChartCard({ title, subtitle, children, delay = 0, height = '100%', isExportMode = false }: { title: string, subtitle?: string, children: React.ReactNode, delay?: number, height?: string | number, isExportMode?: boolean }) {
  const [mounted, setMounted] = useState(isExportMode);
  useEffect(() => {
    if (isExportMode) return;
    const timer = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(timer);
  }, [isExportMode]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      style={{ height: '100%' }}
    >
      <DarkGlassCard style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
          <div>
            <h3 style={{ fontSize: '14px', color: THEME.textPrimary, margin: 0, fontWeight: 700, letterSpacing: '0.02em', fontFamily: 'Inter, sans-serif' }}>{title}</h3>
            {subtitle && <p style={{ fontSize: '11px', color: THEME.textMuted, margin: '4px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{subtitle}</p>}
          </div>
        </div>
        <div style={{ flex: 1, padding: '4px 12px 12px', position: 'relative', minHeight: 0 }}>
          {mounted ? children : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.textMuted, fontSize: '12px', fontWeight: 600 }}>Loading Data...</div>
          )}
        </div>
      </DarkGlassCard>
    </motion.div>
  );
}

function DarkKPICard({ label, value, icon, color, delay, suffix, displayValue, tooltipTitle, tooltipDetails, tooltipAlign = 'center', isExportMode = false }: any) {
  const [isHovered, setIsHovered] = useState(false);
  const tooltipPlacement = tooltipAlign === 'start' 
    ? { left: 0, right: 'auto', x: '0%' } 
    : tooltipAlign === 'end' 
      ? { left: 'auto', right: 0, x: '0%' } 
      : { left: '50%', right: 'auto', x: '-50%' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className="glass-card"
      style={{
        padding: '20px',
        position: 'relative',
        overflow: 'visible',
        cursor: 'pointer',
        background: THEME.cardBg,
        border: isHovered ? `1px solid ${color}80` : `1px solid ${THEME.cardBorder}`,
        borderRadius: '16px',
        boxShadow: isHovered ? `0 15px 35px rgba(0,0,0,0.4), 0 0 20px ${color}20` : '0 4px 20px rgba(0, 0, 0, 0.25)',
        transition: 'all 0.3s ease',
        zIndex: isHovered ? 1000 : 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '120px'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ position: 'absolute', left: 0, top: '25%', bottom: '25%', width: '4px', background: color, borderRadius: '0 4px 4px 0', opacity: 0.8 }} />
      <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '100%', zIndex: 10, position: 'relative' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}30`, flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: '12px', color: THEME.textSecondary, margin: '0 0 4px 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            {displayValue || isExportMode ? (
              <span style={{ fontSize: '28px', fontWeight: 800, color: THEME.textPrimary, letterSpacing: '-0.02em', lineHeight: 1 }}>{displayValue || value}</span>
            ) : (
               <div style={{ color: THEME.textPrimary, lineHeight: 1 }}>
                 <AnimatedCounter value={value} className="text-2xl font-extrabold" />
               </div>
            )}
            {suffix && <span style={{ fontSize: '14px', fontWeight: 600, color: THEME.textMuted }}>{suffix}</span>}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isHovered && tooltipDetails && (
          <motion.div
            initial={{ opacity: 0, y: 8, x: tooltipPlacement.x, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, x: tooltipPlacement.x, scale: 1 }}
            exit={{ opacity: 0, y: 6, x: tooltipPlacement.x, scale: 0.97 }}
            style={{ 
              position: 'absolute', 
              top: '100%', 
              left: tooltipPlacement.left, 
              right: tooltipPlacement.right,
              x: tooltipPlacement.x, 
              marginTop: 12, 
              zIndex: 99999, 
              width: 280, 
              borderRadius: 16, 
              background: 'rgba(0, 0, 0, 0.98)', 
              border: `2px solid ${color}`, 
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)', 
              padding: '20px', 
              backdropFilter: 'blur(25px)' 
            }}
          >
            <div style={{ position: 'absolute', top: -7, ...(tooltipAlign === 'start' ? { left: 28 } : tooltipAlign === 'end' ? { right: 28 } : { left: '50%', marginLeft: -7 }), width: 14, height: 14, rotate: '45deg', background: '#000000', borderLeft: `2px solid ${color}`, borderTop: `2px solid ${color}` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}20`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}40` }}>{icon}</div>
              <span style={{ fontSize: 11, fontWeight: 950, color: color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{tooltipTitle || label} Breakdown</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tooltipDetails.map((d: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < tooltipDetails.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none' }}>
                  <span style={{ fontSize: 11, color: '#ffffff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 950, color: '#ffffff' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Shared Chart Helpers ── */
function PremiumTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      padding: '16px 22px', borderRadius: '14px',
      background: 'rgba(0, 0, 0, 0.95)',
      border: `2px solid ${THEME.cardBorder}`,
      zIndex: 99999,
      backdropFilter: 'blur(25px)',
      boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(230, 194, 154, 0.2)',
    }}>
      {label && <p style={{ fontWeight: 950, color: '#ffffff', margin: '0 0 14px', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.15em', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: p.color || p.fill, border: '2px solid rgba(255, 255, 255, 0.3)', boxShadow: `0 0 10px ${p.color || p.fill}60` }} />
          <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.name}:</span>
          <span style={{ color: '#ffffff', fontWeight: 950, fontSize: '16px' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function DonutTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
  const color = d.payload.color || CHART_COLORS[0];
  
  return (
    <div style={{
      padding: '18px 24px', borderRadius: '16px', minWidth: '220px',
      background: 'rgba(10, 10, 15, 0.98)',
      border: `2px solid ${color}`,
      boxShadow: `0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px ${color}30`,
      pointerEvents: 'none',
      zIndex: 10000,
      backdropFilter: 'blur(20px)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: color, boxShadow: `0 0 10px ${color}` }} />
        <span style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{d.name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '32px', fontWeight: 950, color: '#ffffff', lineHeight: 1 }}>{d.value}</span>
        <span style={{ fontSize: '14px', color: THEME.textSecondary, fontWeight: 700 }}>REVIEWS</span>
      </div>
      <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, boxShadow: `0 0 15px ${color}` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: THEME.textSecondary, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contribution</span>
        <span style={{ fontSize: '13px', color: color, fontWeight: 950 }}>{pct}%</span>
      </div>
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
            background: entry.color || entry.payload?.fill || THEME.primary,
            boxShadow: `0 0 8px ${entry.color || entry.payload?.fill || THEME.primary}40`
          }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: THEME.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function renderDonutLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, fill }: any) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.02) return null;
  
  const getLuminosity = (hex: string) => {
    const color = hex.replace('#', '');
    const r = parseInt(color.slice(0, 2), 16);
    const g = parseInt(color.slice(2, 4), 16);
    const b = parseInt(color.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };

  const isLight = getLuminosity(fill) > 0.65;
  const textColor = isLight ? '#000000' : '#ffffff';
  const shadowColor = isLight ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)';
  
  return (
    <text
      x={x} y={y} fill={textColor} textAnchor="middle" dominantBaseline="central"
      fontSize={percent < 0.06 ? 10 : 13} fontWeight={950}
      style={{ 
        pointerEvents: 'none', 
        filter: `drop-shadow(0 2px 6px ${shadowColor})`, 
        letterSpacing: '0.05em',
        paintOrder: 'stroke',
        stroke: isLight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
        strokeWidth: '0.8px'
      }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: `drop-shadow(0 0 12px ${fill}60)` }}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 12}
        fill={fill}
      />
    </g>
  );
};

function NoDataPlaceholder() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: THEME.textMuted, gap: 10 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255, 255, 255, 0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Database size={20} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Insufficient Analytics Data</span>
    </div>
  );
}

function InteractivePieChart({ data, total, onClick }: any) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const PieComponent = Pie as any;
  return (
    <div style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <PieChart>
        <PieComponent
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          data={data}
          cx="50%"
          cy="48%"
          innerRadius="50%"
          outerRadius="82%"
          paddingAngle={3}
          minAngle={15}
          dataKey="value"
          stroke="none"
          labelLine={false}
          label={renderDonutLabel}
          isAnimationActive={false}
          onMouseEnter={(_: any, index: number) => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(-1)}
          onClick={(data: any) => onClick && onClick(data)}
        >
          {data.map((entry: any, index: number) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} 
              style={{ cursor: 'pointer', outline: 'none', transition: 'all 0.3s ease' }}
            />
          ))}
        </PieComponent>
        <Tooltip content={<DonutTooltip total={total} />} />
        <Legend 
          layout="horizontal"
          verticalAlign="bottom" 
          align="center"
          iconType="circle" 
          wrapperStyle={{ 
            fontSize: 10, 
            color: THEME.textPrimary, 
            textTransform: 'uppercase', 
            fontWeight: 950,
            paddingTop: '0px',
            marginTop: '-10px',
            lineHeight: '16px',
            width: '100%'
          }} 
        />
      </PieChart>
    </ResponsiveContainer>
    </div>
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
  filterSubmitter?: string[];
  setFilterSubmitter?: (v: string[]) => void;
  availableSubmitters?: string[];
  isExportMode?: boolean;
  id?: string;
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
  availablePrecincts = [],
  filterSubmitter = [],
  setFilterSubmitter,
  availableSubmitters = [],
  isExportMode = false,
  id
}: BIMAnalyticsViewProps) {
  const { formatDate } = useTimeZone();
  const SECTION_GAP = 32;
  const HEADER_BLOCK_PADDING = '16px 24px';
  const CHART_TITLE_PADDING = '16px 20px 8px';
  const CHART_BODY_PADDING = '8px 16px 16px';

  const stakeholderData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(r => { 
      const s = r.Stakeholder || (r as any).stakeholder || 'N/A';
      counts[s] = (counts[s] || 0) + 1; 
    });
    return Object.entries(counts)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value).slice(0, 8);
  }, [data]);

  const {
    total, prevTotal, totalPct, totalTrend, approvalRate, statusCounts, modonCounts, activeStakeholders,
    stageData, reviewerData, timelineData, approvedPct, rejectedPct, pendingPct,
    pendingCount, milestonesCount, milestoneSet,
    activeProjectsCount, projectData,
    precinctData,
    insights
  } = useMemo(() => {
    const total = data.length;
    const prevTotal = previousPeriodData?.length || 0;

    const statusCounts: Record<string, number> = {};
    const modonCounts: Record<string, number> = {};
    const stageCounts: Record<string, number> = {};
    const projectCounts: Record<string, number> = {};
    const precinctCounts: Record<string, number> = {};
    const reviewerCounts: Record<string, number> = {};
    const timelineRaw: Record<string, number> = {};

    data.forEach(r => {
      const s = (r["InSite Review Status"] || 'PENDING').toUpperCase();
      statusCounts[s] = (statusCounts[s] || 0) + 1;

      // Use InSite Status for modonCounts proxy since ACC Status is removed
      const status = s;
      modonCounts[status] = (modonCounts[status] || 0) + 1;

      const stageRaw = r["Design Stage"] || 'UNKNOWN';
      const stages = Array.from(new Set(stageRaw.split(',').map((s: string) => s.trim()).filter(Boolean)));
      if (stages.length === 0) {
        stageCounts['UNKNOWN'] = (stageCounts['UNKNOWN'] || 0) + 1;
      } else {
        stages.forEach(stage => {
          stageCounts[stage] = (stageCounts[stage] || 0) + 1;
        });
      }

      const pRaw = r["Project"] || 'UNKNOWN';
      projectCounts[pRaw] = (projectCounts[pRaw] || 0) + 1;

      const precincts = r.Precinct || [];
      precincts.forEach(p => {
        precinctCounts[p] = (precinctCounts[p] || 0) + 1;
      });

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
      const firstDate = r["InSite Review Due Date"];
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

    const activeProjectsCount = Object.keys(projectCounts).filter(k => k !== 'UNKNOWN' && k.trim() !== '').length;
    const projectData = Object.entries(projectCounts)
      .filter(([name]) => name !== 'UNKNOWN' && name.trim() !== '')
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number));

    const approvedCount = (statusCounts['APPROVED'] || 0) + (statusCounts['COMPLETED'] || 0) + (statusCounts['SHARED'] || 0);
    const rejectedCount = (statusCounts['REJECTED'] || 0) + (statusCounts['HOLD'] || 0);
    const pendingCount = total - (approvedCount + rejectedCount);

    const approvalRate = total > 0 ? Math.round((approvedCount / total) * 100) : 0;
    const approvedPct = total > 0 ? Math.round((approvedCount / total) * 100) : 0;
    const rejectedPct = total > 0 ? Math.round((rejectedCount / total) * 100) : 0;
    const pendingPct = 100 - (approvedPct + rejectedPct);

    const stakeholderSet = new Set(data.map(r => r.Stakeholder).filter(Boolean));
    const activeStakeholders = stakeholderSet.size;

    const milestoneSet = new Set(data.flatMap(r => r["Milestone Submissions"] || []).filter(Boolean));
    const milestonesCount = milestoneSet.size;

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

    const precinctData = Object.entries(precinctCounts).map(([name, value], i) => ({
      name, value, color: CHART_COLORS[(i + 3) % CHART_COLORS.length]
    })).sort((a, b) => b.value - a.value);

    const timelineData = Object.entries(timelineRaw).map(([name, data]: [string, any]) => ({
      name,
      value: data.count,
      sortDate: data.date.getTime()
    })).sort((a, b) => a.sortDate - b.sortDate);

    const insights = (() => {
      const list = [];
      
      // Approval Insight
      if (approvalRate > 75) {
        list.push({ text: `High Submission Integrity: ${approvalRate}% of reviews are meeting approval standards.`, color: '#10b981', icon: <Trophy size={14} /> });
      } else if (approvalRate < 40 && total > 0) {
        list.push({ text: `Critical Quality Alert: Approval rate is at ${approvalRate}%. Immediate protocol review required.`, color: '#f43f5e', icon: <AlertTriangle size={14} /> });
      }

      // Backlog Insight
      const pendingReviews = (statusCounts['PENDING'] || 0) + (statusCounts['WITH EGIS'] || 0);
      if (pendingReviews > (total * 0.4) && total > 5) {
        list.push({ text: `Protocol Congestion: ${pendingReviews} reviews are in active backlog (${Math.round((pendingReviews/total)*100)}% of total).`, color: '#f59e0b', icon: <Clock size={14} /> });
      }

      // Stakeholder Insight
      const topStakeholder = stakeholderData[0];
      if (topStakeholder && topStakeholder.value > (total * 0.3)) {
        list.push({ text: `Stakeholder Concentration: ${topStakeholder.name} accounts for ${Math.round((topStakeholder.value/total)*100)}% of total volume.`, color: '#6366f1', icon: <Users size={14} /> });
      }

      // Milestone Insight
      if (milestonesCount > 0) {
        list.push({ text: `Milestone Tracking: System is actively monitoring ${milestonesCount} unique submission milestones across projects.`, color: '#06b6d4', icon: <Zap size={14} /> });
      }

      // Design Stage Insight
      const topStage = stageData[0];
      if (topStage) {
        list.push({ text: `Phase Concentration: ${topStage.name} is currently the dominant design stage, representing ${Math.round((topStage.value/total)*100)}% of active reviews.`, color: '#a855f7', icon: <Layers size={14} /> });
      }

      return list.sort((a, b) => 0.5 - Math.random()).slice(0, 4);
    })();

    return {
      total, prevTotal, totalPct: calcPct(total, prevTotal), totalTrend: calcTrend(total, prevTotal),
      approvalRate, statusCounts, modonCounts, activeStakeholders,
      stageData, reviewerData, timelineData, approvedPct, rejectedPct, pendingPct,
      insights,
      pendingCount,
      milestonesCount,
      milestoneSet,
      activeProjectsCount,
      projectData,
      precinctData
    };
  }, [data, previousPeriodData]);


  const statusDonutData = useMemo(() => {
    return Object.entries(statusCounts).map(([name, value], i) => ({
      name, value, color: CHART_COLORS[(i + 2) % CHART_COLORS.length]
    }));
  }, [statusCounts]);

  return (
    <motion.div 
      id={id || "bim-analytics-export-root"} 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35 }} 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: isExportMode ? 10 : SECTION_GAP, 
        width: '100%', 
        maxWidth: '100%', 
        overflow: 'visible',
        padding: isExportMode ? '8px 16px' : '12px 40px',
        minHeight: isExportMode ? '0' : '1400px'
      }}
    >
      <DarkGlassCard 
        data-html2canvas-ignore={isExportMode ? "false" : "true"} 
        style={{ 
          padding: 0, 
          overflow: 'visible', 
          background: isExportMode ? 'rgba(13, 17, 23, 0.6)' : 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {!isExportMode && (
          <div style={{ padding: isExportMode ? '10px 16px' : HEADER_BLOCK_PADDING, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, rowGap: 10, flexWrap: 'wrap', position: 'relative', zIndex: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(208, 171, 130, 0.1)', color: '#d0ab82', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: isExportMode ? 14 : 16, fontWeight: 950, color: THEME.textPrimary, margin: 0 }}>BIM Reviews Dashboard</h2>
                <p style={{ fontSize: isExportMode ? 9 : 11, color: THEME.textSecondary, margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}> {activeStakeholders} Consultants</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, rowGap: 8, marginLeft: 'auto', flexWrap: 'nowrap', justifyContent: 'flex-end', maxWidth: '100%', overflow: 'hidden' }}>
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
                <EliteDropdown value={filterPrecinct} options={availablePrecincts.map(p => ({ label: p, value: p }))} onChange={setFilterPrecinct} menuLabel="Precinct" isMulti allLabel="All Precincts" />
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
                      if (setFilterSubmitter) setFilterSubmitter([]);
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
        )}
      </DarkGlassCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: isExportMode ? 10 : SECTION_GAP, flexShrink: 0, position: 'relative', zIndex: 50 }}>
        <DarkKPICard
          label="Total BIM Reviews" value={total} icon={<Layers size={16} />} color="#6366f1" trend={totalTrend} pctChange={totalPct} delay={0.05}
          isExportMode={isExportMode}
          tooltipAlign="start"
          tooltipTitle="Volume Breakdown"
          tooltipDetails={[
            { label: 'Active Dataset', value: `${total} Records` },
            { label: 'Previous Period', value: `${prevTotal} Records` },
            { label: 'Growth Delta', value: `${total - prevTotal} Units`, color: totalTrend === 'up' ? '#10b981' : '#f43f5e' }
          ]}
        />
        <DarkKPICard
          label="Active Projects" value={activeProjectsCount} icon={<Database size={16} />} color="#f59e0b" trend="neutral" pctChange={0} delay={0.1}
          isExportMode={isExportMode}
          tooltipTitle="Project Distribution"
          tooltipDetails={projectData.slice(0, 5).map((p: any) => ({ label: p.name, value: `${p.value} Reviews` }))}
        />
        <DarkKPICard
          label="Stakeholders Count" value={activeStakeholders} icon={<Users size={16} />} color="#06b6d4" trend="neutral" pctChange={0} delay={0.15}
          isExportMode={isExportMode}
          tooltipTitle="Top Contributors"
          tooltipDetails={stakeholderData.slice(0, 5).map((s: any) => ({ label: s.name, value: `${s.value} Reviews` }))}
        />
        <DarkKPICard
          label="Milestones Tracked" value={milestonesCount} icon={<Zap size={16} />} color="#10b981" trend="neutral" pctChange={0} delay={0.2}
          isExportMode={isExportMode}
          tooltipAlign="end"
          tooltipTitle="Submission Milestones"
          tooltipDetails={Array.from(milestoneSet).slice(0, 5).map(m => ({ label: m, value: 'Active' }))}
        />
      </div>

      <div id="bim-analytics-charts" style={{ width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: isExportMode ? 14 : SECTION_GAP }}>
        {/* Row 1: 3-Column Performance Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isExportMode ? 10 : SECTION_GAP }}>
          <DarkChartCard title="Stakeholder Submission Volume" subtitle="Top contributing partners" delay={0.1} isExportMode={isExportMode}>
            {stakeholderData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stakeholderData} layout="vertical" margin={{ left: 40, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 63, 73, 0.05)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: THEME.textPrimary, fontSize: 11, fontWeight: 800 }} width={120} />
                  <Tooltip content={<PremiumTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                  <Bar name="Review Volume" dataKey="value" radius={[0, 4, 4, 0]} barSize={22} label={{ position: 'right', fill: THEME.primary, fontSize: 11, fontWeight: 900 }} isAnimationActive={false}>
                    {stakeholderData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <NoDataPlaceholder />}
          </DarkChartCard>

          <DarkChartCard title="Review Progression Timeline" subtitle="Submission activity trend" delay={0.15} isExportMode={isExportMode}>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME.cardBorder} vertical={false} />
                  <XAxis dataKey="name" {...darkAxisProps} />
                  <YAxis {...darkAxisProps} />
                  <Tooltip content={<PremiumTooltip />} />
                  <Area
                    name="Submission Trend"
                    type="monotone"
                    dataKey="value"
                    stroke="#f59e0b"
                    fillOpacity={1}
                    fill="url(#colorVal)"
                    strokeWidth={3}
                    isAnimationActive={false}
                    activeDot={{ r: 6, strokeWidth: 0, fill: THEME.primary }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : <NoDataPlaceholder />}
          </DarkChartCard>

          <DarkChartCard title="Precinct Distribution" subtitle="Activity by project location" delay={0.2} isExportMode={isExportMode}>
            {precinctData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={precinctData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.cardBorder} />
                  <XAxis dataKey="name" {...darkAxisProps} tick={{...darkAxisProps.tick, fontSize: 10}} />
                  <YAxis {...darkAxisProps} />
                  <Tooltip content={<PremiumTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                  <Bar name="Review Volume" dataKey="value" radius={[4, 4, 0, 0]} barSize={40} label={{ position: 'top', fill: THEME.textPrimary, fontSize: 11, fontWeight: 900 }} isAnimationActive={false}>
                    {precinctData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <NoDataPlaceholder />}
          </DarkChartCard>
        </div>

        {/* Row 2: Donuts + AI Insights */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isExportMode ? 10 : SECTION_GAP }}>
          <DarkChartCard title="InSite Status Breakdown" subtitle="Current review lifecycle" delay={0.25} isExportMode={isExportMode}>
            {statusDonutData.length > 0 ? (
              <InteractivePieChart data={statusDonutData} total={total} />
            ) : <NoDataPlaceholder />}
          </DarkChartCard>

          <DarkChartCard title="Design Stage Distribution" subtitle="Project priority mapping" delay={0.3} isExportMode={isExportMode}>
            {stageData.length > 0 ? (
              <InteractivePieChart data={stageData} total={total} />
            ) : <NoDataPlaceholder />}
          </DarkChartCard>

          {/* Smart Insights Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <DarkGlassCard style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', borderBottom: `1px solid ${THEME.cardBorder}`, background: 'rgba(208, 171, 130, 0.03)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, rgba(208, 171, 130, 0.2), rgba(208, 171, 130, 0.05))', color: THEME.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(208, 171, 130, 0.15)' }}>
                  <Zap size={18} fill={THEME.primary} fillOpacity={0.2} />
                </div>
                <h3 className="brand-heading" style={{ fontSize: 16, fontWeight: 950, color: THEME.primary, margin: 0, letterSpacing: '0.15em', textTransform: 'uppercase', textShadow: '0 2px 10px rgba(208, 171, 130, 0.3)' }}>BIM AI INSIGHTS</h3>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
                {insights.length > 0 ? insights.map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02, x: 4, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '16px 20px', borderRadius: 16,
                      background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.2))',
                      border: `1px solid ${insight.color}30`,
                      boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3), inset 0 0 10px ${insight.color}05`,
                      cursor: 'pointer'
                    }}
                  >
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.1, 1],
                        filter: [`drop-shadow(0 0 2px ${insight.color}40)`, `drop-shadow(0 0 8px ${insight.color}80)`, `drop-shadow(0 0 2px ${insight.color}40)`]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: `${insight.color}15`, color: insight.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${insight.color}40`
                      }}
                    >
                      {React.isValidElement(insight.icon) ? React.cloneElement(insight.icon as any, { size: 18 }) : insight.icon}
                    </motion.div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 850, color: '#ffffff', lineHeight: 1.4, margin: 0, letterSpacing: '0.01em' }}>
                        {insight.text}
                      </p>
                    </div>
                  </motion.div>
                )) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3, color: THEME.textPrimary }}>
                    <Zap size={24} style={{ marginBottom: 8 }} />
                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>Intelligence Offline</span>
                  </div>
                )}
              </div>
            </DarkGlassCard>
          </motion.div>
        </div>
      </div> {/* End #bim-analytics-charts */}
    </motion.div>
  );
}
