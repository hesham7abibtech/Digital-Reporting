import * as ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Task, ProjectMetadata } from './types';

/**
 * Helper to ensure a URL is absolute with a protocol
 */
function ensureAbsoluteUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // If it's a domain-like string (e.g. "google.com"), prepend https://
  if (url.match(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i)) {
    return `https://${url}`;
  }
  return url;
}

/**
 * Format date to dd-MMM-YYYY (e.g. 11-APR-2026)
 */
function formatReportDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';

  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

/**
 * Format date/time to DD-MMM-YYYY HH:MM:SS AM/PM
 */
function formatGeneratedOn(): string {
  const now = new Date();
  return now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/**
 * Loads a local image and converts it to base64 for embedding
 */
async function loadLogoBase64(path: string): Promise<string> {
  try {
    const response = await fetch(path);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error(`Failed to load logo: ${path}`, e);
    return '';
  }
}

/**
 * Helper to consolidate all available links for a task
 */
function getTaskLinks(t: Task) {
  const allLinks = [];
  if (t.fileShareLink) {
    allLinks.push({ label: 'Primary Share Link', url: ensureAbsoluteUrl(t.fileShareLink) });
  }
  if (t.links && t.links.length > 0) {
    allLinks.push(...t.links.map(l => ({ label: l.label || 'Deliverable Link', url: ensureAbsoluteUrl(l.url) })));
  }
  return allLinks;
}

/**
 * Convert Hex Color to RGB Array for jsPDF
 */
function hexToRgb(hex: string): [number, number, number] {
  if (!hex || typeof hex !== 'string') return [180, 180, 180]; // Default light grey fallback

  // Handle rgba(r,g,b,a)
  if (hex.startsWith('rgba')) {
    const match = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [180, 180, 180];
}

/**
 * Gets exact dynamic column configuration by combining metadata constraints
 * with the user's localized 'active-tasks' table layout config.
 */
export function getDynamicExportColumns(metadataExcluded: string[], format: 'excel' | 'pdf' = 'excel') {
  const baseColumns = [
    { id: 'id', excelLabel: 'ID', pdfLabel: 'UID', width: 25 },
    { id: 'title', excelLabel: 'Asset / Task Title', pdfLabel: 'ASSET TITLE', width: 50 },
    { id: 'department', excelLabel: 'Task Category', pdfLabel: 'TASK CATEGORY', width: 20 },
    { id: 'precinct', excelLabel: 'Precinct', pdfLabel: 'PRECINCT', width: 20 },
    { id: 'submitterName', excelLabel: 'Submitter', pdfLabel: 'SUBMITTER', width: 25 },
    { id: 'submittingDate', excelLabel: 'Submission Date', pdfLabel: 'SUBMISSION DATE', width: 20 },
    { id: 'deliverableType', excelLabel: 'Deliverable Type', pdfLabel: 'DELIVERABLE TYPE', width: 25 },
    { id: 'cde', excelLabel: 'CDE', pdfLabel: 'CDE', width: 20 },
    { id: 'links', excelLabel: 'Deliverables Links', pdfLabel: 'DELIVERABLES LINKS', width: 35 }
  ];
 
  let savedSettings: Record<string, { visible: boolean; order: number }> = {};
  if (typeof window !== 'undefined') {
    const savedJSON = localStorage.getItem('table-cols-active-tasks');
    if (savedJSON) {
      try { savedSettings = JSON.parse(savedJSON); } catch(e){}
    }
  }
 
  const exclusionsBridge: Record<string, string> = { 'uid': 'id', 'dept': 'department' };
  const normalizedExclusions = metadataExcluded.map(e => exclusionsBridge[e] || e);
 
  const processedColumns = baseColumns.map((col, idx) => {
    let s = savedSettings[col.id];
    
    // Submitter
    if (col.id === 'submitterName' && !s) {
      const deptOrder = savedSettings['department']?.order ?? 3;
      s = { visible: true, order: deptOrder + 0.5 };
    }

    return {
      id: col.id,
      label: format === 'pdf' ? col.pdfLabel : col.excelLabel,
      width: col.width,
      visible: normalizedExclusions.includes(col.id) ? false : (s ? s.visible : true),
      order: s ? s.order : idx
    };
  }).filter(c => c.visible).sort((a, b) => a.order - b.order);

  return processedColumns;
}

/**
 * Computes analytics data for Dashboard exports
 */
function getDashboardAnalytics(tasks: Task[]) {
  const categories: Record<string, number> = {};
  const types: Record<string, number> = {};
  const cde: Record<string, number> = {};
  const submitters: Record<string, number> = {};
  
  tasks.forEach(t => {
    // Categories
    categories[t.department] = (categories[t.department] || 0) + 1;
    
    // Deliverable Types
    if (Array.isArray(t.deliverableType)) {
      t.deliverableType.forEach(type => {
        types[type] = (types[type] || 0) + 1;
      });
    }
    
    // CDE
    if (Array.isArray(t.cde)) {
      t.cde.forEach(env => {
        cde[env] = (cde[env] || 0) + 1;
      });
    }
    
    // Submitters
    if (t.submitterName) {
      submitters[t.submitterName] = (submitters[t.submitterName] || 0) + 1;
    }
  });
  
  return {
    total: tasks.length,
    categories: Object.entries(categories).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
    types: Object.entries(types).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
    cde: Object.entries(cde).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
    submitters: Object.entries(submitters).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
    activeSubmitters: Object.keys(submitters).length
  };
}

/**
 * Elite Excel Export with Table or Dashboard focus
 */
/**
 * Elite Excel Export with Table, Dashboard, or Consolidated focus
 */
export async function exportToExcel(
  tasks: Task[], 
  metadata: ProjectMetadata | undefined, 
  dateRangeText: string | undefined,
  perspective: 'table' | 'dashboard' | 'both' = 'table',
  filters?: { types: string[], cdes: string[] }
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KEO Digital Intelligence';
  workbook.lastModifiedBy = 'KEO Admin Hub';
  workbook.created = new Date();

  // Helper to filter data for a specific task based on active export filters
  const getFilteredTaskData = (t: Task) => {
    const activeTypes = (filters?.types || []).filter(v => v !== 'All Types');
    const activeCDEs = (filters?.cdes || []).filter(v => v !== 'All Environments');

    // Aggregate from both legacy and new vector structure
    const legacyTypes = (Array.isArray(t.deliverableType) ? t.deliverableType : [t.deliverableType]).filter((v): v is string => !!v);
    const legacyCdes = (Array.isArray(t.cde) ? t.cde : [t.cde]).filter((v): v is string => !!v);
    const vectorTypes = (t.vectors || []).map(v => v.type);
    const vectorCdes = (t.vectors || []).map(v => v.cde);

    const allTypesRaw = Array.from(new Set([...legacyTypes, ...vectorTypes]));
    const allCdesRaw = Array.from(new Set([...legacyCdes, ...vectorCdes]));

    // Filter by active selection
    const filteredTypes = allTypesRaw.filter(type => activeTypes.length === 0 || activeTypes.includes(type));
    const filteredCdes = allCdesRaw.filter(c => activeCDEs.length === 0 || activeCDEs.includes(c));

    // Filter Vectors
    const filteredVectors = (t.vectors || []).filter(v => {
      const typeMatch = activeTypes.length === 0 || activeTypes.includes(v.type);
      const cdeMatch = activeCDEs.length === 0 || activeCDEs.includes(v.cde);
      return typeMatch && cdeMatch;
    });

    // Filter Legacy Links 
    const filteredLinks = (t.links || []).filter((l, i) => {
      const typeAtIdx = legacyTypes[i] || legacyTypes[0];
      const cdeAtIdx = legacyCdes[i] || legacyCdes[0];
      const typeMatch = activeTypes.length === 0 || activeTypes.includes(typeAtIdx);
      const cdeMatch = activeCDEs.length === 0 || activeCDEs.includes(cdeAtIdx);
      return typeMatch && cdeMatch;
    });

    return { 
      vectors: filteredVectors, 
      types: filteredTypes, 
      cdes: filteredCdes, 
      links: filteredLinks 
    };
  };

  // Helper to add Master Registry sheet
  const addRegistrySheet = (name: string, isMain: boolean) => {
    const dataSheet = workbook.addWorksheet(name);
    const excluded = metadata?.reportExcludedFields || [];
    const visibleColumns = getDynamicExportColumns(excluded, 'excel');
    
    // Compute max deliverables per task after filtering to size columns
    const filteredTasksData = tasks.map(t => getFilteredTaskData(t));
    const maxDeliverables = Math.max(...filteredTasksData.map(d => Math.max(d.vectors.length, d.links.length)), 1);
    
    const headers: string[] = [];
    visibleColumns.forEach(c => {
      if (c.id === 'links') {
        for (let i = 0; i < Math.min(maxDeliverables, 5); i++) {
          headers.push(`Deliverable ${i + 1}`);
        }
      } else {
        headers.push(c.label);
      }
    });

    const headerColors = { bg: metadata?.reportExcelHeaderColor || '0A0A0F', text: metadata?.reportExcelHeaderTextColor || 'FFFFFF' };
    const hRow = dataSheet.addRow(headers);
    hRow.font = { bold: true, color: { argb: 'FF' + headerColors.text.replace('#', '') } };
    hRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + headerColors.bg.replace('#', '') } };
    hRow.alignment = { horizontal: 'center', vertical: 'middle' };

    tasks.forEach((t, tIdx) => {
      const fData = filteredTasksData[tIdx];
      const rowData: any[] = [];
      visibleColumns.forEach(c => {
        if (c.id === 'id') rowData.push(t.id.toUpperCase());
        else if (c.id === 'title') rowData.push(t.title);
        else if (c.id === 'department') rowData.push(t.department);
        else if (c.id === 'precinct') rowData.push(t.precinct || '-');
        else if (c.id === 'submitterName') rowData.push(t.submitterName || '-');
        else if (c.id === 'submittingDate') rowData.push(formatReportDate(t.submittingDate));
        else if (c.id === 'deliverableType') rowData.push(fData.types.join(' | '));
        else if (c.id === 'cde') rowData.push(fData.cdes.join(' | '));
        else if (c.id === 'links') {
          const combinedLinks = fData.vectors.length > 0 
            ? fData.vectors.map(v => ({ label: `${v.type} (${v.cde})`, url: v.url }))
            : fData.links;
          for (let i = 0; i < Math.min(maxDeliverables, 5); i++) rowData.push(combinedLinks[i]?.label || '');
        }
      });
      const row = dataSheet.addRow(rowData);
      row.alignment = { vertical: 'middle', horizontal: 'center' };
      
      // Hyperlinks
      if (!excluded.includes('links')) {
        const lIdx = visibleColumns.findIndex(vv => vv.id === 'links');
        if (lIdx !== -1) {
          const combinedLinks = fData.vectors.length > 0 
            ? fData.vectors.map(v => ({ label: `${v.type} (${v.cde})`, url: v.url }))
            : fData.links;
          combinedLinks.slice(0, 5).forEach((link, idx) => {
            const cell = row.getCell(lIdx + 1 + idx);
            if (link.url) {
              cell.value = { text: link.label || 'Link', hyperlink: ensureAbsoluteUrl(link.url) };
              cell.font = { color: { argb: 'FF0563C1' }, underline: true };
            }
          });
        }
      }
    });

    // AUTO-SIZE COLUMNS
    dataSheet.columns.forEach((column) => {
      let maxLen = 0;
      if (column && column.eachCell) {
        column.eachCell({ includeEmpty: true }, (cell) => {
          const L = cell.value ? cell.value.toString().length : 10;
          if (L > maxLen) maxLen = L;
        });
      }
      if (column) column.width = maxLen < 15 ? 15 : maxLen + 5;
    });

    dataSheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
    return dataSheet;
  };
  
  if (perspective === 'dashboard' || perspective === 'both') {
    const analytics = getDashboardAnalytics(tasks);
    
    // 1. Dashboard Overview Sheet
    const summarySheet = workbook.addWorksheet('Dashboard Overview');
    summarySheet.columns = [{ width: 30 }, { width: 40 }];
    
    // Branded Header
    const titleRow = summarySheet.addRow(['ANALYTICS EXECUTIVE SUMMARY']);
    titleRow.font = { bold: true, size: 14, color: { argb: 'FFD4AF37' } };
    summarySheet.addRow([]);
    
    // KPI Cards as Data
    summarySheet.addRow(['CORE METRICS']).font = { bold: true };
    summarySheet.addRow(['Total Deliverables Tracking', analytics.total]);
    summarySheet.addRow(['Active Technical Categories', analytics.categories.length]);
    summarySheet.addRow(['Unique Project Submitters', analytics.activeSubmitters]);
    summarySheet.addRow(['Primary CDE Environment', analytics.cde[0]?.name || 'N/A']);
    summarySheet.addRow(['Report Period', dateRangeText || 'All Time']);
    summarySheet.addRow(['Generated On', formatGeneratedOn()]);
    
    summarySheet.addRow([]);
    summarySheet.addRow(['VISUALIZATION DATA MAPPING']).font = { bold: true };
    
    // 2. Dynamic Analytics Data Sheet (HIDDEN - Backend DB)
    const dataSheet = workbook.addWorksheet('Analytics Data Matrix');
    dataSheet.state = 'hidden'; // Hide as requested, used for data mapping
    dataSheet.columns = [{ width: 25 }, { width: 20 }, { width: 15 }, { width: 25 }, { width: 15 }];
    
    const headerRow = dataSheet.addRow(['Metric Group', 'Dimension', 'Count', 'Percentage of Total', 'Growth Index']);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A0A0F' } };
    headerRow.alignment = { horizontal: 'center' };
    
    const addGroup = (label: string, items: {name: string, value: number}[]) => {
      items.forEach(item => {
        const row = dataSheet.addRow([
          label, 
          item.name, 
          item.value, 
          `${((item.value / analytics.total) * 100).toFixed(1)}%`,
          'STABLE'
        ]);
        row.alignment = { horizontal: 'center' };
      });
      dataSheet.addRow([]); // Spacer
    };
    
    addGroup('Functional Categories', analytics.categories);
    addGroup('Deliverable Types', analytics.types);
    addGroup('CDE Usage', analytics.cde);
    addGroup('Team Contributions', analytics.submitters);
    
    // 3. Raw Filtered Data
    addRegistrySheet('Filtered Registry Source', false);
  }

  if (perspective === 'table' || perspective === 'both') {
    // 1. Executive Summary Sheet
    const summarySheet = workbook.addWorksheet(perspective === 'both' ? 'Project Narrative' : 'Executive Summary');
    summarySheet.columns = [{ width: 25 }, { width: 55 }];

    summarySheet.addRow(['PROJECT EXECUTIVE SUMMARY']).font = { bold: true, size: 12 };
    summarySheet.addRow([]);

    const fieldsToRender = metadata?.reportSummaryFields || [];
    fieldsToRender.forEach(field => {
      if (!field.isVisible) return;
      let val = field.value || (
        field.id === 'projectName' ? (metadata?.projectName || 'Project') : 
        field.id === 'generatedOn' ? formatGeneratedOn() :
        field.id === 'totalTasks' ? tasks.length.toString() : 
        field.id === 'activeDate' ? (dateRangeText || 'All Time') : ''
      );
      const row = summarySheet.addRow([field.label, val]);
      row.getCell(1).font = { bold: true };
    });

    // 2. Comprehensive Master Registry
    addRegistrySheet('Comprehensive Registry', true);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `${metadata?.projectName || 'Project'}_${perspective === 'dashboard' ? 'Analytics_Insights' : 'Master_Registry'}_${new Date().toISOString().split('T')[0]}.xlsx`;

  return { blob, filename };
}

/**
 * Elite PDF Export with Table or Dashboard focus
 */
/**
 * Elite PDF Export with Table, Dashboard, or Consolidated focus
 */
export async function exportToPDF(
  tasks: Task[], 
  metadata: ProjectMetadata | undefined, 
  dateRangeText: string | undefined,
  perspective: 'table' | 'dashboard' | 'both' = 'table',
  filters?: { types: string[], cdes: string[] }
) {
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const bgColor = hexToRgb(metadata?.reportBgColor || '#0a0a0f');
  const accentColor = hexToRgb(metadata?.reportAccentColor || '#D4AF37');
  const headerTextColor = hexToRgb(metadata?.reportHeaderTextColor || '#D4AF37');

  // Helper to filter data for a specific task based on active export filters
  const getFilteredTaskData = (t: Task) => {
    const activeTypes = (filters?.types || []).filter(v => v !== 'All Types');
    const activeCDEs = (filters?.cdes || []).filter(v => v !== 'All Environments');

    // Aggregate from both legacy and new vector structure
    const legacyTypes = (Array.isArray(t.deliverableType) ? t.deliverableType : [t.deliverableType]).filter((v): v is string => !!v);
    const legacyCdes = (Array.isArray(t.cde) ? t.cde : [t.cde]).filter((v): v is string => !!v);
    const vectorTypes = (t.vectors || []).map(v => v.type);
    const vectorCdes = (t.vectors || []).map(v => v.cde);

    const allTypesRaw = Array.from(new Set([...legacyTypes, ...vectorTypes]));
    const allCdesRaw = Array.from(new Set([...legacyCdes, ...vectorCdes]));

    // Filter by active selection
    const filteredTypes = allTypesRaw.filter(type => activeTypes.length === 0 || activeTypes.includes(type));
    const filteredCdes = allCdesRaw.filter(c => activeCDEs.length === 0 || activeCDEs.includes(c));

    const filteredVectors = (t.vectors || []).filter(v => {
      const typeMatch = activeTypes.length === 0 || activeTypes.includes(v.type);
      const cdeMatch = activeCDEs.length === 0 || activeCDEs.includes(v.cde);
      return typeMatch && cdeMatch;
    });

    const filteredLinks = (t.links || []).filter((l, i) => {
      const typeAtIdx = legacyTypes[i] || legacyTypes[0];
      const cdeAtIdx = legacyCdes[i] || legacyCdes[0];
      const typeMatch = activeTypes.length === 0 || activeTypes.includes(typeAtIdx);
      const cdeMatch = activeCDEs.length === 0 || activeCDEs.includes(cdeAtIdx);
      return typeMatch && cdeMatch;
    });

    return { 
      vectors: filteredVectors, 
      types: filteredTypes, 
      cdes: filteredCdes, 
      links: filteredLinks 
    };
  };

  // Helper for Cover Page
  const drawCover = () => {
    doc.setFillColor(...bgColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setFillColor(...accentColor);
    doc.rect(0, 0, 5, pageHeight, 'F');

    doc.setTextColor(...headerTextColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(metadata?.reportBranding || 'KEO DIGITAL INTELLIGENCE // MASTER TRANSCRIPT', 20, 42);

    doc.setFontSize(48);
    const title = perspective === 'dashboard' ? 'ANALYTICS INSIGHTS' : (perspective === 'both' ? 'EXECUTIVE MASTER REPORT' : (metadata?.reportTitle || 'EXECUTIVE SUMMARY'));
    doc.text(title, 20, 62);

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(perspective === 'dashboard' ? 'VISUAL PERFORMANCE & METRIC SUMMARY' : (perspective === 'both' ? 'CONSOLIDATED ANALYTICS & REGISTRY TRANSCRIPT' : (metadata?.reportSubtitle || 'OPERATIONAL PERFORMANCE & DELIVERABLES')), 20, 74);

    let currentY = 100;
    const summaryFields = metadata?.reportSummaryFields || [];
    summaryFields.forEach(f => {
      if (!f.isVisible) return;
      if (f.id === 'reportTitle' || f.id === 'periodReference') return;
      
      let val = f.value || '';
      if (!val) {
        if (f.id === 'projectName') val = metadata?.projectName || 'Project';
        if (f.id === 'activeDate') val = dateRangeText || 'All Time';
        if (f.id === 'generatedOn') val = formatGeneratedOn();
        if (f.id === 'totalTasks') val = tasks.length.toString();
      }

      doc.setTextColor(...accentColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${f.label}:`, 20, currentY);
      const labelW = doc.getTextWidth(`${f.label}: `);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.text(val, 20 + labelW, currentY);
      currentY += 15;
    });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(metadata?.reportFooter || 'PRIVATE & CONFIDENTIAL // INTEGRATED DATA STREAM', 20, pageHeight - 15);
  };

  // Section Divider Helper
  const drawDivider = (title: string) => {
    doc.addPage();
    doc.setFillColor(...bgColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setFillColor(...accentColor);
    doc.rect(0, pageHeight / 2 - 25, pageWidth, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, pageHeight / 2 + 3, { align: 'center' });
  };

  // Dashboard / Analytics Page Helper
  const drawDashboard = () => {
    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE PERFORMANCE DASHBOARD', 14, 20);

    // Filter summary for this page
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const filterText = `Refined by: ${filters?.types?.join(', ') || 'All Types'} // ${filters?.cdes?.join(', ') || 'All Environments'}`;
    doc.text(filterText, 14, 28);

    // Simple KPIs Grid
    const kpiY = 40;
    const kpiW = (pageWidth - 40) / 4;
    const kpiH = 30;

    const stats = [
      { label: 'Total Tasks', value: tasks.length.toString() },
      { label: 'Completion Rate', value: `${Math.round((tasks.filter(t => t.status === 'COMPLETED').length / (tasks.length || 1)) * 100)}%` },
      { label: 'In-Progress', value: tasks.filter(t => t.status === 'IN_PROGRESS').length.toString() },
      { label: 'Pending Review', value: tasks.filter(t => t.status === 'PENDING_REVIEW').length.toString() }
    ];

    stats.forEach((s, i) => {
      const x = 14 + i * (kpiW + 4);
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.rect(x, kpiY, kpiW, kpiH, 'FD');
      
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(s.label.toUpperCase(), x + 5, kpiY + 8);
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.text(s.value, x + 5, kpiY + 22);
    });

    // Add a simple chart placeholder / summary table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DISTRIBUTION BY CATEGORY', 14, kpiY + kpiH + 15);

    const deptsRaw: Record<string, number> = {};
    tasks.forEach(t => deptsRaw[t.department] = (deptsRaw[t.department] || 0) + 1);
    const deptStats = Object.entries(deptsRaw).sort((a,b) => b[1] - a[1]);

    autoTable(doc, {
      startY: kpiY + kpiH + 20,
      head: [['Category', 'Count', 'Weight']],
      body: deptStats.map(([name, count]) => [name, count.toString(), `${Math.round((count / tasks.length) * 100)}%`]),
      margin: { left: 14 },
      tableWidth: 120,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 41, 59] }
    });
  };

  // Helper for Table Registry
  const drawTable = () => {
    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.text(metadata?.reportBranding || 'KEO DIGITAL INTELLIGENCE // MASTER TRANSCRIPT', 14, 20);

    const excluded = metadata?.reportExcludedFields || [];
    const visibleCols = getDynamicExportColumns(excluded, 'pdf');
    const head = [visibleCols.map(c => c.label)];
    
    // Process filtered data for each task
    const filteredTasksData = tasks.map(t => getFilteredTaskData(t));

    const body = tasks.map((t, tIdx) => {
      const fData = filteredTasksData[tIdx];
      const combinedLinks = fData.vectors.length > 0 
        ? fData.vectors.map(v => ({ label: `${v.type} (${v.cde})`, url: v.url }))
        : fData.links;
      
      const linksLabels = combinedLinks.map(l => l.label).join(' | ');
      
      return visibleCols.map(c => {
        if (c.id === 'id') return t.id.toUpperCase();
        if (c.id === 'title') return t.title;
        if (c.id === 'department') return t.department;
        if (c.id === 'precinct') return t.precinct || '-';
        if (c.id === 'submitterName') return t.submitterName || '-';
        if (c.id === 'submittingDate') return formatReportDate(t.submittingDate);
        if (c.id === 'deliverableType') return fData.types.join(' | ') || '-';
        if (c.id === 'cde') return fData.cdes.join(' | ') || '-';
        if (c.id === 'links') return linksLabels || '-';
        return '-';
      });
    });

    const lIdx = visibleCols.findIndex(cc => cc.id === 'links');
    const titleIdx = visibleCols.findIndex(cc => cc.id === 'title');
    const colsConfig: any = {};
    
    // Auto-fit all columns using 'wrap' (fits content) except Title which gets 'linebreak'
    visibleCols.forEach((col, idx) => {
      if (col.id === 'title') {
        colsConfig[idx] = { cellWidth: 'auto', overflow: 'linebreak', halign: 'left' };
      } else if (col.id === 'links') {
        colsConfig[idx] = { cellWidth: 'wrap', textColor: [5, 99, 193] };
      } else {
        colsConfig[idx] = { cellWidth: 'wrap' };
      }
    });

    autoTable(doc, {
      startY: 30,
      head,
      body,
      theme: 'grid',
      headStyles: { 
        fillColor: [30, 41, 59], // Slate 800 for high density headers
        textColor: [255, 255, 255], 
        fontSize: 8, 
        fontStyle: 'bold', 
        halign: 'center', 
        cellPadding: 4,
        overflow: 'linebreak' // ENABLE ULTRA PREMIUM WRAPPING
      },
      styles: { 
        fontSize: 7.5, 
        cellPadding: 4, 
        overflow: 'visible', // Prevent truncation globally except where specified
        halign: 'center', 
        valign: 'middle' 
      },
      columnStyles: colsConfig,
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === lIdx && lIdx !== -1) {
          const links = getTaskLinks(tasks[data.row.index]);
          if (links.length > 0) {
            const label = links.map(ll => ll.label).join(' | ');
            const totalW = doc.getTextWidth(label);
            let cX = data.cell.x + (data.cell.width - totalW) / 2;
            links.forEach((ll, ii) => {
              const w = doc.getTextWidth(ll.label);
              doc.link(cX, data.cell.y, w, data.cell.height, { url: ll.url });
              cX += w + doc.getTextWidth(' | ');
            });
          }
        }
      }
    });
  };

  // Execution Flow
  drawCover();
  
  if (perspective === 'dashboard' || perspective === 'both') {
    drawDashboard();
  }
  
  if (perspective === 'both') {
    drawDivider('TASK REGISTRY TRANSCRIPT');
  }
  
  if (perspective === 'table' || perspective === 'both') {
    drawTable();
  }

  const patched = doc.output().replace(/\/S\s*\/URI\s*\/URI\s*\((.*?)\)\s*>>/g, '/S /URI /URI ($1) /NewWindow true /Target (new) >>');
  const buffer = new Uint8Array(patched.length).map((_, i) => patched.charCodeAt(i) & 0xFF);
  return { blob: new Blob([buffer], { type: 'application/pdf' }), filename: `${metadata?.projectName || 'Project'}_${perspective === 'both' ? 'Consolidated' : (perspective === 'dashboard' ? 'Analytics' : 'Report')}_${new Date().toISOString().split('T')[0]}.pdf` };
}

/**
 * Gets BIM column configuration
 */
export function getBimExportColumns(metadataExcluded: string[], format: 'excel' | 'pdf' = 'excel') {
  const baseColumns = [
    { id: 'project', excelLabel: 'Project', pdfLabel: 'PROJECT', width: 30 },
    { id: 'stakeholder', excelLabel: 'Stakeholder', pdfLabel: 'STAKEHOLDER', width: 25 },
    { id: 'reviewNumber', excelLabel: 'Review No.', pdfLabel: 'REV NO', width: 15 },
    { id: 'submissionDescription', excelLabel: 'Submission Description', pdfLabel: 'DESCRIPTION', width: 50 },
    { id: 'designStage', excelLabel: 'Design Stage', pdfLabel: 'STAGE', width: 20 },
    { id: 'submissionDate', excelLabel: 'Submission Date', pdfLabel: 'SUBMISSION DATE', width: 20 },
    { id: 'submissionCategory', excelLabel: 'Category', pdfLabel: 'CATEGORY', width: 25 },
    { id: 'onAcc', excelLabel: 'ACC Submission Status', pdfLabel: 'ACC STATUS', width: 20 },
    { id: 'insiteReviewer', excelLabel: 'InSite Reviewer', pdfLabel: 'REVIEWER', width: 25 },
    { id: 'insiteReviewDueDate', excelLabel: 'Due Date', pdfLabel: 'DUE DATE', width: 20 },
    { id: 'insiteBimReviewStatus', excelLabel: 'InSite Status', pdfLabel: 'INSITE STATUS', width: 20 },
    { id: 'modonHillFinalReviewStatus', excelLabel: 'Modon/Hill Status', pdfLabel: 'MODON STATUS', width: 20 },
    { id: 'comments', excelLabel: 'Comments', pdfLabel: 'COMMENTS', width: 40 },
    { id: 'insiteReviewOutputUrl', excelLabel: 'Review Report Links', pdfLabel: 'REPORT LINKS', width: 25 }
  ];

  return baseColumns.map((col, idx) => ({
    id: col.id,
    label: format === 'pdf' ? col.pdfLabel : col.excelLabel,
    width: col.width,
    visible: !metadataExcluded.includes(col.id),
    order: idx
  })).filter(c => c.visible);
}

/**
 * BIM Analytics for Dashboard
 */
function getBimDashboardAnalytics(reviews: BIMReview[]) {
  const modonStatuses: Record<string, number> = {};
  const insiteStatuses: Record<string, number> = {};
  const stakeholders: Record<string, number> = {};
  
  reviews.forEach(r => {
    modonStatuses[r.modonHillFinalReviewStatus || 'Awaiting'] = (modonStatuses[r.modonHillFinalReviewStatus || 'Awaiting'] || 0) + 1;
    insiteStatuses[r.insiteBimReviewStatus || 'Pending'] = (insiteStatuses[r.insiteBimReviewStatus || 'Pending'] || 0) + 1;
    stakeholders[r.stakeholder || 'N/A'] = (stakeholders[r.stakeholder || 'N/A'] || 0) + 1;
  });

  return {
    total: reviews.length,
    modon: Object.entries(modonStatuses).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
    insite: Object.entries(insiteStatuses).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
    stakeholders: Object.entries(stakeholders).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
    approvedCount: modonStatuses['Approved'] || 0
  };
}

/**
 * BIM Excel Export
 */
export async function exportBimToExcel(
  reviews: BIMReview[],
  metadata: ProjectMetadata | undefined,
  dateRangeText: string | undefined,
  perspective: 'table' | 'dashboard' | 'both' = 'table',
  selectedColumns?: string[]
) {
  const workbook = new ExcelJS.Workbook();
  const headerColors = { bg: metadata?.reportExcelHeaderColor || '0A0A0F', text: metadata?.reportExcelHeaderTextColor || 'FFFFFF' };

  const addRegistrySheet = (name: string) => {
    const sheet = workbook.addWorksheet(name);
    let cols = getBimExportColumns([], 'excel');
    if (selectedColumns && selectedColumns.length > 0) {
      cols = cols.filter(c => selectedColumns.includes(c.id));
    }
    
    const headers = cols.map(c => c.label);
    const hRow = sheet.addRow(headers);
    hRow.font = { bold: true, color: { argb: 'FF' + headerColors.text.replace('#', '') } };
    hRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + headerColors.bg.replace('#', '') } };
    hRow.alignment = { horizontal: 'center', vertical: 'middle' };

    reviews.forEach(r => {
      const rowData = cols.map(c => {
        const val = (r as any)[c.id];
        if (Array.isArray(val)) return val.join(', ');
        return val || '-';
      });
      const row = sheet.addRow(rowData);
      row.alignment = { vertical: 'middle', horizontal: 'center' };
      
      const linkIdx = cols.findIndex(c => c.id === 'insiteReviewOutputUrl');
      if (linkIdx !== -1 && r.insiteReviewOutputUrl) {
        const cell = row.getCell(linkIdx + 1);
        cell.value = { text: 'View Report', hyperlink: r.insiteReviewOutputUrl };
        cell.font = { color: { argb: 'FF0563C1' }, underline: true };
      }

    });

    sheet.columns.forEach(col => {
      let maxLen = 0;
      col.eachCell?.({ includeEmpty: true }, cell => {
        const l = cell.value ? cell.value.toString().length : 10;
        if (l > maxLen) maxLen = l;
      });
      col.width = Math.min(maxLen + 5, 50);
    });
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };
  };

  if (perspective === 'dashboard' || perspective === 'both') {
    const analytics = getBimDashboardAnalytics(reviews);
    const sheet = workbook.addWorksheet('BIM Insights');
    sheet.addRow(['BIM REVIEW EXECUTIVE SUMMARY']).font = { bold: true, size: 14, color: { argb: 'FFD4AF37' } };
    sheet.addRow([]);
    sheet.addRow(['Total Reviews', analytics.total]);
    sheet.addRow(['Approved (Modon)', analytics.approvedCount]);
    sheet.addRow(['Active Stakeholders', analytics.stakeholders.length]);
    sheet.addRow(['Period', dateRangeText || 'All Time']);
    sheet.addRow(['Generated On', formatGeneratedOn()]);
  }

  if (perspective === 'table' || perspective === 'both') {
    addRegistrySheet('BIM Review Matrix');
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return { blob: new Blob([buffer]), filename: `BIM_Reviews_${new Date().toISOString().split('T')[0]}.xlsx` };
}

