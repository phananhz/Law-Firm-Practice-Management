import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { OrganizationRepository } from './organization.repository';

export type DepartmentRecord = {
  id: string;
  code: string;
  name: string;
  description: string;
  managerName?: string;
  employeeCount: number;
  createdAt: string;
};

export type BranchRecord = {
  id: string;
  code: string;
  name: string;
  city: string;
  address: string;
  managerName?: string;
  employeeCount: number;
  status: 'ACTIVE' | 'INACTIVE' | 'PLANNED';
  createdAt: string;
};

export type PositionRecord = {
  id: string;
  code: string;
  title: string;
  level: number;
  createdAt: string;
};

export type EmployeeRecord = {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  departmentId: string;
  departmentName: string;
  positionId: string;
  positionTitle: string;
  roles: string[];
  status: 'ACTIVE' | 'SUSPENDED' | 'RESIGNED';
  startDate: string;
  activeSessionsCount: number;
  mfaEnabled: boolean;
  createdAt: string;
};

export type RoleRecord = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  userCount: number;
  permissions: string[];
};

export type PermissionRecord = {
  id: string;
  code: string;
  name: string;
  module: 'matter' | 'client' | 'document' | 'task' | 'audit' | 'user' | 'system';
  description: string;
  isSensitive?: boolean;
};

@Injectable()
export class MockOrganizationRepository implements OrganizationRepository {
  private departments: DepartmentRecord[] = [
    {
      id: 'dep-lit',
      code: 'LIT',
      name: 'Phòng Hồ sơ Tố tụng',
      description: 'Xử lý tranh chấp tại tòa án, trọng tài và các thủ tục tố tụng liên quan.',
      managerName: 'Trần Văn Luật',
      employeeCount: 8,
      createdAt: '2024-01-15T00:00:00.000Z',
    },
    {
      id: 'dep-corp',
      code: 'CORP',
      name: 'Phòng Hồ sơ Doanh nghiệp',
      description: 'Tư vấn doanh nghiệp, đầu tư, mua bán và sáp nhập doanh nghiệp.',
      managerName: 'Đặng Doanh Nghiệp',
      employeeCount: 12,
      createdAt: '2024-01-15T00:00:00.000Z',
    },
    {
      id: 'dep-service',
      code: 'SERVICE',
      name: 'Phòng Hồ sơ Dịch vụ',
      description: 'Tiếp nhận và xử lý hồ sơ dịch vụ pháp lý thường xuyên cho khách hàng.',
      managerName: 'Lê Thị Dịch',
      employeeCount: 6,
      createdAt: '2024-02-01T00:00:00.000Z',
    },
    {
      id: 'dep-admin',
      code: 'ADMIN',
      name: 'Văn phòng & Hành chính',
      description: 'Nhân sự, tổ chức, vận hành, kế toán và hỗ trợ nội bộ.',
      managerName: 'Nguyễn Văn Trường',
      employeeCount: 4,
      createdAt: '2024-01-15T00:00:00.000Z',
    },
  ];

  private readonly branches: BranchRecord[] = [
    {
      id: 'branch-hcm',
      code: 'HCM',
      name: 'Chi nhánh Sài Gòn',
      city: 'TP. Hồ Chí Minh',
      address: 'Quận 1, TP. Hồ Chí Minh',
      managerName: 'Nguyễn Văn Trường',
      employeeCount: 18,
      status: 'ACTIVE',
      createdAt: '2024-01-15T00:00:00.000Z',
    },
    {
      id: 'branch-dna',
      code: 'DNI',
      name: 'Chi nhánh Đồng Nai',
      city: 'Đồng Nai',
      address: 'Biên Hòa, Đồng Nai',
      managerName: 'Trần Thị Phó',
      employeeCount: 7,
      status: 'ACTIVE',
      createdAt: '2025-04-10T00:00:00.000Z',
    },
    {
      id: 'branch-cto',
      code: 'CTO',
      name: 'Chi nhánh Cần Thơ',
      city: 'Cần Thơ',
      address: 'Ninh Kiều, Cần Thơ',
      managerName: 'Lê Hoàng Nam',
      employeeCount: 4,
      status: 'PLANNED',
      createdAt: '2026-02-01T00:00:00.000Z',
    },
  ];

