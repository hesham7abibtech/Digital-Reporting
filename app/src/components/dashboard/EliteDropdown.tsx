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
}

export default function EliteDropdown({ 
  value, options, onChange, label, menuLabel, isMulti, 
  allLabel = 'All Categories', fullWidth = false 
}: EliteDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, flipUp: false, maxH: 450 });
  const [searchTerm, setSearchTerm] = useState('');

  const getLabel = () => {
    if (isMulti && Array.isArray(value)) {
      if (value.includes(allLabel) || value.length === 0) return allLabel;
      if (value.length === 1) return options.find(o => o.value === value[0])?.label || value[0];
      return `${value.length} Selection`;
    }
    const selectedOption = options.find(opt => opt.value === value) || options[0];
    return selectedOption?.label;
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

  const filteredOptions = options.filter(opt => 
    opt.label !== allLabel && opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            background: '#0a0a0a', // Deep Black for Contrast
            backdropFilter: 'blur(32px)',
            borderRadius: 16,
            border: `1.5px solid ${GOLD}`,
            padding: 8,
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
            maxHeight: coords.maxH,
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
          className="elite-scrollbar"
        >
          <div style={{ position: 'sticky', top: -8, margin: '-8px -8px 8px -8px', background: 'rgba(10, 10, 10, 0.95)', backdropFilter: 'blur(12px)', zIndex: 10, padding: '16px 14px 12px', display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1.5px solid rgba(208, 171, 130, 0.15)' }}>
            <span style={{ fontSize: 10, fontWeight: 950, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.15em' }}>{menuLabel || 'Filter Selection'}</span>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: GOLD }} />
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
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1.5px solid rgba(208, 171, 130, 0.2)',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#ffffff',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = GOLD}
                onBlur={(e) => e.target.style.borderColor = 'rgba(208, 171, 130, 0.2)'}
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
                color: value.includes(allLabel) ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: value.includes(allLabel) ? 'rgba(208, 171, 130, 0.25)' : 'transparent',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 4,
                border: value.includes(allLabel) ? `1.5px solid ${GOLD}` : '1.5px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (!value.includes(allLabel)) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                if (!value.includes(allLabel)) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ 
                width: 20, height: 20, borderRadius: 6, 
                border: `2px solid ${value.includes(allLabel) ? GOLD : 'rgba(255, 255, 255, 0.2)'}`,
                marginRight: 12, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: value.includes(allLabel) ? GOLD : 'transparent',
              }}>
                {value.includes(allLabel) && (
                  <Check size={14} color="#000000" strokeWidth={4} />
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
                color: isSelected(option.value) ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                backgroundColor: isSelected(option.value) ? 'rgba(208, 171, 130, 0.2)' : 'transparent',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 2,
                whiteSpace: 'normal',
                lineHeight: '1.4',
                wordBreak: 'break-word',
                border: isSelected(option.value) ? `1.5px solid ${GOLD}60` : '1.5px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isSelected(option.value) ? 'rgba(208, 171, 130, 0.3)' : 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.paddingLeft = '18px';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isSelected(option.value) ? 'rgba(208, 171, 130, 0.2)' : 'transparent';
                e.currentTarget.style.paddingLeft = '14px';
              }}
            >
              <div style={{ 
                width: 20, height: 20, borderRadius: isMulti ? 6 : '50%', 
                border: `2px solid ${isSelected(option.value) ? GOLD : 'rgba(255, 255, 255, 0.2)'}`,
                marginRight: 12, 
                marginTop: 2,
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isSelected(option.value) ? GOLD : 'transparent',
              }}>
                {isSelected(option.value) && (
                  isMulti ? <Check size={14} color="#000000" strokeWidth={4} /> : <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#000000' }} />
                )}
              </div>
              {option.label}
            </div>
          ))}
          {filteredOptions.length === 0 && (
            <div style={{ padding: '20px 14px', fontSize: 11, fontWeight: 800, color: 'rgba(255, 255, 255, 0.3)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
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
        whileHover={{ 
          scale: 1.04,
          borderColor: GOLD,
          background: '#000000',
          boxShadow: `0 0 25px ${GOLD}40`
        }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 18px',
          borderRadius: 14,
          background: '#000000', // Pure black for maximum contrast
          border: `2.5px solid ${isOpen ? GOLD : 'rgba(208, 171, 130, 0.4)'}`,
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 950,
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen ? `0 0 40px ${GOLD}50` : 'none',
          transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          minWidth: 140,
          width: fullWidth ? '100%' : 'auto',
          justifyContent: 'space-between',
          position: 'relative',
          backdropFilter: 'none' // Backdrop filter not needed on pure black
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1, minWidth: 0 }}>
          <Sparkles size={16} style={{ opacity: 1, color: GOLD }} />
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11, fontWeight: 950, whiteSpace: 'nowrap' }}>{getLabel()}</span>
        </div>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0, color: isOpen ? GOLD : '#ffffff' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <ChevronDown size={16} strokeWidth={3} />
        </motion.div>
      </motion.button>

      {typeof document !== 'undefined' && createPortal(menuContent, document.body)}
    </div>
  );
}
