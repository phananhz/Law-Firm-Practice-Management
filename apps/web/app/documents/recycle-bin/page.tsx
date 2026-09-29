'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DocumentItem } from '@lpms/types';
import { documentApi } from '@/lib/api/documents';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Dialog } from '../../../components/ui/dialog';
import { Alert } from '../../../components/ui/alert';

export default function RecycleBinPage() {
  const [deletedDocuments, setDeletedDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Restore state
  const [isRestoring, setIsRestoring] = useState(false);

  // Permanent Purge modal state (Section 29)
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [docToPurge, setDocToPurge] = useState<DocumentItem | null>(null);
  const [confirmationWord, setConfirmationWord] = useState('');
  const [isPurging, setIsPurging] = useState(false);
  const [purgeError, setPurgeError] = useState<string | null>(null);

  const loadRecycleBin = async () => {
    setIsLoading(true);
    try {
      const data = await documentApi.getDocuments({ isDeleted: true });
      setDeletedDocuments(data);
    } catch (err) {
      console.error('Lỗi nạp danh sách thùng rác:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecycleBin();
  }, []);

  const handleRestore = async (docId: string) => {
    setIsRestoring(true);
    try {
      await documentApi.restoreFromRecycleBin(docId);
      await loadRecycleBin();
    } catch (err) {
      console.error('Lỗi phục hồi tài liệu:', err);
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePermanentPurge = async () => {
    if (!docToPurge) return;
    setPurgeError(null);
    if (confirmationWord !== 'DELETE_FOREVER') {
      setPurgeError('Vui lòng nhập chính xác từ khóa "DELETE_FOREVER" để xác nhận.');
      return;
    }

    setIsPurging(true);
    try {
      await documentApi.permanentPurge(docToPurge.id, confirmationWord);
      setPurgeModalOpen(false);
      setDocToPurge(null);
      setConfirmationWord('');
      await loadRecycleBin();
    } catch (err) {
      console.error('Lỗi xóa vĩnh viễn tài liệu:', err);
      setPurgeError('Không thể xóa tài liệu. Vui lòng kiểm tra lại quyền hạn.');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🗑️</span> Thùng rác & Phục hồi Tài liệu (Mục 29 require.md)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chính sách Soft Delete: Giữ an toàn tài liệu, cho phép phục hồi hoặc xóa vĩnh viễn có
            kiểm soát và audit log.
          </p>
        </div>

        <Link href="/documents">
          <Button size="sm" variant="ghost">
            &larr; Quay lại Kho tài liệu
          </Button>
        </Link>
      </div>

      {/* Security alert */}
      <Alert variant="warning" title="Quy tắc an toàn dữ liệu pháp lý (Section 29):">
        Hệ thống không xóa cứng (hard-delete) trực tiếp từ giao diện làm việc. Mọi tài liệu xóa đều
        được chuyển vào Thùng rác với lý do và định danh người xóa. Thao tác xóa vĩnh viễn yêu cầu
        xác thực từ khóa đặc biệt và được ghi lại trong nhật ký kiểm toán.
      </Alert>

      {/* Main List */}
      {isLoading ? (
        <Card className="p-8 text-center bg-slate-800/80 border-slate-700">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2" />
          <p className="text-xs text-slate-400">Đang quét các tệp tin trong Thùng rác...</p>
        </Card>
      ) : deletedDocuments.length === 0 ? (
        <Card className="p-12 text-center bg-slate-800/80 border-slate-700 space-y-2">
          <span className="text-3xl block">✨</span>
          <p className="text-sm font-semibold text-white">Thùng rác hiện đang trống</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Không có tài liệu nào bị xóa gần đây. Mọi tài liệu pháp lý đang hoạt động bình thường
            trong các thư mục vụ việc.
          </p>
          <div className="pt-2">
            <Link href="/documents">
              <Button size="sm" variant="primary">
                Xem kho tài liệu
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {deletedDocuments.map((doc) => (
            <Card
              key={doc.id}
              className="p-5 bg-slate-800/90 border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">{doc.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                      Đã xóa
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                      v{doc.currentVersion}
                    </span>
                  </div>

                  <p className="text-xs text-rose-300/90">
                    Lý do xóa: &ldquo;{doc.deleteReason || 'Không nêu'}&rdquo;
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span>Vụ việc: {doc.matterCode}</span>
                    <span>•</span>
                    <span>Thư mục: {doc.folderName}</span>
                    <span>•</span>
                    <span>Xóa bởi: {doc.deletedByName}</span>
                    <span>•</span>
                    <span>
                      {doc.deletedAt ? new Date(doc.deletedAt).toLocaleString('vi-VN') : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleRestore(doc.id)}
                    disabled={isRestoring}
                    className="text-xs"
                  >
                    {isRestoring ? 'Đang phục hồi...' : 'Khôi phục tài liệu'}
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setDocToPurge(doc);
                      setConfirmationWord('');
                      setPurgeError(null);
                      setPurgeModalOpen(true);
                    }}
                    className="text-xs"
                  >
                    Xóa vĩnh viễn (Purge)
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Permanent Purge Modal (Section 29) */}
      <Dialog
        isOpen={purgeModalOpen}
        onClose={() => setPurgeModalOpen(false)}
        title="Cảnh báo: Xóa vĩnh viễn tài liệu (Mục 29 require.md)"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-xs text-rose-300 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <span>⚠️</span> HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC!
            </p>
            <p className="text-[11px] text-slate-200">
              Toàn bộ các tệp tin lưu trữ trên S3, lịch sử phiên bản và siêu dữ liệu của tài liệu{' '}
              <strong className="text-white">&ldquo;{docToPurge?.title}&rdquo;</strong> sẽ bị xóa
              sạch hoàn toàn khỏi hệ thống lưu trữ.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Để xác nhận, vui lòng gõ chính xác cụm từ{' '}
              <code className="text-rose-400 font-bold bg-slate-900 px-1 py-0.5 rounded border border-slate-700">
                DELETE_FOREVER
              </code>{' '}
              vào ô bên dưới:
            </label>
            <input
              type="text"
              value={confirmationWord}
              onChange={(e) => setConfirmationWord(e.target.value)}
              placeholder="DELETE_FOREVER"
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {purgeError && <p className="text-xs text-rose-400">{purgeError}</p>}

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-700">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPurgeModalOpen(false)}
              disabled={isPurging}
            >
              Hủy
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handlePermanentPurge}
              disabled={confirmationWord !== 'DELETE_FOREVER' || isPurging}
            >
              {isPurging ? 'Đang xóa vĩnh viễn...' : 'Xóa vĩnh viễn'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
