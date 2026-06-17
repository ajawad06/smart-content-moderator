import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiErrorMessage } from '../lib/api';
import { categoryLabel } from '../lib/constants';
import type { Submission, Verdict } from '../lib/types';
import { Alert, Button, Card, OutcomeBadge } from '../components/ui';

interface SubmitResponse {
  submission: Submission;
  verdicts: Verdict[];
}

export default function SubmitPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async (selected: File[]) => {
      const form = new FormData();
      selected.forEach((f) => form.append('images', f));
      const res = await api.post<SubmitResponse>('/submissions', form);
      return res.data;
    },
    onError: (err) => setError(apiErrorMessage(err, 'Submission failed')),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (files.length > 0) mutation.mutate(files);
  }

  const result = mutation.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Submit images</h1>
        <p className="mt-1 text-sm text-slate-500">
          Each image is screened independently against the active moderation policy.
        </p>
      </div>

      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <input
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            multiple
            onChange={(e) => {
              setFiles(Array.from(e.target.files ?? []));
              mutation.reset();
            }}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
          />
          {files.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {files.map((f, i) => (
                <div key={i} className="w-24 text-center">
                  <img src={URL.createObjectURL(f)} alt={f.name} className="h-24 w-24 rounded-lg object-cover ring-1 ring-slate-200" />
                  <p className="mt-1 truncate text-xs text-slate-500">{f.name}</p>
                </div>
              ))}
            </div>
          )}
          <Button type="submit" loading={mutation.isPending} disabled={files.length === 0}>
            Screen {files.length > 0 ? `${files.length} image${files.length > 1 ? 's' : ''}` : 'images'}
          </Button>
        </form>
      </Card>

      {result && (
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Result</h2>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>Overall:</span>
              <OutcomeBadge outcome={result.submission.outcome} />
              <Link to={`/submissions/${result.submission.id}`} className="font-medium text-slate-900 hover:underline">
                View details →
              </Link>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {result.verdicts.map((v) => (
              <div key={v.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium">{v.filename}</span>
                  <OutcomeBadge outcome={v.effectiveOutcome} />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {v.categoryResults
                    .filter((c) => c.classification === 'violation')
                    .map((c) => (
                      <div key={c.category} className="rounded bg-red-50 px-3 py-2 text-xs text-red-700">
                        <span className="font-semibold">{categoryLabel(c.category)}</span> — {c.confidence}% · {c.reasoning}
                      </div>
                    ))}
                  {v.categoryResults.every((c) => c.classification !== 'violation') && (
                    <p className="text-xs text-slate-500">No category exceeded its threshold.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
