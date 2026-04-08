'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export type TimeZone = {
  id: string;      // IANA ID (e.g. Africa/Cairo)
  name: string;    // Country Name (e.g. Egypt)
  code: string;    // ISO Code (e.g. EG)
  offset: string;  // Calculated Display Offset (e.g. GMT+2)
};

interface TimeZoneContextType {
  selectedTimeZone: TimeZone;
  setTimeZone: (id: string) => void;
  isUpdating: boolean;
  formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string;
  timeZones: TimeZone[];
}

const TimeZoneContext = createContext<TimeZoneContextType | undefined>(undefined);

// Major country-time mapping
const COUNTRY_MAP = [
  { id: 'Africa/Cairo', name: 'Egypt', code: 'EG' },
  { id: 'Asia/Dubai', name: 'United Arab Emirates', code: 'UAE' },
  { id: 'Asia/Riyadh', name: 'Saudi Arabia', code: 'KSA' },
  { id: 'Asia/Kuwait', name: 'Kuwait', code: 'KW' },
  { id: 'Asia/Qatar', name: 'Qatar', code: 'QA' },
  { id: 'Asia/Muscat', name: 'Oman', code: 'OM' },
  { id: 'Asia/Amman', name: 'Jordan', code: 'JO' },
  { id: 'Asia/Beirut', name: 'Lebanon', code: 'LB' },
  { id: 'Europe/London', name: 'United Kingdom', code: 'UK' },
  { id: 'Europe/Paris', name: 'France', code: 'FR' },
  { id: 'Europe/Berlin', name: 'Germany', code: 'DE' },
  { id: 'Europe/Rome', name: 'Italy', code: 'IT' },
  { id: 'Europe/Madrid', name: 'Spain', code: 'ES' },
  { id: 'Europe/Istanbul', name: 'Turkey', code: 'TR' },
  { id: 'America/New_York', name: 'United States (East)', code: 'USA' },
  { id: 'America/Los_Angeles', name: 'United States (West)', code: 'USA' },
  { id: 'America/Chicago', name: 'United States (Central)', code: 'USA' },
  { id: 'America/Toronto', name: 'Canada (East)', code: 'CA' },
  { id: 'Asia/Tokyo', name: 'Japan', code: 'JP' },
  { id: 'Asia/Shanghai', name: 'China', code: 'CN' },
  { id: 'Asia/Singapore', name: 'Singapore', code: 'SG' },
  { id: 'Asia/Seoul', name: 'South Korea', code: 'KR' },
  { id: 'Asia/Kolkata', name: 'India', code: 'IN' },
  { id: 'Australia/Sydney', name: 'Australia (East)', code: 'AU' },
  { id: 'Australia/Perth', name: 'Australia (West)', code: 'AU' },
  { id: 'Africa/Johannesburg', name: 'South Africa', code: 'SA' },
  { id: 'Africa/Casablanca', name: 'Morocco', code: 'MA' },
  { id: 'UTC', name: 'Coordinated Universal Time', code: 'UTC' },
];

function getOffset(timeZone: string) {
  try {
    const d = new Date();
    // Using a more robust formatting-based approach for offsets
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset'
    }).formatToParts(d);
    const offsetPart = parts.find(p => p.type === 'timeZoneName');
    return offsetPart ? offsetPart.value : 'GMT+0';
  } catch (e) {
    return 'GMT+0';
  }
}

export function TimeZoneProvider({ children }: { children: React.ReactNode }) {
  const allTimeZones = useMemo(() => {
    return COUNTRY_MAP.map(item => ({
      ...item,
      offset: getOffset(item.id)
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const [selectedTimeZone, setSelectedTimeZone] = useState<TimeZone>(() => {
    return allTimeZones.find(z => z.id === 'Africa/Cairo') || allTimeZones[0];
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const setTimeZone = useCallback((id: string) => {
    const zone = allTimeZones.find(z => z.id === id);
    if (zone) {
      setIsUpdating(true);
      setSelectedTimeZone(zone);
      setTimeout(() => setIsUpdating(false), 800);
    }
  }, [allTimeZones]);

  const formatDate = useCallback((date: string | Date, options: Intl.DateTimeFormatOptions = {}) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      timeZone: selectedTimeZone.id,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...options,
    }).format(d);
  }, [selectedTimeZone]);

  const formatTime = useCallback((date: string | Date, options: Intl.DateTimeFormatOptions = {}) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      timeZone: selectedTimeZone.id,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      ...options,
    }).format(d);
  }, [selectedTimeZone]);

  return (
    <TimeZoneContext.Provider value={{ selectedTimeZone, setTimeZone, isUpdating, formatDate, formatTime, timeZones: allTimeZones }}>
      {children}
    </TimeZoneContext.Provider>
  );
}

export function useTimeZone() {
  const context = useContext(TimeZoneContext);
  if (!context) throw new Error('useTimeZone must be used within a TimeZoneProvider');
  return context;
}
