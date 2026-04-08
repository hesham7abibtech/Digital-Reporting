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

export interface DashboardNavItem {
  id: string;
  name: string;
  status: 'LIVE' | 'UPDATING' | 'MAINTENANCE';
  link: string;
  icon: string; // lucide icon name
  category: string;
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
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar: string;
  department: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  completion: number;
  attachments: number;
  files: TaskFile[];
  links: TaskLink[];
  tags: string[];
  requestDate: string;
  fileZone: string; // Internal tracking
  timeZone: string;
  fileShareLink: string;
  requesterName: string;

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
export type UserRole =
  | 'OWNER'
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'PROJECT_MANAGER'
  | 'DEPARTMENT_HEAD'
  | 'VIEWER'
  | 'USER';


export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  department: string;
  isOnline: boolean;
  lastActive: string;
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

// ─── Project Metadata Types ───────────────────────────────────────
export interface ProjectMetadata {
  id: string; // usually 'project'
  title: string;
  projectName: string;
  projectId: string;
  companyName: string;
  region: string;
  subtitle: string;
  brandingCode: string;
  location: string;
  statusLine: string;
  statusColor: string;
  memberCount: string;
  logoUrl: string;
  ownerLogoUrl: string;
  updatedAt: string;
}

// ─── Navigation Types ─────────────────────────────────────────────
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}
