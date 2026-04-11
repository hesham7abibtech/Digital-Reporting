import React, { useState, useRef, useEffect } from 'react';
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
}

export default function EliteDropdown({ value, options, onChange, label, menuLabel, isMulti, allLabel = 'All Departments' }: EliteDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getLabel = () => {
    if (isMulti && Array.isArray(value)) {
      if (value.includes(allLabel) || value.length === 0) return allLabel;
      if (value.length === 1) return options.find(o => o.value === value[0])?.label || value[0];
      return `${value.length} Departments`;
    }
    const selectedOption = options.find(opt => opt.value === value) || options[0];
    return selectedOption?.label;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
      // Remove "All" if a specific one is selected
      newValue = newValue.filter(v => v !== allLabel);
      
      if (newValue.includes(optionValue)) {
        newValue = newValue.filter(v => v !== optionValue);
        // If empty, revert to All
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

  return (
    <div ref={containerRef} style={{ position: 'relative', width: 'auto' }}>
      <motion.button
        whileHover={{ 
          scale: 1.02,
          borderColor: 'rgba(212, 175, 55, 0.4)',
          boxShadow: '0 0 20px rgba(212, 175, 55, 0.1)'
        }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 20px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(23, 23, 26, 0.8) 0%, rgba(10, 10, 12, 0.9) 100%)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          backdropFilter: 'blur(16px)',
          color: '#D4AF37',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 30px rgba(212, 175, 55, 0.2)' : '0 8px 32px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minWidth: 140,
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ 
          position: 'absolute', inset: 0, 
          background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.05), transparent)',
          transform: 'translateX(-100%)',
          animation: 'shimmer 3s infinite',
          pointerEvents: 'none'
        }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
          <Sparkles size={14} style={{ opacity: 0.7, color: '#D4AF37' }} />
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 11 }}>{getLabel()}</span>
        </div>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <ChevronDown size={14} />
        </motion.div>

        <style jsx>{`
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `}</style>
      </motion.button>

      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              zIndex: 2000,
              minWidth: '100%',
              background: 'linear-gradient(180deg, rgba(10, 10, 15, 0.95) 0%, rgba(5, 5, 8, 0.98) 100%)',
              backdropFilter: 'blur(24px)',
              borderRadius: 18,
              border: '1px solid rgba(212, 175, 55, 0.15)',
              padding: 8,
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(212, 175, 55, 0.1)',
              maxHeight: 320,
              overflowY: 'auto',
              width: 'max-content'
            }}
          >
            <div style={{ padding: '4px 12px 10px', fontSize: 10, color: 'rgba(212, 175, 55, 0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {menuLabel || 'Select Variable'}
            </div>
            {options.map((option) => (
              <motion.div
                key={option.value}
                whileHover={{ 
                  background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.1) 0%, transparent 100%)',
                  paddingLeft: 18
                }}
                onClick={() => handleOptionClick(option.value)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  color: isSelected(option.value) ? '#D4AF37' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  background: isSelected(option.value) ? 'rgba(212, 175, 55, 0.08)' : 'transparent',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 2,
                  whiteSpace: 'nowrap'
                }}
              >
                {/* Checkbox / Circle UI */}
                <div style={{ 
                  width: 16, height: 16, borderRadius: isMulti ? 4 : '50%', 
                  border: `1px solid ${isSelected(option.value) ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`,
                  marginRight: 12, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isSelected(option.value) ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                  boxShadow: isSelected(option.value) ? '0 0 10px rgba(212, 175, 55, 0.2)' : 'none'
                }}>
                  {isSelected(option.value) && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      {isMulti ? <Check size={10} color="#D4AF37" strokeWidth={3} /> : <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4AF37' }} />}
                    </motion.div>
                  )}
                </div>
                {option.label}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
