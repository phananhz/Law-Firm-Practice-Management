export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'WAITING' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';

export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface TaskChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  code: string; // TSK-2026-000001
  title: string;
  description?: string;
  matterId?: string;
  matterCode?: string;
  matterName?: string;
  assigneeId: string;
  assigneeName: string;
  reviewerId?: string;
  reviewerName?: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate?: string;
  dueDate: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  isOverdue: boolean;
  completedAt?: string;
  completedBy?: string;
  checklists: TaskChecklistItem[];
  comments: TaskComment[];
  createdAt: string;
  updatedAt: string;
}

export type DeadlineCategory =
  | 'FILING'
  | 'GOVERNMENT'
  | 'COURT'
  | 'CONTRACT_EXPIRY'
  | 'LICENSE_EXPIRY'
  | 'RENEWAL'
  | 'CLIENT'
  | 'INTERNAL';

export interface Deadline {
  id: string;
  code: string; // DL-2026-000001
  title: string;
  description?: string;
  matterId?: string;
  matterCode?: string;
  matterName?: string;
  category: DeadlineCategory;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  reminderDays: number[]; // e.g. [30, 15, 7, 3, 1]
  isCompleted: boolean;
  isOverdue: boolean;
  completedAt?: string;
  responsiblePersonId: string;
  responsiblePersonName: string;
  authorityName?: string;
  courtName?: string;
  caseNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  matterId?: string;
  assigneeId: string;
  reviewerId?: string;
  priority: TaskPriority;
  startDate?: string;
  dueDate: string;
  estimatedMinutes?: number;
  checklists?: string[];
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  assigneeId?: string;
  reviewerId?: string;
  priority?: TaskPriority;
  startDate?: string;
  dueDate?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
}

export interface ChangeTaskStatusPayload {
  status: TaskStatus;
  notes?: string;
}

export interface AddTaskCommentPayload {
  content: string;
}

export interface ToggleChecklistItemPayload {
  isCompleted: boolean;
}

export interface CreateDeadlinePayload {
  title: string;
  description?: string;
  matterId?: string;
  category: DeadlineCategory;
  dueDate: string;
  dueTime?: string;
  reminderDays: number[];
  responsiblePersonId: string;
  authorityName?: string;
  courtName?: string;
  caseNumber?: string;
  notes?: string;
}

export interface UpdateDeadlinePayload {
  title?: string;
  description?: string;
  category?: DeadlineCategory;
  dueDate?: string;
  dueTime?: string;
  reminderDays?: number[];
  responsiblePersonId?: string;
  notes?: string;
}
