import * as ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Task, ProjectMetadata, BIMReview } from './types';
import { PRECINCTS, TASK_DELIVERABLE_TYPES, TASK_CDE_OPTIONS } from './constants';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { formatDate } from './utils';

// ─── Constants ──────────────────────────────────────────────────────────
const MAX_COL_WIDTH = 60;
const MIN_COL_WIDTH = 12;
const ZEBRA_EVEN_FILL = 'FFF8FAFC'; // Very light gray for even rows
const ZEBRA_ODD_FILL = 'FFFFFFFF';  // White for odd rows
const PDF_ZEBRA_EVEN: [number, number, number] = [248, 250, 252];
const PDF_ZEBRA_ODD: [number, number, number] = [255, 255, 255];
const LINK_COLOR_ARGB = 'FF0563C1';
const HEADER_SLATE: [number, number, number] = [30, 41, 59];

// ─── Column Alignment Classification ───────────────────────────────────
type AlignType = 'left' | 'center' | 'right';

const COLUMN_ALIGN_MAP: Record<string, AlignType> = {
  // Text → Left
  title: 'left',
  department: 'left',
  submitterName: 'left',
  submissionDescription: 'left',
  comments: 'left',
  // Dates → Center
  submittingDate: 'center',
  submissionDate: 'center',
  insiteReviewDueDate: 'center',
  createdAt: 'center',
  // Numbers / KPIs → Right
  reviewNumber: 'right',
  completion: 'right',
  // IDs / Codes → Center
  id: 'center',
  cde: 'center',
  onAcc: 'center',
  designStage: 'center',
  insiteBimReviewStatus: 'center',
  modonHillFinalReviewStatus: 'center',
  precinct: 'center',
  deliverableType: 'center',
  links: 'center',
  project: 'left',
  stakeholder: 'left',
  submissionCategory: 'center',
  insiteReviewer: 'left',
  insiteReviewOutputUrl: 'center',
};

function getColumnAlign(colId: string): AlignType {
  return COLUMN_ALIGN_MAP[colId] || 'center';
}

// ─── Helpers ────────────────────────────────────────────────────────────

function ensureAbsoluteUrl(url: string): string {
  if (!url) return '';
  const u = url.trim();
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  if (u.match(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i)) {
    return `https://${u}`;
  }
  return u;
}

function formatReportDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatGeneratedOn(): string {
  return new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
  });
}

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

function getExportLinks(t: Task, filters?: { types: string[], cdes: string[] }) {
  const fData = getFilteredTaskData(t, filters);
  const combinedLinks = fData.vectors.length > 0
    ? fData.vectors.map(v => ({ label: `${v.type} (${v.cde})`, url: ensureAbsoluteUrl(v.url) }))
    : fData.links.map(l => ({ label: l.label || 'Deliverable Link', url: ensureAbsoluteUrl(l.url) }));
  
  // Also include fileShareLink if present and not already covered by vectors
  if (t.fileShareLink && fData.vectors.length === 0) {
    const url = ensureAbsoluteUrl(t.fileShareLink);
    if (url) combinedLinks.unshift({ label: 'Primary Share Link', url });
  }

  return combinedLinks.filter(l => l.url);
}

function hexToRgb(hex: string): [number, number, number] {
  if (!hex || typeof hex !== 'string') return [180, 180, 180];
  if (hex.startsWith('rgba')) {
    const match = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [180, 180, 180];
}

// ─── Chart Capture ──────────────────────────────────────────────────────

export interface CapturedChart {
  imageData: string; // base64 data URL
  width: number;
  height: number;
  title?: string;
}

interface ChartCaptureOptions {
  mode?: 'cards' | 'full-dashboard';
  title?: string;
}

interface PdfChartTheme {
  panelBg: [number, number, number];
  panelBorder: [number, number, number];
  titleColor: [number, number, number];
}

function buildPdfChartTheme(metadata?: ProjectMetadata): PdfChartTheme {
  const accent = hexToRgb(metadata?.reportAccentColor || '#D4AF37');
  const titleColor = hexToRgb(metadata?.reportHeaderTextColor || '#1E293B');
  return {
    panelBg: [250, 252, 255],
    panelBorder: [Math.max(30, accent[0] - 20), Math.max(30, accent[1] - 20), Math.max(30, accent[2] - 20)],
    titleColor
  };
}

function drawPdfChartGallery(
  doc: jsPDF,
  chartImages: CapturedChart[],
  metadata: ProjectMetadata | undefined,
  title: string,
  subtitle: string
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const theme = buildPdfChartTheme(metadata);

  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  doc.setTextColor(...theme.titleColor);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 15, 20);
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 15, 27);

  let y = 34;
  const panelX = 12;
  const panelW = pageWidth - 24;

  for (const chart of chartImages) {
    const baseW = Math.max(1, chart.width / 2);
    const baseH = Math.max(1, chart.height / 2);
    const contentW = panelW - 8;
    const scale = Math.min(contentW / baseW, 170 / baseH);
    const drawW = baseW * scale;
    const drawH = baseH * scale;
    const panelH = drawH + 14 + (chart.title ? 7 : 0);

    if (y + panelH > pageHeight - 14) {
      doc.addPage();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      y = 14;
    }

    doc.setDrawColor(...theme.panelBorder);
    doc.setFillColor(...theme.panelBg);
    doc.roundedRect(panelX, y, panelW, panelH, 3, 3, 'FD');

    if (chart.title) {
      doc.setTextColor(...theme.titleColor);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(chart.title.toUpperCase(), panelX + 6, y + 6);
    }

    const imgX = panelX + (panelW - drawW) / 2;
    const imgY = y + (chart.title ? 9 : 5);
    doc.addImage(chart.imageData, 'PNG', imgX, imgY, drawW, drawH);
    y += panelH + 6;
  }
}

/**
 * Captures chart DOM elements as high-resolution PNG images.
 * Uses html2canvas to render the actual DOM as displayed in the browser.
 */
