'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, RotateCcw, Check, CheckSquare, Square } from 'lucide-react';
import { ColumnDef, ColumnSettings } from '@/hooks/useTableColumns';

interface ColumnSettingsDropdownProps {
  columns: ColumnDef<any>[];
  settings: Record<string, ColumnSettings>;
  onToggle: (id: string) => void;
  onReset: () => void;
}

export default function ColumnSettingsDropdown({
  columns,
  settings,
  onToggle,
  onReset
}: ColumnSettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    <div className="relative" ref={dropdownRef} style={{ display: 'inline-block' }}>
      <button
        onClick={toggleDropdown}
        title="Column Settings"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 12,
          background: isOpen ? 'rgba(208, 171, 130, 0.12)' : 'rgba(255, 255, 255, 0.8)',
          border: `1px solid ${isOpen ? '#d0ab82' : 'rgba(0, 63, 73, 0.25)'}`,
          color: isOpen ? '#d0ab82' : '#003f49',
          cursor: 'pointer',
          transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '0 0 15px rgba(208, 171, 130, 0.2)' : '0 2px 10px rgba(0, 0, 0, 0.05)'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
            e.currentTarget.style.color = '#d0ab82';
            e.currentTarget.style.borderColor = '#d0ab82';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
            e.currentTarget.style.color = '#003f49';
            e.currentTarget.style.borderColor = 'rgba(0, 63, 73, 0.25)';
          }
        }}
      >
        <SlidersHorizontal size={18} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 240,
              background: 'rgba(12, 12, 20, 0.98)',
              backdropFilter: 'blur(32px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 12,
              padding: 12,
              zIndex: 1000,
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span className="brand-heading" style={{ fontSize: 11, fontWeight: 950, color: '#d0ab82', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Columns</span>
              <button
                onClick={onReset}
                style={{
                  background: 'none', border: 'none', color: '#FF4C4F', fontSize: 11, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 4, fontWeight: 700
                }}
                className="hover:bg-[rgba(255,76,79,0.1)]"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 300, overflowY: 'auto' }}>
              {columns.map(col => {
                const isVisible = settings[col.id]?.visible ?? true;
                const isDisabled = col.alwaysVisible;
                return (
                  <button
                    key={col.id}
                    onClick={() => !isDisabled && onToggle(col.id)}
                    disabled={isDisabled}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '8px 10px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      color: isDisabled ? 'rgba(255, 255, 255, 0.3)' : isVisible ? '#d0ab82' : 'rgba(255, 255, 255, 0.65)',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 150ms ease'
                    }}
                    onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.background = 'rgba(208, 171, 130, 0.08)'; }}
                    onMouseLeave={e => { if (!isDisabled) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ color: isVisible ? '#d0ab82' : 'rgba(255, 255, 255, 0.2)' }}>
                      {isVisible ? <CheckSquare size={16} strokeWidth={2.5} /> : <Square size={16} strokeWidth={2.5} />}
                    </div>
                    {col.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
