import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import type {
  BranchRecord,
  DepartmentRecord,
  EmployeeRecord,
  PermissionRecord,
  PositionRecord,
  RoleRecord,
} from './mock-organization.repository';
import type {
  DepartmentCreateInput,
  DepartmentUpdateInput,
  EmployeeCreateInput,
  EmployeeUpdateInput,
  OrganizationOverview,
  OrganizationRepository,
} from './organization.repository';

const departmentInclude = {
  manager: { select: { id: true, fullName: true } },
  employees: { select: { id: true } },
} as const;

const branchInclude = {
  departments: { include: { employees: { select: { id: true } } } },
} as const;

const positionInclude = { employees: { select: { id: true } } } as const;

const employeeInclude = {
  department: true,
  position: true,
  roles: { include: { role: true } },
  refreshSessions: {
    where: { isRevoked: false, expiresAt: { gt: new Date() } },
    select: { id: true },
  },
} as const;

const roleInclude = {
  users: { select: { userId: true } },
  permissions: { include: { permission: true } },
} as const;

type PersistedEmployee = Prisma.UserGetPayload<{ include: typeof employeeInclude }>;
type PersistedRole = Prisma.RoleGetPayload<{ include: typeof roleInclude }>;

@Injectable()
export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async overview(): Promise<OrganizationOverview> {
    const [employees, departments, branches] = await Promise.all([
      this.listEmployees(),
      this.listDepartments(),
      this.listBranches(),
    ]);
    const active = employees.filter((employee) => employee.status === 'ACTIVE');
    const director = active[0] ?? emptyLeader('director');
    const deputyDirector = active[1] ?? emptyLeader('deputy');
    return {
      director: {
        id: director.id,
        name: director.fullName,
        title: director.positionTitle,
        initials: initials(director.fullName),
      },
      deputyDirector: {
        id: deputyDirector.id,
        name: deputyDirector.fullName,
        title: deputyDirector.positionTitle,
        initials: initials(deputyDirector.fullName),
      },
      departments,
      branches,
      totalEmployees: employees.length,
      activeEmployees: active.length,
    };
  }

  async listDepartments(): Promise<DepartmentRecord[]> {
    const departments = await this.prisma.department.findMany({
      include: departmentInclude,
      orderBy: { name: 'asc' },
    });
    return departments.map((department) => ({
      id: department.id,
      code: department.code,
      name: department.name,
      description: department.description ?? '',
      managerName: department.manager?.fullName,
      employeeCount: department.employees.length,
      createdAt: department.createdAt.toISOString(),
    }));
  }

  async listBranches(): Promise<BranchRecord[]> {
    const branches = await this.prisma.branch.findMany({
      include: branchInclude,
      orderBy: { name: 'asc' },
    });
    return branches.map((branch) => ({
      id: branch.id,
      code: branch.code,
      name: branch.name,
      city: branch.city,
      address: branch.address,
      status: branch.status,
      employeeCount: branch.departments.reduce(
        (total, department) => total + department.employees.length,
        0,
      ),
      createdAt: branch.createdAt.toISOString(),
    }));
  }

  async listPositions(): Promise<PositionRecord[]> {
    const positions = await this.prisma.position.findMany({
      include: positionInclude,
      orderBy: { level: 'asc' },
    });
    return positions.map((position) => ({
      id: position.id,
      code: position.code,
      title: position.title,
      level: position.level,
      createdAt: position.createdAt.toISOString(),
    }));
  }

  async listEmployees(): Promise<EmployeeRecord[]> {
    const employees = await this.prisma.user.findMany({
      where: { deletedAt: null },
      include: employeeInclude,
      orderBy: { fullName: 'asc' },
    });
    return employees.map((employee) => this.toEmployee(employee));
  }

  async listRoles(): Promise<RoleRecord[]> {
    const roles = await this.prisma.role.findMany({
      include: roleInclude,
      orderBy: { name: 'asc' },
    });
    return roles.map((role) => this.toRole(role));
  }

  async listPermissions(): Promise<PermissionRecord[]> {
    const permissions = await this.prisma.permission.findMany({ orderBy: { code: 'asc' } });
    return permissions.map((permission) => ({
      id: permission.id,
      code: permission.code,
      name: permission.code,
      module: normalizeModule(permission.module),
      description: permission.description ?? '',
      isSensitive:
        permission.module === 'audit' ||
        permission.module === 'user' ||
        permission.module === 'role',
    }));
  }

  async createDepartment(input: DepartmentCreateInput): Promise<DepartmentRecord> {
    const department = await this.prisma.department.create({
      data: {
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        description: input.description?.trim(),
      },
      include: departmentInclude,
    });
    return {
      id: department.id,
      code: department.code,
      name: department.name,
      description: department.description ?? '',
      managerName: department.manager?.fullName,
      employeeCount: department.employees.length,
      createdAt: department.createdAt.toISOString(),
    };
  }

  async updateDepartment(id: string, input: DepartmentUpdateInput): Promise<DepartmentRecord> {
    await this.ensureDepartment(id);
    const department = await this.prisma.department.update({
      where: { id },
      data: {
        code: input.code?.trim().toUpperCase(),
        name: input.name?.trim(),
        description: input.description?.trim(),
      },
      include: departmentInclude,
    });
    return {
      id: department.id,
      code: department.code,
      name: department.name,
      description: department.description ?? '',
      managerName: department.manager?.fullName,
      employeeCount: department.employees.length,
      createdAt: department.createdAt.toISOString(),
    };
  }

  async createEmployee(input: EmployeeCreateInput): Promise<EmployeeRecord> {
    const [department, position, roles] = await Promise.all([
      this.prisma.department.findUnique({ where: { id: input.departmentId } }),
      this.prisma.position.findUnique({ where: { id: input.positionId } }),
      this.prisma.role.findMany({
        where: { name: { in: input.roles } },
        select: { id: true, name: true },
      }),
    ]);
    if (!department || !position)
      throw new NotFoundException('Phòng ban hoặc chức danh không tồn tại.');
    if (roles.length !== new Set(input.roles).size)
      throw new NotFoundException('Một hoặc nhiều vai trò không tồn tại.');

    const passwordHash = await bcrypt.hash(randomUUID(), 12);
    const employee = await this.prisma.user.create({
      data: {
        employeeCode: input.employeeCode.trim(),
        fullName: input.fullName.trim(),
        email: input.email.toLowerCase(),
        phone: input.phone,
        passwordHash,
        startDate: new Date(`${input.startDate}T00:00:00.000Z`),
        department: { connect: { id: department.id } },
        position: { connect: { id: position.id } },
        manager: input.managerId ? { connect: { id: input.managerId } } : undefined,
        roles: { create: roles.map((role) => ({ role: { connect: { id: role.id } } })) },
      },
      include: employeeInclude,
    });
    return this.toEmployee(employee);
  }

  async updateEmployee(id: string, input: EmployeeUpdateInput): Promise<EmployeeRecord> {
    await this.ensureEmployee(id);
    const employee = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: input.fullName,
        email: input.email?.toLowerCase(),
        phone: input.phone,
        status: input.status as UserStatus | undefined,
        department: input.departmentId ? { connect: { id: input.departmentId } } : undefined,
        position: input.positionId ? { connect: { id: input.positionId } } : undefined,
      },
      include: employeeInclude,
    });
    return this.toEmployee(employee);
  }

  async updateRolePermissions(id: string, permissions: string[]): Promise<RoleRecord> {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Không tìm thấy vai trò.');
    const selected = await this.prisma.permission.findMany({
      where: { code: { in: permissions } },
      select: { id: true, code: true },
    });
    if (selected.length !== new Set(permissions).size)
      throw new NotFoundException('Một hoặc nhiều quyền không tồn tại.');
    await this.prisma.$transaction(async (transaction) => {
      await transaction.rolePermission.deleteMany({ where: { roleId: id } });
      if (selected.length)
        await transaction.rolePermission.createMany({
          data: selected.map((permission) => ({ roleId: id, permissionId: permission.id })),
        });
    });
    const updated = await this.prisma.role.findUniqueOrThrow({
      where: { id },
      include: roleInclude,
    });
    return this.toRole(updated);
  }

  private async ensureDepartment(id: string): Promise<void> {
    const department = await this.prisma.department.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!department) throw new NotFoundException('Không tìm thấy phòng ban.');
  }

  private async ensureEmployee(id: string): Promise<void> {
    const employee = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!employee) throw new NotFoundException('Không tìm thấy nhân sự.');
  }

  private toEmployee(employee: PersistedEmployee): EmployeeRecord {
    return {
      id: employee.id,
      employeeCode: employee.employeeCode ?? employee.id,
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone ?? '',
      departmentId: employee.departmentId ?? '',
      departmentName: employee.department?.name ?? '',
      positionId: employee.positionId ?? '',
      positionTitle: employee.position?.title ?? '',
      roles: employee.roles.map(({ role }) => role.name),
      status: employee.status,
      startDate: employee.startDate?.toISOString().slice(0, 10) ?? '',
      activeSessionsCount: employee.refreshSessions.length,
      mfaEnabled: employee.mfaEnabled,
      createdAt: employee.createdAt.toISOString(),
    };
  }

  private toRole(role: PersistedRole): RoleRecord {
    return {
      id: role.id,
      name: role.name,
      displayName: role.name,
      description: role.description ?? '',
      isSystem: role.isSystem,
      userCount: role.users.length,
      permissions: role.permissions.map(({ permission }) => permission.code),
    };
  }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function emptyLeader(id: string): EmployeeRecord {
  return {
    id,
    employeeCode: '',
    fullName: 'Chưa phân công',
    email: '',
    phone: '',
    departmentId: '',
    departmentName: '',
    positionId: '',
    positionTitle: '',
    roles: [],
    status: 'ACTIVE',
    startDate: '',
    activeSessionsCount: 0,
    mfaEnabled: false,
    createdAt: new Date(0).toISOString(),
  };
}

function normalizeModule(module: string): PermissionRecord['module'] {
  if (
    module === 'matter' ||
    module === 'client' ||
    module === 'document' ||
    module === 'task' ||
    module === 'audit' ||
    module === 'user' ||
    module === 'system'
  )
    return module;
  return 'system';
}
