'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  RotateCcw,
  Send,
  Bot,
  User,
  Loader2,
  AlertCircle,
  Sparkles,
  Menu,
  History,
  Trash2,
  ArrowLeft,
  Plus,
  Maximize2,
  Minimize2,
  Copy,
  Download
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import type { AgentInputItem } from '@openai/agents-core';
import { supabaseBrowser } from '@/lib/supabase';
import { saveDoc, removeDoc, rowToDoc } from '@/lib/supabaseData';

// Typewriter Component for smooth typing animation of new assistant messages
function TypewriterText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let index = 0;
    // Calculate speed based on text length to complete under 1.2 seconds
    const totalChars = text.length;
    const duration = Math.min(1200, totalChars * 12); // max 1.2 seconds
    const intervalTime = Math.max(10, Math.floor(duration / totalChars));
    const charsPerStep = Math.max(1, Math.ceil(totalChars / (duration / intervalTime)));

    setDisplayedText('');
    
    const timer = setInterval(() => {
      index += charsPerStep;
      if (index >= text.length) {
        setDisplayedText(text);
        clearInterval(timer);
        onComplete?.();
      } else {
        setDisplayedText(text.slice(0, index));
      }
      
      // Optically scroll the chat messages window down
      const chatContainer = document.getElementById('chat-messages-container') || document.getElementById('fs-chat-messages-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, intervalTime);
    
    return () => clearInterval(timer);
  }, [text]);
  
  return <span style={{ whiteSpace: 'pre-wrap' }}>{displayedText}</span>;
}

// Table Skeleton displayed during typewriter typing of assistant messages
function TableSkeleton() {
  return (
    <div style={{
      width: '100%',
      margin: '12px 0',
      borderRadius: '8px',
      border: '1px dashed rgba(208, 171, 130, 0.4)',
      padding: '12px',
      background: 'rgba(255, 255, 255, 0.5)',
      boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.02)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Loader2 size={12} className="animate-spin" color="var(--gold)" />
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--teal)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Preparing Interactive Table...
        </span>
      </div>
      {/* Header skeleton row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <div className="animate-pulse" style={{ flex: 1, height: '24px', borderRadius: '4px', background: 'rgba(0, 63, 73, 0.1)' }} />
        <div className="animate-pulse" style={{ flex: 1, height: '24px', borderRadius: '4px', background: 'rgba(0, 63, 73, 0.1)' }} />
        <div className="animate-pulse" style={{ flex: 1, height: '24px', borderRadius: '4px', background: 'rgba(0, 63, 73, 0.1)' }} />
      </div>
      {/* Row skeletons */}
      {[1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
          <div className="animate-pulse" style={{ flex: 1, height: '18px', borderRadius: '4px', background: 'rgba(0, 63, 73, 0.04)' }} />
          <div className="animate-pulse" style={{ flex: 1, height: '18px', borderRadius: '4px', background: 'rgba(0, 63, 73, 0.04)' }} />
          <div className="animate-pulse" style={{ flex: 1, height: '18px', borderRadius: '4px', background: 'rgba(0, 63, 73, 0.04)' }} />
        </div>
      ))}
    </div>
  );
}

interface TableData {
  response_type: 'table';
  title?: string;
  columns: string[];
  rows: any[][];
}

