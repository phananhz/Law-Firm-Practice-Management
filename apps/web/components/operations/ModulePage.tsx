import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Search,
  ShieldAlert,
} from 'lucide-react';

type ModulePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  action?: { label: string; href: string };
  children?: React.ReactNode;
};

export function ModulePage({
  eyebrow,
  title,
  description,
  icon: Icon,
  action,
  children,
}: ModulePageProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Icon className="h-4 w-4 text-blue-500" /> {eyebrow}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
            {title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{description}</p>
        </div>
        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <span>＋</span>
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

export function EmptyWorkspaceState({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="lpms-card flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <FileText className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-sm font-bold text-slate-800">{title}</h3>
      <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">{description}</p>
      {href && label && (
        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
        >
          {label}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

export function OperationsPreview() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {[
        {
          label: 'Lịch hôm nay',
          value: '04',
          icon: CalendarDays,
          tone: 'blue',
          detail: 'Sự kiện và lịch hẹn',
        },
        {
          label: 'Chưa đọc',
          value: '03',
          icon: CheckCircle2,
          tone: 'violet',
          detail: 'Thông báo cần xem',
        },
        {
          label: 'Cần chú ý',
          value: '02',
          icon: ShieldAlert,
          tone: 'amber',
          detail: 'Hồ sơ hoặc thời hạn rủi ro',
        },
      ].map(({ label, value, icon: Icon, tone, detail }) => (
        <div key={label} className="lpms-card flex items-center gap-4 p-5">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone === 'blue' ? 'bg-blue-50 text-blue-600' : tone === 'violet' ? 'bg-violet-50 text-violet-600' : 'bg-amber-50 text-amber-600'}`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-[11px] text-slate-500">{label}</span>
            <span className="mt-1 block text-xl font-bold text-slate-900">{value}</span>
            <span className="mt-0.5 block text-[10px] text-slate-400">{detail}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function SearchEmpty() {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-xs text-slate-400">
      <Search className="h-4 w-4" /> Chưa có dữ liệu phù hợp với bộ lọc hiện tại.
    </div>
  );
}

export function TimelineRow({
  title,
  detail,
  time,
  tone = 'blue',
}: {
  title: string;
  detail: string;
  time: string;
  tone?: 'blue' | 'amber' | 'rose';
}) {
  return (
    <div className="flex gap-3 border-b border-slate-100 py-4 last:border-0">
      <span
        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${tone === 'blue' ? 'bg-blue-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold text-slate-800">{title}</span>
        <span className="mt-1 block text-[11px] text-slate-500">{detail}</span>
      </span>
      <span className="text-[10px] text-slate-400">{time}</span>
    </div>
  );
}

export function DeadlineBadge({ overdue = false }: { overdue?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${overdue ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}
    >
      <Clock3 className="h-3 w-3" />
      {overdue ? 'Quá hạn' : 'Sắp đến hạn'}
    </span>
  );
}
