'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Filter,
  Plus,
  Search,
  ShieldAlert,
} from 'lucide-react';
import type { ConflictCheck, ConflictStatus } from '@lpms/types';
import { conflictApi } from '@/lib/api/operations';

const statusLabels: Record<ConflictStatus, string> = {
  NO_CONFLICT: 'Không phát hiện',
  POTENTIAL_CONFLICT: 'Cần xem xét',
  CONFIRMED_CONFLICT: 'Đã xác nhận xung đột',
};
const statusTones: Record<ConflictStatus, string> = {
  NO_CONFLICT: 'bg-emerald-50 text-emerald-700',
  POTENTIAL_CONFLICT: 'bg-amber-50 text-amber-700',
  CONFIRMED_CONFLICT: 'bg-rose-50 text-rose-700',
};

export default function ConflictChecksPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | ConflictStatus>('ALL');
  const {
    data: checks = [],
    isLoading,
    isError,
  } = useQuery<ConflictCheck[]>({
    queryKey: ['conflict-checks'],
    queryFn: conflictApi.getConflictChecks,
  });
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return checks.filter(
      (check) =>
        (!keyword ||
          `${check.code} ${check.clientName || ''} ${check.matterName || ''} ${check.searchTerms.join(' ')}`
            .toLowerCase()
            .includes(keyword)) &&
        (status === 'ALL' || check.status === status),
    );
  }, [checks, search, status]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <ShieldAlert className="h-4 w-4 text-blue-500" /> Kiểm soát đạo đức nghề nghiệp
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
            Kiểm tra xung đột
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            Tra cứu các bên liên quan trước khi tiếp nhận hoặc mở hồ sơ chính thức.
          </p>
        </div>
        <Link
          href="/conflict-checks/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Tạo lệnh kiểm tra
        </Link>
      </section>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Tổng lệnh kiểm tra', value: checks.length, icon: FileCheck2, tone: 'blue' },
          {
            label: 'Không phát hiện',
            value: checks.filter((check) => check.status === 'NO_CONFLICT').length,
            icon: CheckCircle2,
            tone: 'emerald',
          },
          {
            label: 'Cần xem xét',
            value: checks.filter((check) => check.status === 'POTENTIAL_CONFLICT').length,
            icon: AlertTriangle,
            tone: 'amber',
          },
          {
            label: 'Xung đột xác nhận',
            value: checks.filter((check) => check.status === 'CONFIRMED_CONFLICT').length,
            icon: ShieldAlert,
            tone: 'rose',
          },
        ].map((item) => (
          <div key={item.label} className="lpms-card flex items-center gap-3 p-4 sm:p-5">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone === 'blue' ? 'bg-blue-50 text-blue-600' : item.tone === 'emerald' ? 'bg-emerald-50 text-emerald-600' : item.tone === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}
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
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_240px_auto]">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-300 focus-within:bg-white">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo mã, khách hàng, bên liên quan..."
              className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as 'ALL' | ConflictStatus)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 outline-none"
          >
            <option value="ALL">Tất cả kết quả</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatus('ALL');
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            <Filter className="h-3.5 w-3.5" /> Xóa lọc
          </button>
        </div>
      </section>
      <section className="lpms-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Sổ lệnh tra cứu</h3>
            <p className="mt-1 text-[11px] text-slate-400">
              Mỗi quyết định phải được lưu cùng người duyệt và lý do.
            </p>
          </div>
          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">
            Ethical wall
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-slate-50/70 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="px-5 py-3 sm:px-6">Lệnh kiểm tra</th>
                <th className="px-4 py-3">Khách hàng / hồ sơ</th>
                <th className="px-4 py-3">Từ khóa</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Người yêu cầu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center text-xs text-slate-400">
                    Đang tải sổ kiểm tra...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center text-xs text-rose-600">
                    Không thể tải dữ liệu kiểm tra.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center text-xs text-slate-400">
                    Không có lệnh kiểm tra phù hợp.
                  </td>
                </tr>
              )}
              {!isLoading &&
                !isError &&
                filtered.map((check) => (
                  <tr key={check.id} className="text-xs hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 sm:px-6">
                      <Link
                        href={`/conflict-checks/${check.id}`}
                        className="font-mono font-bold text-blue-600 hover:text-blue-800"
                      >
                        {check.code}
                      </Link>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {new Date(check.requestedAt).toLocaleDateString('vi-VN')}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="block font-semibold text-slate-700">
                        {check.clientName || 'Khách hàng tiềm năng'}
                      </span>
                      <span className="mt-1 block text-[10px] text-slate-400">
                        {check.matterName || 'Chưa gắn hồ sơ'}
                      </span>
                    </td>
                    <td className="max-w-[260px] px-4 py-3.5">
                      <span className="line-clamp-2 text-slate-500">
                        {check.searchTerms.join(' · ')}
                      </span>
                      <span className="mt-1 block text-[10px] text-slate-400">
                        {check.results.length} kết quả tương đồng
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusTones[check.status]}`}
                      >
                        {statusLabels[check.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{check.requestedByName}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
