'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Laptop,
  Smartphone,
  Tablet,
  Shield,
  LogOut,
  Trash2,
  Clock,
  MapPin,
  RefreshCw,
  UserCheck,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import type { ActiveSession } from '@lpms/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/toast';

export default function SessionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const { success, error: toastError } = useToast();

  const [sessionToRevoke, setSessionToRevoke] = useState<ActiveSession | null>(null);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Fetch active sessions using TanStack Query
  const {
    data: sessions = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<ActiveSession[]>({
    queryKey: ['auth', 'sessions'],
    queryFn: authApi.getSessions,
  });

  // Revoke single session mutation
  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => authApi.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });
      success('Đã thu hồi phiên đăng nhập thành công');
      setSessionToRevoke(null);
    },
    onError: (err: unknown) => {
      toastError(err instanceof Error ? err.message : 'Không thể thu hồi phiên');
    },
  });

  // Revoke all other sessions mutation
  const revokeAllMutation = useMutation({
    mutationFn: authApi.revokeAllOtherSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });
      success('Đã đăng xuất khỏi tất cả các thiết bị khác');
      setShowRevokeAllDialog(false);
    },
    onError: (err: unknown) => {
      toastError(err instanceof Error ? err.message : 'Không thể thu hồi các phiên');
    },
  });

  const handleLogoutCurrent = async () => {
    try {
      await logout();
      success('Đã đăng xuất thành công');
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-5 w-5 text-slate-500" />;
      case 'tablet':
        return <Tablet className="h-5 w-5 text-slate-500" />;
      default:
        return <Laptop className="h-5 w-5 text-teal-700" />;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Về trang chủ"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="h-5 w-px bg-slate-700 mx-1" />
            <span className="font-bold text-lg tracking-tight text-white">LPMS</span>
            <Badge
              variant="primary"
              className="hidden sm:inline-flex bg-teal-950 text-teal-300 border-teal-800"
            >
              An toàn & Bảo mật
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-300">
              <UserCheck className="h-4 w-4 text-teal-400" />
              <span>{user?.fullName || 'Luật sư Nguyễn Văn An'}</span>
              <span className="text-slate-500">•</span>
              <span className="text-teal-400 font-medium">{user?.roles?.[0] || 'PARTNER'}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
              onClick={() => setShowLogoutDialog(true)}
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Shield className="h-6 w-6 text-teal-700" />
              Quản lý phiên làm việc & Thiết bị (Sessions)
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Kiểm tra các phiên đăng nhập đang hoạt động trên các máy tính và thiết bị di động của
              bạn.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            {otherSessionsCount > 0 && (
              <Button variant="destructive" size="sm" onClick={() => setShowRevokeAllDialog(true)}>
                <LogOut className="h-4 w-4 mr-1.5" />
                Đăng xuất tất cả thiết bị khác ({otherSessionsCount})
              </Button>
            )}
          </div>
        </div>

        {/* Security Alert Notice */}
        <div className="bg-teal-50/70 border border-teal-200 p-4 rounded-lg flex items-start gap-3 text-xs text-teal-900">
          <Shield className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-teal-900">
              Chính sách bảo mật phiên làm việc (AUTH-006 - AUTH-009):
            </p>
            <p className="text-teal-800 leading-relaxed">
              Nếu bạn nghi ngờ có thiết bị lạ hoặc để quên tài khoản đăng nhập trên máy tính công
              cộng, hãy nhấn <strong>Thu hồi</strong> hoặc{' '}
              <strong>Đăng xuất tất cả thiết bị khác</strong> ngay lập tức. Phiên bị thu hồi sẽ mất
              quyền truy cập tức thì (Revocation).
            </p>
          </div>
        </div>

        {/* Sessions List */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-base font-semibold">
                Danh sách thiết bị kết nối ({sessions.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Cập nhật lần cuối: {new Date().toLocaleTimeString('vi-VN')}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                <div className="animate-spin h-6 w-6 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-2" />
                Đang tải dữ liệu phiên làm việc...
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Không tìm thấy phiên làm việc nào.
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    session.isCurrent ? 'bg-teal-50/30' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 shrink-0 mt-0.5">
                      {getDeviceIcon(session.deviceType)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-slate-900">{session.browser}</h4>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-medium text-slate-600">{session.os}</span>
                        {session.isCurrent && (
                          <Badge variant="success" className="text-[11px] font-semibold">
                            Thiết bị này (Hiện tại)
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          IP: {session.ipAddress}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          Hoạt động gần nhất: {formatDate(session.lastActiveAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate max-w-lg">
                        {session.userAgent}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {session.isCurrent ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowLogoutDialog(true)}
                        className="text-xs"
                      >
                        <LogOut className="h-3.5 w-3.5 mr-1" />
                        Đăng xuất thiết bị này
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 shadow-none hover:shadow-none"
                        onClick={() => setSessionToRevoke(session)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Thu hồi quyền
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modal: Confirm Revoke Single Session */}
      <Dialog
        isOpen={!!sessionToRevoke}
        onClose={() => setSessionToRevoke(null)}
        title="Thu hồi phiên đăng nhập?"
        confirmLabel="Thu hồi phiên"
        confirmVariant="destructive"
        isLoading={revokeMutation.isPending}
        onConfirm={() => {
          if (sessionToRevoke) {
            revokeMutation.mutate(sessionToRevoke.id);
          }
        }}
      >
        <p className="text-sm text-slate-600">
          Bạn có chắc chắn muốn ngắt kết nối thiết bị{' '}
          <strong className="text-slate-900">{sessionToRevoke?.browser}</strong> (
          {sessionToRevoke?.ipAddress})? Thiết bị này sẽ bị buộc đăng xuất ngay lập tức.
        </p>
      </Dialog>

      {/* Modal: Confirm Revoke All Other Sessions */}
      <Dialog
        isOpen={showRevokeAllDialog}
        onClose={() => setShowRevokeAllDialog(false)}
        title="Đăng xuất khỏi tất cả các thiết bị khác?"
        confirmLabel="Đăng xuất toàn bộ thiết bị khác"
        confirmVariant="destructive"
        isLoading={revokeAllMutation.isPending}
        onConfirm={() => revokeAllMutation.mutate()}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Hành động này sẽ thu hồi token và đăng xuất tài khoản của bạn khỏi tất cả{' '}
            <strong className="text-slate-900">{otherSessionsCount} thiết bị khác</strong>.
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Chỉ phiên đăng nhập trên trình duyệt hiện tại này được giữ nguyên.</span>
          </div>
        </div>
      </Dialog>

      {/* Modal: Confirm Logout Current Device */}
      <Dialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        title="Xác nhận đăng xuất"
        confirmLabel="Đăng xuất"
        confirmVariant="primary"
        onConfirm={handleLogoutCurrent}
      >
        <p className="text-sm text-slate-600">
          Bạn có muốn đăng xuất khỏi thiết bị này không? Bạn sẽ cần nhập lại email, mật khẩu và mã
          xác thực 2 lớp (nếu có) vào lần truy cập tới.
        </p>
      </Dialog>
    </div>
  );
}
