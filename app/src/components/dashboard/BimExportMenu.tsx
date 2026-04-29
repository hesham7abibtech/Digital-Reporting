'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BIMReview, ProjectMetadata } from '@/lib/types';
import { exportBimToExcel, exportBimToPDF, captureChartImages, CapturedChart } from '@/lib/exportUtils';
import { useToast } from '@/components/shared/EliteToast';
import UnifiedExportModal from './UnifiedExportModal';

interface BimExportMenuProps {
  bimReviews: BIMReview[];
  projectMetadata: ProjectMetadata | undefined;
  dateRangeText?: string;
  
  // BIM Filters for the Modal
  filterStage: string[];
  setFilterStage: (val: string[]) => void;
  availableStages: string[];
  
  filterStatus: string[];
  setFilterStatus: (val: string[]) => void;
  availableStatuses: string[];
  
  filterStakeholder: string[];
  setFilterStakeholder: (val: string[]) => void;
  availableStakeholders: string[];
  
  filterReviewer: string[];
  setFilterReviewer: (val: string[]) => void;
  availableReviewers: string[];

  // Global mode and dates
  filterMode: 'monthly' | 'custom' | 'all';
  setFilterMode?: (mode: 'monthly' | 'custom' | 'all') => void;
  selectedYear: number;
  setSelectedYear?: (y: number) => void;
  yearOptions?: { label: string, value: number }[];
  selectedMonth: number;
  setSelectedMonth?: (m: number) => void;
  monthOptions?: { label: string, value: number }[];
  startDate?: string;
  setStartDate?: (s: string) => void;
  endDate?: string;
  setEndDate?: (s: string) => void;
  members?: any[];
}

export default function BimExportMenu({ 
  bimReviews, projectMetadata, dateRangeText,
  filterStage, setFilterStage, availableStages,
  filterStatus, setFilterStatus, availableStatuses,
  filterStakeholder, setFilterStakeholder, availableStakeholders,
  filterReviewer, setFilterReviewer, availableReviewers,
  filterMode, setFilterMode, selectedYear, setSelectedYear, yearOptions,
  selectedMonth, setSelectedMonth, monthOptions,
  startDate, setStartDate, endDate, setEndDate,
  members = []
}: BimExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingFormat, setPendingFormat] = useState<'pdf' | 'excel'>('excel');
  
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

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
    filters?: { types: string[], cdes: string[] },
    selectedColumns?: string[]
  ) => {
    onProgress(10);
    try {
      // Capture chart images for dashboard perspectives
      let chartImages: CapturedChart[] = [];
      if (perspective === 'dashboard' || perspective === 'both') {
        onProgress(20);
        // Wait for off-screen render & chart animations
        await new Promise(r => setTimeout(r, 600));

        chartImages = await captureChartImages('#bim-export-capture-root', {
          mode: 'full-dashboard',
          title: 'BIM Analytics Dashboard'
        });
        onProgress(35);
      }

      let result;
      if (type === 'excel') {
        await new Promise(r => setTimeout(r, 600));
        onProgress(40);
        result = await exportBimToExcel(bimReviews, projectMetadata, dateRangeText, perspective, selectedColumns, chartImages);
        onProgress(90);
      } else {
        await new Promise(r => setTimeout(r, 800));
        onProgress(40);
        result = await exportBimToPDF(bimReviews, projectMetadata, dateRangeText, perspective, selectedColumns, chartImages);
        onProgress(90);
      }
      return result;
    } catch (error) {
      console.error('BIM Export error:', error);
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
        <span>BIM Review Export</span>
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
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px', background: 'transparent', border: 'none', borderRadius: 16, color: 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212, 175, 55, 0.08)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239, 68, 68, 0.25)', boxShadow: '0 0 15px rgba(239, 68, 68, 0.1)' }}>
                <FileText size={22} strokeWidth={2.5} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>Signature PDF Portfolio</span>
                <span style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Elite branded document</span>
              </div>
            </button>

            <button
              onClick={() => triggerConfirmation('excel')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px', background: 'transparent', border: 'none', borderRadius: 16, color: 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(52, 211, 153, 0.08)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.25)', boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)' }}>
                <Table size={22} strokeWidth={2.5} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>Master Excel Registry</span>
                <span style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Technical data matrix</span>
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
        reportType="BIM_REVIEWS"
        bimReviews={bimReviews}
        projectMetadata={projectMetadata}
        dateRangeText={dateRangeText}
        filterMode={filterMode}
        setFilterMode={setFilterMode || (() => {})}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear || (() => {})}
        yearOptions={yearOptions || []}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth || (() => {})}
        monthOptions={monthOptions || []}
        startDate={startDate || ''}
        setStartDate={setStartDate || (() => {})}
        endDate={endDate || ''}
        setEndDate={setEndDate || (() => {})}
        filterStage={filterStage}
        setFilterStage={setFilterStage}
        availableStages={availableStages}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        availableStatuses={availableStatuses}
        filterStakeholder={filterStakeholder}
        setFilterStakeholder={setFilterStakeholder}
        availableStakeholders={availableStakeholders}
        filterReviewer={filterReviewer}
        setFilterReviewer={setFilterReviewer}
        availableReviewers={availableReviewers}
        members={members}
      />
    </div>
  );
}
