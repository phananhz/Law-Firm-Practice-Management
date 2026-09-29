import type {
  BranchRecord,
  DepartmentRecord,
  EmployeeRecord,
  PermissionRecord,
  PositionRecord,
  RoleRecord,
} from './mock-organization.repository';

export type OrganizationOverview = {
  director: { id: string; name: string; title: string; initials: string };
  deputyDirector: { id: string; name: string; title: string; initials: string };
  departments: DepartmentRecord[];
  branches: BranchRecord[];
  totalEmployees: number;
  activeEmployees: number;
};

export type DepartmentCreateInput = {
  code: string;
  name: string;
  description?: string;
  managerName?: string;
};

export type DepartmentUpdateInput = Partial<DepartmentCreateInput>;

export type EmployeeCreateInput = {
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  departmentId: string;
  positionId: string;
  managerId?: string;
  roles: string[];
  startDate: string;
};

export type EmployeeUpdateInput = Partial<
  Pick<EmployeeRecord, 'fullName' | 'email' | 'phone' | 'status'>
> & {
  departmentId?: string;
  positionId?: string;
};

export type MaybePromise<T> = T | Promise<T>;

export interface OrganizationRepository {
  overview(): MaybePromise<OrganizationOverview>;
  listDepartments(): MaybePromise<DepartmentRecord[]>;
  listBranches(): MaybePromise<BranchRecord[]>;
  listPositions(): MaybePromise<PositionRecord[]>;
  listEmployees(): MaybePromise<EmployeeRecord[]>;
  listRoles(): MaybePromise<RoleRecord[]>;
  listPermissions(): MaybePromise<PermissionRecord[]>;
  createDepartment(input: DepartmentCreateInput): MaybePromise<DepartmentRecord>;
  updateDepartment(id: string, input: DepartmentUpdateInput): MaybePromise<DepartmentRecord>;
  createEmployee(input: EmployeeCreateInput): MaybePromise<EmployeeRecord>;
  updateEmployee(id: string, input: EmployeeUpdateInput): MaybePromise<EmployeeRecord>;
  updateRolePermissions(id: string, permissions: string[]): MaybePromise<RoleRecord>;
}

export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');
