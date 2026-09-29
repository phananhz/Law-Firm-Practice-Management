'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Filter, ShieldCheck } from 'lucide-react';
import { ModulePage } from '@/components/operations/ModulePage';
import { platformApi } from '@/lib/api/platform';

export default function AuditPage() {
  const auditQuery = useQuery({ queryKey: ['audit'], queryFn: () => platformApi.getAudit() });
  const entries = auditQuery.data ?? [];

  return (
    <ModulePage
      icon={Activity}
      eyebrow="Kiểm soát & tuân thủ"
      title="Nhật ký hoạt động"
      description="Theo dõi các thay đổi quan trọng trong workspace. Nhật ký chỉ đọc và không thể chỉnh sửa từ giao diện."
    >
      <div className="lpms-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Hoạt động gần đây</h3>
              <p className="mt-1 text-[11px] text-slate-400">
                {entries.length} bản ghi từ audit service
              </p>
            </div>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50">
            <Filter className="h-3.5 w-3.5" /> Bộ lọc
          </button>
        </div>
        {auditQuery.isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Đang tải nhật ký...</div>
        ) : auditQuery.isError ? (
          <div className="p-8 text-center text-xs text-rose-600">
            Không thể tải nhật ký. Kiểm tra quyền audit.
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">Chưa có bản ghi.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <div key={entry.id} className="flex gap-3 p-5">
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${entry.outcome === 'SUCCESS' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800">
                    {entry.action} · {entry.entityId ?? entry.entityType}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {entry.details ?? 'Không có mô tả'} · {entry.actorName}
                  </p>
                </div>
                <time className="text-[10px] text-slate-400">
                  {new Date(entry.createdAt).toLocaleString('vi-VN')}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModulePage>
  );
}
