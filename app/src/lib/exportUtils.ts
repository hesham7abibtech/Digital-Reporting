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
 * Elite Excel Export with Executive Summary and Comprehensive Task Registry
 * Migrated to exceljs to support professional styling (Blue + Underline)
 */
export async function exportToExcel(tasks: Task[], metadata: ProjectMetadata | undefined, dateRangeText?: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KEO Digital Intelligence';
  workbook.lastModifiedBy = 'KEO Admin Hub';
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. Executive Summary Sheet
  const summarySheet = workbook.addWorksheet('Executive Summary');
  summarySheet.columns = [{ width: 25 }, { width: 50 }];

  summarySheet.addRow(['PROJECT EXECUTIVE SUMMARY']).font = { bold: true, size: 12 };
  summarySheet.addRow([]);

  const defaultSummaryFields = [
    { id: 'projectName', label: 'Project Name', value: '', isVisible: true },
    { id: 'reportTitle', label: 'Report Title', value: '', isVisible: true },
    { id: 'periodReference', label: 'Period Reference', value: '', isVisible: true },
    { id: 'activeDate', label: 'Active Date Range', value: '', isVisible: true },
    { id: 'generatedOn', label: 'Generated On', value: '', isVisible: true },
    { id: 'totalTasks', label: 'Total Tasks Count', value: '', isVisible: true }
  ];

  const fieldsToRender = metadata?.reportSummaryFields || defaultSummaryFields;

  fieldsToRender.forEach(field => {
    if (!field.isVisible) return;

    let rowValue = field.value || '';
    if (!rowValue) {
      if (field.id === 'projectName') rowValue = metadata?.projectName || 'RHK - Wadi Yemm';
      if (field.id === 'reportTitle') rowValue = metadata?.reportTitle || 'Executive Summary Report';
      if (field.id === 'periodReference') rowValue = metadata?.reportSubtitle || 'Operational Performance & Deliverables';
      if (field.id === 'activeDate') rowValue = dateRangeText || 'April 2026';
      if (field.id === 'generatedOn') rowValue = formatGeneratedOn();
      if (field.id === 'totalTasks') rowValue = tasks.length.toString();
    }

    if (field.id === 'totalTasks') {
      summarySheet.addRow([]);
    }

    const row = summarySheet.addRow([field.label, rowValue]);
    row.getCell(1).font = { bold: true, size: 11 };
    row.getCell(2).font = { size: 11 };
  });

  // Apply basic styling to summary
  summarySheet.getColumn(1).font = { bold: true };

  // 2. Comprehensive Master Registry Sheet
  const dataSheet = workbook.addWorksheet('Comprehensive Registry');
  
  const maxLinks = Math.min(Math.max(...tasks.map(t => getTaskLinks(t).length), 1), 5);
  const deliverableHeaders = Array.from({ length: maxLinks }, (_, idx) => `Deliverable ${idx + 1}`);

  const excluded = metadata?.reportExcludedFields || [];

  const allColumns = [
    { id: 'uid', label: 'Task ID', width: 20 },
    { id: 'title', label: 'Asset / Task Title', width: 45 },
    { id: 'dept', label: 'Department', width: 20 },
    { id: 'status', label: 'Status', width: 20 },
    { id: 'submittingDate', label: 'Submitting Date', width: 20 },
    { id: 'links', label: 'LinksPlaceholder', width: 30 }
  ];

  const visibleColumns = allColumns.filter(c => !excluded.includes(c.id));

  const headers: string[] = [];
  const colWidths: any[] = [];

  visibleColumns.forEach(c => {
    if (c.id === 'links') {
      for (let i = 0; i < maxLinks; i++) {
        headers.push(`Deliverable ${i + 1}`);
        colWidths.push({ width: 30 });
      }
    } else {
      headers.push(c.label);
      colWidths.push({ width: c.width });
    }
  });

  // Always append notes column
  headers.push('Notes');
  colWidths.push({ width: 50 });

  const excelHeaderBg = metadata?.reportExcelHeaderColor || '0A0A0F';
  const excelHeaderText = metadata?.reportExcelHeaderTextColor || 'FFFFFF';
  const excelBodyText = metadata?.reportExcelBodyTextColor || '475569';

  const headerRow = dataSheet.addRow(headers);
  headerRow.font = { bold: true, color: { argb: 'FF' + excelHeaderText.replace('#', '') } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF' + excelHeaderBg.replace('#', '') }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  tasks.forEach((t) => {
    const taskLinks = getTaskLinks(t);
    const rowData: any[] = [];

    visibleColumns.forEach(c => {
      if (c.id === 'uid') rowData.push(t.id.toUpperCase());
      if (c.id === 'title') rowData.push(t.title);
      if (c.id === 'dept') rowData.push(t.department);
      if (c.id === 'status') rowData.push(t.status.replace(/_/g, ' '));
      if (c.id === 'submittingDate') rowData.push(formatReportDate(t.submittingDate));
      if (c.id === 'links') {
        for (let i = 0; i < maxLinks; i++) {
          rowData.push(taskLinks[i]?.label || '');
        }
      }
    });

    rowData.push(t.description || '');
    const row = dataSheet.addRow(rowData);

    // Style the deliverable links
    if (!excluded.includes('links')) {
      const linksColIndex = visibleColumns.findIndex(c => c.id === 'links');
      if (linksColIndex !== -1) {
        // exceljs is 1-indexed for cells
        taskLinks.slice(0, maxLinks).forEach((link, idx) => {
          const cell = row.getCell(linksColIndex + 1 + idx);
          if (link.url) {
            cell.value = { text: link.label || 'View Deliverable', hyperlink: link.url };
            cell.font = { color: { argb: 'FF0563C1' }, underline: true };
          }
        });
      }
    }

    // General row alignment
    row.alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Find title column index for left alignment
    const titleIdx = visibleColumns.findIndex(c => c.id === 'title');
    if (titleIdx !== -1) {
      row.getCell(titleIdx + 1).alignment = { vertical: 'middle', horizontal: 'left' };
    }
  });

  // Column width optimizations
  dataSheet.columns = colWidths;

  // Auto-filter
  dataSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length }
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `${metadata?.projectName || 'Project'}_Master_Registry_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  return { blob, filename };
}

/**
 * Elite PDF Export with Comprehensive Data Coverage
 */
export async function exportToPDF(tasks: Task[], metadata: ProjectMetadata | undefined, dateRangeText?: string) {
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ─── PAGE 1: SIGNATURE COVER ───
  const bgColor = hexToRgb(metadata?.reportBgColor || '#0a0a0f');
  const accentColor = hexToRgb(metadata?.reportAccentColor || '#D4AF37');
  const headerTextColor = hexToRgb(metadata?.reportHeaderTextColor || '#D4AF37');
  const bodyTextColor = hexToRgb(metadata?.reportPdfBodyTextColor || '#b0b0b0');

  doc.setFillColor(...bgColor);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  doc.setFillColor(...accentColor);
  doc.rect(0, 0, 5, pageHeight, 'F');

  // Insert Brand Logos (Symmetrical Placement - Aspect Ratio Preserved)
  const modonBase64 = await loadLogoBase64('/logos/modon_logo.png');
  const insiteBase64 = await loadLogoBase64('/logos/insite_logo.png');
  
  if (insiteBase64) {
    const props = doc.getImageProperties(insiteBase64);
    const h = 20; // Targeted Height
    const w = (props.width * h) / props.height;
    doc.addImage(insiteBase64, 'PNG', 20, 15, w, h);
  }
  
  if (modonBase64) {
    const props = doc.getImageProperties(modonBase64);
    const h = 11; // Targeted Height (Reduced for balance)
    const w = (props.width * h) / props.height;
    doc.addImage(modonBase64, 'PNG', pageWidth - 20 - w, 16, w, h);
  }

  let logoY = 42; // Professional Padding Alignment to avoid logo overlap
  doc.setTextColor(...headerTextColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(metadata?.reportBranding || 'KEO DIGITAL INTELLIGENCE // MASTER TRANSCRIPT', 20, logoY);

  const defaultSummaryFields = [
    { id: 'projectName', label: 'Project Name', value: '', isVisible: true },
    { id: 'reportTitle', label: 'Report Title', value: '', isVisible: true },
    { id: 'periodReference', label: 'Period Reference', value: '', isVisible: true },
    { id: 'temporalReference', label: 'Temporal Period', value: '', isVisible: true },
    { id: 'activeDate', label: 'Active Date Range', value: '', isVisible: true },
    { id: 'generatedOn', label: 'Generated On', value: '', isVisible: true },
    { id: 'totalTasks', label: 'Total Tasks Count', value: '', isVisible: true }
  ];

  const fieldsToRender = metadata?.reportSummaryFields || defaultSummaryFields;
  const reportTitleField = fieldsToRender.find(f => f.id === 'reportTitle');
  const periodRefField = fieldsToRender.find(f => f.id === 'periodReference');

  if (reportTitleField && reportTitleField.isVisible) {
    doc.setTextColor(...headerTextColor);
    doc.setFontSize(48); // High Density Elevation
    let val = reportTitleField.value || metadata?.reportTitle || 'EXECUTIVE SUMMARY';
    doc.text(val, 20, logoY + 20);
  }
  
  if (periodRefField && periodRefField.isVisible) {
    doc.setFontSize(18); // Scaled
    doc.setTextColor(255, 255, 255); // Explicit White for contrast
    let val = periodRefField.value || 'OPERATIONAL PERFORMANCE & DELIVERABLES';
    doc.text(val, 20, logoY + 32);
  }

  let currentY = logoY + 60;
  doc.setFontSize(15); // Increased for full-page fill

  fieldsToRender.forEach(field => {
    if (!field.isVisible) return;
    if (field.id === 'reportTitle' || field.id === 'periodReference') return; 
    
    let rowValue = field.value || '';
    if (!rowValue) {
      if (field.id === 'projectName') rowValue = metadata?.projectName || 'RHK - Wadi Yemm';
      if (field.id === 'temporalReference') rowValue = metadata?.reportTemporalReference || 'MAY 2026 HUB RECAP';
      if (field.id === 'activeDate') rowValue = dateRangeText || 'MAY 01 - MAY 31, 2026';
      if (field.id === 'generatedOn') rowValue = formatGeneratedOn();
      if (field.id === 'totalTasks') rowValue = tasks.length.toString();
    }
    
    // Elite Dual-Tone Typography
    doc.setTextColor(...accentColor); // GOLD Label
    doc.setFont('helvetica', 'bold');
    doc.text(`${field.label}:`, 20, currentY);
    
    const labelWidth = doc.getTextWidth(`${field.label}: `);
    doc.setTextColor(255, 255, 255); // WHITE Value
    doc.setFont('helvetica', 'normal');
    doc.text(rowValue, 20 + labelWidth, currentY);
    
    currentY += 16; // Increased Vertical Leading for full height utilization
  });

  if (metadata?.reportSummary) {
    doc.setFontSize(10);
    doc.setTextColor(160, 160, 160);
    const splitSummary = doc.splitTextToSize(metadata.reportSummary, pageWidth - 100);
    doc.text(splitSummary, 20, currentY + 15);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12); // Slightly larger footer
  doc.setFont('helvetica', 'bold');
  doc.text(metadata?.reportFooter || 'PRIVATE & CONFIDENTIAL // INTEGRATED DATA STREAM', 20, pageHeight - 15);

  // ─── PAGE 2+: COMPREHENSIVE DATA TABLE ───
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.setFontSize(12);
  doc.text(metadata?.reportBranding || 'KEO DIGITAL INTELLIGENCE // MASTER TRANSCRIPT', 14, 20);

  const excluded = metadata?.reportExcludedFields || [];
  
  const allHeaders = [
    { id: 'uid', label: 'UID' },
    { id: 'title', label: 'ASSET TITLE' },
    { id: 'dept', label: 'DEPT' },
    { id: 'status', label: 'STATUS' },
    { id: 'submittingDate', label: 'SUBMITTING DATE' },
    { id: 'links', label: 'DELIVERABLES LINKS' }
  ];

  const visibleHeaders = allHeaders.filter(h => !excluded.includes(h.id));
  const headLabels = visibleHeaders.map(h => h.label);

  const tableData = tasks.map(t => {
    const taskLinks = getTaskLinks(t);
    const labelString = taskLinks.map(l => l.label).join(' | ');
    
    const row = [];
    if (!excluded.includes('uid')) row.push(t.id.toUpperCase());
    if (!excluded.includes('title')) row.push(t.title);
    if (!excluded.includes('dept')) row.push(t.department);
    if (!excluded.includes('status')) row.push(t.status.replace(/_/g, ' '));
    if (!excluded.includes('submittingDate')) row.push(formatReportDate(t.submittingDate));
    if (!excluded.includes('links')) row.push(labelString || '-');
    
    return row;
  });

  const linksColIndex = visibleHeaders.findIndex(h => h.id === 'links');

  autoTable(doc, {
    startY: 30,
    head: [headLabels],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: bgColor, 
      textColor: headerTextColor,
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle'
    },
    styles: { 
      fontSize: 9, 
      cellPadding: 5, 
      overflow: 'linebreak',
      halign: 'center',
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 35, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'center' },
      ...(linksColIndex !== -1 ? { [linksColIndex]: { cellWidth: 80, textColor: [5, 99, 193], fontStyle: 'bold', halign: 'center' } } : {})
    },
    didDrawCell: (data: any) => {
      if (data.section === 'body' && data.column.index === linksColIndex && linksColIndex !== -1) {
        const task = tasks[data.row.index];
        const taskLinks = getTaskLinks(task);
        if (taskLinks.length > 0) {
          const delimiter = ' | ';
          const delimiterWidth = doc.getTextWidth(delimiter);
          
          // Calculate total width for center alignment calibration
          const totalWidth = taskLinks.reduce((acc, link, i) => {
            return acc + doc.getTextWidth(link.label) + (i < taskLinks.length - 1 ? delimiterWidth : 0);
          }, 0);

          // Center the hit-area start point
          let currentX = data.cell.x + (data.cell.width - totalWidth) / 2;
          
          taskLinks.forEach((link, idx) => {
            const labelWidth = doc.getTextWidth(link.label);
            // Draw a subtle underline manually to ensure it's visible in PDF
            doc.setDrawColor(5, 99, 193);
            doc.line(currentX, data.cell.y + data.cell.height / 2 + 2, currentX + labelWidth, data.cell.y + data.cell.height / 2 + 2);
            
            doc.link(currentX, data.cell.y, labelWidth, data.cell.height, { 
              url: link.url,
              target: '_blank' 
            } as any); 
            currentX += labelWidth + delimiterWidth;
          });
        }
      }
    }
  });

  // ─── GENERATION & DEEP PATCHING ───
  // Note: jsPDF hardcodes URI actions without /NewWindow support. 
  // We perform a "Deep Patch" on the raw PDF string to inject this directive.
  const rawOutput = doc.output();
  // Robust, space-insensitive regex to catch various jsPDF formatting styles
  const patchedOutput = rawOutput.replace(
    /\/S\s*\/URI\s*\/URI\s*\((.*?)\)\s*>>/g, 
    '/S /URI /URI ($1) /NewWindow true /Target (new) >>'
  );

  // Convert binary string to ArrayBuffer for safe Blob creation
  const finalBuffer = new Uint8Array(patchedOutput.length);
  for (let i = 0; i < patchedOutput.length; i++) {
    finalBuffer[i] = patchedOutput.charCodeAt(i) & 0xFF;
  }

  const blob = new Blob([finalBuffer], { type: 'application/pdf' });
  const filename = `${metadata?.projectName || 'Project'}_Comprehensive_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  
  return { blob, filename };
}
