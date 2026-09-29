'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckSquare,
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  Plus,
  X,
  Briefcase,
  FolderKanban,
  CheckCircle2,
} from 'lucide-react';
import type { Matter, Employee, CreateTaskPayload, TaskPriority } from '@lpms/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { matterApi, taskApi } from '@/lib/api/operations';
import { organizationApi } from '@/lib/api/organization';
import { useToast } from '@/components/ui/toast';

const newTaskSchema = z.object({
  title: z.string().min(5, 'Tiêu đề công việc phải có ít nhất 5 ký tự'),
  description: z.string().optional(),
  matterId: z.string().optional(),
  assigneeId: z.string().min(1, 'Vui lòng chọn người thực hiện'),
  reviewerId: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  startDate: z.string().optional(),
  dueDate: z.string().min(10, 'Vui lòng chọn hạn hoàn thành'),
});

type NewTaskFormData = z.infer<typeof newTaskSchema>;

export default function NewTaskPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [checklists, setChecklists] = useState<string[]>([]);
  const [currentChecklist, setCurrentChecklist] = useState('');

  const { data: matters = [] } = useQuery<Matter[]>({
    queryKey: ['matters'],
    queryFn: () => matterApi.getMatters(),
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: () => organizationApi.getEmployees(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewTaskFormData>({
    resolver: zodResolver(newTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      matterId: '',
      assigneeId: 'emp-3',
      reviewerId: 'emp-1',
      priority: 'NORMAL',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '',
    },
  });

  const addChecklistItem = () => {
    const trimmed = currentChecklist.trim();
    if (trimmed && !checklists.includes(trimmed)) {
      setChecklists([...checklists, trimmed]);
      setCurrentChecklist('');
    }
  };

  const removeChecklistItem = (index: number) => {
    setChecklists(checklists.filter((_, i) => i !== index));
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateTaskPayload) => taskApi.createTask(payload),
    onSuccess: (data) => {
      success(`Đã giao công việc ${data.code} thành công!`);
      router.push(`/tasks/${data.id}`);
    },
    onError: (err: any) => {
      toastError(err.message || 'Không thể tạo công việc');
    },
  });

  const onSubmit = (data: NewTaskFormData) => {
    const payload: CreateTaskPayload = {
      ...data,
      checklists,
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/tasks">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-4 w-4" />
            Danh sách việc
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-teal-700" />
            Giao Việc Mới (New Task)
          </h1>
          <p className="text-sm text-slate-600">
            Khởi tạo nhiệm vụ, phân công luật sư, lập checklist các bước và thiết lập thời hạn hoàn
            thành.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Chi tiết Nhiệm vụ & Vụ việc Liên quan
            </CardTitle>
            <CardDescription>
              Liên kết công việc với hồ sơ vụ việc hoặc tạo việc nội bộ công ty luật
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Thuộc Hồ sơ Vụ việc (Matter)
              </label>
              <Select {...register('matterId')}>
                <option value="">-- Không thuộc vụ việc (Công việc nội bộ văn phòng) --</option>
                {matters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.matterCode} - {m.name} ({m.clientName})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tiêu đề Công việc <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('title')}
                placeholder="Ví dụ: Rà soát điều khoản bồi thường phạt vi phạm hợp đồng EPC"
              />
              {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mô tả Hướng dẫn Thực hiện & Yêu cầu Nghiệp vụ
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Nêu rõ các căn cứ pháp lý cần tra cứu, yêu cầu về hình thức văn bản, hoặc các lưu ý đặc biệt..."
                className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Luật sư Thực hiện (Assignee) <span className="text-red-500">*</span>
                </label>
                <Select {...register('assigneeId')}>
                  <option value="">-- Chọn luật sư thực hiện --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.positionTitle}) - {emp.departmentName}
                    </option>
                  ))}
                </Select>
                {errors.assigneeId && (
                  <p className="text-xs text-red-600 mt-1">{errors.assigneeId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Người Thẩm duyệt / Partner phụ trách (Reviewer)
                </label>
                <Select {...register('reviewerId')}>
                  <option value="">-- Chọn người thẩm duyệt --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.positionTitle})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mức độ Ưu tiên <span className="text-red-500">*</span>
                </label>
                <Select {...register('priority')}>
                  <option value="LOW">Thấp (Low)</option>
                  <option value="NORMAL">Bình thường (Normal)</option>
                  <option value="HIGH">Ưu tiên cao (High)</option>
                  <option value="URGENT">Khẩn cấp (Urgent)</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngày Bắt đầu
                </label>
                <Input type="date" {...register('startDate')} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hạn Hoàn thành (Due Date) <span className="text-red-500">*</span>
                </label>
                <Input type="date" {...register('dueDate')} />
                {errors.dueDate && (
                  <p className="text-xs text-red-600 mt-1">{errors.dueDate.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Dynamic Checklists */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Danh sách Kiểm tra Tiến độ (Checklist Items - Mục 20)
            </CardTitle>
            <CardDescription>
              Chia nhỏ công việc thành các bước cụ thể để người thực hiện tích chọn khi hoàn thành
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="flex gap-2">
              <Input
                value={currentChecklist}
                onChange={(e) => setCurrentChecklist(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addChecklistItem();
                  }
                }}
                placeholder="Nhập bước công việc (ví dụ: Tra cứu tiền lệ bản án số...) và bấm Thêm..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addChecklistItem}
                className="gap-1 shrink-0"
              >
                <Plus className="h-4 w-4" />
                Thêm bước
              </Button>
            </div>

            {checklists.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Chưa có bước checklist nào. Việc thêm checklist giúp theo dõi tiến độ chính xác hơn.
              </p>
            ) : (
              <div className="space-y-2">
                {checklists.map((item, index) => (
                  <div
                    key={index}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-slate-800">
                      {index + 1}. {item}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(index)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/tasks">
            <Button type="button" variant="outline">
              Hủy bỏ
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-teal-700 hover:bg-teal-800 text-white gap-2 px-6"
          >
            {createMutation.isPending ? 'Đang tạo việc...' : 'Xác nhận Giao việc'}
          </Button>
        </div>
      </form>
    </div>
  );
}