/**
 * BIM PDF Export
 */
export async function exportBimToPDF(
  reviews: BIMReview[],
  metadata: ProjectMetadata | undefined,
  dateRangeText: string | undefined,
  perspective: 'table' | 'dashboard' | 'both' = 'table',
  selectedColumns?: string[]
) {
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const bgColor = hexToRgb(metadata?.reportBgColor || '#0a0a0f');
  const accentColor = hexToRgb(metadata?.reportAccentColor || '#D4AF37');

  const drawCover = () => {
    doc.setFillColor(...bgColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setTextColor(...accentColor);
    doc.setFontSize(40);
    doc.setFont('helvetica', 'bold');
    doc.text('BIM REVIEW MATRIX', 20, 60);
    doc.setFontSize(18);
    doc.setTextColor(255,255,255);
    doc.text(metadata?.projectName || 'Project Master Registry', 20, 75);
    doc.setFontSize(12);
    doc.text(`Period: ${dateRangeText || 'All Time'}`, 20, 90);
    doc.text(`Generated: ${formatGeneratedOn()}`, 20, 100);
  };

  const drawTable = () => {
    doc.addPage();
    let cols = getBimExportColumns([], 'pdf');
    if (selectedColumns && selectedColumns.length > 0) {
      cols = cols.filter(c => selectedColumns.includes(c.id));
    }
    const head = [cols.map(c => c.label)];
    const body = reviews.map(r => cols.map(c => {
      const val = (r as any)[c.id];
      return Array.isArray(val) ? val.join(', ') : (val || '-');
    }));

    autoTable(doc, {
      head, body, theme: 'grid',
      headStyles: { 
        fillColor: [30, 41, 59], 
        fontSize: 5.5, 
        halign: 'center', 
        valign: 'middle',
        overflow: 'linebreak',
        cellPadding: 1
      },
      styles: { 
        fontSize: 5, 
        halign: 'center', 
        valign: 'middle',
        cellPadding: 1,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 15 }, // PROJECT
        1: { cellWidth: 16 }, // STAKEHOLDER
        2: { cellWidth: 10 }, // REV NO
        3: { cellWidth: 35, halign: 'left' }, // DESCRIPTION
        4: { cellWidth: 12 }, // STAGE
        5: { cellWidth: 18 }, // SUBMISSION DATE
        6: { cellWidth: 18 }, // CATEGORY
        7: { cellWidth: 12 }, // ACC STATUS
        8: { cellWidth: 16 }, // REVIEWER
        9: { cellWidth: 18 }, // DUE DATE
        10: { cellWidth: 14 }, // INSITE STATUS
        11: { cellWidth: 14 }, // MODON STATUS
        12: { cellWidth: 32, halign: 'left' }, // COMMENTS
        13: { cellWidth: 10 },  // REPORT LINKS
        14: { cellWidth: 10 }   // WORKFLOW LINK
      }
    });
  };

  drawCover();
  if (perspective === 'table' || perspective === 'both') drawTable();
  
  return { blob: new Blob([doc.output('blob')], { type: 'application/pdf' }), filename: `BIM_Report_${new Date().toISOString().split('T')[0]}.pdf` };
}


import { BIMReview } from './types';
