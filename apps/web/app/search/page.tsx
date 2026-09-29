'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Search } from 'lucide-react';
import { ModulePage } from '@/components/operations/ModulePage';
import { platformApi } from '@/lib/api/platform';

export default function SearchPage() {
  const params = useSearchParams();
  const query = params.get('q') ?? '';
  const resultQuery = useQuery({
    queryKey: ['search', query],
    queryFn: () => platformApi.search(query),
    enabled: query.trim().length > 0,
  });
  const results = resultQuery.data?.results ?? [];

  return (
    <ModulePage
      icon={Search}
      eyebrow="Tra cứu workspace"
      title="Kết quả tìm kiếm"
      description={`Kết quả toàn workspace cho “${query}”.`}
    >
      <div className="lpms-card">
        {resultQuery.isLoading ? (
          <div className="p-10 text-center text-xs text-slate-400">Đang tìm kiếm...</div>
        ) : resultQuery.isError ? (
          <div className="p-10 text-center text-xs text-rose-600">
            Không thể thực hiện tìm kiếm.
          </div>
        ) : results.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">Không có kết quả phù hợp.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {results.map((result) => (
              <Link
                key={`${result.type}-${result.id}`}
                href={result.href}
                className="flex items-center gap-4 p-5 transition hover:bg-slate-50"
              >
                <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                  {result.type}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-800">{result.title}</span>
                  <span className="mt-1 block text-xs text-slate-400">{result.subtitle}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </ModulePage>
  );
}
