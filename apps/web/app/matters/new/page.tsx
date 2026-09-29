'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FolderKanban,
  ArrowLeft,
  Building2,
  Users,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Calendar,
  AlertTriangle,
  Scale,
  Briefcase,
  DollarSign,
  Info,
} from 'lucide-react';
import type {
  Client,
  ConflictCheck,
  Employee,
  CreateMatterPayload,
  MatterType,
  MatterPriority,
  ConfidentialityLevel,
} from '@lpms/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { clientApi } from '@/lib/api/clients';
import { conflictApi, matterApi } from '@/lib/api/operations';
import { organizationApi } from '@/lib/api/organization';
import { useToast } from '@/components/ui/toast';

const newMatterSchema = z.object({
  name: z.string().min(5, 'Tên vụ việc phải có ít nhất 5 ký tự'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Vui lòng chọn khách hàng / thân chủ'),
  conflictCheckId: z.string().optional(),
  practiceArea: z.string().min(2, 'Vui lòng chọn lĩnh vực hành nghề'),
  matterType: z.enum(['LITIGATION', 'ADVISORY', 'TRANSACTION', 'COMPLIANCE', 'DISPUTE_RESOLUTION']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  confidentialityLevel: z.enum(['NORMAL', 'CONFIDENTIAL', 'HIGHLY_CONFIDENTIAL', 'RESTRICTED']),
  responsiblePartnerId: z.string().min(1, 'Vui lòng chỉ định Partner phụ trách'),
  responsibleLawyerId: z.string().min(1, 'Vui lòng chỉ định Luật sư chủ nhiệm'),
  openDate: z.string().min(10, 'Vui lòng chọn ngày mở hồ sơ'),
  expectedCloseDate: z.string().optional(),
  billingMethod: z.enum(['HOURLY', 'FIXED_FEE', 'RETAINER', 'CONTINGENCY']).optional(),
});

type NewMatterFormData = z.infer<typeof newMatterSchema>;

export default function NewMatterPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => clientApi.getClients(),
  });

  const { data: conflictChecks = [] } = useQuery<ConflictCheck[]>({
    queryKey: ['conflict-checks'],
    queryFn: () => conflictApi.getConflictChecks(),
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: () => organizationApi.getEmployees(),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NewMatterFormData>({
    resolver: zodResolver(newMatterSchema),
    defaultValues: {
      name: '',
      description: '',
      clientId: '',
      conflictCheckId: '',
      practiceArea: 'Năng lượng & Cơ sở hạ tầng',
      matterType: 'TRANSACTION',
      priority: 'HIGH',
      confidentialityLevel: 'CONFIDENTIAL',
      responsiblePartnerId: 'emp-1',
      responsibleLawyerId: 'emp-3',
      openDate: new Date().toISOString().split('T')[0],
      billingMethod: 'HOURLY',
    },
  });

  const selectedClientId = watch('clientId');
  const selectedConflictCheckId = watch('conflictCheckId');
  const confidentialityLevel = watch('confidentialityLevel');

  // Find linked conflict check
  const selectedCheck = conflictChecks.find((c) => c.id === selectedConflictCheckId);
  const isConflictBlocked = selectedCheck && selectedCheck.status === 'CONFIRMED_CONFLICT';

  const createMutation = useMutation({
    mutationFn: (payload: CreateMatterPayload) => matterApi.createMatter(payload),
    onSuccess: (data) => {
      success(`Đã khởi tạo hồ sơ vụ việc thành công với mã ${data.matterCode}!`);
      router.push(`/matters/${data.id}`);
    },
    onError: (err: any) => {
      toastError(err.message || 'Có lỗi xảy ra khi khởi tạo hồ sơ vụ việc');
    },
  });

  const onSubmit = (data: NewMatterFormData) => {
    if (isConflictBlocked) {
      toastError('Không thể mở vụ việc vì hồ sơ tra cứu xung đột có trạng thái Xung đột xác nhận!');
      return;
    }

    createMutation.mutate(data as CreateMatterPayload);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/matters">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-4 w-4" />
            Danh sách vụ việc
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-teal-700" />
            Mở Hồ sơ Vụ việc mới (Matter Intake)
          </h1>
          <p className="text-sm text-slate-600">
            Khởi tạo Matter trung tâm, phân quyền thành viên, thiết lập mức độ bảo mật và thư mục hồ
            sơ tài liệu.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Client & Conflict Check Linking */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-teal-800 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <CardTitle className="text-base font-semibold text-slate-900">
                Thân chủ & Liên kết Tra cứu Xung đột (Section 12 & 13)
              </CardTitle>
            </div>
            <CardDescription>
              Vụ việc phải được liên kết với một khách hàng và kết quả kiểm tra xung đột an toàn
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn Khách hàng / Thân chủ <span className="text-red-500">*</span>
                </label>
                <Select {...register('clientId')}>
                  <option value="">-- Chọn khách hàng từ danh bạ --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.clientCode} - {c.displayName}
                    </option>
                  ))}
                </Select>
                {errors.clientId && (
                  <p className="text-xs text-red-600 mt-1">{errors.clientId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lệnh Tra cứu Xung đột liên kết (Conflict Check ID)
                </label>
                <Select {...register('conflictCheckId')}>
                  <option value="">-- Chọn lệnh tra cứu xung đột --</option>
                  {conflictChecks.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.code} - {cc.status} ({cc.clientName})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Conflict Check Status Warning */}
            {selectedCheck && (
              <div
                className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 ${
                  isConflictBlocked
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : selectedCheck.status === 'POTENTIAL_CONFLICT'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                {isConflictBlocked ? (
                  <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                ) : selectedCheck.status === 'POTENTIAL_CONFLICT' ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">
                    Tình trạng Conflict Check: {selectedCheck.code} — {selectedCheck.status}
                  </p>
                  {isConflictBlocked ? (
                    <p className="mt-0.5">
                      CẢNH BÁO: Lệnh tra cứu này đã xác nhận có xung đột lợi ích trực tiếp. Hệ thống
                      khóa không cho phép mở Matter theo Quy tắc Đạo đức Nghề luật sư!
                    </p>
                  ) : selectedCheck.status === 'POTENTIAL_CONFLICT' ? (
                    <p className="mt-0.5">
                      Lưu ý: Lệnh tra cứu có nghi vấn xung đột. Hãy đảm bảo Managing Partner đã
                      duyệt phương án Bức tường đạo đức (Ethical Wall).
                    </p>
                  ) : (
                    <p className="mt-0.5">
                      Kết quả kiểm tra an toàn. Hồ sơ đầy đủ điều kiện tiếp nhận và mở Matter.
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Matter Basics */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-teal-800 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <CardTitle className="text-base font-semibold text-slate-900">
                Thông tin Vụ việc & Lĩnh vực Chuyên môn
              </CardTitle>
            </div>
            <CardDescription>
              Mã vụ việc sẽ được hệ thống sinh tự động theo quy chuẩn MAT-YYYY-00000X
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên Vụ việc / Tên Hồ sơ pháp lý <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('name')}
                placeholder="Ví dụ: Tư vấn Hợp đồng EPC Nhà máy Điện mặt trời Bến Tre 50MW"
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mô tả Tóm tắt & Phạm vi Công việc (Scope of Work)
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Mô tả bối cảnh sự việc, các mục tiêu pháp lý cần đạt được và các mốc chuyển giao dự kiến..."
                className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-hidden focus:ring-1 focus:ring-teal-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lĩnh vực Hành nghề <span className="text-red-500">*</span>
                </label>
                <Select {...register('practiceArea')}>
                  <option value="Năng lượng & Cơ sở hạ tầng">Năng lượng & Cơ sở hạ tầng</option>
                  <option value="Tranh tụng & Trọng tài">Tranh tụng & Trọng tài</option>
                  <option value="M&A & Đầu tư Doanh nghiệp">M&A & Đầu tư Doanh nghiệp</option>
                  <option value="Bất động sản & Xây dựng">Bất động sản & Xây dựng</option>
                  <option value="Lao động & Thỏa ước">Lao động & Thỏa ước</option>
                  <option value="Sở hữu Trí tuệ & Công nghệ">Sở hữu Trí tuệ & Công nghệ</option>
                  <option value="Gia đình & Quản trị Di sản">Gia đình & Quản trị Di sản</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phân loại Vụ việc (Matter Type) <span className="text-red-500">*</span>
                </label>
                <Select {...register('matterType')}>
                  <option value="TRANSACTION">Giao dịch / Thương vụ (TRANSACTION)</option>
                  <option value="LITIGATION">Tranh tụng Tòa án (LITIGATION)</option>
                  <option value="DISPUTE_RESOLUTION">Trọng tài & Hòa giải (DISPUTE)</option>
                  <option value="ADVISORY">Tư vấn thường xuyên (ADVISORY)</option>
                  <option value="COMPLIANCE">Giấy phép & Tuân thủ (COMPLIANCE)</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mức độ Ưu tiên <span className="text-red-500">*</span>
                </label>
                <Select {...register('priority')}>
                  <option value="LOW">Thấp (Low)</option>
                  <option value="MEDIUM">Trung bình (Medium)</option>
                  <option value="HIGH">Cao (High)</option>
                  <option value="URGENT">Khẩn cấp (Urgent)</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Confidentiality Level */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-teal-800 text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <CardTitle className="text-base font-semibold text-slate-900">
                Phân loại Mức độ Bảo mật (Confidentiality Level - Mục 16)
              </CardTitle>
            </div>
            <CardDescription>
              Cơ chế phân quyền truy cập thông tin và bảo mật tài liệu nội bộ
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  value="NORMAL"
                  {...register('confidentialityLevel')}
                  className="mt-0.5 text-teal-700 focus:ring-teal-700"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">NORMAL (Thông thường)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mọi nhân viên công ty luật có quyền xem thông tin cơ bản của vụ việc.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  value="CONFIDENTIAL"
                  {...register('confidentialityLevel')}
                  className="mt-0.5 text-teal-700 focus:ring-teal-700"
                />
                <div>
                  <p className="text-xs font-bold text-amber-800">CONFIDENTIAL (Bảo mật)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Chỉ nhóm làm việc của phòng ban và các luật sư được chỉ định mới xem được tài
                    liệu.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  value="HIGHLY_CONFIDENTIAL"
                  {...register('confidentialityLevel')}
                  className="mt-0.5 text-purple-700 focus:ring-purple-700"
                />
                <div>
                  <p className="text-xs font-bold text-purple-800">
                    HIGHLY_CONFIDENTIAL (Tuyệt mật)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Áp dụng cho các thương vụ M&A nhạy cảm và tranh tụng gia đình đặc thù.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-rose-200 bg-rose-50/20 cursor-pointer hover:bg-rose-50/40 transition-colors">
                <input
                  type="radio"
                  value="RESTRICTED"
                  {...register('confidentialityLevel')}
                  className="mt-0.5 text-rose-700 focus:ring-rose-700"
                />
                <div>
                  <p className="text-xs font-bold text-rose-800 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> RESTRICTED (Whitelist bắt buộc)
                  </p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Nghiêm ngặt nhất. Chỉ những ai có trong Whitelist mới được xem. Partner khác
                    không thể bypass!
                  </p>
                </div>
              </label>
            </div>

            {confidentialityLevel === 'RESTRICTED' && (
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                <Info className="h-4 w-4 text-rose-700 shrink-0 mt-0.5" />
                <p>
                  Quy tắc bảo mật Mục 16: Khi chọn cấp độ <strong>RESTRICTED</strong>, hệ thống sẽ
                  ẩn hoàn toàn vụ việc này đối với mọi tài khoản không thuộc danh sách thành viên
                  trực tiếp của Matter.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 4: Responsibility & Billing */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-teal-800 text-white text-xs font-bold flex items-center justify-center">
                4
              </span>
              <CardTitle className="text-base font-semibold text-slate-900">
                Đội ngũ Phụ trách & Phương thức Tính phí (Section 15)
              </CardTitle>
            </div>
            <CardDescription>
              Chỉ định Partner chịu trách nhiệm và Luật sư điều hành chính vụ việc
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Responsible Partner (Partner chịu trách nhiệm){' '}
                  <span className="text-red-500">*</span>
                </label>
                <Select {...register('responsiblePartnerId')}>
                  {employees
                    .filter(
                      (e) => e.roles.includes('MANAGING_PARTNER') || e.roles.includes('PARTNER'),
                    )
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.positionTitle})
                      </option>
                    ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Responsible Lawyer (Luật sư Chủ nhiệm) <span className="text-red-500">*</span>
                </label>
                <Select {...register('responsibleLawyerId')}>
                  {employees
                    .filter((e) => !e.roles.includes('MANAGING_PARTNER'))
                    .map((emp) => (
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
                  Ngày Mở Hồ sơ <span className="text-red-500">*</span>
                </label>
                <Input type="date" {...register('openDate')} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngày Dự kiến Hoàn thành
                </label>
                <Input type="date" {...register('expectedCloseDate')} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phương thức Tính phí
                </label>
                <Select {...register('billingMethod')}>
                  <option value="HOURLY">Theo giờ (Hourly Rate)</option>
                  <option value="FIXED_FEE">Trọn gói (Fixed Fee)</option>
                  <option value="RETAINER">Cố vấn định kỳ (Retainer)</option>
                  <option value="CONTINGENCY">Thù lao theo kết quả (Contingency)</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/matters">
            <Button type="button" variant="outline">
              Hủy bỏ
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={createMutation.isPending || isConflictBlocked}
            className="bg-teal-700 hover:bg-teal-800 text-white gap-2 px-6"
          >
            {createMutation.isPending ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang tạo vụ việc & khởi tạo thư mục...
              </>
            ) : (
              <>
                <FolderKanban className="h-4 w-4" />
                Xác nhận Mở Vụ việc mới
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
