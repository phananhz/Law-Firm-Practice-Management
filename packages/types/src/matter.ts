export type MatterStatus =
  | 'INTAKE'
  | 'CONFLICT_CHECK'
  | 'PROPOSAL'
  | 'ACTIVE'
  | 'WAITING_CLIENT'
  | 'WAITING_AUTHORITY'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CLOSED'
  | 'ARCHIVED';

export type ConfidentialityLevel = 'NORMAL' | 'CONFIDENTIAL' | 'HIGHLY_CONFIDENTIAL' | 'RESTRICTED';

export type MatterPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type MatterType =
  | 'LITIGATION' // Tranh tụng
  | 'ADVISORY' // Tư vấn thường xuyên / Doanh nghiệp
  | 'TRANSACTION' // Giao dịch M&A / Đầu tư
  | 'COMPLIANCE' // Giấy phép & Tuân thủ
  | 'DISPUTE_RESOLUTION'; // Trọng tài & Hòa giải

export type MatterMemberRole =
  'RESPONSIBLE_PARTNER' | 'RESPONSIBLE_LAWYER' | 'MEMBER' | 'ASSISTANT' | 'EXTERNAL_COLLABORATOR';

export interface MatterMember {
  id: string;
  matterId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: MatterMemberRole;
  canEdit: boolean;
  joinedAt: string;
}

export type PartyRole =
  | 'CLIENT'
  | 'OPPOSING_PARTY'
  | 'RELATED_PARTY'
  | 'AUTHORITY'
  | 'COURT'
  | 'ARBITRATOR'
  | 'WITNESS'
  | 'REPRESENTATIVE'
  | 'OTHER';

export interface MatterParty {
  id: string;
  matterId: string;
  name: string;
  role: PartyRole;
  representativeName?: string;
  contactInfo?: string;
  notes?: string;
}

export interface MatterTimelineEvent {
  id: string;
  matterId: string;
  type:
    | 'STATUS_CHANGE'
    | 'MEMBER_ADDED'
    | 'MEMBER_REMOVED'
    | 'DOCUMENT_UPLOADED'
    | 'TASK_COMPLETED'
    | 'NOTE_ADDED'
    | 'CONFIDENTIALITY_UPDATED';
  actorName: string;
  actorRole?: string;
  timestamp: string;
  description: string;
}

export interface MatterTaskSummary {
  id: string;
  title: string;
  assigneeName: string;
  dueDate: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface MatterDeadlineSummary {
  id: string;
  title: string;
  dueDate: string;
  reminderDays: number;
  isOverdue: boolean;
  category: 'COURT_HEARING' | 'SUBMISSION' | 'STATUTE_LIMITATION' | 'CLIENT_FEEDBACK';
}

export interface MatterDocumentSummary {
  id: string;
  name: string;
  category: string;
  size: string;
  version: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface MatterNote {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  isConfidential?: boolean;
}

export interface Matter {
  id: string;
  matterCode: string; // MAT-YYYY-000001
  name: string;
  description?: string;
  clientId: string;
  clientName: string;
  conflictCheckId?: string;
  practiceArea: string;
  matterType: MatterType;
  responsiblePartnerId: string;
  responsiblePartnerName: string;
  responsibleLawyerId: string;
  responsibleLawyerName: string;
  status: MatterStatus;
  priority: MatterPriority;
  confidentialityLevel: ConfidentialityLevel;
  openDate: string;
  expectedCloseDate?: string;
  closeDate?: string;
  estimatedHours?: number;
  billingMethod?: 'HOURLY' | 'FIXED_FEE' | 'RETAINER' | 'CONTINGENCY';
  members: MatterMember[];
  parties: MatterParty[];
  tasks: MatterTaskSummary[];
  deadlines: MatterDeadlineSummary[];
  documents: MatterDocumentSummary[];
  notes: MatterNote[];
  timeline: MatterTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMatterPayload {
  name: string;
  description?: string;
  clientId: string;
  conflictCheckId?: string;
  practiceArea: string;
  matterType: MatterType;
  responsiblePartnerId: string;
  responsibleLawyerId: string;
  priority: MatterPriority;
  confidentialityLevel: ConfidentialityLevel;
  openDate: string;
  expectedCloseDate?: string;
  estimatedHours?: number;
  billingMethod?: 'HOURLY' | 'FIXED_FEE' | 'RETAINER' | 'CONTINGENCY';
  initialMembers?: string[];
}

export interface UpdateMatterPayload {
  name?: string;
  description?: string;
  practiceArea?: string;
  matterType?: MatterType;
  responsiblePartnerId?: string;
  responsibleLawyerId?: string;
  priority?: MatterPriority;
  confidentialityLevel?: ConfidentialityLevel;
  expectedCloseDate?: string;
}

export interface ChangeMatterStatusPayload {
  status: MatterStatus;
  notes?: string;
}

export interface AddMatterMemberPayload {
  userId: string;
  role: MatterMemberRole;
  canEdit: boolean;
}

export interface AddMatterPartyPayload {
  name: string;
  role: PartyRole;
  representativeName?: string;
  contactInfo?: string;
  notes?: string;
}
