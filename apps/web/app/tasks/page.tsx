'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle, ClipboardCheck, Filter, Plus, Search } from 'lucide-react';
import type { Task, TaskPriority, TaskStatus } from '@lpms/types';
import { taskApi } from '@/lib/api/operations';

const statusLabels: Record<TaskStatus, string> = {
  TODO: 'Chờ xử lý',
  IN_PROGRESS: 'Đang thực hiện',
  WAITING: 'Đang chờ',
  REVIEW: 'Chờ duyệt',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};
const priorityLabels: Record<TaskPriority, string> = {
  LOW: 'Thấp',
  NORMAL: 'Bình thường',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
};
const priorityTones: Record<TaskPriority, string> = {
  LOW: 'text-slate-500',
  NORMAL: 'text-blue-600',
  HIGH: 'text-amber-600',
  URGENT: 'text-rose-600',
};

export default function TasksPage() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'ALL' | 'MINE' | 'OVERDUE'>('ALL');
  const {
    data: tasks = [],
    isLoading,
    isError,
  } = useQuery<Task[]>({ queryKey: ['tasks'], queryFn: taskApi.getTasks });
  const filtered = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    return tasks.filter((task) => {
      const text =
        `${task.title} ${task.code} ${task.matterName || ''} ${task.assigneeName}`.toLowerCase();
      return (
        (!keyword || text.includes(keyword)) &&
        (view === 'ALL' || view === 'MINE' || task.isOverdue)
      );
    });
  }, [search, tasks, view]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <ClipboardCheck className="h-4 w-4 text-blue-500" /> Điều phối công việc
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
            Nhiệm vụ
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            Giao việc, theo dõi checklist và kiểm soát tiến độ của từng thành viên.
          </p>
        </div>
        <Link
          href="/tasks/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Giao nhiệm vụ
        </Link>
      </section>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Tổng nhiệm vụ', value: tasks.length, color: 'bg-blue-500' },
          {
            label: 'Đang thực hiện',
            value: tasks.filter((task) => task.status === 'IN_PROGRESS').length,
            color: 'bg-cyan-500',
          },
          {
            label: 'Đã hoàn thành',
            value: tasks.filter((task) => task.status === 'COMPLETED').length,
            color: 'bg-emerald-500',
          },
          {
            label: 'Quá hạn',
            value: tasks.filter((task) => task.isOverdue).length,
            color: 'bg-rose-500',
          },
        ].map((item) => (
          <div key={item.label} className="lpms-card p-4 sm:p-5">
            <p className="text-[11px] text-slate-500">{item.label}</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{item.value}</p>
            <span className={`mt-3 block h-1 w-10 rounded-full ${item.color}`} />
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
              placeholder="Tìm theo tên nhiệm vụ, mã hoặc hồ sơ..."
              className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
            />
          </label>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setView('ALL')}
              className={`rounded-lg px-3 py-2 text-[11px] font-bold ${view === 'ALL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setView('MINE')}
              className={`rounded-lg px-3 py-2 text-[11px] font-bold ${view === 'MINE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              Việc của tôi
            </button>
            <button
              type="button"
              onClick={() => setView('OVERDUE')}
              className={`rounded-lg px-3 py-2 text-[11px] font-bold ${view === 'OVERDUE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              Quá hạn
            </button>
          </div>
        </div>
      </section>
      <section className="lpms-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Worklist</h3>
            <p className="mt-1 text-[11px] text-slate-400">
              {filtered.length} nhiệm vụ phù hợp bộ lọc
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
            <Filter className="h-3 w-3" /> Cập nhật theo thời gian thực
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {isLoading && (
            <p className="px-6 py-14 text-center text-xs text-slate-400">Đang tải nhiệm vụ...</p>
          )}
          {isError && (
            <p className="px-6 py-14 text-center text-xs text-rose-600">
              Không thể tải danh sách nhiệm vụ.
            </p>
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <p className="px-6 py-14 text-center text-xs text-slate-400">
              Không có nhiệm vụ phù hợp.
            </p>
          )}
          {!isLoading &&
            !isError &&
            filtered.map((task) => (
              <Link
                href={`/tasks/${task.id}`}
                key={task.id}
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 sm:px-6"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : task.isOverdue ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}
                >
                  {task.status === 'COMPLETED' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-slate-800">
                    {task.title}
                  </span>
                  <span className="mt-1 block truncate text-[11px] text-slate-400">
                    {task.code} · {task.matterName || 'Công việc nội bộ'} · {task.assigneeName}
                  </span>
                </span>
                <span className="hidden min-w-[105px] text-center text-[10px] font-bold text-slate-500 sm:block">
                  {statusLabels[task.status]}
                </span>
                <span
                  className={`hidden min-w-[80px] text-right text-[10px] font-bold sm:block ${priorityTones[task.priority]}`}
                >
                  {priorityLabels[task.priority]}
                </span>
                <span
                  className={`min-w-[70px] text-right text-[10px] font-bold ${task.isOverdue ? 'text-rose-600' : 'text-slate-400'}`}
                >
                  {task.isOverdue ? 'Quá hạn' : task.dueDate}
                </span>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
