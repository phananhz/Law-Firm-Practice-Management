import type { UserRole, UserSummary } from '@lpms/types';

export type ActorKind = 'admin' | 'director' | 'employee';

export type ActorMeta = {
  kind: ActorKind;
  label: string;
  shortLabel: string;
  description: string;
  homeLabel: string;
};

const ACTOR_META: Record<ActorKind, ActorMeta> = {
  admin: {
    kind: 'admin',
    label: 'Quản trị hệ thống',
    shortLabel: 'Admin',
    description: 'Vận hành tài khoản, cấu hình và an toàn hệ thống',
    homeLabel: 'Trung tâm quản trị',
  },
  director: {
    kind: 'director',
    label: 'Giám đốc',
    shortLabel: 'Giám đốc',
    description: 'Điều hành hoạt động, hồ sơ và phân công của văn phòng',
    homeLabel: 'Tổng quan điều hành',
  },
  employee: {
    kind: 'employee',
    label: 'Nhân viên',
    shortLabel: 'Nhân viên',
    description: 'Theo dõi công việc và hồ sơ được phân quyền',
    homeLabel: 'Công việc của tôi',
  },
};

/**
 * The product has ten configurable RBAC roles, while the UI intentionally
 * exposes only three workspaces. This mapping is presentation-only: API
 * authorization still uses the original role and resource permissions.
 */
export function getActorKind(roles?: readonly UserRole[] | readonly string[]): ActorKind {
  if (roles?.includes('SYSTEM_ADMIN')) return 'admin';
  if (roles?.includes('MANAGING_PARTNER')) return 'director';
  return 'employee';
}

export function getActorMeta(roles?: readonly UserRole[] | readonly string[]): ActorMeta {
  return ACTOR_META[getActorKind(roles)];
}

export function hasRole(user: UserSummary | null | undefined, ...roles: UserRole[]) {
  return roles.some((role) => user?.roles.includes(role));
}

export function canOpenPath(pathname: string, user: UserSummary | null | undefined) {
  const roles = user?.roles ?? [];
  const actor = getActorKind(roles);

  if (pathname === '/access-denied') return true;

  const adminOnly = [
    '/administration',
    '/administration/users',
    '/administration/roles',
    '/sessions',
    '/audit',
  ];
  if (pathname === '/organization' || pathname.startsWith('/administration/organization')) {
    return actor === 'admin' || actor === 'director';
  }
  if (adminOnly.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return actor === 'admin';
  }

  if (pathname === '/reports' || pathname.startsWith('/reports/')) {
    return actor === 'admin' || actor === 'director' || roles.includes('PARTNER');
  }

  // Conflict checks are intentionally not part of the global navigation, but
  // remain available in the intake workflow to roles that can initiate/review.
  if (pathname === '/conflict-checks' || pathname.startsWith('/conflict-checks/')) {
    return roles.some((role) =>
      ['MANAGING_PARTNER', 'PARTNER', 'LAWYER', 'PARALEGAL'].includes(role),
    );
  }

  return actor === 'admin' || actor === 'director' || actor === 'employee';
}

export function getActorWorkspaceLabel(user: UserSummary | null | undefined) {
  return getActorMeta(user?.roles).shortLabel;
}
