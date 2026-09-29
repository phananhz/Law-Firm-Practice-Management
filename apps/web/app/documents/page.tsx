'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  FileArchive,
  FileCheck2,
  FileText,
  Filter,
  FolderOpen,
  LockKeyhole,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import type { DocumentItem, DocumentStatus } from '@lpms/types';
import { documentApi } from '@/lib/api/documents';

const statusLabels: Record<DocumentStatus, string> = {
  DRAFT: 'Bản nháp',
  INTERNAL_REVIEW: 'Đang rà soát',
  CLIENT_REVIEW: 'Chờ khách hàng',
  APPROVED: 'Đã duyệt',
  SIGNED: 'Đã ký',
  FINAL: 'Bản chính thức',
  ARCHIVED: 'Lưu trữ',
};
const statusTones: Record<DocumentStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  INTERNAL_REVIEW: 'bg-amber-50 text-amber-700',
  CLIENT_REVIEW: 'bg-violet-50 text-violet-700',
  APPROVED: 'bg-blue-50 text-blue-700',
  SIGNED: 'bg-cyan-50 text-cyan-700',
  FINAL: 'bg-emerald-50 text-emerald-700',
  ARCHIVED: 'bg-slate-100 text-slate-500',
};

function formatSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | DocumentStatus>('ALL');
  const {
    data: documents = [],
    isLoading,
    isError,
  } = useQuery<DocumentItem[]>({
    queryKey: ['documents'],
    queryFn: () => documentApi.getDocuments({ isDeleted: false }),
  });
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return documents.filter(
      (document) =>
        (!keyword ||
          `${document.title} ${document.fileName} ${document.matterCode} ${document.matterTitle}`
            .toLowerCase()
            .includes(keyword)) &&
        (status === 'ALL' || document.status === status),
    );
  }, [documents, search, status]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <FileText className="h-4 w-4 text-blue-500" /> Kho tài liệu
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
            Tài liệu
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            Kho tài liệu tập trung theo hồ sơ, phiên bản và chính sách bảo mật.
          </p>
        </div>
        <Link
          href="/documents/upload"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Tải tài liệu lên
        </Link>
      </section>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Tổng tài liệu', value: documents.length, icon: FileText, tone: 'blue' },
          {
            label: 'Bản chính thức',
            value: documents.filter((document) => document.status === 'FINAL').length,
            icon: FileCheck2,
            tone: 'emerald',
          },
          {
            label: 'Tài liệu nhạy cảm',
            value: documents.filter((document) => document.isSensitive).length,
            icon: LockKeyhole,
            tone: 'rose',
          },
          { label: 'Trong thùng rác', value: 0, icon: Trash2, tone: 'slate' },
        ].map((item) => (
          <div key={item.label} className="lpms-card flex items-center gap-3 p-4 sm:p-5">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone === 'blue' ? 'bg-blue-50 text-blue-600' : item.tone === 'emerald' ? 'bg-emerald-50 text-emerald-600' : item.tone === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}
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
              placeholder="Tìm tên tài liệu, file hoặc hồ sơ..."
              className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as 'ALL' | DocumentStatus)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <Link
            href="/documents/recycle-bin"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Thùng rác
          </Link>
        </div>
      </section>
      <section className="lpms-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tài liệu gần đây</h3>
            <p className="mt-1 text-[11px] text-slate-400">Hiển thị {filtered.length} tài liệu</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
            <LockKeyhole className="h-3 w-3" /> Signed URL khi tải xuống
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50/70 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="px-5 py-3 sm:px-6">Tài liệu</th>
                <th className="px-4 py-3">Hồ sơ</th>
                <th className="px-4 py-3">Phiên bản</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Kích thước</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-xs text-slate-400">
                    Đang tải kho tài liệu...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-xs text-rose-600">
                    Không thể tải danh sách tài liệu.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-xs text-slate-400">
                    Không có tài liệu phù hợp.
                  </td>
                </tr>
              )}
              {!isLoading &&
                !isError &&
                filtered.map((document) => (
                  <tr key={document.id} className="text-xs hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 sm:px-6">
                      <Link href={`/documents/${document.id}`} className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          {document.isSensitive ? (
                            <LockKeyhole className="h-4 w-4" />
                          ) : document.fileType === 'pdf' ? (
                            <FileArchive className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block max-w-[280px] truncate font-bold text-slate-800">
                            {document.title}
                          </span>
                          <span className="mt-1 block max-w-[280px] truncate text-[10px] text-slate-400">
                            {document.fileName}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="block font-mono text-[10px] font-bold text-blue-600">
                        {document.matterCode}
                      </span>
                      <span className="mt-1 block max-w-[180px] truncate text-[10px] text-slate-400">
                        {document.matterTitle}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-700">
                      v{document.currentVersion}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusTones[document.status]}`}
                      >
                        {statusLabels[document.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{formatSize(document.fileSize)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/documents/${document.id}`}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50"
                      >
                        <Download className="h-3.5 w-3.5" /> Xem
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="lpms-card flex items-center gap-3 p-4">
          <FolderOpen className="h-5 w-5 text-blue-600" />
          <span>
            <span className="block text-xs font-bold text-slate-800">Theo hồ sơ</span>
            <span className="mt-1 block text-[10px] text-slate-400">
              Mỗi hồ sơ có cấu trúc folder chuẩn
            </span>
          </span>
        </div>
        <div className="lpms-card flex items-center gap-3 p-4">
          <LockKeyhole className="h-5 w-5 text-rose-600" />
          <span>
            <span className="block text-xs font-bold text-slate-800">Bảo mật nhiều lớp</span>
            <span className="mt-1 block text-[10px] text-slate-400">
              Whitelist và phân quyền tải xuống
            </span>
          </span>
        </div>
        <div className="lpms-card flex items-center gap-3 p-4">
          <FileCheck2 className="h-5 w-5 text-emerald-600" />
          <span>
            <span className="block text-xs font-bold text-slate-800">Quản lý phiên bản</span>
            <span className="mt-1 block text-[10px] text-slate-400">
              Không ghi đè lịch sử tài liệu
            </span>
          </span>
        </div>
      </section>
    </div>
  );
}