export async function captureChartImages(containerSelector: string, options: ChartCaptureOptions = {}): Promise<CapturedChart[]> {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.warn(`Chart container not found: ${containerSelector}`);
      return [];
    }

    if (options.mode === 'full-dashboard') {
      const canvas = await html2canvas(container as HTMLElement, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      return [{
        imageData: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
        title: options.title || 'Dashboard View'
      }];
    }

    // Find all chart card elements within the container
    const chartCards = container.querySelectorAll('.recharts-responsive-container');
    if (chartCards.length === 0) {
      // Fallback: capture the entire container as one image
      const canvas = await html2canvas(container as HTMLElement, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      return [{
        imageData: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
        title: 'Dashboard Analytics'
      }];
    }

    const images: CapturedChart[] = [];
    
    // Capture each chart's parent GlassCard
    const glassCards = container.querySelectorAll('.glass-card');
    for (let i = 0; i < glassCards.length; i++) {
      const card = glassCards[i] as HTMLElement;
      // Skip non-chart cards (e.g. insights panel without recharts)
      if (!card.querySelector('.recharts-responsive-container')) continue;
      
      try {
        const canvas = await html2canvas(card, {
          scale: 3,
          useCORS: true,
          backgroundColor: null,
          logging: false,
        });
        const titleEl = card.querySelector('h3') || card.querySelector('h2');
        images.push({
          imageData: canvas.toDataURL('image/png'),
          width: canvas.width,
          height: canvas.height,
          title: titleEl?.textContent || `Chart ${i + 1}`
        });
      } catch (err) {
        console.warn(`Failed to capture chart ${i}:`, err);
      }
    }

    return images;
  } catch (err) {
    console.error('Chart capture failed:', err);
    return [];
  }
}

// ─── Dynamic Column Configuration (Strict Binding) ─────────────────────

/**
 * Gets the exact column configuration by reading the user's
 * saved table layout from localStorage (useTableColumns hook).
 * This ensures 100% compliance with visible columns and their order.
 */
