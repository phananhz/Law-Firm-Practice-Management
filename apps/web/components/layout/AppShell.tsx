'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { UserRole, UserSummary } from '@lpms/types';
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { canOpenPath, getActorKind, getActorMeta, type ActorKind } from '@/lib/actor';

type NavigationItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  roles?: UserRole[];
};

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

const navigationByActor: Record<ActorKind, NavigationGroup[]> = {
  admin: [
    {
      label: 'Tổng quan',
      items: [{ label: 'Dashboard', href: '/', icon: LayoutDashboard }],
    },
    {
      label: 'Vận hành hệ thống',
      items: [
        { label: 'Người dùng', href: '/administration/users', icon: UserRound },
        { label: 'Vai trò & quyền', href: '/administration/roles', icon: Settings },
        { label: 'Tổ chức & phòng ban', href: '/organization', icon: Building2 },
      ],
    },
    {
      label: 'Giám sát',
      items: [
        { label: 'Nhật ký hoạt động', href: '/audit', icon: Activity },
        { label: 'Phiên đăng nhập', href: '/sessions', icon: ShieldCheck },
        { label: 'Thông báo', href: '/notifications', icon: Bell },
      ],
    },
  ],
  director: [
    {
      label: 'Tổng quan',
      items: [{ label: 'Dashboard', href: '/', icon: LayoutDashboard }],
    },
    {
      label: 'Điều hành nghiệp vụ',
      items: [
        { label: 'Khách hàng', href: '/clients', icon: Users },
        { label: 'Hồ sơ vụ việc', href: '/matters', icon: BriefcaseBusiness },
        { label: 'Nhiệm vụ', href: '/tasks', icon: ClipboardCheck },
        { label: 'Thời hạn', href: '/deadlines', icon: Activity },
        { label: 'Lịch làm việc', href: '/calendar', icon: CalendarDays },
        { label: 'Tài liệu', href: '/documents', icon: FileText },
      ],
    },
    {
      label: 'Theo dõi',
      items: [
        { label: 'Báo cáo', href: '/reports', icon: Sparkles },
        { label: 'Thông báo', href: '/notifications', icon: Bell },
        { label: 'Tổ chức & phòng ban', href: '/organization', icon: Building2 },
      ],
    },
  ],
  employee: [
    {
      label: 'Tổng quan',
      items: [{ label: 'Dashboard', href: '/', icon: LayoutDashboard }],
    },
    {
      label: 'Công việc của tôi',
      items: [
        { label: 'Nhiệm vụ', href: '/tasks', icon: ClipboardCheck },
        { label: 'Thời hạn', href: '/deadlines', icon: Activity },
        { label: 'Lịch làm việc', href: '/calendar', icon: CalendarDays },
      ],
    },
    {
      label: 'Hồ sơ & tài liệu',
      items: [
        { label: 'Khách hàng', href: '/clients', icon: Users },
        { label: 'Hồ sơ vụ việc', href: '/matters', icon: BriefcaseBusiness },
        { label: 'Tài liệu', href: '/documents', icon: FileText },
      ],
    },
    {
      label: 'Theo dõi',
      items: [
        { label: 'Thông báo', href: '/notifications', icon: Bell },
        { label: 'Báo cáo', href: '/reports', icon: Sparkles, roles: ['PARTNER'] },
      ],
    },
  ],
};

