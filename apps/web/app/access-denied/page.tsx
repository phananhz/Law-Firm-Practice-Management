import Link from 'next/link';
import { ArrowLeft, LockKeyhole } from 'lucide-react';

export default function AccessDeniedPage() {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-xl items-center justify-center">
      <div className="lpms-card w-full p-8 text-center sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <LockKeyhole className="h-7 w-7" />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
          Quyền truy cập
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Bạn chưa được cấp quyền xem trang này
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          Không gian làm việc và dữ liệu được lọc theo actor, role và thành viên hồ sơ. Nếu đây là
          một nhầm lẫn, hãy liên hệ quản trị hệ thống hoặc giám đốc.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" /> Về dashboard
        </Link>
      </div>
    </div>
  );
}
