'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Filter, Mail, Phone, Plus, Search, UserRound, Users } from 'lucide-react';
import type { Client, ClientStatus, ClientType } from '@lpms/types';
import { clientApi } from '@/lib/api/clients';

const statusLabels: Record<ClientStatus, string> = {
  NEW: 'Mới tiếp nhận',
  IN_REVIEW: 'Đang thẩm định',
  CONFLICT_CHECK: 'Kiểm tra xung đột',
  APPROVED: 'Đã phê duyệt',
  ACTIVE: 'Đang hoạt động',
  REJECTED: 'Từ chối tiếp nhận',
};

const statusTones: Record<ClientStatus, string> = {
  NEW: 'bg-blue-50 text-blue-700',
  IN_REVIEW: 'bg-amber-50 text-amber-700',
  CONFLICT_CHECK: 'bg-violet-50 text-violet-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-rose-50 text-rose-700',
};

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'ALL' | ClientType>('ALL');
  const [status, setStatus] = useState<'ALL' | ClientStatus>('ALL');
  const {
    data: clients = [],
    isLoading,
    isError,
  } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: clientApi.getClients,
  });

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return clients.filter((client) => {
      const searchable =
        `${client.displayName} ${client.clientCode} ${client.email || ''} ${client.taxCode || ''} ${client.idNumber || ''}`.toLowerCase();
      return (
        (!keyword || searchable.includes(keyword)) &&
        (type === 'ALL' || client.type === type) &&
        (status === 'ALL' || client.status === status)
      );
    });
  }, [clients, search, status, type]);

  const clearFilters = () => {
    setSearch('');
    setType('ALL');
    setStatus('ALL');
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Users className="h-4 w-4 text-blue-500" /> Nghiệp vụ khách hàng
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
            Khách hàng
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            Danh mục khách hàng cá nhân và doanh nghiệp, được kiểm soát xuyên suốt từ tiếp nhận đến
            hồ sơ vụ việc.
          </p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Tiếp nhận khách hàng
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Tổng khách hàng', value: clients.length, tone: 'blue' },
          {
            label: 'Doanh nghiệp',
            value: clients.filter((client) => client.type === 'ORGANIZATION').length,
            tone: 'violet',
          },
          {
            label: 'Cá nhân',
            value: clients.filter((client) => client.type === 'INDIVIDUAL').length,
            tone: 'cyan',
          },
          {
            label: 'Đang hoạt động',
            value: clients.filter((client) => client.status === 'ACTIVE').length,
            tone: 'emerald',
          },
        ].map((item) => (
          <div key={item.label} className="lpms-card p-4 sm:p-5">
            <p className="text-[11px] text-slate-500">{item.label}</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{item.value}</p>
            <span
              className={`mt-3 block h-1 w-10 rounded-full ${item.tone === 'blue' ? 'bg-blue-500' : item.tone === 'violet' ? 'bg-violet-500' : item.tone === 'cyan' ? 'bg-cyan-500' : 'bg-emerald-500'}`}
            />
          </div>
        ))}
      </section>

      <section className="lpms-card p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_210px_210px_auto]">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên, mã, email, MST hoặc CCCD..."
              className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as 'ALL' | ClientType)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">Tất cả loại khách hàng</option>
            <option value="ORGANIZATION">Doanh nghiệp</option>
            <option value="INDIVIDUAL">Cá nhân</option>
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as 'ALL' | ClientStatus)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            <Filter className="h-3.5 w-3.5" /> Xóa lọc
          </button>
        </div>
      </section>

      <section className="lpms-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Danh mục khách hàng</h3>
            <p className="mt-1 text-[11px] text-slate-400">
              Hiển thị {filtered.length} trên {clients.length} khách hàng
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
            Đã lọc theo quyền truy cập
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[830px] text-left">
            <thead className="bg-slate-50/70 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="px-5 py-3 sm:px-6">Khách hàng</th>
                <th className="px-4 py-3">Mã hồ sơ</th>
                <th className="px-4 py-3">Liên hệ</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Hồ sơ</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-xs text-slate-400">
                    Đang tải danh sách khách hàng...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-xs text-rose-600">
                    Không thể tải dữ liệu khách hàng. Vui lòng thử lại.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-xs text-slate-400">
                    Không tìm thấy khách hàng phù hợp.
                  </td>
                </tr>
              )}
              {!isLoading &&
                !isError &&
                filtered.map((client) => (
                  <tr key={client.id} className="text-xs hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 sm:px-6">
                      <Link href={`/clients/${client.id}`} className="flex items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${client.type === 'ORGANIZATION' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'}`}
                        >
                          {client.type === 'ORGANIZATION' ? (
                            <Building2 className="h-4 w-4" />
                          ) : (
                            <UserRound className="h-4 w-4" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-bold text-slate-800 hover:text-blue-700">
                            {client.displayName}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-slate-400">
                            {initials(client.displayName)} ·{' '}
                            {client.type === 'ORGANIZATION'
                              ? 'Doanh nghiệp / tổ chức'
                              : 'Khách hàng cá nhân'}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-blue-600">
                      {client.clientCode}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {client.email || 'Chưa cập nhật'}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Phone className="h-3 w-3" />
                        {client.phone || 'Chưa cập nhật'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusTones[client.status]}`}
                      >
                        {statusLabels[client.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                      {client.mattersCount ?? 0}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/clients/${client.id}`}
                        className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50"
                      >
                        Chi tiết →
                      </Link>
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
