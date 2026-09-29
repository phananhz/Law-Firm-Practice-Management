import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ModulePage } from '@/components/operations/ModulePage';

const events = [
  {
    time: '08:30',
    title: 'Họp giao ban nghiệp vụ',
    detail: 'Phòng họp A · Ban điều hành',
    color: 'blue',
  },
  {
    time: '10:00',
    title: 'Trao đổi hồ sơ MAT-2026-0042',
    detail: 'Nguyễn Văn An · Trần Thị Bích',
    color: 'violet',
  },
  {
    time: '14:00',
    title: 'Hạn phản hồi tài liệu khách hàng',
    detail: 'Hồ sơ Solar Việt Nam',
    color: 'amber',
  },
  {
    time: '16:30',
    title: 'Rà soát danh sách thời hạn',
    detail: 'Phòng Hồ sơ Tố tụng',
    color: 'emerald',
  },
];

export default function CalendarPage() {
  return (
    <ModulePage
      icon={CalendarDays}
      eyebrow="Điều phối công việc"
      title="Lịch làm việc"
      description="Theo dõi sự kiện, nhiệm vụ và thời hạn trên cùng một lịch làm việc của văn phòng."
      action={{ label: 'Tạo sự kiện', href: '/tasks/new' }}
    >
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
        <section className="lpms-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h3 className="text-sm font-bold text-slate-900">Tháng 9, 2026</h3>
              <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-[10px] font-bold">
              <button className="rounded-md bg-white px-3 py-1.5 text-blue-600 shadow-sm">
                Tháng
              </button>
              <button className="px-3 py-1.5 text-slate-500">Tuần</button>
              <button className="px-3 py-1.5 text-slate-500">Agenda</button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-slate-100 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
              <span key={day} className="py-3">
                {day}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 text-xs">
            {Array.from({ length: 35 }, (_, index) => {
              const day = index - 1;
              const current = day > 0 && day <= 30;
              const selected = day === 29;
              return (
                <div
                  key={index}
                  className={`min-h-[86px] border-b border-r border-slate-100 p-2 ${!current ? 'bg-slate-50/60 text-slate-300' : 'text-slate-600'}`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${selected ? 'bg-blue-600 text-white' : ''}`}
                  >
                    {current ? day : day <= 0 ? 31 + day : day - 30}
                  </span>
                  {current && [3, 12, 18, 29].includes(day) && (
                    <span className="mt-2 block truncate rounded-md bg-blue-50 px-1.5 py-1 text-[9px] font-bold text-blue-700">
                      {day === 29 ? 'Giao ban' : 'Lịch hồ sơ'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
        <section className="lpms-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Agenda hôm nay</h3>
              <p className="mt-1 text-[11px] text-slate-400">29 tháng 9, 2026</p>
            </div>
            <CalendarDays className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-1">
            {events.map((event) => (
              <div
                key={event.time}
                className="flex gap-3 border-b border-slate-100 py-3 last:border-0"
              >
                <span className="w-11 shrink-0 text-[11px] font-bold text-slate-400">
                  {event.time}
                </span>
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full bg-${event.color}-500`} />
                <span>
                  <span className="block text-xs font-bold text-slate-800">{event.title}</span>
                  <span className="mt-1 block text-[11px] text-slate-400">{event.detail}</span>
                </span>
              </div>
            ))}
          </div>
          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 py-2.5 text-xs font-bold text-slate-500 hover:border-blue-300 hover:text-blue-600">
            <Plus className="h-3.5 w-3.5" /> Thêm lịch hẹn
          </button>
        </section>
      </div>
    </ModulePage>
  );
}
