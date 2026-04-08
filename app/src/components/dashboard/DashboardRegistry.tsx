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
  ChevronRight,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';
import { dashboardsRegistry } from '@/lib/data';
import GlassCard from '@/components/shared/GlassCard';
import { useState, useMemo } from 'react';

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

import { DashboardNavItem } from '@/lib/types';

export default function DashboardRegistry({ items: externalItems }: { items?: DashboardNavItem[] }) {
  const [search, setSearch] = useState('');
  
  const registryToFilter = externalItems || dashboardsRegistry;

  const filteredDashboards = useMemo(() => {
    if (!search) return registryToFilter;
    const q = search.toLowerCase();
    return registryToFilter.filter(d => 
      d.name.toLowerCase().includes(q) || 
      d.category.toLowerCase().includes(q)
    );
  }, [search, registryToFilter]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(filteredDashboards.map(d => d.category)));
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

        <div style={{ padding: '8px 0' }}>
          {registryToFilter.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LayoutDashboard size={24} style={{ color: 'rgba(139, 92, 246, 0.35)' }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No current data available</p>
                <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Registry platforms will appear here when connected</p>
              </div>
            </div>
          ) : categories.length > 0 ? categories.map((cat, catIdx) => (
            <div key={cat} style={{ marginBottom: catIdx === categories.length - 1 ? 0 : 12 }}>
              <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{cat}</span>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(255,255,255,0.05), transparent)' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', background: 'rgba(255,255,255,0.01)' }}>
                {filteredDashboards.filter(d => d.category === cat).map((dash) => {
                  const IconComp = iconMap[dash.icon] || LayoutDashboard;
                  return (
                    <motion.a
                      key={dash.id}
                      href={dash.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)', x: 4 }}
                      style={{
                        padding: '16px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textDecoration: 'none',
                        transition: 'all 200ms ease-out',
                        borderBottom: '1px solid rgba(255,255,255,0.02)',
                        background: 'transparent'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ 
                          width: 44, height: 44, borderRadius: '12px', 
                          background: 'rgba(255,255,255,0.02)', 
                          border: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#94a3b8',
                          transition: 'all 300ms'
                        }}>
                          <IconComp size={22} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', margin: 0 }}>{dash.name}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <div style={{ 
                              width: 6, height: 6, borderRadius: '50%', 
                              background: dash.status === 'LIVE' ? '#10b981' : dash.status === 'UPDATING' ? '#3b82f6' : '#64748b',
                              boxShadow: dash.status === 'LIVE' ? '0 0 10px rgba(16,185,129,0.5)' : 'none'
                            }} 
                            className={dash.status === 'LIVE' ? 'animate-pulse' : ''}
                            />
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {dash.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="arrow-icon" style={{ opacity: 0.2, transition: 'all 200ms' }}>
                        <ChevronRight size={18} />
                      </div>
                    </motion.a>
                  );
                })}
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
          padding: '16px 24px', 
          borderTop: '1px solid rgba(255,255,255,0.04)', 
          background: 'rgba(0,0,0,0.2)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>System Integrity: Nominal</span>
          </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.4 }}>
             <ExternalLink size={12} />
             <span style={{ fontSize: 11, fontWeight: 600 }}>SYNC SECURE</span>
           </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
