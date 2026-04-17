'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

export interface ColumnDef<TField = string> {
  id: string;
  field: TField;
  label: string;
  align?: 'left' | 'center' | 'right';
  priority?: 'high' | 'medium' | 'low';
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  alwaysVisible?: boolean;
  width?: number;
  visible?: boolean;
}

export interface ColumnSettings {
  visible: boolean;
  width: number;
  order: number;
}

export function useTableColumns<TField extends string>(
  tableId: string,
  initialColumns: ColumnDef<TField>[]
) {
  const [settings, setSettings] = useState<Record<string, ColumnSettings>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from LocalStorage and calculate responsive state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    
    // Load saved settings
    const savedSettingsJSON = localStorage.getItem(`table-cols-${tableId}`);
    let savedSettings: Record<string, ColumnSettings> = {};
    if (savedSettingsJSON) {
      try {
        savedSettings = JSON.parse(savedSettingsJSON);
      } catch (e) {}
    }

    // Merge with initial columns
    const initialConfig: Record<string, ColumnSettings> = {};
    initialColumns.forEach((col, idx) => {
      initialConfig[col.id] = {
        visible: savedSettings[col.id]?.visible ?? true,
        width: savedSettings[col.id]?.width ?? col.defaultWidth ?? 120,
        order: savedSettings[col.id]?.order ?? idx,
      };
    });

    setSettings(initialConfig);
    setIsLoaded(true);

    return () => window.removeEventListener('resize', handleResize);
  }, [tableId, initialColumns]);

  // Persist settings whenever they change after initial load
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(`table-cols-${tableId}`, JSON.stringify(settings));
    }
  }, [settings, tableId, isLoaded]);

  const toggleColumnVisibility = useCallback((colId: string) => {
    setSettings(prev => ({
      ...prev,
      [colId]: { ...prev[colId], visible: !prev[colId].visible }
    }));
  }, []);

  const updateColumnWidth = useCallback((colId: string, width: number) => {
    setSettings(prev => ({
      ...prev,
      [colId]: { ...prev[colId], width }
    }));
  }, []);

  const reorderColumn = useCallback((sourceId: string, targetId: string) => {
    setSettings(prev => {
      if (!prev[sourceId] || !prev[targetId] || sourceId === targetId) return prev;
      const sourceOrder = prev[sourceId].order;
      const targetOrder = prev[targetId].order;
      
      const newSettings = { ...prev };
      
      Object.keys(newSettings).forEach(id => {
        if (id === sourceId) return;
        if (sourceOrder < targetOrder) {
          if (newSettings[id].order > sourceOrder && newSettings[id].order <= targetOrder) {
            newSettings[id] = { ...newSettings[id], order: newSettings[id].order - 1 };
          }
        } else {
          if (newSettings[id].order >= targetOrder && newSettings[id].order < sourceOrder) {
            newSettings[id] = { ...newSettings[id], order: newSettings[id].order + 1 };
          }
        }
      });
      
      newSettings[sourceId] = { ...newSettings[sourceId], order: targetOrder };
      return newSettings;
    });
  }, []);

  const resetSettings = useCallback(() => {
    const resetConfig: Record<string, ColumnSettings> = {};
    initialColumns.forEach((col, idx) => {
      resetConfig[col.id] = {
        visible: true,
        width: col.defaultWidth ?? 120,
        order: idx,
      };
    });
    setSettings(resetConfig);
  }, [initialColumns]);

  // Derive visible columns based on state and mobile threshold
  const visibleColumns = useMemo(() => {
    if (!isLoaded) return initialColumns.map(c => ({ ...c, width: c.defaultWidth ?? 120, visible: true }));
    
    return initialColumns.map(col => {
      const colSettings = settings[col.id];
      const isColVisible = col.alwaysVisible || (colSettings?.visible ?? true);
      // Auto-collapse low priority columns on mobile unless explicitly forced visible?
      // Actually, if it's mobile, we can auto-hide 'low' priority if they haven't explicitly toggled it?
      // Standard solution: just hide 'low' priority columns if mobile, but we can respect user choice.
      // Let's keep it simple: On mobile, force hide 'low' unless alwaysVisible.
      const shouldShow = isMobile && col.priority === 'low' && !col.alwaysVisible
        ? false
        : isColVisible;

      return {
        ...col,
        width: colSettings?.width ?? col.defaultWidth ?? 120,
        visible: shouldShow
      };
    }).filter(c => c.visible).sort((a, b) => (settings[a.id]?.order ?? 0) - (settings[b.id]?.order ?? 0));
  }, [initialColumns, settings, isLoaded, isMobile]);

  const orderedAllColumns = useMemo(() => {
    return [...initialColumns].sort((a, b) => (settings[a.id]?.order ?? 0) - (settings[b.id]?.order ?? 0));
  }, [initialColumns, settings]);

  const isCustomized = useMemo(() => {
    if (!isLoaded || Object.keys(settings).length === 0) return false;
    for (let i = 0; i < initialColumns.length; i++) {
      const col = initialColumns[i];
      const s = settings[col.id];
      if (!s) continue;
      if (s.visible === false && !col.alwaysVisible) return true;
      if (s.order !== i) return true;
      if (s.width !== (col.defaultWidth ?? 120)) return true;
    }
    return false;
  }, [initialColumns, settings, isLoaded]);

  return {
    columns: visibleColumns,
    allColumns: orderedAllColumns,
    settings,
    toggleColumnVisibility,
    updateColumnWidth,
    reorderColumn,
    resetSettings,
    isLoaded,
    isCustomized
  };
}
