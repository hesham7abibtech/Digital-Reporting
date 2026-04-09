'use client';

import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  BarChart3, 
  Building2, 
  Zap, 
  ShieldCheck, 
  ShoppingCart, 
  ClipboardCheck, 
  FileText, 
  Activity, 
  Map,
  ExternalLink,
  Search,
  Link as LinkIcon
} from 'lucide-react';
import { dashboardsRegistry } from '@/lib/data';
import GlassCard from '@/components/shared/GlassCard';
import { useState, useMemo } from 'react';
import { DashboardNavItem } from '@/lib/types';

const iconMap: Record<string, any> = {
  LayoutDashboard,
  BarChart3,
  Building2,
  Zap,
  ShieldCheck,
  ShoppingCart,
  ClipboardCheck,
  FileText,
  Activity,
  Map
};

function RegistryCard({ dash, idx }: { dash: DashboardNavItem, idx: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const IconComp = iconMap[dash.icon] || LayoutDashboard;

  // Map raw keys to human-readable labels for exact matching with admin portal
  const categoryLabel = dash.category === 'OTHER' 
    ? (dash.customCategory || 'Other') 
    : dash.category === 'DASHBOARD' ? 'Dashboard' 
    : dash.category === 'REPORT' ? 'Report' 
    : dash.category;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.05 }}
      whileHover={{ y: -4, borderColor: 'rgba(212, 175, 55, 0.2)' }}
      style={{
        padding: '24px',
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(20px)',
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        transition: 'all 300ms ease',
        position: 'relative',
        overflow: 'hidden',
        height: '100%'
      }}
    >
      <div style={{ 
        position: 'absolute', top: -50, right: -50, width: 100, height: 100, 
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', gap: 16, flex: 1 }}>
          <div style={{ 
            width: 52, height: 52, borderRadius: 16, 
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)', 
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#94a3b8', boxShadow: '0 8px 16px -4px rgba(0,0,0,0.2)'
          }}>
            <IconComp size={24} strokeWidth={1.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ 
              fontSize: 18, fontWeight: 700, color: 'white', margin: 0, 
              letterSpacing: '-0.02em', marginBottom: 6
            }}>{dash.name}</p>
            
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ 
                  width: 8, height: 8, borderRadius: '50%', 
                  background: dash.status === 'LIVE' ? '#10b981' : dash.status === 'HOLD' ? '#f59e0b' : dash.status === 'BLOCKED' ? '#ef4444' : '#64748b',
                  boxShadow: dash.status === 'LIVE' ? '0 0 12px rgba(16,185,129,0.8)' : 'none'
                }} 
                className={dash.status === 'LIVE' ? 'animate-pulse' : ''}
                />
                <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {dash.status}
                </span>
              </div>
              
              <div style={{ 
                padding: '2px 8px', 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {categoryLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {dash.description && (
          <div style={{ position: 'relative' }}>
            <p style={{ 
              fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, 
              fontWeight: 450, lineHeight: 1.6,
              transition: 'all 300ms ease'
            }}>
              {isExpanded ? dash.description : `${dash.description.slice(0, 140)}${dash.description.length > 140 ? '...' : ''} `}
              {(dash.description.length > 140) && (
                <span 
                  onClick={() => setIsExpanded(!isExpanded)}
                  style={{
                    color: '#a78bfa',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    opacity: 0.8,
                    transition: 'opacity 200ms',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
                >
                  {isExpanded ? ' (Show Less)' : 'Read More'}
                </span>
              )}
            </p>
          </div>
      )}

      {dash.links && dash.links.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: 12,
          marginTop: 'auto'
        }}>
          {dash.links.map((sl, sIdx) => (
            <motion.a 
              key={sIdx} 
              href={sl.url} 
              target="_blank" 
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.06)' }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '14px 16px', borderRadius: 14, 
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)', 
                color: 'white', fontSize: 13, fontWeight: 600, 
                textDecoration: 'none', transition: 'all 200ms',
                minWidth: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <LinkIcon size={14} style={{ color: '#D4AF37', flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {sl.label || 'Open Resource'}
              </span>
            </motion.a>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function DashboardRegistry({ items: externalItems }: { items?: DashboardNavItem[] }) {
  const [search, setSearch] = useState('');
  const registryToFilter = externalItems || dashboardsRegistry;

  const filteredDashboards = useMemo(() => {
    if (!search) return registryToFilter;
    const q = search.toLowerCase();
    return registryToFilter.filter(d => 
      d.name.toLowerCase().includes(q) || 
      (d.category === 'OTHER' ? d.customCategory : d.category)?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q)
    );
  }, [search, registryToFilter]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(filteredDashboards.map(d => 
      d.category === 'OTHER' ? (d.customCategory || 'Other Resources') : d.category
    )));
    return cats.sort();
  }, [filteredDashboards]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      style={{ isolation: 'isolate' }}
    >
      <GlassCard padding="none">
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: '1px solid rgba(255,255,255,0.05)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          background: 'rgba(255,255,255,0.01)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 36, height: 36, borderRadius: '10px', 
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)', 
              color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.1)'
            }}>
              <LayoutDashboard size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Global Registry</h2>
              <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: 0, fontWeight: 500 }}>{registryToFilter.length} platforms connected</p>
            </div>
          </div>
          
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input 
              type="text" 
              placeholder="Filter by name or platform..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: 220,
                padding: '8px 12px 8px 36px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: 13,
                color: 'white',
                outline: 'none',
                transition: 'all 200ms',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {registryToFilter.length === 0 ? (
            <div style={{ padding: '80px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LayoutDashboard size={32} style={{ color: 'rgba(139, 92, 246, 0.35)' }} />
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>No current data available</p>
                <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Registry platforms will appear here when connected</p>
              </div>
            </div>
          ) : categories.length > 0 ? categories.map((cat, catIdx) => (
            <div key={cat} style={{ marginBottom: catIdx === categories.length - 1 ? 0 : 40 }}>
              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ 
                  padding: '6px 14px', 
                  background: 'rgba(139, 92, 246, 0.1)', 
                  border: '1px solid rgba(139, 92, 246, 0.2)', 
                  borderRadius: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {cat === 'DASHBOARD' ? 'Dashboard' : cat === 'REPORT' ? 'Report' : cat}
                  </span>
                </div>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(255,255,255,0.08), transparent)' }} />
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
                gap: 20 
              }}>
                {filteredDashboards
                  .filter(d => (d.category === 'OTHER' ? (d.customCategory || 'Other Resources') : d.category) === cat)
                  .map((dash, idx) => (
                    <RegistryCard key={dash.id} dash={dash} idx={idx} />
                  ))
                }
              </div>
            </div>
          )) : (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.1)', marginBottom: 12 }}><Search size={40} style={{ margin: '0 auto' }} /></div>
              <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Electronic platform "{search}" not found in current registry phase.</p>
            </div>
          )}
        </div>
        
        <div style={{ 
          padding: '24px 32px', 
          borderTop: '1px solid rgba(255,255,255,0.04)', 
          background: 'rgba(0,0,0,0.3)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderRadius: '0 0 24px 24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }} className="animate-pulse" />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>SYSTEM STATUS: OPTIMAL</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.6 }}>
            <ShieldCheck size={14} style={{ color: '#D4AF37' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: 'white', letterSpacing: '0.1em' }}>ELITE CRYPTOGRAPHIC SYNC</span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
