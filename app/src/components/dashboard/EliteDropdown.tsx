import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar, Sparkles, Check } from 'lucide-react';

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
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

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
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
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

  const menuContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          id="elite-dropdown-portal"
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 5, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute',
            top: coords.top + 8,
            left: coords.left,
            zIndex: 9999,
            minWidth: coords.width,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(32px)',
            borderRadius: 14,
            border: '1.5px solid #d0ab82',
            padding: 8,
            boxShadow: '0 15px 40px rgba(0, 63, 73, 0.12)',
            maxHeight: 320,
            overflowY: 'auto',
            width: 'max-content'
          }}
        >
          <div className="brand-heading" style={{ padding: '10px 14px 10px', fontSize: 11, color: '#d0ab82', borderBottom: '1.5px solid rgba(0, 63, 73, 0.1)', marginBottom: 8, fontWeight: 950, letterSpacing: '0.08em' }}>
            {menuLabel || 'Select Variable'}
          </div>
          {options.map((option) => (
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
                fontSize: 12,
                fontWeight: 700,
                color: isSelected(option.value) ? 'var(--teal)' : 'rgba(0, 63, 73, 0.8)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: isSelected(option.value) ? 'var(--aqua)' : 'transparent',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 2,
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
          border: '1.5px solid #d0ab82',
          color: '#003f49',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
          <Sparkles size={14} style={{ opacity: 0.9, color: '#d0ab82' }} />
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 11, fontWeight: 950 }}>{getLabel()}</span>
        </div>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <ChevronDown size={14} />
        </motion.div>
      </motion.button>

      {typeof document !== 'undefined' && createPortal(menuContent, document.body)}
    </div>
  );
}
