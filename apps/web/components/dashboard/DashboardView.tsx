'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Plus,
  ShieldAlert,
  Users,
} from 'lucide-react';
import type { Client, Deadline, Matter, Task } from '@lpms/types';
import { clientApi } from '@/lib/api/clients';
import { deadlineApi, matterApi, taskApi } from '@/lib/api/operations';
import { useAuth } from '@/lib/auth-context';
import { getActorKind, getActorMeta } from '@/lib/actor';

const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' });
const quickActionTones: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  rose: 'bg-rose-50 text-rose-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  violet: 'bg-violet-50 text-violet-600',
};

function formatDate(value?: string) {
  if (!value) return '—';
  return dateFormatter.format(new Date(value));
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Users;
  tone: 'blue' | 'violet' | 'amber' | 'emerald';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="lpms-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-[11px] text-slate-400">{detail}</p>
    </div>
  );
}

function SectionHeading({
  title,
  href,
  action,
}: {
  title: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
        >
          {action || 'Xem tất cả'} <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

export function DashboardView() {
  const { user } = useAuth();
  const actor = getActorKind(user?.roles);
  const actorMeta = getActorMeta(user?.roles);
  const clients = useQuery<Client[]>({
    queryKey: ['dashboard', 'clients'],
    queryFn: clientApi.getClients,
  });
  const matters = useQuery<Matter[]>({
    queryKey: ['dashboard', 'matters'],
    queryFn: matterApi.getMatters,
  });
  const tasks = useQuery<Task[]>({ queryKey: ['dashboard', 'tasks'], queryFn: taskApi.getTasks });
  const deadlines = useQuery<Deadline[]>({
    queryKey: ['dashboard', 'deadlines'],
    queryFn: deadlineApi.getDeadlines,
  });

  const clientItems = clients.data ?? [];
  const matterItems = matters.data ?? [];
  const taskItems = tasks.data ?? [];
  const deadlineItems = deadlines.data ?? [];
  const openMatters = matterItems.filter(
    (matter) => !['CLOSED', 'ARCHIVED', 'COMPLETED'].includes(matter.status),
  );
  const openTasks = taskItems.filter((task) => !['COMPLETED', 'CANCELLED'].includes(task.status));
  const overdueTasks = openTasks.filter((task) => task.isOverdue);
  const upcomingDeadlines = deadlineItems
    .filter((deadline) => !deadline.isCompleted)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);
  const recentMatters = [...matterItems]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);
  const completionRate = taskItems.length
    ? Math.round(
        (taskItems.filter((task) => task.status === 'COMPLETED').length / taskItems.length) * 100,
      )
    : 0;
  const todayLabel = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  const firstName = user?.fullName?.split(' ').slice(-1)[0] || 'bạn';
  const quickActions =
    actor === 'admin'
      ? [
          {
            href: '/administration/users',
            label: 'Quản lý người dùng',
            icon: Users,
            color: 'blue',
          },
          {
            href: '/administration/roles',
            label: 'Cấu hình vai trò',
            icon: ShieldAlert,
            color: 'rose',
          },
          {
            href: '/organization',
            label: 'Cơ cấu tổ chức',
            icon: BriefcaseBusiness,
            color: 'emerald',
          },
          { href: '/audit', label: 'Xem nhật ký', icon: FileText, color: 'violet' },
        ]
      : actor === 'director'
        ? [
            { href: '/clients/new', label: 'Tạo khách hàng', icon: Users, color: 'blue' },
            { href: '/matters/new', label: 'Mở hồ sơ', icon: BriefcaseBusiness, color: 'rose' },
            { href: '/tasks/new', label: 'Giao nhiệm vụ', icon: CheckCircle2, color: 'emerald' },
            { href: '/reports', label: 'Xem báo cáo', icon: FileText, color: 'violet' },
          ]
        : [
            { href: '/tasks/new', label: 'Tạo nhiệm vụ', icon: CheckCircle2, color: 'blue' },
            { href: '/documents/upload', label: 'Tải tài liệu', icon: FileText, color: 'violet' },
            { href: '/calendar', label: 'Mở lịch làm việc', icon: CalendarClock, color: 'emerald' },
            { href: '/matters', label: 'Hồ sơ được giao', icon: BriefcaseBusiness, color: 'rose' },
          ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            {todayLabel}
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
            {actor === 'admin' ? 'Chào mừng trở lại' : `Xin chào, ${firstName}`}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            {actorMeta.description}. Đây là những việc bạn nên ưu tiên hôm nay.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Tạo khách hàng
          </Link>
          <Link
            href="/matters/new"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <BriefcaseBusiness className="h-4 w-4" /> Mở hồ sơ
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Khách hàng"
          value={clientItems.length}
          detail="Tổng hồ sơ khách hàng trong hệ thống"
          icon={Users}
          tone="blue"
        />
        <StatCard
          label="Hồ sơ đang xử lý"
          value={openMatters.length}
          detail={`${matterItems.length} hồ sơ trong toàn bộ danh mục`}
          icon={BriefcaseBusiness}
          tone="violet"
        />
        <StatCard
          label="Việc cần hoàn thành"
          value={openTasks.length}
          detail={`${overdueTasks.length} việc đang quá hạn`}
          icon={CheckCircle2}
          tone={overdueTasks.length ? 'amber' : 'emerald'}
        />
        <StatCard
          label="Thời hạn sắp tới"
          value={deadlineItems.filter((deadline) => !deadline.isCompleted).length}
          detail="Các mốc chưa hoàn tất cần theo dõi"
          icon={CalendarClock}
          tone="amber"
        />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_1fr]">
        <div className="lpms-card p-5 sm:p-6">
          <SectionHeading
            title={
              actor === 'director'
                ? 'Công việc cần theo dõi'
                : actor === 'admin'
                  ? 'Tình trạng vận hành'
                  : 'Công việc của tôi'
            }
            href="/tasks"
          />
          <div className="mb-5 flex items-center gap-4 rounded-xl bg-slate-50 p-4">
            <div className="relative h-16 w-16 shrink-0">
              <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                <path
                  d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3.5"
                  strokeDasharray={`${completionRate}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-800">
                {completionRate}%
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Tiến độ hoàn thành</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Tổng hợp từ các nhiệm vụ được giao trong workspace.
              </p>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {openTasks.slice(0, 5).map((task) => (
              <Link
                href={`/tasks/${task.id}`}
                key={task.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-slate-50/70"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${task.isOverdue ? 'bg-rose-500' : task.priority === 'URGENT' || task.priority === 'HIGH' ? 'bg-amber-500' : 'bg-blue-500'}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-slate-800">
                    {task.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">
                    {task.matterCode || 'Công việc nội bộ'} · Hạn {formatDate(task.dueDate)}
                  </span>
                </span>
                <span
                  className={`text-[10px] font-bold ${task.isOverdue ? 'text-rose-600' : 'text-slate-400'}`}
                >
                  {task.isOverdue
                    ? 'Quá hạn'
                    : task.status === 'IN_PROGRESS'
                      ? 'Đang làm'
                      : 'Chờ xử lý'}
                </span>
              </Link>
            ))}
            {!openTasks.length && (
              <p className="py-8 text-center text-xs text-slate-400">
                Bạn không có nhiệm vụ đang mở.
              </p>
            )}
          </div>
        </div>

        <div className="lpms-card p-5 sm:p-6">
          <SectionHeading title="Thời hạn cần chú ý" href="/deadlines" />
          <div className="space-y-3">
            {upcomingDeadlines.map((deadline) => (
              <Link
                href={`/deadlines/${deadline.id}`}
                key={deadline.id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-amber-200 hover:bg-amber-50/40"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg ${deadline.isOverdue ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700'}`}
                >
                  <span className="text-[10px] font-bold uppercase">
                    {new Date(deadline.dueDate)
                      .toLocaleDateString('vi-VN', { month: 'short' })
                      .replace('.', '')}
                  </span>
                  <span className="text-sm font-extrabold leading-none">
                    {new Date(deadline.dueDate).getDate()}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-slate-800">
                    {deadline.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                    {deadline.matterCode || 'Không gắn hồ sơ'} · {deadline.responsiblePersonName}
                  </span>
                </span>
                {deadline.isOverdue ? (
                  <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500" />
                ) : (
                  <Clock3 className="h-4 w-4 shrink-0 text-amber-500" />
                )}
              </Link>
            ))}
            {!upcomingDeadlines.length && (
              <p className="py-8 text-center text-xs text-slate-400">
                Không có thời hạn chưa hoàn tất.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_1fr]">
        <div className="lpms-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <SectionHeading title="Hồ sơ cập nhật gần đây" href="/matters" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  <th className="px-5 py-3 sm:px-6">Hồ sơ</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Cập nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentMatters.map((matter) => (
                  <tr key={matter.id} className="text-xs hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 sm:px-6">
                      <Link
                        href={`/matters/${matter.id}`}
                        className="font-bold text-slate-800 hover:text-blue-700"
                      >
                        {matter.matterCode}
                      </Link>
                      <p className="mt-0.5 max-w-[240px] truncate text-[11px] text-slate-400">
                        {matter.name}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{matter.clientName}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                        {matter.status === 'ACTIVE' ? 'Đang xử lý' : matter.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">{formatDate(matter.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!recentMatters.length && (
            <p className="p-8 text-center text-xs text-slate-400">Chưa có hồ sơ.</p>
          )}
        </div>

        <div className="lpms-card p-5 sm:p-6">
          <SectionHeading title="Truy cập nhanh" />
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ href, label, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
              >
                <span
                  className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${quickActionTones[color]}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex items-center justify-between gap-2 text-xs font-bold text-slate-700 group-hover:text-blue-700">
                  {label}
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-500" />
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex items-start gap-3">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <div>
                <p className="text-xs font-bold text-blue-900">Có 3 thông báo mới</p>
                <p className="mt-1 text-[11px] leading-relaxed text-blue-700">
                  Cập nhật hoạt động, nhiệm vụ được giao và thời hạn cần xem lại.
                </p>
                <Link
                  href="/notifications"
                  className="mt-2 inline-flex text-[11px] font-bold text-blue-700 hover:underline"
                >
                  Mở trung tâm thông báo <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
