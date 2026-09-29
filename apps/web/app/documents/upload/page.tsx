'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Matter, DocumentFolder, DocumentStatus } from '@lpms/types';
import { documentApi } from '@/lib/api/documents';
import { matterApi } from '@/lib/api/operations';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Alert } from '../../../components/ui/alert';

function DocumentUploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedMatterId = searchParams.get('matterId') || '';

  const [matters, setMatters] = useState<Matter[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [selectedMatterId, setSelectedMatterId] = useState<string>(preselectedMatterId);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');

  // File upload state
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ file: File; mimeType: string } | null>(null);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);

  // Metadata form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<DocumentStatus>('DRAFT');
  const [comment, setComment] = useState('Tải lên bản nháp khởi tạo v1');

  // Security policies (Section 28)
  const [isSensitive, setIsSensitive] = useState(false);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [downloadRestricted, setDownloadRestricted] = useState(false);
  const [partnerOnly, setPartnerOnly] = useState(false);

  // Upload Progress simulation (Section 25)
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const [mattersData, foldersData] = await Promise.all([
          matterApi.getMatters(),
          documentApi.getFolders(),
        ]);
        setMatters(mattersData);
        setFolders(foldersData);

        const initialMatter = preselectedMatterId || (mattersData[0] ? mattersData[0].id : '');
        setSelectedMatterId(initialMatter);

        if (initialMatter) {
          const matterFolders = foldersData.filter((f) => f.matterId === initialMatter);
          if (matterFolders.length > 0) {
            setSelectedFolderId(matterFolders[0].id);
          }
        }
      } catch (err) {
        console.error('Lỗi nạp danh mục:', err);
      }
    }
    init();
  }, [preselectedMatterId]);

  // When selectedMatterId changes, update folder
  const handleMatterChange = (matterId: string) => {
    setSelectedMatterId(matterId);
    const matterFolders = folders.filter((f) => f.matterId === matterId);
    if (matterFolders.length > 0) {
      setSelectedFolderId(matterFolders[0].id);
    } else {
      setSelectedFolderId('');
    }
  };

  // Allowed extensions & size limit (50MB)
  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  const MIME_BY_EXTENSION: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
  };

  const validateAndSetFile = (file: File) => {
    setFileValidationError(null);
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const mimeType = MIME_BY_EXTENSION[ext];
    if (!mimeType) {
      setFileValidationError(
        `Định dạng tệp không được hỗ trợ (${ext}). Chỉ chấp nhận PDF, Word, Excel, JPG và PNG.`,
      );
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileValidationError('Dung lượng tệp vượt quá hạn mức tối đa cho phép (50 MB).');
      return;
    }

    setSelectedFile({ file, mimeType });

    if (!title) {
      // Auto fill title without extension
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setTitle(nameWithoutExt.replace(/_/g, ' '));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatterId || !selectedFolderId || !selectedFile || !title.trim()) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    setUploadStage('Đang tạo bản ghi tài liệu...');

    try {
      const createdDoc = await documentApi.uploadDocument({
        matterId: selectedMatterId,
        folderId: selectedFolderId,
        title: title.trim(),
        description: description.trim() || undefined,
        fileName: selectedFile.file.name,
        fileSize: selectedFile.file.size,
        mimeType: selectedFile.mimeType,
        comment: comment.trim() || undefined,
        isSensitive,
        watermarkEnabled,
        downloadRestricted,
        partnerOnly,
        status,
      });

      setUploadProgress(45);
      setUploadStage('Đang yêu cầu liên kết tải lên bảo mật...');
      const signedUpload = await documentApi.requestSignedUploadUrl(
        createdDoc.id,
        selectedFile.mimeType,
      );

      if (signedUpload.storageProvider !== 'mock') {
        setUploadProgress(70);
        setUploadStage('Đang tải tệp lên kho lưu trữ riêng tư...');
        const uploadResponse = await fetch(signedUpload.uploadUrl, {
          method: signedUpload.method,
          headers: signedUpload.requiredHeaders,
          body: selectedFile.file,
        });
        if (!uploadResponse.ok) {
          throw new Error(`Storage upload failed with status ${uploadResponse.status}`);
        }
      }

      setUploadProgress(100);
      setUploadStage('Tải lên hoàn tất thành công!');
      await new Promise((r) => setTimeout(r, 400));
      router.push(`/documents/${createdDoc.id}`);
    } catch (err) {
      console.error('Lỗi tải tài liệu:', err);
      setIsUploading(false);
    }
  };

  const availableFolders = folders.filter((f) => f.matterId === selectedMatterId);

  return (
    <div className="lpms-legacy-document max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📤</span> Tải lên Tài liệu Mới (Upload Document)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tuân thủ quy trình kiểm soát tệp tin Mục 25 &amp; phân quyền bảo mật Mục 28 require.md
          </p>
        </div>
        <Link href="/documents">
          <Button size="sm" variant="ghost">
            &larr; Quay lại danh sách
          </Button>
        </Link>
      </div>

      <form onSubmit={handleUploadSubmit} className="space-y-6">
        {/* Step 1: Matter & Folder Selection */}
        <Card className="p-5 bg-slate-800/80 border-slate-700 space-y-4">
          <h2 className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>1.</span> Xác định Vụ việc & Thư mục Lưu trữ (Mục 24)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Vụ việc áp dụng (Matter) <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={selectedMatterId}
                onChange={(e) => handleMatterChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Chọn vụ việc --</option>
                {matters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.matterCode} - {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Thư mục lưu trữ (01 - 09 Chuẩn) <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {availableFolders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Step 2: Drag and Drop File Dropzone */}
        <Card className="p-5 bg-slate-800/80 border-slate-700 space-y-4">
          <h2 className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>2.</span> Kéo thả Tệp tin & Kiểm tra Hợp lệ (Mục 25)
          </h2>

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-blue-500 bg-blue-950/30'
                : selectedFile
                  ? 'border-emerald-500/60 bg-emerald-950/20'
                  : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
            }`}
          >
            <input
              type="file"
              id="file-upload-input"
              className="hidden"
              onChange={handleFileInput}
              accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg"
            />

            {selectedFile ? (
              <div className="space-y-2">
                <span className="text-4xl block">📄</span>
                <p className="text-sm font-semibold text-white">{selectedFile.file.name}</p>
                <p className="text-xs text-slate-400">
                  Dung lượng: {(selectedFile.file.size / (1024 * 1024)).toFixed(2)} MB • MIME:{' '}
                  {selectedFile.mimeType}
                </p>
                <p className="text-[10px] text-emerald-300 pt-2">
                  ✓ Định dạng và dung lượng hợp lệ
                </p>
                <div className="pt-2">
                  <label
                    htmlFor="file-upload-input"
                    className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer underline"
                  >
                    Thay đổi tệp khác
                  </label>
                </div>
              </div>
            ) : (
              <label htmlFor="file-upload-input" className="cursor-pointer block space-y-2">
                <span className="text-4xl block text-slate-400">📁</span>
                <p className="text-sm font-medium text-slate-200">
                  Kéo và thả tệp tài liệu vào đây, hoặc{' '}
                  <span className="text-blue-400 hover:underline">duyệt tệp từ máy tính</span>
                </p>
                <p className="text-xs text-slate-500">
                  Hỗ trợ: PDF, Word, Excel, JPG, PNG • Tối đa 50 MB mỗi tệp
                </p>
              </label>
            )}
          </div>

          {fileValidationError && (
            <Alert variant="error" title="Tệp không hợp lệ">
              {fileValidationError}
            </Alert>
          )}
        </Card>

        {/* Step 3: Metadata Form */}
        <Card className="p-5 bg-slate-800/80 border-slate-700 space-y-4">
          <h2 className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>3.</span> Thông tin Chỉ mục & Trạng thái Ban đầu (Mục 26 & 27)
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tiêu đề tài liệu <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Thỏa thuận sáp nhập và mua lại cổ phần (Draft v1)"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Trạng thái xử lý ban đầu (Mục 27)
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DocumentStatus)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="DRAFT">Bản thảo (DRAFT)</option>
                  <option value="INTERNAL_REVIEW">Nội bộ thẩm duyệt (INTERNAL_REVIEW)</option>
                  <option value="CLIENT_REVIEW">Khách hàng rà soát (CLIENT_REVIEW)</option>
                  <option value="APPROVED">Đã phê duyệt (APPROVED)</option>
                  <option value="FINAL">Chính thức (FINAL)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Ghi chú phiên bản v1 (Commit Note)
                </label>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ghi chú tóm tắt nội dung khởi tạo..."
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mô tả nội dung / Trích yếu tài liệu
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tóm tắt thông tin quan trọng hoặc phạm vi áp dụng..."
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Step 4: Security & Permissions Policies (Section 28) */}
        <Card className="p-5 bg-slate-800/80 border-slate-700 space-y-4">
          <h2 className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>4.</span> Chính sách Bảo mật & Phân quyền Truy cập (Mục 28)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
              <input
                type="checkbox"
                checked={isSensitive}
                onChange={(e) => setIsSensitive(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white flex items-center gap-1">
                  <span>🔒</span> Đánh dấu Tài liệu Mật (Sensitive)
                </span>
                <p className="text-[11px] text-slate-400">
                  Tài liệu chứa thông tin bí mật thương mại, bí mật vụ việc hoặc hồ sơ tố tụng nhạy
                  cảm.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
              <input
                type="checkbox"
                checked={watermarkEnabled}
                onChange={(e) => setWatermarkEnabled(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white flex items-center gap-1">
                  <span>🛡️</span> Bật Watermark Bảo mật khi Xuất File
                </span>
                <p className="text-[11px] text-slate-400">
                  Tự động nhúng họ tên người tải, timestamp và nhãn bảo mật lên tài liệu khi tải
                  xuống.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
              <input
                type="checkbox"
                checked={downloadRestricted}
                onChange={(e) => setDownloadRestricted(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white flex items-center gap-1">
                  <span>🚫</span> Khóa Quyền Tải Xuống Trực Tiếp
                </span>
                <p className="text-[11px] text-slate-400">
                  Chỉ cho phép đọc/xem trực tuyến trên hệ thống, không cấp link tải về máy cục bộ.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
              <input
                type="checkbox"
                checked={partnerOnly}
                onChange={(e) => setPartnerOnly(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white flex items-center gap-1">
                  <span>👑</span> Giới hạn Partner-Only
                </span>
                <p className="text-[11px] text-slate-400">
                  Chỉ thành viên góp vốn (Partners) và người phụ trách chính mới có quyền truy cập.
                </p>
              </div>
            </label>
          </div>
        </Card>

        {/* Progress Bar during upload */}
        {isUploading && (
          <Card className="p-4 bg-blue-950/40 border-blue-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-300 font-medium">{uploadStage}</span>
              <span className="font-mono text-white font-bold">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/documents">
            <Button size="sm" variant="ghost" disabled={isUploading}>
              Hủy bỏ
            </Button>
          </Link>
          <Button
            size="sm"
            variant="primary"
            disabled={!selectedFile || !selectedMatterId || !selectedFolderId || isUploading}
          >
            {isUploading ? 'Đang tải lên...' : 'Tải lên và lưu tài liệu'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function DocumentUploadPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-16 text-center text-xs text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2" />
          <p>Đang chuẩn bị giao diện tải tài liệu...</p>
        </div>
      }
    >
      <DocumentUploadContent />
    </React.Suspense>
  );
}
