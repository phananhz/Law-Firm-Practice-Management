'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Building2,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  UserX,
  Lock,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import type { Department, Employee, RoleDefinition } from '@lpms/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { organizationApi } from '@/lib/api/organization';

export default function AdministrationOverviewPage() {
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['admin', 'employees'],
    queryFn: organizationApi.getEmployees,
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['admin', 'departments'],
    queryFn: organizationApi.getDepartments,
  });

  const { data: roles = [] } = useQuery<RoleDefinition[]>({
    queryKey: ['admin', 'roles'],
    queryFn: organizationApi.getRoles,
  });

  const activeEmployees = employees.filter((e) => e.status === 'ACTIVE').length;
  const suspendedEmployees = employees.filter((e) => e.status === 'SUSPENDED').length;
  const mfaCount = employees.filter((e) => e.mfaEnabled).length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Tổng quan Quản trị & Phân quyền
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý cơ cấu nhân sự, phòng ban chuyên môn, chức danh và ma trận phân quyền vai trò
          (RBAC) của công ty luật.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">Tổng nhân sự</span>
            <div className="text-2xl font-bold text-slate-900">{employees.length}</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-700 font-medium">{activeEmployees} hoạt động</span>
              {suspendedEmployees > 0 && (
                <span className="text-rose-600 font-medium">• {suspendedEmployees} đình chỉ</span>
              )}
            </div>
          </div>
          <div className="h-12 w-12 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">Phòng ban chuyên môn</span>
            <div className="text-2xl font-bold text-slate-900">{departments.length}</div>
            <span className="text-xs text-slate-500">Bao phủ các lĩnh vực hành nghề</span>
          </div>
          <div className="h-12 w-12 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center">
            <Building2 className="h-6 w-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">Vai trò hệ thống (RBAC)</span>
            <div className="text-2xl font-bold text-slate-900">{roles.length}</div>
            <span className="text-xs text-slate-500">Cấu hình phân quyền động</span>
          </div>
          <div className="h-12 w-12 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">Kích hoạt MFA</span>
            <div className="text-2xl font-bold text-slate-900">{mfaCount}</div>
            <span className="text-xs text-emerald-700 font-medium">Bảo vệ xác thực 2 lớp</span>
          </div>
          <div className="h-12 w-12 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
            <Lock className="h-6 w-6" />
          </div>
        </Card>
      </div>

      {/* Main Administrative Modules Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:border-teal-600 transition-all flex flex-col justify-between">
          <CardHeader>
            <div className="h-10 w-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-2">
              <Users className="h-5 w-5" />
            </div>
            <CardTitle>Nhân sự & Tài khoản</CardTitle>
            <CardDescription>
              Xem danh sách toàn bộ luật sư, trợ lý và nhân viên. Tạo mới hồ sơ, chỉnh sửa thông
              tin, đình chỉ hoạt động và thu hồi các phiên truy cập của nhân sự.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              href="/administration/users"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              Vào quản lý nhân sự
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-teal-600 transition-all flex flex-col justify-between">
          <CardHeader>
            <div className="h-10 w-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center mb-2">
              <Building2 className="h-5 w-5" />
            </div>
            <CardTitle>Cơ cấu Phòng ban & Chức danh</CardTitle>
            <CardDescription>
              Quản lý các phòng chuyên môn (Tranh tụng, Doanh nghiệp & M&A, Sở hữu trí tuệ,...) và
              phân cấp chức danh từ Managing Partner đến Thực tập sinh.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              href="/administration/organization"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              Vào cơ cấu tổ chức
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-teal-600 transition-all flex flex-col justify-between">
          <CardHeader>
            <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <CardTitle>Ma trận Vai trò & Phân quyền</CardTitle>
            <CardDescription>
              Cấu hình trực quan quyền hạn chi tiết cho từng vai trò trên từng module nghiệp vụ
              (Matter, Client, Document, Task, Audit, System) theo chuẩn Configurable RBAC.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link
              href="/administration/roles"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              Vào ma trận phân quyền
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Security Baseline Summary */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-3">
        <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-teal-700" />
          Tiêu chuẩn an toàn thông tin (Mục 6, 7, 9 & 102 trong require.md):
        </h3>
        <ul className="text-xs text-slate-600 space-y-1.5 pl-6 list-disc leading-relaxed">
          <li>
            <strong>Đình chỉ tài khoản (Suspend):</strong> Khi nhân sự bị đánh dấu{' '}
            <code>SUSPENDED</code>, toàn bộ phiên làm việc (Active Sessions) sẽ bị thu hồi tức thì
            và không thể đăng nhập lại.
          </li>
          <li>
            <strong>Phân quyền đa tầng:</strong> Vai trò nhân sự chỉ là lớp kiểm tra sơ bộ (RBAC).
            Mọi quyền truy cập hồ sơ cụ thể đều phải kết hợp với tư cách thành viên vụ việc (Matter
            Membership) và mức độ bảo mật.
          </li>
          <li>
            <strong>Ghi nhận kiểm toán (Audit):</strong> Mọi thao tác gán quyền, đổi vai trò, đình
            chỉ hoặc mở lại tài khoản đều được ghi lại trong nhật ký kiểm toán bất biến.
          </li>
        </ul>
      </div>
    </div>
  );
}
