'use client';

import { useState, useCallback, useEffect } from 'react';

export type RegistryViewMode = 'table' | 'dashboard';

const STORAGE_KEY = 'deliverables-registry-view';

export function useRegistryView(defaultView: RegistryViewMode = 'table') {
  const [activeView, setActiveViewState] = useState<RegistryViewMode>(defaultView);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'table' || stored === 'dashboard') {
        setActiveViewState(stored);
      }
    } catch {
      // localStorage unavailable
    }
    setIsHydrated(true);
  }, []);

  const setActiveView = useCallback((view: RegistryViewMode) => {
    setActiveViewState(view);
    try {
      localStorage.setItem(STORAGE_KEY, view);
    } catch {
      // localStorage unavailable
    }
  }, []);

  return { activeView, setActiveView, isHydrated };
}
