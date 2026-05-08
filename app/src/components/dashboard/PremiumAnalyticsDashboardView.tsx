'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, Sector
} from 'recharts';
import {
  Database, Users, FolderOpen, CloudCog, CalendarClock, TrendingUp,
  TrendingDown, Lightbulb, AlertTriangle, Crown, Trophy, Zap,
  Search, CircleDot, RefreshCw, Download, FileText, FileImage
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { Task } from '@/lib/types';
import { useTimeZone } from '@/context/TimeZoneContext';
import EliteDropdown from '@/components/dashboard/EliteDropdown';

/* ── Elite Dark Theme Color Palette ── */
const THEME = {
  bgBase: 'transparent', // Neutralized from Deep Teal
  cardBg: 'rgba(0, 0, 0, 0.75)', // Slightly more opaque for better text grounding
  cardBorder: 'rgba(255, 255, 255, 0.2)', // Sharper borders
  textPrimary: '#ffffff',
  textSecondary: '#d1d5db', // Light gray for labels (better hierarchy than pure white)
  textMuted: 'rgba(255, 255, 255, 0.85)', // Very bright for axis ticks
  primary: '#B08D3E', // Brighter Gold
  secondary: '#a5f3fc', // Brighter Cyan
  accent: '#34d399', // Brighter Emerald
  warning: '#fbbf24', // Brighter Amber
  danger: '#f87171', // Brighter Red
};

const CHART_COLORS = [
  '#B08D3E', // Brighter Gold
  '#34d399', // Emerald
  '#a5f3fc', // Cyan
  '#fb923c', // Orange
  '#c084fc', // Purple
  '#f472b6', // Pink
  '#ffffff', // White
];

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

function DarkChartCard({ title, subtitle, children, delay = 0, height = '100%' }: { title: string, subtitle?: string, children: React.ReactNode, delay?: number, height?: string | number }) {
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ height: '100%' }}
    >
      <DarkGlassCard style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-6px)' : 'none',
        boxShadow: isHovered ? '0 30px 60px rgba(0, 0, 0, 0.6)' : 'none',
        border: isHovered ? `1px solid ${THEME.primary}40` : `1px solid ${THEME.cardBorder}`
      }}>
        <div style={{ padding: '20px 24px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
          <div>
            <h3 style={{ fontSize: '15px', color: THEME.textPrimary, margin: 0, fontWeight: 950, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>{title}</h3>
            {subtitle && <p style={{ fontSize: '10px', color: THEME.textMuted, margin: '6px 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{subtitle}</p>}
          </div>
        </div>
        <div style={{ flex: 1, padding: '8px 20px 20px', position: 'relative', minHeight: 0 }}>
          {mounted ? children : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.textMuted, fontSize: '12px', fontWeight: 600 }}>Loading Data...</div>
          )}
        </div>
      </DarkGlassCard>
    </motion.div>
  );
}

function DarkKPICard({ label, value, icon, color, delay, hoverData = [] }: { label: string, value: string | number, icon: any, color: string, delay: number, hoverData?: { name: string, value: number }[] }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ height: '100%', position: 'relative' }}
    >
      <DarkGlassCard style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: 'all 0.3s ease', transform: isHovered ? 'translateY(-4px)' : 'none', border: isHovered ? `1px solid ${color}` : `1px solid ${THEME.cardBorder}`, background: isHovered ? 'rgba(0, 0, 0, 0.95)' : THEME.cardBg, overflow: 'visible' }}>
        {/* Subtle glow */}
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%', width: '80px', height: '80px',
          background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
          pointerEvents: 'none'
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '100%', zIndex: 10, position: 'relative' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: `${color}15`, color: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${color}30`, flexShrink: 0
          }}>
            {icon}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ fontSize: '12px', color: THEME.textSecondary, margin: '0 0 4px 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
            <h4 style={{ fontSize: '28px', fontWeight: 800, color: THEME.textPrimary, margin: 0, lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>{value}</h4>
          </div>
        </div>

        {/* Hover Breakdown List */}
        <AnimatePresence>
          {isHovered && hoverData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                width: '280px',
                background: 'rgba(0, 0, 0, 0.98)',
                border: `1.5px solid ${color}80`,
                borderRadius: '12px',
                padding: '16px',
                marginTop: '12px',
                zIndex: 99999,
                boxShadow: `0 30px 60px rgba(0, 0, 0, 0.9), 0 0 25px ${color}40`,
                backdropFilter: 'blur(25px)',
                translateX: '-50%'
              }}
            >
              <p style={{ fontSize: 10, color: color, fontWeight: 950, textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.12em' }}>Data Breakdown</p>
              <div style={{ maxHeight: '240px', overflowY: 'auto', paddingRight: '4px', scrollbarWidth: 'thin', scrollbarColor: `${color}40 transparent` }}>
                {hoverData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, borderBottom: i < hoverData.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none', paddingBottom: 6 }}>
                    <span style={{ fontSize: 11, color: '#ffffff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '8px' }}>{d.name}</span>
                    <span style={{ fontSize: 12, color: '#ffffff', fontWeight: 950 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DarkGlassCard>
    </motion.div>
  );
}

/* ── Custom Tooltips for Recharts ── */
function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      padding: '16px 22px', borderRadius: '14px',
      background: 'rgba(0, 0, 0, 0.95)',
      border: `2px solid ${THEME.cardBorder}`,
      zIndex: 99999,
      backdropFilter: 'blur(25px)',
      boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(176, 141, 62, 0.2)',
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

function DarkDonutTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
  const color = d.payload.color || THEME.primary;
  return (
    <div style={{
      padding: '18px 24px', borderRadius: '16px', minWidth: '220px',
      background: 'rgba(10, 10, 15, 0.98)',
      border: `2px solid ${color}`,
      pointerEvents: 'none',
      zIndex: 1000,
      backdropFilter: 'blur(20px)',
      boxShadow: `0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px ${color}40`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: color, boxShadow: `0 0 10px ${color}` }} />
        <span style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{d.name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '32px', fontWeight: 950, color: '#ffffff', lineHeight: 1 }}>{d.value}</span>
        <span style={{ fontSize: '14px', color: THEME.textSecondary, fontWeight: 700 }}>UNITS</span>
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

function renderDarkDonutLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, fill }: any) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  if (percent < 0.04) return null;

  // LUMINOSITY CONTRAST ENGINE
  const getContrastColor = (hexColor: string) => {
    if (!hexColor || typeof hexColor !== 'string') return '#ffffff';
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(s => s + s).join('');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.65 ? '#000000' : '#ffffff';
  };

  const textColor = getContrastColor(fill);

  return (
    <text 
      x={x} y={y} 
      fill={textColor} 
      textAnchor="middle" 
      dominantBaseline="central" 
      fontSize="12" 
      fontWeight="950" 
      style={{ 
        pointerEvents: 'none', 
        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
        letterSpacing: '0.02em'
      }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

const darkAxisProps = {
  tick: { fill: THEME.textMuted, fontSize: 13, fontWeight: 800, fontFamily: 'Inter' },
  axisLine: { stroke: THEME.cardBorder, strokeWidth: 1.5 },
  tickLine: { stroke: THEME.cardBorder, strokeWidth: 1.5 },
};

function WrappingXAxisTick(props: any) {
  const { x, y, payload } = props;
  const words = (payload.value || '').split(/[\s-]+/);
  const processedWords = words.map((w: string) => w.length > 10 ? w.substring(0, 9) + '..' : w);
  
  return (
    <g transform={`translate(${x},${y})`}>
      {processedWords.slice(0, 3).map((word: string, i: number) => (
        <text
          key={i}
          x={0}
          y={i * 12}
          dy={12}
          textAnchor="middle"
          fill={THEME.textMuted}
          fontSize={10}
          fontWeight={950}
          fontFamily="Inter"
          style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          {word}
        </text>
      ))}
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

interface PremiumAnalyticsDashboardViewProps {
  tasks: Task[];
  previousPeriodTasks?: Task[];
  departments?: any[];
  members?: any[];
  search?: string;
  setSearch?: (val: string) => void;
  filterDept?: string[];
  setFilterDept?: (val: string[]) => void;
  availableDepts?: string[];
  filterType?: string[];
  setFilterType?: (val: string[]) => void;
  availableTypes?: string[];
  filterCDE?: string[];
  setFilterCDE?: (val: string[]) => void;
  availableCDEs?: string[];
  filterPrecinct?: string[];
  setFilterPrecinct?: (val: string[]) => void;
  availablePrecincts?: string[];
  filterSubmitter?: string[];
  setFilterSubmitter?: (val: string[]) => void;
  availableSubmitters?: string[];
}

export default function PremiumAnalyticsDashboardView({
  tasks,
  previousPeriodTasks = [],
  departments = [],
  members = [],
  search = '', setSearch,
  filterDept = [], setFilterDept, availableDepts = [],
  filterType = [], setFilterType, availableTypes = [],
  filterCDE = [], setFilterCDE, availableCDEs = [],
  filterPrecinct = [], setFilterPrecinct, availablePrecincts = [],
  filterSubmitter = [], setFilterSubmitter, availableSubmitters = [],
  isExportMode = false,
  id
}: PremiumAnalyticsDashboardViewProps & { isExportMode?: boolean, id?: string }) {
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // ─── Data Computations (similar to original) ─────────────────────────
  const { kpiStats, categoryData, timelineData, precinctData, submitterData, typeData, typeTotal, cdeData, cdeTotal } = useMemo(() => {
    const totalDeliverables = tasks.length;

    const getResolvedDept = (raw: string) => {
      const d = (departments || []).find(dept => dept.id === raw || dept.name === raw);
      return d ? d.name : (raw || 'General');
    };

    const getResolvedSubmittersForTask = (t: Task) => {
      const names = Array.isArray(t.submitterName) ? t.submitterName : (t.submitterName ? [t.submitterName] : []);
      const ids = Array.isArray(t.submitterId) ? t.submitterId : (t.submitterId ? [t.submitterId] : []);
      const emails = Array.isArray(t.submitterEmail) ? t.submitterEmail : (t.submitterEmail ? [t.submitterEmail] : []);
      
      const resolvedNames = new Set<string>();
      let foundAny = false;

      names.forEach(n => { if (n) { resolvedNames.add(n); foundAny = true; } });
      
      ids.forEach(id => {
        if (!id) return;
        const m = (members || []).find(sm => sm.id === id);
        if (m?.name) { resolvedNames.add(m.name); foundAny = true; }
      });
      
      emails.forEach(email => {
        if (!email) return;
        const m = (members || []).find(sm => sm.email.toLowerCase() === email.toLowerCase());
        if (m?.name) { resolvedNames.add(m.name); foundAny = true; }
      });
      
      if (!foundAny) {
        if (emails.length > 0 && emails[0]) {
          resolvedNames.add(emails[0]);
        } else {
          resolvedNames.add('Unassigned');
        }
      }
      
      return Array.from(resolvedNames);
    };

    const categoriesSet = new Set<string>();
    tasks.forEach(t => {
      const depts = Array.isArray(t.department) ? t.department : (t.department ? [t.department] : []);
      depts.forEach(d => categoriesSet.add(getResolvedDept(d)));
    });

    const submittersSet = new Set<string>();
    tasks.forEach(t => {
      getResolvedSubmittersForTask(t).forEach(name => submittersSet.add(name));
    });

    // Category Data
    const catCounts: Record<string, number> = {};
    tasks.forEach(t => {
      const depts = Array.isArray(t.department) ? t.department : (t.department ? [t.department] : []);
      depts.forEach(d => {
        const name = getResolvedDept(d);
        catCounts[name] = (catCounts[name] || 0) + 1;
      });
    });
    const categoryData = Object.entries(catCounts)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value);

    // Timeline Data
    const monthMap: Record<string, number> = {};
    tasks.forEach(t => {
      const dateStr = t.submittingDate || t.createdAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = (monthMap[key] || 0) + 1;
    });
    const timelineData = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => {
        const [y, m] = month.split('-');
        const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return { name: `${mNames[parseInt(m) - 1]} ${y.slice(2)}`, value: count };
      });

    // Precinct Data
    const precinctCounts: Record<string, number> = {};
    tasks.forEach(t => {
      const p = t.precinct ? t.precinct.trim().toUpperCase() : 'N/A';
      precinctCounts[p] = (precinctCounts[p] || 0) + 1;
    });
    const precinctData = Object.entries(precinctCounts)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value);

    // Submitter Data
    const subCounts: Record<string, number> = {};
    tasks.forEach(t => {
      getResolvedSubmittersForTask(t).forEach(name => {
        subCounts[name] = (subCounts[name] || 0) + 1;
      });
    });
    const submitterData = Object.entries(subCounts)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value);

    // Type Data
    const typeCounts: Record<string, number> = {};
    tasks.forEach(t => {
      const legacyTypes = Array.isArray(t.deliverableType) ? t.deliverableType : (t.deliverableType ? [t.deliverableType] : []);
      const vectorTypes = (t.vectors || []).map(v => v.type);
      const allTypes = Array.from(new Set([...legacyTypes, ...vectorTypes].map(v => v.trim().toUpperCase())));
      allTypes.forEach(dt => { typeCounts[dt] = (typeCounts[dt] || 0) + 1; });
    });
    const typeData = Object.entries(typeCounts)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
    const typeTotal = typeData.reduce((s, d) => s + d.value, 0);
    const primaryType = typeData[0]?.name || '-';

    // CDE Data
    const cdeCounts: Record<string, number> = {};
    tasks.forEach(t => {
      const legacyCdes = Array.isArray(t.cde) ? t.cde : (t.cde ? [t.cde] : []);
      const vectorCdes = (t.vectors || []).map(v => v.cde);
      const allCdes = Array.from(new Set([...legacyCdes, ...vectorCdes].map(v => v.trim().toUpperCase())));
      allCdes.forEach(c => { cdeCounts[c] = (cdeCounts[c] || 0) + 1; });
    });
    const cdeData = Object.entries(cdeCounts)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[(i + 4) % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
    const cdeTotal = cdeData.reduce((s, d) => s + d.value, 0);

    return {
      kpiStats: {
        totalDeliverables,
        activeCategories: categoriesSet.size,
        activeSubmitters: submittersSet.size,
        primaryType,
      },
      categoryData, timelineData, precinctData, submitterData, typeData, typeTotal, cdeData, cdeTotal
    };
  }, [tasks, departments, members]);

  // ─── Export Functionality ──────────────────────────────────────────────
  const exportDashboard = async (format: 'pdf' | 'png') => {
    if (!dashboardRef.current) return;
    setIsExporting(true);

    try {
      // Temporarily adjust styles for a perfect capture if needed
      const element = dashboardRef.current;
      const originalHeight = element.style.height;
      const originalMaxHeight = element.style.maxHeight;
      const originalOverflow = element.style.overflow;

      // Ensure we capture everything
      element.style.height = 'auto';
      element.style.maxHeight = 'none';
      element.style.overflow = 'visible';

      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: THEME.bgBase,
        logging: false,
        onclone: (clonedDoc) => {
          // You can modify the cloned DOM before rendering if needed
          const clonedElement = clonedDoc.getElementById('premium-dashboard-export');
          if (clonedElement) {
            clonedElement.style.padding = '32px'; // Add padding for the export
          }
        }
      });

      // Restore original styles
      element.style.height = originalHeight;
      element.style.maxHeight = originalMaxHeight;
      element.style.overflow = originalOverflow;

      const imgData = canvas.toDataURL('image/png');

      if (format === 'png') {
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `Analytics_Dashboard_${new Date().toISOString().split('T')[0]}.png`;
        link.click();
      } else {
        // PDF Export - Landscape A4
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Calculate image dimensions to fit the page perfectly while maintaining aspect ratio
        const imgProps = pdf.getImageProperties(imgData);
        const margin = 10;
        const targetWidth = pdfWidth - (margin * 2);
        const targetHeight = pdfHeight - (margin * 2);

        const imgRatio = imgProps.width / imgProps.height;
        const targetRatio = targetWidth / targetHeight;

        let finalWidth, finalHeight;
        if (imgRatio > targetRatio) {
          finalWidth = targetWidth;
          finalHeight = targetWidth / imgRatio;
        } else {
          finalHeight = targetHeight;
          finalWidth = targetHeight * imgRatio;
        }

        // Center the image
        const xOffset = margin + (targetWidth - finalWidth) / 2;
        const yOffset = margin + (targetHeight - finalHeight) / 2;

        pdf.setFillColor(THEME.bgBase);
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
        pdf.save(`Analytics_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export dashboard. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div id={id || "analytics-dashboard-export-root"} style={{
      background: isExportMode ? '#0d1117' : THEME.bgBase,
      minHeight: isExportMode ? '900px' : '100%',
      height: isExportMode ? '900px' : undefined,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, sans-serif',
      overflow: 'hidden',
    }}>

      {/* ── Filters Bar ── */}
      {!isExportMode && (
        <DarkGlassCard data-html2canvas-ignore="true" style={{ padding: 0, overflow: 'visible', margin: '0 32px' }}>
          <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, rowGap: 10, flexWrap: 'wrap', position: 'relative', zIndex: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(208, 171, 130, 0.1)', color: '#d0ab82', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 950, color: THEME.textPrimary, margin: 0 }}>Deliverables Dashboard</h2>
                <p style={{ fontSize: 11, color: THEME.textSecondary, margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}> {tasks.length} Records</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, rowGap: 8, marginLeft: 'auto', flexWrap: 'nowrap', justifyContent: 'flex-end', maxWidth: '100%', overflow: 'hidden' }}>
              {setFilterDept && (
                <EliteDropdown value={filterDept} options={availableDepts.map(s => ({ label: s, value: s }))} onChange={setFilterDept} menuLabel="Category" isMulti allLabel="All Categories" />
              )}
              {setFilterType && (
                <EliteDropdown value={filterType} options={availableTypes.map(s => ({ label: s, value: s }))} onChange={setFilterType} menuLabel="Type" isMulti allLabel="All Types" />
              )}
              {setFilterCDE && (
                <EliteDropdown value={filterCDE} options={availableCDEs.map(s => ({ label: s, value: s }))} onChange={setFilterCDE} menuLabel="CDE" isMulti allLabel="All CDE" />
              )}
              {setFilterPrecinct && (
                <EliteDropdown value={filterPrecinct} options={availablePrecincts.map(s => ({ label: s, value: s }))} onChange={setFilterPrecinct} menuLabel="Precinct" isMulti allLabel="All Precincts" />
              )}
              {setFilterSubmitter && (
                <EliteDropdown value={filterSubmitter} options={availableSubmitters.map(s => ({ label: s, value: s }))} onChange={setFilterSubmitter} menuLabel="Submitter" isMulti allLabel="All Submitters" />
              )}
              {((filterDept.length > 0 && !filterDept.includes('All Categories')) ||
                (filterType.length > 0 && !filterType.includes('All Types')) ||
                (filterCDE.length > 0 && !filterCDE.includes('All CDE')) ||
                (filterPrecinct.length > 0 && !filterPrecinct.includes('All Precincts')) ||
                (filterSubmitter.length > 0 && !filterSubmitter.includes('All Submitters'))
              ) && (
                  <button
                    onClick={() => {
                      if (setFilterDept) setFilterDept(['All Categories']);
                      if (setFilterType) setFilterType(['All Types']);
                      if (setFilterCDE) setFilterCDE(['All CDE']);
                      if (setFilterPrecinct) setFilterPrecinct(['All Precincts']);
                      if (setFilterSubmitter) setFilterSubmitter(['All Submitters']);
                    }}
                    style={{
                      background: 'transparent', border: 'none', color: '#ef4444', fontSize: 11, fontWeight: 700, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}
                  >
                    Clear Filters
                  </button>
                )}
            </div>
          </div>
        </DarkGlassCard>
      )}

      {/* ── Dashboard Content to Export ── */}
      <div
        id="premium-dashboard-export"
        ref={dashboardRef}
        style={{
          flex: 1,
          padding: isExportMode ? '14px 18px' : '32px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: isExportMode ? '14px' : '32px',
          height: isExportMode ? '100%' : 'calc(100vh - 110px)',
          minHeight: isExportMode ? '0' : '1350px',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* KPI Top Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: isExportMode ? '10px' : '32px',
          height: isExportMode ? '76px' : '120px',
          flexShrink: 0,
          position: 'relative',
          zIndex: 50
        }}>
          <DarkKPICard label="Total Deliverables" value={kpiStats.totalDeliverables} icon={<Database size={isExportMode ? 15 : 20} />} color={THEME.primary} delay={0.1} hoverData={categoryData} />
          <DarkKPICard label="Active Categories" value={kpiStats.activeCategories} icon={<FolderOpen size={isExportMode ? 15 : 20} />} color={THEME.secondary} delay={0.2} hoverData={categoryData} />
          <DarkKPICard label="Team Members" value={kpiStats.activeSubmitters} icon={<Users size={isExportMode ? 15 : 20} />} color={THEME.accent} delay={0.3} hoverData={submitterData} />
          <DarkKPICard label="Primary Type" value={kpiStats.primaryType} icon={<FileText size={isExportMode ? 15 : 20} />} color="#c084fc" delay={0.35} hoverData={typeData} />
          <DarkKPICard label="Primary Environment" value={cdeData[0]?.name || '-'} icon={<CloudCog size={isExportMode ? 15 : 20} />} color={THEME.warning} delay={0.4} hoverData={cdeData} />
        </div>

        {/* Charts Grid — fills all remaining vertical space */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: isExportMode ? '10px' : '32px',
          flex: 1,
          minHeight: 0
        }}>

          {/* Top Left: Activity Timeline */}
          <DarkChartCard title="Submission Timeline" subtitle="Monthly activity over time" delay={0.5}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THEME.primary} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={THEME.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.cardBorder} />
                <XAxis dataKey="name" {...darkAxisProps} />
                <YAxis {...darkAxisProps} />
                <Tooltip content={<DarkTooltip />} />
                <Area type="monotone" dataKey="value" stroke={THEME.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </DarkChartCard>

          {/* Top Right: Deliverables by Category */}
          <DarkChartCard title="Deliverables by Category" subtitle="Top organizational distribution" delay={0.6}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData.slice(0, 12)} margin={{ top: 10, right: 30, left: -10, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={THEME.cardBorder} />
                <XAxis type="number" {...darkAxisProps} />
                <YAxis dataKey="name" type="category" width={100} {...darkAxisProps} tick={{ ...darkAxisProps.tick, fontSize: 10 }} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: THEME.cardBorder, opacity: 0.4 }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={false} label={{ position: 'right', fill: THEME.textPrimary, fontSize: 11, fontWeight: 900 }}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </DarkChartCard>

          {/* Bottom Left: Precinct Distribution */}
          <DarkChartCard title="Precinct Distribution" subtitle="Activity by project location" delay={0.7}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={precinctData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.cardBorder} />
                <XAxis
                  dataKey="name"
                  axisLine={darkAxisProps.axisLine}
                  tickLine={darkAxisProps.tickLine}
                  tick={<WrappingXAxisTick />}
                  interval={0}
                  height={50}
                />
                <YAxis {...darkAxisProps} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: THEME.cardBorder, opacity: 0.4 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={42} isAnimationActive={false} label={{ position: 'top', fill: THEME.textPrimary, fontSize: 11, fontWeight: 900 }}>
                  {precinctData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </DarkChartCard>

          {/* Bottom Right: Split Donut Charts (Type & CDE) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isExportMode ? '10px' : '20px', minHeight: 0 }}>
            <DarkChartCard title="Asset Types" subtitle="Deliverable classification" delay={0.8}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={typeData} 
                    cx="50%" 
                    cy="45%" 
                    innerRadius="40%" 
                    outerRadius="72%" 
                    paddingAngle={3} 
                    minAngle={8}
                    dataKey="value" 
                    stroke="none" 
                    labelLine={false} 
                    label={renderDarkDonutLabel} 
                    isAnimationActive={false}
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkDonutTooltip total={typeTotal} />} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: 10, color: THEME.textPrimary, textTransform: 'uppercase', fontWeight: 950, paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </DarkChartCard>

            <DarkChartCard title="CDE Environments" subtitle="System utilization" delay={0.9}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={cdeData} 
                    cx="50%" 
                    cy="45%" 
                    innerRadius="40%" 
                    outerRadius="72%" 
                    paddingAngle={3} 
                    minAngle={8}
                    dataKey="value" 
                    stroke="none" 
                    labelLine={false} 
                    label={renderDarkDonutLabel} 
                    isAnimationActive={false}
                  >
                    {cdeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkDonutTooltip total={cdeTotal} />} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: 10, color: THEME.textPrimary, textTransform: 'uppercase', fontWeight: 950, paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </DarkChartCard>
          </div>

        </div>
      </div>
    </div>
  );
}
