import { useQuery } from '@tanstack/react-query';
import { api, type HealthResponse } from './lib/api';

function StatusDot({ ok }: { ok: boolean }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />;
}

export default function App() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: async () => (await api.get<HealthResponse>('/health')).data,
    refetchInterval: 10_000,
  });

  const apiOk = !isError && !!data;
  const dbOk = data?.db === 'connected';

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-8">
        <h1 className="text-2xl font-semibold tracking-tight">AI Content Moderation Platform</h1>
        <p className="mt-1 text-sm text-slate-500">Phase 1 scaffold — backend &amp; frontend wired up.</p>

        <div className="mt-6 space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <span className="font-medium">API</span>
            <span className="flex items-center gap-2">
              <StatusDot ok={apiOk} />
              {isLoading ? 'checking…' : apiOk ? 'reachable' : 'unreachable'}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <span className="font-medium">Database</span>
            <span className="flex items-center gap-2">
              <StatusDot ok={dbOk} />
              {data?.db ?? '—'}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <span className="font-medium">Moderation provider</span>
            <span className="font-mono text-slate-600">{data?.provider ?? '—'}</span>
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Auth, submissions, appeals, policies, and analytics arrive in later phases.
        </p>
      </div>
    </div>
  );
}
