'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface EliteDatePickerProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: boolean;
}

const MONTHS: Record<string, string> = {
  '01': 'JAN', '02': 'FEB', '03': 'MAR', '04': 'APR', '05': 'MAY', '06': 'JUN',
  '07': 'JUL', '08': 'AUG', '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DEC'
};

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export default function EliteDatePicker({ value, onChange, disabled, placeholder = 'DD-MMM-YYYY', error }: EliteDatePickerProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState(value || '');

  useEffect(() => {
    setDisplayValue(value || '');
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.toUpperCase();
    let clean = raw.replace(/[^0-9A-Z]/g, '');
    
    // If the user is deleting (new length < old length), don't auto-format to avoid fighting the user
    const isDeleting = raw.length < displayValue.length;
    let formatted = raw;

    if (!isDeleting) {
      if (clean.length === 2 && /^\d{2}$/.test(clean)) {
        formatted = `${clean}-`;
      } else if (clean.length === 4 && /^\d{4}$/.test(clean)) {
        const d = clean.slice(0, 2);
        const m = clean.slice(2, 4);
        const monthAbbr = MONTHS[m];
        if (monthAbbr) {
          formatted = `${d}-${monthAbbr}-`;
        }
      } else if (clean.length === 8 && /^\d{2}[A-Z]*\d{4}$/.test(clean) === false) {
        // Handle full 8-digit numeric input
        const d = clean.slice(0, 2);
        const m = clean.slice(2, 4);
        const y = clean.slice(4);
        const monthAbbr = MONTHS[m];
        if (monthAbbr) {
          formatted = `${d}-${monthAbbr}-${y}`;
        }
      }
    }

    setDisplayValue(formatted);
    onChange(formatted);
  };

  const handleCalendarClick = () => {
    if (dateInputRef.current && !disabled) {
      if ('showPicker' in HTMLInputElement.prototype) {
        try {
          dateInputRef.current.showPicker();
        } catch (e) {
          dateInputRef.current.focus();
          dateInputRef.current.click();
        }
      } else {
        dateInputRef.current.focus();
        dateInputRef.current.click();
      }
    }
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nativeVal = e.target.value; // YYYY-MM-DD
    if (!nativeVal) return;
    
    const [year, month, day] = nativeVal.split('-');
    const mIdx = parseInt(month) - 1;
    const monthName = MONTH_NAMES[mIdx] || '???';
    const formatted = `${day}-${monthName}-${year}`;
    
    setDisplayValue(formatted);
    onChange(formatted);
  };

  return (
    <div style={{ position: 'relative', width: '100%', group: 'date-picker' } as any}>
      <input
        type="text"
        value={displayValue}
        onChange={handleTextChange}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '14px 44px 14px 18px',
          borderRadius: 14,
          background: disabled ? 'rgba(0,0,0,0.02)' : '#ffffff',
          border: error ? '2px solid #ef4444' : '1px solid rgba(0, 0, 0, 0.12)',
          color: '#0a1220',
          fontSize: 14,
          fontWeight: 700,
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'text',
          transition: 'all 200ms',
          fontFamily: 'inherit'
        }}
      />
      <button
        type="button"
        onClick={handleCalendarClick}
        disabled={disabled}
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(212, 175, 55, 0.05)',
          border: '1px solid rgba(212, 175, 55, 0.1)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          width: 28,
          height: 28,
          borderRadius: 8,
          color: '#D4AF37',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 200ms',
          opacity: disabled ? 0.3 : 1
        }}
      >
        <Calendar size={14} />
      </button>
      <input
        type="date"
        ref={dateInputRef}
        onChange={handleNativeChange}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          right: 0,
          top: 0,
          width: 0,
          height: 0,
          visibility: 'hidden'
        }}
      />
    </div>
  );
}
