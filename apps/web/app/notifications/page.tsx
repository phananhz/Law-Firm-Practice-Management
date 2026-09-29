'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle2, Clock3, FileText, ShieldAlert } from 'lucide-react';
import { ModulePage } from '@/components/operations/ModulePage';
import { platformApi } from '@/lib/api/platform';

const toneMap = {
  INFO: { icon: CheckCircle2, classes: 'bg-blue-50 text-blue-600' },
  SUCCESS: { icon: FileText, classes: 'bg-emerald-50 text-emerald-600' },
  WARNING: { icon: Clock3, classes: 'bg-amber-50 text-amber-600' },
  SECURITY: { icon: ShieldAlert, classes: 'bg-rose-50 text-rose-600' },
} as const;

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => platformApi.getNotifications(),
  });
  const readMutation = useMutation({
    mutationFn: (id: string) => platformApi.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const readAllMutation = useMutation({
    mutationFn: platformApi.markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((item) => !item.readAt).length;

  return (
    <ModulePage
      icon={Bell}
      eyebrow="Trung tâm thông tin"
      title="Thông báo"
      description="Tập trung các cập nhật liên quan đến hồ sơ, nhiệm vụ, thời hạn và quyền truy cập."
    >
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_300px]">
        <section className="lpms-card">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Thông báo gần đây</h3>
              <p className="mt-1 text-[11px] text-slate-400">{unreadCount} thông báo chưa đọc</p>
            </div>
            <button
              className="text-xs font-bold text-blue-600 hover:underline disabled:opacity-50"
              disabled={!unreadCount || readAllMutation.isPending}
              onClick={() => readAllMutation.mutate()}
            >
              Đánh dấu tất cả đã đọc
            </button>
          </div>
          {notificationsQuery.isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Đang tải thông báo...</div>
          ) : notificationsQuery.isError ? (
            <div className="p-8 text-center text-xs text-rose-600">Không thể tải thông báo.</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">Bạn đã xem hết thông báo.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => {
                const tone = toneMap[notification.tone];
                const Icon = tone.icon;
                return (
                  <button
                    key={notification.id}
                    className={`flex w-full gap-3 p-5 text-left transition hover:bg-slate-50 ${notification.readAt ? 'opacity-65' : ''}`}
                    onClick={() => !notification.readAt && readMutation.mutate(notification.id)}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone.classes}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-slate-800">
                        {notification.title}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                        {notification.message}
                      </span>
                      <span className="mt-2 block text-[10px] text-slate-400">
                        {new Date(notification.createdAt).toLocaleString('vi-VN')}
                        {notification.actorName ? ` · ${notification.actorName}` : ''}
                      </span>
                    </span>
                    {!notification.readAt && (
                      <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
        <section className="lpms-card p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Bell className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cài đặt thông báo</h3>
              <p className="mt-1 text-[11px] text-slate-400">Tùy chọn nhận thông tin</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {[
              'Nhiệm vụ được giao',
              'Thời hạn sắp tới',
              'Tài liệu mới',
              'Thay đổi quyền truy cập',
            ].map((label, index) => (
              <label
                key={label}
                className="flex items-center justify-between gap-3 text-xs text-slate-600"
              >
                <span>{label}</span>
                <input
                  type="checkbox"
                  defaultChecked={index !== 3}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            ))}
          </div>
        </section>
      </div>
    </ModulePage>
  );
}
