import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const roles = [
  'SYSTEM_ADMIN',
  'MANAGING_PARTNER',
  'PARTNER',
  'LAWYER',
  'PARALEGAL',
  'INTERN',
  'ACCOUNTANT',
  'ADMIN_STAFF',
  'RECEPTIONIST',
  'EXTERNAL_COLLABORATOR',
];

const permissions = [
  ['client.read', 'client'],
  ['client.create', 'client'],
  ['client.update', 'client'],
  ['conflict.check', 'conflict'],
  ['conflict.review', 'conflict'],
  ['matter.read', 'matter'],
  ['matter.read_all', 'matter'],
  ['matter.create', 'matter'],
  ['matter.update', 'matter'],
  ['matter.manage_members', 'matter'],
  ['matter.archive', 'matter'],
  ['task.read', 'task'],
  ['task.create', 'task'],
  ['task.assign', 'task'],
  ['task.update', 'task'],
  ['document.read', 'document'],
  ['document.upload', 'document'],
  ['document.download', 'document'],
  ['document.delete', 'document'],
  ['document.purge', 'document'],
  ['audit.read', 'audit'],
  ['user.manage', 'user'],
  ['role.manage', 'role'],
] as const;

const defaultRolePermissions: Record<string, string[]> = {
  SYSTEM_ADMIN: [
    'user.manage',
    'role.manage',
    'audit.read',
    'client.read',
    'matter.read',
    'matter.read_all',
    'document.read',
    'document.download',
    'document.purge',
  ],
  MANAGING_PARTNER: [
    'user.manage',
    'role.manage',
    'audit.read',
    'client.read',
    'client.create',
    'client.update',
    'conflict.check',
    'conflict.review',
    'matter.read',
    'matter.read_all',
    'matter.create',
    'matter.update',
    'matter.manage_members',
    'matter.archive',
    'task.read',
    'task.create',
    'task.assign',
    'task.update',
    'document.read',
    'document.upload',
    'document.download',
    'document.delete',
  ],
  PARTNER: [
    'client.read',
    'client.create',
    'client.update',
    'conflict.check',
    'conflict.review',
    'matter.read',
    'matter.create',
    'matter.update',
    'matter.manage_members',
    'matter.archive',
    'task.read',
    'task.create',
    'task.assign',
    'task.update',
    'document.read',
    'document.upload',
    'document.download',
    'document.delete',
  ],
  LAWYER: [
    'client.read',
    'client.create',
    'client.update',
    'conflict.check',
    'matter.read',
    'matter.create',
    'matter.update',
    'task.read',
    'task.create',
    'task.assign',
    'task.update',
    'document.read',
    'document.upload',
    'document.download',
  ],
  PARALEGAL: [
    'client.read',
    'conflict.check',
    'matter.read',
    'task.read',
    'task.create',
    'document.read',
    'document.upload',
    'document.download',
  ],
  INTERN: ['matter.read', 'task.read', 'document.read'],
  ACCOUNTANT: ['client.read', 'task.read', 'document.read'],
  ADMIN_STAFF: ['client.read', 'client.create', 'client.update', 'document.read'],
  RECEPTIONIST: ['client.read', 'client.create', 'document.read'],
  EXTERNAL_COLLABORATOR: ['matter.read', 'document.read'],
};

const practiceAreas = [
  ['CORPORATE', 'Doanh nghiệp'],
  ['LITIGATION', 'Tranh tụng'],
  ['INVESTMENT', 'Đầu tư'],
  ['CONTRACT', 'Hợp đồng'],
  ['COMPLIANCE', 'Tuân thủ'],
] as const;

async function main(): Promise<void> {
  await prisma.role.createMany({
    data: roles.map((name) => ({ name, isSystem: true })),
    skipDuplicates: true,
  });
  await prisma.permission.createMany({
    data: permissions.map(([code, module]) => ({ code, module })),
    skipDuplicates: true,
  });
  await prisma.practiceArea.createMany({
    data: practiceAreas.map(([code, name]) => ({ code, name, isActive: true })),
    skipDuplicates: true,
  });

  const seededRoles = await prisma.role.findMany({ select: { id: true, name: true } });
  const seededPermissions = await prisma.permission.findMany({ select: { id: true, code: true } });
  const permissionByCode = new Map(
    seededPermissions.map((permission) => [permission.code, permission.id]),
  );
  const rolePermissions: Array<{ roleId: string; permissionId: string }> = [];
  for (const role of seededRoles) {
    const desiredPermissionIds = (defaultRolePermissions[role.name] ?? [])
      .map((code) => permissionByCode.get(code))
      .filter((permissionId): permissionId is string => Boolean(permissionId));
    if (defaultRolePermissions[role.name]) {
      await prisma.rolePermission.deleteMany({
        where: {
          roleId: role.id,
          permissionId: { notIn: desiredPermissionIds },
        },
      });
    }
    rolePermissions.push(
      ...desiredPermissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
    );
  }
  await prisma.rolePermission.createMany({ data: rolePermissions, skipDuplicates: true });

  const admin = seededRoles.find((role) => role.name === 'SYSTEM_ADMIN');
  if (!admin) throw new Error('SYSTEM_ADMIN role was not seeded');

  const seedEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const seedPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!seedEmail || !seedPassword) return;

  const existing = await prisma.user.findUnique({ where: { email: seedEmail } });
  const user =
    existing ??
    (await prisma.user.create({
      data: {
        email: seedEmail,
        passwordHash: await bcrypt.hash(seedPassword, 12),
        fullName: process.env.SEED_ADMIN_NAME?.trim() || 'LPMS System Administrator',
        status: 'ACTIVE',
      },
    }));

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: admin.id } },
    create: { userId: user.id, roleId: admin.id },
    update: {},
  });
}

void main().finally(async () => prisma.$disconnect());