// Beautiful, ultra-premium Interactive Table with Copy (TSV for Excel) and CSV Export features
function InteractiveTable({ data }: { data: TableData }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      // Build a tab-separated string (perfect for pasting directly into Excel/Google Sheets)
      const headerRow = data.columns.join('\t');
      const bodyRows = data.rows.map(row => row.map(cell => String(cell ?? 'Not mentioned in this report.')).join('\t')).join('\n');
      const fullTsv = `${headerRow}\n${bodyRows}`;
      
      navigator.clipboard.writeText(fullTsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy table:', err);
    }
  };

  const handleExportCSV = () => {
    try {
      const escapeCsvValue = (val: any) => {
        const str = String(val ?? 'Not mentioned in this report.');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const headerRow = data.columns.map(escapeCsvValue).join(',');
      const bodyRows = data.rows.map(row => row.map(escapeCsvValue).join(',')).join('\n');
      const csvContent = `\uFEFF${headerRow}\n${bodyRows}`; // UTF-8 BOM for proper Arabic/special char rendering in Excel
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${(data.title || 'Table_Export').replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  return (
    <div style={{
      width: '100%',
      margin: '14px 0',
      borderRadius: '10px',
      border: '1px solid rgba(0, 63, 73, 0.12)',
      background: '#ffffff',
      boxShadow: '0 4px 20px rgba(0, 63, 73, 0.03)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Table Header Section with Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'rgba(0, 63, 73, 0.02)',
        borderBottom: '1px solid rgba(0, 63, 73, 0.08)'
      }}>
        <span style={{
          fontFamily: 'var(--font-primary), serif',
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--teal)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '65%'
        }}>
          {data.title || 'Interactive Results'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleCopy}
            title="Copy to Clipboard (Excel-friendly)"
            style={{
              background: copied ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
              border: '1px solid rgba(0, 63, 73, 0.15)',
              borderRadius: '6px',
              padding: '4px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: 600,
              color: copied ? '#10b981' : 'var(--teal)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!copied) e.currentTarget.style.background = 'rgba(0, 63, 73, 0.05)';
            }}
            onMouseLeave={(e) => {
              if (!copied) e.currentTarget.style.background = 'transparent';
            }}
          >
            <Copy size={11} color={copied ? '#10b981' : 'var(--teal)'} />
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handleExportCSV}
            title="Download CSV file"
            style={{
              background: 'transparent',
              border: '1px solid rgba(0, 63, 73, 0.15)',
              borderRadius: '6px',
              padding: '4px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--teal)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 63, 73, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Download size={11} color="var(--teal)" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Scrollable Table Content */}
      <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '12.5px',
          textAlign: 'left',
          minWidth: '100%'
        }}>
          <thead>
            <tr style={{ background: 'var(--teal)', borderBottom: '2.5px solid var(--gold)' }}>
              {data.columns.map((col, idx) => (
                <th key={idx} style={{
                  padding: '10px 12px',
                  fontWeight: 700,
                  color: 'var(--cotton)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  fontSize: '11px',
                  borderRight: idx < data.columns.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                  whiteSpace: 'nowrap'
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 ? (
              <tr>
                <td colSpan={data.columns.length} style={{
                  padding: '20px 12px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic'
                }}>
                  No records found.
                </td>
              </tr>
            ) : (
              data.rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  style={{
                    background: rowIdx % 2 === 0 ? '#ffffff' : '#fcfcfa',
                    borderBottom: '1px solid rgba(0, 63, 73, 0.06)',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(208, 171, 130, 0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = rowIdx % 2 === 0 ? '#ffffff' : '#fcfcfa'}
                >
                  {row.map((cell, cellIdx) => {
                    const cellStr = cell !== null && cell !== undefined ? String(cell) : '';
                    const isMuted = cellStr === '' || cellStr.toLowerCase() === 'not mentioned in this report.';
                    const displayVal = isMuted ? 'Not mentioned in this report.' : cellStr;
                    return (
                      <td key={cellIdx} style={{
                        padding: '9px 12px',
                        color: isMuted ? 'var(--text-muted)' : '#003f49',
                        fontStyle: isMuted ? 'italic' : 'normal',
                        fontSize: isMuted ? '11px' : '12.5px',
                        borderRight: cellIdx < row.length - 1 ? '1px solid rgba(0, 63, 73, 0.04)' : 'none',
                        whiteSpace: 'nowrap'
                      }}>
                        {displayVal}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface MessagePart {
  type: 'text' | 'table' | 'chart' | 'dashboard';
  content: string | TableData | ChartData | DashboardData;
}

// Clean text by stripping JSON blocks to avoid typing raw brackets/quotes
function cleanTextForTypewriter(text: string): string {
  if (!text) return '';
  return text.replace(/```json\s*[\s\S]*?\s*```/g, '\n\n');
}

// Chart Skeleton displayed during typewriter typing of assistant messages
function ChartSkeleton() {
  return (
    <div style={{
      width: '100%',
      margin: '12px 0',
      borderRadius: '10px',
      border: '1px dashed rgba(208, 171, 130, 0.4)',
      padding: '16px',
      background: 'rgba(255, 255, 255, 0.5)',
      boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.02)',
      height: '240px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '12px'
    }}>
      <Loader2 size={24} className="animate-spin" color="var(--gold)" />
      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--teal)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Rendering Analytical Chart...
      </span>
    </div>
  );
}

interface ChartData {
  response_type: 'chart';
  chart_type: 'bar' | 'pie' | 'line' | 'stacked_bar' | 'donut';
  title: string;
  x_axis?: string;
  y_axis?: string;
  data: Array<Record<string, any>>;
}

interface DashboardData {
  response_type: 'dashboard';
  title?: string;
  charts: ChartData[];
}

const CHART_COLORS = [
  '#003f49', // Dark Teal
  '#d0ab82', // Gold
  '#10b981', // Emerald
  '#0284c7', // Sky Blue
  '#6366f1', // Purple/Indigo
  '#ef4444', // Coral Red
  '#f59e0b', // Amber
  '#ec4899', // Pink
];

function InteractiveChart({ data }: { data: ChartData }) {
  const chartType = data.chart_type || 'bar';
  const title = data.title || 'Chart';
  const chartData = data.data || [];
  const xAxisKey = data.x_axis || (chartData[0] ? Object.keys(chartData[0])[0] : '');
  const yAxisKey = data.y_axis || (chartData[0] ? Object.keys(chartData[0])[1] : '');

  if (chartData.length === 0) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        background: '#ffffff',
        border: '1px solid rgba(0, 63, 73, 0.12)',
        borderRadius: '10px',
        color: 'var(--text-secondary)',
        fontSize: '13px',
        fontStyle: 'italic'
      }}>
        No chart data available.
      </div>
    );
  }

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 63, 73, 0.05)" />
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 10, fill: '#003f49' }} stroke="rgba(0, 63, 73, 0.15)" />
            <YAxis tick={{ fontSize: 10, fill: '#003f49' }} stroke="rgba(0, 63, 73, 0.15)" />
            <RechartsTooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(249, 248, 242, 0.98)', color: 'var(--teal)' }} />
            <RechartsLegend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            <Line type="monotone" dataKey={yAxisKey} stroke="#003f49" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ strokeWidth: 2, r: 3 }} />
          </LineChart>
        );
      case 'pie':
      case 'donut':
        const isDonut = chartType === 'donut';
        return (
          <PieChart>
            <Pie
              data={chartData}
              dataKey={yAxisKey}
              nameKey={xAxisKey}
              cx="50%"
              cy="50%"
              outerRadius={isDonut ? 75 : 85}
              innerRadius={isDonut ? 45 : 0}
              paddingAngle={isDonut ? 3 : 0}
              label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
              labelLine={{ stroke: 'rgba(0, 63, 73, 0.25)', strokeWidth: 1 }}
              style={{ fontSize: '9px', fontWeight: 600, fill: '#003f49' }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(249, 248, 242, 0.98)' }} />
          </PieChart>
        );
      case 'stacked_bar':
        const stackKeys = Object.keys(chartData[0] || {}).filter(k => k !== xAxisKey);
        return (
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 63, 73, 0.05)" />
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 10, fill: '#003f49' }} stroke="rgba(0, 63, 73, 0.15)" />
            <YAxis tick={{ fontSize: 10, fill: '#003f49' }} stroke="rgba(0, 63, 73, 0.15)" />
            <RechartsTooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(249, 248, 242, 0.98)' }} />
            <RechartsLegend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            {stackKeys.map((key, idx) => (
              <Bar key={key} dataKey={key} stackId="a" fill={CHART_COLORS[idx % CHART_COLORS.length]} radius={idx === stackKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        );
      case 'bar':
      default:
        return (
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 63, 73, 0.05)" />
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 10, fill: '#003f49' }} stroke="rgba(0, 63, 73, 0.15)" />
            <YAxis tick={{ fontSize: 10, fill: '#003f49' }} stroke="rgba(0, 63, 73, 0.15)" />
            <RechartsTooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(249, 248, 242, 0.98)' }} />
            <RechartsLegend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            <Bar dataKey={yAxisKey} fill="#003f49" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#003f49' : CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        );
    }
  };

  return (
    <div style={{
      width: '100%',
      margin: '14px 0',
      borderRadius: '10px',
      border: '1px solid rgba(0, 63, 73, 0.12)',
      background: '#ffffff',
      boxShadow: '0 4px 20px rgba(0, 63, 73, 0.03)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'rgba(0, 63, 73, 0.02)',
        borderBottom: '1px solid rgba(0, 63, 73, 0.08)'
      }}>
        <span style={{
          fontFamily: 'var(--font-primary), serif',
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--teal)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          📊 {title}
        </span>
        <span style={{
          fontSize: '9px',
          fontWeight: 600,
          color: 'var(--gold)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          border: '1.5px solid var(--gold)',
          borderRadius: '4px',
          padding: '1px 5px',
        }}>
          {chartType.replace('_', ' ')}
        </span>
      </div>

      <div style={{ width: '100%', height: '240px', padding: '16px 14px 10px 14px', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DashboardView({ data }: { data: DashboardData }) {
  return (
    <div style={{
      width: '100%',
      margin: '16px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }}>
      {data.title && (
        <h3 style={{
          fontFamily: 'var(--font-primary), serif',
          fontSize: '14px',
          fontWeight: 700,
          color: 'var(--teal)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          margin: '0',
          borderBottom: '2.5px solid var(--gold)',
          paddingBottom: '6px',
          display: 'inline-block'
        }}>
          💼 {data.title}
        </h3>
      )}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '14px',
        width: '100%'
      }}>
        {data.charts.map((chart, idx) => (
          <InteractiveChart key={idx} data={chart} />
        ))}
      </div>
    </div>
  );
}

// Parse markdown message into rich text sections and structured interactive tables
function parseMessageContent(text: string): MessagePart[] {
  if (!text) return [];

  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed) {
        if (parsed.response_type === 'table') {
          return [{ type: 'table', content: parsed }];
        }
        if (parsed.response_type === 'chart') {
          return [{ type: 'chart', content: parsed }];
        }
        if (parsed.response_type === 'dashboard') {
          return [{ type: 'dashboard', content: parsed }];
        }
      }
    } catch (_) {}
  }

  const parts: MessagePart[] = [];
  const regex = /```json\s*([\s\S]*?)\s*```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    
    if (matchIndex > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, matchIndex)
      });
    }

    const jsonText = match[1].trim();
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed) {
        if (parsed.response_type === 'table') {
          parts.push({
            type: 'table',
            content: parsed
          });
        } else if (parsed.response_type === 'chart') {
          parts.push({
            type: 'chart',
            content: parsed
          });
        } else if (parsed.response_type === 'dashboard') {
          parts.push({
            type: 'dashboard',
            content: parsed
          });
        } else {
          parts.push({
            type: 'text',
            content: match[0]
          });
        }
      } else {
        parts.push({
          type: 'text',
          content: match[0]
        });
      }
    } catch (_) {
      parts.push({
        type: 'text',
        content: match[0]
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  return parts;
}

// Rich Message Bubble renderer combining text and interactive tables
function MessageContentRenderer({
  text,
  isAssistant,
  completedTyping,
  onComplete
}: {
  text: string;
  isAssistant: boolean;
  completedTyping: boolean;
  onComplete: () => void;
}) {
  if (!isAssistant) {
    return <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>;
  }

  // Check if message has a JSON table or chart block
  const hasTable = text.includes('```json') && text.includes('"response_type"') && text.includes('"table"');
  const hasChart = text.includes('```json') && text.includes('"response_type"') && (text.includes('"chart"') || text.includes('"dashboard"'));

  if (!completedTyping) {
    const cleanText = cleanTextForTypewriter(text);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <TypewriterText text={cleanText} onComplete={onComplete} />
        {hasTable && <TableSkeleton />}
        {hasChart && <ChartSkeleton />}
      </div>
    );
  }

  const parts = parseMessageContent(text);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {parts.map((part, idx) => {
        if (part.type === 'table') {
          return <InteractiveTable key={idx} data={part.content as TableData} />;
        }
        if (part.type === 'chart') {
          return <InteractiveChart key={idx} data={part.content as ChartData} />;
        }
        if (part.type === 'dashboard') {
          return <DashboardView key={idx} data={part.content as DashboardData} />;
        }
        return <span key={idx} style={{ whiteSpace: 'pre-wrap' }}>{part.content as string}</span>;
      })}
    </div>
  );
}


// Color tokens: all textColors are solid hex values safe for light backgrounds
const suggestedPrompts = [
  {
    category: 'Deliverables Reports',
    icon: '📊',
    bg: '#f0f8fa',
    border: '#5eaabb',
    textColor: '#003f49',
    labelBg: '#cce8ed',
    prompts: [
      { text: 'Deliverables by Submitter', full: 'How many deliverables were submitted, classified by submitter?' },
      { text: 'Top Submitter Metric',       full: 'Which submitter has the highest number of deliverables?' },
      { text: 'Deliverables Statuses',     full: 'Summarize the statuses of recent deliverables.' },
    ]
  },
  {
    category: 'BIM Review Report',
    icon: '🏢',
    bg: '#fdf8f0',
    border: '#d4a96a',
    textColor: '#7a4f1d',
    labelBg: '#fef3c7',
    prompts: [
      { text: 'Weekly BIM Reviews',        full: 'Show the summary of BIM reviews completed this week.' },
      { text: 'Top BIM Reviewer',         full: 'Which reviewer has completed the most BIM reviews?' },
      { text: 'Delayed & High-Priority',   full: 'List all delayed or high-priority BIM review items.' },
    ]
  },
  {
    category: 'Report Insights',
    icon: '✨',
    bg: '#edfcf4',
    border: '#6ee7b7',
    textColor: '#065f46',
    labelBg: '#d1fae5',
    prompts: [
      { text: 'Cross-Report Compare',      full: 'Compare Deliverables Reports and BIM Review Report metrics.' },
      { text: 'Discipline Distribution',   full: 'Show the general distribution of tasks by discipline.' },
      { text: 'Daily Summary',             full: 'Generate a summary of today\'s activities.' },
    ]
  }
];

