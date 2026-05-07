import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar, Sparkles, Check, Search } from 'lucide-react';

const GOLD = '#d0ab82';
const TEAL = '#003f49';

interface DropdownOption {
  label: string;
  value: string | number;
}

interface EliteDropdownProps {
  value: any; // string | number | (string | number)[]
  options: DropdownOption[];
  onChange: (value: any) => void;
  label?: string;
  menuLabel?: string;
  isMulti?: boolean;
  allLabel?: string;
  fullWidth?: boolean;
  variant?: 'elite' | 'form' | 'export';
  error?: boolean;
}

export default function EliteDropdown({ 
  value, options, onChange, label, menuLabel, isMulti, 
  allLabel = 'All Categories', fullWidth = false,
  variant = 'elite', error = false
}: EliteDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, flipUp: false, maxH: 450 });
  const [searchTerm, setSearchTerm] = useState('');

  const getLabel = () => {
    if (isMulti && Array.isArray(value)) {
      const filtered = value.filter(v => v !== allLabel);
      if (filtered.length === 0) return allLabel;
      const selectedLabels = filtered.map(v => options.find(o => o.value === v)?.label || v);
      const joined = selectedLabels.join(', ');
      return joined.length > 35 ? `${filtered.length} Selections` : joined;
    }
    const selectedOption = options.find(opt => opt.value === value);
    if (selectedOption) return selectedOption.label;
    return value || allLabel;
  };

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const viewportW = window.innerWidth;
      
      const menuWidth = 280; 
      const menuHeight = Math.min(450, (options.length + 1) * 42 + 100);
      
      const spaceBelow = viewportH - rect.bottom;
      const spaceAbove = rect.top;
      const flipUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
      
      // Vertical safety
      const maxH = Math.min(450, flipUp ? spaceAbove - 20 : spaceBelow - 20);
      
      // Horizontal safety - CRITICAL FIX
      let left = rect.left;
      if (left + menuWidth > viewportW - 24) {
        left = viewportW - menuWidth - 24;
      }
      if (left < 24) left = 24;

      setCoords({
        top: flipUp ? rect.top : rect.bottom,
        left: left,
        width: rect.width,
        flipUp,
        maxH: Math.max(160, maxH),
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      const handleEvents = () => updateCoords();
      window.addEventListener('scroll', handleEvents, true);
      window.addEventListener('resize', handleEvents);
      return () => {
        window.removeEventListener('scroll', handleEvents, true);
        window.removeEventListener('resize', handleEvents);
      };
    }
  }, [isOpen, options.length]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const portal = document.getElementById('elite-dropdown-portal');
        if (portal && portal.contains(event.target as Node)) return;
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOptionClick = (optionValue: string | number) => {
    if (!isMulti) {
      onChange(optionValue);
      setIsOpen(false);
      return;
    }

    let newValue = Array.isArray(value) ? [...value] : [value];
    
    if (optionValue === allLabel) {
      newValue = [allLabel];
    } else {
      newValue = newValue.filter(v => v !== allLabel);
      if (newValue.includes(optionValue)) {
        newValue = newValue.filter(v => v !== optionValue);
        if (newValue.length === 0) newValue = [allLabel];
      } else {
        newValue.push(optionValue);
      }
    }
    onChange(newValue);
  };

  const isSelected = (val: string | number) => {
    if (isMulti && Array.isArray(value)) {
      return value.includes(val);
    }
    return value === val;
  };

  const filteredOptions = options.filter(opt => {
    const labelStr = String(opt.label || '');
    return labelStr !== allLabel && labelStr.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const menuContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          id="elite-dropdown-portal"
          ref={menuRef}
          initial={{ opacity: 0, y: coords.flipUp ? -10 : 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: coords.flipUp ? -5 : 5, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed',
            ...(coords.flipUp
              ? { bottom: window.innerHeight - coords.top + 8 }
              : { top: coords.top + 8 }),
            left: coords.left,
            zIndex: 99999,
            width: 280,
            background: variant === 'elite' ? '#0a0a0a' : '#ffffff',
            backdropFilter: variant === 'elite' ? 'blur(32px)' : 'none',
            borderRadius: 16,
            border: variant === 'elite' ? `1.5px solid ${GOLD}` : (variant === 'export' ? `1.5px solid ${GOLD}` : '1px solid rgba(0, 63, 73, 0.15)'),
            padding: 8,
            boxShadow: variant === 'elite' ? '0 25px 60px rgba(0, 0, 0, 0.6)' : '0 10px 40px rgba(0, 63, 73, 0.12)',
            maxHeight: coords.maxH,
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
          className="elite-scrollbar"
        >
          <div style={{ position: 'sticky', top: -8, margin: '-8px -8px 8px -8px', background: variant === 'elite' ? 'rgba(10, 10, 10, 0.95)' : 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)', zIndex: 10, padding: '16px 14px 12px', display: 'flex', flexDirection: 'column', gap: 8, borderBottom: variant === 'elite' ? '1.5px solid rgba(208, 171, 130, 0.15)' : '1px solid rgba(0, 63, 73, 0.08)' }}>
            <span style={{ fontSize: 10, fontWeight: 950, color: variant === 'elite' ? GOLD : TEAL, textTransform: 'uppercase', letterSpacing: '0.15em' }}>{menuLabel || 'Filter Selection'}</span>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: variant === 'elite' ? GOLD : TEAL, opacity: 0.6 }} />
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: 10,
                  background: variant === 'elite' ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
                  border: variant === 'elite' ? '1.5px solid rgba(208, 171, 130, 0.2)' : '1px solid rgba(0, 63, 73, 0.1)',
                  fontSize: 12,
                  fontWeight: 700,
                  color: variant === 'elite' ? '#ffffff' : TEAL,
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = variant === 'elite' ? GOLD : TEAL}
                onBlur={(e) => e.target.style.borderColor = variant === 'elite' ? 'rgba(208, 171, 130, 0.2)' : 'rgba(0, 63, 73, 0.1)'}
              />
            </div>
          </div>

          {isMulti && (
            <div
              onClick={() => handleOptionClick(allLabel)}
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 900,
                color: isSelected(allLabel) ? (variant === 'elite' ? '#ffffff' : TEAL) : (variant === 'elite' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 63, 73, 0.4)'),
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: isSelected(allLabel) ? (variant === 'elite' ? 'rgba(208, 171, 130, 0.25)' : 'rgba(0, 63, 73, 0.05)') : 'transparent',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 4,
                border: isSelected(allLabel) ? (variant === 'elite' ? `1.5px solid ${GOLD}` : `1px solid ${TEAL}`) : '1.5px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (!isSelected(allLabel)) e.currentTarget.style.backgroundColor = variant === 'elite' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 63, 73, 0.03)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected(allLabel)) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ 
                width: 20, height: 20, borderRadius: 6, 
                border: `2px solid ${isSelected(allLabel) ? (variant === 'elite' ? GOLD : TEAL) : (variant === 'elite' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 63, 73, 0.2)')}`,
                marginRight: 12, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isSelected(allLabel) ? (variant === 'elite' ? GOLD : TEAL) : 'transparent',
              }}>
                {isSelected(allLabel) && (
                  <Check size={14} color={variant === 'elite' ? '#000000' : '#ffffff'} strokeWidth={4} />
                )}
              </div>
              {allLabel}
            </div>
          )}
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => handleOptionClick(option.value)}
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 800,
                color: isSelected(option.value) ? (variant === 'elite' ? '#ffffff' : TEAL) : (variant === 'elite' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 63, 73, 0.7)'),
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                backgroundColor: isSelected(option.value) ? (variant === 'elite' ? 'rgba(208, 171, 130, 0.2)' : 'rgba(0, 63, 73, 0.05)') : 'transparent',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 2,
                whiteSpace: 'normal',
                lineHeight: '1.4',
                wordBreak: 'break-word',
                border: isSelected(option.value) ? (variant === 'elite' ? `1.5px solid ${GOLD}60` : `1px solid ${TEAL}40`) : '1.5px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isSelected(option.value) ? (variant === 'elite' ? 'rgba(208, 171, 130, 0.3)' : 'rgba(0, 63, 73, 0.1)') : (variant === 'elite' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 63, 73, 0.03)');
                e.currentTarget.style.paddingLeft = '18px';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isSelected(option.value) ? (variant === 'elite' ? 'rgba(208, 171, 130, 0.2)' : 'rgba(0, 63, 73, 0.05)') : 'transparent';
                e.currentTarget.style.paddingLeft = '14px';
              }}
            >
              <div style={{ 
                width: 20, height: 20, borderRadius: isMulti ? 6 : '50%', 
                border: `2px solid ${isSelected(option.value) ? (variant === 'elite' ? GOLD : TEAL) : (variant === 'elite' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 63, 73, 0.2)')}`,
                marginRight: 12, 
                marginTop: 2,
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isSelected(option.value) ? (variant === 'elite' ? GOLD : TEAL) : 'transparent',
              }}>
                {isSelected(option.value) && (
                  isMulti ? <Check size={14} color={variant === 'elite' ? '#000000' : '#ffffff'} strokeWidth={4} /> : <div style={{ width: 10, height: 10, borderRadius: '50%', background: variant === 'elite' ? '#000000' : '#ffffff' }} />
                )}
              </div>
              {option.label}
            </div>
          ))}
          {filteredOptions.length === 0 && (
            <div style={{ padding: '20px 14px', fontSize: 11, fontWeight: 800, color: variant === 'elite' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 63, 73, 0.3)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              No Match Found
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
      <motion.button
        whileHover={variant === 'elite' ? { 
          scale: 1.04,
          borderColor: GOLD,
          background: '#000000',
          boxShadow: `0 0 25px ${GOLD}40`
        } : { scale: 1.01, borderColor: TEAL }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderRadius: 12,
          background: variant === 'elite' ? '#000000' : '#eef2ff',
          border: error ? '2px solid #ef4444' : (variant === 'elite' ? `2.5px solid ${isOpen ? GOLD : 'rgba(208, 171, 130, 0.4)'}` : (variant === 'export' ? `1.5px solid ${isOpen ? GOLD : 'rgba(176, 141, 62, 0.3)'}` : `1px solid ${isOpen ? TEAL : 'rgba(0, 63, 73, 0.15)'}`)),
          color: variant === 'elite' ? '#ffffff' : TEAL,
          fontSize: variant === 'elite' ? 11 : 13,
          fontWeight: variant === 'elite' ? 950 : 700,
          cursor: 'pointer',
          outline: 'none',
          boxShadow: (variant === 'elite' && isOpen) ? `0 0 40px ${GOLD}50` : 'none',
          transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          minWidth: 140,
          width: fullWidth ? '100%' : 'auto',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1, minWidth: 0, flex: 1 }}>
          {variant === 'elite' && <Sparkles size={16} style={{ opacity: 1, color: GOLD }} />}
          <span style={{ 
            textTransform: variant === 'elite' ? 'uppercase' : 'none', 
            letterSpacing: variant === 'elite' ? '0.06em' : 'normal', 
            fontSize: variant === 'elite' ? 11 : 13, 
            fontWeight: variant === 'elite' ? 950 : 700, 
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
            textAlign: 'left'
          }}>{getLabel()}</span>
        </div>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0, color: variant === 'elite' ? (isOpen ? GOLD : '#ffffff') : TEAL }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}
        >
          <ChevronDown size={16} strokeWidth={variant === 'elite' ? 3 : 2} />
        </motion.div>
      </motion.button>

      {typeof document !== 'undefined' && createPortal(menuContent, document.body)}
    </div>
  );
}
