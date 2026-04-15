'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BIMReview, ProjectMetadata } from '@/lib/types';
import { exportBimToExcel, exportBimToPDF } from '@/lib/exportUtils';
import { useToast } from '@/components/shared/EliteToast';
import BimExportConfirmationModal from './BimExportConfirmationModal';

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
  selectedYear: number;
  selectedMonth: number;
}

export default function BimExportMenu({ 
  bimReviews, projectMetadata, dateRangeText,
  filterStage, setFilterStage, availableStages,
  filterStatus, setFilterStatus, availableStatuses,
  filterStakeholder, setFilterStakeholder, availableStakeholders,
  filterReviewer, setFilterReviewer, availableReviewers,
  filterMode, selectedYear, selectedMonth
}: BimExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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

  const handleConfirmGeneration = async (type: 'pdf' | 'excel', perspective: 'table' | 'dashboard' | 'both', onProgress: (p: number) => void) => {
    onProgress(10);
    try {
      let result;
      if (type === 'excel') {
        await new Promise(r => setTimeout(r, 600));
        onProgress(40);
        result = await exportBimToExcel(bimReviews, projectMetadata, dateRangeText, perspective);
        onProgress(90);
      } else {
        await new Promise(r => setTimeout(r, 800));
        onProgress(40);
        result = await exportBimToPDF(bimReviews, projectMetadata, dateRangeText, perspective);
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
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 20px',
          background: '#003f49',
          border: '1.5px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 14,
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: 950,
          cursor: isExporting ? 'not-allowed' : 'pointer',
          transition: 'all 200ms',
          boxShadow: '0 8px 30px rgba(0, 63, 73, 0.2)',
          outline: 'none',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
      >
        <Download size={16} />
        <span>BIM Review Export</span>
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
            style={{ position: 'absolute', top: '100%', right: 0, marginTop: 10, zIndex: 1000, width: 280, background: '#003f49', backdropFilter: 'blur(32px)', border: '1.5px solid rgba(255, 255, 255, 0.1)', borderRadius: 24, boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)', padding: 12, overflow: 'hidden' }}
          >
            <div style={{ padding: '8px 12px 4px 12px', fontSize: 10, fontWeight: 900, color: 'rgba(255, 255, 255, 0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Select Output Format
            </div>
            
            <button
              onClick={() => triggerConfirmation('pdf')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'transparent', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <FileText size={20} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Signature PDF Portfolio</span>
                <span style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.4)' }}>Elite branded document</span>
              </div>
            </button>

            <button
              onClick={() => triggerConfirmation('excel')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'transparent', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <Table size={20} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Master Excel Registry</span>
                <span style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.4)' }}>Technical data matrix</span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <BimExportConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmGeneration}
        format={pendingFormat}
        bimReviews={bimReviews}
        projectMetadata={projectMetadata}
        dateRangeText={dateRangeText}
        filterStage={filterStage}
        setFilterStage={setFilterStage}
        availableStages={availableStages}
        filterStakeholder={filterStakeholder}
        setFilterStakeholder={setFilterStakeholder}
        availableStakeholders={availableStakeholders}
        filterReviewer={filterReviewer}
        setFilterReviewer={setFilterReviewer}
        availableReviewers={availableReviewers}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        availableStatuses={availableStatuses}
        filterMode={filterMode}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
      />
    </div>
  );
}