function getNavigationGroups(actor: ActorKind, user: UserSummary | null) {
  return navigationByActor[actor]
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.roles || item.roles.some((role) => user?.roles.includes(role)),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

const pageTitles: Array<{ match: string; title: string; section: string }> = [
  { match: '/', title: 'Dashboard', section: 'Tổng quan' },
  { match: '/clients', title: 'Khách hàng', section: 'Nghiệp vụ' },
  { match: '/conflict-checks', title: 'Kiểm tra xung đột', section: 'Nghiệp vụ' },
  { match: '/matters', title: 'Hồ sơ vụ việc', section: 'Nghiệp vụ' },
  { match: '/tasks', title: 'Nhiệm vụ', section: 'Nghiệp vụ' },
  { match: '/deadlines', title: 'Thời hạn', section: 'Nghiệp vụ' },
  { match: '/calendar', title: 'Lịch làm việc', section: 'Nghiệp vụ' },
  { match: '/documents', title: 'Tài liệu', section: 'Nghiệp vụ' },
  { match: '/notifications', title: 'Thông báo', section: 'Theo dõi' },
  { match: '/reports', title: 'Báo cáo', section: 'Theo dõi' },
  { match: '/audit', title: 'Nhật ký hoạt động', section: 'Theo dõi' },
  { match: '/organization', title: 'Tổ chức & Phòng ban', section: 'Tổ chức' },
  { match: '/administration/organization', title: 'Tổ chức & Phòng ban', section: 'Tổ chức' },
  { match: '/administration/users', title: 'Nhân sự', section: 'Tổ chức' },
  { match: '/administration', title: 'Quản trị hệ thống', section: 'Quản trị' },
  { match: '/sessions', title: 'Phiên đăng nhập', section: 'Quản trị' },
  { match: '/access-denied', title: 'Không có quyền truy cập', section: 'Bảo mật' },
];

const authPrefixes = ['/login', '/mfa', '/forgot-password', '/reset-password'];

function isActiveRoute(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(fullName?: string) {
  return (
    fullName
      ?.split(' ')
      .filter(Boolean)
      .slice(-2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'LP'
  );
}

function getPageMeta(pathname: string) {
  return (
    pageTitles.find((item) => item.match === pathname) ||
    pageTitles.find((item) => item.match !== '/' && pathname.startsWith(`${item.match}/`)) || {
      match: '/',
      title: 'LPMS',
      section: 'Workspace',
    }
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const isAuthPage = authPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const actor = getActorKind(user?.roles);
  const actorMeta = getActorMeta(user?.roles);
  const navigationGroups = getNavigationGroups(actor, user);

  useEffect(() => {
    if (!isAuthPage && !isLoading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthPage, isLoading, pathname, router, user]);

  useEffect(() => {
    if (!isAuthPage && !isLoading && user && !canOpenPath(pathname, user)) {
      router.replace('/access-denied');
    }
  }, [isAuthPage, isLoading, pathname, router, user]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (!isLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Đang chuyển tới trang đăng nhập...
      </div>
    );
  }

  if (!isAuthPage && user && !canOpenPath(pathname, user)) {
    return null;
  }

  const meta = getPageMeta(pathname);
  const initials = getInitials(user?.fullName);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <div className="lpms-app min-h-screen bg-[#f5f7fb] text-slate-900">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`lpms-sidebar fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-transform duration-150 ease-out will-change-transform motion-reduce:transition-none lg:transition-none lg:translate-x-0 ${
          isCollapsed ? 'w-[76px]' : 'w-[264px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-[74px] items-center border-b border-slate-100 px-4">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
            onClick={() => setMobileOpen(false)}
          >
            <span className="brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm">
              <ScaleIcon />
            </span>
            {!isCollapsed && (
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-extrabold tracking-[0.12em] text-[#1d4ed8]">
                  LPMS
                </span>
                <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Law practice workspace
                </span>
              </span>
            )}
          </Link>
          <button
            type="button"
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Đóng menu"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navigationGroups.map((group) => (
            <div key={group.label} className="mb-5">
              {!isCollapsed && (
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActiveRoute(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      onClick={() => setMobileOpen(false)}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-700 shadow-[inset_3px_0_0_#2563eb]'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      } ${isCollapsed ? 'justify-center px-2' : ''}`}
                    >
                      <Icon
                        className={`h-[17px] w-[17px] shrink-0 ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                      />
                      {!isCollapsed && (
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      )}
                      {!isCollapsed && item.badge && (
                        <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          {!isCollapsed && (
            <div className="mb-3 rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-800">
                    {user?.fullName || 'Người dùng LPMS'}
                  </p>
                  <p className="truncate text-[10px] text-slate-500">{actorMeta.label}</p>
                </div>
              </div>
            </div>
          )}
          <div
            className={`flex items-center gap-1 ${isCollapsed ? 'flex-col' : 'justify-between'}`}
          >
            <button
              type="button"
              title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
              onClick={() => setIsCollapsed((value) => !value)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            >
              {isCollapsed ? (
                <ChevronsRight className="h-4 w-4" />
              ) : (
                <ChevronsLeft className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              title="Đăng xuất"
              onClick={handleLogout}
              className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              aria-label="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className={`min-h-screen ${isCollapsed ? 'lg:pl-[76px]' : 'lg:pl-[264px]'}`}>
        <header className="sticky top-0 z-30 flex h-[74px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Mở menu"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
              <span>{actorMeta.shortLabel}</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-semibold text-slate-700">{meta.section}</span>
            </div>
            <div className="hidden h-6 w-px bg-slate-200 sm:block" />
            <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">{meta.title}</h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <label className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 md:flex">
              <Search className="h-4 w-4" />
              <input
                value={quickSearch}
                onChange={(event) => setQuickSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && quickSearch.trim())
                    router.push(`/search?q=${encodeURIComponent(quickSearch.trim())}`);
                }}
                placeholder="Tìm nhanh..."
                className="w-32 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400 lg:w-44"
                aria-label="Tìm kiếm nhanh"
              />
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
                ⌘ K
              </kbd>
            </label>
            <Link
              href="/notifications"
              className="relative rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Thông báo"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
            </Link>
            <div className="relative ml-1 border-l border-slate-200 pl-2 sm:pl-3">
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50"
                onClick={() => setProfileOpen((value) => !value)}
                aria-expanded={profileOpen}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  {initials}
                </span>
                <span className="hidden max-w-32 text-left sm:block">
                  <span className="block truncate text-xs font-semibold text-slate-800">
                    {user?.fullName || 'Người dùng'}
                  </span>
                  <span className="block truncate text-[10px] text-slate-500">
                    {actorMeta.label}
                  </span>
                </span>
                <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-12 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  <Link
                    href={actor === 'admin' ? '/sessions' : '/notifications'}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                    onClick={() => setProfileOpen(false)}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {actor === 'admin' ? 'Bảo mật tài khoản' : 'Trung tâm thông báo'}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          {isLoading ? (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                Đang khởi tạo workspace...
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

function ScaleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M12 3v17M5 7h14M7 7l-3 6a3.5 3.5 0 0 0 6 0L7 7Zm10 0-3 6a3.5 3.5 0 0 0 6 0l-3-6ZM8 21h8" />
    </svg>
  );
}
