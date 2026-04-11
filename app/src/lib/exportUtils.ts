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
  if (!hex || typeof hex !== 'string') return [10, 10, 15];
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [10, 10, 15];
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

  summarySheet.addRow(['PROJECT EXECUTIVE SUMMARY']).font = { bold: true, size: 14, color: { argb: 'FFD4AF37' } };
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
      if (field.id === 'projectName') rowValue = metadata?.projectName || 'Digital Reporting Hub';
      if (field.id === 'reportTitle') rowValue = metadata?.reportTitle || 'Executive Summary Report';
      if (field.id === 'periodReference') rowValue = metadata?.reportSubtitle || 'Operational Overview';
      if (field.id === 'activeDate') rowValue = dateRangeText || 'All Temporal Data';
      if (field.id === 'generatedOn') rowValue = new Date().toLocaleString();
      if (field.id === 'totalTasks') rowValue = tasks.length.toString();
    }

    if (field.id === 'totalTasks') {
      summarySheet.addRow([]);
    }

    summarySheet.addRow([field.label, rowValue]);
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
    { id: 'start', label: 'Start Date (Actual)', width: 20 },
    { id: 'finish', label: 'Finish Date (Actual)', width: 20 },
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
      if (c.id === 'start') rowData.push(formatReportDate(t.actualStartDate));
      if (c.id === 'finish') rowData.push(formatReportDate(t.actualEndDate));
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
      let excelColIndex = 1;
      for (const c of visibleColumns) {
        if (c.id === 'links') break;
        excelColIndex++;
      }
      
      taskLinks.slice(0, maxLinks).forEach((link, idx) => {
        const cell = row.getCell(excelColIndex + idx);
        if (link.url) {
          cell.value = { text: link.label || 'View Deliverable', hyperlink: link.url };
          cell.font = { color: { argb: 'FF0563C1' }, underline: true };
        }
      });
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

  let logoY = 60;
  doc.setTextColor(...headerTextColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(metadata?.reportBranding || 'KEO DIGITAL INTELLIGENCE // MASTER TRANSCRIPT', 30, logoY);

  const defaultSummaryFields = [
    { id: 'projectName', label: 'Project Name', value: '', isVisible: true },
    { id: 'reportTitle', label: 'Report Title', value: '', isVisible: true },
    { id: 'periodReference', label: 'Period Reference', value: '', isVisible: true },
    { id: 'activeDate', label: 'Active Date Range', value: '', isVisible: true },
    { id: 'generatedOn', label: 'Generated On', value: '', isVisible: true },
    { id: 'totalTasks', label: 'Total Tasks Count', value: '', isVisible: true }
  ];

  const fieldsToRender = metadata?.reportSummaryFields || defaultSummaryFields;
  const reportTitleField = fieldsToRender.find(f => f.id === 'reportTitle');
  const periodRefField = fieldsToRender.find(f => f.id === 'periodReference');

  if (reportTitleField && reportTitleField.isVisible) {
    doc.setTextColor(...headerTextColor);
    doc.setFontSize(48);
    let val = reportTitleField.value || metadata?.reportTitle || 'EXECUTIVE SUMMARY';
    doc.text(val, 30, logoY + 25);
  }
  
  if (periodRefField && periodRefField.isVisible) {
    doc.setFontSize(18);
    doc.setTextColor(...bodyTextColor);
    let val = periodRefField.value || 'OPERATIONAL PERFORMANCE & DELIVERABLES';
    doc.text(val, 30, logoY + 40);
  }

  let currentY = logoY + 70;
  doc.setTextColor(...bodyTextColor);
  doc.setFontSize(14);

  fieldsToRender.forEach(field => {
    if (!field.isVisible) return;
    if (field.id === 'reportTitle' || field.id === 'periodReference') return; // Handled as prominent headers above
    
    let rowValue = field.value || '';
    if (!rowValue) {
      if (field.id === 'projectName') rowValue = metadata?.projectName || 'Digital Reporting Hub';
      if (field.id === 'activeDate') rowValue = dateRangeText || 'All Temporal Data';
      if (field.id === 'generatedOn') rowValue = new Date().toLocaleString();
      if (field.id === 'totalTasks') rowValue = tasks.length.toString();
    }
    
    doc.text(`${field.label}: ${rowValue}`, 30, currentY);
    currentY += 10;
  });

  if (metadata?.reportSummary) {
    doc.setFontSize(11);
    doc.setTextColor(180, 180, 180);
    const splitSummary = doc.splitTextToSize(metadata.reportSummary, pageWidth - 100);
    doc.text(splitSummary, 30, currentY + 20);
  }

  doc.setTextColor(...bodyTextColor);
  doc.setFontSize(10);
  doc.text(metadata?.reportFooter || 'PRIVATE & CONFIDENTIAL // INTEGRATED DATA STREAM', 30, pageHeight - 30);

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
    { id: 'start', label: 'START (ACTUAL)' },
    { id: 'finish', label: 'FINISH (ACTUAL)' },
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
    if (!excluded.includes('start')) row.push(formatReportDate(t.actualStartDate));
    if (!excluded.includes('finish')) row.push(formatReportDate(t.actualEndDate));
    if (!excluded.includes('links')) row.push(labelString || '-');
    
    return row;
  });

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
      6: { cellWidth: 80, textColor: [5, 99, 193], fontStyle: 'bold', halign: 'center' } 
    },
    didDrawCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 6) {
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
