// ─── Task Types ───────────────────────────────────────────────────
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'PENDING_REVIEW'
  | 'COMPLETED'
  | 'DELAYED'
  | 'BLOCKED';

export interface TaskFile {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
  updatedAt: string;
}


export interface RegistryLink {
  label: string;
  url: string;
}

export type RegistryStatus = 'LIVE' | 'HOLD' | 'BLOCKED' | 'MAINTENANCE' | 'OFFLINE';

export interface DashboardNavItem {
  id: string;
  name: string;
  description?: string;
  status: RegistryStatus;
  department?: string;
  icon: string; // lucide icon name
  category: string;
  customCategory?: string;
  links?: RegistryLink[];
}

export interface TaskLink {
  id: string;
  label: string;
  url: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  department: string;
  status: TaskStatus;
  completion: number;
  attachments: number;
  files: TaskFile[];
  links: TaskLink[];
  tags: string[];
  fileZone: string; // Internal tracking
  timeZone: string;
  fileShareLink: string;
  deliverableType?: string[];
  cde?: string[];
  pendingReviewDate?: string | null; // When task entered PENDING_REVIEW status
  submittingDate?: string | null;
  submitterName?: string;

  createdAt: string;
  updatedAt: string;
}


// ─── KPI Types ────────────────────────────────────────────────────
export interface KPI {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  unit?: string;
  prefix?: string;
  icon: string;
  color: string;
  trend: 'up' | 'down' | 'neutral';
  sparklineData: number[];
}

// ─── Team Member Types ────────────────────────────────────────────
export type UserRole = 'OWNER' | 'ADMIN' | 'TEAM_MATE';

export interface AdminPermissions {
  manageTasks: boolean;
  manageTeam: boolean;
  manageBranding: boolean;
  manageRegistry: boolean;
  manageUsers: boolean;
}


export interface PolicyActions {
  view: boolean;
  edit: boolean;
  delete: boolean;
}

export interface GroupPolicy {
  id: string;
  name: string;
  description: string;
  isTeammatePolicy?: boolean;
  modules: {
    tasks: PolicyActions;
    team: PolicyActions;
    branding: PolicyActions;
    registry: PolicyActions;
    users: PolicyActions;
    policies: PolicyActions;
    broadcast: PolicyActions;
    reports: PolicyActions;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  policyId?: string; // ID of the assigned GroupPolicy
  department: string;
  isOnline: boolean;
  lastActive: string;
}

// ─── Broadcast & Notification Types ───────────────────────────────
export type BroadcastType = 'NOTIF' | 'NEWS';
export type BroadcastSeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';

export interface Broadcast {
  id: string;
  title: string;
  description: string;
  type: BroadcastType;
  severity: BroadcastSeverity;
  timestamp: string;
  link?: string;
  category?: string;
  readBy?: string[]; // user IDs who confirmed receipt
}

// ─── Activity Types ───────────────────────────────────────────────
export type ActivityType =
  | 'task_completed'
  | 'file_uploaded'
  | 'approval'
  | 'comment'
  | 'status_change'
  | 'meeting'
  | 'issue_closed';

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

// ─── Notification Types ───────────────────────────────────────────
export type NotificationSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface Notification {
  id: string;
  title: string;
  description: string;
  severity: NotificationSeverity;
  read: boolean;
  timestamp: string;
  link?: string;
}

// ─── Health Types ─────────────────────────────────────────────────
export interface HealthMetric {
  id: string;
  label: string;
  score: number;
  trend: 'improving' | 'declining' | 'stable';
  description: string;
}

export interface ProjectHealth {
  overall: HealthMetric;
  schedule: HealthMetric;
  cost: HealthMetric;
  resource: HealthMetric;
  documentation: HealthMetric;
  communication: HealthMetric;
}

// ─── Chart Types ──────────────────────────────────────────────────
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface ReportSummaryField {
  id: string;
  label: string;
  value?: string;
  isVisible: boolean;
}

export interface HeaderBadge {
  id: string;
  label: string;
  color: string;
  isVisible: boolean;
  icon?: string;
  isAutomated?: boolean;
}

// ─── Project Metadata Types ───────────────────────────────────────
export interface ProjectMetadata {
  id: string; // usually 'project'
  title: string;
  projectName: string;
  projectId: string;
  companyName: string;
  region: string;
  subtitles?: string[];
  headerBadges?: HeaderBadge[];
  brandingCode: string;
  location: string;
  statusLine: string;
  statusColor: string;
  memberCount: string;
  logoUrl: string;
  ownerLogoUrl: string;
  partnerLogos?: string[];
  headerBgUrl?: string;
  headerBgOpacity?: number;
  headerBgPositionY?: number;
  headerBgPositionX?: number;
  allowedDomains?: string[];
  reportTitle?: string;
  reportSubtitle?: string;
  reportSummary?: string;
  reportBgColor?: string;
  reportAccentColor?: string;
  reportHeaderTextColor?: string;
  reportPdfBodyTextColor?: string;
  reportExcelHeaderColor?: string;
  reportExcelHeaderTextColor?: string;
  reportExcelAccentColor?: string;
  reportExcelBodyTextColor?: string;
  reportPeriodReference?: string;
  reportTemporalReference?: string;
  reportBranding?: string;
  reportFooter?: string;
  reportExcludedFields?: string[];
  reportSummaryFields?: ReportSummaryField[];
  updatedAt: string;
}

// ─── Navigation Types ─────────────────────────────────────────────
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

// ─── Department Types ─────────────────────────────────────────────
export interface Department {
  id: string;
  name: string;
  abbreviation: string;
  createdAt: string;
  updatedAt: string;
}
