'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, ProjectMetadata, BIMReview } from '@/lib/types';
import { exportToExcel, exportToPDF, exportBimToExcel, exportBimToPDF, captureChartImages, CapturedChart } from '@/lib/exportUtils';
import { useToast } from '@/components/shared/EliteToast';
import UnifiedExportModal from './UnifiedExportModal';

interface ExportMenuProps {
  tasks: Task[];
  projectMetadata: ProjectMetadata | undefined;
  dateRangeText?: string;
  // State for Modal editing
  filterMode: 'monthly' | 'custom' | 'all';
  setFilterMode: (mode: 'monthly' | 'custom' | 'all') => void;
  filterDept: string[];
  setFilterDept: (val: string[]) => void;
  availableDepts: string[];
  // New technical filters
  filterType: string[];
  setFilterType: (val: string[]) => void;
  availableTypes: string[];
  filterCDE: string[];
  setFilterCDE: (val: string[]) => void;
  availableCDEs: string[];
  filterPrecinct: string[];
  setFilterPrecinct: (val: string[]) => void;
  availablePrecincts: string[];
  // Date states
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  yearOptions: { label: string, value: number }[];
  selectedMonth: number;
  setSelectedMonth: (m: number) => void;
  monthOptions: { label: string, value: number }[];
  startDate: string;
  setStartDate: (s: string) => void;
  endDate: string;
  setEndDate: (s: string) => void;
  // BIM synchronization
  bimReviews?: BIMReview[];
  activeReport?: 'DELIVERABLES' | 'BIM_REVIEWS';
  departments?: any[];
  members?: any[];
}

export default function ExportMenu({ 
  tasks, bimReviews = [], activeReport = 'DELIVERABLES', projectMetadata, dateRangeText,
  filterMode, setFilterMode, filterDept, setFilterDept, availableDepts,
  filterType, setFilterType, availableTypes,
  filterCDE, setFilterCDE, availableCDEs,
  filterPrecinct, setFilterPrecinct, availablePrecincts,
  selectedYear, setSelectedYear, yearOptions,
  selectedMonth, setSelectedMonth, monthOptions,
  startDate, setStartDate, endDate, setEndDate,
  departments = [], members = []
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingFormat, setPendingFormat] = useState<'pdf' | 'excel'>('excel');
  
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerConfirmation = (type: 'pdf' | 'excel') => {
    setPendingFormat(type);
    setIsConfirmOpen(true);
    setIsOpen(false);
  };

  const handleConfirmGeneration = async (
    type: 'pdf' | 'excel', 
    perspective: 'table' | 'dashboard' | 'both', 
    onProgress: (p: number) => void,
    filters?: { types: string[], cdes: string[], precincts?: string[] },
    selectedColumns?: string[]
  ) => {
    onProgress(10);
    await new Promise(r => setTimeout(r, 400));
    onProgress(25);

    try {
      // Capture chart images for dashboard perspectives
      let chartImages: CapturedChart[] = [];
      if (perspective === 'dashboard' || perspective === 'both') {
        onProgress(30);
        chartImages = await captureChartImages('#analytics-dashboard-export-root', {
          mode: 'full-dashboard',
          title: 'Deliverables Analytics Dashboard'
        });
        onProgress(45);
      }

      let result;
      if (type === 'excel') {
        await new Promise(r => setTimeout(r, 600));
        onProgress(60);
        result = await exportToExcel(tasks, projectMetadata, dateRangeText, perspective, filters, chartImages);
        onProgress(90);
      } else {
        await new Promise(r => setTimeout(r, 800));
        onProgress(55);
        result = await exportToPDF(tasks, projectMetadata, dateRangeText, perspective, filters, chartImages);
        onProgress(85);
      }
      
      onProgress(95);
      await new Promise(r => setTimeout(r, 400));
      return result;
      
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <motion.button
        whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 15px rgba(208, 171, 130, 0.2)' }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 24px',
          background: 'linear-gradient(135deg, #003f49 0%, #000000 100%)',
          border: '2.5px solid rgba(208, 171, 130, 0.45)',
          borderRadius: 16,
          color: '#FFFFFF',
          fontSize: 12.5,
          fontWeight: 950,
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 8px 35px rgba(0, 0, 0, 0.5), 0 0 10px rgba(208, 171, 130, 0.1)',
          outline: 'none',
          textTransform: 'uppercase',
          letterSpacing: '0.12em'
        }}
      >
        <Download size={16} color="#d0ab82" strokeWidth={3} />
        <span>Export Registry</span>
        <ChevronDown 
          size={14} 
          color="#d0ab82"
          style={{ 
            transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' 
          }} 
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 12,
              zIndex: 10000,
              width: 300,
              background: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(32px)',
              border: '2px solid rgba(212, 175, 55, 0.2)',
              borderTop: '3px solid #d0ab82',
              borderRadius: 24,
              boxShadow: '0 30px 70px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 175, 55, 0.05)',
              padding: 10,
              overflow: 'hidden'
            }}
          >
            <div style={{ 
              padding: '14px 16px 10px 16px', 
              fontSize: 10, 
              fontWeight: 950, 
              color: '#d0ab82', 
              textTransform: 'uppercase', 
              letterSpacing: '0.15em',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: 8,
              opacity: 0.8
            }}>
              Select Output Format
            </div>
            
            <button
              onClick={() => triggerConfirmation('pdf')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
                background: 'transparent', border: 'none', borderRadius: 10, color: 'var(--aqua)',
                cursor: 'pointer', transition: 'background 200ms', textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(198, 224, 224, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', color: '#FF4C4F', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <FileText size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Signature PDF Portfolio</span>
                <span style={{ fontSize: 10, color: 'rgba(198, 224, 224, 0.5)' }}>Elite branded document</span>
              </div>
            </button>

            <button
              onClick={() => triggerConfirmation('excel')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
                background: 'transparent', border: 'none', borderRadius: 10, color: 'var(--aqua)',
                cursor: 'pointer', transition: 'background 200ms', textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(198, 224, 224, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <Table size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Master Excel Registry</span>
                <span style={{ fontSize: 10, color: 'rgba(198, 224, 224, 0.5)' }}>Technical data matrix</span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <UnifiedExportModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmGeneration}
        format={pendingFormat}
        reportType="DELIVERABLES"
        tasks={tasks}
        projectMetadata={projectMetadata}
        dateRangeText={dateRangeText}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        yearOptions={yearOptions}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        monthOptions={monthOptions}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        filterDept={filterDept}
        setFilterDept={setFilterDept}
        availableDepts={availableDepts}
        filterType={filterType}
        setFilterType={setFilterType}
        availableTypes={availableTypes}
        filterCDE={filterCDE}
        setFilterCDE={setFilterCDE}
        availableCDEs={availableCDEs}
        filterPrecinct={filterPrecinct}
        setFilterPrecinct={setFilterPrecinct}
        availablePrecincts={availablePrecincts}
        departments={departments}
        members={members}
      />
    </div>
  );
}
