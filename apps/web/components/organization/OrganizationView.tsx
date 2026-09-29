'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Building2,
  Check,
  ChevronRight,
  GitBranch,
  MapPin,
  Plus,
  Sparkles,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import type { Department, OrganizationOverview, Position } from '@lpms/types';
import { organizationApi } from '@/lib/api/organization';
import { useToast } from '@/components/ui/toast';

type ViewTab = 'overview' | 'departments' | 'branches' | 'positions';

const tabItems: Array<{ id: ViewTab; label: string }> = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'departments', label: 'Phòng ban' },
  { id: 'branches', label: 'Chi nhánh' },
  { id: 'positions', label: 'Chức danh' },
];

const fallbackPositions: Position[] = [
  {
    id: 'pos-fallback-1',
    code: 'MP',
    title: 'Managing Partner',
    level: 1,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'pos-fallback-2',
    code: 'SP',
    title: 'Senior Partner',
    level: 2,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'pos-fallback-3',
    code: 'PART',
    title: 'Partner',
    level: 3,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'pos-fallback-4',
    code: 'SA',
    title: 'Senior Associate',
    level: 4,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'pos-fallback-5',
    code: 'JA',
    title: 'Junior Associate',
    level: 5,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'pos-fallback-6',
    code: 'PARA',
    title: 'Paralegal',
    level: 6,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

function StatusPill({ status }: { status: string }) {
  const active = status === 'ACTIVE';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${active ? 'bg-emerald-50 text-emerald-700' : status === 'PLANNED' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : status === 'PLANNED' ? 'bg-amber-500' : 'bg-slate-400'}`}
      />
      {active ? 'Đang hoạt động' : status === 'PLANNED' ? 'Đang chuẩn bị' : 'Tạm dừng'}
    </span>
  );
}

function ExecutiveNode({
  name,
  title,
  initials,
  accent,
}: {
  name: string;
  title: string;
  initials: string;
  accent: 'gold' | 'blue';
}) {
  return (
    <div
      className={`relative z-10 mx-auto flex max-w-[300px] items-center gap-3 rounded-xl border px-4 py-3 shadow-sm ${accent === 'gold' ? 'border-amber-200 bg-amber-50/80' : 'border-blue-200 bg-blue-50/80'}`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${accent === 'gold' ? 'bg-amber-200 text-amber-800' : 'bg-blue-200 text-blue-800'}`}
      >
        {initials}
      </span>
      <span className="min-w-0 text-left">
        <span
          className={`block text-[10px] font-bold uppercase tracking-[0.12em] ${accent === 'gold' ? 'text-amber-700' : 'text-blue-700'}`}
        >
          {title}
        </span>
        <span className="mt-0.5 block truncate text-sm font-bold text-slate-800">{name}</span>
      </span>
    </div>
  );
}

function DepartmentNode({ department }: { department: Department }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-blue-200 bg-white/80 px-3 py-2.5 text-xs text-slate-700">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        <Building2 className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1 truncate font-semibold">{department.name}</span>
      <span className="shrink-0 text-[10px] text-slate-400">{department.employeeCount} người</span>
    </div>
  );
}

