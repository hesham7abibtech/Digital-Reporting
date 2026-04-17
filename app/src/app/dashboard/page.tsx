'use client';

import { useState, useMemo } from 'react';
import ParticleBackground from '@/components/layout/ParticleBackground';
import Header from '@/components/layout/Header';
import ProjectHeader from '@/components/dashboard/ProjectHeader';
import KPICards from '@/components/dashboard/KPICards';
import ActiveTasks from '@/components/dashboard/ActiveTasks';
import AnalyticsDashboardView from '@/components/dashboard/AnalyticsDashboardView';
import DashboardRegistry from '@/components/dashboard/DashboardRegistry';
import ChartsSection from '@/components/dashboard/ChartsSection';
import ExportMenu from '@/components/dashboard/ExportMenu';
import BimExportMenu from '@/components/dashboard/BimExportMenu';
import BIMReviewsTable from '@/components/dashboard/BIMReviewsTable';
import NotificationPanel from '@/components/dashboard/NotificationPanel';
import BIMAnalyticsView from '@/components/dashboard/BIMAnalyticsView';
import BrandedLoader from '@/components/layout/BrandedLoader';

import TaskDetailModal from '@/components/dashboard/TaskDetailModal';
import EliteDropdown from '@/components/dashboard/EliteDropdown';
import type { Task } from '@/lib/types';
import { useTimeZone } from '@/context/TimeZoneContext';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useAuth } from '@/context/AuthContext';
import { useRegistryView } from '@/hooks/useRegistryView';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, CalendarRange, X, Calendar, Database, TableProperties, BarChart3, Trash2, Edit2, Plus, Download } from 'lucide-react';
import { useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/shared/EliteToast';
import { deleteBimReview, bulkUpsertBimReviews } from '@/services/FirebaseService';

import BIMReviewEditorModal from '@/components/admin/BIMReviewEditorModal';
import BIMImportConfirmModal from '@/components/admin/BIMImportConfirmModal';
import EliteConfirmModal from '@/components/shared/EliteConfirmModal';
import type { BIMReview } from '@/lib/types';

const getTaskRange = (t: Task) => {
  // Migrate: Use actualEndDate first, then actualStartDate, then submittingDate or createdAt
  const dateStr = t.submittingDate || (t as any).actualEndDate || (t as any).actualStartDate || t.createdAt;
  const date = new Date(dateStr);
  return { start: date, end: date };
};

const parseBimDate = (d: string) => {
  if (!d || d === '—') return null;
  let date = new Date(d);

  // Fallback for DD-MMM-YYYY if native parsing fails
  if (isNaN(date.getTime()) && d.includes('-')) {
    const parts = d.split('-');
    if (parts.length === 3) {
      const months: Record<string, number> = {
        JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
      };
      const month = months[parts[1].toUpperCase()];
      if (month !== undefined) {
        date = new Date(parseInt(parts[2]), month, parseInt(parts[0]));
      }
    }
  }
  return isNaN(date.getTime()) ? null : date;
};

export default function Dashboard() {
  const { isUpdating, selectedTimeZone } = useTimeZone();
  const { tasks: syncedTasks, members: syncedMembers, registry: syncedRegistry, departments: syncedDepartments, bimReviews: syncedBimReviews, project: syncedProject, isLoading } = useRealtimeData();

  const { userProfile } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const now = new Date();

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'monthly' | 'custom' | 'all'>('all');
  const [filterDept, setFilterDept] = useState<string[]>(['All Categories']);
  const [filterType, setFilterType] = useState<string[]>(['All Types']);
  const [filterCDE, setFilterCDE] = useState<string[]>(['All Environments']);
  const [filterPrecinct, setFilterPrecinct] = useState<string[]>(['All Precincts']);
  const [search, setSearch] = useState('');
  const { activeView, setActiveView } = useRegistryView('table');
  const [activeReport, setActiveReport] = useState<'DELIVERABLES' | 'BIM_REVIEWS'>('DELIVERABLES');
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);
  const { showToast } = useToast();

  // BIM Admin States
  const [selectedBimReview, setSelectedBimReview] = useState<BIMReview | null>(null);
  const [isBimModalOpen, setIsBimModalOpen] = useState(false);
  const [bimImportConfirm, setBimImportConfirm] = useState<{ isOpen: boolean, records: any[] }>({ isOpen: false, records: [] });
  const [isBimImportLoading, setIsBimImportLoading] = useState(false);
  const [bimToDelete, setBimToDelete] = useState<BIMReview | null>(null);
  const bimFileInputRef = useRef<HTMLInputElement>(null);

  // Atomic report switch to prevent invalid transient states (fixes Recharts warnings)
  const handleReportChange = (report: 'DELIVERABLES' | 'BIM_REVIEWS') => {
    setActiveReport(report);
    setActiveView('table');
  };

  useEffect(() => {
    const timer = setTimeout(() => setMinLoadingComplete(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Secure Access Monitor & Auto-Switching
  useEffect(() => {
    if (!userProfile) return;
    
    const hasDR = userProfile.access?.deliverablesRegistry === true;
    const hasBIM = userProfile.access?.bimReviews === true;

    // Auto-switch away from restricted modules
    if (activeReport === 'DELIVERABLES' && !hasDR && hasBIM) {
      setActiveReport('BIM_REVIEWS');
    } else if (activeReport === 'BIM_REVIEWS' && !hasBIM && hasDR) {
      setActiveReport('DELIVERABLES');
    }
  }, [userProfile?.access, activeReport]);

  // BIM Matrix Filters
  const [bimSearch, setBimSearch] = useState('');
  const [bimFilterStage, setBimFilterStage] = useState<string[]>([]);
  const [bimFilterStatus, setBimFilterStatus] = useState<string[]>([]);
  const [bimFilterStakeholder, setBimFilterStakeholder] = useState<string[]>([]);
  const [bimFilterReviewer, setBimFilterReviewer] = useState<string[]>([]);



  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];



  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();

    if (activeReport === 'DELIVERABLES') {
      syncedTasks.forEach(t => {
        const { start, end } = getTaskRange(t);
        const startYear = start.getFullYear();
        const endYear = end.getFullYear();
        for (let y = startYear; y <= endYear; y++) yearsSet.add(y);
      });
    } else {
      syncedBimReviews.forEach(r => {
        const d = parseBimDate(r.submissionDate);
        if (d) yearsSet.add(d.getFullYear());
      });
    }

    if (yearsSet.size === 0) yearsSet.add(now.getFullYear());
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [syncedTasks, syncedBimReviews, activeReport]);

  const yearOptions = availableYears.map(y => ({ label: y.toString(), value: y }));

  const availableMonths = useMemo(() => {
    const monthsSet = new Set<number>();

    if (activeReport === 'DELIVERABLES') {
      syncedTasks.forEach(t => {
        const { start, end } = getTaskRange(t);
        const startYear = start.getFullYear();
        const endYear = end.getFullYear();
        if (selectedYear >= startYear && selectedYear <= endYear) {
          let mStart = selectedYear === startYear ? start.getMonth() : 0;
          let mEnd = selectedYear === endYear ? end.getMonth() : 11;
          for (let m = mStart; m <= mEnd; m++) monthsSet.add(m);
        }
      });
    } else {
      syncedBimReviews.forEach(r => {
        const d = parseBimDate(r.submissionDate);
        if (d && d.getFullYear() === selectedYear) {
          monthsSet.add(d.getMonth());
        }
      });
    }

    return Array.from(monthsSet).sort((a, b) => a - b);
  }, [syncedTasks, syncedBimReviews, selectedYear, activeReport]);

  const monthOptions = availableMonths.map(m => ({ label: months[m], value: m }));

  useEffect(() => {
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0] || now.getFullYear());
    }
  }, [availableYears, selectedYear]);

  useEffect(() => {
    if (!availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[availableMonths.length - 1] || 0);
    }
  }, [availableMonths, selectedMonth]);

  // Tasks filtered strictly by date range
  const dateFilteredTasks = useMemo(() => {
    if (filterMode === 'all') return syncedTasks;

    let rangeStart: Date;
    let rangeEnd: Date;

    if (filterMode === 'custom') {
      rangeStart = startDate ? new Date(startDate) : new Date('1970-01-01');
      rangeEnd = endDate ? new Date(endDate) : new Date('2099-12-31');
    } else {
      rangeStart = new Date(selectedYear, selectedMonth, 1);
      rangeEnd = new Date(selectedYear, selectedMonth + 1, 0);
    }

    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(23, 59, 59, 999);

    return syncedTasks.filter(t => {
      const { start } = getTaskRange(t);
      return start >= rangeStart && start <= rangeEnd;
    });
  }, [syncedTasks, selectedMonth, selectedYear, startDate, endDate, filterMode]);

  // Dynamic filter options based on tasks in the selected date range
  const availableDepts = useMemo(() => {
    let hasEmpty = false;
    const rawDepts = new Set(dateFilteredTasks.map(t => {
      if (!t.department) hasEmpty = true;
      return t.department;
    }));
    const resolved = Array.from(rawDepts).filter(Boolean).map(raw => {
      const d = syncedDepartments.find(sd => sd.id === raw || sd.name === raw);
      return d ? d.name : (raw || 'General');
    });
    const result = Array.from(new Set(resolved)).sort();
    if (hasEmpty) result.unshift('(Empty)');
    return result;
  }, [dateFilteredTasks, syncedDepartments]);

  const availableTypes = useMemo(() => {
    let hasEmpty = false;
    const rawTypes = new Set(dateFilteredTasks.flatMap(t => {
      const legacy = (Array.isArray(t.deliverableType) ? t.deliverableType : [t.deliverableType]).filter((v): v is string => !!v);
      const vector = (t.vectors || []).map(v => v.type);
      const combined = [...legacy, ...vector];
      if (combined.length === 0) hasEmpty = true;
      return combined;
    }));
    const result = Array.from(rawTypes).sort();
    if (hasEmpty) result.unshift('(Empty)');
    return result;
  }, [dateFilteredTasks]);

  const availableCDEs = useMemo(() => {
    let hasEmpty = false;
    const rawCdes = new Set(dateFilteredTasks.flatMap(t => {
      const legacy = (Array.isArray(t.cde) ? t.cde : [t.cde]).filter((v): v is string => !!v);
      const vector = (t.vectors || []).map(v => v.cde);
      const combined = [...legacy, ...vector];
      if (combined.length === 0) hasEmpty = true;
      return combined;
    }));
    const result = Array.from(rawCdes).sort();
    if (hasEmpty) result.unshift('(Empty)');
    return result;
  }, [dateFilteredTasks]);
  
  const availablePrecincts = useMemo(() => {
    let hasEmpty = false;
    const rawPrecincts = new Set(dateFilteredTasks.map(t => {
      if (!t.precinct) hasEmpty = true;
      return t.precinct;
    }).filter((v): v is string => !!v));
    const result = Array.from(rawPrecincts).sort();
    if (hasEmpty) result.unshift('(Empty)');
    return result;
  }, [dateFilteredTasks]);

  // Reset filters if they are no longer available in the new pool
  useEffect(() => {
    if (filterDept.includes('All Categories')) return;
    const valid = filterDept.filter(d => availableDepts.includes(d));
    if (valid.length === 0) setFilterDept(['All Categories']);
    else if (valid.length !== filterDept.length) setFilterDept(valid);
  }, [availableDepts, filterDept]);

  useEffect(() => {
    if (filterType.includes('All Types')) return;
    const valid = filterType.filter(t => availableTypes.includes(t));
    if (valid.length === 0) setFilterType(['All Types']);
    else if (valid.length !== filterType.length) setFilterType(valid);
  }, [availableTypes, filterType]);

  useEffect(() => {
    if (filterCDE.includes('All Environments')) return;
    const valid = filterCDE.filter(c => availableCDEs.includes(c));
    if (valid.length === 0) setFilterCDE(['All Environments']);
    else if (valid.length !== filterCDE.length) setFilterCDE(valid);
  }, [availableCDEs, filterCDE]);

  useEffect(() => {
    if (filterPrecinct.includes('All Precincts')) return;
    const valid = filterPrecinct.filter(p => availablePrecincts.includes(p));
    if (valid.length === 0) setFilterPrecinct(['All Precincts']);
    else if (valid.length !== filterPrecinct.length) setFilterPrecinct(valid);
  }, [availablePrecincts, filterPrecinct]);

  // Tasks from the previous equivalent period for KPI growth comparisons
  const previousPeriodTasks = useMemo(() => {
    if (filterMode === 'all') return [];

    let prevStart: Date;
    let prevEnd: Date;

    if (filterMode === 'monthly') {
      const prevM = selectedMonth === 0 ? 11 : selectedMonth - 1;
      const prevY = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
      prevStart = new Date(prevY, prevM, 1);
      prevEnd = new Date(prevY, prevM + 1, 0);
    } else {
      const currentStart = startDate ? new Date(startDate) : new Date();
      const currentEnd = endDate ? new Date(endDate) : new Date();
      const diff = currentEnd.getTime() - currentStart.getTime();
      const duration = diff > 0 ? diff : 86400000 * 30; // default 30 days if range invalid
      prevStart = new Date(currentStart.getTime() - duration);
      prevEnd = new Date(currentStart.getTime());
    }

    prevStart.setHours(0, 0, 0, 0);
    prevEnd.setHours(23, 59, 59, 999);

    return syncedTasks.filter(t => {
      const { start } = getTaskRange(t);
      return start >= prevStart && start <= prevEnd;
    });
  }, [syncedTasks, selectedMonth, selectedYear, startDate, endDate, filterMode]);

  const filteredTasks = useMemo(() => {
    let result = dateFilteredTasks;

    // Apply Department filter
    if (filterDept.length > 0 && !filterDept.includes('All Categories')) {
      result = result.filter(t => {
        if (filterDept.includes('(Empty)') && (!t.department || t.department.trim() === '')) return true;
        const d = syncedDepartments.find(sd => sd.id === t.department || sd.name === t.department);
        const resolvedName = d ? d.name : (t.department || 'General');
        return filterDept.includes(resolvedName);
      });
    }

    // Apply Deliverable Type filter
    if (filterType.length > 0 && !filterType.includes('All Types')) {
      result = result.filter(t => {
        const legacy = (Array.isArray(t.deliverableType) ? t.deliverableType : [t.deliverableType]).filter((v): v is string => !!v);
        const vector = (t.vectors || []).map(v => v.type);
        const combined = [...legacy, ...vector];
        if (filterType.includes('(Empty)') && combined.length === 0) return true;
        return combined.some(type => filterType.includes(type));
      });
    }

    // Apply CDE Environment filter
    if (filterCDE.length > 0 && !filterCDE.includes('All Environments')) {
      result = result.filter(t => {
        const legacy = (Array.isArray(t.cde) ? t.cde : [t.cde]).filter((v): v is string => !!v);
        const vector = (t.vectors || []).map(v => v.cde);
        const combined = [...legacy, ...vector];
        if (filterCDE.includes('(Empty)') && combined.length === 0) return true;
        return combined.some(env => filterCDE.includes(env));
      });
    }

    // Apply Precinct filter
    if (filterPrecinct.length > 0 && !filterPrecinct.includes('All Precincts')) {
      result = result.filter(t => {
        if (filterPrecinct.includes('(Empty)') && (!t.precinct || t.precinct.trim() === '')) return true;
        return filterPrecinct.includes(t.precinct || '');
      });
    }

    // Apply Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t => {
        const d = syncedDepartments.find(sd => sd.id === t.department || sd.name === t.department);
        const resolvedName = d ? d.name : (t.department || 'General');
        return t.title.toLowerCase().includes(q) ||
               resolvedName.toLowerCase().includes(q) ||
               t.id.toLowerCase().includes(q);
      });
    }
    return result;
  }, [dateFilteredTasks, filterDept, filterType, filterCDE, filterPrecinct, search, syncedDepartments]);



  const dateFilteredBimReviews = useMemo(() => {
    let result = syncedBimReviews;
    if (filterMode === 'all') return result;

    let rangeStart: Date;
    let rangeEnd: Date;

    if (filterMode === 'custom') {
      rangeStart = startDate ? new Date(startDate) : new Date('1970-01-01');
      rangeEnd = endDate ? new Date(endDate) : new Date('2099-12-31');
    } else {
      rangeStart = new Date(selectedYear, selectedMonth, 1);
      rangeEnd = new Date(selectedYear, selectedMonth + 1, 0);
    }
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(23, 59, 59, 999);

    return result.filter(review => {
      const d = parseBimDate(review.submissionDate);
      if (!d) return false;
      return d >= rangeStart && d <= rangeEnd;
    });
  }, [syncedBimReviews, filterMode, startDate, endDate, selectedMonth, selectedYear]);

  const filteredBimReviews = useMemo(() => {
    return dateFilteredBimReviews.filter(review => {
      const searchStr = bimSearch.toLowerCase();
      
      // Resolve reviewer name for search/matching
      const m = syncedMembers.find(sm => 
        (review.insiteReviewerId && sm.id === review.insiteReviewerId) || 
        (review.insiteReviewerEmail && sm.email.toLowerCase() === review.insiteReviewerEmail.toLowerCase()) ||
        (review.insiteReviewer && sm.name.toLowerCase() === review.insiteReviewer.toLowerCase())
      );
      const resolvedReviewer = m ? m.name : (review.insiteReviewer || '—');

      const matchesSearch = !bimSearch ||
        review.submissionDescription.toLowerCase().includes(searchStr) ||
        review.project.toLowerCase().includes(searchStr) ||
        review.stakeholder.toLowerCase().includes(searchStr) ||
        resolvedReviewer.toLowerCase().includes(searchStr);

      const matchesStage = bimFilterStage.length === 0 || 
                          bimFilterStage.includes('All Stages') || 
                          (bimFilterStage.includes('(Empty)') && (!review.designStage || review.designStage === '')) ||
                          bimFilterStage.includes(review.designStage);
      
      const matchesStatus = bimFilterStatus.length === 0 || 
                           bimFilterStatus.includes('All Statuses') || 
                           (bimFilterStatus.includes('(Empty)') && (!review.insiteBimReviewStatus || review.insiteBimReviewStatus === '')) ||
                           bimFilterStatus.includes(review.insiteBimReviewStatus);
      
      const matchesStakeholder = bimFilterStakeholder.length === 0 || 
                                bimFilterStakeholder.includes('All Stakeholders') || 
                                (bimFilterStakeholder.includes('(Empty)') && (!review.stakeholder || review.stakeholder === '')) ||
                                bimFilterStakeholder.includes(review.stakeholder);
      
      const matchesReviewer = bimFilterReviewer.length === 0 || 
                             bimFilterReviewer.includes('All Reviewers') || 
                             (bimFilterReviewer.includes('(Empty)') && (resolvedReviewer === '—' || !resolvedReviewer)) ||
                             bimFilterReviewer.includes(resolvedReviewer);

      return matchesSearch && matchesStage && matchesStatus && matchesStakeholder && matchesReviewer;
    });
  }, [syncedBimReviews, bimSearch, bimFilterStage, bimFilterStatus, bimFilterStakeholder, bimFilterReviewer, filterMode, selectedMonth, selectedYear, startDate, endDate, syncedMembers]);

  // Snapshot for previous period to calculate growth
  const previousPeriodBimReviews = useMemo(() => {
    if (filterMode === 'all') return [];

    let prevStart: Date;
    let prevEnd: Date;

    if (filterMode === 'monthly') {
      const prevM = selectedMonth === 0 ? 11 : selectedMonth - 1;
      const prevY = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
      prevStart = new Date(prevY, prevM, 1);
      prevEnd = new Date(prevY, prevM + 1, 0);
    } else {
      const currentStart = startDate ? new Date(startDate) : new Date();
      const currentEnd = endDate ? new Date(endDate) : new Date();
      const diff = currentEnd.getTime() - currentStart.getTime();
      const duration = diff > 0 ? diff : 86400000 * 30;
      prevStart = new Date(currentStart.getTime() - duration);
      prevEnd = new Date(currentStart.getTime());
    }
    prevStart.setHours(0, 0, 0, 0);
    prevEnd.setHours(23, 59, 59, 999);

    return syncedBimReviews.filter(review => {
      const d = parseBimDate(review.submissionDate);
      if (!d) return false;
      return d >= prevStart && d <= prevEnd;
    });
  }, [syncedBimReviews, selectedMonth, selectedYear, startDate, endDate, filterMode]);

  // Available BIM Filter Options
  const availableBimStages = useMemo(() => {
    const raw = Array.from(new Set(dateFilteredBimReviews.map(r => r.designStage))).filter(Boolean).sort();
    const hasEmpty = dateFilteredBimReviews.some(r => !r.designStage);
    return hasEmpty ? ['(Empty)', ...raw] : raw;
  }, [dateFilteredBimReviews]);

  const availableBimStatuses = useMemo(() => {
    const raw = Array.from(new Set(dateFilteredBimReviews.map(r => r.insiteBimReviewStatus))).filter(Boolean).sort();
    const hasEmpty = dateFilteredBimReviews.some(r => !r.insiteBimReviewStatus);
    return hasEmpty ? ['(Empty)', ...raw] : raw;
  }, [dateFilteredBimReviews]);

  const availableBimStakeholders = useMemo(() => {
    const raw = Array.from(new Set(dateFilteredBimReviews.map(r => r.stakeholder))).filter(Boolean).sort();
    const hasEmpty = dateFilteredBimReviews.some(r => !r.stakeholder);
    return hasEmpty ? ['(Empty)', ...raw] : raw;
  }, [dateFilteredBimReviews]);

  const availableBimPrecincts = useMemo(() => {
    const raw = Array.from(new Set(dateFilteredBimReviews.map(r => r.precinct))).filter(Boolean).sort();
    const hasEmpty = dateFilteredBimReviews.some(r => !r.precinct);
    return hasEmpty ? ['(Empty)', ...raw] : raw;
  }, [dateFilteredBimReviews]);
  const availableBimReviewers = useMemo(() => {
    let hasEmpty = false;
    const raw = new Set(dateFilteredBimReviews.map(r => {
      const m = syncedMembers.find(sm => 
        (r.insiteReviewerId && sm.id === r.insiteReviewerId) || 
        (r.insiteReviewerEmail && sm.email.toLowerCase() === r.insiteReviewerEmail.toLowerCase()) ||
        (r.insiteReviewer && sm.name.toLowerCase() === r.insiteReviewer.toLowerCase())
      );
      if (!m && !r.insiteReviewer) hasEmpty = true;
      return m ? m.name : (r.insiteReviewer || '—');
    }));
    const sorted = Array.from(raw).filter(v => v !== '—').sort();
    const result = hasEmpty || Array.from(raw).includes('—') ? ['(Empty)', ...sorted] : sorted;
    return result;
  }, [dateFilteredBimReviews, syncedMembers]);


  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  // BIM Admin Handlers
  const handleBimExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          showToast('No records found in the file.', 'INFO');
          return;
        }

        const normalizeExcelDate = (val: any) => {
          if (!val) return null;
          if (typeof val === 'number') {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000));
            return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
          }
          return String(val);
        };

        const sanitizeProjectName = (name: any) => {
          if (!name || typeof name !== 'string') return name || '';
          return name.replace(/\s*\(https?:\/\/[^\)]+\)/g, '').trim();
        };

        let lastProject = '';
        const mappedRecords = json.map((row: any) => {
          const currentProject = row['Project'] ? sanitizeProjectName(row['Project']) : '';
          if (currentProject) lastProject = currentProject;
          
          return {
            submissionDescription: row['Submission Description'] || '',
            comments: row['Comments'] || '',
            designStage: row['Design Stage'] || '',
            insiteBimReviewStatus: row['InSite BIM Review Status'] || '',
            insiteReviewDueDate: normalizeExcelDate(row['InSite Review Due Date']),
            insiteReviewOutputUrl: row['InSite Review Output URL'] || '',
            insiteReviewer: row['InSite Reviewer'] || '',
            modonHillFinalReviewStatus: row['Modon/Hill Final Review Status'] || '',
            onAcc: row['On ACC'] || 'NOT SHARED',
            project: lastProject,
            reviewNumber: row['Review Number'] ? String(row['Review Number']) : '',
            stakeholder: row['Stakeholder'] || '',
            submissionCategory: row['Submission Category'] 
              ? String(row['Submission Category']).split(',').map((s: string) => s.trim()) 
              : [],
            submissionDate: normalizeExcelDate(row['Submission Date'])
          };
        });

        setBimImportConfirm({ isOpen: true, records: mappedRecords });
      } catch (err) {
        console.error('BIM Import Failure:', err);
        showToast('Import failed. Please try again.', 'ERROR');
      } finally {
        if (bimFileInputRef.current) bimFileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportConfirm = async (strategy: 'APPEND' | 'OVERWRITE') => {
    setIsBimImportLoading(true);
    try {
      await bulkUpsertBimReviews(bimImportConfirm.records, strategy as any);
      showToast(`${bimImportConfirm.records.length} records imported successfully.`, 'SUCCESS');
      setBimImportConfirm({ isOpen: false, records: [] });
    } catch (err) {
      showToast('Could not save records. Please try again.', 'ERROR');
    } finally {
      setIsBimImportLoading(false);
    }
  };

  const handleDeleteBimReview = async () => {
    if (!bimToDelete) return;
    try {
      await deleteBimReview(bimToDelete.id);
      showToast('Record deleted successfully.', 'SUCCESS');
      setBimToDelete(null);
    } catch (err) {
      showToast('Could not delete record.', 'ERROR');
    }
  };

  const filterDateText = useMemo(() => {
    if (filterMode === 'all') return 'All Time';
    if (filterMode === 'monthly') return `${months[selectedMonth]} ${selectedYear}`;
    return (startDate || endDate ? `${startDate || 'Start'} to ${endDate || 'Present'}` : 'Custom Range');
  }, [filterMode, selectedMonth, selectedYear, startDate, endDate, months]);

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <BrandedLoader isLoading={!minLoadingComplete || isLoading} />

      <ParticleBackground />

      <div style={{
        position: 'relative',
        zIndex: 1000,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        opacity: (!minLoadingComplete || isLoading) ? 0 : 1,
        transition: 'opacity 0.8s ease-in-out'
      }}>
        <Header
          project={syncedProject || undefined}
          onNotificationClick={() => setNotifOpen(true)}
          isNotificationOpen={notifOpen}
        />

        <main style={{ flex: 1, padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 'calc(100vh - 100px)' }}>
          {/* Restricted Access Overlay */}
          {!isLoading && userProfile && !userProfile.access?.deliverablesRegistry && !userProfile.access?.bimReviews ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: '40px 60px', borderRadius: 32, background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(40px)', border: '1px solid rgba(0, 63, 73, 0.1)',
                  textAlign: 'center', boxShadow: '0 20px 50px rgba(0, 63, 73, 0.05)'
                }}
              >
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(0, 63, 73, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <Globe size={32} color="var(--teal)" className="animate-pulse" />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#003f49', margin: '0 0 12px' }}>Access Restricted</h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 32px', lineHeight: 1.6 }}>
                  Your account has been verified, but you have not been granted access to any reporting modules. Please contact an administrator to provision your project clearance.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--teal)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Identity Registry Secured</span>
                </div>
              </motion.div>
            </div>
          ) : !isLoading && (
            <>
              <ProjectHeader
                project={syncedProject || undefined}
                members={syncedMembers}
                tasks={filteredTasks}
                dateRangeText={filterDateText}
                activeReport={activeReport}
                onReportChange={handleReportChange}
                bimReviewsCount={syncedBimReviews.length}
              />



              <div style={{
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 63, 73, 0.12)',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                marginBottom: 16,
                flexWrap: 'nowrap',
                overflow: 'visible',
                position: 'relative',
                zIndex: 3000,
                boxShadow: '0 4px 20px rgba(0, 63, 73, 0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: 'rgba(0, 63, 73, 0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(0, 63, 73, 0.2)'
                  }}>
                    <CalendarRange size={16} color="var(--teal)" />
                  </div>
                  <h2 style={{ fontSize: 13, fontWeight: 900, color: '#003f49', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
                    {activeReport === 'DELIVERABLES' ? 'Deliverables Registry' : 'BIM Review Matrix'} — <span style={{ color: 'var(--teal)' }}>
                      {activeReport === 'DELIVERABLES' ? filteredTasks.length : filteredBimReviews.length} ITEMS
                    </span>
                  </h2>
                </div>





                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto', flexShrink: 0 }}>
                  {/* Mode Switcher */}
                  <div style={{
                    display: 'flex', background: 'rgba(255, 255, 255, 0.7)', padding: 3, borderRadius: 12,
                    border: '1px solid rgba(0, 63, 73, 0.2)', position: 'relative'
                  }}>
                    {['all', 'monthly', 'custom'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setFilterMode(mode as any)}
                        style={{
                          padding: '6px 16px', borderRadius: 10, fontSize: 10, fontWeight: 900,
                          textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none',
                          cursor: 'pointer', position: 'relative', zIndex: 1,
                          background: filterMode === mode ? 'var(--teal)' : 'transparent',
                          color: filterMode === mode ? 'white' : '#003f49',
                          transition: 'all 0.3s ease',
                          opacity: filterMode === mode ? 1 : 0.7
                        }}
                      >
                        {filterMode === mode && (
                          <motion.div
                            layoutId="mode-bg"
                            style={{
                              position: 'absolute', inset: 0, background: 'var(--teal)',
                              borderRadius: 9, border: '1px solid rgba(212, 175, 55, 0.2)',
                              zIndex: -1
                            }}
                          />
                        )}
                        {mode === 'all' ? 'All Time' : mode === 'monthly' ? 'Monthly' : 'Custom'}
                      </button>
                    ))}
                  </div>

                  <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.06)' }} />

                  <AnimatePresence mode="wait">
                    {filterMode === 'monthly' ? (
                      <motion.div
                        key="monthly-ctrls"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, zIndex: 2000 }}
                      >
                        <EliteDropdown
                          value={selectedYear}
                          options={yearOptions}
                          onChange={setSelectedYear}
                          menuLabel="Year"
                        />
                        <EliteDropdown
                          value={selectedMonth}
                          options={monthOptions}
                          onChange={setSelectedMonth}
                          menuLabel="Month"
                        />
                      </motion.div>
                    ) : filterMode === 'custom' ? (
                      <motion.div
                        key="custom-ctrls"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px', background: 'rgba(0, 63, 73, 0.05)', borderRadius: 12, border: '1px solid rgba(0, 63, 73, 0.1)' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Calendar size={12} color="var(--teal)" />
                          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>From</span>
                          <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: 11, fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                          />
                        </div>
                        <div style={{ width: 1, height: 16, background: 'rgba(0, 63, 73, 0.1)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Calendar size={12} color="var(--teal)" />
                          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>To</span>
                          <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: 11, fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                          />
                        </div>
                        {(startDate || endDate) && (
                          <button
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                            style={{ background: 'rgba(212, 175, 55, 0.15)', border: 'none', borderRadius: 4, padding: '2px 6px', color: '#D4AF37', cursor: 'pointer', display: 'flex', marginLeft: 4 }}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <div style={{ width: 1, height: 24, background: 'rgba(0, 63, 73, 0.1)' }} />

                  {/* Integrated View Navigator */}
                  <div style={{
                    display: 'flex', background: 'rgba(255, 255, 255, 0.7)', padding: 3, borderRadius: 10, border: '1px solid rgba(0, 63, 73, 0.2)'
                  }}>
                    {[
                      { key: 'table' as const, label: 'Table View', icon: <TableProperties size={13} /> },
                      { key: 'dashboard' as const, label: 'Dashboard', icon: <BarChart3 size={13} /> },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveView(tab.key)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 8,
                          fontSize: 10,
                          fontWeight: 900,
                          border: 'none',
                          cursor: 'pointer',
                          background: activeView === tab.key ? 'var(--teal)' : 'transparent',
                          color: activeView === tab.key ? 'var(--aqua)' : '#003f49',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.3s ease',
                          opacity: activeView === tab.key ? 1 : 0.7
                        }}
                      >
                        {tab.icon}
                        {tab.label.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div style={{ width: 1, height: 24, background: 'rgba(0, 63, 73, 0.1)' }} />

                      {activeReport === 'DELIVERABLES' ? (
                        <ExportMenu
                          tasks={filteredTasks}
                          projectMetadata={syncedProject || undefined}
                          dateRangeText={filterDateText}
                          filterMode={filterMode}
                          setFilterMode={setFilterMode}
                          filterDept={filterDept}
                          setFilterDept={setFilterDept}
                          availableDepts={availableDepts}
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
                          filterType={filterType}
                          setFilterType={setFilterType}
                          availableTypes={availableTypes}
                          filterCDE={filterCDE}
                          setFilterCDE={setFilterCDE}
                          availableCDEs={availableCDEs}
                          filterPrecinct={filterPrecinct}
                          setFilterPrecinct={setFilterPrecinct}
                          availablePrecincts={availablePrecincts}
                          departments={syncedDepartments}
                          members={syncedMembers}
                        />
                      ) : (
                        <BimExportMenu
                          bimReviews={filteredBimReviews}
                          projectMetadata={syncedProject || undefined}
                          dateRangeText={filterDateText}
                          filterStage={bimFilterStage}
                          setFilterStage={setBimFilterStage}
                          availableStages={availableBimStages}
                          filterStatus={bimFilterStatus}
                          setFilterStatus={setBimFilterStatus}
                          availableStatuses={availableBimStatuses}
                          filterStakeholder={bimFilterStakeholder}
                          setFilterStakeholder={setBimFilterStakeholder}
                          availableStakeholders={availableBimStakeholders}
                          filterReviewer={bimFilterReviewer}
                          setFilterReviewer={setBimFilterReviewer}
                          availableReviewers={availableBimReviewers}
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
                          members={syncedMembers}
                        />
                      )}
                </div>
              </div>




              {/* ══════════ CONDITIONAL VIEW RENDERING ══════════ */}
              <div style={{ marginTop: 12 }}>
                <AnimatePresence mode="wait">
                  {activeView === 'table' ? (
                    <motion.div
                      key="table-view"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                    >
                      {activeReport === 'BIM_REVIEWS' ? (
                        <BIMReviewsTable
                          data={filteredBimReviews}
                          isLoading={isLoading}
                          search={bimSearch}
                          setSearch={setBimSearch}
                          filterStage={bimFilterStage}
                          setFilterStage={setBimFilterStage}
                          availableStages={availableBimStages}
                          filterStatus={bimFilterStatus}
                          setFilterStatus={setBimFilterStatus}
                          availableStatuses={availableBimStatuses}
                          filterStakeholder={bimFilterStakeholder}
                          setFilterStakeholder={setBimFilterStakeholder}
                          availableStakeholders={availableBimStakeholders}
                          filterReviewer={bimFilterReviewer}
                          setFilterReviewer={setBimFilterReviewer}
                          availableReviewers={availableBimReviewers}
                          onEdit={(review: any) => { setSelectedBimReview(review); setIsBimModalOpen(true); }}
                          onDelete={(review: any) => setBimToDelete(review)}
                          onNew={() => { setSelectedBimReview(null); setIsBimModalOpen(true); }}
                          onImport={() => bimFileInputRef.current?.click()}
                          members={syncedMembers}
                        />
                      ) : (
                        <ActiveTasks
                          tasks={filteredTasks}
                          onTaskClick={handleTaskClick}
                          search={search}
                          setSearch={setSearch}
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
                          members={syncedMembers}
                          departments={syncedDepartments}
                        />
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="dashboard-view"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                    >
                      {activeReport === 'BIM_REVIEWS' ? (
                        <BIMAnalyticsView
                          data={filteredBimReviews}
                          previousPeriodData={previousPeriodBimReviews}
                          search={bimSearch}
                          setSearch={setBimSearch}
                          filterStage={bimFilterStage}
                          setFilterStage={setBimFilterStage}
                          availableStages={availableBimStages}
                          filterStatus={bimFilterStatus}
                          setFilterStatus={setBimFilterStatus}
                          availableStatuses={availableBimStatuses}
                          filterStakeholder={bimFilterStakeholder}
                          setFilterStakeholder={setBimFilterStakeholder}
                          availableStakeholders={availableBimStakeholders}
                          filterReviewer={bimFilterReviewer}
                          setFilterReviewer={setBimFilterReviewer}
                          availableReviewers={availableBimReviewers}
                        />
                      ) : (
                        <AnalyticsDashboardView
                          tasks={filteredTasks}
                          previousPeriodTasks={previousPeriodTasks}
                          search={search}
                          setSearch={setSearch}
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
                          onTaskClick={handleTaskClick}
                          departments={syncedDepartments}
                          members={syncedMembers}
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </>
          )}
        </main>

        <footer style={{ padding: '10px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>© 2026 Insite (KEO) — REH Command Center v1.0 - Powred By :Digital Reporting Support</p>
        </footer>
      </div>

      <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      <TaskDetailModal
        isOpen={!!selectedTask}
        task={selectedTask ? (syncedTasks.find(t => t.id === selectedTask.id) || selectedTask) : null}
        onClose={() => setSelectedTask(null)}
        activeFilters={{ types: filterType, cdes: filterCDE }}
        members={syncedMembers}
        departments={syncedDepartments}
      />

      <input 
        type="file" 
        ref={bimFileInputRef} 
        onChange={handleBimExcelImport} 
        style={{ display: 'none' }} 
        accept=".xlsx, .xls"
      />

      <BIMReviewEditorModal
        isOpen={isBimModalOpen}
        review={selectedBimReview}
        onClose={() => setIsBimModalOpen(false)}
        onSuccess={(msg) => showToast(msg, 'SUCCESS')}
        onError={(msg) => showToast(msg, 'ERROR')}
        readOnly={true}
      />

      <BIMImportConfirmModal
        isOpen={bimImportConfirm.isOpen}
        records={bimImportConfirm.records}
        isLoading={isBimImportLoading}
        onClose={() => setBimImportConfirm({ isOpen: false, records: [] })}
        onConfirm={handleImportConfirm}
      />

      <EliteConfirmModal
        isOpen={!!bimToDelete}
        title="CRITICAL SECURITY: PURGE RECORD"
        message={`Are you absolutely sure you want to permanently delete the review for "${bimToDelete?.project}"? This action bypasses standard recovery protocols.`}
        onConfirm={handleDeleteBimReview}
        onClose={() => setBimToDelete(null)}
        confirmLabel="PURGE RECORD"
        severity="DANGER"
      />

      {/* Global Sync Overlay */}
      <AnimatePresence>
        {isUpdating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              background: 'radial-gradient(circle at center, rgba(10, 15, 30, 0.9) 0%, rgba(5, 5, 10, 0.95) 100%)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              gap: 48
            }}
          >
            {/* Elite Animated Core */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Outer scanning rings */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                style={{
                  position: 'absolute',
                  width: 220, height: 220, borderRadius: '50%',
                  border: '1px solid rgba(212, 175, 55, 0.05)',
                  borderTop: '1px solid rgba(212, 175, 55, 0.4)',
                }}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                style={{
                  position: 'absolute',
                  width: 180, height: 180, borderRadius: '50%',
                  border: '1px solid rgba(139, 92, 246, 0.05)',
                  borderBottom: '1px solid rgba(139, 92, 246, 0.4)',
                }}
              />

              {/* Main Spinner */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                style={{
                  width: 140, height: 140, borderRadius: '50%',
                  border: '3px solid rgba(212, 175, 55, 0.05)',
                  borderTop: '3px solid #D4AF37',
                  boxShadow: '0 0 60px rgba(212, 175, 55, 0.2), inset 0 0 30px rgba(212, 175, 55, 0.1)',
                }}
              />

              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                style={{ position: 'absolute' }}
              >
                <Globe size={60} style={{ color: 'white', filter: 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.6))' }} />
              </motion.div>
            </div>

            {/* Text Information Group */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ textAlign: 'center' }}
              >
                <h2 style={{
                  fontSize: 36,
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  margin: 0,
                  background: 'linear-gradient(to bottom, #ffffff 0%, #cbd5e1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.1))'
                }}>
                  Synchronizing Global Data
                </h2>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 24px',
                  borderRadius: 100,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4AF37', boxShadow: '0 0 12px #D4AF37' }} className="animate-pulse" />
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: 600, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                  Applying Regional Offsets: <span style={{ color: '#fff' }}>{selectedTimeZone?.name || 'Local'}</span>
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
}
