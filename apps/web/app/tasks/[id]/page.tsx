'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckSquare,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Plus,
  Send,
  Check,
  Building2,
  FolderKanban,
  AlertTriangle,
} from 'lucide-react';
import type { Task, TaskStatus, TaskPriority } from '@lpms/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { taskApi } from '@/lib/api/operations';
import { useToast } from '@/components/ui/toast';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TaskDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const taskId = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [commentContent, setCommentContent] = useState('');

  const {
    data: task,
    isLoading,
    isError,
  } = useQuery<Task>({
    queryKey: ['task', taskId],
    queryFn: () => taskApi.getTask(taskId),
  });

  const changeStatusMutation = useMutation({
    mutationFn: (status: TaskStatus) => taskApi.changeStatus(taskId, { status }),
    onSuccess: () => {
      success('Đã cập nhật trạng thái công việc!');
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => {
      toastError(err.message || 'Không thể đổi trạng thái');
    },
  });

  const toggleChecklistMutation = useMutation({
    mutationFn: ({ checklistId, isCompleted }: { checklistId: string; isCompleted: boolean }) =>
      taskApi.toggleChecklist(taskId, checklistId, isCompleted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    },
    onError: (err: any) => {
      toastError(err.message || 'Không thể cập nhật checklist');
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => taskApi.addComment(taskId, content),
    onSuccess: () => {
      success('Đã gửi phản hồi trao đổi!');
      setCommentContent('');
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    },
    onError: (err: any) => {
      toastError(err.message || 'Không thể gửi bình luận');
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="h-10 w-10 border-4 border-teal-700 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Đang tải chi tiết công việc...</p>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Không tìm thấy công việc</h2>
        <p className="text-sm text-slate-600">
          Công việc mã <code>{taskId}</code> không tồn tại hoặc đã bị xóa.
        </p>
        <Link href="/tasks">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Về danh sách việc
          </Button>
        </Link>
      </div>
    );
  }

  const completedChecklists = task.checklists.filter((c) => c.isCompleted).length;
  const totalChecklists = task.checklists.length;
  const progressPercent =
    totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 0;

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="danger">Khẩn cấp</Badge>;
      case 'HIGH':
        return <Badge variant="warning">Ưu tiên cao</Badge>;
      case 'NORMAL':
        return <Badge variant="primary">Bình thường</Badge>;
      case 'LOW':
      default:
        return <Badge variant="neutral">Thấp</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link href="/tasks">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ArrowLeft className="h-4 w-4" />
                Về danh sách
              </Button>
            </Link>
            <span className="font-mono text-sm font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
              {task.code}
            </span>
            {getPriorityBadge(task.priority)}
            {task.isOverdue && task.status !== 'COMPLETED' && (
              <Badge variant="danger" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Quá hạn
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-snug">
            {task.title}
          </h1>
          {task.matterId && (
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <span>Vụ việc:</span>
              <Link
                href={`/matters/${task.matterId}`}
                className="font-semibold text-teal-700 hover:underline flex items-center gap-1"
              >
                {task.matterCode} - {task.matterName}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </p>
          )}
        </div>

        {/* Status Transition Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Trạng thái:</span>
          <select
            value={task.status}
            onChange={(e) => changeStatusMutation.mutate(e.target.value as TaskStatus)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-teal-700 focus:outline-hidden"
          >
            <option value="TODO">TODO (Chưa làm)</option>
            <option value="IN_PROGRESS">IN_PROGRESS (Đang làm)</option>
            <option value="WAITING">WAITING (Tạm dừng)</option>
            <option value="REVIEW">REVIEW (Chờ thẩm duyệt)</option>
            <option value="COMPLETED">COMPLETED (Hoàn thành)</option>
            <option value="CANCELLED">CANCELLED (Hủy bỏ)</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Left Task Details & Checklists, Right Assignment & Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Description & Instructions */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-semibold text-slate-900">
                Nội dung Hướng dẫn & Yêu cầu
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {task.description || 'Không có mô tả chi tiết cho công việc này.'}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold uppercase tracking-wider block">
                    Ngày Bắt đầu
                  </span>
                  <span className="font-medium text-slate-900 mt-0.5 block">
                    {task.startDate || 'Ngay lập tức'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold uppercase tracking-wider block">
                    Hạn Hoàn thành (Deadline)
                  </span>
                  <span
                    className={`font-mono font-bold mt-0.5 block ${
                      task.isOverdue && task.status !== 'COMPLETED'
                        ? 'text-red-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {task.dueDate}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Interactive Checklists */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-teal-700" />
                    Checklist Các Bước Thực Hiện ({completedChecklists}/{totalChecklists})
                  </CardTitle>
                  <CardDescription>
                    Tích chọn từng mục khi luật sư hoàn thành bước công việc tương ứng
                  </CardDescription>
                </div>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded">
                  {progressPercent}% hoàn thành
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {totalChecklists === 0 ? (
                <p className="text-xs text-slate-400 italic">Không có mục checklist nào.</p>
              ) : (
                <div className="space-y-2.5">
                  {task.checklists.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        item.isCompleted
                          ? 'bg-slate-50/80 border-slate-200 text-slate-500'
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        onChange={(e) =>
                          toggleChecklistMutation.mutate({
                            checklistId: item.id,
                            isCompleted: e.target.checked,
                          })
                        }
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700"
                      />
                      <div className="flex-1">
                        <span
                          className={`text-xs font-medium block ${
                            item.isCompleted ? 'line-through' : ''
                          }`}
                        >
                          {item.title}
                        </span>
                        {item.completedAt && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Hoàn thành lúc {new Date(item.completedAt).toLocaleString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Comments & Discussion Feed */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-teal-700" />
                Trao đổi & Phản hồi Nghiệp vụ ({task.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Comment Input */}
              <div className="space-y-2">
                <textarea
                  rows={2}
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Ghi chú ý kiến trao đổi, giải trình hoặc yêu cầu hỗ trợ..."
                  className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-teal-700 focus:outline-hidden"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    disabled={!commentContent.trim() || addCommentMutation.isPending}
                    onClick={() => addCommentMutation.mutate(commentContent.trim())}
                    className="bg-teal-700 hover:bg-teal-800 text-white gap-1 text-xs"
                  >
                    <Send className="h-3 w-3" />
                    Gửi phản hồi
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              <div className="divide-y divide-slate-100 pt-2">
                {task.comments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    Chưa có ý kiến trao đổi nào.
                  </p>
                ) : (
                  task.comments.map((com) => (
                    <div key={com.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900">{com.authorName}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(com.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {com.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Assignment & Status */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-teal-700" />
                Thông tin Phân công (Assignment)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs">
              <div>
                <span className="text-slate-500 font-semibold uppercase tracking-wider block">
                  Người Thực hiện Chính
                </span>
                <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                  {task.assigneeName}
                </span>
              </div>

              {task.reviewerName && (
                <div>
                  <span className="text-slate-500 font-semibold uppercase tracking-wider block">
                    Người Thẩm duyệt (Reviewer)
                  </span>
                  <span className="font-medium text-slate-800 mt-0.5 block">
                    {task.reviewerName}
                  </span>
                </div>
              )}

              {task.completedAt && (
                <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <p className="font-semibold">Đã hoàn thành:</p>
                  <p className="text-[11px] mt-0.5">
                    {new Date(task.completedAt).toLocaleString('vi-VN')} bởi {task.completedBy}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
