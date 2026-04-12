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
  perspective: 'table' | 'dashboard' | 'both' = 'table'
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KEO Digital Intelligence';
  workbook.lastModifiedBy = 'KEO Admin Hub';
  workbook.created = new Date();

  // Helper to add Master Registry sheet
  const addRegistrySheet = (name: string, isMain: boolean) => {
    const dataSheet = workbook.addWorksheet(name);
    const excluded = metadata?.reportExcludedFields || [];
    const visibleColumns = getDynamicExportColumns(excluded, 'excel');
    
    const maxLinks = Math.max(...tasks.map(t => getTaskLinks(t).length), 1);
    const headers: string[] = [];
    const colWidths: any[] = [];

    visibleColumns.forEach(c => {
      if (c.id === 'links') {
        for (let i = 0; i < Math.min(maxLinks, 5); i++) {
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

    tasks.forEach(t => {
      const links = getTaskLinks(t);
      const rowData: any[] = [];
      visibleColumns.forEach(c => {
        if (c.id === 'id') rowData.push(t.id.toUpperCase());
        else if (c.id === 'title') rowData.push(t.title);
        else if (c.id === 'department') rowData.push(t.department);
        else if (c.id === 'submitterName') rowData.push(t.submitterName || '-');
        else if (c.id === 'submittingDate') rowData.push(formatReportDate(t.submittingDate));
        else if (c.id === 'deliverableType') rowData.push(Array.isArray(t.deliverableType) ? t.deliverableType.join(' | ') : t.deliverableType);
        else if (c.id === 'cde') rowData.push(Array.isArray(t.cde) ? t.cde.join(' | ') : t.cde);
        else if (c.id === 'links') {
          for (let i = 0; i < Math.min(maxLinks, 5); i++) rowData.push(links[i]?.label || '');
        }
      });
      const row = dataSheet.addRow(rowData);
      row.alignment = { vertical: 'middle', horizontal: 'center' };
      
      // Hyperlinks
      if (!excluded.includes('links')) {
        const lIdx = visibleColumns.findIndex(vv => vv.id === 'links');
        if (lIdx !== -1) {
          links.slice(0, 5).forEach((link, idx) => {
            const cell = row.getCell(lIdx + 1 + idx);
            if (link.url) {
              cell.value = { text: link.label || 'Link', hyperlink: link.url };
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
  perspective: 'table' | 'dashboard' | 'both' = 'table'
) {
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const bgColor = hexToRgb(metadata?.reportBgColor || '#0a0a0f');
  const accentColor = hexToRgb(metadata?.reportAccentColor || '#D4AF37');
  const headerTextColor = hexToRgb(metadata?.reportHeaderTextColor || '#D4AF37');

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

  // Helper for Dashboard Page
  const drawDashboard = () => {
    const analytics = getDashboardAnalytics(tasks);
    doc.addPage();
    doc.setFillColor(...bgColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    doc.setTextColor(...headerTextColor);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ANALYTICS SUMMARY', 20, 25);
    
    // 1. KPI ROW (Top)
    let kpiX = 20, kpiY = 35;
    const kpiW = (pageWidth - 60) / 5;
    const drawKPI = (label: string, value: string | number, color: [number,number,number]) => {
      // High-Contrast Professional Card Logic
      doc.setFillColor(...accentColor);
      doc.rect(kpiX, kpiY, 3, 30, 'F');
      
      doc.setFillColor(25, 25, 30); // Solid high-density slate
      doc.roundedRect(kpiX + 3, kpiY, kpiW - 3, 30, 4, 4, 'F');
      
      doc.setTextColor(...color);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(value.toString(), kpiX + kpiW/2 + 1.5, kpiY + 16, { align: 'center' });
      
      doc.setTextColor(255, 255, 255); // SOLID WHITE FOR GUARANTEED VISIBILITY
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(label.toUpperCase(), kpiX + kpiW/2 + 1.5, kpiY + 25, { align: 'center' });
      kpiX += kpiW + 5;
    };
    
    drawKPI('Total Vectors', analytics.total, accentColor);
    drawKPI('Categories', analytics.categories.length, [66, 153, 225]);
    drawKPI('Submitters', analytics.activeSubmitters, [72, 187, 120]);
    drawKPI('Types', analytics.types.length, [237, 137, 54]);
    drawKPI('Primary CDE', analytics.cde[0]?.name || 'N/A', [159, 122, 234]);
    
    // 2. PIE / DONUT DISTRIBUTION CHARTS
    const chartColors: [number, number, number][] = [
      accentColor, 
      [66, 153, 225], [72, 187, 120], [237, 137, 54], [159, 122, 234], [245, 101, 101]
    ];

    const drawDonutChart = (title: string, data: {name: string, value: number}[], x: number, y: number, radius: number) => {
      doc.setTextColor(...accentColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(title.toUpperCase(), x + radius, y - 5, { align: 'center' });
      
      const cx = x + radius, cy = y + radius + 2;
      let startAngle = -Math.PI / 2;
      const sorted = data.slice(0, 5);
      
      // Render Pie Wedges with Surgical Precision
      sorted.forEach((d, i) => {
        const sliceAngle = (d.value / (analytics.total || 1)) * 2 * Math.PI;
        if (sliceAngle <= 0) return;
        
        doc.setFillColor(...(chartColors[i % chartColors.length]));
        const segments = 60; // ANTI-FACETING RESOLUTION
        for (let s = 0; s < segments; s++) {
          const a1 = startAngle + (s / segments) * sliceAngle;
          const a2 = startAngle + ((s + 1) / segments) * sliceAngle;
          doc.triangle(
            cx, cy,
            cx + radius * Math.cos(a1), cy + radius * Math.sin(a1),
            cx + radius * Math.cos(a2), cy + radius * Math.sin(a2),
            'F'
          );
        }
        startAngle += sliceAngle;
      });

      // Background "Rest" Slice
      const totalVal = sorted.reduce((acc, curr) => acc + curr.value, 0);
      if (totalVal < analytics.total) {
        const restAngle = ((analytics.total - totalVal) / analytics.total) * 2 * Math.PI;
        doc.setFillColor(40, 40, 45); // Solid dark slate rest wedge
        const segments = 20;
        for (let s = 0; s < segments; s++) {
          const a1 = startAngle + (s / segments) * restAngle;
          const a2 = startAngle + ((s + 1) / segments) * restAngle;
          doc.triangle(cx, cy, cx+radius*Math.cos(a1), cy+radius*Math.sin(a1), cx+radius*Math.cos(a2), cy+radius*Math.sin(a2), 'F');
        }
      }

      // Elegant Center Hole
      doc.setFillColor(...bgColor);
      doc.circle(cx, cy, radius * 0.65, 'F');
      
      // High-Visibility Legend
      let legendY = cy - (sorted.length * 3);
      sorted.forEach((d, i) => {
        doc.setFillColor(...(chartColors[i % chartColors.length]));
        doc.rect(x + radius * 2 + 8, legendY - 2.5, 3, 3, 'F');
        
        doc.setTextColor(255, 255, 255); // SOLID WHITE LABELS
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.text(`${d.name.substring(0, 20).toUpperCase()}`, x + radius * 2 + 14, legendY);
        
        doc.setTextColor(...accentColor);
        doc.setFontSize(7.5);
        doc.text(`${((d.value/analytics.total)*100).toFixed(0)}%`, x + radius * 2 + 75, legendY, { align: 'right' });
        legendY += 7.5;
      });
    };
    
    const chartR = 30; // SCALED UP FOR EXECUTIVE PRESENCE
    const chartSpacing = (pageWidth - 40) / 3;
    drawDonutChart('Category Performance', analytics.categories, 15, 85, chartR);
    drawDonutChart('Technical Distributions', analytics.types, 15 + chartSpacing, 85, chartR);
    drawDonutChart('CDE Dominance Profile', analytics.cde, 15 + chartSpacing * 2, 85, chartR);

    // 3. TIMELINE ROW (Bottom)
    const drawTimelineChart = (x: number, y: number) => {
      doc.setTextColor(...accentColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('SUBMISSION TIMELINE TRENDS', x, y);

      const timeline: Record<string, number> = {};
      [...tasks].sort((a,b) => new Date(a.submittingDate || 0).getTime() - new Date(b.submittingDate || 0).getTime())
           .forEach(t => {
              if (!t.submittingDate) return;
              const d = new Date(t.submittingDate);
              const key = `${d.toLocaleString('en-GB', { month: 'short' })} ${d.getFullYear()}`;
              timeline[key] = (timeline[key] || 0) + 1;
           });

      const timelineData = Object.entries(timeline).slice(-6);
      const max = Math.max(...timelineData.map(d => d[1]), 1);
      const chartW = pageWidth - 40;
      const chartH = 35;
      const barW = (chartW / (timelineData.length || 1)) - 15;

      timelineData.forEach((d, i) => {
        const bX = x + (i * (barW + 15));
        const h = (d[1] / max) * chartH;
        doc.setTextColor(255, 255, 255, 0.6);
        doc.setFontSize(7);
        doc.text(d[0], bX + barW / 2, y + chartH + 12, { align: 'center' });
        doc.setFillColor(25, 25, 30); 
        doc.roundedRect(bX + 1, y + chartH + 5 - h + 1, barW, h, 2, 2, 'F');
        doc.setFillColor(...accentColor);
        doc.roundedRect(bX, y + chartH + 5 - h, barW, h, 2, 2, 'F');
        doc.setTextColor(255, 255, 255); // High contrast white
        doc.setFont('helvetica', 'bold');
        doc.text(d[1].toString(), bX + barW / 2, y + chartH + 5 - h - 3, { align: 'center' });
      });
    };
    
    drawTimelineChart(20, 155);
  };

  // Helper for Section Divider
  const drawDivider = (title: string) => {
    doc.addPage();
    doc.setFillColor(...accentColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    doc.setTextColor(...bgColor);
    doc.setFontSize(42);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), pageWidth / 2, pageHeight / 2 - 10, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('KEO DIGITAL INTELLIGENCE // TRANSITIONING TO REGISTRY DATA', pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });
    
    doc.setDrawColor(...bgColor);
    doc.setLineWidth(1);
    doc.line(pageWidth / 2 - 50, pageHeight / 2 + 20, pageWidth / 2 + 50, pageHeight / 2 + 20);
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
    const body = tasks.map(t => {
      const links = getTaskLinks(t).map(l => l.label).join(' | ');
      return visibleCols.map(c => {
        if (c.id === 'id') return t.id.toUpperCase();
        if (c.id === 'title') return t.title;
        if (c.id === 'department') return t.department;
        if (c.id === 'submitterName') return t.submitterName || '-';
        if (c.id === 'submittingDate') return formatReportDate(t.submittingDate);
        if (c.id === 'deliverableType') return Array.isArray(t.deliverableType) ? t.deliverableType.join(' | ') : (t.deliverableType || '-');
        if (c.id === 'cde') return Array.isArray(t.cde) ? t.cde.join(' | ') : (t.cde || '-');
        if (c.id === 'links') return links || '-';
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
    { id: 'onAcc', excelLabel: 'On ACC', pdfLabel: 'ACC', width: 15 },
    { id: 'insiteReviewer', excelLabel: 'InSite Reviewer', pdfLabel: 'REVIEWER', width: 25 },
    { id: 'insiteReviewDueDate', excelLabel: 'Due Date', pdfLabel: 'DUE DATE', width: 20 },
    { id: 'insiteBimReviewStatus', excelLabel: 'InSite Status', pdfLabel: 'INSITE STATUS', width: 20 },
    { id: 'modonHillFinalReviewStatus', excelLabel: 'Modon/Hill Status', pdfLabel: 'MODON STATUS', width: 20 },
    { id: 'comments', excelLabel: 'Comments', pdfLabel: 'COMMENTS', width: 40 },
    { id: 'insiteReviewOutputUrl', excelLabel: 'Output Link', pdfLabel: 'LINK', width: 20 }
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
  perspective: 'table' | 'dashboard' | 'both' = 'table'
) {
  const workbook = new ExcelJS.Workbook();
  const headerColors = { bg: metadata?.reportExcelHeaderColor || '0A0A0F', text: metadata?.reportExcelHeaderTextColor || 'FFFFFF' };

  const addRegistrySheet = (name: string) => {
    const sheet = workbook.addWorksheet(name);
    const cols = getBimExportColumns([], 'excel');
    
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
        cell.value = { text: 'View Output', hyperlink: r.insiteReviewOutputUrl };
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
  perspective: 'table' | 'dashboard' | 'both' = 'table'
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
    const cols = getBimExportColumns([], 'pdf');
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
        0: { cellWidth: 20 }, // PROJECT
        1: { cellWidth: 18 }, // STAKEHOLDER
        2: { cellWidth: 10 }, // REV NO
        3: { cellWidth: 45, halign: 'left' }, // DESCRIPTION
        4: { cellWidth: 12 }, // STAGE
        5: { cellWidth: 20 }, // SUBMISSION DATE
        6: { cellWidth: 20 }, // CATEGORY
        7: { cellWidth: 10 }, // ACC
        8: { cellWidth: 18 }, // REVIEWER
        9: { cellWidth: 20 }, // DUE DATE
        10: { cellWidth: 15 }, // INSITE STATUS
        11: { cellWidth: 15 }, // MODON STATUS
        12: { cellWidth: 40, halign: 'left' }, // COMMENTS
        13: { cellWidth: 10 }  // LINK
      }
    });
  };

  drawCover();
  if (perspective === 'table' || perspective === 'both') drawTable();
  
  return { blob: new Blob([doc.output('blob')], { type: 'application/pdf' }), filename: `BIM_Report_${new Date().toISOString().split('T')[0]}.pdf` };
}


import { BIMReview } from './types';
