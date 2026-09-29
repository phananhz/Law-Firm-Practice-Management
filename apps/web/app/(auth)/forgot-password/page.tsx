'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, Send, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { authApi } from '@/lib/api/auth';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không đúng định dạng'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setServerError(null);
    try {
      await authApi.forgotPassword(data);
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Không thể xử lý yêu cầu lúc này. Vui lòng thử lại sau.';
      setServerError(msg);
    }
  };

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-slate-900">Quên mật khẩu</CardTitle>
        <CardDescription>
          Nhập địa chỉ email tài khoản LPMS của bạn để nhận liên kết khôi phục mật khẩu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {serverError && (
          <Alert variant="error" title="Lỗi xử lý">
            {serverError}
          </Alert>
        )}

        {isSubmitted ? (
          <div className="space-y-4 py-2 text-center">
            <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-slate-900">Đã gửi hướng dẫn khôi phục</h3>
              {/* Thông báo bảo vệ chống user enumeration (AUTH-013) */}
              <p className="text-xs text-slate-600 leading-relaxed text-left bg-slate-50 p-3 rounded border border-slate-200">
                Nếu địa chỉ <strong>{submittedEmail}</strong> tồn tại trong cơ sở dữ liệu hệ thống,
                chúng tôi đã gửi email chứa đường dẫn đặt lại mật khẩu có hiệu lực trong vòng 15
                phút.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/reset-password?token=mock-demo-token-12345"
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
              >
                (Môi trường phát triển: mở trang Đặt lại mật khẩu)
              </Link>
              <Link
                href="/login"
                className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center justify-center gap-1 hover:underline mt-2"
              >
                <ArrowLeft className="h-3 w-3" />
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email đăng ký tài khoản"
              type="email"
              placeholder="ten.nguoidung@congtyluat.vn"
              required
              autoFocus
              leadingIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              helperText="Hệ thống sẽ gửi mã token xác nhận dùng một lần đến hòm thư này."
              {...register('email')}
            />

            <Button type="submit" className="w-full mt-2" size="lg" isLoading={isSubmitting}>
              <Send className="h-4 w-4 mr-2" />
              Gửi liên kết khôi phục
            </Button>

            <div className="pt-3 border-t border-slate-100 text-center">
              <Link
                href="/login"
                className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center justify-center gap-1 hover:underline"
              >
                <ArrowLeft className="h-3 w-3" />
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
        )}

        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-50/50 p-2 rounded">
          <ShieldCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>
            Chính sách bảo mật: Phản hồi tuân thủ tiêu chuẩn chống quét dò tài khoản (OWASP ASVS).
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
