'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, RotateCcw, Check, CheckSquare, Square } from 'lucide-react';
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
          borderRadius: 10,
          background: isOpen ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${isOpen ? 'rgba(212, 175, 55, 0.3)' : 'rgba(255,255,255,0.06)'}`,
          color: isOpen ? '#D4AF37' : 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          transition: 'all 200ms ease',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.color = '#fff';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
          }
        }}
      >
        <Settings2 size={18} />
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
              background: 'rgba(15, 15, 20, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 12,
              zIndex: 1000,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Columns</span>
              <button
                onClick={onReset}
                style={{
                  background: 'none', border: 'none', color: '#3b82f6', fontSize: 11, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 4
                }}
                className="hover:bg-[rgba(59,130,246,0.1)]"
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
                      borderRadius: 6,
                      color: isDisabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      transition: 'background 150ms ease'
                    }}
                    className={!isDisabled ? "hover:bg-[rgba(255,255,255,0.04)]" : ""}
                  >
                    <div style={{ color: isVisible ? '#D4AF37' : 'rgba(255,255,255,0.2)' }}>
                      {isVisible ? <CheckSquare size={16} /> : <Square size={16} />}
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
