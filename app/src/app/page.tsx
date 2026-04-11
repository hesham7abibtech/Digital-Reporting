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
import NotificationPanel from '@/components/dashboard/NotificationPanel';
import TaskDetailModal from '@/components/dashboard/TaskDetailModal';
import EliteDropdown from '@/components/dashboard/EliteDropdown';
import ExportMenu from '@/components/dashboard/ExportMenu';
import type { Task } from '@/lib/types';
import { useTimeZone } from '@/context/TimeZoneContext';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useAuth } from '@/context/AuthContext';
import { useRegistryView } from '@/hooks/useRegistryView';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, CalendarRange, X, Calendar, Database, TableProperties, BarChart3 } from 'lucide-react';
import { useEffect } from 'react';

export default function Dashboard() {
  const { isUpdating, selectedTimeZone } = useTimeZone();
  const { tasks: syncedTasks, members: syncedMembers, registry: syncedRegistry, departments: syncedDepartments, project: syncedProject, isLoading } = useRealtimeData();
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
  const [search, setSearch] = useState('');
  const { activeView, setActiveView } = useRegistryView('table');

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getTaskRange = (t: Task) => {
    // Migrate: Use actualEndDate first, then actualStartDate, then submittingDate or createdAt
    const dateStr = t.submittingDate || (t as any).actualEndDate || (t as any).actualStartDate || t.createdAt;
    const date = new Date(dateStr);
    return { start: date, end: date };
  };

  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    syncedTasks.forEach(t => {
      const { start, end } = getTaskRange(t);
      const startYear = start.getFullYear();
      const endYear = end.getFullYear();

      for (let y = startYear; y <= endYear; y++) {
        yearsSet.add(y);
      }
    });

    if (yearsSet.size === 0) yearsSet.add(now.getFullYear());
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [syncedTasks]);

  const yearOptions = availableYears.map(y => ({ label: y.toString(), value: y }));

  const availableMonths = useMemo(() => {
    const monthsSet = new Set<number>();
    syncedTasks.forEach(t => {
      const { start, end } = getTaskRange(t);
      const startYear = start.getFullYear();
      const endYear = end.getFullYear();

      if (selectedYear >= startYear && selectedYear <= endYear) {
        let mStart = selectedYear === startYear ? start.getMonth() : 0;
        let mEnd = selectedYear === endYear ? end.getMonth() : 11;

        for (let m = mStart; m <= mEnd; m++) {
          monthsSet.add(m);
        }
      }
    });

    if (monthsSet.size === 0) monthsSet.add(now.getMonth());
    return Array.from(monthsSet).sort((a, b) => a - b);
  }, [syncedTasks, selectedYear]);

  const monthOptions = availableMonths.map(m => ({ label: months[m], value: m }));

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
    const depts = new Set(dateFilteredTasks.map(t => t.department));
    return ['All Categories', ...Array.from(depts).sort()];
  }, [dateFilteredTasks]);

  const availableTypes = useMemo(() => {
    const types = new Set(dateFilteredTasks.flatMap(t => t.deliverableType || []));
    return ['All Types', ...Array.from(types).sort()];
  }, [dateFilteredTasks]);

  const availableCDEs = useMemo(() => {
    const cdes = new Set(dateFilteredTasks.flatMap(t => t.cde || []));
    return ['All Environments', ...Array.from(cdes).sort()];
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
      result = result.filter(t => filterDept.includes(t.department));
    }

    // Apply Deliverable Type filter
    if (filterType.length > 0 && !filterType.includes('All Types')) {
      result = result.filter(t =>
        (t.deliverableType || []).some(type => filterType.includes(type))
      );
    }

    // Apply CDE Environment filter
    if (filterCDE.length > 0 && !filterCDE.includes('All Environments')) {
      result = result.filter(t =>
        (t.cde || []).some(env => filterCDE.includes(env))
      );
    }

    // Apply Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }
    return result;
  }, [dateFilteredTasks, filterDept, search]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const filterDateText = useMemo(() => {
    if (filterMode === 'all') return 'All Time';
    if (filterMode === 'monthly') return `${months[selectedMonth]} ${selectedYear}`;
    return (startDate || endDate ? `${startDate || 'Start'} to ${endDate || 'Present'}` : 'Custom Range');
  }, [filterMode, selectedMonth, selectedYear, startDate, endDate, months]);

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <ParticleBackground />

      <div style={{ position: 'relative', zIndex: 1000, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header project={syncedProject || undefined} onNotificationClick={() => setNotifOpen(true)} />

        <main style={{ flex: 1, padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 'calc(100vh - 100px)' }}>
          {isLoading && syncedTasks.length === 0 && !syncedProject ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', flexDirection: 'column', gap: 16 }}>
              <div style={{ width: 40, height: 40, border: '2px solid rgba(212, 175, 55, 0.1)', borderTopColor: '#D4AF37', borderRadius: '50%' }} className="animate-spin" />
              <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.05em' }}>ESTABLISHING SECURE CONNECTION...</p>
            </div>
          ) : (
            <>
              <ProjectHeader project={syncedProject || undefined} members={syncedMembers} tasks={filteredTasks} dateRangeText={filterDateText} />

              <div style={{
                padding: '12px 24px',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.012) 0%, rgba(212, 175, 55, 0.03) 50%, rgba(255,255,255,0.012) 100%)',
                borderTop: '1px solid rgba(255,255,255,0.04)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                marginBottom: 12,
                flexWrap: 'nowrap',
                overflow: 'visible',
                position: 'relative',
                zIndex: 200,
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'rgba(212, 175, 55, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(212, 175, 55, 0.2)'
                  }}>
                    <CalendarRange size={16} color="#D4AF37" />
                  </div>
                  <h2 style={{ fontSize: 13, fontWeight: 900, color: 'white', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    Dashboard Overview — <span style={{ color: '#D4AF37' }}>
                      {filterDateText}
                    </span>
                  </h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto', flexShrink: 0 }}>
                  {/* Mode Switcher */}
                  <div style={{
                    display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 3,
                    border: '1px solid rgba(255,255,255,0.06)', position: 'relative'
                  }}>
                    {['all', 'monthly', 'custom'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setFilterMode(mode as any)}
                        style={{
                          padding: '6px 16px', borderRadius: 9, fontSize: 10, fontWeight: 800,
                          textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none',
                          cursor: 'pointer', position: 'relative', zIndex: 1,
                          background: 'transparent',
                          color: filterMode === mode ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                          transition: 'color 0.3s ease'
                        }}
                      >
                        {filterMode === mode && (
                          <motion.div
                            layoutId="mode-bg"
                            style={{
                              position: 'absolute', inset: 0, background: 'rgba(212, 175, 55, 0.1)',
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
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: 12, border: '1px solid rgba(212, 175, 55, 0.1)' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Calendar size={12} color="#D4AF37" />
                          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(212, 175, 55, 0.6)', textTransform: 'uppercase' }}>From</span>
                          <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            style={{ background: 'none', border: 'none', color: '#D4AF37', fontSize: 11, fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                          />
                        </div>
                        <div style={{ width: 1, height: 16, background: 'rgba(212, 175, 55, 0.2)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Calendar size={12} color="#D4AF37" />
                          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(212, 175, 55, 0.6)', textTransform: 'uppercase' }}>To</span>
                          <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            style={{ background: 'none', border: 'none', color: '#D4AF37', fontSize: 11, fontWeight: 700, outline: 'none', cursor: 'pointer' }}
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

                  <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.06)' }} />

                  {/* Elite Export System */}
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
                  />
                </div>
              </div>


              {/* ══════════ VIEW TOGGLE ══════════ */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                marginTop: 8,
                marginBottom: -4,
              }}>
                <div style={{
                  display: 'flex',
                  background: 'rgba(0,0,0,0.35)',
                  borderRadius: 12,
                  padding: 3,
                  border: '1px solid rgba(255,255,255,0.06)',
                  position: 'relative',
                }}>
                  {[
                    { key: 'table' as const, label: 'Table View', icon: <TableProperties size={14} /> },
                    { key: 'dashboard' as const, label: 'Dashboard', icon: <BarChart3 size={14} /> },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveView(tab.key)}
                      style={{
                        padding: '7px 18px',
                        borderRadius: 9,
                        fontSize: 12,
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 1,
                        background: 'transparent',
                        color: activeView === tab.key ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        transition: 'color 0.3s ease',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {activeView === tab.key && (
                        <motion.div
                          layoutId="view-toggle-bg"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(212, 175, 55, 0.1)',
                            borderRadius: 9,
                            border: '1px solid rgba(212, 175, 55, 0.2)',
                            zIndex: -1,
                          }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
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
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="dashboard-view"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                    >
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
                        onTaskClick={handleTaskClick}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </main>

        <footer style={{ padding: '10px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>© 2026 Insite (KEO) — REH Command Center v1.0 - Powred By : Hesham Habib</p>
        </footer>
      </div>

      <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      <TaskDetailModal
        task={selectedTask ? (syncedTasks.find(t => t.id === selectedTask.id) || selectedTask) : null}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
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

      {/* Floating Real-time Status */}
      <div style={{
        position: 'fixed', bottom: 24, right: 32,
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(10, 10, 15, 0.7)',
        padding: '8px 16px', borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        pointerEvents: 'none'
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} className="pulse-dot" />
        <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {isLoading ? 'SYNCING...' : 'LIVE SECURE LINK'}
        </span>
      </div>
    </div>
  );
}
