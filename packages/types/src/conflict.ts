export type ConflictStatus = 'NO_CONFLICT' | 'POTENTIAL_CONFLICT' | 'CONFIRMED_CONFLICT';

export type ConflictEntityType =
  | 'CLIENT'
  | 'PREVIOUS_CLIENT'
  | 'OPPOSING_PARTY'
  | 'RELATED_PARTY'
  | 'DIRECTOR'
  | 'SHAREHOLDER'
  | 'MATTER';

export interface ConflictResultItem {
  id: string;
  matchedEntityType: ConflictEntityType;
  matchedEntityId?: string;
  matchedName: string;
  matchedRole?: string;
  matterCode?: string;
  matterName?: string;
  similarityScore: number; // e.g. 95 (percentage)
  reason: string;
  notes?: string;
}

export interface ConflictCheck {
  id: string;
  code: string; // e.g. CC-2026-000001
  clientId?: string;
  clientName?: string;
  matterId?: string;
  matterName?: string;
  searchTerms: string[];
  status: ConflictStatus;
  requestedById: string;
  requestedByName: string;
  requestedAt: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  decisionNotes?: string;
  decisionType?: 'APPROVED_NO_CONFLICT' | 'APPROVED_WITH_CONDITIONS' | 'REJECTED_CONFIRMED';
  results: ConflictResultItem[];
  notes?: string;
}

export interface CreateConflictCheckPayload {
  clientId?: string;
  clientName?: string;
  matterName?: string;
  searchTerms: string[];
  opposingParties?: string[];
  notes?: string;
}

export interface ReviewConflictCheckPayload {
  decisionType: 'APPROVED_NO_CONFLICT' | 'APPROVED_WITH_CONDITIONS' | 'REJECTED_CONFIRMED';
  decisionNotes: string;
}
