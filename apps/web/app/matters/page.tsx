'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BriefcaseBusiness, Filter, Plus, Search, ShieldCheck } from 'lucide-react';
import type { Matter, MatterPriority, MatterStatus, MatterType } from '@lpms/types';
import { matterApi } from '@/lib/api/operations';

const statusLabels: Record<MatterStatus, string> = {
  INTAKE: 'Tiếp nhận',
  CONFLICT_CHECK: 'Kiểm tra xung đột',
  PROPOSAL: 'Đề xuất dịch vụ',
  ACTIVE: 'Đang hoạt động',
  WAITING_CLIENT: 'Chờ khách hàng',
  WAITING_AUTHORITY: 'Chờ cơ quan',
  ON_HOLD: 'Tạm dừng',
  COMPLETED: 'Hoàn thành',
  CLOSED: 'Đã đóng',
  ARCHIVED: 'Lưu trữ',
};
const typeLabels: Record<MatterType, string> = {
  LITIGATION: 'Tố tụng',
  ADVISORY: 'Tư vấn',
  TRANSACTION: 'Giao dịch',
  COMPLIANCE: 'Tuân thủ',
  DISPUTE_RESOLUTION: 'Trọng tài & hòa giải',
};
const priorityLabels: Record<MatterPriority, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
};
const statusTones: Record<MatterStatus, string> = {
  INTAKE: 'bg-slate-100 text-slate-600',
  CONFLICT_CHECK: 'bg-violet-50 text-violet-700',
  PROPOSAL: 'bg-amber-50 text-amber-700',
  ACTIVE: 'bg-blue-50 text-blue-700',
  WAITING_CLIENT: 'bg-orange-50 text-orange-700',
  WAITING_AUTHORITY: 'bg-cyan-50 text-cyan-700',
  ON_HOLD: 'bg-slate-100 text-slate-500',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  CLOSED: 'bg-emerald-50 text-emerald-700',
  ARCHIVED: 'bg-slate-100 text-slate-500',
};

export default function MattersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | MatterStatus>('ALL');
  const [type, setType] = useState<'ALL' | MatterType>('ALL');
  const {
    data: matters = [],
    isLoading,
    isError,
  } = useQuery<Matter[]>({ queryKey: ['matters'], queryFn: matterApi.getMatters });
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return matters.filter((matter) => {
      const value =
        `${matter.matterCode} ${matter.name} ${matter.clientName} ${matter.practiceArea}`.toLowerCase();
      return (
        (!keyword || value.includes(keyword)) &&
        (status === 'ALL' || matter.status === status) &&
        (type === 'ALL' || matter.matterType === type)
      );
    });
  }, [matters, search, status, type]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <BriefcaseBusiness className="h-4 w-4 text-blue-500" /> Nghiệp vụ hồ sơ
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
            Hồ sơ vụ việc
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            Quản lý tập trung các hồ sơ dịch vụ pháp lý, doanh nghiệp và tố tụng.
          </p>
        </div>
        <Link
          href="/matters/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Mở hồ sơ mới
        </Link>
      </section>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Tổng hồ sơ', value: matters.length, color: 'bg-blue-500' },
          {
            label: 'Đang hoạt động',
            value: matters.filter((matter) => matter.status === 'ACTIVE').length,
            color: 'bg-emerald-500',
          },
          {
            label: 'Chờ xử lý',
            value: matters.filter((matter) =>
              ['INTAKE', 'CONFLICT_CHECK', 'PROPOSAL'].includes(matter.status),
            ).length,
            color: 'bg-amber-500',
          },
          {
            label: 'Bảo mật cao',
            value: matters.filter((matter) =>
              ['HIGHLY_CONFIDENTIAL', 'RESTRICTED'].includes(matter.confidentialityLevel),
            ).length,
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
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-300 focus-within:bg-white">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo mã, tên hồ sơ, khách hàng..."
              className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as 'ALL' | MatterStatus)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as 'ALL' | MatterType)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 outline-none"
          >
            <option value="ALL">Tất cả nhóm nghiệp vụ</option>
            {Object.entries(typeLabels).map(([key, label]) => (
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
              setType('ALL');
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
            <h3 className="text-sm font-bold text-slate-900">Danh sách hồ sơ</h3>
            <p className="mt-1 text-[11px] text-slate-400">
              Hiển thị {filtered.length} hồ sơ phù hợp
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
            <ShieldCheck className="h-3 w-3" /> Kiểm soát bảo mật
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50/70 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="px-5 py-3 sm:px-6">Hồ sơ</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Nhóm</th>
                <th className="px-4 py-3">Phụ trách</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Ưu tiên</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-xs text-slate-400">
                    Đang tải danh sách hồ sơ...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-xs text-rose-600">
                    Không thể tải danh sách hồ sơ.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-xs text-slate-400">
                    Không có hồ sơ phù hợp.
                  </td>
                </tr>
              )}
              {!isLoading &&
                !isError &&
                filtered.map((matter) => (
                  <tr key={matter.id} className="text-xs hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 sm:px-6">
                      <Link
                        href={`/matters/${matter.id}`}
                        className="font-mono font-bold text-blue-600 hover:text-blue-800"
                      >
                        {matter.matterCode}
                      </Link>
                      <p className="mt-1 max-w-[260px] truncate font-semibold text-slate-800">
                        {matter.name}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{matter.clientName}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                        {typeLabels[matter.matterType]}
                      </span>
                      <p className="mt-1 text-[10px] text-slate-400">{matter.practiceArea}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{matter.responsibleLawyerName}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusTones[matter.status]}`}
                      >
                        {statusLabels[matter.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`font-semibold ${matter.priority === 'URGENT' ? 'text-rose-600' : matter.priority === 'HIGH' ? 'text-amber-600' : 'text-slate-500'}`}
                      >
                        {priorityLabels[matter.priority]}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
