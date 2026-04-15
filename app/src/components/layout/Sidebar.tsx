'use client';

import { useState } from 'react';
import {
  LayoutDashboard, ClipboardList, Users, BarChart3, HeartPulse,
  Bell, Settings, ChevronLeft, ChevronRight, Hexagon
} from 'lucide-react';
import { navItems } from '@/lib/data';

const iconMap: Record<string, React.ReactNode> = {
  'layout-dashboard': <LayoutDashboard size={20} />,
  'clipboard-list': <ClipboardList size={20} />,
  'users': <Users size={20} />,
  'bar-chart-3': <BarChart3 size={20} />,
  'heart-pulse': <HeartPulse size={20} />,
  'bell': <Bell size={20} />,
  'settings': <Settings size={20} />,
};

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(true);

  const sidebarWidth = collapsed ? 76 : 240;

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100%',
        width: sidebarWidth,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--primary)',
        borderRight: '1px solid rgba(249, 248, 242, 0.1)',
        transition: 'width 300ms ease-out',
        overflow: 'hidden',
        boxShadow: '4px 0 20px rgba(0, 63, 73, 0.1)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          height: 64,
          borderBottom: '1px solid rgba(249, 248, 242, 0.08)',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Hexagon size={18} color="var(--primary)" />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <div className="brand-heading" style={{ fontSize: 13, color: 'var(--text-on-primary)' }}>ROH</div>
            <div style={{ fontSize: 9, color: 'rgba(249, 248, 242, 0.6)', fontWeight: 600, letterSpacing: '0.05em' }}>COMMAND CENTER</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 200ms',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: isActive ? 'rgba(249, 248, 242, 0.1)' : 'transparent',
                color: isActive ? 'var(--secondary)' : 'rgba(249, 248, 242, 0.6)',
              }}
            >
              <span style={{ flexShrink: 0, position: 'relative', display: 'flex' }}>
                {iconMap[item.icon]}
                {item.badge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: '#FF4C4F',
                      color: 'white',
                      fontSize: 9,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div style={{ padding: 12, borderTop: '1px solid rgba(249, 248, 242, 0.08)' }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            background: 'transparent',
            color: 'rgba(249, 248, 242, 0.4)',
            fontSize: 12,
            transition: 'all 200ms',
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      {/* User Avatar */}
      <div
        style={{
          padding: 16,
          borderTop: '1px solid rgba(249, 248, 242, 0.08)',
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-start',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            fontSize: 11,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          AR
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-on-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Ahmed Al-Rashid</div>
            <div style={{ fontSize: 10, color: 'rgba(249, 248, 242, 0.5)', fontWeight: 600 }}>Super Admin</div>
          </div>
        )}
      </div>
    </aside>
  );
}
