'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarClock, CheckCircle2, Filter, Plus, Search } from 'lucide-react';
import type { Deadline, DeadlineCategory } from '@lpms/types';
import { deadlineApi } from '@/lib/api/operations';

const categoryLabels: Record<DeadlineCategory, string> = {
  FILING: 'Nộp hồ sơ',
  GOVERNMENT: 'Cơ quan nhà nước',
  COURT: 'Tòa án',
  CONTRACT_EXPIRY: 'Hết hạn hợp đồng',
  LICENSE_EXPIRY: 'Hết hạn giấy phép',
  RENEWAL: 'Gia hạn',
  CLIENT: 'Khách hàng',
  INTERNAL: 'Nội bộ',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export default function DeadlinesPage() {
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'ALL' | 'OPEN' | 'OVERDUE'>('OPEN');
  const {
    data: deadlines = [],
    isLoading,
    isError,
  } = useQuery<Deadline[]>({ queryKey: ['deadlines'], queryFn: deadlineApi.getDeadlines });
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return deadlines.filter((deadline) => {
      const text =
        `${deadline.title} ${deadline.code} ${deadline.matterName || ''} ${deadline.responsiblePersonName}`.toLowerCase();
      return (
        (!keyword || text.includes(keyword)) &&
        (mode === 'ALL' || (mode === 'OVERDUE' ? deadline.isOverdue : !deadline.isCompleted))
      );
    });
  }, [deadlines, mode, search]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <CalendarClock className="h-4 w-4 text-blue-500" /> Kiểm soát thời hạn
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
            Thời hạn
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            Theo dõi các mốc pháp lý, thời hạn nộp hồ sơ và nhắc việc quan trọng của từng vụ việc.
          </p>
        </div>
        <Link
          href="/deadlines/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Tạo thời hạn
        </Link>
      </section>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Tổng thời hạn', value: deadlines.length, icon: CalendarClock, tone: 'blue' },
          {
            label: 'Chưa hoàn tất',
            value: deadlines.filter((deadline) => !deadline.isCompleted).length,
            icon: CheckCircle2,
            tone: 'amber',
          },
          {
            label: 'Quá hạn',
            value: deadlines.filter((deadline) => deadline.isOverdue).length,
            icon: AlertTriangle,
            tone: 'rose',
          },
          {
            label: 'Trong 7 ngày',
            value: deadlines.filter((deadline) => !deadline.isCompleted).slice(0, 7).length,
            icon: CalendarClock,
            tone: 'cyan',
          },
        ].map((item) => (
          <div key={item.label} className="lpms-card flex items-center gap-3 p-4 sm:p-5">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone === 'blue' ? 'bg-blue-50 text-blue-600' : item.tone === 'amber' ? 'bg-amber-50 text-amber-600' : item.tone === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-cyan-50 text-cyan-600'}`}
            >
              <item.icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[11px] text-slate-500">{item.label}</span>
              <span className="mt-1 block text-xl font-bold text-slate-900">{item.value}</span>
            </span>
          </div>
        ))}
      </section>
      <section className="lpms-card p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-300 focus-within:bg-white">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tiêu đề, mã hoặc hồ sơ..."
              className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
            />
          </label>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode('OPEN')}
              className={`rounded-lg px-3 py-2 text-[11px] font-bold ${mode === 'OPEN' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              Chưa hoàn tất
            </button>
            <button
              type="button"
              onClick={() => setMode('OVERDUE')}
              className={`rounded-lg px-3 py-2 text-[11px] font-bold ${mode === 'OVERDUE' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
            >
              Quá hạn
            </button>
            <button
              type="button"
              onClick={() => setMode('ALL')}
              className={`rounded-lg px-3 py-2 text-[11px] font-bold ${mode === 'ALL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              Tất cả
            </button>
          </div>
        </div>
      </section>
      <section className="lpms-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Danh sách thời hạn</h3>
            <p className="mt-1 text-[11px] text-slate-400">{filtered.length} mốc cần theo dõi</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
            <Filter className="h-3 w-3" /> Nhắc việc theo vai trò
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {isLoading && (
            <p className="px-6 py-14 text-center text-xs text-slate-400">Đang tải thời hạn...</p>
          )}
          {isError && (
            <p className="px-6 py-14 text-center text-xs text-rose-600">
              Không thể tải danh sách thời hạn.
            </p>
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <p className="px-6 py-14 text-center text-xs text-slate-400">
              Không có thời hạn phù hợp.
            </p>
          )}
          {!isLoading &&
            !isError &&
            filtered.map((deadline) => (
              <Link
                href={`/deadlines/${deadline.id}`}
                key={deadline.id}
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 sm:px-6"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl ${deadline.isOverdue ? 'bg-rose-50 text-rose-600' : deadline.isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'}`}
                >
                  <span className="text-[9px] font-bold uppercase">
                    {new Date(deadline.dueDate)
                      .toLocaleDateString('vi-VN', { month: 'short' })
                      .replace('.', '')}
                  </span>
                  <span className="text-lg font-extrabold leading-none">
                    {new Date(deadline.dueDate).getDate()}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-slate-800">
                    {deadline.title}
                  </span>
                  <span className="mt-1 block truncate text-[11px] text-slate-400">
                    {deadline.code} · {deadline.matterName || 'Không gắn hồ sơ'} ·{' '}
                    {deadline.responsiblePersonName}
                  </span>
                </span>
                <span className="hidden text-right sm:block">
                  <span className="block text-[10px] font-bold text-slate-600">
                    {categoryLabels[deadline.category]}
                  </span>
                  <span className="mt-1 block text-[10px] text-slate-400">
                    {formatDate(deadline.dueDate)}
                  </span>
                </span>
                <span
                  className={`min-w-[70px] text-right text-[10px] font-bold ${deadline.isOverdue ? 'text-rose-600' : deadline.isCompleted ? 'text-emerald-600' : 'text-amber-600'}`}
                >
                  {deadline.isOverdue ? 'Quá hạn' : deadline.isCompleted ? 'Hoàn tất' : 'Cần xử lý'}
                </span>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
