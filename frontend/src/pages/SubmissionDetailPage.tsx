import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AuthedImage } from '../components/AuthedImage';
import { api, apiErrorMessage } from '../lib/api';
import { categoryLabel, ENFORCEMENT_LABELS } from '../lib/constants';
import type { Appeal, Submission, Verdict } from '../lib/types';
import { Alert, Button, Card, OutcomeBadge, Spinner, StatusBadge, Textarea } from '../components/ui';

interface DetailResponse {
  submission: Submission;
  verdicts: Verdict[];
  appeal: Appeal | null;
}

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [justification, setJustification] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: async () => (await api.get<DetailResponse>(`/submissions/${id}`)).data,
  });

  const appealMutation = useMutation({
    mutationFn: async () => api.post('/appeals', { submissionId: id, justification }),
    onSuccess: () => {
      setJustification('');
      setError('');
      qc.invalidateQueries({ queryKey: ['submission', id] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Could not file appeal')),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner className="h-6 w-6 text-slate-400" /></div>;
  if (!data) return <Card><p className="text-sm text-slate-500">Submission not found.</p></Card>;

  const { submission, verdicts, appeal } = data;
  const canAppeal = submission.outcome !== 'approved' && !appeal;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/history" className="text-sm text-slate-500 hover:underline">← Back to history</Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Submission</h1>
          <p className="text-sm text-slate-500">
            {new Date(submission.createdAt).toLocaleString()} · policy v{submission.policyVersion}
          </p>
        </div>
        <OutcomeBadge outcome={submission.outcome} />
      </div>

      {verdicts.map((v) => (
        <Card key={v.id}>
          <div className="flex flex-col gap-4 sm:flex-row">
            <AuthedImage
              src={`/submissions/${submission.id}/verdicts/${v.id}/image`}
              alt={v.filename}
              className="h-40 w-40 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="truncate text-sm font-medium">{v.filename}</span>
                <OutcomeBadge outcome={v.effectiveOutcome} />
              </div>
              {v.overrideOutcome && (
                <p className="mt-1 text-xs text-green-700">
                  Overridden to Approved on appeal (originally {v.outcome}).
                </p>
              )}
              <table className="mt-3 w-full text-xs">
                <thead className="text-left text-slate-400">
                  <tr><th className="py-1">Category</th><th>Result</th><th>Confidence</th><th>Threshold</th><th>Enforcement</th></tr>
                </thead>
                <tbody>
                  {v.categoryResults.map((c) => (
                    <tr key={c.category} className="border-t border-slate-100">
                      <td className="py-1.5 font-medium text-slate-700">{categoryLabel(c.category)}</td>
                      <td>
                        <span className={c.classification === 'violation' ? 'font-semibold text-red-600' : 'text-slate-500'}>
                          {c.classification}
                        </span>
                      </td>
                      <td className="text-slate-600">{c.confidence}%</td>
                      <td className="text-slate-400">{c.threshold}%</td>
                      <td className="text-slate-400">{ENFORCEMENT_LABELS[c.enforcement]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      ))}

      <Card>
        <h2 className="text-lg font-semibold">Appeal</h2>
        {appeal ? (
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">Status: <StatusBadge status={appeal.status} /></div>
            <p className="text-slate-600"><span className="font-medium">Your justification:</span> {appeal.justification}</p>
            {appeal.adminResponse && (
              <p className="text-slate-600"><span className="font-medium">Admin response:</span> {appeal.adminResponse}</p>
            )}
          </div>
        ) : canAppeal ? (
          <form
            onSubmit={(e) => { e.preventDefault(); appealMutation.mutate(); }}
            className="mt-3 space-y-3"
          >
            <p className="text-sm text-slate-500">Explain why you believe this verdict is incorrect (min. 10 characters).</p>
            {error && <Alert>{error}</Alert>}
            <Textarea rows={3} value={justification} onChange={(e) => setJustification(e.target.value)} required minLength={10} />
            <Button type="submit" loading={appealMutation.isPending} disabled={justification.trim().length < 10}>
              Submit appeal
            </Button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Approved submissions cannot be appealed.</p>
        )}
      </Card>
    </div>
  );
}