export default function FloatingAIButton() {
  const { user, userProfile, loading, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  const formatMsgTime = (timestamp?: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toMillis ? new Date(timestamp.toMillis()) : new Date(timestamp);
      return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (_) {
      return '';
    }
  };

  const formatSeparatorDate = (timestamp: any) => {
    try {
      const msgDate = timestamp.toMillis ? new Date(timestamp.toMillis()) : new Date(timestamp);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      
      if (msgDate.toDateString() === today.toDateString()) {
        return 'Today';
      }
      if (msgDate.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      return msgDate.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (_) {
      return '';
    }
  };

  const showDateSeparator = (msgIdx: number) => {
    if (msgIdx === 0) return true;
    const prevMsg = visibleMessages[msgIdx - 1];
    const currMsg = visibleMessages[msgIdx];
    const prevTime = (prevMsg as any).timestamp;
    const currTime = (currMsg as any).timestamp;
    if (!prevTime || !currTime) return false;
    
    try {
      const prevDate = prevTime.toMillis ? new Date(prevTime.toMillis()) : new Date(prevTime);
      const currDate = currTime.toMillis ? new Date(currTime.toMillis()) : new Date(currTime);
      return prevDate.toDateString() !== currDate.toDateString();
    } catch (_) {
      return false;
    }
  };
  const [history, setHistory] = useState<AgentInputItem[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [completedTypingIndices, setCompletedTypingIndices] = useState<Record<number, boolean>>({});

  // Firestore & Session States
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSessionsList, setShowSessionsList] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmDeleteId, setShowConfirmDeleteId] = useState<string | null>(null);
  const [showConfirmDeleteAll, setShowConfirmDeleteAll] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isDeletingSessionId, setIsDeletingSessionId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Guard: Avoid hydration mismatch by waiting for client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  const loadSessions = async () => {
    if (!user) return;
    try {
      const { data } = await supabaseBrowser.from('chat_sessions').select('*').eq('user_id', user.uid);
      const loadedSessions = (data || []).map((r: any) => rowToDoc(r)) as any[];

      // Sort on client side (most recently updated first)
      loadedSessions.sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      });

      setSessions(loadedSessions);
      return loadedSessions;
    } catch (err) {
      console.error('[Load Sessions Error]:', err);
    }
  };

  // Load sessions and auto-select most recent on login/mount
  useEffect(() => {
    if (user) {
      loadSessions().then((loaded) => {
        if (loaded && loaded.length > 0) {
          setCurrentSessionId(loaded[0].id);
          const msgs = loaded[0].messages || [];
          setHistory(msgs);
          
          // Mark all loaded messages as already typed so they don't animate
          const completed: Record<number, boolean> = {};
          const visibleMsgs = msgs.filter((item: any) => {
            const role = item.role;
            const content = item.content;
            return (role === 'user' || role === 'assistant') && (typeof content === 'string' || Array.isArray(content));
          });
          visibleMsgs.forEach((_: any, idx: number) => {
            completed[idx] = true;
          });
          setCompletedTypingIndices(completed);
        } else {
          setCurrentSessionId(null);
          setHistory([]);
          setCompletedTypingIndices({});
        }
      });
    } else {
      setSessions([]);
      setCurrentSessionId(null);
      setHistory([]);
      setCompletedTypingIndices({});
    }
  }, [user]);

  // Auto-scroll to the bottom of the chat when new messages are added or when typing state changes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isTyping, isOpen]);

  if (!mounted || loading) return null;

  // Authorization check: Only show the button for active, approved, and verified users
  const isApproved = userProfile?.isApproved === true || userProfile?.isAdmin === true;
  const isVerified = userProfile?.isVerified === true;
  const isSuspended = userProfile?.status === 'SUSPENDED';

  if (!user || !userProfile || !isApproved || !isVerified || isSuspended) {
    return null;
  }

  // Extract text from user or assistant message items (handles both string and array representations)
  const getMessageText = (item: AgentInputItem): string => {
    const content = 'content' in item ? (item as any).content : undefined;
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      return content
        .map((chunk: any) => {
          if (typeof chunk === 'string') return chunk;
          if (chunk && typeof chunk === 'object') {
            if (chunk.type === 'output_text') return chunk.text;
            if (chunk.type === 'input_text') return chunk.text;
          }
          return '';
        })
        .join('');
    }
    return '';
  };

  const handleSendText = async (userText: string) => {
    if (!userText.trim() || isTyping) return;

    setInput('');
    setErrorMsg(null);
    setIsTyping(true);

    // 1. Create client-side user message
    const newUserMessage: AgentInputItem & { timestamp?: number } = {
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };

    const updatedHistory = [...history, newUserMessage];
    setHistory(updatedHistory);

    try {
      // 2. Fetch authenticated Firebase ID token
      const token = await user.getIdToken();

      // 3. Post to AI endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          messages: updatedHistory,
          userName: userProfile?.name || 'User'
        }),
      });

      let data: any = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonErr) {
          console.error('[AI Chat JSON Parse Error]:', jsonErr);
        }
      }

      if (!response.ok) {
        // A revoked/expired session can't be retried — the only recovery is to
        // re-authenticate. Sign the user out so the route guards send them to login.
        if (response.status === 401) {
          setErrorMsg('Your session has expired. Please sign in again.');
          await logout();
          return;
        }
        if (data && data.error) {
          throw new Error(data.error);
        }
        const text = await response.text().catch(() => '');
        if (text.includes('<!DOCTYPE') || text.includes('<html>')) {
          throw new Error(`Server error (Status ${response.status}). The server returned an HTML error page. Please make sure the Digital Reporting backend server is running on the correct port and not blocked by another application.`);
        }
        throw new Error(text || `Request failed with status ${response.status}`);
      }

      if (!data) {
        throw new Error('Server returned an empty or invalid response.');
      }

      // 4. Update conversation history
      if (data.updatedHistory) {
        const now = Date.now();
        const historyWithTimestamps = data.updatedHistory.map((msg: any, idx: number) => {
          // Keep timestamp from matching message we sent, if available
          const sentMsg = updatedHistory[idx];
          if (sentMsg && (sentMsg as any).role === msg.role && (sentMsg as any).timestamp) {
            return { ...msg, timestamp: (sentMsg as any).timestamp };
          }
          
          // Try to scan the sent array to find a match if index mismatch occurs
          const matchingSent = updatedHistory.find(
            (m: any) => m.role === msg.role && getMessageText(m) === getMessageText(msg) && (m as any).timestamp
          );
          if (matchingSent) {
            return { ...msg, timestamp: (matchingSent as any).timestamp };
          }

          // Assign timestamp to new assistant reply (last item)
          if (idx === data.updatedHistory.length - 1) {
            return { ...msg, timestamp: now };
          }
          return msg;
        });

        setHistory(historyWithTimestamps);

        // 5. Persist to Firestore
        try {
          const now = new Date().toISOString();
          if (!currentSessionId) {
            // Create a new session
            const id = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            await saveDoc('chat_sessions', {
              id, userId: user.uid,
              title: userText.slice(0, 40) + (userText.length > 40 ? '...' : ''),
              messages: historyWithTimestamps, createdAt: now, updatedAt: now,
            });
            setCurrentSessionId(id);
            await loadSessions();
          } else {
            // Update existing session (preserve title/createdAt)
            const existing = sessions.find((s: any) => s.id === currentSessionId) || {};
            await saveDoc('chat_sessions', {
              id: currentSessionId, userId: user.uid,
              title: (existing as any).title || (userText.slice(0, 40) + (userText.length > 40 ? '...' : '')),
              messages: historyWithTimestamps,
              createdAt: (existing as any).createdAt || now, updatedAt: now,
            });
            await loadSessions();
          }
        } catch (dbErr) {
          console.error('[Firestore Save Error]:', dbErr);
        }
      }
    } catch (err: any) {
      console.error('[AI Chat Error]:', err);
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSendText(input);
  };

  const handleSelectSession = (session: any) => {
    setCurrentSessionId(session.id);
    const msgs = session.messages || [];
    setHistory(msgs);
    
    // Mark all loaded messages as already typed so they don't animate
    const completed: Record<number, boolean> = {};
    const visibleMsgs = msgs.filter((item: any) => {
      const role = item.role;
      const content = item.content;
      return (role === 'user' || role === 'assistant') && (typeof content === 'string' || Array.isArray(content));
    });
    visibleMsgs.forEach((_: any, idx: number) => {
      completed[idx] = true;
    });
    setCompletedTypingIndices(completed);
    
    setShowSessionsList(false);
    setErrorMsg(null);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setShowConfirmDeleteId(sessionId);
  };

  const handleConfirmDelete = async () => {
    if (!showConfirmDeleteId) return;
    const sessionId = showConfirmDeleteId;
    setIsDeletingSessionId(sessionId);
    try {
      await removeDoc('chat_sessions', sessionId);
      if (sessionId === currentSessionId) {
        setCurrentSessionId(null);
        setHistory([]);
      }
      await loadSessions();
    } catch (err) {
      console.error('[Delete Session Error]:', err);
    } finally {
      setIsDeletingSessionId(null);
      setShowConfirmDeleteId(null);
    }
  };

  const handleDeleteAllSessions = async () => {
    setIsDeletingAll(true);
    try {
      const deletePromises = sessions.map(sess => removeDoc('chat_sessions', sess.id));
      await Promise.all(deletePromises);
      setSessions([]);
      setCurrentSessionId(null);
      setHistory([]);
    } catch (err) {
      console.error('[Delete All Sessions Error]:', err);
    } finally {
      setIsDeletingAll(false);
      setShowConfirmDeleteAll(false);
    }
  };

  const handleStartNewChatConfirm = async () => {
    setShowConfirmReset(false);
    setIsCreatingSession(true);
    
    // Simulate setting up secure AI channel
    await new Promise((resolve) => setTimeout(resolve, 800));

    setCurrentSessionId(null);
    setHistory([]);
    setCompletedTypingIndices({});
    setErrorMsg(null);
    setIsCreatingSession(false);
    setShowSessionsList(false);
  };

  // Only render user and assistant message items to the user (filters out system instructions and tool outputs)
  const visibleMessages = history.filter(
    (item) => {
      const role = 'role' in item ? (item as any).role : undefined;
      const content = 'content' in item ? (item as any).content : undefined;
      return (
        (role === 'user' || role === 'assistant') &&
        (typeof content === 'string' || Array.isArray(content))
      );
    }
  );

  return (
    <>
      {/* Floating Action Button - Capsule shape when closed, circular when open */}
      {!isOpen && (
        <motion.div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            borderRadius: '24px',
            padding: '2px', // gives border space for gradient
            background: 'linear-gradient(90deg, var(--teal-light), var(--gold), #10b981, var(--teal-light))',
            backgroundSize: '300% 100%',
            boxShadow: '0 8px 32px rgba(0, 63, 73, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '300% 0%'],
            boxShadow: [
              '0 8px 24px rgba(0, 242, 255, 0.35), 0 0 12px rgba(0, 242, 255, 0.25)',
              '0 8px 32px rgba(208, 171, 130, 0.55), 0 0 20px rgba(208, 171, 130, 0.35)',
              '0 8px 24px rgba(0, 242, 255, 0.35), 0 0 12px rgba(0, 242, 255, 0.25)'
            ]
          }}
          transition={{
            backgroundPosition: {
              duration: 6,
              repeat: Infinity,
              ease: 'linear'
            },
            boxShadow: {
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }
          }}
        >
          <motion.button
            onClick={() => {
              loadSessions();
              setCurrentSessionId(null);
              setHistory([]);
              setIsOpen(true);
            }}
            style={{
              position: 'relative',
              height: '46px',
              padding: '0 22px',
              borderRadius: '22px',
              background: 'linear-gradient(135deg, rgba(0, 31, 36, 0.95) 0%, rgba(0, 63, 73, 0.95) 100%)', // rich glassmorphic dark teal
              backdropFilter: 'blur(12px)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              overflow: 'hidden',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            title="REH AI Assistant"
          >
            {/* Premium sheen sweep overlay */}
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '50%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                transform: 'skewX(-25deg)',
                pointerEvents: 'none',
              }}
              animate={{
                left: ['-100%', '200%']
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                repeatDelay: 4,
                ease: 'easeInOut'
              }}
            />

            {/* Premium Icon Badge Wrapper */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }}>
              {/* Rotating outer dashed frame */}
              <motion.div
                style={{
                  position: 'absolute',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '1.5px dashed rgba(208, 171, 130, 0.75)',
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
              {/* Pulsing inner glow circle */}
              <motion.div
                style={{
                  position: 'absolute',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'rgba(0, 242, 255, 0.15)',
                }}
                animate={{ scale: [0.8, 1.2, 0.8] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              <Sparkles size={12} color="var(--gold)" style={{ position: 'relative', zIndex: 1, filter: 'drop-shadow(0 0 3px var(--gold))' }} />
            </div>

            <span
              style={{
                fontFamily: 'var(--font-primary), sans-serif',
                fontWeight: 700,
                fontSize: '12px',
                letterSpacing: '0.07em',
                background: 'linear-gradient(135deg, #ffffff 0%, #ffe0b2 40%, var(--gold) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                textShadow: '0 2px 4px rgba(0,0,0,0.15)',
              }}
            >
              REH AI Assistant
            </span>
          </motion.button>
        </motion.div>
      )}

      {isOpen && (
        <motion.div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            borderRadius: '50%',
            padding: '2px', // gives border space for gradient
            background: 'linear-gradient(90deg, var(--teal-light), var(--gold), #10b981, var(--teal-light))',
            backgroundSize: '300% 100%',
            boxShadow: '0 8px 32px rgba(0, 63, 73, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '300% 0%'],
            boxShadow: [
              '0 8px 24px rgba(0, 242, 255, 0.35), 0 0 12px rgba(0, 242, 255, 0.25)',
              '0 8px 32px rgba(208, 171, 130, 0.55), 0 0 20px rgba(208, 171, 130, 0.35)',
              '0 8px 24px rgba(0, 242, 255, 0.35), 0 0 12px rgba(0, 242, 255, 0.25)'
            ]
          }}
          transition={{
            backgroundPosition: {
              duration: 6,
              repeat: Infinity,
              ease: 'linear'
            },
            boxShadow: {
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }
          }}
        >
          <motion.button
            onClick={() => setIsOpen(false)}
            style={{
              position: 'relative',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(0, 31, 36, 0.95) 0%, rgba(0, 63, 73, 0.95) 100%)',
              backdropFilter: 'blur(12px)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cotton)',
              overflow: 'hidden',
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            title="Close Assistant"
          >
            {/* Premium sheen sweep overlay */}
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '50%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                transform: 'skewX(-25deg)',
                pointerEvents: 'none',
              }}
              animate={{
                left: ['-100%', '200%']
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                repeatDelay: 4,
                ease: 'easeInOut'
              }}
            />
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', alignItems: 'center', zIndex: 1 }}
            >
              <X size={18} color="var(--gold)" style={{ filter: 'drop-shadow(0 0 2px var(--gold))' }} />
            </motion.div>
          </motion.button>
        </motion.div>
      )}

      {/* Chat Drawer / Panel */}
      <AnimatePresence>
        {isOpen && !isFullScreen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            style={{
              position: 'fixed',
              bottom: '96px',
              right: '24px',
              width: '380px',
              maxWidth: 'calc(100vw - 48px)',
              height: '580px',
              maxHeight: 'calc(100vh - 120px)',
              zIndex: 9998,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(249, 248, 242, 0.96)', // Cotton main background with slight opacity
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--border)',
              boxShadow: '0 20px 50px rgba(0, 63, 73, 0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: 'var(--teal)',
                color: 'var(--cotton)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setShowSessionsList(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(249, 248, 242, 0.7)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    borderRadius: '4px',
                    marginRight: '4px',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(249, 248, 242, 0.7)')}
                  title="View History"
                >
                  <Menu size={18} />
                </button>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981', // Emerald green online indicator
                    boxShadow: '0 0 8px #10b981',
                  }}
                />
                <h3
                  style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    margin: 0,
                    textTransform: 'uppercase',
                  }}
                >
                  REH Assistant
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {history.length > 0 && (
                  <button
                    onClick={() => setShowConfirmReset(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(249, 248, 242, 0.7)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(249, 248, 242, 0.7)')}
                    title="Start New Chat"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
                <button
                  onClick={() => setIsFullScreen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(249, 248, 242, 0.7)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(249, 248, 242, 0.7)')}
                  title="Open Full Screen"
                >
                  <Maximize2 size={16} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(249, 248, 242, 0.7)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cotton)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(249, 248, 242, 0.7)')}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              id="chat-messages-container"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {visibleMessages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 0 }}>

                  {/* ── Hero Welcome Banner ── */}
                  <div style={{
                    background: 'linear-gradient(135deg, #003f49 0%, #005360 100%)',
                    borderRadius: '10px',
                    padding: '11px 13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '12px',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0,63,73,0.18)',
                  }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(208,171,130,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Sparkles size={16} color="#d4a96a" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#f5e6cc',
                        letterSpacing: '0.04em',
                        lineHeight: 1.2,
                        textTransform: 'uppercase',
                      }}>
                        Welcome, {userProfile?.name?.split(' ')[0] || 'Operative'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                        REH Grounded Assistant · Knowledge Base Active
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 5px #34d399' }} />
                      <span style={{ fontSize: '9px', color: '#34d399', fontWeight: 600, letterSpacing: '0.06em' }}>ONLINE</span>
                    </div>
                  </div>

                  {/* ── Recent Conversations ── */}
                  {sessions.length > 0 && (
                    <div style={{ marginBottom: '12px', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                        <History size={9} color="#7a4f1d" />
                        <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.09em', color: '#7a4f1d', textTransform: 'uppercase' }}>
                          Recent Conversations
                        </span>
                        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #d4a96a55 0%, transparent 100%)' }} />
                        <button
                          onClick={() => setShowSessionsList(true)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '9px', fontWeight: 700, color: '#003f49',
                            padding: '2px 4px', borderRadius: '4px',
                            textTransform: 'uppercase', letterSpacing: '0.05em'
                          }}
                        >
                          View All
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {sessions.slice(0, 3).map((sess, idx) => {
                          const formattedDate = sess.updatedAt
                            ? new Date(sess.updatedAt.toMillis ? sess.updatedAt.toMillis() : sess.updatedAt).toLocaleDateString(undefined, {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                              })
                            : 'Recent';
                          return (
                            <motion.div
                              key={sess.id}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              onClick={() => { setCurrentSessionId(sess.id); setHistory(sess.messages || []); }}
                              whileHover={{ x: 2, backgroundColor: '#f0f8fa' }}
                              whileTap={{ scale: 0.99 }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '7px',
                                padding: '6px 9px', borderRadius: '7px',
                                background: '#f8fafb',
                                border: '1px solid #d5e6ea',
                                cursor: 'pointer',
                              }}
                            >
                              <div style={{
                                width: '18px', height: '18px', borderRadius: '5px',
                                background: '#fef3c7', border: '1px solid #d4a96a',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              }}>
                                <MessageSquare size={9} color="#7a4f1d" />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  fontSize: '11px', fontWeight: 600, color: '#003f49',
                                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3,
                                }}>{sess.title || 'Untitled Session'}</div>
                                <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '1px' }}>{formattedDate}</div>
                              </div>
                              <button
                                onClick={(e) => handleDeleteSession(e, sess.id)}
                                disabled={isDeletingSessionId === sess.id}
                                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                              >
                                {isDeletingSessionId === sess.id ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                              </button>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Suggested Topics ── */}
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                      <Sparkles size={9} color="#003f49" />
                      <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.09em', color: '#003f49', textTransform: 'uppercase' }}>
                        Suggested Topics
                      </span>
                      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #5eaabb55 0%, transparent 100%)' }} />
                    </div>

                    {/* Categories: each with a pill header + 3-column grid */}
                    {suggestedPrompts.map((group, groupIdx) => (
                      <div key={groupIdx} style={{ marginBottom: groupIdx < suggestedPrompts.length - 1 ? '10px' : 0 }}>
                        {/* Category pill */}
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '2px 7px', borderRadius: '5px',
                          background: group.labelBg, border: `1px solid ${group.border}`,
                          marginBottom: '5px',
                        }}>
                          <span style={{ fontSize: '10px', lineHeight: 1 }}>{group.icon}</span>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: group.textColor, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                            {group.category}
                          </span>
                        </div>

                        {/* 3-column grid of prompt cards */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '5px',
                        }}>
                          {group.prompts.map((prompt, promptIdx) => (
                            <motion.button
                              key={promptIdx}
                              initial={{ opacity: 0, y: 3 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: groupIdx * 0.06 + promptIdx * 0.03 }}
                              onClick={() => handleSendText(prompt.full)}
                              whileHover={{ y: -2, boxShadow: `0 4px 10px ${group.border}55` }}
                              whileTap={{ scale: 0.97 }}
                              style={{
                                background: group.bg,
                                border: `1px solid ${group.border}`,
                                borderRadius: '8px',
                                padding: '6px 8px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'left',
                                gap: '6px',
                                minHeight: '44px',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <span style={{ fontSize: '13px', lineHeight: 1, flexShrink: 0 }}>{group.icon}</span>
                              <span style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                color: group.textColor,
                                lineHeight: 1.2,
                                wordBreak: 'break-word',
                                hyphens: 'auto',
                              }}>
                                {prompt.text}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                visibleMessages.map((msg, index) => {
                  const isAssistant = 'role' in msg ? (msg as any).role === 'assistant' : false;
                  const text = getMessageText(msg);

                  return (
                    <div key={index} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {showDateSeparator(index) && (msg as any).timestamp && (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            margin: '12px 0 8px 0',
                            width: '100%',
                          }}
                        >
                          <span
                            style={{
                              background: 'rgba(0, 63, 73, 0.06)',
                              color: 'var(--teal)',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: '10px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {formatSeparatorDate((msg as any).timestamp)}
                          </span>
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'flex-start',
                          alignSelf: isAssistant ? 'flex-start' : 'flex-end',
                          flexDirection: isAssistant ? 'row' : 'row-reverse',
                          maxWidth: '85%',
                        }}
                      >
                        {/* Avatar */}
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: isAssistant 
                              ? 'linear-gradient(135deg, var(--teal) 0%, #005e6d 100%)' 
                              : 'var(--gold)',
                            border: '1.5px solid var(--gold)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--cotton)',
                            flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                            overflow: 'hidden',
                            padding: isAssistant ? '3px' : '0px',
                            marginTop: '2px',
                          }}
                        >
                          {isAssistant ? (
                            <img 
                              src="https://i.postimg.cc/qqt3Wx5z/Avatar.png" 
                              alt="REH Digital Assistance Logo" 
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                            />
                          ) : (
                            userProfile?.avatar ? (
                              <img 
                                src={userProfile.avatar} 
                                alt={userProfile.name} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                            ) : (
                              <User size={14} color="#f9f8f2" />
                            )
                          )}
                        </div>

                        {/* Content Bubble (WhatsApp Style Timestamp Inside) */}
                        <div
                          style={{
                            background: isAssistant ? '#ffffff' : 'rgba(208, 171, 130, 0.12)',
                            color: 'var(--text-primary)',
                            padding: '8px 12px 18px 12px', // Bottom padding of 18px to clear the absolute timestamp
                            borderRadius: isAssistant ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                            border: isAssistant ? '1px solid var(--border)' : '1px solid rgba(208, 171, 130, 0.25)',
                            fontSize: '13px',
                            lineHeight: '1.5',
                            boxShadow: isAssistant ? 'var(--shadow-sm)' : 'none',
                            whiteSpace: 'pre-line',
                            position: 'relative',
                            minWidth: '75px',
                          }}
                        >
                          <div style={{ wordBreak: 'break-word' }}>
                            <MessageContentRenderer
                              text={text}
                              isAssistant={isAssistant}
                              completedTyping={!!completedTypingIndices[index] || index !== visibleMessages.length - 1}
                              onComplete={() => {
                                setCompletedTypingIndices(prev => ({ ...prev, [index]: true }));
                              }}
                            />
                          </div>
                          
                          {(msg as any).timestamp && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '3px',
                                right: '10px',
                                fontSize: '9px',
                                color: isAssistant ? 'rgba(0, 0, 0, 0.45)' : 'rgba(122, 79, 29, 0.6)',
                                opacity: 0.85,
                                lineHeight: 1,
                                pointerEvents: 'none',
                                userSelect: 'none',
                              }}
                            >
                              {formatMsgTime((msg as any).timestamp)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Thinking Indicator */}
              {isTyping && (
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignSelf: 'flex-start',
                    alignItems: 'center',
                    maxWidth: '85%',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--teal) 0%, #005e6d 100%)',
                      border: '1.5px solid var(--gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--cotton)',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                      overflow: 'hidden',
                      padding: '3px',
                    }}
                  >
                    <img 
                      src="https://i.postimg.cc/qqt3Wx5z/Avatar.png" 
                      alt="REH Digital Assistance Logo" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />
                  </div>
                  <div
                    style={{
                      background: '#ffffff',
                      padding: '10px 14px',
                      borderRadius: '4px 14px 14px 14px',
                      border: '1px solid var(--border)',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--text-secondary)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <Loader2 size={14} className="animate-spin" color="var(--teal)" />
                    <span>Analyzing documents...</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    color: '#dc2626',
                    fontSize: '12px',
                    alignItems: 'flex-start',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <span style={{ fontWeight: 600 }}>Request Failed:</span> {errorMsg}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
            {/* Input Form Footer */}
            <form
              onSubmit={handleSend}
              style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--border)',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Inline style overrides for high contrast input placeholder */}
              <style>{`
                .ai-chat-input::placeholder {
                  color: rgba(0, 63, 73, 0.4) !important;
                  opacity: 1 !important;
                }
                .ai-chat-input {
                  background-color: #ffffff !important;
                  color: #003f49 !important;
                }
              `}</style>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the assistant..."
                  disabled={isTyping}
                  className="ai-chat-input"
                  style={{
                    flex: 1,
                    background: '#ffffff',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    fontSize: '13px',
                    outline: 'none',
                    color: '#003f49',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--teal)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
                <button
                  type="submit"
                  disabled={isTyping || !input.trim()}
                  style={{
                    background: isTyping || !input.trim() 
                      ? 'rgba(0, 63, 73, 0.04)' 
                      : 'linear-gradient(135deg, var(--teal) 0%, #005360 100%)',
                    color: isTyping || !input.trim() ? '#cbd5e1' : 'var(--cotton)',
                    border: isTyping || !input.trim() ? '1px solid rgba(0, 63, 73, 0.08)' : 'none',
                    borderRadius: '10px',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isTyping || !input.trim() ? 'none' : '0 2px 8px rgba(0, 63, 73, 0.15)',
                    transform: isTyping || !input.trim() ? 'none' : 'scale(1)',
                  }}
                  onMouseEnter={(e) => {
                    if (input.trim() && !isTyping) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 63, 73, 0.25)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (input.trim() && !isTyping) {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 63, 73, 0.15)';
                    }
                  }}
                >
                  <Send 
                    size={15} 
                    color={isTyping || !input.trim() ? '#94a3b8' : '#ffe0b2'} 
                    style={{ 
                      transform: 'translate(1px, -0.5px)',
                      filter: isTyping || !input.trim() ? 'none' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' 
                    }} 
                  />
                </button>
              </div>
              <div
                style={{
                  fontSize: '9px',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 500,
                  marginTop: '2px',
                }}
              >
                REH Grounded Search System Active
              </div>
            </form>

            {/* History Panel (Slides in from the left) */}
            <AnimatePresence>
              {showSessionsList && (
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'tween', duration: 0.25 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 63, 73, 0.98)', // Dark teal solid/almost-solid background
                    backdropFilter: 'blur(16px)',
                    color: 'var(--cotton)',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* History Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <History size={16} color="var(--gold)" />
                      <span
                        style={{
                          fontFamily: 'var(--font-primary)',
                          fontSize: '13px',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Saved Conversations
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {sessions.length > 0 && (
                        <button
                          onClick={() => setShowConfirmDeleteAll(true)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(239, 68, 68, 0.8)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '4px',
                            transition: 'color 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(239, 68, 68, 0.8)')}
                          title="Delete All Sessions"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => setShowSessionsList(false)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255, 255, 255, 0.7)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)')}
                      >
                        <ArrowLeft size={18} />
                      </button>
                    </div>
                  </div>

                  {/* New Session Button */}
                  <div style={{ padding: '16px 20px' }}>
                    <button
                      onClick={() => {
                        if (history.length > 0) {
                          setShowConfirmReset(true);
                        } else {
                          setShowSessionsList(false);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'transparent',
                        border: '1px solid var(--gold)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--gold)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(208, 171, 130, 0.1)';
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(208, 171, 130, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <Plus size={16} />
                      Start New Chat
                    </button>
                  </div>

                  {/* Sessions List */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '0 20px 20px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    {sessions.length === 0 ? (
                      <div
                        style={{
                          textAlign: 'center',
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontSize: '12px',
                          marginTop: '40px',
                        }}
                      >
                        No saved sessions found.
                      </div>
                    ) : (
                      sessions.map((sess) => {
                        const isActive = sess.id === currentSessionId;
                        const formattedDate = sess.updatedAt
                          ? new Date(sess.updatedAt.toMillis ? sess.updatedAt.toMillis() : sess.updatedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Recent';

                        return (
                          <div
                            key={sess.id}
                            onClick={() => handleSelectSession(sess)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-md)',
                              background: isActive ? 'rgba(208, 171, 130, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                              border: isActive ? '1.5px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.12)',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.borderColor = 'rgba(208, 171, 130, 0.35)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                              }
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1, paddingRight: '8px' }}>
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: isActive ? 'var(--gold)' : 'var(--cotton)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {sess.title || 'Untitled Session'}
                              </span>
                              <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>{formattedDate}</span>
                            </div>
                            <button
                              onClick={(e) => handleDeleteSession(e, sess.id)}
                              disabled={isDeletingSessionId === sess.id}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255, 255, 255, 0.5)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 0.2s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
                            >
                              {isDeletingSessionId === sess.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fancy New Session Modal (Renders inside the chat drawer) */}
            <AnimatePresence>
              {showConfirmReset && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 63, 73, 0.75)', // Dark teal semi-transparent overlay
                    backdropFilter: 'blur(4px)',
                    zIndex: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    style={{
                      background: 'rgba(249, 248, 242, 0.98)', // Cotton background
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--gold)',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                      padding: '24px',
                      width: '100%',
                      maxWidth: '300px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(208, 171, 130, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                        color: 'var(--gold)',
                      }}
                    >
                      <RotateCcw size={20} />
                    </div>
                    <h4
                      style={{
                        fontFamily: 'var(--font-primary)',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: 'var(--teal)',
                        margin: '0 0 8px 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Start New Chat?
                    </h4>
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.5',
                        margin: '0 0 20px 0',
                      }}
                    >
                      Are you sure you want to clear this conversation? Your current session will be saved in your chat history.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                      <button
                        onClick={() => setShowConfirmReset(false)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'rgba(0, 63, 73, 0.05)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--teal)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 63, 73, 0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 63, 73, 0.05)')}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleStartNewChatConfirm}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'var(--teal)',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--cotton)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          transition: 'all 0.2s',
                          boxShadow: '0 4px 12px rgba(0, 63, 73, 0.2)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary-light)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--teal)')}
                      >
                        Confirm
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Delete Session Confirmation Modal */}
            <AnimatePresence>
              {showConfirmDeleteId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 63, 73, 0.75)', // Dark teal semi-transparent overlay
                    backdropFilter: 'blur(4px)',
                    zIndex: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    style={{
                      background: 'rgba(249, 248, 242, 0.98)', // Cotton background
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid #ef4444', // red warning border
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                      padding: '24px',
                      width: '100%',
                      maxWidth: '300px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                    }}
                  >
                    {isDeletingSessionId ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
                        <Loader2 size={36} className="animate-spin" color="#ef4444" style={{ marginBottom: '16px' }} />
                        <span
                          style={{
                            fontFamily: 'var(--font-primary)',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--teal)',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                          }}
                        >
                          Deleting Session...
                        </span>
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px',
                            color: '#ef4444',
                          }}
                        >
                          <Trash2 size={20} />
                        </div>
                        <h4
                          style={{
                            fontFamily: 'var(--font-primary)',
                            fontSize: '15px',
                            fontWeight: 700,
                            color: 'var(--teal)',
                            margin: '0 0 8px 0',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          Delete Session?
                        </h4>
                        <p
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            lineHeight: '1.5',
                            margin: '0 0 20px 0',
                          }}
                        >
                          Are you sure you want to permanently delete this chat session? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                          <button
                            onClick={() => setShowConfirmDeleteId(null)}
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: 'rgba(0, 63, 73, 0.05)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-md)',
                              color: 'var(--teal)',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontFamily: 'var(--font-sans)',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 63, 73, 0.1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 63, 73, 0.05)')}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleConfirmDelete}
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: '#ef4444',
                              border: 'none',
                              borderRadius: 'var(--radius-md)',
                              color: 'var(--cotton)',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontFamily: 'var(--font-sans)',
                              transition: 'all 0.2s',
                              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#dc2626')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#ef4444')}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Initialize Channel Loading Spinner Overlay */}
            <AnimatePresence>
              {isCreatingSession && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(249, 248, 242, 0.98)', // Cotton background
                    zIndex: 250,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                  }}
                >
                  <Loader2 size={36} className="animate-spin" color="var(--gold)" />
                  <span
                    style={{
                      fontFamily: 'var(--font-primary)',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--teal)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Initializing AI Channel...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fancy Confirm Delete Session Modal */}
            <AnimatePresence>
              {showConfirmDeleteId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 63, 73, 0.75)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    style={{
                      background: 'rgba(249, 248, 242, 0.98)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid #ef4444',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                      padding: '24px',
                      width: '100%',
                      maxWidth: '300px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                        color: '#ef4444',
                      }}
                    >
                      <Trash2 size={20} />
                    </div>
                    <h4
                      style={{
                        fontFamily: 'var(--font-primary)',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#ef4444',
                        margin: '0 0 8px 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Delete Conversation?
                    </h4>
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.5',
                        margin: '0 0 20px 0',
                      }}
                    >
                      This action cannot be undone. Are you sure you want to delete this session?
                    </p>
                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                      <button
                        onClick={() => setShowConfirmDeleteId(null)}
                        disabled={isDeletingSessionId !== null}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'rgba(0, 63, 73, 0.05)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--teal)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          transition: 'all 0.2s',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmDelete}
                        disabled={isDeletingSessionId !== null}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: '#ef4444',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}
                      >
                        {isDeletingSessionId !== null ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fancy Confirm Delete All Modal */}
            <AnimatePresence>
              {showConfirmDeleteAll && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 63, 73, 0.75)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    style={{
                      background: 'rgba(249, 248, 242, 0.98)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid #ef4444',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                      padding: '24px',
                      width: '100%',
                      maxWidth: '300px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                        color: '#ef4444',
                      }}
                    >
                      <Trash2 size={20} />
                    </div>
                    <h4
                      style={{
                        fontFamily: 'var(--font-primary)',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#ef4444',
                        margin: '0 0 8px 0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Delete All History?
                    </h4>
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.5',
                        margin: '0 0 20px 0',
                      }}
                    >
                      This action will permanently delete all your saved conversations. Are you sure you want to proceed?
                    </p>
                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                      <button
                        onClick={() => setShowConfirmDeleteAll(false)}
                        disabled={isDeletingAll}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'rgba(0, 63, 73, 0.05)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--teal)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          transition: 'all 0.2s',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAllSessions}
                        disabled={isDeletingAll}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: '#ef4444',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}
                      >
                        {isDeletingAll ? <Loader2 size={16} className="animate-spin" /> : 'Delete All'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {isOpen && isFullScreen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 99999,
              display: 'flex',
              background: '#002228',
              color: 'var(--cotton)',
              fontFamily: 'var(--font-sans)',
              overflow: 'hidden',
            }}
          >
            {/* Left Sidebar */}
            <div
              style={{
                width: '320px',
                background: '#001a1e',
                borderRight: '1px solid rgba(208, 171, 130, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                flexShrink: 0,
              }}
            >
              {/* Sidebar Header */}
              <div
                style={{
                  padding: '24px 20px',
                  borderBottom: '1px solid rgba(208, 171, 130, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1.5px solid var(--gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.05)',
                  flexShrink: 0,
                }}>
                  <img src="https://i.postimg.cc/qqt3Wx5z/Avatar.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-primary), serif',
                      fontSize: '14px',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      margin: 0,
                      color: 'var(--gold)',
                      textTransform: 'uppercase',
                    }}
                  >
                    REH COMMAND
                  </h3>
                  <span style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '0.08em', marginTop: '2px' }}>
                    AI GROUNDED INSIGHTS
                  </span>
                </div>
              </div>

              {/* New Session Button */}
              <div style={{ padding: '16px 20px' }}>
                <button
                  onClick={() => setShowConfirmReset(true)}
                  disabled={isCreatingSession}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(208, 171, 130, 0.15) 0%, rgba(208, 171, 130, 0.05) 100%)',
                    border: '1.5px solid rgba(208, 171, 130, 0.35)',
                    color: 'var(--gold)',
                    fontFamily: 'var(--font-primary), serif',
                    fontWeight: 700,
                    fontSize: '12px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(208, 171, 130, 0.25) 0%, rgba(208, 171, 130, 0.1) 100%)';
                    e.currentTarget.style.borderColor = 'var(--gold)';
                    e.currentTarget.style.boxShadow = '0 0 12px rgba(208, 171, 130, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(208, 171, 130, 0.15) 0%, rgba(208, 171, 130, 0.05) 100%)';
                    e.currentTarget.style.borderColor = 'rgba(208, 171, 130, 0.35)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {isCreatingSession ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  <span>New Conversation</span>
                </button>
              </div>

              {/* Sessions List */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '0 20px 20px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(208, 171, 130, 0.6)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Conversations History
                </div>
                {sessions.length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
                    No previous chats
                  </div>
                ) : (
                  sessions.map((sess) => {
                    const isActive = sess.id === currentSessionId;
                    const formattedDate = sess.updatedAt
                      ? new Date(sess.updatedAt.toMillis ? sess.updatedAt.toMillis() : sess.updatedAt).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })
                      : 'Recent';
                    return (
                      <div
                        key={sess.id}
                        onClick={() => handleSelectSession(sess)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '10px',
                          background: isActive ? 'rgba(208, 171, 130, 0.18)' : '#00252b',
                          border: isActive ? '1.5px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.12)',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.borderColor = 'rgba(208, 171, 130, 0.35)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = '#00252b';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                          }
                        }}
                      >
                        {isActive && (
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'var(--gold)',
                            boxShadow: '0 0 10px var(--gold)',
                            flexShrink: 0,
                          }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: isActive ? 700 : 500,
                              color: isActive ? 'var(--gold)' : '#e2e8f0',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: 1.4,
                            }}
                          >
                            {sess.title || 'Untitled Session'}
                          </div>
                          <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '1px' }}>
                            {formattedDate}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSession(e, sess.id)}
                          disabled={isDeletingSessionId === sess.id}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.5)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            flexShrink: 0,
                            transition: 'color 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
                        >
                          {isDeletingSessionId === sess.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sidebar Footer (User info) */}
              <div
                style={{
                  padding: '16px 20px',
                  borderTop: '1px solid rgba(208, 171, 130, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#001518',
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1.5px solid var(--gold)',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  {userProfile?.avatar ? (
                    <img src={userProfile.avatar} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={16} color="#ffffff" />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {userProfile?.name || 'Operative'}
                  </div>
                  <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                    {userProfile?.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Chat Panel */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                position: 'relative',
                background: 'var(--cotton)',
              }}
            >
              {/* Top Panel Header */}
              <div
                style={{
                  height: '70px',
                  padding: '0 32px',
                  borderBottom: '1px solid rgba(0, 63, 73, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#ecebe2',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                  <h2
                    style={{
                      fontFamily: 'var(--font-primary), serif',
                      fontSize: '15px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      margin: 0,
                      color: 'var(--teal)',
                    }}
                  >
                    {currentSessionId 
                      ? (sessions.find(s => s.id === currentSessionId)?.title || 'Active Session')
                      : 'New Conversation'}
                  </h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Minimize/Exit Full Screen */}
                  <button
                    onClick={() => setIsFullScreen(false)}
                    style={{
                      background: 'rgba(0, 63, 73, 0.03)',
                      border: '1px solid rgba(0, 63, 73, 0.08)',
                      color: 'rgba(0, 63, 73, 0.6)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      borderRadius: '50%',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--teal)';
                      e.currentTarget.style.background = 'rgba(0, 63, 73, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(0, 63, 73, 0.6)';
                      e.currentTarget.style.background = 'rgba(0, 63, 73, 0.03)';
                    }}
                    title="Exit Full Screen"
                  >
                    <Minimize2 size={16} />
                  </button>
                  {/* Close button */}
                  <button
                    onClick={() => {
                      setIsFullScreen(false);
                      setIsOpen(false);
                    }}
                    style={{
                      background: 'rgba(0, 63, 73, 0.03)',
                      border: '1px solid rgba(0, 63, 73, 0.08)',
                      color: 'rgba(0, 63, 73, 0.6)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      borderRadius: '50%',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--cotton)';
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.9)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(0, 63, 73, 0.6)';
                      e.currentTarget.style.background = 'rgba(0, 63, 73, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(0, 63, 73, 0.08)';
                    }}
                    title="Close Assistant"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Chat Messages scroll area (FullScreen) */}
              <div
                id="fs-chat-messages-container"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '32px 15%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                }}
              >
                {visibleMessages.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    textAlign: 'center',
                    maxWidth: '600px',
                    margin: 'auto',
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #003f49 0%, #005360 100%)',
                      border: '2px solid var(--gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(0, 63, 73, 0.15)',
                      marginBottom: '24px',
                    }}>
                      <Sparkles size={32} color="var(--gold)" />
                    </div>
                    <h1 style={{
                      fontFamily: 'var(--font-primary), serif',
                      fontSize: '24px',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      color: 'var(--teal)',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                    }}>
                      Welcome, {userProfile?.name?.split(' ')[0] || 'Operative'}
                    </h1>
                    <p style={{ fontSize: '14px', color: 'rgba(0, 63, 73, 0.7)', lineHeight: 1.6, marginBottom: '32px' }}>
                      Ask questions about the BIM Reviews Report or the Deliverables Registry Report. The system will search the connected vector store for grounded, verified answers.
                    </p>

                    {/* Prompts Cards inside Full Screen */}
                    <div style={{ width: '100%' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(0, 63, 73, 0.7)', textTransform: 'uppercase', marginBottom: '16px', textAlign: 'center' }}>
                        Suggested Analytical Queries
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        {suggestedPrompts.flatMap(g => g.prompts.slice(0, 2).map(p => ({ ...p, icon: g.icon }))).map((prompt, idx) => (
                          <motion.button
                            key={idx}
                            onClick={() => handleSendText(prompt.full)}
                            whileHover={{ y: -4, background: 'rgba(0, 63, 73, 0.04)', borderColor: 'var(--teal)', boxShadow: '0 4px 12px rgba(0, 63, 73, 0.08)' }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                              background: '#ffffff',
                              border: '1.5px solid rgba(0, 63, 73, 0.25)',
                              borderRadius: '12px',
                              padding: '14px 16px',
                              cursor: 'pointer',
                              color: '#003f49',
                              textAlign: 'left',
                              fontSize: '12px',
                              fontWeight: 700,
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: '10px',
                              transition: 'all 0.2s',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                            }}
                          >
                            <span style={{ fontSize: '18px', flexShrink: 0 }}>{prompt.icon}</span>
                            <span style={{ lineHeight: 1.3 }}>{prompt.text}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  visibleMessages.map((msg, index) => {
                    const isAssistant = 'role' in msg ? (msg as any).role === 'assistant' : false;
                    const text = getMessageText(msg);

                    return (
                      <div key={index} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Centered separator */}
                        {showDateSeparator(index) && (msg as any).timestamp && (
                          <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0 12px 0', width: '100%' }}>
                            <span style={{
                              background: 'rgba(0, 63, 73, 0.06)',
                              color: 'var(--teal)',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '4px 14px',
                              borderRadius: '12px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              border: '1px solid rgba(0, 63, 73, 0.1)',
                            }}>
                              {formatSeparatorDate((msg as any).timestamp)}
                            </span>
                          </div>
                        )}

                        {/* Bubble row */}
                        <div
                          style={{
                            display: 'flex',
                            gap: '16px',
                            alignItems: 'flex-start',
                            alignSelf: isAssistant ? 'flex-start' : 'flex-end',
                            flexDirection: isAssistant ? 'row' : 'row-reverse',
                            maxWidth: '75%',
                          }}
                        >
                          {/* Avatar */}
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: isAssistant 
                                ? 'linear-gradient(135deg, var(--teal) 0%, #005e6d 100%)' 
                                : 'var(--gold)',
                              border: '2px solid var(--gold)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                              overflow: 'hidden',
                              padding: isAssistant ? '4px' : '0px',
                              marginTop: '2px',
                            }}
                          >
                            {isAssistant ? (
                              <img 
                                src="https://i.postimg.cc/qqt3Wx5z/Avatar.png" 
                                alt="REH Digital Assistance Logo" 
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                              />
                            ) : (
                              userProfile?.avatar ? (
                                <img 
                                  src={userProfile.avatar} 
                                  alt={userProfile.name} 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                              ) : (
                                <User size={16} color="#f9f8f2" />
                              )
                            )}
                          </div>

                          {/* Content Bubble */}
                          <div
                            style={{
                              background: isAssistant ? '#eaf4f6' : '#f5ecd8',
                              color: '#003f49',
                              padding: '14px 18px 24px 18px',
                              borderRadius: isAssistant ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
                              border: isAssistant ? '1px solid rgba(0, 63, 73, 0.12)' : '1px solid rgba(208, 171, 130, 0.35)',
                              fontSize: '14px',
                              lineHeight: '1.6',
                              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
                              whiteSpace: 'pre-line',
                              position: 'relative',
                              minWidth: '85px',
                            }}
                          >
                             <div style={{ wordBreak: 'break-word' }}>
                               <MessageContentRenderer
                                 text={text}
                                 isAssistant={isAssistant}
                                 completedTyping={!!completedTypingIndices[index] || index !== visibleMessages.length - 1}
                                 onComplete={() => {
                                   setCompletedTypingIndices(prev => ({ ...prev, [index]: true }));
                                 }}
                               />
                             </div>
                            
                            {(msg as any).timestamp && (
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: '5px',
                                  right: '12px',
                                  fontSize: '9.5px',
                                  color: 'rgba(0, 63, 73, 0.5)',
                                  opacity: 0.85,
                                  lineHeight: 1,
                                  pointerEvents: 'none',
                                  userSelect: 'none',
                                }}
                              >
                                {formatMsgTime((msg as any).timestamp)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Thinking Indicator (FS) */}
                {isTyping && (
                  <div style={{ display: 'flex', gap: '16px', alignSelf: 'flex-start', alignItems: 'center', maxWidth: '75%' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--teal) 0%, #005e6d 100%)',
                      border: '2px solid var(--gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      overflow: 'hidden',
                      padding: '4px',
                    }}>
                      <img src="https://i.postimg.cc/qqt3Wx5z/Avatar.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{
                      background: '#eaf4f6',
                      padding: '14px 18px',
                      borderRadius: '4px 18px 18px 18px',
                      border: '1px solid rgba(0, 63, 73, 0.12)',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: 'var(--teal)',
                    }}>
                      <Loader2 size={16} className="animate-spin" color="var(--teal)" />
                      <span>Searching reports & analyzing findings...</span>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {errorMsg && (
                  <div style={{ display: 'flex', gap: '10px', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px', padding: '14px', color: '#ef4444', fontSize: '13px', maxWidth: '75%', alignSelf: 'center' }}>
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <div>
                      <span style={{ fontWeight: 600 }}>Command Center Error:</span> {errorMsg}
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Footer Panel (FullScreen) */}
              <div
                style={{
                  padding: '24px 32px 32px 32px',
                  borderTop: '1px solid rgba(0, 63, 73, 0.12)',
                  background: '#ecebe2',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <form
                  onSubmit={handleSend}
                  style={{
                    width: '100%',
                    maxWidth: '850px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask the assistant..."
                      disabled={isTyping}
                      className="ai-chat-input"
                      style={{
                        flex: 1,
                        background: '#ffffff',
                        border: '1.5px solid rgba(208, 171, 130, 0.35)',
                        borderRadius: '24px',
                        padding: '12px 24px',
                        fontSize: '14px',
                        outline: 'none',
                        color: '#003f49',
                        transition: 'all 0.2s ease',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--gold)';
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(208, 171, 130, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(208, 171, 130, 0.35)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isTyping || !input.trim()}
                      style={{
                        background: 'transparent',
                        color: isTyping || !input.trim() ? 'rgba(0, 63, 73, 0.25)' : 'var(--teal)',
                        border: 'none',
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        transform: isTyping || !input.trim() ? 'none' : 'scale(1)',
                      }}
                      onMouseEnter={(e) => {
                        if (input.trim() && !isTyping) {
                          e.currentTarget.style.transform = 'scale(1.1)';
                          e.currentTarget.style.color = '#005e6d';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (input.trim() && !isTyping) {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.color = 'var(--teal)';
                        }
                      }}
                    >
                      <Send 
                        size={22} 
                        color="currentColor"
                        style={{ 
                          transform: 'translate(1.5px, -0.5px)',
                          transition: 'all 0.2s ease',
                        }} 
                      />
                    </button>
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '4px' }}>
                    REH Grounded Search System Active · Insite Proprietary
                  </div>
                </form>
              </div>

              {/* Delete Session Confirmation Overlay (FullScreen) */}
              <AnimatePresence>
                {showConfirmDeleteId && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0, 18, 21, 0.8)',
                      backdropFilter: 'blur(6px)',
                      zIndex: 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '24px',
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      style={{
                        background: 'rgba(0, 31, 36, 0.95)',
                        borderRadius: '16px',
                        border: '1.5px solid #ef4444',
                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
                        padding: '28px',
                        width: '100%',
                        maxWidth: '320px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                        color: '#ef4444',
                      }}>
                        <Trash2 size={22} />
                      </div>
                      <h4 style={{ fontFamily: 'var(--font-primary), serif', fontSize: '18px', fontWeight: 700, color: '#ef4444', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Delete Session?
                      </h4>
                      <p style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5', margin: '0 0 24px 0' }}>
                        Are you sure you want to delete this conversation? This action is permanent.
                      </p>
                      <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                        <button
                          onClick={() => setShowConfirmDeleteId(null)}
                          disabled={isDeletingSessionId !== null}
                          style={{
                            flex: 1,
                            padding: '11px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '10px',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmDelete}
                          disabled={isDeletingSessionId !== null}
                          style={{
                            flex: 1,
                            padding: '11px',
                            background: '#ef4444',
                            border: 'none',
                            borderRadius: '10px',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isDeletingSessionId !== null ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* New Conversation Confirm Overlay (FullScreen) */}
              <AnimatePresence>
                {showConfirmReset && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0, 18, 21, 0.8)',
                      backdropFilter: 'blur(6px)',
                      zIndex: 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '24px',
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      style={{
                        background: 'rgba(0, 31, 36, 0.95)',
                        borderRadius: '16px',
                        border: '1.5px solid var(--gold)',
                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
                        padding: '28px',
                        width: '100%',
                        maxWidth: '320px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'rgba(208, 171, 130, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                        color: 'var(--gold)',
                      }}>
                        <RotateCcw size={20} />
                      </div>
                      <h4 style={{ fontFamily: 'var(--font-primary), serif', fontSize: '18px', fontWeight: 700, color: 'var(--gold)', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Start New Chat?
                      </h4>
                      <p style={{ fontSize: '12.5px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5', margin: '0 0 24px 0' }}>
                        Are you sure you want to reset this chat and start a new conversation?
                      </p>
                      <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                        <button
                          onClick={() => setShowConfirmReset(false)}
                          style={{
                            flex: 1,
                            padding: '11px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '10px',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleStartNewChatConfirm}
                          style={{
                            flex: 1,
                            padding: '11px',
                            background: 'linear-gradient(135deg, var(--teal) 0%, #005360 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            color: '#ffe0b2',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Confirm
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </>
  );
}
