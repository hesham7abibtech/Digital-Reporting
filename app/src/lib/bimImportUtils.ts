import * as XLSX from 'xlsx';
import { BIMReview } from './types';

/**
 * Parses a BIM Reviews Excel file buffer and maps it to BIMReview objects.
 */
export async function parseBimReviewsExcel(buffer: ArrayBuffer): Promise<Partial<BIMReview>[]> {
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Get raw JSON data from the sheet
  const rawData = XLSX.utils.sheet_to_json(worksheet) as any[];

  return rawData.map((row, index) => {
    // Helper to extract value regardless of case or slight spelling differences
    const getVal = (keys: string[]) => {
      for (const key of keys) {
        if (row[key] !== undefined) return row[key];
        // Try exact match with trimmed key
        const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
        if (foundKey) return row[foundKey];
      }
      return '';
    };

    // Helper to parse dates from Excel (can be number or string)
    const parseExcelDate = (val: any) => {
      if (!val) return null;
      if (typeof val === 'number') {
        // Excel base date is 1899-12-30
        const date = new Date((val - 25569) * 86400 * 1000);
        return date.toISOString();
      }
      // If it's a string like "13-Mar-26"
      const parsedDate = new Date(val);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
      return val; // Fallback to raw string if parsing fails
    };

    return {
      submissionDescription: String(getVal(['Submission Description', 'Description']) || ''),
      comments: String(getVal(['Comments', 'Comment']) || ''),
      designStage: String(getVal(['Design Stage', 'Stage']) || ''),
      insiteBimReviewStatus: String(getVal(['InSite BIM Review Status', 'BIM Review Status']) || ''),
      insiteReviewDueDate: parseExcelDate(getVal(['InSite Review Due Date', 'Due Date'])),
      insiteReviewOutputUrl: String(getVal(['InSite Review Output URL', 'Output URL', 'ACC URL']) || ''),
      insiteReviewer: String(getVal(['InSite Reviewer', 'Reviewer']) || ''),
      modonHillFinalReviewStatus: String(getVal(['Modon/Hill Final Review Status', 'Final Status']) || ''),
      onAcc: String(getVal(['On ACC', 'Status']) || 'NOT SHARED'),
      project: String(getVal(['Project']) || ''),
      reviewNumber: String(getVal(['Review Number', 'Review #']) || ''),
      stakeholder: String(getVal(['Stakeholder']) || ''),
      submissionCategory: String(getVal(['Submission Category', 'Category']) || '')
        .split(',')
        .map(s => s.trim())
        .filter(s => s !== ''),
      submissionDate: parseExcelDate(getVal(['Submission Date', 'Date'])),
    };
  });
}

/**
 * Generates a unique ID for a BIM Review record if none exists.
 * Priority: reviewNumber + project, else hash of content
 */
export function generateBimReviewId(review: Partial<BIMReview>): string {
  if (review.reviewNumber && review.project) {
    // Sanitize for ID
    return `${review.reviewNumber}-${review.project.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 20)}`.toLowerCase();
  }
  // Fallback: Hash of project + description + date
  const base = `${review.project}-${review.submissionDescription}-${review.submissionDate}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = ((hash << 5) - hash) + base.charCodeAt(i);
    hash |= 0;
  }
  return `bim-${Math.abs(hash)}-${Date.now()}`;
}
