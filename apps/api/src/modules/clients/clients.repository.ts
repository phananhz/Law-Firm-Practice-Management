export type ClientType = 'INDIVIDUAL' | 'ORGANIZATION';
export type ClientStatus =
  'NEW' | 'IN_REVIEW' | 'CONFLICT_CHECK' | 'APPROVED' | 'ACTIVE' | 'REJECTED';

export type ContactRecord = {
  id: string;
  clientId: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  idNumber?: string;
  isPrimary?: boolean;
  notes?: string;
  createdAt: string;
};

export type RelationRecord = {
  id: string;
  sourceClientId: string;
  targetClientId?: string;
  targetName: string;
  relationType: string;
  ownershipPercentage?: number;
  notes?: string;
  createdAt: string;
};

export type ClientRecord = {
  id: string;
  clientCode: string;
  type: ClientType;
  status: ClientStatus;
  displayName: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  createdAt: string;
  taxCode?: string;
  enterpriseNumber?: string;
  legalRepresentative?: string;
  website?: string;
  industry?: string;
  nationality?: string;
  idNumber?: string;
  occupation?: string;
  mattersCount: number;
  contactsCount: number;
  contacts: ContactRecord[];
  relations: RelationRecord[];
};

export type ClientCreateInput = {
  type: ClientType;
  displayName: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  nationality?: string;
  idNumber?: string;
  occupation?: string;
  taxCode?: string;
  enterpriseNumber?: string;
  legalRepresentative?: string;
  website?: string;
  industry?: string;
};

export type ClientUpdateInput = Partial<
  Pick<
    ClientRecord,
    | 'displayName'
    | 'email'
    | 'phone'
    | 'address'
    | 'notes'
    | 'legalRepresentative'
    | 'website'
    | 'industry'
  >
>;

export type ContactCreateInput = Omit<ContactRecord, 'id' | 'clientId' | 'createdAt'>;
export type MaybePromise<T> = T | Promise<T>;

export interface ClientsRepository {
  list(): MaybePromise<ClientRecord[]>;
  find(id: string): MaybePromise<ClientRecord>;
  create(input: ClientCreateInput): MaybePromise<ClientRecord>;
  update(id: string, input: ClientUpdateInput): MaybePromise<ClientRecord>;
  changeStatus(id: string, status: ClientStatus): MaybePromise<ClientRecord>;
  contacts(id: string): MaybePromise<ContactRecord[]>;
  addContact(id: string, input: ContactCreateInput): MaybePromise<ContactRecord>;
  relations(id: string): MaybePromise<RelationRecord[]>;
}

export const CLIENTS_REPOSITORY = Symbol('CLIENTS_REPOSITORY');
