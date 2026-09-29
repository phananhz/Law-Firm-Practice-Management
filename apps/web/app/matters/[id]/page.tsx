'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderKanban,
  ArrowLeft,
  Building2,
  Users,
  Calendar,
  Clock,
  Lock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Plus,
  Trash2,
  UserPlus,
  Scale,
  Printer,
  ExternalLink,
  MessageSquare,
  Activity,
  Briefcase,
  AlertCircle,
  FileCheck,
  Send,
  Download,
  Eye,
} from 'lucide-react';
import type {
  Matter,
  MatterStatus,
  MatterMember,
  MatterParty,
  MatterNote,
  MatterTaskSummary,
  MatterDeadlineSummary,
  MatterDocumentSummary,
  ChangeMatterStatusPayload,
  AddMatterMemberPayload,
  AddMatterPartyPayload,
  Employee,
} from '@lpms/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { matterApi } from '@/lib/api/operations';
import { organizationApi } from '@/lib/api/organization';
import { useToast } from '@/components/ui/toast';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MatterDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const matterId = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<MatterStatus>('ACTIVE');
  const [statusNotes, setStatusNotes] = useState('');

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<MatterMember['role']>('MEMBER');
  const [newMemberCanEdit, setNewMemberCanEdit] = useState(true);

  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyRole, setNewPartyRole] = useState<MatterParty['role']>('RELATED_PARTY');
  const [newPartyRep, setNewPartyRep] = useState('');
  const [newPartyContact, setNewPartyContact] = useState('');
  const [newPartyNotes, setNewPartyNotes] = useState('');

  // Inline Note State
  const [noteContent, setNoteContent] = useState('');
  const [noteIsConfidential, setNoteIsConfidential] = useState(false);

  // Queries
  const {
    data: matter,
    isLoading,
    isError,
  } = useQuery<Matter>({
    queryKey: ['matter', matterId],
    queryFn: () => matterApi.getMatter(matterId),
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: () => organizationApi.getEmployees(),
  });

  // Mutations
  const changeStatusMutation = useMutation({
    mutationFn: (payload: ChangeMatterStatusPayload) => matterApi.changeStatus(matterId, payload),
    onSuccess: (data) => {
      success(data.message || 'Cập nhật trạng thái vụ việc thành công!');
      setShowStatusModal(false);
      setStatusNotes('');
      queryClient.invalidateQueries({ queryKey: ['matter', matterId] });
      queryClient.invalidateQueries({ queryKey: ['matters'] });
    },
    onError: (err: any) => {
      toastError(err.message || 'Có lỗi xảy ra khi đổi trạng thái');
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: (payload: AddMatterMemberPayload) => matterApi.addMember(matterId, payload),
    onSuccess: () => {
      success('Đã thêm thành viên vào hồ sơ vụ việc!');
      setShowAddMemberModal(false);
      setNewMemberUserId('');
      queryClient.invalidateQueries({ queryKey: ['matter', matterId] });
    },
    onError: (err: any) => {
      toastError(err.message || 'Có lỗi xảy ra khi thêm thành viên');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => matterApi.removeMember(matterId, memberId),
    onSuccess: () => {
      success('Đã gỡ bỏ thành viên khỏi vụ việc');
      queryClient.invalidateQueries({ queryKey: ['matter', matterId] });
    },
    onError: (err: any) => {
      toastError(err.message || 'Không thể xóa thành viên');
    },
  });

  const addPartyMutation = useMutation({
    mutationFn: (payload: AddMatterPartyPayload) => matterApi.addParty(matterId, payload),
    onSuccess: () => {
      success('Đã thêm bên liên quan vào vụ việc!');
      setShowAddPartyModal(false);
      setNewPartyName('');
      setNewPartyRep('');
      setNewPartyContact('');
      setNewPartyNotes('');
      queryClient.invalidateQueries({ queryKey: ['matter', matterId] });
    },
    onError: (err: any) => {
      toastError(err.message || 'Có lỗi xảy ra khi thêm bên liên quan');
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: ({ content, isConfidential }: { content: string; isConfidential: boolean }) =>
      matterApi.addNote(matterId, content, isConfidential),
    onSuccess: () => {
      success('Đã thêm ghi chú làm việc mới!');
      setNoteContent('');
      queryClient.invalidateQueries({ queryKey: ['matter', matterId] });
    },
    onError: (err: any) => {
      toastError(err.message || 'Không thể thêm ghi chú');
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="h-10 w-10 border-4 border-teal-700 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Đang tải chi tiết hồ sơ vụ việc...</p>
      </div>
    );
  }

  if (isError || !matter) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Không tìm thấy hồ sơ vụ việc</h2>
        <p className="text-sm text-slate-600">
          Vụ việc mã <code>{matterId}</code> không tồn tại hoặc bạn không nằm trong danh sách
          whitelist truy cập.
        </p>
        <Link href="/matters">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Về danh sách vụ việc
          </Button>
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: MatterStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="success" className="gap-1 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Đang thực hiện (ACTIVE)
          </Badge>
        );
      case 'INTAKE':
        return (
          <Badge variant="primary" className="gap-1 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
            Tiếp nhận (INTAKE)
          </Badge>
        );
      case 'CONFLICT_CHECK':
        return (
          <Badge variant="warning" className="gap-1 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            Kiểm tra Xung đột
          </Badge>
        );
      case 'ON_HOLD':
        return (
          <Badge variant="danger" className="gap-1 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
            Tạm dừng (ON_HOLD)
          </Badge>
        );
      case 'COMPLETED':
      case 'CLOSED':
        return (
          <Badge variant="neutral" className="gap-1 font-medium">
            <CheckCircle2 className="h-3 w-3" />
            Đã kết thúc
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getConfidentialityBadge = (level: Matter['confidentialityLevel']) => {
    switch (level) {
      case 'RESTRICTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
            <Lock className="h-3.5 w-3.5 text-rose-700" />
            RESTRICTED (Whitelist bắt buộc)
          </span>
        );
      case 'HIGHLY_CONFIDENTIAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <Lock className="h-3.5 w-3.5 text-purple-700" />
            Tuyệt mật (Highly Confidential)
          </span>
        );
      case 'CONFIDENTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            Bảo mật (Confidential)
          </span>
        );
      case 'NORMAL':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Thông thường (Normal)
          </span>
        );
    }
  };

  const tabsConfig = [
    { id: 'overview', label: 'Tổng quan (Overview)', icon: <FolderKanban className="h-4 w-4" /> },
    {
      id: 'tasks',
      label: 'Công việc (Tasks)',
      icon: <CheckCircle2 className="h-4 w-4" />,
      badge: matter.tasks.length,
    },
    {
      id: 'deadlines',
      label: 'Thời hạn (Deadlines)',
      icon: <Clock className="h-4 w-4" />,
      badge: matter.deadlines.length,
    },
    {
      id: 'documents',
      label: 'Tài liệu (Documents)',
      icon: <FileText className="h-4 w-4" />,
      badge: matter.documents.length,
    },
    {
      id: 'parties',
      label: 'Các bên (Parties)',
      icon: <Users className="h-4 w-4" />,
      badge: matter.parties.length,
    },
    {
      id: 'notes',
      label: 'Ghi chú Luật sư (Notes)',
      icon: <MessageSquare className="h-4 w-4" />,
      badge: matter.notes.length,
    },
    {
      id: 'activity',
      label: 'Nhật ký (Activity)',
      icon: <Activity className="h-4 w-4" />,
      badge: matter.timeline.length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link href="/matters">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ArrowLeft className="h-4 w-4" />
                Về danh sách
              </Button>
            </Link>
            <span className="font-mono text-sm font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
              {matter.matterCode}
            </span>
            {getStatusBadge(matter.status)}
            {getConfidentialityBadge(matter.confidentialityLevel)}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-snug">
            {matter.name}
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <span>Thân chủ:</span>
            <Link
              href={`/clients/${matter.clientId}`}
              className="font-semibold text-slate-800 hover:text-teal-700 hover:underline flex items-center gap-1"
            >
              {matter.clientName}
              <ExternalLink className="h-3 w-3" />
            </Link>
            <span>•</span>
            <span>
              Lĩnh vực: <strong>{matter.practiceArea}</strong>
            </span>
            <span>•</span>
            <span>
              Mở ngày: <strong>{matter.openDate}</strong>
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            In hồ sơ
          </Button>
          <Button
            size="sm"
            onClick={() => setShowStatusModal(true)}
            className="bg-teal-700 hover:bg-teal-800 text-white gap-1.5 text-xs shadow-xs"
          >
            Chuyển Trạng thái Vụ việc
          </Button>
        </div>
      </div>

      {/* RESTRICTED Whitelist Security Alert */}
      {matter.confidentialityLevel === 'RESTRICTED' && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex items-start gap-3.5 shadow-2xs">
          <div className="h-9 w-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 shrink-0 mt-0.5">
            <Lock className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-rose-900 uppercase tracking-wide">
              Hồ sơ Phân loại Bảo mật Đặc biệt (RESTRICTED — Whitelist Bắt buộc)
            </h3>
            <p className="text-rose-800 leading-relaxed">
              Theo Mục 16 require.md: Vụ việc này được khóa bảo vệ nghiêm ngặt. Chỉ các luật sư và
              nhân sự có tên cụ thể trong danh sách{' '}
              <strong>Thành viên Vụ việc (Matter Members)</strong> mới được phép xem tài liệu, công
              việc và nhật ký hoạt động. Partner khác trong văn phòng không mặc định bypass quyền
              truy cập hồ sơ này.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs (Section 74) */}
      <Tabs tabs={tabsConfig} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-teal-700" />
                  Mô tả & Phạm vi Công việc (Scope of Work)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <p className="text-sm text-slate-700 leading-relaxed">
                  {matter.description || 'Chưa cập nhật mô tả chi tiết cho hồ sơ vụ việc này.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="font-semibold text-slate-500 uppercase tracking-wider block">
                      Loại hình Vụ việc
                    </span>
                    <span className="font-medium text-slate-900 mt-0.5 block font-mono">
                      {matter.matterType}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 uppercase tracking-wider block">
                      Mức độ Ưu tiên
                    </span>
                    <span className="font-medium text-slate-900 mt-0.5 block">
                      {matter.priority === 'URGENT'
                        ? 'Khẩn cấp (URGENT)'
                        : matter.priority === 'HIGH'
                          ? 'Cao (HIGH)'
                          : 'Bình thường'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 uppercase tracking-wider block">
                      Phương thức Tính phí
                    </span>
                    <span className="font-medium text-slate-900 mt-0.5 block">
                      {matter.billingMethod || 'Theo giờ (HOURLY)'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 uppercase tracking-wider block">
                      Dự kiến Hoàn thành
                    </span>
                    <span className="font-medium text-slate-900 mt-0.5 block">
                      {matter.expectedCloseDate || 'Chưa xác định'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tasks & Deadlines preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-slate-900">
                      Công việc cần làm ({matter.tasks.length})
                    </CardTitle>
                    <button
                      onClick={() => setActiveTab('tasks')}
                      className="text-xs text-teal-700 hover:underline"
                    >
                      Xem tất cả
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {matter.tasks.slice(0, 2).map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs space-y-1"
                    >
                      <p className="font-medium text-slate-900 line-clamp-1">{t.title}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{t.assigneeName}</span>
                        <span className="text-amber-700 font-semibold">{t.dueDate}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-slate-900">
                      Thời hạn Quan trọng ({matter.deadlines.length})
                    </CardTitle>
                    <button
                      onClick={() => setActiveTab('deadlines')}
                      className="text-xs text-teal-700 hover:underline"
                    >
                      Xem tất cả
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {matter.deadlines.slice(0, 2).map((d) => (
                    <div
                      key={d.id}
                      className="p-2.5 rounded bg-amber-50/50 border border-amber-200 text-xs space-y-1"
                    >
                      <p className="font-medium text-slate-900 line-clamp-1">{d.title}</p>
                      <div className="flex items-center justify-between text-[11px] text-amber-800">
                        <span>{d.category}</span>
                        <span className="font-bold">{d.dueDate}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column: Leadership & Members */}
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-teal-700" />
                    Đội ngũ Tham gia (Team)
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddMemberModal(true)}
                    className="gap-1 text-xs"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Thêm
                  </Button>
                </div>
                <CardDescription>
                  Danh sách luật sư được cấp quyền truy cập vào hồ sơ vụ việc
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 divide-y divide-slate-100">
                {matter.members.map((member) => (
                  <div
                    key={member.id}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{member.userName}</p>
                      <span className="text-[10px] uppercase font-bold text-teal-700">
                        {member.role.replace('_', ' ')}
                      </span>
                    </div>
                    {member.role !== 'RESPONSIBLE_PARTNER' &&
                      member.role !== 'RESPONSIBLE_LAWYER' && (
                        <button
                          onClick={() => removeMemberMutation.mutate(member.id)}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Xóa thành viên"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Linked Conflict Check Card */}
            {matter.conflictCheckId && (
              <Card className="border-slate-200 shadow-xs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Thẩm định Xung đột Lợi ích
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-slate-800">
                      {matter.conflictCheckId}
                    </span>
                    <Badge variant="success">Đã đối soát</Badge>
                  </div>
                  <Link
                    href={`/conflict-checks/${matter.conflictCheckId}`}
                    className="text-teal-700 hover:underline flex items-center gap-1 font-medium mt-1"
                  >
                    Xem phiếu thẩm định xung đột
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Tasks */}
      {activeTab === 'tasks' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Quản lý Công việc & Nhiệm vụ Vụ việc ({matter.tasks.length})
              </CardTitle>
              <CardDescription>
                Phân công công việc, hạn chót và theo dõi tiến độ xử lý hồ sơ
              </CardDescription>
            </div>
            <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Giao việc mới
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {matter.tasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Chưa có công việc nào được tạo cho hồ sơ này.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {matter.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            task.status === 'DONE'
                              ? 'bg-emerald-500'
                              : task.status === 'IN_PROGRESS'
                                ? 'bg-amber-500'
                                : 'bg-slate-300'
                          }`}
                        />
                        <h4 className="font-semibold text-slate-900 text-sm">{task.title}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>
                          Người thực hiện: <strong>{task.assigneeName}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Hạn hoàn thành: <strong className="text-slate-700">{task.dueDate}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          task.priority === 'URGENT' || task.priority === 'HIGH'
                            ? 'danger'
                            : 'neutral'
                        }
                      >
                        {task.priority}
                      </Badge>
                      <Badge variant={task.status === 'DONE' ? 'success' : 'primary'}>
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Deadlines */}
      {activeTab === 'deadlines' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Thời hạn Tố tụng & Lịch xử ({matter.deadlines.length})
              </CardTitle>
              <CardDescription>
                Theo dõi thời hiệu khởi kiện, thời hạn nộp chứng cứ và các phiên làm việc cơ quan có
                thẩm quyền
              </CardDescription>
            </div>
            <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Thêm thời hạn mới
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {matter.deadlines.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Chưa có mốc thời hạn tố tụng nào được ghi nhận.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {matter.deadlines.map((dl) => (
                  <div
                    key={dl.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-teal-700" />
                        <h4 className="font-semibold text-slate-900 text-sm">{dl.title}</h4>
                      </div>
                      <p className="text-xs text-slate-500">
                        Phân loại: <span className="font-medium text-slate-800">{dl.category}</span>{' '}
                        • Nhắc trước: {dl.reminderDays} ngày
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono text-sm font-bold text-slate-900 block">
                          {dl.dueDate}
                        </span>
                        {dl.isOverdue && (
                          <span className="text-[10px] font-bold text-rose-600 block">
                            ĐÃ QUÁ HẠN
                          </span>
                        )}
                      </div>
                      <Badge variant={dl.isOverdue ? 'danger' : 'warning'}>
                        {dl.isOverdue ? 'Quá hạn' : 'Sắp đến hạn'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Documents */}
      {activeTab === 'documents' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Hồ sơ & Tài liệu Vụ việc ({matter.documents.length})
              </CardTitle>
              <CardDescription>
                Lưu trữ tập trung hợp đồng, chứng cứ, biên bản và báo cáo tư vấn theo phiên bản
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/documents?matterId=${matter.id}`}>
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  <span>📁</span> Mở kho DMS
                </Button>
              </Link>
              <Link href={`/documents/upload?matterId=${matter.id}`}>
                <Button
                  size="sm"
                  className="bg-teal-700 hover:bg-teal-800 text-white gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tải lên tài liệu
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {matter.documents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Chưa có tài liệu nào được tải lên cho hồ sơ vụ việc này.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {matter.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm hover:underline cursor-pointer">
                          {doc.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{doc.category}</span>
                          <span>•</span>
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span className="font-mono text-teal-700 font-semibold">
                            {doc.version}
                          </span>
                          <span>•</span>
                          <span>Tải lên bởi: {doc.uploadedBy}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-1 text-xs">
                        <Download className="h-3.5 w-3.5" />
                        Tải về
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 5: Parties */}
      {activeTab === 'parties' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Các Bên Tham gia Vụ việc ({matter.parties.length})
              </CardTitle>
              <CardDescription>
                Thân chủ, bên đối kháng, công ty liên kết, Tòa án, Hội đồng Trọng tài và nhân chứng
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddPartyModal(true)}
              className="bg-teal-700 hover:bg-teal-800 text-white gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm bên tham gia
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {matter.parties.map((party) => (
                <div key={party.id} className="p-4 sm:p-5 hover:bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900 text-sm">{party.name}</h4>
                      <Badge
                        variant={
                          party.role === 'CLIENT'
                            ? 'success'
                            : party.role === 'OPPOSING_PARTY'
                              ? 'danger'
                              : party.role === 'ARBITRATOR' || party.role === 'COURT'
                                ? 'primary'
                                : 'neutral'
                        }
                      >
                        {party.role}
                      </Badge>
                    </div>
                  </div>

                  {party.representativeName && (
                    <p className="text-xs text-slate-600">
                      Người đại diện: <strong>{party.representativeName}</strong>
                    </p>
                  )}

                  {party.contactInfo && (
                    <p className="text-xs text-slate-500">Liên hệ: {party.contactInfo}</p>
                  )}

                  {party.notes && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-200">
                      {party.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 6: Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-teal-700" />
                Thêm Ghi chú Làm việc Mới
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <textarea
                rows={3}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Ghi chú nội dung trao đổi với thân chủ, chiến lược tranh tụng hoặc định hướng soạn thảo..."
                className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-hidden focus:ring-1 focus:ring-teal-700"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noteIsConfidential}
                    onChange={(e) => setNoteIsConfidential(e.target.checked)}
                    className="rounded text-teal-700 focus:ring-teal-700"
                  />
                  <span>Ghi chú tuyệt mật (Privileged Work-Product)</span>
                </label>
                <Button
                  size="sm"
                  disabled={!noteContent.trim() || addNoteMutation.isPending}
                  onClick={() =>
                    addNoteMutation.mutate({
                      content: noteContent.trim(),
                      isConfidential: noteIsConfidential,
                    })
                  }
                  className="bg-teal-700 hover:bg-teal-800 text-white gap-1 text-xs"
                >
                  <Send className="h-3 w-3" />
                  Lưu ghi chú
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs overflow-hidden">
            <CardHeader className="border-b border-slate-100 pb-3 bg-slate-50/50">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Sổ tay Ghi chú Nội bộ ({matter.notes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-100">
              {matter.notes.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Chưa có ghi chú nào được lưu lại.
                </div>
              ) : (
                matter.notes.map((note) => (
                  <div key={note.id} className="p-4 sm:p-5 space-y-2 hover:bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs">
                          {note.authorName}
                        </span>
                        {note.isConfidential && (
                          <Badge variant="warning" className="gap-1 text-[10px]">
                            <Lock className="h-2.5 w-2.5" /> Tuyệt mật
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(note.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 7: Activity Timeline */}
      {activeTab === 'activity' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-teal-700" />
              Nhật ký Kiểm toán Hoạt động Bất biến (Audit Log)
            </CardTitle>
            <CardDescription>
              Toàn bộ lịch sử thay đổi trạng thái, điều chỉnh phân quyền và thao tác hồ sơ được ghi
              nhận tự động
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {matter.timeline.map((evt) => (
                <div key={evt.id} className="relative">
                  <span className="absolute -left-6 top-1.5 h-3 w-3 rounded-full bg-teal-700 ring-4 ring-white" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900">{evt.actorName}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {new Date(evt.timestamp).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200/80">
                      {evt.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal 1: Status Change Dialog */}
      <Dialog
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Chuyển Trạng thái Vụ việc"
        description="Mọi thay đổi trạng thái sẽ được ghi vào nhật ký kiểm toán bất biến theo Mục 14 require.md"
        confirmLabel="Lưu Trạng thái mới"
        onConfirm={() =>
          changeStatusMutation.mutate({
            status: newStatus,
            notes: statusNotes,
          })
        }
        isLoading={changeStatusMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Trạng thái tiếp theo
            </label>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as MatterStatus)}
            >
              <option value="INTAKE">INTAKE (Tiếp nhận hồ sơ)</option>
              <option value="CONFLICT_CHECK">CONFLICT_CHECK (Đang kiểm tra xung đột)</option>
              <option value="PROPOSAL">PROPOSAL (Gửi báo giá / Đề xuất dịch vụ)</option>
              <option value="ACTIVE">ACTIVE (Đang thực hiện)</option>
              <option value="WAITING_CLIENT">WAITING_CLIENT (Chờ phản hồi của Thân chủ)</option>
              <option value="WAITING_AUTHORITY">
                WAITING_AUTHORITY (Chờ cơ quan nhà nước thụ lý)
              </option>
              <option value="ON_HOLD">ON_HOLD (Tạm dừng xử lý)</option>
              <option value="COMPLETED">COMPLETED (Hoàn thành công việc)</option>
              <option value="CLOSED">CLOSED (Đóng hồ sơ)</option>
              <option value="ARCHIVED">ARCHIVED (Lưu trữ)</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lý do thay đổi & Ghi chú nhật ký
            </label>
            <textarea
              rows={3}
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Nhập căn cứ pháp lý hoặc quyết định chỉ đạo chuyển trạng thái..."
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-teal-700 focus:outline-hidden"
            />
          </div>
        </div>
      </Dialog>

      {/* Modal 2: Add Member Dialog */}
      <Dialog
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        title="Thêm Thành viên vào Vụ việc (Matter Member)"
        description="Chỉ định nhân sự tham gia xử lý vụ việc và cấp quyền truy cập tài liệu"
        confirmLabel="Thêm thành viên"
        onConfirm={() => {
          if (!newMemberUserId) {
            toastError('Vui lòng chọn nhân sự');
            return;
          }
          addMemberMutation.mutate({
            userId: newMemberUserId,
            role: newMemberRole,
            canEdit: newMemberCanEdit,
          });
        }}
        isLoading={addMemberMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Chọn Nhân sự</label>
            <Select value={newMemberUserId} onChange={(e) => setNewMemberUserId(e.target.value)}>
              <option value="">-- Chọn nhân sự từ công ty --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.positionTitle}) - {emp.departmentName}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Vai trò trong Vụ việc
            </label>
            <Select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value as MatterMember['role'])}
            >
              <option value="MEMBER">Thành viên tham gia (Member)</option>
              <option value="ASSISTANT">Trợ lý / Paralegal (Assistant)</option>
              <option value="EXTERNAL_COLLABORATOR">Cộng tác viên bên ngoài (Collaborator)</option>
            </Select>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={newMemberCanEdit}
              onChange={(e) => setNewMemberCanEdit(e.target.checked)}
              className="rounded text-teal-700 focus:ring-teal-700"
            />
            <span>Cho phép chỉnh sửa tài liệu và cập nhật công việc</span>
          </label>
        </div>
      </Dialog>

      {/* Modal 3: Add Party Dialog */}
      <Dialog
        isOpen={showAddPartyModal}
        onClose={() => setShowAddPartyModal(false)}
        title="Thêm Bên Tham gia vào Vụ việc"
        description="Khai báo các bên liên quan, cơ quan xét xử hoặc đối thủ trong vụ việc"
        confirmLabel="Lưu bên tham gia"
        onConfirm={() => {
          if (!newPartyName.trim()) {
            toastError('Vui lòng nhập tên bên tham gia');
            return;
          }
          addPartyMutation.mutate({
            name: newPartyName.trim(),
            role: newPartyRole,
            representativeName: newPartyRep.trim() || undefined,
            contactInfo: newPartyContact.trim() || undefined,
            notes: newPartyNotes.trim() || undefined,
          });
        }}
        isLoading={addPartyMutation.isPending}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên Thực thể / Cá nhân <span className="text-red-500">*</span>
            </label>
            <Input
              value={newPartyName}
              onChange={(e) => setNewPartyName(e.target.value)}
              placeholder="Ví dụ: Tòa án Nhân dân Cấp cao tại TP.HCM"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Vai trò Tố tụng / Liên quan <span className="text-red-500">*</span>
            </label>
            <Select
              value={newPartyRole}
              onChange={(e) => setNewPartyRole(e.target.value as MatterParty['role'])}
            >
              <option value="OPPOSING_PARTY">Bên đối kháng (Opposing Party)</option>
              <option value="RELATED_PARTY">Bên có quyền lợi & nghĩa vụ liên quan</option>
              <option value="COURT">Tòa án Nhân dân (Court)</option>
              <option value="ARBITRATOR">Hội đồng Trọng tài (Arbitrator)</option>
              <option value="AUTHORITY">Cơ quan Nhà nước có thẩm quyền</option>
              <option value="WITNESS">Người làm chứng (Witness)</option>
              <option value="REPRESENTATIVE">Đại diện theo ủy quyền</option>
              <option value="OTHER">Bên khác (Other)</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Người đại diện / Thẩm phán / Trọng tài viên
            </label>
            <Input
              value={newPartyRep}
              onChange={(e) => setNewPartyRep(e.target.value)}
              placeholder="Ví dụ: Thẩm phán chủ tọa Nguyễn Thị Mai"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Thông tin Liên hệ
            </label>
            <Input
              value={newPartyContact}
              onChange={(e) => setNewPartyContact(e.target.value)}
              placeholder="Email, số điện thoại hoặc địa chỉ trụ sở..."
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
