'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, Sector
} from 'recharts';
import {
  Shield, Layers, Users, Clock, Database, TrendingUp,
  TrendingDown, Minus, Trophy, Crown, Zap, AlertTriangle,
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
        <span style={{ fontSize: 13, color: '#94a3b8' }}>reviews</span>
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
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: color, borderRadius: '16px 0 0 16px' }} />
      <div style={{ position: 'absolute', top: -30, right: -30, width: 80, height: 80, background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

      <AnimatePresence>
        {isHovered && tooltipDetails && tooltipDetails.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8, x: '-50%', scale: 0.96 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: 6, x: '-50%', scale: 0.97 }}
            style={{ position: 'absolute', top: '100%', left: '50%', marginTop: 8, zIndex: 5000, width: 280, borderRadius: 14, background: 'rgba(12, 12, 20, 0.97)', backdropFilter: 'blur(24px)', border: `1px solid ${color}30`, boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 30px ${color}10`, padding: '14px 16px' }}
          >
            <div style={{ position: 'absolute', top: -6, left: '50%', marginLeft: -6, width: 12, height: 12, rotate: '45deg', background: 'rgba(12, 12, 20, 0.97)', borderLeft: `1px solid ${color}30`, borderTop: `1px solid ${color}30` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: `${color}20`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{tooltipTitle || label}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tooltipDetails.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
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
  availableStakeholders = []
}: BIMAnalyticsViewProps) {
  const { formatDate } = useTimeZone();

  const {
    total, prevTotal, totalPct, totalTrend, approvalRate, statusCounts, modonCounts, activeStakeholders,
    stageData, reviewerData, timelineData, approvedPct, rejectedPct, pendingPct
  } = useMemo(() => {
    const total = data.length;
    const prevTotal = previousPeriodData.length;

    const statusCounts: Record<string, number> = {};
    const modonCounts: Record<string, number> = {};
    const stageCounts: Record<string, number> = {};
    const reviewerCounts: Record<string, number> = {};
    const timelineRaw: Record<string, number> = {};

    data.forEach(r => {
      const s = (r.insiteBimReviewStatus || 'PENDING').toUpperCase();
      statusCounts[s] = (statusCounts[s] || 0) + 1;

      const ms = (r.modonHillFinalReviewStatus || 'AWAITING').toUpperCase();
      modonCounts[ms] = (modonCounts[ms] || 0) + 1;

      const stage = r.designStage || 'Other';
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;

      const rev = r.insiteReviewer || 'Unassigned';
      reviewerCounts[rev] = (reviewerCounts[rev] || 0) + 1;

      // Timeline processing (DD-MMM-YYYY)
      if (r.submissionDate) {
        const parts = r.submissionDate.split('-');
        if (parts.length === 3) {
          const monthYear = `${parts[1]} ${parts[2]}`;
          timelineRaw[monthYear] = (timelineRaw[monthYear] || 0) + 1;
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

    const stakeholderSet = new Set(data.map(r => r.stakeholder));
    const activeStakeholders = stakeholderSet.size;

    const calcPct = (curr: number, prev: number) => prev > 0 ? Math.abs(Math.round(((curr - prev) / prev) * 100)) : 0;
    const calcTrend = (curr: number, prev: number): 'up' | 'down' | 'neutral' => curr > prev ? 'up' : curr < prev ? 'down' : 'neutral';

    const stageData = Object.entries(stageCounts).map(([name, value], i) => ({
      name, value, color: CHART_COLORS[i % CHART_COLORS.length]
    })).sort((a,b) => b.value - a.value);

    const reviewerData = Object.entries(reviewerCounts).map(([name, value], i) => ({
      name, value, color: CHART_COLORS[(i + 4) % CHART_COLORS.length]
    })).sort((a,b) => b.value - a.value).slice(0, 6);

    const timelineData = Object.entries(timelineRaw).map(([name, value]) => ({
      name, value
    }));

    return {
      total, prevTotal, totalPct: calcPct(total, prevTotal), totalTrend: calcTrend(total, prevTotal),
      approvalRate, statusCounts, modonCounts, activeStakeholders,
      stageData, reviewerData, timelineData, approvedPct, rejectedPct, pendingPct
    };
  }, [data, previousPeriodData]);

  const stakeholderData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(r => { if (r.stakeholder) counts[r.stakeholder] = (counts[r.stakeholder] || 0) + 1; });
    return Object.entries(counts)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value).slice(0, 8);
  }, [data]);

  const statusDonutData = useMemo(() => {
    return Object.entries(statusCounts).map(([name, value], i) => ({
      name, value, color: CHART_COLORS[(i + 2) % CHART_COLORS.length]
    }));
  }, [statusCounts]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <GlassCard style={{ padding: 0, overflow: 'visible' }}>
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'relative', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Review Matrix Intelligence</h2>
              <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: 0, fontWeight: 500 }}>Technical dataset spanning {activeStakeholders} stakeholders</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
            {setSearch && (
              <div style={{ position: 'relative', maxWidth: 220 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(212, 175, 55, 0.4)' }} />
                <input
                  type="text"
                  placeholder="Query Matrix..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ padding: '8px 14px 8px 34px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212, 175, 55, 0.1)', fontSize: 13, color: 'white', outline: 'none', width: 220 }}
                />
              </div>
            )}
            {setFilterStage && (
              <EliteDropdown value={filterStage} options={availableStages.map(s => ({ label: s, value: s }))} onChange={setFilterStage} menuLabel="Design Stage" isMulti allLabel="All Stages" />
            )}
          </div>
        </div>
      </GlassCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <KPICard 
          label="Total BIM Reviews" value={total} icon={<Layers size={16} />} color="#6366f1" trend={totalTrend} pctChange={totalPct} delay={0.05} 
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
          tooltipTitle="Pending Action Logic"
          tooltipDetails={[
            { label: 'InSite Review', value: `${statusCounts['PENDING'] || 0} Units` },
            { label: 'Modon Final', value: `${modonCounts['AWAITING'] || 0} Units` }
          ]}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
        <GlassCard padding="none">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Stakeholder Submission Volume</h3>
            <span style={{ fontSize: 10, color: '#D4AF37', fontWeight: 900, textTransform: 'uppercase' }}>Volume Distribution</span>
          </div>
          <div style={{ height: 300, padding: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stakeholderData} layout="vertical" margin={{ left: 40, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} width={120} />
                <Tooltip content={<PremiumTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 800 }}>
                  {stakeholderData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard padding="none">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Review Progression Timeline</h3>
          </div>
          <div style={{ height: 300, padding: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GOLD} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={GOLD} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                <Tooltip content={<PremiumTooltip />} />
                <Area type="monotone" dataKey="value" stroke={GOLD} fillOpacity={1} fill="url(#colorVal)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <GlassCard padding="none">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>InSite Status</h3>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusDonutData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" label={renderDonutLabel} labelLine={false}>
                  {statusDonutData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip total={total} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard padding="none">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Design Stage Breakdown</h3>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stageData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" label={renderDonutLabel} labelLine={false}>
                  {stageData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip total={total} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard padding="none">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Reviewer Workload</h3>
          </div>
          <div style={{ height: 220, padding: '10px 20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reviewerData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} width={80} />
                <Tooltip content={<PremiumTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12} label={{ position: 'right', fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 800 }}>
                  {reviewerData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}
