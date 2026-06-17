import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { CATEGORY_KEYS, categoryLabel, OUTCOME_LABELS } from '../lib/constants';
import type { Pagination, Submission } from '../lib/types';
import { Button, Card, OutcomeBadge, PageHeader, Select, Spinner, StatusBadge } from '../components/ui';

interface Filters {
  outcome: string;
  category: string;
  from: string;
  to: string;
}

const EMPTY: Filters = { outcome: '', category: '', from: '', to: '' };

export default function HistoryPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['submissions', filters, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (filters.outcome) params.outcome = filters.outcome;
      if (filters.category) params.category = filters.category;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const res = await api.get<{ submissions: Submission[]; pagination: Pagination }>('/submissions', { params });
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  function update<K extends keyof Filters>(key: K, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  const submissions = data?.submissions ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 10));

  return (
    <div className="space-y-6">
      <PageHeader title="Submission history" subtitle="Every image you've submitted and its verdict." />

      <Card className="!p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select value={filters.outcome} onChange={(e) => update('outcome', e.target.value)}>
            <option value="">All outcomes</option>
            {Object.entries(OUTCOME_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </Select>
          <Select value={filters.category} onChange={(e) => update('category', e.target.value)}>
            <option value="">All categories</option>
            {CATEGORY_KEYS.map((k) => (
              <option key={k} value={k}>{categoryLabel(k)}</option>
            ))}
          </Select>
          <input type="date" value={filters.from} onChange={(e) => update('from', e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-1 focus:ring-sky-300" />
          <input type="date" value={filters.to} onChange={(e) => update('to', e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-1 focus:ring-sky-300" />
          <Button variant="secondary" onClick={() => { setFilters(EMPTY); setPage(1); }}>Clear</Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner className="h-6 w-6 text-slate-400" /></div>
      ) : submissions.length === 0 ? (
        <Card><p className="text-sm text-slate-500">No submissions match these filters.</p></Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Images</th>
                <th className="px-4 py-3">Violations</th>
                <th className="px-4 py-3">Appeal</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3"><OutcomeBadge outcome={s.outcome} /></td>
                  <td className="px-4 py-3 text-slate-600">{s.imageCount}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.violatedCategories.length === 0 ? '—' : s.violatedCategories.map(categoryLabel).join(', ')}
                  </td>
                  <td className="px-4 py-3">{s.appeal ? <StatusBadge status={s.appeal.status} /> : <span className="text-slate-400">—</span>}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/submissions/${s.id}`} className="font-medium text-slate-900 hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}{isFetching && ' …'}</span>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
