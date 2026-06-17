import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { categoryLabel, OUTCOME_LABELS } from '../../lib/constants';
import type { Analytics } from '../../lib/types';
import { Card, PageHeader, Spinner } from '../../components/ui';

const OUTCOME_BAR: Record<string, string> = {
  approved: 'bg-green-500',
  flagged: 'bg-amber-500',
  blocked: 'bg-red-500',
};

function Bar({ label, value, max, color = 'bg-slate-800' }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-44 shrink-0 truncate text-sm text-slate-600">{label}</span>
      <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-medium text-slate-700">{value}</span>
    </div>
  );
}

function Stat({ label, value, icon, accent }: { label: string; value: number; icon: string; accent: string }) {
  return (
    <Card className="!p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${accent}`}>{icon}</span>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
          <p className="text-2xl font-semibold leading-tight text-slate-900">{value.toLocaleString()}</p>
        </div>
      </div>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => (await api.get<Analytics>('/analytics')).data,
  });

  if (isLoading || !data) {
    return <div className="flex justify-center py-12"><Spinner className="h-6 w-6 text-slate-400" /></div>;
  }

  const outcomeMax = Math.max(1, ...Object.values(data.verdictsByOutcome));
  const catMax = Math.max(1, ...Object.values(data.verdictsByCategory));
  const timeMax = Math.max(1, ...data.submissionsOverTime.map((d) => d.count));
  const subMax = Math.max(1, ...data.topUsersBySubmissions.map((u) => u.count));
  const violMax = Math.max(1, ...data.topUsersByViolations.map((u) => u.count));

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Platform-wide moderation activity at a glance." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Submissions" value={data.overview.totalSubmissions} icon="📦" accent="bg-sky-100" />
        <Stat label="Images screened" value={data.overview.totalImages} icon="🖼️" accent="bg-indigo-100" />
        <Stat label="Appeals" value={data.overview.totalAppeals} icon="⚖️" accent="bg-amber-100" />
        <Stat label="Users" value={data.overview.totalUsers} icon="👥" accent="bg-emerald-100" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Verdicts by outcome</h2>
          <div className="space-y-2">
            {(Object.keys(OUTCOME_LABELS)).map((k) => (
              <Bar key={k} label={OUTCOME_LABELS[k]} value={data.verdictsByOutcome[k as keyof typeof data.verdictsByOutcome] ?? 0} max={outcomeMax} color={OUTCOME_BAR[k]} />
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Violations by category</h2>
          <div className="space-y-2">
            {Object.entries(data.verdictsByCategory).map(([k, v]) => (
              <Bar key={k} label={categoryLabel(k)} value={v} max={catMax} color="bg-red-500" />
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Appeals</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-2xl font-semibold text-blue-600">{data.appeals.pending}</p><p className="text-xs text-slate-400">Pending</p></div>
            <div><p className="text-2xl font-semibold text-green-600">{data.appeals.accepted}</p><p className="text-xs text-slate-400">Accepted</p></div>
            <div><p className="text-2xl font-semibold text-slate-500">{data.appeals.rejected}</p><p className="text-xs text-slate-400">Rejected</p></div>
          </div>
          <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm text-slate-600">
            <div className="flex justify-between"><span>Resolution rate</span><span className="font-medium">{Math.round(data.appeals.resolutionRate * 100)}%</span></div>
            <div className="flex justify-between"><span>Acceptance rate</span><span className="font-medium">{Math.round(data.appeals.acceptanceRate * 100)}%</span></div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Submissions over time</h2>
          {data.submissionsOverTime.length === 0 ? (
            <p className="text-sm text-slate-500">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {data.submissionsOverTime.map((d) => (
                <Bar key={d.date} label={d.date} value={d.count} max={timeMax} color="bg-slate-700" />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Top users by submissions</h2>
          {data.topUsersBySubmissions.length === 0 ? (
            <p className="text-sm text-slate-500">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {data.topUsersBySubmissions.map((u) => (
                <Bar key={u.userId} label={u.email} value={u.count} max={subMax} color="bg-slate-700" />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Top users by violations</h2>
          {data.topUsersByViolations.length === 0 ? (
            <p className="text-sm text-slate-500">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {data.topUsersByViolations.map((u) => (
                <Bar key={u.userId} label={u.email} value={u.count} max={violMax} color="bg-red-500" />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
