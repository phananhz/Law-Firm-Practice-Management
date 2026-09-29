'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  User,
  ArrowLeft,
  Save,
  ShieldCheck,
  CheckCircle2,
  FileText,
  UserCheck,
} from 'lucide-react';
import type { ClientType, CreateClientPayload } from '@lpms/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { clientApi } from '@/lib/api/clients';
import { useToast } from '@/components/ui/toast';

const clientIntakeSchema = z.object({
  type: z.enum(['ORGANIZATION', 'INDIVIDUAL']),
  displayName: z.string().min(2, 'Vui lòng nhập tên khách hàng'),
  email: z.string().email('Email không đúng định dạng'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  address: z.string().min(5, 'Vui lòng nhập địa chỉ đầy đủ'),
  notes: z.string().optional(),

  // Cá nhân
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  idNumber: z.string().optional(),
  occupation: z.string().optional(),
  companyName: z.string().optional(),

  // Doanh nghiệp
  vietnameseName: z.string().optional(),
  englishName: z.string().optional(),
  shortName: z.string().optional(),
  taxCode: z.string().optional(),
  enterpriseNumber: z.string().optional(),
  country: z.string().optional(),
  legalRepresentative: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),

  // Đầu mối liên hệ ban đầu
  primaryContactName: z.string().optional(),
  primaryContactEmail: z.string().optional(),
  primaryContactPhone: z.string().optional(),
  primaryContactPosition: z.string().optional(),
});

type ClientIntakeFormData = z.infer<typeof clientIntakeSchema>;

