'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download, TrendingUp } from 'lucide-react';
import { ModulePage } from '@/components/operations/ModulePage';
import { platformApi } from '@/lib/api/platform';

export default function ReportsPage() {
  const reportQuery = useQuery({
    queryKey: ['reports', 'overview'],
    queryFn: () => platformApi.getReportOverview(),
  });
  const report = reportQuery.data;
  const maxStatus = Math.max(...(report?.taskStatus.map((item) => item.count) ?? [1]));

  return (
    <ModulePage
      icon={BarChart3}
      eyebrow="Điều hành & phân tích"
      title="Báo cáo vận hành"
      description="Theo dõi khối lượng công việc, tiến độ hồ sơ và các chỉ số hoạt động của văn phòng."
    >
      {reportQuery.isLoading ? (
        <div className="lpms-card p-10 text-center text-xs text-slate-400">
          Đang tổng hợp báo cáo...
        </div>
      ) : reportQuery.isError || !report ? (
        <div className="lpms-card p-10 text-center text-xs text-rose-600">
          Không thể tải báo cáo.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {Object.entries(report.totals).map(([key, value]) => (
              <div key={key} className="lpms-card p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {key}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_1fr]">
            <section className="lpms-card p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Trạng thái nhiệm vụ</h3>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Dữ liệu theo kỳ báo cáo hiện tại
                  </p>
                </div>
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50">
                  <Download className="h-3.5 w-3.5" /> Xuất báo cáo
                </button>
              </div>
              <div className="mt-8 flex h-56 items-end gap-3 border-b border-l border-slate-200 px-3">
                {report.taskStatus.map((item) => (
                  <div
                    key={item.status}
                    className="group flex flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-[10px] font-bold text-blue-600">{item.count}</span>
                    <div
                      className="w-full rounded-t-md bg-blue-500/80 transition group-hover:bg-blue-600"
                      style={{ height: `${Math.max(8, (item.count / maxStatus) * 85)}%` }}
                    />
                    <span className="text-[9px] text-slate-400">{item.status}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="lpms-card p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Phân bổ công việc</h3>
                  <p className="mt-1 text-[11px] text-slate-400">Nhiệm vụ mở theo nhân sự</p>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="mt-6 space-y-4">
                {report.workload.map((item) => (
                  <div key={item.userId}>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="font-semibold text-slate-600">{item.userName}</span>
                      <span className="font-bold text-slate-800">
                        {item.openTasks} mở · {item.overdueTasks} quá hạn
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(100, item.openTasks * 8)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <p className="text-xs font-bold text-slate-700">Kỳ báo cáo</p>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {new Date(report.period.from).toLocaleDateString('vi-VN')} –{' '}
                  {new Date(report.period.to).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </section>
          </div>
        </>
      )}
    </ModulePage>
  );
}
