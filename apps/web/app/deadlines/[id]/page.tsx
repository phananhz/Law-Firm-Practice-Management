'use client';

import Link from 'next/link';
import { use, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  UserRound,
} from 'lucide-react';
import type { Deadline, DeadlineCategory } from '@lpms/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { deadlineApi } from '@/lib/api/operations';

interface PageProps {
  params: Promise<{ id: string }>;
}

const categoryLabels: Record<DeadlineCategory, string> = {
  FILING: 'Nộp hồ sơ',
  GOVERNMENT: 'Cơ quan nhà nước',
  COURT: 'Tòa án',
  CONTRACT_EXPIRY: 'Hết hạn hợp đồng',
  LICENSE_EXPIRY: 'Hết hạn giấy phép',
  RENEWAL: 'Gia hạn',
  CLIENT: 'Khách hàng',
  INTERNAL: 'Nội bộ',
};

function formatDate(value?: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export default function DeadlineDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const {
    data: deadline,
    isLoading,
    isError,
  } = useQuery<Deadline>({
    queryKey: ['deadline', id],
    queryFn: () => deadlineApi.getDeadline(id),
  });
  const toggleMutation = useMutation({
    mutationFn: (isCompleted: boolean) => deadlineApi.toggleComplete(id, isCompleted),
    onSuccess: (_, isCompleted) => {
      success(isCompleted ? 'Đã đánh dấu thời hạn hoàn tất.' : 'Đã mở lại thời hạn.');
      queryClient.invalidateQueries({ queryKey: ['deadline', id] });
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'deadlines'] });
    },
    onError: (error: Error) => toastError(error.message || 'Không thể cập nhật thời hạn.'),
  });

  const status = useMemo(() => {
    if (!deadline) return null;
    if (deadline.isCompleted) return { label: 'Hoàn tất', variant: 'success' as const };
    if (deadline.isOverdue) return { label: 'Quá hạn', variant: 'danger' as const };
    return { label: 'Cần xử lý', variant: 'warning' as const };
  }, [deadline]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
        Đang tải chi tiết thời hạn...
      </div>
    );
  }

  if (isError || !deadline || !status) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
        <h2 className="mt-4 text-xl font-bold text-slate-900">Không tìm thấy thời hạn</h2>
        <p className="mt-2 text-sm text-slate-500">
          Mốc <code className="font-mono">{id}</code> không tồn tại hoặc bạn không có quyền truy
          cập.
        </p>
        <Link href="/deadlines" className="mt-5 inline-block">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Về danh sách thời hạn
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <Link
            href="/deadlines"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" /> Về danh sách thời hạn
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-700">
              {deadline.code}
            </span>
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant="neutral">{categoryLabels[deadline.category]}</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
            {deadline.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {deadline.matterName || 'Thời hạn nội bộ'}{' '}
            {deadline.matterCode ? `· ${deadline.matterCode}` : ''}
          </p>
        </div>
        <Button
          variant={deadline.isCompleted ? 'outline' : 'primary'}
          className="gap-2"
          isLoading={toggleMutation.isPending}
          onClick={() => toggleMutation.mutate(!deadline.isCompleted)}
        >
          <CheckCircle2 className="h-4 w-4" />
          {deadline.isCompleted ? 'Mở lại thời hạn' : 'Đánh dấu hoàn tất'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-5 w-5 text-blue-600" /> Chi tiết mốc công việc
            </CardTitle>
            <CardDescription>Thông tin được dùng để nhắc việc và theo dõi tiến độ.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Info
                label="Ngày đến hạn"
                value={formatDate(deadline.dueDate)}
                icon={<CalendarClock className="h-4 w-4" />}
              />
              <Info
                label="Giờ đến hạn"
                value={deadline.dueTime || 'Cả ngày'}
                icon={<Clock3 className="h-4 w-4" />}
              />
              <Info
                label="Người phụ trách"
                value={deadline.responsiblePersonName}
                icon={<UserRound className="h-4 w-4" />}
              />
              <Info
                label="Nhắc trước"
                value={
                  deadline.reminderDays.length
                    ? `${deadline.reminderDays.join(', ')} ngày`
                    : 'Theo cấu hình chung'
                }
                icon={<Clock3 className="h-4 w-4" />}
              />
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Mô tả
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {deadline.description || 'Chưa có mô tả cho thời hạn này.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin liên quan</CardTitle>
            <CardDescription>Ngữ cảnh hồ sơ và cơ quan xử lý, nếu có.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Info label="Hồ sơ" value={deadline.matterCode || 'Không gắn hồ sơ'} />
            <Info label="Cơ quan" value={deadline.authorityName || deadline.courtName || '—'} />
            <Info label="Số hồ sơ" value={deadline.caseNumber || '—'} />
            <div>
              <p className="text-xs font-semibold text-slate-400">Ghi chú</p>
              <p className="mt-1 whitespace-pre-wrap leading-6 text-slate-600">
                {deadline.notes || '—'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
        {icon} {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
