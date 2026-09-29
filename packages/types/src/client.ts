export type ClientType = 'INDIVIDUAL' | 'ORGANIZATION';

export type ClientStatus =
  'NEW' | 'IN_REVIEW' | 'CONFLICT_CHECK' | 'APPROVED' | 'ACTIVE' | 'REJECTED';

export interface Contact {
  id: string;
  clientId?: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  idNumber?: string;
  isPrimary?: boolean;
  notes?: string;
  createdAt: string;
}

export type RelationType =
  | 'PARENT_COMPANY'
  | 'SUBSIDIARY'
  | 'SHAREHOLDER'
  | 'DIRECTOR'
  | 'LEGAL_REPRESENTATIVE'
  | 'RELATED_COMPANY';

export interface ClientRelation {
  id: string;
  sourceClientId: string;
  targetClientId?: string;
  targetName: string;
  relationType: RelationType;
  ownershipPercentage?: number;
  notes?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  clientCode: string; // e.g. CLI-2026-000001
  type: ClientType;
  status: ClientStatus;
  displayName: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  createdAt: string;

  // Cá nhân (Individual)
  dateOfBirth?: string;
  nationality?: string;
  idNumber?: string; // CCCD / Hộ chiếu
  occupation?: string;
  companyName?: string;

  // Doanh nghiệp (Corporate)
  vietnameseName?: string;
  englishName?: string;
  shortName?: string;
  taxCode?: string;
  enterpriseNumber?: string;
  country?: string;
  legalRepresentative?: string;
  website?: string;
  industry?: string;

  // Phụ thuộc
  contactsCount: number;
  mattersCount: number;
  contacts?: Contact[];
  relations?: ClientRelation[];
}

export interface CreateClientPayload {
  type: ClientType;
  displayName: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;

  // Cá nhân
  dateOfBirth?: string;
  nationality?: string;
  idNumber?: string;
  occupation?: string;
  companyName?: string;

  // Doanh nghiệp
  vietnameseName?: string;
  englishName?: string;
  shortName?: string;
  taxCode?: string;
  enterpriseNumber?: string;
  country?: string;
  legalRepresentative?: string;
  website?: string;
  industry?: string;

  // Người liên hệ chính ban đầu
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  primaryContactPosition?: string;
}

export interface UpdateClientPayload extends Partial<CreateClientPayload> {
  status?: ClientStatus;
}

export interface ChangeClientStatusPayload {
  status: ClientStatus;
  decisionNotes?: string;
}