  private readonly positions: PositionRecord[] = [
    {
      id: 'pos-1',
      code: 'DIR',
      title: 'Giám đốc',
      level: 1,
      createdAt: '2024-01-15T00:00:00.000Z',
    },
    {
      id: 'pos-2',
      code: 'DDE',
      title: 'Phó giám đốc',
      level: 2,
      createdAt: '2024-01-15T00:00:00.000Z',
    },
    {
      id: 'pos-3',
      code: 'PART',
      title: 'Luật sư thành viên',
      level: 3,
      createdAt: '2024-01-15T00:00:00.000Z',
    },
    { id: 'pos-4', code: 'LAW', title: 'Luật sư', level: 4, createdAt: '2024-01-15T00:00:00.000Z' },
    {
      id: 'pos-5',
      code: 'PARA',
      title: 'Trợ lý pháp lý',
      level: 5,
      createdAt: '2024-01-15T00:00:00.000Z',
    },
    {
      id: 'pos-6',
      code: 'OPS',
      title: 'Nhân viên vận hành',
      level: 6,
      createdAt: '2024-01-15T00:00:00.000Z',
    },
  ];

  private employees: EmployeeRecord[] = [
    {
      id: 'emp-1',
      employeeCode: 'EMP-001',
      fullName: 'Nguyễn Văn Trường',
      email: 'truong.nguyen@lpms.vn',
      phone: '0903123456',
      departmentId: 'dep-admin',
      departmentName: 'Văn phòng & Hành chính',
      positionId: 'pos-1',
      positionTitle: 'Giám đốc',
      roles: ['MANAGING_PARTNER'],
      status: 'ACTIVE',
      startDate: '2020-01-01',
      activeSessionsCount: 2,
      mfaEnabled: true,
      createdAt: '2020-01-01T00:00:00.000Z',
    },
    {
      id: 'emp-2',
      employeeCode: 'EMP-002',
      fullName: 'Trần Thị Phó',
      email: 'pho.tran@lpms.vn',
      phone: '0918987654',
      departmentId: 'dep-admin',
      departmentName: 'Văn phòng & Hành chính',
      positionId: 'pos-2',
      positionTitle: 'Phó giám đốc',
      roles: ['PARTNER'],
      status: 'ACTIVE',
      startDate: '2021-01-01',
      activeSessionsCount: 1,
      mfaEnabled: true,
      createdAt: '2021-01-01T00:00:00.000Z',
    },
    {
      id: 'emp-3',
      employeeCode: 'EMP-003',
      fullName: 'Trần Văn Luật',
      email: 'luat.tran@lpms.vn',
      phone: '0909123456',
      departmentId: 'dep-lit',
      departmentName: 'Phòng Hồ sơ Tố tụng',
      positionId: 'pos-3',
      positionTitle: 'Luật sư thành viên',
      roles: ['PARTNER'],
      status: 'ACTIVE',
      startDate: '2022-01-01',
      activeSessionsCount: 1,
      mfaEnabled: false,
      createdAt: '2022-01-01T00:00:00.000Z',
    },
    {
      id: 'emp-4',
      employeeCode: 'EMP-004',
      fullName: 'Lê Thị Dịch',
      email: 'dich.le@lpms.vn',
      phone: '0912345678',
      departmentId: 'dep-service',
      departmentName: 'Phòng Hồ sơ Dịch vụ',
      positionId: 'pos-3',
      positionTitle: 'Luật sư thành viên',
      roles: ['PARTNER'],
      status: 'ACTIVE',
      startDate: '2022-04-01',
      activeSessionsCount: 1,
      mfaEnabled: false,
      createdAt: '2022-04-01T00:00:00.000Z',
    },
  ];

  private readonly permissions: PermissionRecord[] = [
    {
      id: 'perm-1',
      code: 'matter.read',
      name: 'Xem hồ sơ',
      module: 'matter',
      description: 'Xem các hồ sơ được cấp quyền.',
    },
    {
      id: 'perm-2',
      code: 'matter.write',
      name: 'Cập nhật hồ sơ',
      module: 'matter',
      description: 'Tạo và cập nhật hồ sơ.',
    },
    {
      id: 'perm-3',
      code: 'client.read',
      name: 'Xem khách hàng',
      module: 'client',
      description: 'Xem danh mục khách hàng.',
    },
    {
      id: 'perm-4',
      code: 'task.assign',
      name: 'Giao nhiệm vụ',
      module: 'task',
      description: 'Giao và điều phối nhiệm vụ.',
    },
    {
      id: 'perm-5',
      code: 'user.manage',
      name: 'Quản trị người dùng',
      module: 'user',
      description: 'Quản lý người dùng và nhân sự.',
      isSensitive: true,
    },
    {
      id: 'perm-6',
      code: 'audit.read',
      name: 'Xem nhật ký',
      module: 'audit',
      description: 'Xem nhật ký hoạt động.',
      isSensitive: true,
    },
  ];