export function getDynamicExportColumns(metadataExcluded: string[], format: 'excel' | 'pdf' = 'excel') {
  const baseColumns = [
    { id: 'id', excelLabel: 'ID', pdfLabel: 'UID', width: 25 },
    { id: 'title', excelLabel: 'Task Definition / Asset', pdfLabel: 'ASSET TITLE', width: 50 },
    { id: 'department', excelLabel: 'Task Category', pdfLabel: 'TASK CATEGORY', width: 20 },
    { id: 'precinct', excelLabel: 'Project Precinct', pdfLabel: 'PRECINCT', width: 25 },
    { id: 'submitterName', excelLabel: 'Submitter', pdfLabel: 'SUBMITTER', width: 25 },
    { id: 'submittingDate', excelLabel: 'Submission Date', pdfLabel: 'SUBMISSION DATE', width: 20 },
    { id: 'deliverableType', excelLabel: 'Deliverable Type', pdfLabel: 'DELIVERABLE TYPE', width: 25 },
    { id: 'cde', excelLabel: 'CDE', pdfLabel: 'CDE', width: 20 },
    { id: 'links', excelLabel: 'Deliverable Link', pdfLabel: 'DELIVERABLE LINK', width: 35 }
  ];

  // Read the user's saved column settings from localStorage
  let savedSettings: Record<string, { visible: boolean; order: number }> = {};
  if (typeof window !== 'undefined') {
    const savedJSON = localStorage.getItem('table-cols-active-tasks');
    if (savedJSON) {
      try { savedSettings = JSON.parse(savedJSON); } catch(e) {}
    }
  }

  // Map metadata exclusions to column IDs
  const exclusionsBridge: Record<string, string> = { 'uid': 'id', 'dept': 'department' };
  const normalizedExclusions = metadataExcluded.map(e => exclusionsBridge[e] || e);

  const processedColumns = baseColumns.map((col, idx) => {
    let s = savedSettings[col.id];

    // Submitter fallback position
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

// ─── Dashboard Analytics ────────────────────────────────────────────────

function getDashboardAnalytics(tasks: Task[]) {
  const categories: Record<string, number> = {};
  const types: Record<string, number> = {};
  const cde: Record<string, number> = {};
  const submitters: Record<string, number> = {};

  tasks.forEach(t => {
    categories[t.department] = (categories[t.department] || 0) + 1;
    if (Array.isArray(t.deliverableType)) {
      t.deliverableType.forEach(type => { types[type] = (types[type] || 0) + 1; });
    }
    if (Array.isArray(t.cde)) {
      t.cde.forEach(env => { cde[env] = (cde[env] || 0) + 1; });
    }
    if (t.submitterName) {
      submitters[t.submitterName] = (submitters[t.submitterName] || 0) + 1;
    }
  });

  return {
    total: tasks.length,
    categories: Object.entries(categories).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    types: Object.entries(types).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    cde: Object.entries(cde).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    submitters: Object.entries(submitters).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    activeSubmitters: Object.keys(submitters).length
  };
}

// ─── Filtered Task Data Helper ──────────────────────────────────────────

function getFilteredTaskData(t: Task, filters?: { types: string[], cdes: string[] }) {
  const activeTypes = (filters?.types || []).filter(v => v !== 'All Types');
  const activeCDEs = (filters?.cdes || []).filter(v => v !== 'All Environments');

  const legacyTypes = (Array.isArray(t.deliverableType) ? t.deliverableType : [t.deliverableType]).filter((v): v is string => !!v);
  const legacyCdes = (Array.isArray(t.cde) ? t.cde : [t.cde]).filter((v): v is string => !!v);
  const vectorTypes = (t.vectors || []).map(v => v.type);
  const vectorCdes = (t.vectors || []).map(v => v.cde);

  const allTypesRaw = Array.from(new Set([...legacyTypes, ...vectorTypes]));
  const allCdesRaw = Array.from(new Set([...legacyCdes, ...vectorCdes]));

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

  return { vectors: filteredVectors, types: filteredTypes, cdes: filteredCdes, links: filteredLinks };
}

// ═══════════════════════════════════════════════════════════════════════
// EXCEL EXPORT — Deliverables Registry
// ═══════════════════════════════════════════════════════════════════════

export async function exportToExcel(
  tasks: Task[],
  metadata: ProjectMetadata | undefined,
  dateRangeText: string | undefined,
  perspective: 'table' | 'dashboard' | 'both' = 'table',
  filters?: { types: string[], cdes: string[] },
  chartImages?: CapturedChart[]
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KEO Digital Intelligence';
  workbook.lastModifiedBy = 'KEO Admin Hub';
  workbook.created = new Date();

  const headerColors = {
    bg: metadata?.reportExcelHeaderColor || '0A0A0F',
    text: metadata?.reportExcelHeaderTextColor || 'FFFFFF'
  };

  // Fetch departments for resolution
  let departmentsMap: Record<string, string> = {};
  try {
    const deptsSnap = await getDocs(collection(db, 'departments'));
    deptsSnap.forEach(doc => {
      departmentsMap[doc.id] = doc.data().name;
    });
  } catch (err) {
    console.warn('Could not fetch departments for export resolution:', err);
  }

  // ── Helper: Add Master Registry sheet ──
  const addRegistrySheet = (name: string) => {
    const dataSheet = workbook.addWorksheet(name);
    const excluded = metadata?.reportExcludedFields || [];
    const visibleColumns = getDynamicExportColumns(excluded, 'excel');

    // Handle empty state
    if (tasks.length === 0) {
      const emptyRow = dataSheet.addRow(['No Data Based on Selected Filters']);
      emptyRow.font = { bold: true, size: 14, color: { argb: 'FF64748B' } };
      emptyRow.alignment = { horizontal: 'center', vertical: 'middle' };
      dataSheet.mergeCells(1, 1, 1, Math.max(visibleColumns.length, 3));
      dataSheet.getRow(1).height = 50;
      return dataSheet;
    }

    // Compute max deliverables per task after filtering
    const filteredTasksData = tasks.map(t => getFilteredTaskData(t, filters));
    const maxDeliverables = Math.max(...tasks.map(t => getExportLinks(t, filters).length), 1);

    // Build headers
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

    // Header row
    const hRow = dataSheet.addRow(headers);
    hRow.font = { bold: true, color: { argb: 'FF' + headerColors.text.replace('#', '') }, size: 10 };
    hRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + headerColors.bg.replace('#', '') } };
    hRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    hRow.height = 30;

    // Data rows
    tasks.forEach((t, tIdx) => {
      const fData = filteredTasksData[tIdx];
      const rowData: any[] = [];
      const resolvedDept = departmentsMap[t.department] || t.department;
      visibleColumns.forEach(c => {
        if (c.id === 'id') rowData.push(t.id.toUpperCase());
        else if (c.id === 'title') rowData.push(t.title);
        else if (c.id === 'department') rowData.push(resolvedDept);
        else if (c.id === 'precinct') rowData.push(t.precinct || '-');
        else if (c.id === 'submitterName') rowData.push(t.submitterName || '-');
        else if (c.id === 'submittingDate') rowData.push(formatReportDate(t.submittingDate));
        else if (c.id === 'deliverableType') rowData.push(fData.types.join(' | '));
        else if (c.id === 'cde') rowData.push(fData.cdes.join(' | '));
        else if (c.id === 'links') {
          const combinedLinks = getExportLinks(t, filters);
          for (let i = 0; i < Math.min(maxDeliverables, 5); i++) rowData.push(combinedLinks[i]?.label || '');
        }
      });

      const row = dataSheet.addRow(rowData);
      row.height = 22;

      // Per-column alignment & text wrapping
      let cellIdx = 1;
      visibleColumns.forEach(c => {
        if (c.id === 'links') {
          for (let i = 0; i < Math.min(maxDeliverables, 5); i++) {
            const cell = row.getCell(cellIdx);
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cellIdx++;
          }
        } else {
          const cell = row.getCell(cellIdx);
          cell.alignment = { horizontal: getColumnAlign(c.id), vertical: 'middle', wrapText: true };
          cellIdx++;
        }
      });

      // Zebra-stripe fill
      const isEvenRow = tIdx % 2 === 0;
      const fillColor = isEvenRow ? ZEBRA_EVEN_FILL : ZEBRA_ODD_FILL;
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFF1F5F9' } },
          right: { style: 'thin', color: { argb: 'FFF1F5F9' } },
        };
      });

      // Hyperlinks for deliverable columns
      if (!excluded.includes('links')) {
        const lIdx = visibleColumns.findIndex(vv => vv.id === 'links');
        if (lIdx !== -1) {
          const combinedLinks = getExportLinks(t, filters);
          // Calculate the actual cell column index
          let linkCellStart = 1;
          for (let ci = 0; ci < lIdx; ci++) linkCellStart++;
          
          combinedLinks.slice(0, 5).forEach((link, idx) => {
            const cell = row.getCell(linkCellStart + idx);
            if (link.url) {
              cell.value = { text: link.label || 'View File', hyperlink: ensureAbsoluteUrl(link.url) };
              cell.font = { color: { argb: LINK_COLOR_ARGB }, underline: true, size: 10 };
            }
          });
        }
      }
    });

    // ── Auto-size columns with min/max constraints ──
    dataSheet.columns.forEach((column) => {
      let maxLen = 0;
      if (column && column.eachCell) {
        column.eachCell({ includeEmpty: true }, (cell) => {
          const L = cell.value ? cell.value.toString().length : 10;
          if (L > maxLen) maxLen = L;
        });
      }
      if (column) {
        const computed = maxLen + 4;
        column.width = Math.max(MIN_COL_WIDTH, Math.min(computed, MAX_COL_WIDTH));
      }
    });

    // ── Freeze header row ──
    dataSheet.views = [{ state: 'frozen', ySplit: 1, xSplit: 0, topLeftCell: 'A2', activeCell: 'A2' }];

    // ── Auto-filter on all columns ──
    dataSheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };

    // ── Apply Data Validations ──
    const validationSheet = workbook.addWorksheet('LookupData', { state: 'hidden' });
    
    // Precincts
    PRECINCTS.forEach((p, i) => validationSheet.getCell(i + 1, 1).value = p);
    const precinctRange = `LookupData!$A$1:$A$${PRECINCTS.length}`;
    


    // Deliverable Types
    TASK_DELIVERABLE_TYPES.forEach((t, i) => validationSheet.getCell(i + 1, 3).value = t);
    const typeRange = `LookupData!$C$1:$C$${TASK_DELIVERABLE_TYPES.length}`;

    visibleColumns.forEach((col, idx) => {
      const colLetter = String.fromCharCode(65 + idx);
      const validationRange = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        errorTitle: 'Invalid Data Selection',
        error: 'Please select a value from the authorized dropdown list.'
      } as any;

      if (col.id === 'precinct') {
        validationRange.formulae = [precinctRange];

      } else if (col.id === 'deliverableType') {
        validationRange.formulae = [typeRange];
      } else {
        return;
      }

      // Apply to first 1000 rows
      for (let i = 2; i <= 1000; i++) {
        dataSheet.getCell(`${colLetter}${i}`).dataValidation = validationRange;
      }
    });

    return dataSheet;
  };

  // ── Dashboard / Analytics perspective ──
  if (perspective === 'dashboard' || perspective === 'both') {
    const analytics = getDashboardAnalytics(tasks);

    // 1. Dashboard Overview Sheet
    const summarySheet = workbook.addWorksheet('Dashboard Overview');
    summarySheet.columns = [{ width: 35 }, { width: 45 }];

    // Branded Header
    const titleRow = summarySheet.addRow(['ANALYTICS EXECUTIVE SUMMARY']);
    titleRow.font = { bold: true, size: 14, color: { argb: 'FFD4AF37' } };
    summarySheet.addRow([]);

    // KPI Section
    summarySheet.addRow(['CORE PERFORMANCE METRICS']).font = { bold: true, size: 12, color: { argb: 'FF1E293B' } };
    summarySheet.addRow([]);

    const kpiData = [
      ['Total Deliverables', analytics.total],
      ['Active Technical Categories', analytics.categories.length],
      ['Unique Project Submitters', analytics.activeSubmitters],
      ['Primary CDE Environment', analytics.cde[0]?.name || 'N/A'],
      ['Report Period', dateRangeText || 'All Time'],
      ['Generated On', formatGeneratedOn()],
    ];

    kpiData.forEach(([label, val], idx) => {
      const row = summarySheet.addRow([label, val]);
      row.getCell(1).font = { bold: true, size: 11, color: { argb: 'FF1E293B' } };
      row.getCell(2).font = { size: 11, color: { argb: 'FF334155' } };
      row.getCell(2).alignment = { horizontal: 'right' };
      const fill = idx % 2 === 0 ? ZEBRA_EVEN_FILL : ZEBRA_ODD_FILL;
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
      });
    });

    summarySheet.addRow([]);


    summarySheet.addRow(['VISUALIZATION DATA MAPPING']).font = { bold: true };

    // 2. Analytics Data Matrix (Hidden)
    const dataSheet = workbook.addWorksheet('Analytics Data Matrix');
    dataSheet.state = 'hidden';
    dataSheet.columns = [{ width: 25 }, { width: 20 }, { width: 15 }, { width: 25 }, { width: 15 }];

    const headerRow = dataSheet.addRow(['Metric Group', 'Dimension', 'Count', 'Percentage of Total', 'Growth Index']);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A0A0F' } };
    headerRow.alignment = { horizontal: 'center' };

    const addGroup = (label: string, items: {name: string, value: number}[]) => {
      items.forEach(item => {
        const row = dataSheet.addRow([
          label, item.name, item.value,
          `${((item.value / analytics.total) * 100).toFixed(1)}%`,
          'STABLE'
        ]);
        row.alignment = { horizontal: 'center' };
      });
      dataSheet.addRow([]);
    };

    addGroup('Functional Categories', analytics.categories);
    addGroup('Deliverable Types', analytics.types);
    addGroup('CDE Usage', analytics.cde);
    addGroup('Team Contributions', analytics.submitters);

    // 3. Chart Images (if provided)
    if (chartImages && chartImages.length > 0) {
      const chartSheet = workbook.addWorksheet('Dashboard Charts');
      let currentRow = 1;
      chartSheet.columns = [{ width: 8 }, { width: 90 }, { width: 8 }];
      chartSheet.views = [{ zoomScale: 140, showGridLines: false }];

      const heading = chartSheet.addRow(['', 'DASHBOARD VISUAL ANALYTICS', '']);
      heading.font = { bold: true, size: 15, color: { argb: 'FF1E293B' } };
      chartSheet.mergeCells(1, 2, 1, 3);
      currentRow = 3;

      for (const chart of chartImages) {
        try {
          const imageId = workbook.addImage({
            base64: chart.imageData.split(',')[1],
            extension: 'png',
          });
          
          // Scale to fit within reasonable bounds (max 700px width in Excel)
          // Keep dashboard captures highly readable in Excel even at 100% zoom.
          const maxWidth = 1800;
          const scale = Math.min(1, maxWidth / (chart.width / 2)); // divided by 2 because scale:2
          const displayWidth = (chart.width / 2) * scale;
          const displayHeight = (chart.height / 2) * scale;

          if (chart.title) {
            chartSheet.getRow(currentRow).getCell(2).value = chart.title.toUpperCase();
            chartSheet.getRow(currentRow).getCell(2).font = { bold: true, size: 11, color: { argb: 'FF334155' } };
            currentRow++;
          }

          for (let r = currentRow; r <= currentRow + Math.ceil(displayHeight / 20); r++) {
            for (let c = 2; c <= 3; c++) {
              const cell = chartSheet.getRow(r).getCell(c);
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
              cell.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
            }
          }

          chartSheet.addImage(imageId, {
            tl: { col: 1.1, row: currentRow - 0.8 },
            ext: { width: displayWidth, height: displayHeight }
          });

          currentRow += Math.ceil(displayHeight / 20) + 2;
        } catch (err) {
          console.warn('Failed to embed chart image:', err);
        }
      }
    }

    // 4. Raw Filtered Data
    addRegistrySheet('Filtered Registry Source');
  }

  // ── Table perspective ──
  if (perspective === 'table' || perspective === 'both') {
    // Executive Summary Sheet
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

    // Comprehensive Master Registry
    addRegistrySheet('Comprehensive Registry');
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `${metadata?.projectName || 'Project'}_${perspective === 'dashboard' ? 'Analytics_Insights' : 'Master_Registry'}_${new Date().toISOString().split('T')[0]}.xlsx`;

  return { blob, filename };
}

