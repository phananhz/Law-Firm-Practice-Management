'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ShieldAlert,
  Search,
  ArrowLeft,
  Plus,
  X,
  Building2,
  Users,
  AlertTriangle,
  Scale,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import type { Client, CreateConflictCheckPayload } from '@lpms/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { clientApi } from '@/lib/api/clients';
import { conflictApi } from '@/lib/api/operations';
import { useToast } from '@/components/ui/toast';

const newConflictCheckSchema = z.object({
  clientMode: z.enum(['existing', 'new']),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  matterName: z.string().min(3, 'Vui lòng nhập tên vụ việc hoặc dự án tư vấn dự kiến'),
  notes: z.string().optional(),
});

type NewConflictCheckForm = z.infer<typeof newConflictCheckSchema>;

export default function NewConflictCheckPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [currentTerm, setCurrentTerm] = useState('');

  const [opposingParties, setOpposingParties] = useState<string[]>([]);
  const [currentParty, setCurrentParty] = useState('');

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => clientApi.getClients(),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NewConflictCheckForm>({
    resolver: zodResolver(newConflictCheckSchema),
    defaultValues: {
      clientMode: 'existing',
      clientId: '',
      clientName: '',
      matterName: '',
      notes: '',
    },
  });

  const clientMode = watch('clientMode');
  const selectedClientId = watch('clientId');

  // When client changes, auto-suggest client name and rep into search terms
  const handleClientSelect = (clientId: string) => {
    setValue('clientId', clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setValue('clientName', client.displayName);
      const newTerms = [...searchTerms];
      if (!newTerms.includes(client.displayName)) {
        newTerms.push(client.displayName);
      }
      if (client.shortName && !newTerms.includes(client.shortName)) {
        newTerms.push(client.shortName);
      }
      if (client.legalRepresentative && !newTerms.includes(client.legalRepresentative)) {
        newTerms.push(client.legalRepresentative);
      }
      setSearchTerms(newTerms);
    }
  };

  const addSearchTerm = () => {
    const trimmed = currentTerm.trim();
    if (trimmed && !searchTerms.includes(trimmed)) {
      setSearchTerms([...searchTerms, trimmed]);
      setCurrentTerm('');
    }
  };

  const removeSearchTerm = (termToRemove: string) => {
    setSearchTerms(searchTerms.filter((t) => t !== termToRemove));
  };

  const addOpposingParty = () => {
    const trimmed = currentParty.trim();
    if (trimmed && !opposingParties.includes(trimmed)) {
      setOpposingParties([...opposingParties, trimmed]);
      setCurrentParty('');
    }
  };

  const removeOpposingParty = (partyToRemove: string) => {
    setOpposingParties(opposingParties.filter((p) => p !== partyToRemove));
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateConflictCheckPayload) => conflictApi.createConflictCheck(payload),
    onSuccess: (data) => {
      success('Đã hoàn tất quét và khởi tạo lệnh tra cứu xung đột!');
      router.push(`/conflict-checks/${data.id}`);
    },
    onError: (err: any) => {
      toastError(err.message || 'Có lỗi xảy ra khi thực hiện tra cứu xung đột');
    },
  });

  const onSubmit = (data: NewConflictCheckForm) => {
    if (searchTerms.length === 0) {
      toastError('Vui lòng nhập ít nhất một từ khóa tra cứu để tiến hành quét!');
      return;
    }

    const payload: CreateConflictCheckPayload = {
      clientId: data.clientMode === 'existing' ? data.clientId : undefined,
      clientName:
        data.clientMode === 'existing'
          ? clients.find((c) => c.id === data.clientId)?.displayName || data.clientName
          : data.clientName,
      matterName: data.matterName,
      searchTerms,
      opposingParties,
      notes: data.notes,
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/conflict-checks">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Search className="h-6 w-6 text-teal-700" />
            Khởi tạo Lệnh Tra cứu Xung đột mới
          </h1>
          <p className="text-sm text-slate-600">
            Thực hiện quét chéo toàn bộ cơ sở dữ liệu khách hàng, cổ đông, đương sự và hồ sơ vụ án.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Client & Matter Identification */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-teal-800 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <CardTitle className="text-base font-semibold text-slate-900">
                Thông tin Khách hàng & Vụ việc dự kiến
              </CardTitle>
            </div>
            <CardDescription>
              Chọn khách hàng đã lưu trong hệ thống hoặc nhập thông tin khách hàng tiềm năng mới
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Nguồn khách hàng
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    value="existing"
                    {...register('clientMode')}
                    className="text-teal-700 focus:ring-teal-700"
                  />
                  Chọn từ Danh bạ khách hàng hiện có
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    value="new"
                    {...register('clientMode')}
                    className="text-teal-700 focus:ring-teal-700"
                  />
                  Khách hàng tiềm năng mới (Chưa có trong danh bạ)
                </label>
              </div>
            </div>

            {clientMode === 'existing' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn khách hàng <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedClientId}
                  onChange={(e) => handleClientSelect(e.target.value)}
                >
                  <option value="">-- Chọn khách hàng từ danh sách --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.clientCode} - {c.displayName} (
                      {c.type === 'ORGANIZATION' ? 'Tổ chức' : 'Cá nhân'})
                    </option>
                  ))}
                </Select>
                {selectedClientId && (
                  <p className="text-xs text-teal-700 mt-1">
                    ✓ Đã tự động thêm tên khách hàng & người đại diện vào danh sách từ khóa quét bên
                    dưới.
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Khách hàng / Thân chủ tiềm năng <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('clientName')}
                  placeholder="Ví dụ: Công ty Cổ phần Đầu tư Công nghệ Toàn Cầu"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên Vụ việc / Dự án dự kiến tiếp nhận <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('matterName')}
                placeholder="Ví dụ: Tư vấn phát hành trái phiếu doanh nghiệp riêng lẻ 500 tỷ"
              />
              {errors.matterName && (
                <p className="text-xs text-red-600 mt-1">{errors.matterName.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Search Terms & Key Entities */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-teal-800 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <CardTitle className="text-base font-semibold text-slate-900">
                Từ khóa tra cứu & Thực thể liên quan (Search Terms)
              </CardTitle>
            </div>
            <CardDescription>
              Hệ thống sẽ đối soát các từ khóa này với toàn bộ kho dữ liệu Khách hàng, Giám đốc, Cổ
              đông và Hồ sơ vụ án quá khứ.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Thêm từ khóa cần quét (Tên công ty, tên cá nhân, cổ đông lớn, tên viết tắt)
              </label>
              <div className="flex gap-2">
                <Input
                  value={currentTerm}
                  onChange={(e) => setCurrentTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSearchTerm();
                    }
                  }}
                  placeholder="Nhập tên thực thể và bấm Thêm hoặc Enter..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSearchTerm}
                  className="gap-1 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  Thêm từ khóa
                </Button>
              </div>

              {/* Tag Cloud */}
              <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 min-h-16 flex flex-wrap gap-2 items-center">
                {searchTerms.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Chưa có từ khóa nào. Hãy nhập ít nhất 1 từ khóa để thực hiện quét.
                  </p>
                ) : (
                  searchTerms.map((term, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs"
                    >
                      {term}
                      <button
                        type="button"
                        onClick={() => removeSearchTerm(term)}
                        className="text-teal-600 hover:text-teal-900 focus:outline-hidden"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Opposing Parties */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-teal-800 text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <CardTitle className="text-base font-semibold text-slate-900">
                Bên đối lập / Đương sự tranh chấp dự kiến (Opposing Parties)
              </CardTitle>
            </div>
            <CardDescription>
              Các đối tượng hoặc doanh nghiệp là bên đối nghịch, bên bị kiện hoặc đối tác đàm phán
              đối lập
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên Bên đối lập / Đương sự đối kháng
              </label>
              <div className="flex gap-2">
                <Input
                  value={currentParty}
                  onChange={(e) => setCurrentParty(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOpposingParty();
                    }
                  }}
                  placeholder="Nhập tên đối thủ hoặc bên tranh chấp và bấm Thêm..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOpposingParty}
                  className="gap-1 shrink-0 text-red-700 hover:bg-red-50 hover:border-red-200"
                >
                  <Plus className="h-4 w-4" />
                  Thêm bên đối lập
                </Button>
              </div>

              {/* Tag Cloud */}
              <div className="mt-3 p-3 bg-red-50/40 rounded-lg border border-red-200 min-h-16 flex flex-wrap gap-2 items-center">
                {opposingParties.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Chưa nhập bên đối lập (không bắt buộc nếu vụ việc là tư vấn nội bộ không tranh
                    chấp).
                  </p>
                ) : (
                  opposingParties.map((party, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-800 border border-red-200 shadow-2xs"
                    >
                      {party}
                      <button
                        type="button"
                        onClick={() => removeOpposingParty(party)}
                        className="text-red-600 hover:text-red-900 focus:outline-hidden"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ghi chú bối cảnh giao dịch & Phạm vi tư vấn
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="Mô tả tóm tắt mục tiêu vụ việc, các bên tham gia giao dịch hoặc các vấn đề cần lưu ý..."
                className="w-full rounded-md border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-hidden focus:ring-1 focus:ring-teal-700"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/conflict-checks">
            <Button type="button" variant="outline">
              Hủy bỏ
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-teal-700 hover:bg-teal-800 text-white gap-2 px-6"
          >
            {createMutation.isPending ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang quét toàn hệ thống...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Thực hiện Quét Xung đột (Scan Now)
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