  private roles: RoleRecord[] = [
    {
      id: 'role-admin',
      name: 'SYSTEM_ADMIN',
      displayName: 'Quản trị hệ thống',
      description: 'Toàn quyền cấu hình hệ thống.',
      isSystem: true,
      userCount: 1,
      permissions: this.permissions.map((permission) => permission.code),
    },
    {
      id: 'role-partner',
      name: 'PARTNER',
      displayName: 'Luật sư thành viên',
      description: 'Quản lý hồ sơ và phê duyệt nghiệp vụ.',
      isSystem: true,
      userCount: 3,
      permissions: ['matter.read', 'matter.write', 'client.read', 'task.assign'],
    },
    {
      id: 'role-lawyer',
      name: 'LAWYER',
      displayName: 'Luật sư',
      description: 'Thực hiện công việc được phân công.',
      isSystem: true,
      userCount: 8,
      permissions: ['matter.read', 'matter.write', 'client.read'],
    },
  ];

  listDepartments() {
    return this.departments.map((item) => ({ ...item }));
  }
  listBranches() {
    return this.branches.map((item) => ({ ...item }));
  }
  listPositions() {
    return this.positions.map((item) => ({ ...item }));
  }
  listEmployees() {
    return this.employees.map((item) => ({ ...item }));
  }
  listRoles() {
    return this.roles.map((item) => ({ ...item, permissions: [...item.permissions] }));
  }
  listPermissions() {
    return this.permissions.map((item) => ({ ...item }));
  }

  overview() {
    const activeEmployees = this.employees.filter(
      (employee) => employee.status === 'ACTIVE',
    ).length;
    return {
      director: { id: 'emp-1', name: 'Nguyễn Văn Trường', title: 'Giám đốc', initials: 'NT' },
      deputyDirector: { id: 'emp-2', name: 'Trần Thị Phó', title: 'Phó giám đốc', initials: 'TP' },
      departments: this.listDepartments(),
      branches: this.listBranches(),
      totalEmployees: this.employees.length,
      activeEmployees,
    };
  }

  createDepartment(input: {
    code: string;
    name: string;
    description?: string;
    managerName?: string;
  }) {
    const department: DepartmentRecord = {
      id: randomUUID(),
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      description: input.description?.trim() || '',
      managerName: input.managerName?.trim() || undefined,
      employeeCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.departments.push(department);
    return { ...department };
  }

  updateDepartment(id: string, input: Partial<DepartmentRecord>) {
    const index = this.departments.findIndex((department) => department.id === id);
    if (index < 0) throw new NotFoundException('Không tìm thấy phòng ban.');
    this.departments[index] = { ...this.departments[index], ...input, id };
    return { ...this.departments[index] };
  }

  createEmployee(input: {
    employeeCode: string;
    fullName: string;
    email: string;
    phone: string;
    departmentId: string;
    positionId: string;
    roles: string[];
    startDate: string;
  }) {
    const department = this.departments.find((item) => item.id === input.departmentId);
    const position = this.positions.find((item) => item.id === input.positionId);
    if (!department || !position)
      throw new NotFoundException('Phòng ban hoặc chức danh không tồn tại.');
    const employee: EmployeeRecord = {
      id: randomUUID(),
      employeeCode: input.employeeCode,
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      phone: input.phone,
      departmentId: department.id,
      departmentName: department.name,
      positionId: position.id,
      positionTitle: position.title,
      roles: [...input.roles],
      status: 'ACTIVE',
      startDate: input.startDate,
      activeSessionsCount: 0,
      mfaEnabled: false,
      createdAt: new Date().toISOString(),
    };
    this.employees.unshift(employee);
    department.employeeCount += 1;
    return { ...employee };
  }

  updateEmployee(id: string, input: Partial<EmployeeRecord>) {
    const index = this.employees.findIndex((employee) => employee.id === id);
    if (index < 0) throw new NotFoundException('Không tìm thấy nhân sự.');
    this.employees[index] = { ...this.employees[index], ...input, id };
    return { ...this.employees[index] };
  }

  updateRolePermissions(id: string, permissions: string[]) {
    const role = this.roles.find((item) => item.id === id);
    if (!role) throw new NotFoundException('Không tìm thấy vai trò.');
    role.permissions = [...permissions];
    return { ...role, permissions: [...role.permissions] };
  }
}
