'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  Building2,
  User,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Plus,
  Share2,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import type {
  Client,
  ClientStatus,
  Contact,
  ClientRelation,
  ChangeClientStatusPayload,
} from '@lpms/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { clientApi } from '@/lib/api/clients';
import { useToast } from '@/components/ui/toast';

const addContactSchema = z.object({
  fullName: z.string().min(2, 'Vui lòng nhập họ và tên'),
  email: z.string().email('Email không đúng định dạng'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  position: z.string().min(2, 'Vui lòng nhập chức danh'),
  idNumber: z.string().optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().optional(),
});

type AddContactFormData = z.infer<typeof addContactSchema>;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ClientDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const clientId = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newStatus, setNewStatus] = useState<ClientStatus>('IN_REVIEW');
  const [statusNotes, setStatusNotes] = useState('');

  // Fetch client details
  const {
    data: client,
    isLoading,
    error,
  } = useQuery<Client>({
    queryKey: ['client', clientId],
    queryFn: () => clientApi.getClient(clientId),
  });

  // Change Status Mutation
  const statusMutation = useMutation({
    mutationFn: (payload: ChangeClientStatusPayload) => clientApi.changeStatus(clientId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      success('Đã cập nhật trạng thái tiếp nhận khách hàng');
      setShowStatusModal(false);
      setStatusNotes('');
    },
    onError: (err: unknown) => {
      toastError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái');
    },
  });

  // Add Contact Form
  const {
    register: registerContact,
    handleSubmit: handleSubmitContact,
    reset: resetContact,
    formState: { errors: contactErrors, isSubmitting: isAddingContact },
  } = useForm<AddContactFormData>({
    resolver: zodResolver(addContactSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      position: '',
      idNumber: '',
      isPrimary: false,
      notes: '',
    },
  });

  const addContactMutation = useMutation({
    mutationFn: (data: AddContactFormData) => clientApi.addContact(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      success('Đã thêm người liên hệ mới thành công');
      setShowAddContactModal(false);
      resetContact();
    },
    onError: (err: unknown) => {
      toastError(err instanceof Error ? err.message : 'Không thể thêm người liên hệ');
    },
  });

  const onContactSubmit = (data: AddContactFormData) => {
    addContactMutation.mutate(data);
  };

  const handleStatusUpdate = () => {
    statusMutation.mutate({
      status: newStatus,
      decisionNotes: statusNotes,
    });
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500 text-sm">
        <div className="animate-spin h-7 w-7 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-3" />
        Đang tải thông tin hồ sơ khách hàng...
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
          <XCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Không tìm thấy thông tin khách hàng</h2>
        <p className="text-sm text-slate-500">
          Mã định danh khách hàng không tồn tại hoặc bạn không có thẩm quyền truy cập hồ sơ này.
        </p>
        <Link href="/clients">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Quay lại danh bạ
          </Button>
        </Link>
      </div>
    );
  }

  const isOrg = client.type === 'ORGANIZATION';

  // Intake pipeline step indices
  const intakeSteps: { status: ClientStatus; label: string }[] = [
    { status: 'NEW', label: 'Tiếp nhận mới' },
    { status: 'IN_REVIEW', label: 'Thẩm định hồ sơ' },
    { status: 'CONFLICT_CHECK', label: 'Tra cứu Conflict' },
    { status: 'APPROVED', label: 'Đã phê duyệt' },
    { status: 'ACTIVE', label: 'Đang hoạt động' },
  ];

  const currentStepIndex = intakeSteps.findIndex((s) => s.status === client.status);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Nav */}
      <div className="flex items-center justify-between pb-2">
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh bạ khách hàng
        </Link>
      </div>

      {/* Client Header Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className={`h-14 w-14 rounded-xl font-bold flex items-center justify-center text-lg shrink-0 ${
                isOrg
                  ? 'bg-sky-100 text-sky-800 border border-sky-200'
                  : 'bg-teal-100 text-teal-800 border border-teal-200'
              }`}
            >
              {isOrg ? <Building2 className="h-7 w-7" /> : <User className="h-7 w-7" />}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                  {client.displayName}
                </h1>
                <Badge variant={isOrg ? 'primary' : 'success'}>
                  {isOrg ? 'Doanh nghiệp' : 'Cá nhân'}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="font-mono font-semibold text-slate-700">
                  Mã: {client.clientCode}
                </span>
                <span>•</span>
                <span className="font-mono">
                  {isOrg
                    ? client.taxCode
                      ? `MST: ${client.taxCode}`
                      : 'Chưa có MST'
                    : client.idNumber
                      ? `ID: ${client.idNumber}`
                      : 'Chưa có ID'}
                </span>
                <span>•</span>
                <span>
                  Ngày tiếp nhận: {new Date(client.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewStatus(client.status);
                setShowStatusModal(true);
              }}
            >
              Chuyển trạng thái Intake
            </Button>
          </div>
        </div>

        {/* Intake Workflow Stepper */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-600 mb-3">
            Tiến trình thẩm định hồ sơ (Client Intake Workflow):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {intakeSteps.map((step, idx) => {
              const isPastOrCurrent = currentStepIndex >= idx && client.status !== 'REJECTED';
              const isCurrent = step.status === client.status;

              return (
                <div
                  key={step.status}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    isCurrent
                      ? 'bg-teal-50 border-teal-600 font-bold text-teal-900 shadow-xs ring-1 ring-teal-600'
                      : isPastOrCurrent
                        ? 'bg-slate-50 border-slate-300 text-slate-700 font-medium'
                        : 'bg-white border-slate-100 text-slate-300 opacity-60'
                  }`}
                >
                  <span className="text-[10px] block font-mono">Bước {idx + 1}</span>
                  <span className="text-xs">{step.label}</span>
                </div>
              );
            })}
          </div>

          {client.status === 'REJECTED' && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Hồ sơ khách hàng này đã bị từ chối tiếp nhận (REJECTED).</span>
            </div>
          )}
        </div>
      </Card>

      {/* Tabs Navigation */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          {
            id: 'overview',
            label: 'Thông tin định danh',
            icon: <FileText className="h-4 w-4" />,
          },
          {
            id: 'contacts',
            label: 'Đầu mối Người liên hệ',
            icon: <Users className="h-4 w-4" />,
            badge: client.contacts?.length || client.contactsCount || 0,
          },
          {
            id: 'relations',
            label: 'Quan hệ Doanh nghiệp & Cổ đông',
            icon: <Share2 className="h-4 w-4" />,
            badge: client.relations?.length || 0,
          },
          {
            id: 'matters',
            label: 'Hồ sơ Vụ việc (Matters)',
            icon: <Briefcase className="h-4 w-4" />,
            badge: client.mattersCount || 0,
          },
        ]}
      />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                Hồ sơ pháp lý & Định danh
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                {isOrg ? (
                  <>
                    <div>
                      <span className="text-xs text-slate-500 block">Tên doanh nghiệp đầy đủ</span>
                      <span className="font-semibold text-slate-900">
                        {client.vietnameseName || client.displayName}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 block">Tên quốc tế (English)</span>
                      <span className="text-slate-800">{client.englishName || '—'}</span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 block">Tên viết tắt</span>
                      <span className="text-slate-800">{client.shortName || '—'}</span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 block">
                        Người đại diện theo pháp luật
                      </span>
                      <span className="font-semibold text-slate-900">
                        {client.legalRepresentative || '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 block">
                        Mã số thuế / Doanh nghiệp
                      </span>
                      <span className="font-mono font-semibold text-slate-900">
                        {client.taxCode || client.enterpriseNumber || '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 block">Ngành nghề / Lĩnh vực</span>
                      <span className="text-slate-800">{client.industry || '—'}</span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 block">Quốc gia</span>
                      <span className="text-slate-800">{client.country || 'Việt Nam'}</span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 block">Website</span>
                      {client.website ? (
                        <a
                          href={client.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-700 hover:underline inline-flex items-center gap-1"
                        >
                          {client.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        '—'
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-xs text-slate-500 block">Họ và tên thân chủ</span>
                      <span className="font-semibold text-slate-900">{client.displayName}</span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 block">Số CCCD / Hộ chiếu</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {client.idNumber || '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 block">Ngày tháng năm sinh</span>
                      <span className="text-slate-800">
                        {client.dateOfBirth
                          ? new Date(client.dateOfBirth).toLocaleDateString('vi-VN')
                          : '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 block">Quốc tịch</span>
                      <span className="text-slate-800">{client.nationality || 'Việt Nam'}</span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 block">Nghề nghiệp / Chức danh</span>
                      <span className="text-slate-800">{client.occupation || '—'}</span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 block">Đơn vị công tác</span>
                      <span className="text-slate-800">{client.companyName || '—'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Ghi chú tiếp nhận</h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                {client.notes || 'Không có ghi chú bổ sung.'}
              </p>
            </div>
          </Card>

          {/* Contact Card Summary */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Liên lạc & Trụ sở
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-500 block">Địa chỉ</span>
                  <span className="text-slate-800 text-xs leading-relaxed">{client.address}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-500 block">Hộp thư</span>
                  <a
                    href={`mailto:${client.email}`}
                    className="text-teal-700 text-xs hover:underline"
                  >
                    {client.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-slate-500 block">Điện thoại</span>
                  <a href={`tel:${client.phone}`} className="font-mono text-xs text-slate-800">
                    {client.phone}
                  </a>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Contacts */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Danh sách đầu mối nhân sự đại diện làm việc và nhận thông báo chính thức từ công ty
              luật.
            </p>
            <Button size="sm" onClick={() => setShowAddContactModal(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Thêm người liên hệ
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.contacts && client.contacts.length > 0 ? (
              client.contacts.map((con) => (
                <Card key={con.id} className="p-5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{con.fullName}</h4>
                        {con.isPrimary && (
                          <Badge variant="primary" className="text-[10px]">
                            Đầu mối chính
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {con.idNumber ? `ID: ${con.idNumber}` : ''}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-teal-800">{con.position}</p>

                    <div className="space-y-1 text-xs text-slate-600 pt-1">
                      <p className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {con.email}
                      </p>
                      <p className="flex items-center gap-1.5 font-mono">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {con.phone}
                      </p>
                    </div>

                    {con.notes && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 mt-2">
                        {con.notes}
                      </p>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-10 text-slate-500 text-sm">
                Chưa có danh bạ người liên hệ nào được ghi nhận cho khách hàng này.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Corporate Relations */}
      {activeTab === 'relations' && (
        <div className="space-y-4">
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">
                Mục đích kiểm tra Xung đột lợi ích (Conflict Check):
              </span>
              <p className="mt-0.5 text-teal-800 leading-relaxed">
                Các quan hệ cổ đông chi phối, công ty mẹ/con, người đại diện theo pháp luật sẽ được
                hệ thống sử dụng để đối chiếu tự động khi mở vụ việc nhằm ngăn ngừa việc nhận thụ lý
                vụ việc chống lại công ty có quan hệ lợi ích (Section 12 require.md).
              </p>
            </div>
          </div>

          <Card className="overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Tên pháp nhân / Cá nhân liên quan</th>
                  <th className="py-3 px-4">Mối quan hệ pháp lý</th>
                  <th className="py-3 px-4 text-center">Tỷ lệ sở hữu / Cổ phần</th>
                  <th className="py-3 px-4">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {client.relations && client.relations.length > 0 ? (
                  client.relations.map((rel) => (
                    <tr key={rel.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{rel.targetName}</td>
                      <td className="py-3 px-4">
                        <Badge variant="neutral">{rel.relationType}</Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                        {rel.ownershipPercentage ? `${rel.ownershipPercentage}%` : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{rel.notes || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-500">
                      Chưa ghi nhận thông tin công ty mẹ/con hay cổ đông liên quan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Tab 4: Matters */}
      {activeTab === 'matters' && (
        <div className="space-y-4">
          {client.status !== 'ACTIVE' && client.status !== 'APPROVED' ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Quy định Tiếp nhận Hồ sơ (Section 11):</span>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  Khách hàng hiện đang ở trạng thái <strong>{client.status}</strong>. Chưa thể mở hồ
                  sơ vụ việc chính thức (Matter) cho đến khi hoàn thành thẩm định và Conflict Check
                  đạt trạng thái APPROVED / ACTIVE.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg space-y-3">
              <Briefcase className="h-8 w-8 text-slate-400 mx-auto" />
              <h3 className="font-bold text-sm text-slate-800">
                Khách hàng có {client.mattersCount} hồ sơ vụ việc
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Hồ sơ đã được phê duyệt thẩm định. Bạn có thể khởi tạo Matter cho khách hàng này
                trong quy trình mở hồ sơ.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal: Chuyển trạng thái Intake */}
      <Dialog
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Cập nhật Tiến trình Tiếp nhận (Client Intake)"
        confirmLabel="Cập nhật trạng thái"
        isLoading={statusMutation.isPending}
        onConfirm={handleStatusUpdate}
      >
        <div className="space-y-4 text-left">
          <Select
            label="Chọn trạng thái mới"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as ClientStatus)}
          >
            <option value="NEW">1. Tiếp nhận mới (NEW)</option>
            <option value="IN_REVIEW">2. Đang thẩm định hồ sơ (IN_REVIEW)</option>
            <option value="CONFLICT_CHECK">3. Đang tra cứu Conflict Check (CONFLICT_CHECK)</option>
            <option value="APPROVED">4. Đã thẩm định & Phê duyệt (APPROVED)</option>
            <option value="ACTIVE">5. Khách hàng chính thức hoạt động (ACTIVE)</option>
            <option value="REJECTED">Từ chối tiếp nhận (REJECTED)</option>
          </Select>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Ghi chú quyết định / Biên bản thẩm định
            </label>
            <textarea
              rows={3}
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Nhập lý do phê duyệt, ghi chú kết quả conflict check, hoặc lý do từ chối hồ sơ..."
              className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-600"
            />
          </div>
        </div>
      </Dialog>

      {/* Modal: Thêm người liên hệ mới */}
      <Dialog
        isOpen={showAddContactModal}
        onClose={() => setShowAddContactModal(false)}
        title="Thêm người liên hệ mới"
        confirmLabel="Lưu người liên hệ"
        isLoading={addContactMutation.isPending}
        onConfirm={handleSubmitContact(onContactSubmit)}
      >
        <form className="space-y-3.5 text-left">
          <Input
            label="Họ và tên đầy đủ"
            placeholder="Luật sư Nguyễn Văn C..."
            required
            error={contactErrors.fullName?.message}
            {...registerContact('fullName')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              placeholder="c.nguyen@company.vn"
              required
              error={contactErrors.email?.message}
              {...registerContact('email')}
            />
            <Input
              label="Số điện thoại"
              placeholder="0912 345 678"
              required
              error={contactErrors.phone?.message}
              {...registerContact('phone')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Chức danh / Bộ phận"
              placeholder="Giám đốc Pháp chế..."
              required
              error={contactErrors.position?.message}
              {...registerContact('position')}
            />
            <Input
              label="Số CCCD / Hộ chiếu"
              placeholder="079085..."
              {...registerContact('idNumber')}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4"
              {...registerContact('isPrimary')}
            />
            <span className="text-xs text-slate-700 font-semibold">
              Đặt làm đầu mối liên hệ chính thức (Primary Contact)
            </span>
          </label>

          <Input
            label="Ghi chú phân công / vai trò"
            placeholder="Phụ trách giải quyết hợp đồng..."
            {...registerContact('notes')}
          />
        </form>
      </Dialog>
    </div>
  );
}