export default function NewClientIntakePage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [clientType, setClientType] = useState<ClientType>('ORGANIZATION');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClientIntakeFormData>({
    resolver: zodResolver(clientIntakeSchema),
    defaultValues: {
      type: 'ORGANIZATION',
      displayName: '',
      email: '',
      phone: '',
      address: '',
      country: 'Việt Nam',
      nationality: 'Việt Nam',
      notes: '',
    },
  });

  const handleTypeChange = (type: ClientType) => {
    setClientType(type);
    setValue('type', type);
  };

  const onSubmit = async (data: ClientIntakeFormData) => {
    setServerError(null);
    try {
      const payload: CreateClientPayload = {
        ...data,
        type: clientType,
        // Đồng bộ displayName theo tên pháp nhân nếu là doanh nghiệp
        displayName:
          clientType === 'ORGANIZATION'
            ? data.vietnameseName || data.displayName
            : data.displayName,
      };

      const newClient = await clientApi.createClient(payload);
      success(`Đã tiếp nhận hồ sơ khách hàng ${newClient.displayName} thành công!`);
      router.push(`/clients/${newClient.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu hồ sơ tiếp nhận khách hàng';
      setServerError(msg);
      toastError(msg);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/clients"
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Tiếp nhận Hồ sơ Khách hàng mới (Intake)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Bước 1 trong quy trình thẩm định khách hàng và tra cứu xung đột lợi ích (Conflict
              Check).
            </p>
          </div>
        </div>
      </div>

      {serverError && (
        <Alert variant="error" title="Lỗi tiếp nhận hồ sơ">
          {serverError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Bước 1: Chọn loại hình khách hàng */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-teal-700 text-white text-xs flex items-center justify-center font-mono">
                1
              </span>
              Phân loại hình thức khách hàng
            </h3>
            <span className="text-xs text-slate-400">Mục 10 require.md</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <button
              type="button"
              onClick={() => handleTypeChange('ORGANIZATION')}
              className={`p-4 rounded-lg border-2 text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                clientType === 'ORGANIZATION'
                  ? 'border-teal-700 bg-teal-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div
                className={`p-2.5 rounded-lg shrink-0 ${
                  clientType === 'ORGANIZATION'
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Building2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-sm text-slate-900 block">
                  Doanh nghiệp / Tổ chức
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Công ty cổ phần, TNHH, tập đoàn kinh tế, quỹ đầu tư hoặc cơ quan tổ chức.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('INDIVIDUAL')}
              className={`p-4 rounded-lg border-2 text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                clientType === 'INDIVIDUAL'
                  ? 'border-teal-700 bg-teal-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div
                className={`p-2.5 rounded-lg shrink-0 ${
                  clientType === 'INDIVIDUAL'
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <User className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-sm text-slate-900 block">Khách hàng Cá nhân</span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Thương nhân, nhà đầu tư cá nhân, cổ đông, hoặc đương sự tranh chấp dân sự.
                </p>
              </div>
            </button>
          </div>
        </Card>

        {/* Bước 2: Thông tin định danh chi tiết */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-teal-700 text-white text-xs flex items-center justify-center font-mono">
                2
              </span>
              {clientType === 'ORGANIZATION'
                ? 'Thông tin pháp nhân doanh nghiệp'
                : 'Thông tin cá nhân thân chủ'}
            </h3>
            <span className="text-xs text-slate-400">Bắt buộc</span>
          </div>

          {clientType === 'ORGANIZATION' ? (
            <div className="space-y-4 pt-1">
              <div className="space-y-4">
                <Input
                  label="Tên doanh nghiệp đầy đủ (Tiếng Việt)"
                  placeholder="Công ty Cổ phần Năng lượng Mekong..."
                  required
                  error={errors.vietnameseName?.message}
                  {...register('vietnameseName')}
                  onChange={(e) => {
                    setValue('vietnameseName', e.target.value);
                    setValue('displayName', e.target.value);
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Tên giao dịch quốc tế (Tiếng Anh)"
                    placeholder="Mekong Energy Joint Stock Company"
                    {...register('englishName')}
                  />
                  <Input
                    label="Tên viết tắt / Tên thương mại"
                    placeholder="Mekong Energy"
                    {...register('shortName')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Mã số thuế (Tax Code)"
                    placeholder="0312456789"
                    required
                    {...register('taxCode')}
                  />
                  <Input
                    label="Mã số doanh nghiệp"
                    placeholder="0312456789"
                    {...register('enterpriseNumber')}
                  />
                  <Input
                    label="Người đại diện theo pháp luật"
                    placeholder="Họ tên Chủ tịch/TGĐ..."
                    required
                    {...register('legalRepresentative')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Lĩnh vực / Ngành nghề hoạt động"
                    placeholder="Năng lượng tái tạo, Xây lắp điện..."
                    {...register('industry')}
                  />
                  <Input
                    label="Website doanh nghiệp"
                    placeholder="https://company.vn"
                    {...register('website')}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <Input
                label="Họ và tên đầy đủ của thân chủ"
                placeholder="Nguyễn Văn A"
                required
                error={errors.displayName?.message}
                {...register('displayName')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Số CCCD / Hộ chiếu (Passport)"
                  placeholder="001190012345 hoặc B1234567"
                  required
                  {...register('idNumber')}
                />
                <Input label="Ngày tháng năm sinh" type="date" {...register('dateOfBirth')} />
                <Input label="Quốc tịch" placeholder="Việt Nam" {...register('nationality')} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nghề nghiệp / Chức vụ"
                  placeholder="Kỹ sư, Doanh nhân, Cổ đông..."
                  {...register('occupation')}
                />
                <Input
                  label="Nơi công tác / Doanh nghiệp"
                  placeholder="Tên công ty đang làm việc..."
                  {...register('companyName')}
                />
              </div>
            </div>
          )}

          {/* Thông tin liên hệ cơ bản */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">
              Thông tin liên lạc & Trụ sở
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email liên lạc chính thức"
                type="email"
                placeholder="contact@doanhnghiep.vn"
                required
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Số điện thoại liên lạc"
                placeholder="028 3899 1234"
                required
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>
            <div className="mt-3">
              <Input
                label="Địa chỉ trụ sở chính / Thường trú"
                placeholder="Số nhà, Tòa nhà, Phường/Xã, Quận/Huyện, Tỉnh/TP..."
                required
                error={errors.address?.message}
                {...register('address')}
              />
            </div>
          </div>
        </Card>

        {/* Bước 3: Người liên hệ đầu mối (Primary Contact) */}
        {clientType === 'ORGANIZATION' && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-teal-700 text-white text-xs flex items-center justify-center font-mono">
                  3
                </span>
                Đầu mối làm việc trực tiếp (Primary Contact)
              </h3>
              <span className="text-xs text-slate-400">Tùy chọn</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <Input
                label="Họ và tên người liên hệ"
                placeholder="Luật sư nội bộ / Trưởng ban Pháp chế..."
                {...register('primaryContactName')}
              />
              <Input
                label="Chức danh / Bộ phận"
                placeholder="Giám đốc Pháp chế, Thư ký HĐQT..."
                {...register('primaryContactPosition')}
              />
              <Input
                label="Email trực tiếp"
                type="email"
                placeholder="contact.person@company.vn"
                {...register('primaryContactEmail')}
              />
              <Input
                label="Số điện thoại di động"
                placeholder="0912 345 678"
                {...register('primaryContactPhone')}
              />
            </div>
          </Card>
        )}

        {/* Bước 4: Ghi chú ban đầu */}
        <Card className="p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="h-5 w-5 rounded-full bg-teal-700 text-white text-xs flex items-center justify-center font-mono">
              {clientType === 'ORGANIZATION' ? '4' : '3'}
            </span>
            Ghi chú tiếp nhận & Nhu cầu tư vấn ban đầu
          </h3>
          <textarea
            rows={3}
            placeholder="Mô tả tóm tắt nhu cầu pháp lý, bối cảnh vụ việc, các bên liên quan cần lưu ý khi thực hiện Conflict Check..."
            className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-600"
            {...register('notes')}
          />
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/clients">
            <Button variant="outline" size="lg">
              Hủy bỏ
            </Button>
          </Link>
          <Button type="submit" size="lg" isLoading={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            Lưu hồ sơ tiếp nhận (Khởi tạo Intake)
          </Button>
        </div>
      </form>
    </div>
  );
}
