import type { UserRole, UserStatus } from './auth';

export type OrganizationUnitStatus = 'ACTIVE' | 'INACTIVE' | 'PLANNED';

export interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  address?: string;
  managerName?: string;
  employeeCount: number;
  status: OrganizationUnitStatus;
  createdAt: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  managerId?: string;
  managerName?: string;
  employeeCount: number;
  createdAt: string;
}

export interface Position {
  id: string;
  code: string;
  title: string;
  level: number;
  description?: string;
  departmentId?: string;
  createdAt: string;
}

export interface OrganizationExecutive {
  id: string;
  name: string;
  title: string;
  initials: string;
}

export interface OrganizationOverview {
  director: OrganizationExecutive;
  deputyDirector?: OrganizationExecutive;
  departments: Department[];
  branches: Branch[];
  totalEmployees: number;
  activeEmployees: number;
}

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  departmentId: string;
  departmentName: string;
  positionId: string;
  positionTitle: string;
  managerId?: string;
  managerName?: string;
  roles: UserRole[];
  status: UserStatus;
  startDate: string;
  endDate?: string;
  activeSessionsCount: number;
  mfaEnabled: boolean;
  createdAt: string;
}

export interface CreateEmployeePayload {
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  departmentId: string;
  positionId: string;
  managerId?: string;
  roles: UserRole[];
  startDate: string;
}

export interface UpdateEmployeePayload extends Partial<CreateEmployeePayload> {
  status?: UserStatus;
}

export interface PermissionDefinition {
  id: string;
  code: string;
  name: string;
  module: 'matter' | 'client' | 'document' | 'task' | 'audit' | 'user' | 'system';
  description: string;
  isSensitive?: boolean;
}

export interface RoleDefinition {
  id: string;
  name: UserRole;
  displayName: string;
  description: string;
  isSystem: boolean;
  userCount: number;
  permissions: string[]; // Permission codes array
}

export interface UpdateRolePermissionsPayload {
  roleId: string;
  permissions: string[];
}
