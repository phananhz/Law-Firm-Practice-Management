'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  ShieldAlert,
  Save,
  Check,
  AlertTriangle,
  RotateCcw,
  Info,
  Lock,
} from 'lucide-react';
import type { PermissionDefinition, RoleDefinition, UserRole } from '@lpms/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { organizationApi } from '@/lib/api/organization';
import { useToast } from '@/components/ui/toast';

export default function RolesAndPermissionsPage() {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [currentPermissions, setCurrentPermissions] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);

  // Queries
  const { data: roles = [], isLoading: isRolesLoading } = useQuery<RoleDefinition[]>({
    queryKey: ['admin', 'roles'],
    queryFn: organizationApi.getRoles,
  });

  const { data: permissions = [], isLoading: isPermsLoading } = useQuery<PermissionDefinition[]>({
    queryKey: ['admin', 'permissions'],
    queryFn: organizationApi.getPermissions,
  });

  // Set default selected role when roles load
  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      const defaultRole = roles.find((r) => r.name === 'PARTNER') || roles[0];
      setSelectedRoleId(defaultRole.id);
      setCurrentPermissions(defaultRole.permissions);
    }
  }, [roles, selectedRoleId]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  const handleSelectRole = (role: RoleDefinition) => {
    if (isDirty) {
      if (
        !confirm(
          'Bạn đang có thay đổi chưa lưu trên vai trò hiện tại. Bạn có chắc muốn chuyển vai trò khác?',
        )
      ) {
        return;
      }
    }
    setSelectedRoleId(role.id);
    setCurrentPermissions(role.permissions);
    setIsDirty(false);
  };

  const handleTogglePermission = (permCode: string) => {
    let next: string[];
    if (currentPermissions.includes(permCode)) {
      next = currentPermissions.filter((p) => p !== permCode);
    } else {
      next = [...currentPermissions, permCode];
    }
    setCurrentPermissions(next);
    setIsDirty(true);
  };

  const handleReset = () => {
    if (selectedRole) {
      setCurrentPermissions(selectedRole.permissions);
      setIsDirty(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: () => organizationApi.updateRolePermissions(selectedRoleId, currentPermissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      success(`Đã cập nhật quyền hạn cho vai trò ${selectedRole?.displayName}`);
      setIsDirty(false);
      setShowConfirmSave(false);
    },
    onError: (err: unknown) => {
      toastError(err instanceof Error ? err.message : 'Không thể cập nhật quyền');
    },
  });

  // Group permissions by module
  const modulesOrder = [
    { key: 'matter', name: 'Hồ sơ Vụ việc (Matter)' },
    { key: 'client', name: 'Khách hàng & Thẩm định (Client & Conflict)' },
    { key: 'document', name: 'Quản lý Tài liệu (DMS)' },
    { key: 'task', name: 'Công việc & Phân công (Tasks)' },
    { key: 'user', name: 'Nhân sự & Tài khoản (Users)' },
    { key: 'system', name: 'Hệ thống & Cấu hình (System)' },
    { key: 'audit', name: 'Kiểm toán & Bảo mật (Audit)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-teal-700" />
            Ma trận Vai trò & Phân quyền (Configurable RBAC)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cấu hình quyền hạn truy cập của 10 vai trò mặc định trong công ty luật theo Mục 6 & 7
            của require.md.
          </p>
        </div>

        {isDirty && (
          <div className="flex items-center gap-2 self-start sm:self-auto animate-in fade-in">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Khôi phục
            </Button>
            <Button
              size="sm"
              onClick={() => setShowConfirmSave(true)}
              className="bg-emerald-700 hover:bg-emerald-800"
            >
              <Save className="h-4 w-4 mr-1.5" />
              Lưu thay đổi quyền
            </Button>
          </div>
        )}
      </div>

      {/* Main Layout: Roles list on left, Permissions matrix on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Roles List Panel */}
        <div className="lg:col-span-4 space-y-3">
          <Card>
            <CardHeader className="py-3 px-4 bg-slate-50/70 border-b border-slate-200">
              <CardTitle className="text-sm font-semibold">
                Danh mục Vai trò ({roles.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {isRolesLoading ? (
                <div className="p-4 text-center text-xs text-slate-500">Đang tải vai trò...</div>
              ) : (
                roles.map((role) => {
                  const isSelected = role.id === selectedRoleId;
                  return (
                    <button
                      key={role.id}
                      onClick={() => handleSelectRole(role)}
                      className={`w-full text-left p-3 rounded-lg transition-colors cursor-pointer flex flex-col gap-1 border ${
                        isSelected
                          ? 'bg-teal-50/80 border-teal-600 shadow-xs'
                          : 'border-transparent hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${isSelected ? 'text-teal-950' : 'text-slate-900'}`}
                        >
                          {role.displayName}
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-teal-700 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{role.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {role.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {role.permissions.length} quyền được gán
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Audit & Compliance Card */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <ShieldAlert className="h-4 w-4 text-teal-700" />
              Quy tắc kiểm soát bảo mật
            </div>
            <p className="leading-relaxed">
              Mọi thay đổi trên ma trận quyền sẽ được ghi lại vào nhật ký kiểm toán với mã hành động{' '}
              <code className="text-teal-800 font-mono text-[10px] bg-teal-50 px-1 py-0.5 rounded">
                PERMISSION_CHANGE
              </code>
              .
            </p>
          </div>
        </div>

        {/* Permissions Configuration Panel */}
        <div className="lg:col-span-8 space-y-6">
          {selectedRole ? (
            <Card>
              <CardHeader className="border-b border-slate-200 py-4 px-6 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      {selectedRole.displayName}
                    </CardTitle>
                    <Badge variant="primary" className="text-[10px] font-mono">
                      {selectedRole.name}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    {selectedRole.description}
                  </CardDescription>
                </div>

                <div className="text-xs font-semibold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 self-start sm:self-auto">
                  Đã kích hoạt: {currentPermissions.length}/{permissions.length} quyền
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-8">
                {isPermsLoading ? (
                  <div className="py-8 text-center text-slate-500 text-sm">
                    Đang tải danh mục quyền...
                  </div>
                ) : (
                  modulesOrder.map((mod) => {
                    const modPerms = permissions.filter((p) => p.module === mod.key);
                    if (modPerms.length === 0) return null;

                    return (
                      <div key={mod.key} className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            {mod.name}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            {modPerms.filter((p) => currentPermissions.includes(p.code)).length}/
                            {modPerms.length} quyền
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {modPerms.map((perm) => {
                            const isChecked = currentPermissions.includes(perm.code);
                            return (
                              <label
                                key={perm.code}
                                className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                                  isChecked
                                    ? 'bg-teal-50/50 border-teal-400 shadow-xs'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(perm.code)}
                                  className="mt-0.5 rounded text-teal-700 focus:ring-teal-500 h-4 w-4 cursor-pointer"
                                />
                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-xs text-slate-900 leading-snug">
                                      {perm.name}
                                    </span>
                                    {perm.isSensitive && (
                                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                        Nhạy cảm
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 leading-relaxed">
                                    {perm.description}
                                  </p>
                                  <p className="text-[10px] font-mono text-slate-400 pt-0.5">
                                    {perm.code}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Modal: Xác nhận lưu quyền */}
      <Dialog
        isOpen={showConfirmSave}
        onClose={() => setShowConfirmSave(false)}
        title="Xác nhận lưu thay đổi quyền hạn"
        confirmLabel="Lưu & Áp dụng"
        confirmVariant="primary"
        isLoading={saveMutation.isPending}
        onConfirm={() => saveMutation.mutate()}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Bạn có chắc chắn muốn cập nhật ma trận quyền cho vai trò{' '}
            <strong className="text-slate-900">{selectedRole?.displayName}</strong>?
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 space-y-1">
            <div className="font-semibold flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Lưu ý hiệu lực phân quyền:
            </div>
            <p>
              Các nhân sự thuộc vai trò này sẽ được áp dụng quyền hạn mới ngay sau khi lưu. Hành
              động này sẽ được lưu vết trong bảng kiểm toán hệ thống.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
