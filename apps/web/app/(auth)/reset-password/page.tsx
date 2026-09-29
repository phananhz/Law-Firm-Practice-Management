'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Check, X, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { authApi } from '@/lib/api/auth';
import { useToast } from '@/components/ui/toast';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Mật khẩu phải có tối thiểu 8 ký tự')
      .regex(/[A-Z]/, 'Phải có ít nhất 1 chữ cái in hoa')
      .regex(/[a-z]/, 'Phải có ít nhất 1 chữ cái in thường')
      .regex(/[0-9]/, 'Phải có ít nhất 1 chữ số')
      .regex(/[^A-Za-z0-9]/, 'Phải có ít nhất 1 ký tự đặc biệt'),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu xác nhận'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không trùng khớp',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { success, error: toastError } = useToast();

  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const watchedPassword = watch('password', '');

  // Password rules validation for live checklist
  const rules = [
    { label: 'Tối thiểu 8 ký tự', passed: watchedPassword.length >= 8 },
    { label: 'Có chữ cái in hoa (A-Z)', passed: /[A-Z]/.test(watchedPassword) },
    { label: 'Có chữ cái in thường (a-z)', passed: /[a-z]/.test(watchedPassword) },
    { label: 'Có chữ số (0-9)', passed: /[0-9]/.test(watchedPassword) },
    { label: 'Có ký tự đặc biệt (!@#$%^&*)', passed: /[^A-Za-z0-9]/.test(watchedPassword) },
  ];

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setServerError('Mã token xác nhận không tồn tại hoặc đã hết hạn.');
      return;
    }

    setServerError(null);
    try {
      await authApi.resetPassword({
        token,
        newPassword: data.password,
      });
      setIsSuccess(true);
      success('Đã cập nhật mật khẩu mới thành công!');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Không thể đặt lại mật khẩu. Liên kết có thể đã hết hạn.';
      setServerError(msg);
      toastError(msg);
    }
  };

  if (!token) {
    return (
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-bold text-slate-900">Liên kết không hợp lệ</CardTitle>
          <CardDescription>
            Đường dẫn đặt lại mật khẩu của bạn bị thiếu mã xác thực hợp lệ hoặc đã hết thời gian
            hiệu lực.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="warning" title="Thiếu mã token">
            Vui lòng yêu cầu lại liên kết đặt lại mật khẩu mới từ trang Quên mật khẩu.
          </Alert>
          <div className="flex flex-col gap-2 pt-2">
            <Link href="/forgot-password">
              <Button variant="primary" className="w-full">
                Yêu cầu liên kết mới
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Quay lại đăng nhập
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
            <Check className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Mật khẩu đã được đổi</CardTitle>
          <CardDescription>
            Mật khẩu mới của bạn đã được lưu an toàn. Tất cả các phiên làm việc cũ đã được thu hồi
            vì lý do an ninh.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button type="button" className="w-full" size="lg" onClick={() => router.push('/login')}>
            Đăng nhập ngay
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-slate-900">Đặt lại mật khẩu</CardTitle>
        <CardDescription>
          Thiết lập mật khẩu mới đáp ứng tiêu chuẩn an toàn thông tin của công ty luật.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {serverError && (
          <Alert variant="error" title="Lỗi cập nhật mật khẩu">
            {serverError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Mật khẩu mới"
            type="password"
            placeholder="••••••••••••"
            required
            leadingIcon={<Lock className="h-4 w-4" />}
            error={errors.password?.message}
            {...register('password')}
          />

          {/* Password Strength Checklist */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-md space-y-1.5 text-xs">
            <p className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
              Yêu cầu độ phức tạp mật khẩu:
            </p>
            {rules.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                {r.passed ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <X className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                )}
                <span className={r.passed ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  {r.label}
                </span>
              </div>
            ))}
          </div>

          <Input
            label="Xác nhận mật khẩu mới"
            type="password"
            placeholder="••••••••••••"
            required
            leadingIcon={<Lock className="h-4 w-4" />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button type="submit" className="w-full mt-2" size="lg" isLoading={isSubmitting}>
            Lưu mật khẩu mới
          </Button>
        </form>

        <div className="pt-2 text-center">
          <Link
            href="/login"
            className="text-xs text-slate-500 hover:text-slate-800 hover:underline"
          >
            Hủy và quay lại đăng nhập
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 text-sm">Đang tải thông tin xác thực...</div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
