'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DocumentItem,
  DocumentStatus,
  DocumentActivity,
  SignedUrlResponse,
  DocumentVersion,
} from '@lpms/types';
import { documentApi } from '@/lib/api/documents';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Dialog } from '../../../components/ui/dialog';
import { Tabs } from '../../../components/ui/tabs';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [activities, setActivities] = useState<DocumentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'versions' | 'permissions' | 'activity'>(
    'overview',
  );

  // Download modal state
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadVersionNumber, setDownloadVersionNumber] = useState<number | null>(null);
  const [signedUrlData, setSignedUrlData] = useState<SignedUrlResponse | null>(null);
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);

  // New Version Modal state (Section 26)
  const [newVersionModalOpen, setNewVersionModalOpen] = useState(false);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [newVersionComment, setNewVersionComment] = useState('');
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);

  // Restore Version Modal state (Section 26)
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<DocumentVersion | null>(null);
  const [restoreComment, setRestoreComment] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  // Soft Delete Modal state (Section 29)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Permission settings form state (Section 28)
  const [permSensitive, setPermSensitive] = useState(false);
  const [permWatermark, setPermWatermark] = useState(true);
  const [permDownloadRestricted, setPermDownloadRestricted] = useState(false);
  const [permPartnerOnly, setPermPartnerOnly] = useState(false);
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  const loadDocumentData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [docData, actData] = await Promise.all([
        documentApi.getDocument(id),
        documentApi.getDocumentActivities(id),
      ]);
      setDocument(docData);
      setActivities(actData);

      // sync permissions
      setPermSensitive(docData.isSensitive);
      setPermWatermark(docData.watermarkEnabled);
      setPermDownloadRestricted(docData.downloadRestricted);
      setPermPartnerOnly(docData.partnerOnly);
    } catch (err) {
      console.error('Lỗi nạp tài liệu:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDocumentData();
  }, [loadDocumentData]);

  // Request signed download URL
  const handleOpenDownload = async (versionNum?: number) => {
    if (!document) return;
    const targetVer = versionNum || document.currentVersion;
    setDownloadVersionNumber(targetVer);
    setDownloadModalOpen(true);
    setIsGeneratingUrl(true);
    try {
      const res = await documentApi.requestSignedDownloadUrl(document.id, targetVer);
      setSignedUrlData(res);
      // Reload activities because download was audited
      const updatedActs = await documentApi.getDocumentActivities(document.id);
      setActivities(updatedActs);
    } catch (err) {
      console.error('Lỗi tạo liên kết tải:', err);
    } finally {
      setIsGeneratingUrl(false);
    }
  };

  // Status transition
  const handleStatusChange = async (newStatus: DocumentStatus) => {
    if (!document) return;
    try {
      const updated = await documentApi.changeStatus(document.id, newStatus);
      setDocument(updated);
      const updatedActs = await documentApi.getDocumentActivities(document.id);
      setActivities(updatedActs);
    } catch (err) {
      console.error('Lỗi đổi trạng thái:', err);
    }
  };

  // Upload new version
  const handleUploadNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document || !newVersionFile || !newVersionComment.trim()) return;
    setIsUploadingVersion(true);
    try {
      const updated = await documentApi.uploadNewVersion(document.id, {
        fileName: newVersionFile.name,
        fileSize: newVersionFile.size,
        mimeType: newVersionFile.type || 'application/octet-stream',
        comment: newVersionComment.trim(),
      });
      setDocument(updated);
      setNewVersionModalOpen(false);
      setNewVersionFile(null);
      setNewVersionComment('');
      const updatedActs = await documentApi.getDocumentActivities(document.id);
      setActivities(updatedActs);
    } catch (err) {
      console.error('Lỗi tải lên phiên bản mới:', err);
    } finally {
      setIsUploadingVersion(false);
    }
  };

  // Restore previous version (Creates a new version per Section 26)
  const handleConfirmRestore = async () => {
    if (!document || !versionToRestore) return;
    setIsRestoring(true);
    try {
      const updated = await documentApi.restoreVersion(
        document.id,
        versionToRestore.versionNumber,
        restoreComment.trim() || undefined,
      );
      setDocument(updated);
      setRestoreModalOpen(false);
      setVersionToRestore(null);
      setRestoreComment('');
      const updatedActs = await documentApi.getDocumentActivities(document.id);
      setActivities(updatedActs);
    } catch (err) {
      console.error('Lỗi phục hồi phiên bản:', err);
    } finally {
      setIsRestoring(false);
    }
  };

  // Save permissions
  const handleSavePermissions = async () => {
    if (!document) return;
    setIsSavingPerms(true);
    try {
      const updated = await documentApi.updatePermissions(document.id, {
        isSensitive: permSensitive,
        watermarkEnabled: permWatermark,
        downloadRestricted: permDownloadRestricted,
        partnerOnly: permPartnerOnly,
      });
      setDocument(updated);
      const updatedActs = await documentApi.getDocumentActivities(document.id);
      setActivities(updatedActs);
    } catch (err) {
      console.error('Lỗi cập nhật quyền:', err);
    } finally {
      setIsSavingPerms(false);
    }
  };

  // Soft delete document
  const handleConfirmDelete = async () => {
    if (!document) return;
    setIsDeleting(true);
    try {
      await documentApi.softDelete(document.id, deleteReason);
      setDeleteModalOpen(false);
      router.push('/documents');
    } catch (err) {
      console.error('Lỗi xóa tài liệu:', err);
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="neutral">Bản thảo (Draft)</Badge>;
      case 'INTERNAL_REVIEW':
        return <Badge variant="warning">Nội bộ thẩm duyệt</Badge>;
      case 'CLIENT_REVIEW':
        return <Badge variant="primary">Khách hàng rà soát</Badge>;
      case 'APPROVED':
        return <Badge variant="success">Đã phê duyệt</Badge>;
      case 'SIGNED':
        return <Badge variant="success">Đã ký kết</Badge>;
      case 'FINAL':
        return <Badge variant="success">Chính thức (Final)</Badge>;
      case 'ARCHIVED':
        return <Badge variant="neutral">Lưu trữ (Archived)</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        <p className="text-xs text-slate-400">
          Đang truy xuất hồ sơ tài liệu từ S3 Secure Vault...
        </p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="py-16 text-center space-y-3">
        <span className="text-4xl block">🔍</span>
        <h2 className="text-sm font-semibold text-white">Không tìm thấy tài liệu</h2>
        <p className="text-xs text-slate-400">Tài liệu không tồn tại hoặc đã bị xóa vĩnh viễn.</p>
        <Link href="/documents">
          <Button size="sm" variant="primary">
            Quay lại kho tài liệu
          </Button>
        </Link>
      </div>
    );
  }

  const isPdf = document.fileName.endsWith('.pdf');
  const isDocx = document.fileName.endsWith('.docx') || document.fileName.endsWith('.doc');

  return (
    <div className="lpms-legacy-document space-y-6">
      {/* Top Header Card */}
      <Card className="p-6 bg-slate-800/90 border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href={`/matters/${document.matterId}`}
                className="text-blue-400 hover:underline font-medium"
              >
                {document.matterCode} - {document.matterTitle}
              </Link>
              <span className="text-slate-600">&bull;</span>
              <span className="text-slate-300 flex items-center gap-1">
                <span>📁</span> {document.folderName}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight">{document.title}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-700 font-mono font-bold">
                Phiên bản v{document.currentVersion}
              </span>
              {getStatusBadge(document.status)}
              {document.isSensitive && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700 font-medium flex items-center gap-1">
                  <span>🔒</span> MẬT (Watermark)
                </span>
              )}
            </div>

            {document.description && (
              <p className="text-xs text-slate-300 max-w-3xl">{document.description}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleOpenDownload(document.currentVersion)}
              className="flex items-center gap-1.5"
            >
              <span>⬇️</span> Tải xuống (Signed URL)
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => setNewVersionModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <span>⬆️</span> Tải phiên bản mới
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <span>🗑️</span> Thùng rác
            </Button>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: 'Tổng quan & Bản xem trước',
          },
          {
            id: 'versions',
            label: `Lịch sử phiên bản (${document.versions.length})`,
          },
          {
            id: 'permissions',
            label: 'Chính sách bảo mật (Mục 28)',
          },
          {
            id: 'activity',
            label: `Nhật ký thao tác & Audit (${activities.length})`,
          },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
      />

      {/* Tab 1: Overview & Preview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metadata Card */}
          <Card className="lg:col-span-1 p-5 bg-slate-800/80 border-slate-700 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-700 pb-2">
              Thông số kỹ thuật S3 Storage
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Tên tệp gốc:</span>
                <span className="font-mono text-slate-200 break-all">{document.fileName}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Định dạng & Dung lượng:</span>
                <span className="text-slate-200">
                  {document.fileType.toUpperCase()} •{' '}
                  {(document.fileSize / (1024 * 1024)).toFixed(2)} MB (
                  {document.fileSize.toLocaleString()} bytes)
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">MIME Type:</span>
                <span className="font-mono text-slate-300 text-[11px]">{document.mimeType}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">
                  Mã khóa S3 (UUID Storage Key):
                </span>
                <span className="font-mono text-[10px] text-blue-300 break-all block p-2 rounded bg-slate-900 border border-slate-700 mt-0.5">
                  {document.storageKey}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">
                  Kiểm tra tính toàn vẹn (SHA-256):
                </span>
                <span className="font-mono text-[10px] text-emerald-400 break-all block p-2 rounded bg-slate-900 border border-slate-700 mt-0.5">
                  {document.sha256}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Người tạo:</span>
                <span className="text-slate-200">
                  {document.createdByName} (
                  {new Date(document.createdAt).toLocaleDateString('vi-VN')})
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Cập nhật lần cuối:</span>
                <span className="text-slate-200">
                  {new Date(document.updatedAt).toLocaleString('vi-VN')}
                </span>
              </div>

              {/* Status Transition Control (Section 27) */}
              <div className="pt-2 border-t border-slate-700">
                <label className="block text-slate-400 text-[11px] mb-1 font-medium">
                  Chuyển trạng thái quy trình (Mục 27):
                </label>
                <select
                  value={document.status}
                  onChange={(e) => handleStatusChange(e.target.value as DocumentStatus)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="DRAFT">DRAFT (Bản thảo)</option>
                  <option value="INTERNAL_REVIEW">INTERNAL_REVIEW (Nội bộ thẩm duyệt)</option>
                  <option value="CLIENT_REVIEW">CLIENT_REVIEW (Khách hàng rà soát)</option>
                  <option value="APPROVED">APPROVED (Đã phê duyệt)</option>
                  <option value="SIGNED">SIGNED (Đã ký kết)</option>
                  <option value="FINAL">FINAL (Chính thức)</option>
                  <option value="ARCHIVED">ARCHIVED (Lưu trữ)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Preview Container */}
          <Card className="lg:col-span-2 p-6 bg-slate-800/80 border-slate-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <span>👁️</span> Bản xem trước tài liệu (Document Preview Sandbox)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Read-Only Secure Viewer
                </span>
              </div>

              {/* Watermark Banner if enabled */}
              {document.watermarkEnabled && (
                <div className="p-2 mb-4 rounded bg-amber-950/30 border border-amber-800/50 text-[11px] text-amber-300 font-mono text-center">
                  ⚠️ WATERMARK ACTIVE: MẬT - CÔNG TY LUẬT LPMS - NGƯỜI XEM: LUẬT SƯ TRẦN TUẤN VŨ -{' '}
                  {new Date().toISOString().slice(0, 10)}
                </div>
              )}

              {/* Document Content Simulation */}
              <div className="p-6 rounded-lg bg-slate-900 border border-slate-700 space-y-4 font-serif text-slate-300 relative overflow-hidden">
                {document.watermarkEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-5 rotate-[-25deg] text-4xl font-extrabold text-white">
                    CONFIDENTIAL - LPMS
                  </div>
                )}

                <div className="text-center space-y-1 pb-4 border-b border-slate-800">
                  <p className="text-xs uppercase tracking-widest font-sans text-slate-400">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </p>
                  <p className="text-[11px] font-sans text-slate-400">
                    Độc lập - Tự do - Hạnh phúc
                  </p>
                  <h2 className="text-base font-bold text-white pt-2">{document.title}</h2>
                  <p className="text-xs text-slate-400 font-sans">
                    Vụ việc: {document.matterCode} • Thư mục: {document.folderName} • Phiên bản: v
                    {document.currentVersion}
                  </p>
                </div>

                <div className="text-xs leading-relaxed space-y-3 font-sans">
                  <p className="font-semibold text-slate-200">Trích yếu nội dung tài liệu:</p>
                  <p className="text-slate-300 italic">
                    {document.description ||
                      'Tài liệu lưu trữ chính thức thuộc hồ sơ vụ việc pháp lý, tuân thủ tiêu chuẩn bảo mật dữ liệu và kiểm soát toàn vẹn SHA-256.'}
                  </p>

                  <div className="p-3 rounded bg-slate-800/60 border border-slate-700 space-y-1 text-[11px]">
                    <p className="font-semibold text-white">Xác nhận tình trạng tệp:</p>
                    <p className="text-slate-400">
                      • Tệp tin gốc: <span className="text-slate-200">{document.fileName}</span>
                    </p>
                    <p className="text-slate-400">
                      • Chữ ký SHA-256:{' '}
                      <span className="font-mono text-emerald-400">{document.sha256}</span>
                    </p>
                    <p className="text-slate-400">
                      • Trạng thái pháp lý:{' '}
                      <span className="text-blue-400 font-medium">{document.status}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-700 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Để xem hoặc chỉnh sửa toàn văn trên máy cục bộ:
              </span>
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleOpenDownload(document.currentVersion)}
                className="text-xs"
              >
                Tạo liên kết tải về (Signed URL) &rarr;
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Version History (Section 26) */}
      {activeTab === 'versions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Quản lý lịch sử phiên bản (Mục 26 require.md)
              </h3>
              <p className="text-[11px] text-slate-400">
                Không ghi đè bản cũ. Chức năng khôi phục (Restore) tạo ra phiên bản mới nhất và bảo
                lưu toàn bộ lịch sử trước đó.
              </p>
            </div>

            <Button size="sm" variant="primary" onClick={() => setNewVersionModalOpen(true)}>
              + Tải lên phiên bản mới (v{document.versions.length + 1})
            </Button>
          </div>

          <div className="space-y-3">
            {document.versions
              .slice()
              .reverse()
              .map((ver) => (
                <Card
                  key={ver.id}
                  className={`p-4 transition-colors ${
                    ver.isCurrent
                      ? 'bg-blue-950/20 border-blue-700/60 shadow-sm'
                      : 'bg-slate-800/80 border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                            ver.isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          v{ver.versionNumber}
                        </span>
                        <span className="font-semibold text-sm text-white">{ver.fileName}</span>
                        {ver.isCurrent && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-medium">
                            Bản hiện hành
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 italic pt-0.5">
                        &ldquo;{ver.comment || 'Không có ghi chú'}&rdquo;
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span>Bởi: {ver.uploadedByName}</span>
                        <span>•</span>
                        <span>{new Date(ver.uploadedAt).toLocaleString('vi-VN')}</span>
                        <span>•</span>
                        <span>{(ver.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                        <span>•</span>
                        <span className="font-mono text-slate-500">
                          SHA: {ver.sha256.slice(0, 12)}...
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenDownload(ver.versionNumber)}
                        className="text-xs"
                      >
                        Tải bản này
                      </Button>

                      {!ver.isCurrent && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setVersionToRestore(ver);
                            setRestoreModalOpen(true);
                          }}
                          className="text-xs text-amber-400 hover:text-amber-300"
                        >
                          Khôi phục (Restore)
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Tab 3: Security Policies & Permissions (Section 28) */}
      {activeTab === 'permissions' && (
        <div className="max-w-3xl space-y-6">
          <Card className="p-5 bg-slate-800/80 border-slate-700 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-700 pb-2">
              Chính sách bảo vệ tài liệu nhạy cảm (Mục 28 require.md)
            </h3>

            <div className="space-y-4">
              <label className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permSensitive}
                  onChange={(e) => setPermSensitive(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">
                    🔒 Tài liệu Mật (Sensitive Classification)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Kích hoạt các biện pháp giám sát nghiêm ngặt và hạn chế quyền truy cập chéo.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permWatermark}
                  onChange={(e) => setPermWatermark(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">
                    🛡️ Watermark Bảo mật khi Tải/Xem
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Tự động khắc họ tên người tải và thời gian tải lên văn bản để chống rò rỉ dữ
                    liệu.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permDownloadRestricted}
                  onChange={(e) => setPermDownloadRestricted(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">
                    🚫 Khóa Quyền Tải Xuống (View Only)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Không cho phép tải về máy tính cá nhân; chỉ được đọc trực tiếp trên cổng an
                    toàn.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permPartnerOnly}
                  onChange={(e) => setPermPartnerOnly(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">
                    👑 Giới hạn Partner-Only Whitelist
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Chỉ các Luật sư Thành viên góp vốn (Partners) mới có quyền mở tài liệu này.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                size="sm"
                variant="primary"
                onClick={handleSavePermissions}
                disabled={isSavingPerms}
              >
                {isSavingPerms ? 'Đang lưu...' : 'Lưu thay đổi chính sách'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Audit Timeline (Section 30 & 2541) */}
      {activeTab === 'activity' && (
        <Card className="p-5 bg-slate-800/80 border-slate-700 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Nhật ký kiểm toán bất biến (Immutable Audit Trail)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Tổng số {activities.length} bản ghi
            </span>
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
            {activities.map((act) => (
              <div key={act.id} className="relative space-y-1">
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-slate-900" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-white">{act.details}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-mono">
                    {act.action}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>Thực hiện bởi: {act.performedByName}</span>
                  <span>•</span>
                  <span>{new Date(act.performedAt).toLocaleString('vi-VN')}</span>
                  {act.ipAddress && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-slate-500">IP: {act.ipAddress}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Download Signed URL Modal (Section 30) */}
      <Dialog
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        title="Tải xuống Tài liệu Bảo mật (Mục 30 require.md)"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-800 text-xs text-blue-300 space-y-1">
            <p className="font-semibold flex items-center gap-1">
              <span>🛡️</span> Luồng kiểm soát tải xuống (Short-lived Signed URL):
            </p>
            <p className="text-[11px] text-slate-300">
              Hệ thống đã xác thực quyền, ghi nhận Audit Log và tạo URL ký điện tử có hiệu lực trong
              15 phút.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400">Tài liệu:</span>{' '}
              <span className="font-semibold text-white">{document.title}</span>
            </div>
            <div>
              <span className="text-slate-400">Phiên bản tải:</span>{' '}
              <span className="font-mono text-blue-400 font-bold">v{downloadVersionNumber}</span>
            </div>
            <div>
              <span className="text-slate-400">Tệp tin:</span>{' '}
              <span className="font-mono text-slate-200">
                {signedUrlData?.fileName || document.fileName}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Tính toàn vẹn (SHA-256):</span>{' '}
              <span className="font-mono text-[10px] text-emerald-400 break-all block p-1.5 rounded bg-slate-900 border border-slate-700 mt-1">
                {signedUrlData?.sha256 || document.sha256}
              </span>
            </div>

            {signedUrlData?.watermarkText && (
              <div className="p-2 rounded bg-amber-950/40 border border-amber-800/60 text-[11px] text-amber-300">
                <span className="font-semibold">Watermark nhúng vào tệp:</span>
                <p className="font-mono text-[10px] mt-0.5">{signedUrlData.watermarkText}</p>
              </div>
            )}
          </div>

          {isGeneratingUrl ? (
            <div className="py-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2" />
              <p className="text-xs text-slate-400">Đang ký điện tử và ghi nhận Audit log...</p>
            </div>
          ) : (
            <div className="pt-2 flex items-center justify-between border-t border-slate-700">
              <span className="text-[11px] text-amber-400 font-mono">
                ⏱️ URL hết hạn sau 15 phút (900s)
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setDownloadModalOpen(false)}>
                  Đóng
                </Button>
                {signedUrlData?.downloadUrl && (
                  <a
                    href={signedUrlData.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      setTimeout(() => setDownloadModalOpen(false), 500);
                    }}
                  >
                    <Button size="sm" variant="primary">
                      Tải về máy ngay &rarr;
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </Dialog>

      {/* New Version Upload Modal (Section 26) */}
      <Dialog
        isOpen={newVersionModalOpen}
        onClose={() => setNewVersionModalOpen(false)}
        title={`Tải lên Phiên bản mới (v${document.versions.length + 1})`}
      >
        <form onSubmit={handleUploadNewVersion} className="space-y-4">
          <p className="text-xs text-slate-300">
            Hệ thống sẽ lưu trữ phiên bản mới nhất và chuyển phiên bản hiện tại (v
            {document.currentVersion}) vào kho lưu trữ lịch sử, không ghi đè.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Chọn tệp tin phiên bản mới <span className="text-rose-400">*</span>
            </label>
            <input
              required
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setNewVersionFile(e.target.files[0]);
                }
              }}
              className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Ghi chú nội dung thay đổi (Changelog) <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={newVersionComment}
              onChange={(e) => setNewVersionComment(e.target.value)}
              placeholder="VD: Điều chỉnh điều khoản bảo lãnh thanh toán theo yêu cầu của đối tác..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-700">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setNewVersionModalOpen(false)}
              disabled={isUploadingVersion}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={!newVersionFile || !newVersionComment.trim() || isUploadingVersion}
            >
              {isUploadingVersion ? 'Đang tải lên...' : 'Lưu phiên bản mới'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Restore Version Modal (Section 26) */}
      <Dialog
        isOpen={restoreModalOpen}
        onClose={() => setRestoreModalOpen(false)}
        title="Khôi phục Phiên bản Cũ (Mục 26 require.md)"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800 text-xs text-amber-300">
            <p className="font-semibold">Quy tắc bảo toàn lịch sử:</p>
            <p className="text-[11px] text-slate-300 mt-1">
              Khôi phục từ bản <strong>v{versionToRestore?.versionNumber}</strong> sẽ tạo ra một
              phiên bản mới (<strong>v{document.versions.length + 1}</strong>) có cùng nội dung tệp.
              Toàn bộ lịch sử trước đây vẫn được giữ nguyên vẹn.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Lý do khôi phục phiên bản
            </label>
            <input
              type="text"
              value={restoreComment}
              onChange={(e) => setRestoreComment(e.target.value)}
              placeholder="VD: Quay lại phương án đàm phán hợp đồng ban đầu..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-700">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRestoreModalOpen(false)}
              disabled={isRestoring}
            >
              Hủy
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleConfirmRestore}
              disabled={isRestoring}
            >
              {isRestoring
                ? 'Đang khôi phục...'
                : `Tạo bản v${document.versions.length + 1} từ v${versionToRestore?.versionNumber}`}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Soft Delete Modal (Section 29) */}
      <Dialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Chuyển tài liệu vào Thùng rác (Soft Delete)"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Tài liệu <strong className="text-white">&ldquo;{document.title}&rdquo;</strong> sẽ được
            chuyển vào Thùng rác. Có thể khôi phục lại bất kỳ lúc nào từ trang Thùng rác.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Lý do xóa / lưu ý (Ghi nhận Audit log)
            </label>
            <input
              type="text"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="VD: Bản nháp bị hủy, hồ sơ hết hiệu lực..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-700">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Đang chuyển...' : 'Xác nhận xóa'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
