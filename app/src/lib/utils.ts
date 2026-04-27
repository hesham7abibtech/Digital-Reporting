import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function formatDate(dateInput: any): string {
  if (!dateInput) return '—';
  try {
    const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
    if (isNaN(date.getTime())) return '—';
    // Format: 27-APR-2026
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }).replace(/ /g, '-').toUpperCase();
  } catch (e) { return '—'; }
}

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-').toUpperCase();
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    NOT_STARTED: '#64748b',
    IN_PROGRESS: '#3b82f6',
    PENDING_REVIEW: '#f59e0b',
    COMPLETED: '#10b981',
    DELAYED: '#ef4444',
    BLOCKED: '#ef4444',
  };
  return colors[status] || '#64748b';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: '#64748b',
    MEDIUM: '#3b82f6',
    HIGH: '#f59e0b',
    CRITICAL: '#ef4444',
  };
  return colors[priority] || '#64748b';
}

export function getHealthColor(score: number): string {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

export function getDepartmentColor(dept: string): string {
  const colors: Record<string, string> = {
    'BIM': '#BF70C1',               // Mid Purple
    'GIS': '#A0BC57',               // Mid Green
    'Digital Team': '#B59572',      // Mid Brown
    'SPA': '#F7A0A0',               // Mid Pink
    'Digital Reporting': '#62A0B8', // Mid Blue
  };
  return colors[dept] || '#003f49';
}

export function generateTicketId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous characters
  let result = 'DR-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
