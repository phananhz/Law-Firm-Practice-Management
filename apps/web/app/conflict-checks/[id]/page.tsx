'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  User,
  Scale,
  Building2,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  FileCheck2,
  ExternalLink,
  Lock,
  Eye,
  AlertCircle,
} from 'lucide-react';
import type {
  ConflictCheck,
  ConflictStatus,
  ConflictResultItem,
  ReviewConflictCheckPayload,
} from '@lpms/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { conflictApi } from '@/lib/api/operations';
import { useToast } from '@/components/ui/toast';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ConflictCheckDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const checkId = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [decisionType, setDecisionType] =
    useState<ReviewConflictCheckPayload['decisionType']>('APPROVED_NO_CONFLICT');
  const [decisionNotes, setDecisionNotes] = useState('');

  const {
    data: check,
    isLoading,
    isError,
  } = useQuery<ConflictCheck>({
    queryKey: ['conflict-check', checkId],
    queryFn: () => conflictApi.getConflictCheck(checkId),
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: ReviewConflictCheckPayload) =>
      conflictApi.reviewConflictCheck(checkId, payload),
    onSuccess: (data) => {
      success(data.message || 'Đã ghi nhận quyết định thẩm duyệt xung đột thành công!');
      queryClient.invalidateQueries({ queryKey: ['conflict-check', checkId] });
      queryClient.invalidateQueries({ queryKey: ['conflict-checks'] });
    },
    onError: (err: any) => {
      toastError(err.message || 'Có lỗi xảy ra khi lưu quyết định thẩm duyệt');
    },
  });

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionNotes.trim()) {
      toastError('Vui lòng nhập lý do giải trình hoặc căn cứ thẩm duyệt!');
      return;
    }
    reviewMutation.mutate({
      decisionType,
      decisionNotes: decisionNotes.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="h-10 w-10 border-4 border-teal-700 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Đang tải hồ sơ tra cứu xung đột...</p>
      </div>
    );
  }

  if (isError || !check) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Không tìm thấy bản ghi tra cứu</h2>
        <p className="text-sm text-slate-600">
          Lệnh tra cứu mã <code>{checkId}</code> không tồn tại hoặc đã bị gỡ bỏ khỏi hệ thống.
        </p>
        <Link href="/conflict-checks">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Về danh sách tra cứu
          </Button>
        </Link>
      </div>
    );
  }

  const getStatusBanner = (status: ConflictStatus) => {
    switch (status) {
      case 'NO_CONFLICT':
        return (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wide">
                Kết quả: Không phát hiện xung đột lợi ích (NO CONFLICT)
              </h3>
              <p className="text-xs text-emerald-800">
                Toàn bộ các từ khóa, đối tác và khách hàng liên quan không trùng khớp với bên đối
                kháng hay vụ kiện đang thụ lý. Hồ sơ hoàn toàn đủ điều kiện tiếp nhận và mở Matter.
              </p>
            </div>
          </div>
        );
      case 'POTENTIAL_CONFLICT':
        return (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide">
                Cảnh báo: Phát hiện nghi vấn xung đột lợi ích (POTENTIAL CONFLICT)
              </h3>
              <p className="text-xs text-amber-800">
                Tìm thấy {check.results.length} đối tượng có tỷ lệ trùng khớp hoặc từng là khách
                hàng trong quá khứ. Cần ý kiến thẩm định và phê duyệt chính thức của Partner /
                Managing Partner kèm phương án Bức tường đạo đức (Ethical Wall) trước khi tiếp tục.
              </p>
            </div>
          </div>
        );
      case 'CONFIRMED_CONFLICT':
        return (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 shrink-0 mt-0.5">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide">
                Nghiêm trọng: Xác nhận xung đột lợi ích trực tiếp (CONFIRMED CONFLICT)
              </h3>
              <p className="text-xs text-red-800">
                Hồ sơ đối kháng trực tiếp với thân chủ hiện hữu của hãng luật hoặc thuộc trường hợp
                bị cấm theo Luật Luật sư và Bộ Quy tắc đạo đức nghề nghiệp. Nghiêm cấm nhận hồ sơ vụ
                việc này!
              </p>
            </div>
          </div>
        );
    }
  };

  const getEntityTypeLabel = (type: ConflictResultItem['matchedEntityType']) => {
    switch (type) {
      case 'CLIENT':
        return <Badge variant="primary">Khách hàng hiện hữu</Badge>;
      case 'PREVIOUS_CLIENT':
        return <Badge variant="warning">Khách hàng cũ</Badge>;
      case 'OPPOSING_PARTY':
        return <Badge variant="danger">Đương sự đối kháng</Badge>;
      case 'DIRECTOR':
        return <Badge variant="neutral">Đại diện pháp luật / Giám đốc</Badge>;
      case 'SHAREHOLDER':
        return <Badge variant="warning">Cổ đông / Bên góp vốn</Badge>;
      case 'RELATED_PARTY':
        return <Badge variant="neutral">Công ty liên kết</Badge>;
      case 'MATTER':
        return <Badge variant="neutral">Hồ sơ vụ việc</Badge>;
      default:
        return <Badge variant="neutral">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/conflict-checks">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="h-4 w-4" />
              Danh sách tra cứu
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-mono font-bold text-slate-900">{check.code}</h1>
              {check.status === 'NO_CONFLICT' && <Badge variant="success">Không xung đột</Badge>}
              {check.status === 'POTENTIAL_CONFLICT' && (
                <Badge variant="warning">Cần thẩm duyệt</Badge>
              )}
              {check.status === 'CONFIRMED_CONFLICT' && (
                <Badge variant="danger">Xung đột xác nhận</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Khởi tạo ngày: {new Date(check.requestedAt).toLocaleString('vi-VN')} bởi{' '}
              <strong className="text-slate-700">{check.requestedByName}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            In Phiếu Thẩm định
          </Button>
          {check.status === 'NO_CONFLICT' && (
            <Link href="/clients">
              <Button
                size="sm"
                className="bg-teal-700 hover:bg-teal-800 text-white gap-1.5 text-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Tiếp nhận Khách hàng & Mở Matter
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Status Warning Banner */}
      {getStatusBanner(check.status)}

      {/* Grid Layout: Left Information & Match Results, Right Decision Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Matter & Client Scope */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-teal-700" />
                Phạm vi Đối tượng Tra cứu
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Thân chủ / Khách hàng
                  </span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    {check.clientName || 'Hồ sơ độc lập'}
                  </p>
                  {check.clientId && (
                    <Link
                      href={`/clients/${check.clientId}`}
                      className="text-xs text-teal-700 hover:underline flex items-center gap-1 mt-0.5 font-medium"
                    >
                      Xem hồ sơ khách hàng ({check.clientId})
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>

                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tên Vụ việc dự kiến
                  </span>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    {check.matterName || 'Chưa cung cấp'}
                  </p>
                </div>
              </div>

              {check.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Ghi chú bối cảnh từ người yêu cầu
                  </span>
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
                    {check.notes}
                  </p>
                </div>
              )}

              {/* Search Terms Tags */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Danh sách từ khóa và thực thể đã quét ({check.searchTerms.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {check.searchTerms.map((term, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Conflict Scan Detailed Matches */}
          <Card className="border-slate-200 shadow-xs overflow-hidden">
            <CardHeader className="border-b border-slate-100 pb-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-teal-700" />
                  Kết quả Đối soát Cơ sở Dữ liệu ({check.results.length} trùng khớp)
                </CardTitle>
                <Badge variant={check.results.length > 0 ? 'warning' : 'success'}>
                  {check.results.length > 0 ? 'Phát hiện nghi vấn' : 'Không có nghi vấn'}
                </Badge>
              </div>
              <CardDescription>
                Kết quả đối chiếu tự động với Danh mục Thân chủ, Người đại diện, Cổ đông, Bên tranh
                chấp và Án lệ nội bộ
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {check.results.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">
                    Không tìm thấy bất kỳ đối tượng xung đột nào
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Toàn bộ kho dữ liệu đã được đối chiếu và không phát hiện trùng lặp về tên, mã số
                    thuế, số giấy tờ định danh hay hồ sơ tranh chấp đối lập.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {check.results.map((res) => (
                    <div key={res.id} className="p-4 sm:p-5 space-y-3 hover:bg-slate-50/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900 text-sm">
                            {res.matchedName}
                          </h4>
                          {getEntityTypeLabel(res.matchedEntityType)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Độ tương đồng:</span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                              res.similarityScore >= 95
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {res.similarityScore}%
                          </span>
                        </div>
                      </div>

                      {res.matchedRole && (
                        <p className="text-xs text-slate-600 font-medium">
                          Vai trò ghi nhận:{' '}
                          <span className="text-slate-800">{res.matchedRole}</span>
                        </p>
                      )}

                      <div className="p-3 rounded-md bg-amber-50/60 border border-amber-200/80 text-xs text-amber-950 space-y-1">
                        <p className="font-semibold flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
                          Căn cứ nghi vấn xung đột:
                        </p>
                        <p>{res.reason}</p>
                      </div>

                      {res.matterCode && (
                        <div className="text-xs text-slate-600 flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            Vụ việc liên đới: <strong>{res.matterCode}</strong> - {res.matterName}
                          </span>
                        </div>
                      )}

                      {res.notes && (
                        <p className="text-xs text-slate-500 italic">
                          Ghi chú bổ sung: {res.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Review & Decision Panel */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-xs sticky top-20">
            <CardHeader className="border-b border-slate-100 pb-3 bg-slate-900 text-white rounded-t-lg">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-white">
                <Lock className="h-4 w-4 text-teal-400" />
                Thẩm duyệt Đạo đức Nghề nghiệp
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Quyết định của Managing Partner / Partner phụ trách (Mục 12 require.md)
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-5 space-y-4">
              {check.reviewedAt ? (
                /* Already Reviewed Panel */
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Quyết định chính thức
                    </span>
                    {check.decisionType === 'APPROVED_NO_CONFLICT' && (
                      <Badge variant="success" className="text-xs">
                        ✓ Cho phép tiếp nhận (Không có xung đột)
                      </Badge>
                    )}
                    {check.decisionType === 'APPROVED_WITH_CONDITIONS' && (
                      <Badge variant="warning" className="text-xs">
                        ⚠ Duyệt có điều kiện (Ethical Wall)
                      </Badge>
                    )}
                    {check.decisionType === 'REJECTED_CONFIRMED' && (
                      <Badge variant="danger" className="text-xs">
                        ✕ Từ chối thụ lý (Xung đột không thể dung hòa)
                      </Badge>
                    )}

                    <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 space-y-1">
                      <p>
                        <strong>Người thẩm định:</strong> {check.reviewedByName}
                      </p>
                      <p>
                        <strong>Thời gian duyệt:</strong>{' '}
                        {new Date(check.reviewedAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-slate-700 mb-1">
                      Ý kiến giải trình & Căn cứ thẩm duyệt
                    </span>
                    <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {check.decisionNotes || 'Không có ghi chú thêm.'}
                    </div>
                  </div>

                  <div className="p-3 rounded bg-blue-50 border border-blue-200 text-[11px] text-blue-900">
                    <p className="font-semibold">Tính bất biến của hồ sơ:</p>
                    <p className="mt-0.5">
                      Bản ghi này đã được lưu vào Sổ nhật ký kiểm soát xung đột (Audit Log) theo
                      tiêu chuẩn bảo mật và không thể xóa bỏ hoặc ghi đè.
                    </p>
                  </div>
                </div>
              ) : (
                /* Form for Partner Review */
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Lựa chọn Quyết định Thẩm duyệt <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                        <input
                          type="radio"
                          name="decisionType"
                          value="APPROVED_NO_CONFLICT"
                          checked={decisionType === 'APPROVED_NO_CONFLICT'}
                          onChange={() => setDecisionType('APPROVED_NO_CONFLICT')}
                          className="mt-0.5 text-teal-700 focus:ring-teal-700"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Phê duyệt - Cho phép tiếp nhận vụ việc
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Không có xung đột lợi ích thực tế hoặc tiềm tàng
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                        <input
                          type="radio"
                          name="decisionType"
                          value="APPROVED_WITH_CONDITIONS"
                          checked={decisionType === 'APPROVED_WITH_CONDITIONS'}
                          onChange={() => setDecisionType('APPROVED_WITH_CONDITIONS')}
                          className="mt-0.5 text-amber-600 focus:ring-amber-600"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Phê duyệt có điều kiện (Ethical Wall)
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Yêu cầu cách ly thông tin nhân sự và có văn bản đồng ý
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                        <input
                          type="radio"
                          name="decisionType"
                          value="REJECTED_CONFIRMED"
                          checked={decisionType === 'REJECTED_CONFIRMED'}
                          onChange={() => setDecisionType('REJECTED_CONFIRMED')}
                          className="mt-0.5 text-red-600 focus:ring-red-600"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Từ chối nhận vụ việc (Xác nhận xung đột)
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Khóa tiếp nhận để tránh vi phạm quy tắc đạo đức
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Giải trình & Căn cứ thẩm duyệt <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="Nhập lý do chi tiết, căn cứ từ chối hoặc biện pháp phòng ngừa thiết lập Bức tường đạo đức..."
                      className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-hidden focus:ring-1 focus:ring-teal-700"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={reviewMutation.isPending}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs gap-2 py-2.5"
                  >
                    {reviewMutation.isPending ? (
                      'Đang lưu quyết định...'
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5 text-teal-400" />
                        Xác nhận & Ký duyệt Quyết định
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