// ═══════════════════════════════════════════════════════════════════════
// PDF EXPORT — Deliverables Registry
// ═══════════════════════════════════════════════════════════════════════

export async function exportToPDF(
  tasks: Task[],
  metadata: ProjectMetadata | undefined,
  dateRangeText: string | undefined,
  perspective: 'table' | 'dashboard' | 'both' = 'table',
  filters?: { types: string[], cdes: string[] },
  chartImages?: CapturedChart[]
) {
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const bgColor = hexToRgb(metadata?.reportBgColor || '#0a0a0f');
  const accentColor = hexToRgb(metadata?.reportAccentColor || '#D4AF37');
  const headerTextColor = hexToRgb(metadata?.reportHeaderTextColor || '#D4AF37');

  // Fetch departments for resolution
  let departmentsMap: Record<string, string> = {};
  try {
    const deptsSnap = await getDocs(collection(db, 'departments'));
    deptsSnap.forEach(doc => {
      departmentsMap[doc.id] = doc.data().name;
    });
  } catch (err) {
    console.warn('Could not fetch departments for export resolution:', err);
  }

  // ── Cover Page ──
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
    doc.setTextColor(30, 41, 59); // Dark slate for 100% contrast
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
      doc.setTextColor(30, 41, 59); // Dark slate for 100% contrast
      doc.setFont('helvetica', 'normal');
      doc.text(val, 20 + labelW, currentY);
      currentY += 15;
    });

    doc.setTextColor(30, 41, 59); // Dark slate for 100% contrast
    doc.setFontSize(10);
    doc.text(metadata?.reportFooter || 'PRIVATE & CONFIDENTIAL // INTEGRATED DATA STREAM', 20, pageHeight - 15);
  };

  // ── Section Divider ──
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

  // ── Dashboard Page ──
  const drawDashboard = () => {
    // Capture-first: if live dashboard images are available, use them as the primary export output.
    if (chartImages && chartImages.length > 0) {
      drawPdfChartGallery(
        doc,
        chartImages,
        metadata,
        'ANALYTICS VISUAL REPORT',
        `Captured from live ${tasks.length}-record dashboard view`
      );
      return;
    }

    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE PERFORMANCE DASHBOARD', 15, 25);

    // Filter summary
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const filterText = `Refined by: ${filters?.types?.join(', ') || 'All Types'} // ${filters?.cdes?.join(', ') || 'All Environments'}`;
    doc.text(filterText, 15, 33);

    // KPI Grid
    const analytics = getDashboardAnalytics(tasks);
    const kpiY = 42;
    const kpiW = (pageWidth - 45) / 4;
    const kpiH = 32;

    const stats = [
      { label: 'TOTAL DELIVERABLES', value: analytics.total.toString() },
      { label: 'ACTIVE CATEGORIES', value: analytics.categories.length.toString() },
      { label: 'PROJECT SUBMITTERS', value: analytics.activeSubmitters.toString() },
      { label: 'PRIMARY CDE', value: (analytics.cde[0]?.name || 'N/A').toUpperCase() }
    ];

    stats.forEach((s, i) => {
      const x = 15 + i * (kpiW + 5);
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, kpiY, kpiW, kpiH, 3, 3, 'FD');

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(s.label, x + 6, kpiY + 10);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(s.value, x + 6, kpiY + 24);
    });



    // Category Distribution Table
    const catStartY = kpiY + kpiH + 12;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DISTRIBUTION BY CATEGORY', 15, catStartY);

    const deptStats = analytics.categories;
    autoTable(doc, {
      startY: catStartY + 4,
      head: [['Category', 'Count', 'Weight']],
      body: deptStats.map(({ name, value }) => [name, value.toString(), `${Math.round((value / tasks.length) * 100)}%`]),
      margin: { left: 8, right: 8 },
      tableWidth: 120,
      styles: { fontSize: 8, cellPadding: 4, valign: 'middle' },
      headStyles: { fillColor: HEADER_SLATE, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: PDF_ZEBRA_EVEN },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right' },
        2: { halign: 'right' },
      }
    });

  };

  // ── Table Registry Page ──
  const drawTable = () => {
    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.text(metadata?.reportBranding || 'KEO DIGITAL INTELLIGENCE // MASTER TRANSCRIPT', 15, 22);

    // Empty state
    if (tasks.length === 0) {
      doc.setFontSize(16);
      doc.setTextColor(100, 116, 139);
      doc.text('No Data Based on Selected Filters', pageWidth / 2, pageHeight / 2, { align: 'center' });
      return;
    }

    const excluded = metadata?.reportExcludedFields || [];
    const visibleCols = getDynamicExportColumns(excluded, 'pdf');
    const head = [visibleCols.map(c => c.label)];

    // Process filtered data for each task
    const filteredTasksData = tasks.map(t => getFilteredTaskData(t, filters));

    const body = tasks.map((t, tIdx) => {
      const fData = filteredTasksData[tIdx];
      const combinedLinks = getExportLinks(t, filters);
      const linksLabels = combinedLinks.map(l => l.label).join('\n');
      const resolvedDept = departmentsMap[t.department] || t.department;

      return visibleCols.map(c => {
        if (c.id === 'id') return t.id.toUpperCase();
        if (c.id === 'title') return t.title;
        if (c.id === 'department') return resolvedDept;
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

    // Per-column alignment styles
    const colsConfig: Record<number, any> = {};
    visibleCols.forEach((col, idx) => {
      const align = getColumnAlign(col.id);
      if (col.id === 'title') {
        colsConfig[idx] = { cellWidth: 'auto', overflow: 'linebreak', halign: 'left', minCellWidth: 25 };
      } else if (col.id === 'links') {
        colsConfig[idx] = { cellWidth: 'auto', textColor: [5, 99, 193], halign: 'center', minCellWidth: 20 };
      } else {
        colsConfig[idx] = { cellWidth: 'auto', halign: align };
      }
    });

    autoTable(doc, {
      startY: 30,
      head,
      body,
      theme: 'grid',
      margin: { top: 15, bottom: 15, left: 8, right: 8 },
      showHead: 'everyPage',
      rowPageBreak: 'avoid',
      headStyles: {
        fillColor: HEADER_SLATE,
        textColor: [255, 255, 255],
        fontSize: 6.5,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 3,
        overflow: 'linebreak',
        minCellHeight: 12,
      },
      styles: {
        fontSize: 6.5,
        cellPadding: 3,
        overflow: 'linebreak',
        valign: 'middle',
        minCellHeight: 10,
      },
      alternateRowStyles: {
        fillColor: PDF_ZEBRA_EVEN,
      },
      columnStyles: colsConfig,
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === lIdx && lIdx !== -1) {
          const links = getExportLinks(tasks[data.row.index], filters);
          if (links.length === 1) {
            doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: links[0].url });
          } else if (links.length > 1) {
            const linkHeight = data.cell.height / links.length;
            links.forEach((ll, idx) => {
              if (ll.url) {
                const yPos = data.cell.y + (idx * linkHeight);
                doc.link(data.cell.x, yPos, data.cell.width, linkHeight, { url: ll.url });
              }
            });
          }
        }
      },
      didDrawPage: (data) => {
        // Repeat branding on every page
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          metadata?.reportFooter || 'PRIVATE & CONFIDENTIAL',
          pageWidth / 2, pageHeight - 8,
          { align: 'center' }
        );
      }
    });
  };

  // ── Execution Flow ──
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

  return {
    blob: doc.output('blob'),
    filename: `${metadata?.projectName || 'Project'}_${perspective === 'both' ? 'Consolidated' : (perspective === 'dashboard' ? 'Analytics' : 'Report')}_${new Date().toISOString().split('T')[0]}.pdf`
  };
}

