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
  hasChanges?: boolean;
}

export default function ColumnSettingsDropdown({
  columns,
  settings,
  onToggle,
  onReset,
  hasChanges = false
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
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 12px)',
              right: 0,
              width: 280,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(32px)',
              border: '1.5px solid #d0ab82',
              borderRadius: 16,
              padding: '16px',
              zIndex: 1000,
              boxShadow: '0 20px 50px rgba(0, 63, 73, 0.15), 0 0 0 1px rgba(208, 171, 130, 0.1)',
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: 16, 
              paddingBottom: 12, 
              borderBottom: '1px solid rgba(0, 63, 73, 0.08)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 4, height: 16, background: '#d0ab82', borderRadius: 2 }} />
                <span style={{ fontSize: 13, fontWeight: 950, color: '#003f49', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Column Layout
                </span>
              </div>
              {hasChanges && (
                <button
                  onClick={onReset}
                  style={{
                    background: 'rgba(255, 76, 79, 0.08)',
                    border: '1px solid rgba(255, 76, 79, 0.2)',
                    color: '#FF4C4F',
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 10px',
                    borderRadius: 8,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255, 76, 79, 0.12)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 76, 79, 0.08)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <RotateCcw size={12} strokeWidth={3} /> Reset
                </button>
              )}
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 6, 
              maxHeight: 400, 
              overflowY: 'auto',
              paddingRight: 4
            }} className="elite-scrollbar">
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
                      gap: 12,
                      width: '100%',
                      padding: '12px 14px',
                      background: isVisible ? 'rgba(0, 63, 73, 0.02)' : 'transparent',
                      border: `1.5px solid ${isVisible ? 'rgba(0, 63, 73, 0.08)' : 'transparent'}`,
                      borderRadius: 12,
                      color: isDisabled ? 'rgba(0, 63, 73, 0.3)' : '#003f49',
                      fontSize: 14.5,
                      fontWeight: 850,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                    onMouseEnter={e => { 
                      if (!isDisabled) {
                        e.currentTarget.style.background = 'rgba(208, 171, 130, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(208, 171, 130, 0.2)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseLeave={e => { 
                      if (!isDisabled) {
                        e.currentTarget.style.background = isVisible ? 'rgba(0, 63, 73, 0.02)' : 'transparent';
                        e.currentTarget.style.borderColor = isVisible ? 'rgba(0, 63, 73, 0.08)' : 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }
                    }}
                  >
                    <div style={{ 
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isVisible ? '#003f49' : 'transparent',
                      border: `2px solid ${isVisible ? '#003f49' : '#d0ab82'}`,
                      transition: 'all 200ms ease',
                    }}>
                      {isVisible && <Check size={14} color="#FFFFFF" strokeWidth={4} />}
                    </div>
                    <span style={{ 
                      opacity: isVisible ? 1 : 0.6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em'
                    }}>
                      {col.label}
                    </span>
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
