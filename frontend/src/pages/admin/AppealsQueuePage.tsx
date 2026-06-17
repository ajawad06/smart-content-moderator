import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiErrorMessage } from '../../lib/api';
import { APPEAL_STATUS_LABELS } from '../../lib/constants';
import type { Appeal, Pagination, Submission } from '../../lib/types';
import { Alert, Button, Card, OutcomeBadge, Select, Spinner, StatusBadge, Textarea } from '../../components/ui';

export default function AppealsQueuePage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['appeal-queue', status],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit: 50 };
      if (status) params.status = status;
      return (await api.get<{ appeals: Appeal[]; pagination: Pagination }>('/appeals', { params })).data;
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ id, decision, response }: { id: string; decision: 'accept' | 'reject'; response: string }) =>
      api.patch(`/appeals/${id}`, { decision, response: response || undefined }),
    onSuccess: () => {
      setError('');
      qc.invalidateQueries({ queryKey: ['appeal-queue'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Could not resolve appeal')),
  });

  const appeals = data?.appeals ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Appeals queue</h1>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-48">
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </Select>
      </div>

      {error && <Alert>{error}</Alert>}

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner className="h-6 w-6 text-slate-400" /></div>
      ) : appeals.length === 0 ? (
        <Card><p className="text-sm text-slate-500">No {status || ''} appeals.</p></Card>
      ) : (
        <div className="space-y-3">
          {appeals.map((a) => (
            <AppealCard key={a.id} appeal={a} onResolve={(decision, response) => mutation.mutate({ id: a.id, decision, response })} pending={mutation.isPending} />
          ))}
        </div>
      )}
    </div>
  );
}

function AppealCard({
  appeal,
  onResolve,
  pending,
}: {
  appeal: Appeal;
  onResolve: (decision: 'accept' | 'reject', response: string) => void;
  pending: boolean;
}) {
  const [response, setResponse] = useState('');
  const submission = (typeof appeal.submission === 'object' ? appeal.submission : null) as Submission | null;
  const submissionId = submission?.id ?? (appeal.submission as string);
  const isPending = appeal.status === 'pending';

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusBadge status={appeal.status} />
            {submission && <OutcomeBadge outcome={submission.outcome} />}
            <span className="text-xs text-slate-400">{new Date(appeal.createdAt).toLocaleString()}</span>
          </div>
          <p className="mt-2 text-sm text-slate-600"><span className="font-medium">Justification:</span> {appeal.justification}</p>
          {appeal.adminResponse && (
            <p className="mt-1 text-sm text-slate-600"><span className="font-medium">Response:</span> {appeal.adminResponse}</p>
          )}
        </div>
        <Link to={`/submissions/${submissionId}`} className="shrink-0 text-sm font-medium text-slate-900 hover:underline">
          Submission →
        </Link>
      </div>

      {isPending && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <Textarea
            rows={2}
            placeholder="Optional response to the user…"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="primary" loading={pending} onClick={() => onResolve('accept', response)}>Accept (override to Approved)</Button>
            <Button variant="secondary" loading={pending} onClick={() => onResolve('reject', response)}>Reject</Button>
          </div>
        </div>
      )}
      {!isPending && (
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
          {APPEAL_STATUS_LABELS[appeal.status]}{appeal.resolvedAt ? ` on ${new Date(appeal.resolvedAt).toLocaleString()}` : ''}
        </p>
      )}
    </Card>
  );
}
