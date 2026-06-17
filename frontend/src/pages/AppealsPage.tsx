import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Appeal, Pagination } from '../lib/types';
import { Card, PageHeader, Spinner, StatusBadge } from '../components/ui';

export default function AppealsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-appeals'],
    queryFn: async () =>
      (await api.get<{ appeals: Appeal[]; pagination: Pagination }>('/appeals/mine', { params: { limit: 50 } })).data,
  });

  const appeals = data?.appeals ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="My appeals" subtitle="Track the status of verdicts you've disputed." />
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner className="h-6 w-6 text-slate-400" /></div>
      ) : appeals.length === 0 ? (
        <Card><p className="text-sm text-slate-500">You haven't filed any appeals yet.</p></Card>
      ) : (
        <div className="space-y-3">
          {appeals.map((a) => {
            const submissionId = typeof a.submission === 'string' ? a.submission : a.submission.id;
            return (
              <Card key={a.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={a.status} />
                      <span className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600"><span className="font-medium">Justification:</span> {a.justification}</p>
                    {a.adminResponse && (
                      <p className="mt-1 text-sm text-slate-600"><span className="font-medium">Admin response:</span> {a.adminResponse}</p>
                    )}
                  </div>
                  <Link to={`/submissions/${submissionId}`} className="shrink-0 text-sm font-medium text-slate-900 hover:underline">
                    Submission →
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
