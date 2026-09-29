'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, LogIn, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/toast';

const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không đúng định dạng'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setMfaPending } = useAuth();
  const { success, error: toastError } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'director@lpms.vn',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const res = await authApi.login({ email: data.email, password: data.password });

      if (res.requiresMfa) {
        setMfaPending({
          sessionToken: res.mfaSessionToken || 'mfa-temp-token',
          email: data.email,
        });
        success('Yêu cầu xác thực 2 bước (MFA). Đang chuyển hướng...');
        router.push('/mfa');
        return;
      }

      if (res.user) {
        setUser(res.user);
        success(`Chào mừng trở lại, ${res.user.fullName}!`);
        router.push('/');
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Đăng nhập không thành công. Vui lòng kiểm tra lại.';
      setServerError(msg);
      toastError(msg);
    }
  };

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-slate-900">Đăng nhập</CardTitle>
        <CardDescription>
          Nhập thông tin xác thực được cấp để truy cập vào hệ thống LPMS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {serverError && (
          <Alert variant="error" title="Đăng nhập không thành công">
            {serverError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email công vụ"
            type="email"
            placeholder="luatsu@congtyluat.vn"
            required
            leadingIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">
                Mật khẩu <span className="text-rose-500">*</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••••••"
              required
              leadingIcon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <Button type="submit" className="w-full mt-2" size="lg" isLoading={isSubmitting}>
            <LogIn className="h-4 w-4 mr-2" />
            Đăng nhập
          </Button>
        </form>

        {/* Chỉ hiển thị khi chạy local mock; production không dùng các tài khoản này. */}
        <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50/70 p-3 rounded-md text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
            <ShieldAlert className="h-3.5 w-3.5 text-teal-600" />
            Tài khoản demo theo không gian làm việc:
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Mật khẩu dùng chung: <code className="font-semibold">DemoPassword!2026</code>
          </p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              { email: 'admin@lpms.vn', label: 'Admin', tone: 'slate' },
              { email: 'director@lpms.vn', label: 'Giám đốc', tone: 'blue' },
              { email: 'lawyer@lpms.vn', label: 'Nhân viên', tone: 'emerald' },
            ].map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setValue('email', account.email);
                  setValue('password', 'DemoPassword!2026');
                }}
                className={`rounded-lg border px-2.5 py-2 text-left font-semibold transition ${
                  account.tone === 'blue'
                    ? 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
                    : account.tone === 'emerald'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="block text-xs">{account.label}</span>
                <span className="mt-0.5 block truncate text-[10px] font-normal opacity-75">
                  {account.email}
                </span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
