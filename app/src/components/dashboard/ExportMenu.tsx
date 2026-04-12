'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, ProjectMetadata, BIMReview } from '@/lib/types';
import { exportToExcel, exportToPDF, exportBimToExcel, exportBimToPDF } from '@/lib/exportUtils';
import { useToast } from '@/components/shared/EliteToast';
import ExportConfirmationModal from './ExportConfirmationModal';

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
}

export default function ExportMenu({ 
  tasks, bimReviews = [], activeReport = 'DELIVERABLES', projectMetadata, dateRangeText,
  filterMode, setFilterMode, filterDept, setFilterDept, availableDepts,
  filterType, setFilterType, availableTypes,
  filterCDE, setFilterCDE, availableCDEs,
  selectedYear, setSelectedYear, yearOptions,
  selectedMonth, setSelectedMonth, monthOptions,
  startDate, setStartDate, endDate, setEndDate
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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

  const handleConfirmGeneration = async (type: 'pdf' | 'excel', perspective: 'table' | 'dashboard' | 'both', onProgress: (p: number) => void) => {
    onProgress(10);
    await new Promise(r => setTimeout(r, 400));
    onProgress(25);

    try {
      let result;
      if (type === 'excel') {
        await new Promise(r => setTimeout(r, 600));
        onProgress(60);
        if (activeReport === 'BIM_REVIEWS') {
          result = await exportBimToExcel(bimReviews, projectMetadata, dateRangeText, perspective);
        } else {
          result = await exportToExcel(tasks, projectMetadata, dateRangeText, perspective);
        }
        onProgress(90);
      } else {
        await new Promise(r => setTimeout(r, 800));
        onProgress(55);
        if (activeReport === 'BIM_REVIEWS') {
          result = await exportBimToPDF(bimReviews, projectMetadata, dateRangeText, perspective);
        } else {
          result = await exportToPDF(tasks, projectMetadata, dateRangeText, perspective);
        }
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
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 18px',
          background: 'rgba(212, 175, 55, 0.1)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: 12,
          color: '#D4AF37',
          fontSize: 13,
          fontWeight: 700,
          cursor: isExporting ? 'not-allowed' : 'pointer',
          transition: 'all 200ms',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          outline: 'none'
        }}
      >
        <Download size={16} />
        <span>Export Registry</span>
        <ChevronDown 
          size={14} 
          style={{ 
            transition: 'transform 200ms', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' 
          }} 
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              zIndex: 1000,
              width: 240,
              background: 'rgba(15, 15, 25, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              padding: 6,
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '8px 12px 4px 12px', fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Select Output Format
            </div>
            
            <button
              onClick={() => triggerConfirmation('pdf')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
                background: 'transparent', border: 'none', borderRadius: 10, color: 'white',
                cursor: 'pointer', transition: 'background 200ms', textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Signature PDF Portfolio</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Elite branded document</span>
              </div>
            </button>

            <button
              onClick={() => triggerConfirmation('excel')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
                background: 'transparent', border: 'none', borderRadius: 10, color: 'white',
                cursor: 'pointer', transition: 'background 200ms', textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Table size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Master Excel Registry</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Technical data matrix</span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ExportConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmGeneration}
        format={pendingFormat}
        tasks={tasks}
        projectMetadata={projectMetadata}
        dateRangeText={dateRangeText}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        filterDept={filterDept}
        setFilterDept={setFilterDept}
        availableDepts={availableDepts}
        filterType={filterType}
        setFilterType={setFilterType}
        availableTypes={availableTypes}
        filterCDE={filterCDE}
        setFilterCDE={setFilterCDE}
        availableCDEs={availableCDEs}
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
      />
    </div>
  );
}
