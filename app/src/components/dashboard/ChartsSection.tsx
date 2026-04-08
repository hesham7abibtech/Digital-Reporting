'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend
} from 'recharts';
import GlassCard from '@/components/shared/GlassCard';
import type { Task } from '@/lib/types';

/* ── Premium Color Palette ── */
const palette = {
  blue: '#6366f1',    // Indigo
  cyan: '#06b6d4',    // Cyan
  emerald: '#10b981', // Emerald  
  amber: '#f59e0b',   // Amber
  rose: '#f43f5e',    // Rose
  violet: '#8b5cf6',  // Violet
  slate: '#475569',   // Slate
};

/* ── Custom Tooltip ── */
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

function PieTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const pct = ((d.value / total) * 100).toFixed(1);
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 14, minWidth: 160,
      background: 'rgba(8, 8, 16, 0.97)',
      border: `1px solid ${d.payload.color}40`,
      backdropFilter: 'blur(20px)',
      boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 20px ${d.payload.color}15`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.payload.color, boxShadow: `0 0 8px ${d.payload.color}80` }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{d.name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: d.payload.color }}>{d.value}</span>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>tasks</span>
      </div>
      <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 4 }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: d.payload.color }} />
      </div>
      <span style={{ fontSize: 12, color: '#64748b' }}>{pct}% of total</span>
    </div>
  );
}

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.08) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function ChartCard({ title, children, delay = 0, height = 160 }: { title: string; children: React.ReactNode; delay?: number; height?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}>
      <GlassCard padding="sm" hover={false}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', padding: '10px 14px 0', letterSpacing: '0.01em' }}>{title}</h3>
        <div style={{ width: '100%', height, minWidth: 0, minHeight: height, padding: '4px 6px 6px', position: 'relative', overflow: 'hidden' }}>
          {mounted ? (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              {children}
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 12 }}>Loading…</div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

const axisProps = {
  tick: { fill: '#64748b', fontSize: 10 },
  axisLine: false,
  tickLine: false,
};

interface ChartsSectionProps {
  position?: 'right' | 'right-bottom' | 'full';
  tasks?: Task[];
}

export default function ChartsSection({ position = 'full', tasks: externalTasks }: ChartsSectionProps) {
  const data = externalTasks || [];

  const statusData = useMemo(() => {
    const counts: Record<string, number> = { IN_PROGRESS: 0, PENDING_REVIEW: 0, COMPLETED: 0, DELAYED: 0, BLOCKED: 0, NOT_STARTED: 0 };
    data.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });
    return [
      { name: 'In Progress', value: counts.IN_PROGRESS, color: '#818cf8' },
      { name: 'Review', value: counts.PENDING_REVIEW, color: '#fbbf24' },
      { name: 'Completed', value: counts.COMPLETED, color: '#34d399' },
      { name: 'Delayed', value: counts.DELAYED, color: '#fb7185' },
      { name: 'Blocked', value: counts.BLOCKED, color: '#f87171' },
      { name: 'Unstarted', value: counts.NOT_STARTED, color: '#64748b' },
    ].filter(d => d.value > 0);
  }, [data]);

  const statusTotal = useMemo(() => statusData.reduce((s, d) => s + d.value, 0), [statusData]);

  const deptData = useMemo(() => {
    const depts = ['Arch', 'MEP', 'Struct', 'Design', 'QA/QC', 'HSE', 'PM'];
    const deptMap: Record<string, { active: number, done: number }> = {};
    depts.forEach(d => deptMap[d] = { active: 0, done: 0 });
    data.forEach(t => {
      const shortDept = t.department.substring(0, 4);
      const match = depts.find(d => shortDept.startsWith(d));
      if (match) {
        if (t.status === 'COMPLETED') deptMap[match].done++;
        else deptMap[match].active++;
      }
    });
    return depts.map(d => ({ name: d, ...deptMap[d] }));
  }, [data]);

  const weeklyData = useMemo(() => {
    // Current stats from live data
    const currentCompleted = data.filter(t => t.status === 'COMPLETED').length;
    const currentTotal = data.length;
    
    // Synthesis of a trend: 4 historical mock points + 1 live point
    return [
      { name: 'W10', completed: 3, created: 5 },
      { name: 'W11', completed: 5, created: 4 },
      { name: 'W12', completed: 4, created: 6 },
      { name: 'W13', completed: 6, created: 7 },
      { name: 'Live', completed: currentCompleted, created: currentTotal },
    ];
  }, [data]);

  const delayedData = useMemo(() => {
    const delayedCount = data.filter(t => t.status === 'DELAYED').length;
    const criticalCount = data.filter(t => t.priority === 'CRITICAL' && t.status !== 'COMPLETED').length;
    
    return [
      { name: 'Apr 1', value: 2 },
      { name: 'Apr 3', value: 3 },
      { name: 'Apr 6', value: 4 },
      { name: 'Live', value: delayedCount + criticalCount },
    ];
  }, [data]);

  if (position === 'right') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ChartCard title="Tasks by Status" delay={0.2} height={190}>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <PieChart>
                <Pie data={statusData} cx="35%" cy="50%" innerRadius={38} outerRadius={64} paddingAngle={3} dataKey="value" stroke="none" labelLine={false} label={renderCustomLabel}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip total={statusTotal} />} />
                <Legend layout="vertical" verticalAlign="middle" align="right" formatter={(value: string) => <span style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 500 }}>{value}</span>} iconType="circle" iconSize={9} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 12 }}>No active tasks detected</div>
          )}
        </ChartCard>
        <ChartCard title="Tasks by Department" delay={0.25} height={165}>
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <BarChart data={deptData} barGap={2} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip content={<PremiumTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="active" name="Active" fill={palette.blue} radius={[4, 4, 0, 0]} />
              <Bar dataKey="done" name="Done" fill={palette.emerald} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    );
  }

  if (position === 'right-bottom') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ChartCard title="Weekly Completion Trend" delay={0.3} height={165}>
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <AreaChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip content={<PremiumTooltip />} />
              <Area type="monotone" dataKey="completed" stroke={palette.emerald} fill="rgba(16, 185, 129, 0.1)" strokeWidth={2.5} name="Completed" dot={{ fill: palette.emerald, r: 3 }} />
              <Area type="monotone" dataKey="created" stroke={palette.cyan} fill="rgba(6, 182, 212, 0.1)" strokeWidth={2} name="Created" dot={{ fill: palette.cyan, r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Delayed Deliverables" delay={0.35} height={155}>
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <LineChart data={delayedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip content={<PremiumTooltip />} />
              <Line type="monotone" dataKey="value" stroke={palette.rose} strokeWidth={2.5} name="Delayed" dot={{ fill: palette.rose, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
      <ChartCard title="Tasks by Status" delay={0.2} height={180}>
        {statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none" labelLine={false} label={renderCustomLabel}>
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<PieTooltip total={statusTotal} />} />
              <Legend verticalAlign="bottom" height={28} iconType="circle" iconSize={7} formatter={(v: string) => <span style={{ color: '#94a3b8', fontSize: 10 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 12 }}>Registry status: Idle. No data ingested.</div>
        )}
      </ChartCard>
      <ChartCard title="Tasks by Department" delay={0.25} height={180}>
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <BarChart data={deptData} barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="name" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip content={<PremiumTooltip />} />
            <Bar dataKey="active" name="Active" fill={palette.blue} radius={[4, 4, 0, 0]} />
            <Bar dataKey="done" name="Done" fill={palette.emerald} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