export function OrganizationView() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [showCreate, setShowCreate] = useState(false);
  const [newDepartment, setNewDepartment] = useState({
    code: '',
    name: '',
    description: '',
    managerName: '',
  });

  const overviewQuery = useQuery<OrganizationOverview>({
    queryKey: ['organization', 'overview'],
    queryFn: organizationApi.getOverview,
  });
  const positionsQuery = useQuery<Position[]>({
    queryKey: ['organization', 'positions'],
    queryFn: organizationApi.getPositions,
  });
  const overview = overviewQuery.data;
  const departments = useMemo(() => overview?.departments ?? [], [overview?.departments]);
  const branches = useMemo(() => overview?.branches ?? [], [overview?.branches]);
  const positions = positionsQuery.data?.length ? positionsQuery.data : fallbackPositions;

  const createMutation = useMutation({
    mutationFn: () =>
      organizationApi.createDepartment({
        code: newDepartment.code.trim().toUpperCase(),
        name: newDepartment.name.trim(),
        description: newDepartment.description.trim(),
        managerName: newDepartment.managerName.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', 'overview'] });
      success('Đã thêm phòng ban mới.');
      setNewDepartment({ code: '', name: '', description: '', managerName: '' });
      setShowCreate(false);
    },
    onError: (error: unknown) =>
      toastError(error instanceof Error ? error.message : 'Không thể tạo phòng ban.'),
  });

  const departmentGroups = useMemo(() => {
    const specialist = departments.slice(0, 4);
    const operations = departments.slice(4);
    return { specialist, operations };
  }, [departments]);

  const isLoading = overviewQuery.isLoading;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Building2 className="h-4 w-4 text-blue-500" /> Cấu trúc tổ chức
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
            Tổ chức & Phòng ban
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            Quản lý cơ cấu điều hành, phòng ban chuyên môn, chi nhánh và nguồn lực nhân sự của văn
            phòng.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Thêm phòng ban
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Phòng ban', value: departments.length, icon: Building2, tone: 'blue' },
          { label: 'Chi nhánh', value: branches.length, icon: GitBranch, tone: 'cyan' },
          { label: 'Nhân sự', value: overview?.totalEmployees ?? '—', icon: Users, tone: 'violet' },
          {
            label: 'Đang hoạt động',
            value: overview?.activeEmployees ?? '—',
            icon: Check,
            tone: 'emerald',
          },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="lpms-card flex items-center gap-3 p-4 sm:p-5">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone === 'blue' ? 'bg-blue-50 text-blue-600' : tone === 'cyan' ? 'bg-cyan-50 text-cyan-600' : tone === 'violet' ? 'bg-violet-50 text-violet-600' : 'bg-emerald-50 text-emerald-600'}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[11px] text-slate-500">{label}</span>
              <span className="mt-1 block text-xl font-bold text-slate-900">{value}</span>
            </span>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {tabItems.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {showCreate && (
        <div className="lpms-card border-blue-200 bg-blue-50/30 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Thêm phòng ban mới</h3>
              <p className="mt-1 text-xs text-slate-500">
                Thông tin có thể cập nhật thêm sau khi tạo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!newDepartment.code.trim() || !newDepartment.name.trim()) return;
              createMutation.mutate();
            }}
            className="grid gap-3 md:grid-cols-2"
          >
            <label className="text-xs font-semibold text-slate-600">
              Mã phòng ban
              <input
                required
                value={newDepartment.code}
                onChange={(event) =>
                  setNewDepartment({ ...newDepartment, code: event.target.value })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="VD: CORP"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Tên phòng ban
              <input
                required
                value={newDepartment.name}
                onChange={(event) =>
                  setNewDepartment({ ...newDepartment, name: event.target.value })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Doanh nghiệp & Đầu tư"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Mô tả
              <input
                value={newDepartment.description}
                onChange={(event) =>
                  setNewDepartment({ ...newDepartment, description: event.target.value })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Phạm vi hoạt động"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Trưởng phòng
              <input
                value={newDepartment.managerName}
                onChange={(event) =>
                  setNewDepartment({ ...newDepartment, managerName: event.target.value })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Họ và tên"
              />
            </label>
            <div className="flex justify-end gap-2 md:col-span-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {createMutation.isPending ? 'Đang lưu...' : 'Tạo phòng ban'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'overview' && (
        <>
          <section className="lpms-card overflow-hidden p-4 sm:p-6">
            <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Sơ đồ cơ cấu tổ chức</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Tổng quan quan hệ điều hành và các đơn vị trực thuộc.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                <Sparkles className="h-3.5 w-3.5" /> Read-only overview
              </span>
            </div>
            {isLoading ? (
              <div className="flex h-80 items-center justify-center text-sm text-slate-400">
                Đang tải sơ đồ tổ chức...
              </div>
            ) : (
              <div className="relative overflow-x-auto rounded-2xl border border-slate-100 bg-gradient-to-br from-blue-50/70 via-white to-violet-50/60 p-5 sm:p-8">
                <div className="mx-auto max-w-[920px] text-center">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Ban điều hành
                  </p>
                  {overview?.director && <ExecutiveNode {...overview.director} accent="gold" />}
                  <div className="mx-auto h-7 w-px bg-slate-300" />
                  {overview?.deputyDirector && (
                    <ExecutiveNode {...overview.deputyDirector} accent="blue" />
                  )}
                  <div className="mx-auto h-7 w-px bg-slate-300" />
                  <div className="relative grid min-w-[700px] grid-cols-[1.35fr_1fr] gap-4 text-left before:absolute before:left-[25%] before:right-[25%] before:top-0 before:h-px before:bg-slate-300">
                    <div className="rounded-2xl border border-dashed border-blue-300 bg-blue-50/50 p-4 pt-6">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700">
                          Khối phòng ban chuyên môn
                        </p>
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-blue-600">
                          {departmentGroups.specialist.length} phòng
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {departmentGroups.specialist.map((department) => (
                          <DepartmentNode key={department.id} department={department} />
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-dashed border-cyan-300 bg-cyan-50/40 p-4 pt-6">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-700">
                          Hệ thống chi nhánh
                        </p>
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-cyan-600">
                          {branches.length} chi nhánh
                        </span>
                      </div>
                      <div className="space-y-2">
                        {branches.map((branch) => (
                          <div
                            key={branch.id}
                            className="flex items-center gap-2 rounded-lg border border-dashed border-cyan-200 bg-white/80 px-3 py-2.5 text-xs"
                          >
                            <MapPin className="h-3.5 w-3.5 text-cyan-600" />
                            <span className="min-w-0 flex-1 truncate font-semibold text-slate-700">
                              {branch.name}
                            </span>
                            <StatusPill status={branch.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {departments.slice(0, 4).map((department) => (
              <DepartmentCard
                key={department.id}
                department={department}
                onClick={() => setActiveTab('departments')}
              />
            ))}
          </section>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {branches.map((branch) => (
              <div key={branch.id} className="lpms-card lpms-card-hover p-5">
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <StatusPill status={branch.status} />
                </div>
                <h3 className="mt-4 text-sm font-bold text-slate-900">{branch.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{branch.city}</p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="text-slate-400">Nhân sự</span>
                  <span className="font-bold text-slate-700">{branch.employeeCount}</span>
                </div>
              </div>
            ))}
          </section>
        </>
      )}

      {activeTab === 'departments' && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((department) => (
            <DepartmentCard key={department.id} department={department} />
          ))}
        </section>
      )}
      {activeTab === 'branches' && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch) => (
            <div key={branch.id} className="lpms-card p-5">
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-bold text-cyan-700">{branch.code}</span>
                <StatusPill status={branch.status} />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">{branch.name}</h3>
              <p className="mt-1 text-xs text-slate-500">{branch.address || branch.city}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs">
                <div>
                  <span className="block text-slate-400">Quản lý</span>
                  <span className="mt-1 block font-semibold text-slate-700">
                    {branch.managerName || 'Chưa bổ nhiệm'}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400">Nhân sự</span>
                  <span className="mt-1 block font-semibold text-slate-700">
                    {branch.employeeCount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
      {activeTab === 'positions' && (
        <section className="lpms-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-5 py-3">Cấp</th>
                  <th className="px-4 py-3">Mã</th>
                  <th className="px-4 py-3">Chức danh</th>
                  <th className="px-4 py-3">Nhóm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...positions]
                  .sort((a, b) => a.level - b.level)
                  .map((position) => (
                    <tr key={position.id} className="text-xs hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                          {position.level}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-blue-600">
                        {position.code}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">{position.title}</td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {position.level <= 3
                          ? 'Ban điều hành'
                          : position.level <= 5
                            ? 'Luật sư'
                            : 'Trợ lý & hỗ trợ'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function DepartmentCard({ department, onClick }: { department: Department; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lpms-card lpms-card-hover w-full p-5 text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Building2 className="h-5 w-5" />
        </span>
        <span className="font-mono text-[10px] font-bold text-blue-600">{department.code}</span>
      </div>
      <h3 className="mt-4 text-sm font-bold leading-snug text-slate-900">{department.name}</h3>
      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
        {department.description || 'Chưa có mô tả hoạt động.'}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
        <span className="flex items-center gap-1 text-slate-400">
          <Users className="h-3.5 w-3.5" /> {department.employeeCount} nhân sự
        </span>
        <span className="font-semibold text-slate-700">
          {department.managerName || 'Chưa bổ nhiệm'}
        </span>
      </div>
    </button>
  );
}