// ═══════════════════════════════════════════════════════════════════════
// BIM REVIEW EXPORTS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Gets BIM column configuration
 */
export function getBimExportColumns(metadataExcluded: string[], format: 'excel' | 'pdf' = 'excel') {
  const baseColumns = [
    { id: 'ID', excelLabel: 'ID', pdfLabel: 'ID', width: 20 },
    { id: 'Project', excelLabel: 'Project', pdfLabel: 'PROJECT', width: 30 },
    { id: 'Precinct', excelLabel: 'Precinct', pdfLabel: 'PRECINCT', width: 25 },
    { id: 'Stakeholder', excelLabel: 'Stakeholder', pdfLabel: 'STAKEHOLDER', width: 25 },
    { id: 'Milestone Submissions', excelLabel: 'Milestone Submissions', pdfLabel: 'MILESTONES', width: 50 },
    { id: 'Submission Category', excelLabel: 'Submission Category', pdfLabel: 'CATEGORY', width: 25 },
    { id: 'Planned Submission Date', excelLabel: 'Planned Submission Date', pdfLabel: 'PLANNED DATE', width: 20 },
    { id: 'ACC Status', excelLabel: 'ACC Status', pdfLabel: 'ACC STATUS', width: 20 },
    { id: 'Priority', excelLabel: 'Design Stage', pdfLabel: 'DESIGN STAGE', width: 25 },
    { id: 'ACC Review ID', excelLabel: 'ACC Review ID', pdfLabel: 'ACC REV ID', width: 20 },
    { id: 'InSite Review Status', excelLabel: 'InSite Review Status', pdfLabel: 'INSITE STATUS', width: 25 },
    { id: 'InSite Review Due Date', excelLabel: 'InSite Review Due Date', pdfLabel: 'DUE DATE', width: 20 },
    { id: 'InSite Reviewer', excelLabel: 'InSite Reviewer', pdfLabel: 'REVIEWER', width: 25 },
    { id: 'InSite Review Output ACC URL', excelLabel: 'InSite Review Output ACC URL', pdfLabel: 'ACC URL', width: 25 },
    { id: 'Comments', excelLabel: 'Comments', pdfLabel: 'COMMENTS', width: 40 }
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
  const priorityBreakdown: Record<string, number> = {};
  const insiteStatuses: Record<string, number> = {};
  const stakeholders: Record<string, number> = {};
  const accStatuses: Record<string, number> = {};
  let approvedCount = 0;

  reviews.forEach(r => {
    priorityBreakdown[r.Priority || 'MEDIUM'] = (priorityBreakdown[r.Priority || 'MEDIUM'] || 0) + 1;
    insiteStatuses[r["InSite Review Status"] || 'Pending'] = (insiteStatuses[r["InSite Review Status"] || 'Pending'] || 0) + 1;
    stakeholders[r.Stakeholder || 'N/A'] = (stakeholders[r.Stakeholder || 'N/A'] || 0) + 1;
    
    const acc = r["ACC Status"] || [];
    acc.forEach(st => {
      accStatuses[st] = (accStatuses[st] || 0) + 1;
    });
    if (acc.includes('SHARED') || acc.includes('APPROVED')) approvedCount++;
  });

  return {
    total: reviews.length,
    approvedCount,
    priority: Object.entries(priorityBreakdown).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    insite: Object.entries(insiteStatuses).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    stakeholders: Object.entries(stakeholders).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    modon: Object.entries(accStatuses).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
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
  selectedColumns?: string[],
  chartImages?: CapturedChart[]
) {
  const workbook = new ExcelJS.Workbook();
  const headerColors = { bg: metadata?.reportExcelHeaderColor || '0A0A0F', text: metadata?.reportExcelHeaderTextColor || 'FFFFFF' };

  const addRegistrySheet = (name: string) => {
    const sheet = workbook.addWorksheet(name);
    let cols = getBimExportColumns([], 'excel');
    if (selectedColumns && selectedColumns.length > 0) {
      cols = cols.filter(c => selectedColumns.includes(c.id));
    }

    // Empty state
    if (reviews.length === 0) {
      const emptyRow = sheet.addRow(['No Data Based on Selected Filters']);
      emptyRow.font = { bold: true, size: 14, color: { argb: 'FF64748B' } };
      emptyRow.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.mergeCells(1, 1, 1, Math.max(cols.length, 3));
      sheet.getRow(1).height = 50;
      return sheet;
    }

    const headers = cols.map(c => c.label);
    const hRow = sheet.addRow(headers);
    hRow.font = { bold: true, color: { argb: 'FF' + headerColors.text.replace('#', '') }, size: 10 };
    hRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + headerColors.bg.replace('#', '') } };
    hRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    hRow.height = 30;

    reviews.forEach((r, rIdx) => {
      const rowData = cols.map(c => {
        if (c.id === 'InSite Review Output ACC URL') return r["InSite Review Output ACC URL"] ? 'View Report' : '-';
        const val = (r as any)[c.id];
        
        // Handle Date fields specifically
        if (c.id === 'InSite Review Due Date') return val ? formatDate(val) : '-';
        if (c.id === 'Planned Submission Date' && Array.isArray(val)) {
          return val.map(d => formatDate(d)).join('\n'); // Use newline for Excel multi-date
        }
        
        if (Array.isArray(val)) return val.join(', ');
        return val || '-';
      });
      const row = sheet.addRow(rowData);
      row.height = 22;

      // Per-column alignment
      cols.forEach((c, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });

      // Zebra stripes
      const fillColor = rIdx % 2 === 0 ? ZEBRA_EVEN_FILL : ZEBRA_ODD_FILL;
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFF1F5F9' } },
          right: { style: 'thin', color: { argb: 'FFF1F5F9' } },
        };
      });

      // Hyperlink for review output URL
      const linkIdx = cols.findIndex(c => c.id === 'InSite Review Output ACC URL');
      if (linkIdx !== -1 && r["InSite Review Output ACC URL"]) {
        const cell = row.getCell(linkIdx + 1);
        cell.value = { text: 'View Report', hyperlink: r["InSite Review Output ACC URL"] };
        cell.font = { color: { argb: LINK_COLOR_ARGB }, underline: true, size: 10 };
      }
    });

    // Auto-size with constraints
    sheet.columns.forEach(col => {
      let maxLen = 0;
      col.eachCell?.({ includeEmpty: true }, cell => {
        const l = cell.value ? cell.value.toString().length : 10;
        if (l > maxLen) maxLen = l;
      });
      const computed = maxLen + 4;
      col.width = Math.max(MIN_COL_WIDTH, Math.min(computed, MAX_COL_WIDTH));
    });

    // Freeze header & auto-filter
    sheet.views = [{ state: 'frozen', ySplit: 1, xSplit: 0, topLeftCell: 'A2', activeCell: 'A2' }];
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };

    return sheet;
  };

  if (perspective === 'dashboard' || perspective === 'both') {
    const analytics = getBimDashboardAnalytics(reviews);
    const sheet = workbook.addWorksheet('BIM Insights');
    sheet.columns = [{ width: 35 }, { width: 45 }];

    sheet.addRow(['BIM REVIEW EXECUTIVE SUMMARY']).font = { bold: true, size: 14, color: { argb: 'FFD4AF37' } };
    sheet.addRow([]);
    sheet.addRow(['CORE METRICS']).font = { bold: true, size: 12, color: { argb: 'FF1E293B' } };
    sheet.addRow([]);

    const kpiRows = [
      ['Total Reviews', analytics.total],
      ['Approved (Modon)', analytics.approvedCount],
      ['Active Stakeholders', analytics.stakeholders.length],
      ['Period', dateRangeText || 'All Time'],
      ['Generated On', formatGeneratedOn()],
    ];

    kpiRows.forEach(([label, val], idx) => {
      const row = sheet.addRow([label, val]);
      row.getCell(1).font = { bold: true, size: 11 };
      row.getCell(2).alignment = { horizontal: 'right' };
      const fill = idx % 2 === 0 ? ZEBRA_EVEN_FILL : ZEBRA_ODD_FILL;
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
      });
    });

    sheet.addRow([]);
    sheet.addRow(['ACC STATUS BREAKDOWN']).font = { bold: true, size: 11 };
    analytics.modon.forEach(s => {
      const row = sheet.addRow([s.name, s.value]);
      row.getCell(2).alignment = { horizontal: 'right' };
    });

    sheet.addRow([]);
    sheet.addRow(['INSITE STATUS BREAKDOWN']).font = { bold: true, size: 11 };
    analytics.insite.forEach(s => {
      const row = sheet.addRow([s.name, s.value]);
      row.getCell(2).alignment = { horizontal: 'right' };
    });

    // Chart Images
    if (chartImages && chartImages.length > 0) {
      const chartSheet = workbook.addWorksheet('BIM Charts');
      let currentRow = 1;
      chartSheet.columns = [{ width: 8 }, { width: 90 }, { width: 8 }];
      chartSheet.views = [{ zoomScale: 140, showGridLines: false }];
      chartSheet.addRow(['', 'BIM ANALYTICS CHARTS', '']).font = { bold: true, size: 15, color: { argb: 'FF1E293B' } };
      chartSheet.mergeCells(1, 2, 1, 3);
      currentRow = 3;

      for (const chart of chartImages) {
        try {
          const imageId = workbook.addImage({
            base64: chart.imageData.split(',')[1],
            extension: 'png',
          });
          // Keep dashboard captures highly readable in Excel even at 100% zoom.
          const maxWidth = 1800;
          const scale = Math.min(1, maxWidth / (chart.width / 2));
          const displayWidth = (chart.width / 2) * scale;
          const displayHeight = (chart.height / 2) * scale;

          if (chart.title) {
            chartSheet.getRow(currentRow).getCell(2).value = chart.title.toUpperCase();
            chartSheet.getRow(currentRow).getCell(2).font = { bold: true, size: 11, color: { argb: 'FF334155' } };
            currentRow++;
          }
          for (let r = currentRow; r <= currentRow + Math.ceil(displayHeight / 20); r++) {
            for (let c = 2; c <= 3; c++) {
              const cell = chartSheet.getRow(r).getCell(c);
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
              cell.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
            }
          }
          chartSheet.addImage(imageId, {
            tl: { col: 1.1, row: currentRow - 0.8 },
            ext: { width: displayWidth, height: displayHeight }
          });
          currentRow += Math.ceil(displayHeight / 20) + 2;
        } catch (err) {
          console.warn('Failed to embed BIM chart:', err);
        }
      }
    }
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
  selectedColumns?: string[],
  chartImages?: CapturedChart[]
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
    doc.setTextColor(30, 41, 59);
    doc.text(metadata?.projectName || 'Project Master Registry', 20, 75);
    doc.setFontSize(12);
    doc.text(`Period: ${dateRangeText || 'All Time'}`, 20, 90);
    doc.text(`Generated: ${formatGeneratedOn()}`, 20, 100);
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(metadata?.reportFooter || 'PRIVATE & CONFIDENTIAL', 20, pageHeight - 15);
  };

  const drawDashboard = () => {
    // Capture-first: if live dashboard images are available, use them as the primary export output.
    if (chartImages && chartImages.length > 0) {
      drawPdfChartGallery(
        doc,
        chartImages,
        metadata,
        'BIM ANALYTICS CHARTS',
        `Captured from live BIM dashboard (${reviews.length} reviews)`
      );
      return;
    }

    if (!reviews.length) return;
    const analytics = getBimDashboardAnalytics(reviews);

    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('BIM REVIEW PERFORMANCE DASHBOARD', 15, 25);

    // KPI Row
    const kpiY = 35;
    const kpiW = (pageWidth - 45) / 4;
    const kpiH = 30;
    const bimStats = [
      { label: 'TOTAL REVIEWS', value: analytics.total.toString() },
      { label: 'STAKEHOLDERS', value: analytics.stakeholders.length.toString() },
      { label: 'PERIOD', value: dateRangeText || 'All Time' },
      { label: 'GENERATED', value: formatGeneratedOn() },
    ];

    bimStats.forEach((s, i) => {
      const x = 15 + i * (kpiW + 5);
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, kpiY, kpiW, kpiH, 3, 3, 'FD');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(s.label, x + 6, kpiY + 10);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(16);
      doc.text(s.value, x + 6, kpiY + 24);
    });

    // Modon Status Table
    autoTable(doc, {
      startY: kpiY + kpiH + 12,
      head: [['Design Stage', 'Count', 'Percentage']],
      body: analytics.priority.map(s => [s.name, s.value.toString(), `${analytics.total > 0 ? Math.round((s.value / analytics.total) * 100) : 0}%`]),
      margin: { left: 15, right: 15 },
      tableWidth: 140,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: HEADER_SLATE, fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: PDF_ZEBRA_EVEN },
      columnStyles: { 0: { halign: 'left' }, 1: { halign: 'right' }, 2: { halign: 'right' } }
    });

  };

  const drawTable = () => {
    doc.addPage();

    // Empty state
    if (reviews.length === 0) {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      doc.setFontSize(16);
      doc.setTextColor(100, 116, 139);
      doc.text('No Data Based on Selected Filters', pageWidth / 2, pageHeight / 2, { align: 'center' });
      return;
    }

    let cols = getBimExportColumns([], 'pdf');
    if (selectedColumns && selectedColumns.length > 0) {
      cols = cols.filter(c => selectedColumns.includes(c.id));
    }
    const head = [cols.map(c => c.label)];
    const body = reviews.map(r => cols.map(c => {
      if (c.id === 'InSite Review Output ACC URL') return r["InSite Review Output ACC URL"] ? 'View Report' : '-';
      const val = (r as any)[c.id];
      
      // Handle Date fields specifically
      if (c.id === 'InSite Review Due Date') return val ? formatDate(val) : '-';
      if (c.id === 'Planned Submission Date' && Array.isArray(val)) {
        return val.map(d => formatDate(d)).join(' | ');
      }
      
      return Array.isArray(val) ? val.join(', ') : (val || '-');
    }));

    // Per-column alignment
    const colStyles: Record<number, any> = {};
    cols.forEach((col, idx) => {
      const align = 'center'; // Standardized center align for most
      if (col.id === 'Milestone Submissions' || col.id === 'Comments') {
        colStyles[idx] = { halign: 'left', overflow: 'linebreak', cellWidth: 'auto', minCellWidth: 25 };
      } else if (col.id === 'InSite Review Output ACC URL') {
        colStyles[idx] = { halign: 'center', cellWidth: 'auto', textColor: [5, 99, 193], minCellWidth: 20 };
      } else {
        colStyles[idx] = { halign: 'center', cellWidth: 'auto' };
      }
    });

    // Hyperlink column - Match the exact ID from getBimExportColumns
    const linkColIdx = cols.findIndex(c => c.id === 'InSite Review Output ACC URL');

    autoTable(doc, {
      head, body, theme: 'grid',
      margin: { top: 15, bottom: 15, left: 8, right: 8 },
      showHead: 'everyPage',
      rowPageBreak: 'avoid',
      headStyles: {
        fillColor: HEADER_SLATE,
        fontSize: 5.5,
        halign: 'center',
        valign: 'middle',
        overflow: 'linebreak',
        cellPadding: 2,
        minCellHeight: 10,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 5,
        halign: 'center',
        valign: 'middle',
        cellPadding: 2,
        overflow: 'linebreak',
        minCellHeight: 8,
      },
      alternateRowStyles: {
        fillColor: PDF_ZEBRA_EVEN,
      },
      columnStyles: colStyles,
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === linkColIdx && linkColIdx !== -1) {
          const review = reviews[data.row.index];
          if (review?.["InSite Review Output ACC URL"] && review["InSite Review Output ACC URL"] !== '-') {
            doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: ensureAbsoluteUrl(review["InSite Review Output ACC URL"]) });
          }
        }
      },
      didDrawPage: () => {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(metadata?.reportFooter || 'PRIVATE & CONFIDENTIAL', pageWidth / 2, pageHeight - 8, { align: 'center' });
      }
    });
  };

  drawCover();
  if (perspective === 'dashboard' || perspective === 'both') drawDashboard();
  if (perspective === 'table' || perspective === 'both') drawTable();
  return {
    blob: doc.output('blob'),
    filename: `BIM_Report_${new Date().toISOString().split('T')[0]}.pdf`
  };
}
