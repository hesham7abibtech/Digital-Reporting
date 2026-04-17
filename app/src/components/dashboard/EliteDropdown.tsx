import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar, Sparkles, Check } from 'lucide-react';

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
      const menuEstimatedH = Math.min(450, (options.length + 1) * 42 + 60);
      const spaceBelow = viewportH - rect.bottom;
      const spaceAbove = rect.top;
      const flipUp = spaceBelow < menuEstimatedH && spaceAbove > spaceBelow;
      const maxH = Math.min(450, flipUp ? spaceAbove - 16 : spaceBelow - 16);

      setCoords({
        top: flipUp ? rect.top : rect.bottom,
        left: rect.left,
        width: rect.width,
        flipUp,
        maxH: Math.max(120, maxH),
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Also check if click is within the portaled menu
        const menu = document.getElementById('elite-dropdown-portal');
        if (menu && menu.contains(event.target as Node)) return;
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed',
            ...(coords.flipUp
              ? { bottom: window.innerHeight - coords.top + 6 }
              : { top: coords.top + 6 }),
            left: coords.left,
            zIndex: 99999,
            minWidth: coords.width,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(32px)',
            borderRadius: 14,
            border: '1.5px solid #d0ab82',
            padding: 8,
            boxShadow: '0 15px 40px rgba(0, 63, 73, 0.12)',
            maxHeight: coords.maxH,
            overflowY: 'auto',
            width: 'max-content',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
          className="elite-scrollbar"
        >
          <div style={{ position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', zIndex: 10, padding: '4px 4px 10px', display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1.5px solid rgba(0, 63, 73, 0.05)', marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 950, color: '#d0ab82', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{menuLabel || 'Selection'}</span>
            <input
              type="text"
              autoFocus
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(0, 63, 73, 0.05)',
                border: '1px solid rgba(0, 63, 73, 0.1)',
                fontSize: 12,
                fontWeight: 700,
                color: '#003f49',
                outline: 'none'
              }}
            />
          </div>

          {isMulti && (
            <div
              onClick={() => handleOptionClick(allLabel)}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 850,
                color: value.includes(allLabel) ? TEAL : GOLD,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: value.includes(allLabel) ? 'rgba(0, 150, 200, 0.1)' : 'transparent',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 4,
                border: value.includes(allLabel) ? `1.5px solid ${GOLD}` : '1.5px solid transparent'
              }}
            >
              <div style={{ 
                width: 18, height: 18, borderRadius: 4, 
                border: `1.5px solid ${value.includes(allLabel) ? 'var(--teal)' : 'rgba(0, 63, 73, 0.2)'}`,
                marginRight: 10, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: value.includes(allLabel) ? 'var(--teal)' : 'transparent',
              }}>
                {value.includes(allLabel) && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <Check size={12} color="#ffffff" strokeWidth={4} />
                  </motion.div>
                )}
              </div>
              {allLabel}
            </div>
          )}
          {filteredOptions.map((option) => (
            <motion.div
              key={option.value}
              whileHover={{ 
                backgroundColor: 'rgba(0, 63, 73, 0.04)',
                paddingLeft: 18
              }}
              onClick={() => handleOptionClick(option.value)}
              style={{
                padding: '10px 14px',
                paddingLeft: 14,
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 800,
                color: isSelected(option.value) ? TEAL : 'rgba(0, 63, 73, 0.9)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: isSelected(option.value) ? 'rgba(0, 150, 200, 0.1)' : 'transparent',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 4,
                whiteSpace: 'nowrap'
              }}
            >
              <div style={{ 
                width: 18, height: 18, borderRadius: isMulti ? 4 : '50%', 
                border: `1.5px solid ${isSelected(option.value) ? 'var(--teal)' : 'rgba(0, 63, 73, 0.2)'}`,
                marginRight: 10, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isSelected(option.value) ? 'var(--teal)' : 'transparent',
              }}>
                {isSelected(option.value) && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    {isMulti ? <Check size={12} color="#ffffff" strokeWidth={4} /> : <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffffff' }} />}
                  </motion.div>
                )}
              </div>
              {option.label}
            </motion.div>
          ))}
          {filteredOptions.length === 0 && (
            <div style={{ padding: '12px 14px', fontSize: 10, fontWeight: 800, color: 'var(--text-dim)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
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
          scale: 1.01,
          borderColor: '#d0ab82',
          background: 'rgba(208, 171, 130, 0.05)'
        }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 18px',
          borderRadius: 14,
          background: 'rgba(255, 255, 255, 0.65)',
          border: `1.5px solid ${GOLD}`,
          color: TEAL,
          fontSize: 13,
          fontWeight: 800,
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 30px rgba(0, 0, 0, 0.2)' : 'none',
          transition: 'all 0.2s ease',
          minWidth: 150,
          width: fullWidth ? '100%' : 'auto',
          justifyContent: 'space-between',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <Sparkles size={16} style={{ opacity: 1, color: GOLD }} />
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 13, fontWeight: 1000 }}>{getLabel()}</span>
        </div>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <ChevronDown size={16} strokeWidth={2.5} />
        </motion.div>
      </motion.button>

      {typeof document !== 'undefined' && createPortal(menuContent, document.body)}
    </div>
  );
}
