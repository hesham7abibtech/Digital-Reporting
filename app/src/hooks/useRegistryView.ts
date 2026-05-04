'use client';

import { useState, useCallback, useEffect } from 'react';

export type RegistryViewMode = 'table' | 'dashboard';

const STORAGE_KEY = 'deliverables-registry-view';

export function useRegistryView(defaultView: RegistryViewMode = 'table') {
  const [activeView, setActiveViewState] = useState<RegistryViewMode>(defaultView);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount - DISABLED to ensure Table View is always the default on load
  useEffect(() => {
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
