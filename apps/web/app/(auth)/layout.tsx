import React from 'react';
import { ShieldCheck, Scale, Lock, FileCheck2 } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Brand Side Panel (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-teal-700 flex items-center justify-center text-white shadow-md">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white">LPMS</span>
              <span className="block text-xs uppercase tracking-widest text-teal-400 font-semibold">
                Legal Practice Management
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-800 text-teal-300 text-xs font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
            Hạ tầng bảo mật cấp doanh nghiệp
          </div>
          <h1 className="text-3xl lg:text-4xl font-serif font-bold tracking-tight text-white leading-tight">
            Nền tảng quản trị nghiệp vụ tập trung cho tổ chức hành nghề luật.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Kiểm soát chặt chẽ toàn bộ vòng đời hồ sơ vụ việc, thẩm định xung đột lợi ích, tài liệu
            mật và phân quyền đa tầng chống rò rỉ thông tin thân chủ.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div className="flex items-start gap-2.5">
              <Lock className="h-4 w-4 text-teal-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Xác thực 2 lớp (MFA)</h4>
                <p className="text-[11px] text-slate-400">TOTP Authenticator & mã dự phòng</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <FileCheck2 className="h-4 w-4 text-teal-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Kiểm toán bất biến</h4>
                <p className="text-[11px] text-slate-400">Ghi vết 100% phiên làm việc</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between">
          <p>© 2026 LPMS Enterprise Law Firm System.</p>
          <p>OWASP ASVS Verified</p>
        </div>
      </div>

      {/* Main Auth Form Container */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        {/* Mobile Logo Header */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-lg bg-teal-700 flex items-center justify-center text-white shadow-md">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-slate-900">LPMS</span>
            <span className="block text-xs uppercase tracking-widest text-teal-700 font-semibold">
              Legal Practice Management
            </span>
          </div>
        </div>

        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
