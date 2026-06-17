import type { Task, KPI, TeamMember, Activity, Notification, ProjectHealth, DashboardNavItem, ProjectMetadata } from './types';

// ─── Project Metadata Baseline ─────────────────────────────────────
export const projectMetadata: ProjectMetadata = {
  id: 'project-info',
  projectName: '',
  title: '',
  projectId: '',
  companyName: '',
  region: '',
  subtitles: [],
  brandingCode: '',
  location: '',
  statusLine: 'System Initialized',
  statusColor: '#3b82f6',
  memberCount: '0/0 Members',
  logoUrl: '',
  partnerLogos: [],
  headerBgUrl: '',
  headerBgOpacity: 20,
  headerBgPositionY: 50,
  headerBgPositionX: 50,
  ownerLogoUrl: '',
  updatedAt: new Date().toISOString()
};

// ─── Production Data Vectors (Empty Baseline) ───────────────────────
export const teamMembers: TeamMember[] = [];
export const tasks: Task[] = [];
export const kpis: KPI[] = [];
export const activities: Activity[] = [];
export const notifications: Notification[] = [];

export const projectHealth: ProjectHealth = {
  overall: { id: 'h1', label: 'Overall', score: 0, trend: 'stable', description: 'Initializing system...' },
  schedule: { id: 'h2', label: 'Schedule', score: 0, trend: 'stable', description: 'No active schedule telemetry' },
  cost: { id: 'h3', label: 'Cost', score: 0, trend: 'stable', description: 'No active cost telemetry' },
  resource: { id: 'h4', label: 'Resource', score: 0, trend: 'stable', description: 'No active resource telemetry' },
  documentation: { id: 'h5', label: 'Documentation', score: 0, trend: 'stable', description: 'No active documentation telemetry' },
  communication: { id: 'h6', label: 'Communication', score: 0, trend: 'stable', description: 'No active communication telemetry' },
};

// ─── Analytics Baselines ───────────────────────────────────────────
export const tasksByDepartment: any[] = [];
export const tasksByStatus: any[] = [];
export const weeklyCompletionTrend: any[] = [];
export const teamWorkload: any[] = [];
export const delayedTrend: any[] = [];
export const documentsPerWeek: any[] = [];
export const meetingsPerWeek: any[] = [];

// ─── Navigation & Registry Baselines ──────────────────────────────
export const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { id: 'tasks', label: 'Tasks', icon: 'clipboard-list', badge: 0 },
  { id: 'team', label: 'Team', icon: 'users' },
  { id: 'reports', label: 'Reports', icon: 'bar-chart-3' },
  { id: 'health', label: 'Health', icon: 'heart-pulse' },
  { id: 'notifications', label: 'Notifications', icon: 'bell', badge: 0 },
  { id: 'admin', label: 'Admin', icon: 'settings' },
];

export const dashboardsRegistry: DashboardNavItem[] = [];
