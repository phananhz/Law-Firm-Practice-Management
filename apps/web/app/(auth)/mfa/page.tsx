'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, ShieldCheck, ArrowLeft, Smartphone, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/toast';

const mfaTotpSchema = z.object({
  code: z
    .string()
    .min(6, 'Mã TOTP gồm 6 chữ số')
    .max(6, 'Mã TOTP gồm 6 chữ số')
    .regex(/^\d+$/, 'Mã TOTP chỉ bao gồm các chữ số'),
});

const mfaRecoverySchema = z.object({
  code: z.string().min(8, 'Mã dự phòng tối thiểu 8 ký tự').max(16, 'Mã dự phòng tối đa 16 ký tự'),
});

export default function MfaPage() {
  const router = useRouter();
  const { mfaPending, setUser } = useAuth();
  const { success, error: toastError } = useToast();
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const currentSchema = useRecoveryCode ? mfaRecoverySchema : mfaTotpSchema;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ code: string }>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      code: '',
    },
  });

  const toggleRecovery = () => {
    setUseRecoveryCode(!useRecoveryCode);
    setServerError(null);
    reset({ code: '' });
  };

  const onSubmit = async (data: { code: string }) => {
    setServerError(null);
    try {
      const sessionToken = mfaPending?.sessionToken || 'mock-mfa-session-token-xyz123';
      const res = await authApi.verifyMfa({
        mfaSessionToken: sessionToken,
        code: data.code,
        isRecoveryCode: useRecoveryCode,
      });

      setUser(res.user);
      success('Xác thực 2 lớp thành công! Đang chuyển hướng...');
      router.push('/');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Xác thực không thành công. Vui lòng thử lại.';
      setServerError(msg);
      toastError(msg);
    }
  };

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold uppercase tracking-wider mb-1">
          <ShieldCheck className="h-4 w-4" />
          Bảo mật cấp độ 2
        </div>
        <CardTitle className="text-2xl font-bold text-slate-900">
          {useRecoveryCode ? 'Nhập mã dự phòng' : 'Xác thực 2 bước (MFA)'}
        </CardTitle>
        <CardDescription>
          {useRecoveryCode
            ? 'Sử dụng một trong các mã khôi phục một lần đã được cấp khi thiết lập MFA.'
            : 'Mở ứng dụng Google Authenticator hoặc Microsoft Authenticator để lấy mã 6 chữ số.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {serverError && (
          <Alert variant="error" title="Lỗi xác thực">
            {serverError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={useRecoveryCode ? 'Mã dự phòng (Recovery Code)' : 'Mã xác thực 6 chữ số'}
            placeholder={useRecoveryCode ? 'ABC1-DEF2-3456' : '123456'}
            maxLength={useRecoveryCode ? 16 : 6}
            required
            autoFocus
            className={
              useRecoveryCode
                ? 'tracking-wider font-mono'
                : 'tracking-widest text-center text-lg font-mono font-bold'
            }
            leadingIcon={
              useRecoveryCode ? (
                <KeyRound className="h-4 w-4" />
              ) : (
                <Smartphone className="h-4 w-4" />
              )
            }
            error={errors.code?.message}
            {...register('code')}
          />

          <Button type="submit" className="w-full mt-2" size="lg" isLoading={isSubmitting}>
            <ShieldCheck className="h-4 w-4 mr-2" />
            Xác nhận truy cập
          </Button>
        </form>

        <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 text-xs text-center">
          <button
            type="button"
            onClick={toggleRecovery}
            className="text-teal-700 hover:text-teal-800 font-medium hover:underline inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {useRecoveryCode
              ? 'Chuyển sang nhập mã từ Authenticator App'
              : 'Không thể truy cập Authenticator? Sử dụng mã dự phòng'}
          </button>

          <Link
            href="/login"
            className="text-slate-500 hover:text-slate-700 inline-flex items-center justify-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" />
            Quay lại màn hình đăng nhập
          </Link>
        </div>

        {/* Hỗ trợ mã mẫu cho môi trường phát triển */}
        <div className="mt-2 bg-slate-50 p-2.5 rounded text-[11px] text-slate-500 text-center">
          Môi trường phát triển: nhập bất kỳ 6 số (ví dụ:{' '}
          <button
            type="button"
            onClick={() => setValue('code', '654321')}
            className="font-mono font-bold text-teal-700 underline cursor-pointer"
          >
            654321
          </button>
          ) để xác thực thành công.
        </div>
      </CardContent>
    </Card>
  );
}
