import * as XLSX from 'xlsx';
import { BIMReview } from './types';

/**
 * Parses a BIM Reviews Excel file buffer and maps it to BIMReview objects.
 */
export async function parseBimReviewsExcel(buffer: ArrayBuffer): Promise<Partial<BIMReview>[]> {
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: 'array', cellDates: true });
  
  let allRecords: Partial<BIMReview>[] = [];
  
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    // Use raw array format for maximum control
    let rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
    
    if (rows.length < 1) continue;

    // --- FAIL-SAFE: Check if CSV was read as a single column ---
    if (rows[0].length === 1 && String(rows[0][0]).includes(',')) {
      rows = rows.map(row => {
        const line = String(row[0] || '');
        // Robust CSV split that preserves empty fields and handles quotes
        return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => {
          let c = cell.trim();
          if (c.startsWith('"') && c.endsWith('"')) c = c.slice(1, -1);
          return c;
        });
      });
    }

    // Find the header row
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
      const row = rows[i];
      if (!row || !Array.isArray(row)) continue;
      const rowStr = row.map(c => String(c || '').trim().toLowerCase());
      if (rowStr.some(s => s === 'project' || s === 'id' || s.includes('milestone') || s.includes('submission'))) {
        headerRowIndex = i;
        break;
      }
    }

    // If no header row found, assume the first row is data if it has many columns
    const headersFound = headerRowIndex !== -1;
    const headers = headersFound 
      ? rows[headerRowIndex].map(h => String(h || '').trim().toLowerCase().replace(/[^a-z0-9 ]/g, '')) 
      : [];
    
    const dataRows = headersFound ? rows.slice(headerRowIndex + 1) : rows;

    const sheetRecords = dataRows.map(row => {
      if (!row || row.length < 2) return null;

      const getVal = (aliases: string[], colIndex: number) => {
        // 1. Try by header name
        for (const alias of aliases) {
          const target = alias.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
          const idx = headers.findIndex(h => h === target || h.includes(target));
          if (idx !== -1 && row[idx] !== undefined && row[idx] !== null && row[idx] !== '') return row[idx];
        }
        // 2. Fallback to fixed position if it looks like the standard 15-column schema
        if (row[colIndex] !== undefined && row[colIndex] !== null && row[colIndex] !== '') return row[colIndex];
        return '';
      };

      const parseExcelDate = (val: any) => {
        if (!val) return null;
        if (val instanceof Date) return val.toISOString().split('T')[0];
        if (typeof val === 'number') return new Date((val - 25569) * 86400 * 1000).toISOString().split('T')[0];
        
        const s = String(val).trim();
        // Handle DD-MMM-YY format (e.g. 27-Apr-26)
        const dmmmYY = s.match(/^(\d{1,2})-([a-zA-Z]{3})-(\d{2,4})$/);
        if (dmmmYY) {
          const [_, day, month, year] = dmmmYY;
          const fullYear = year.length === 2 ? `20${year}` : year;
          const monthIndex = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(month.toLowerCase());
          if (monthIndex !== -1) {
            return new Date(parseInt(fullYear), monthIndex, parseInt(day)).toISOString().split('T')[0];
          }
        }

        const d = new Date(val);
        return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : s;
      };

      const parseMultiValue = (val: any): string[] => {
        if (!val) return [];
        // Split by newline OR by comma that is NOT followed by a space
        // This preserves "Value, with space" as one item but splits "Item1,Item2"
        return String(val).split(/\n|,(?!\s)/).map(s => s.trim()).filter(s => s !== '');
      };

      const parseMultiDate = (val: any): string[] => {
        if (!val) return [];
        if (typeof val === 'number' || val instanceof Date) return [parseExcelDate(val)!].filter(Boolean);
        
        // Use the same smart split for strings
        const rawParts = String(val).split(/\n|,(?!\s)/).map(s => s.trim()).filter(s => s !== '');
        const processedParts: string[] = [];
        
        for (let i = 0; i < rawParts.length; i++) {
          let part = rawParts[i];
          // If this part looks like just a year and the previous part didn't have one, merge them
          // (Failsafe for cases where the split was too aggressive)
          if (i > 0 && /^\d{4}$/.test(part) && !/\d{4}/.test(rawParts[i-1])) {
            processedParts[processedParts.length - 1] += `, ${part}`;
          } else {
            processedParts.push(part);
          }
        }

        return processedParts.map(s => parseExcelDate(s)).filter((s): s is string => !!s);
      };

      return {
        "ID": String(getVal(['ID', 'id', 'record id', 'uid', 'reference'], 0)),
        "Precinct": parseMultiValue(getVal(['Precinct', 'site', 'location', 'area'], 1)),
        "Stakeholder": String(getVal(['Stakeholder', 'consultant', 'lead', 'party', 'company'], 2)),
        "Project": String(getVal(['Project', 'project name', 'project detail', 'development'], 3)),
        "Milestone Submissions": parseMultiValue(getVal(['Milestone Submissions', 'description', 'milestone', 'deliverable'], 4)),
        "Submission Category": parseMultiValue(getVal(['Submission Category', 'category', 'type', 'submission type'], 5)),
        "Planned Submission Date": parseMultiDate(getVal(['Planned Submission Date', 'submission date', 'target date', 'planned date'], 6)),
        "ACC Status": parseMultiValue(getVal(['ACC Status', 'on acc', 'audit status', 'acc audit', 'status'], 7)),
        "Priority": String(getVal(['Priority', 'stage', 'phase', 'design stage'], 8) || 'MEDIUM'),
        "ACC Review ID": String(getVal(['ACC Review ID', 'review #', 'review id', 'acc id'], 9)),
        "InSite Review Status": String(getVal(['InSite Review Status', 'review status', 'gate status', 'insite status'], 10)),
        "InSite Review Due Date": parseExcelDate(getVal(['InSite Review Due Date', 'due date', 'review due date', 'due'], 11)),
        "InSite Reviewer": parseMultiValue(getVal(['InSite Reviewer', 'reviewer', 'reviewer name'], 12)),
        "InSite Review Output ACC URL": String(getVal(['InSite Review Output ACC URL', 'acc url', 'output url', 'link', 'url'], 13)),
        "Comments": String(getVal(['Comments', 'comment', 'notes'], 14)),
      };
    }).filter((r): r is any => r !== null && !!(r.Project || r.ID));

    allRecords = [...allRecords, ...sheetRecords];
  }

  return allRecords;
}

/**
 * Generates a unique ID for a BIM Review record if none exists.
 */
export function generateBimReviewId(review: Partial<BIMReview>): string {
  if (review["ID"]) return review["ID"];
  
  if (review["ACC Review ID"] && review["Project"]) {
    return `${review["ACC Review ID"]}-${review["Project"].replace(/[^a-zA-Z0-9]/g, '-').slice(0, 20)}`.toLowerCase();
  }
  // Fallback: Hash of project + stakeholder + first milestone
  const milestone = review["Milestone Submissions"]?.[0] || '';
  const base = `${review["Project"]}-${review["Stakeholder"]}-${milestone}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = ((hash << 5) - hash) + base.charCodeAt(i);
    hash |= 0;
  }
  return `bim-${Math.abs(hash)}-${Date.now()}`;
}
