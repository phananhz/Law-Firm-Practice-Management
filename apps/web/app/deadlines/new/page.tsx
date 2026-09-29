'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, ArrowLeft, Calendar, Scale, Building2, Bell } from 'lucide-react';
import type { Matter, Employee, CreateDeadlinePayload, DeadlineCategory } from '@lpms/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { matterApi, deadlineApi } from '@/lib/api/operations';
import { organizationApi } from '@/lib/api/organization';
import { useToast } from '@/components/ui/toast';

const newDeadlineSchema = z.object({
  title: z.string().min(5, 'Tiêu đề thời hạn phải có ít nhất 5 ký tự'),
  description: z.string().optional(),
  matterId: z.string().optional(),
  category: z.enum([
    'FILING',
    'GOVERNMENT',
    'COURT',
    'CONTRACT_EXPIRY',
    'LICENSE_EXPIRY',
    'RENEWAL',
    'CLIENT',
    'INTERNAL',
  ]),
  dueDate: z.string().min(10, 'Vui lòng chọn ngày hết hạn'),
  dueTime: z.string().optional(),
  responsiblePersonId: z.string().min(1, 'Vui lòng chọn luật sư chịu trách nhiệm'),
  authorityName: z.string().optional(),
  courtName: z.string().optional(),
  caseNumber: z.string().optional(),
  notes: z.string().optional(),
});

type NewDeadlineFormData = z.infer<typeof newDeadlineSchema>;

export default function NewDeadlinePage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [reminderDays, setReminderDays] = useState<number[]>([15, 7, 3, 1]);

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
    watch,
    formState: { errors },
  } = useForm<NewDeadlineFormData>({
    resolver: zodResolver(newDeadlineSchema),
    defaultValues: {
      title: '',
      description: '',
      matterId: '',
      category: 'COURT',
      dueDate: '',
      dueTime: '17:00',
      responsiblePersonId: 'emp-3',
      authorityName: '',
      courtName: '',
      caseNumber: '',
      notes: '',
    },
  });

  const category = watch('category');

  const toggleReminder = (days: number) => {
    if (reminderDays.includes(days)) {
      setReminderDays(reminderDays.filter((d) => d !== days));
    } else {
      setReminderDays([...reminderDays, days].sort((a, b) => b - a));
    }
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateDeadlinePayload) => deadlineApi.createDeadline(payload),
    onSuccess: (data) => {
      success(`Đã thiết lập mốc thời hạn ${data.code} thành công!`);
      router.push('/deadlines');
    },
    onError: (err: any) => {
      toastError(err.message || 'Không thể tạo mốc thời hạn');
    },
  });

  const onSubmit = (data: NewDeadlineFormData) => {
    const payload: CreateDeadlinePayload = {
      ...data,
      reminderDays,
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/deadlines">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-4 w-4" />
            Danh sách thời hạn
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Clock className="h-6 w-6 text-teal-700" />
            Thiết lập Mốc Thời hạn Pháp lý Mới
          </h1>
          <p className="text-sm text-slate-600">
            Theo dõi thời hiệu khởi kiện, thời hạn nộp chứng cứ, gia hạn giấy phép theo Mục 21
            require.md.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Thông tin Mốc Thời hạn & Vụ việc
            </CardTitle>
            <CardDescription>
              Khai báo ngày giờ giới hạn, cơ quan thụ lý và trách nhiệm giám sát
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Thuộc Hồ sơ Vụ việc (Matter)
              </label>
              <Select {...register('matterId')}>
                <option value="">
                  -- Không thuộc vụ việc (Việc văn phòng / Giấy phép chung) --
                </option>
                {matters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.matterCode} - {m.name} ({m.clientName})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tiêu đề Mốc Thời hạn <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('title')}
                placeholder="Ví dụ: Nộp Bản tự khai và toàn bộ chứng cứ gốc tới Ban Thư ký VIAC"
              />
              {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phân loại Danh mục <span className="text-red-500">*</span>
                </label>
                <Select {...register('category')}>
                  <option value="COURT">Tòa án / Trọng tài (COURT)</option>
                  <option value="GOVERNMENT">Cơ quan Nhà nước (GOVERNMENT)</option>
                  <option value="FILING">Hạn nộp hồ sơ đăng ký (FILING)</option>
                  <option value="CONTRACT_EXPIRY">Hết hạn hợp đồng (CONTRACT_EXPIRY)</option>
                  <option value="LICENSE_EXPIRY">Hết hạn giấy phép (LICENSE_EXPIRY)</option>
                  <option value="RENEWAL">Gia hạn định kỳ (RENEWAL)</option>
                  <option value="CLIENT">Phản hồi Thân chủ (CLIENT)</option>
                  <option value="INTERNAL">Hạn nội bộ (INTERNAL)</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Luật sư Chịu trách nhiệm <span className="text-red-500">*</span>
                </label>
                <Select {...register('responsiblePersonId')}>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.positionTitle})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngày Hết hạn (Due Date) <span className="text-red-500">*</span>
                </label>
                <Input type="date" {...register('dueDate')} />
                {errors.dueDate && (
                  <p className="text-xs text-red-600 mt-1">{errors.dueDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giờ Hết hạn (Khung giờ làm việc)
                </label>
                <Input type="time" {...register('dueTime')} />
              </div>
            </div>

            {/* Authority / Court Details */}
            {(category === 'COURT' || category === 'GOVERNMENT' || category === 'FILING') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên Tòa án / Trung tâm Trọng tài / Cơ quan
                  </label>
                  <Input
                    {...register(category === 'COURT' ? 'courtName' : 'authorityName')}
                    placeholder={
                      category === 'COURT'
                        ? 'Ví dụ: Trung tâm Trọng tài Quốc tế Việt Nam (VIAC)'
                        : 'Ví dụ: Cục Thuế tỉnh Bến Tre'
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số thụ lý / Số vụ kiện
                  </label>
                  <Input {...register('caseNumber')} placeholder="Ví dụ: Vụ kiện số 45/2026/VIAC" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ghi chú Căn cứ Pháp lý & Hậu quả nếu Chậm trễ
              </label>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Ví dụ: Hết thời hiệu khiếu nại theo Điều 9 Luật Khiếu nại; hoặc mất quyền nộp chứng cứ bổ sung..."
                className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-teal-700 focus:outline-hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Reminders Configuration (Mục 21) */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-teal-700" />
              Cấu hình Mốc Nhắc nhở Tự động (Mục 21 require.md)
            </CardTitle>
            <CardDescription>
              Hệ thống sẽ gửi thông báo cảnh báo trước các mốc thời gian đã chọn
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4">
              {[30, 15, 7, 3, 1].map((days) => (
                <label
                  key={days}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                    reminderDays.includes(days)
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={reminderDays.includes(days)}
                    onChange={() => toggleReminder(days)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Trước {days} ngày</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/deadlines">
            <Button type="button" variant="outline">
              Hủy bỏ
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-teal-700 hover:bg-teal-800 text-white gap-2 px-6"
          >
            {createMutation.isPending ? 'Đang lưu thời hạn...' : 'Thiết lập Mốc Thời hạn'}
          </Button>
        </div>
      </form>
    </div>
  );
}
