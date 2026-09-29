'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ShieldAlert,
  UserX,
  UserCheck,
  Edit2,
  Lock,
  Mail,
  Phone,
  Building2,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';
import type {
  Department,
  Employee,
  Position,
  UserRole,
  UserStatus,
  CreateEmployeePayload,
} from '@lpms/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { organizationApi } from '@/lib/api/organization';
import { useToast } from '@/components/ui/toast';

const createEmployeeSchema = z.object({
  employeeCode: z.string().min(2, 'Mã nhân viên tối thiểu 2 ký tự'),
  fullName: z.string().min(2, 'Vui lòng nhập họ và tên'),
  email: z.string().email('Email không đúng định dạng'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  departmentId: z.string().min(1, 'Vui lòng chọn phòng ban'),
  positionId: z.string().min(1, 'Vui lòng chọn chức danh'),
  roles: z.array(z.string()).min(1, 'Vui lòng chọn ít nhất 1 vai trò'),
  startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
});

type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>;

const ALL_ROLES: { value: UserRole; label: string }[] = [
  { value: 'MANAGING_PARTNER', label: 'Managing Partner' },
  { value: 'PARTNER', label: 'Partner (Thành viên)' },
  { value: 'LAWYER', label: 'Lawyer (Luật sư)' },
  { value: 'PARALEGAL', label: 'Paralegal (Trợ lý)' },
  { value: 'INTERN', label: 'Intern (Thực tập)' },
  { value: 'ACCOUNTANT', label: 'Accountant (Kế toán)' },
  { value: 'ADMIN_STAFF', label: 'Admin Staff (Hành chính)' },
  { value: 'RECEPTIONIST', label: 'Receptionist (Lễ tân)' },
  { value: 'SYSTEM_ADMIN', label: 'System Admin' },
];

export default function UsersManagementPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [showAddModal, setShowAddModal] = useState(false);
  const [employeeToSuspend, setEmployeeToSuspend] = useState<Employee | null>(null);
  const [employeeToReactivate, setEmployeeToReactivate] = useState<Employee | null>(null);

  // Queries
  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['admin', 'employees'],
    queryFn: organizationApi.getEmployees,
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['admin', 'departments'],
    queryFn: organizationApi.getDepartments,
  });

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ['admin', 'positions'],
    queryFn: organizationApi.getPositions,
  });

  // Create Employee Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateEmployeeFormData>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      employeeCode: `EMP-00${employees.length + 1}`,
      fullName: '',
      email: '',
      phone: '',
      departmentId: departments[0]?.id || '',
      positionId: positions[0]?.id || '',
      roles: ['LAWYER'],
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const selectedRoles = watch('roles', []);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateEmployeePayload) => organizationApi.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] });
      success('Đã thêm nhân sự mới thành công');
      setShowAddModal(false);
      reset();
    },
    onError: (err: unknown) => {
      toastError(err instanceof Error ? err.message : 'Không thể tạo nhân sự');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => organizationApi.suspendEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] });
      success('Đã đình chỉ tài khoản và thu hồi các phiên truy cập');
      setEmployeeToSuspend(null);
    },
    onError: (err: unknown) => {
      toastError(err instanceof Error ? err.message : 'Không thể đình chỉ tài khoản');
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => organizationApi.reactivateEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] });
      success('Đã kích hoạt lại tài khoản nhân viên thành công');
      setEmployeeToReactivate(null);
    },
    onError: (err: unknown) => {
      toastError(err instanceof Error ? err.message : 'Không thể kích hoạt lại tài khoản');
    },
  });

  const onAddSubmit = (data: CreateEmployeeFormData) => {
    createMutation.mutate({
      ...data,
      roles: data.roles as UserRole[],
    });
  };

  const handleRoleToggle = (role: UserRole) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length > 1) {
        setValue(
          'roles',
          selectedRoles.filter((r) => r !== role),
        );
      }
    } else {
      setValue('roles', [...selectedRoles, role]);
    }
  };

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = filterDepartment === 'ALL' || emp.departmentId === filterDepartment;
      const matchStatus = filterStatus === 'ALL' || emp.status === filterStatus;

      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, searchTerm, filterDepartment, filterStatus]);

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Hoạt động</Badge>;
      case 'SUSPENDED':
        return <Badge variant="danger">Đã đình chỉ</Badge>;
      case 'RESIGNED':
        return <Badge variant="neutral">Đã nghỉ việc</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-teal-700" />
            Nhân sự & Tài khoản người dùng
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản trị danh sách nhân sự, gán vai trò quyền hạn và quản lý trạng thái tài khoản.
          </p>
        </div>

        <Button onClick={() => setShowAddModal(true)} className="sm:self-start">
          <UserPlus className="h-4 w-4 mr-1.5" />
          Thêm nhân sự mới
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <Input
              placeholder="Tìm kiếm theo họ tên, email hoặc mã nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leadingIcon={<Search className="h-4 w-4" />}
            />
          </div>

          <div>
            <Select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
              <option value="ALL">Tất cả phòng ban</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
              <option value="SUSPENDED">Đã đình chỉ (SUSPENDED)</option>
              <option value="RESIGNED">Đã nghỉ việc (RESIGNED)</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Employees Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Nhân viên</th>
                <th className="py-3.5 px-4">Mã NV</th>
                <th className="py-3.5 px-4">Phòng ban & Chức danh</th>
                <th className="py-3.5 px-4">Vai trò (Roles)</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Phiên hoạt động</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Đang tải danh sách nhân sự...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Không tìm thấy nhân sự phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-teal-100 text-teal-800 font-semibold flex items-center justify-center text-xs shrink-0">
                          {emp.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .slice(-2)
                            .join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">
                            {emp.fullName}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" />
                            {emp.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700">
                      {emp.employeeCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-900">{emp.departmentName}</p>
                        <p className="text-[11px] text-slate-500">{emp.positionTitle}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {emp.roles.map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(emp.status)}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-mono font-medium text-slate-600">
                        {emp.activeSessionsCount} thiết bị
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {emp.status === 'ACTIVE' ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-xs py-1 px-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 shadow-none hover:shadow-none"
                            onClick={() => setEmployeeToSuspend(emp)}
                          >
                            <UserX className="h-3.5 w-3.5 mr-1" />
                            Đình chỉ
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs py-1 px-2.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            onClick={() => setEmployeeToReactivate(emp)}
                          >
                            <UserCheck className="h-3.5 w-3.5 mr-1" />
                            Kích hoạt lại
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Thêm nhân sự mới */}
      <Dialog
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Thêm nhân sự mới vào hệ thống"
        confirmLabel="Lưu nhân sự"
        isLoading={createMutation.isPending}
        onConfirm={handleSubmit(onAddSubmit)}
      >
        <form className="space-y-3.5 text-left">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Mã nhân viên"
              required
              error={errors.employeeCode?.message}
              {...register('employeeCode')}
            />
            <Input
              label="Ngày bắt đầu công tác"
              type="date"
              required
              error={errors.startDate?.message}
              {...register('startDate')}
            />
          </div>

          <Input
            label="Họ và tên đầy đủ"
            placeholder="Luật sư Nguyễn Văn B"
            required
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email công vụ"
              type="email"
              placeholder="b.nguyen@lpms.vn"
              required
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Số điện thoại"
              placeholder="0912345678"
              required
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Phòng ban trực thuộc"
              required
              error={errors.departmentId?.message}
              {...register('departmentId')}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Select
              label="Chức danh đảm nhiệm"
              required
              error={errors.positionId?.message}
              {...register('positionId')}
            >
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </div>

          {/* Vai trò RBAC */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-sm font-medium text-slate-700">
              Gán vai trò hệ thống (RBAC Roles) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-md bg-slate-50/50">
              {ALL_ROLES.map((r) => {
                const checked = selectedRoles.includes(r.value);
                return (
                  <label
                    key={r.value}
                    className={`flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer select-none transition-colors ${
                      checked
                        ? 'bg-teal-50 border border-teal-300 font-semibold text-teal-900'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleRoleToggle(r.value)}
                      className="rounded text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                    />
                    <span>{r.label}</span>
                  </label>
                );
              })}
            </div>
            {errors.roles && <p className="text-xs text-rose-600">{errors.roles.message}</p>}
          </div>
        </form>
      </Dialog>

      {/* Modal: Xác nhận Đình chỉ tài khoản */}
      <Dialog
        isOpen={!!employeeToSuspend}
        onClose={() => setEmployeeToSuspend(null)}
        title="Xác nhận đình chỉ tài khoản nhân sự?"
        confirmLabel="Đình chỉ & Thu hồi phiên"
        confirmVariant="destructive"
        isLoading={suspendMutation.isPending}
        onConfirm={() => {
          if (employeeToSuspend) {
            suspendMutation.mutate(employeeToSuspend.id);
          }
        }}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Bạn có chắc chắn muốn đình chỉ tài khoản của{' '}
            <strong className="text-slate-900">{employeeToSuspend?.fullName}</strong> (
            {employeeToSuspend?.email})?
          </p>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-rose-950">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              Chính sách an toàn Mục 9 trong require.md:
            </div>
            <ul className="list-disc pl-4 space-y-1 text-rose-800">
              <li>
                Nhân viên bị đình chỉ sẽ không thể đăng nhập vào bất kỳ ứng dụng nào của hệ thống.
              </li>
              <li>
                Toàn bộ{' '}
                <strong>
                  {employeeToSuspend?.activeSessionsCount || 0} phiên đăng nhập hiện có
                </strong>{' '}
                trên mọi thiết bị sẽ bị thu hồi hiệu lực ngay lập tức.
              </li>
            </ul>
          </div>
        </div>
      </Dialog>

      {/* Modal: Xác nhận Kích hoạt lại tài khoản */}
      <Dialog
        isOpen={!!employeeToReactivate}
        onClose={() => setEmployeeToReactivate(null)}
        title="Kích hoạt lại tài khoản?"
        confirmLabel="Kích hoạt tài khoản"
        confirmVariant="primary"
        isLoading={reactivateMutation.isPending}
        onConfirm={() => {
          if (employeeToReactivate) {
            reactivateMutation.mutate(employeeToReactivate.id);
          }
        }}
      >
        <p className="text-sm text-slate-600">
          Kích hoạt lại tài khoản của nhân viên{' '}
          <strong className="text-slate-900">{employeeToReactivate?.fullName}</strong>. Nhân sự sẽ
          được phép đăng nhập lại bình thường với các vai trò đã được phân bổ trước đó.
        </p>
      </Dialog>
    </div>
  );
}
