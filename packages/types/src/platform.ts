export type NotificationTone = 'INFO' | 'SUCCESS' | 'WARNING' | 'SECURITY';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  tone: NotificationTone;
  readAt?: string;
  createdAt: string;
  href?: string;
  actorName?: string;
}

export interface SearchResultItem {
  id: string;
  type: 'CLIENT' | 'MATTER' | 'TASK' | 'DOCUMENT' | 'DEADLINE';
  title: string;
  subtitle?: string;
  href: string;
  score: number;
}

export interface SearchResultSet {
  query: string;
  results: SearchResultItem[];
  total: number;
}

export interface ReportOverview {
  period: { from: string; to: string };
  totals: {
    clients: number;
    matters: number;
    tasks: number;
    deadlines: number;
    documents: number;
  };
  taskStatus: Array<{ status: string; count: number }>;
  matterStatus: Array<{ status: string; count: number }>;
  workload: Array<{ userId: string; userName: string; openTasks: number; overdueTasks: number }>;
}

export interface AuditEntry {
  id: string;
  action: string;
  module: string;
  entityType: string;
  entityId?: string;
  actorId: string;
  actorName: string;
  outcome: 'SUCCESS' | 'FAILURE';
  details?: string;
  ipAddress?: string;
  createdAt: string;
}
