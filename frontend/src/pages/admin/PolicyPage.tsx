import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api, apiErrorMessage } from '../../lib/api';
import { categoryLabel } from '../../lib/constants';
import type { CategorySetting, PolicyConfig } from '../../lib/types';
import { Alert, Button, Card, PageHeader, Select, Spinner } from '../../components/ui';

export default function PolicyPage() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<CategorySetting[]>([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const { data: policy, isLoading } = useQuery({
    queryKey: ['active-policy'],
    queryFn: async () => (await api.get<{ policy: PolicyConfig }>('/policies/active')).data.policy,
  });

  // Seed the editable draft from the active policy.
  useEffect(() => {
    if (policy) setDraft(policy.categories.map((c) => ({ ...c })));
  }, [policy]);

  const mutation = useMutation({
    mutationFn: async (updates: CategorySetting[]) => {
      const res = await api.patch<{ policy: PolicyConfig }>('/policies', { updates });
      return res.data.policy;
    },
    onSuccess: () => {
      setError('');
      setSaved(true);
      qc.invalidateQueries({ queryKey: ['active-policy'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Could not update policy')),
  });

  if (isLoading || !policy) {
    return <div className="flex justify-center py-12"><Spinner className="h-6 w-6 text-slate-400" /></div>;
  }

  function setRow(category: string, patch: Partial<CategorySetting>) {
    setSaved(false);
    setDraft((rows) => rows.map((r) => (r.category === category ? { ...r, ...patch } : r)));
  }

  // Only send categories that actually changed.
  const changed = draft.filter((d) => {
    const original = policy.categories.find((c) => c.category === d.category)!;
    return (
      d.enabled !== original.enabled ||
      d.threshold !== original.threshold ||
      d.enforcement !== original.enforcement
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Policy configuration"
        subtitle={`Active version v${policy.version}. Saving creates a new version; existing verdicts are unaffected.`}
      />

      {error && <Alert>{error}</Alert>}
      {saved && changed.length === 0 && <Alert kind="success">Policy saved as a new version.</Alert>}

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Enabled</th>
              <th className="px-4 py-3">Threshold (%)</th>
              <th className="px-4 py-3">Enforcement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {draft.map((row) => (
              <tr key={row.category} className={row.enabled ? '' : 'opacity-50'}>
                <td className="px-4 py-3 font-medium text-slate-700">{categoryLabel(row.category)}</td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) => setRow(row.category, { enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={row.threshold}
                    disabled={!row.enabled}
                    onChange={(e) => setRow(row.category, { threshold: Number(e.target.value) })}
                    className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-1 focus:ring-sky-300 disabled:opacity-60"
                  />
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={row.enforcement}
                    disabled={!row.enabled}
                    onChange={(e) => setRow(row.category, { enforcement: e.target.value as CategorySetting['enforcement'] })}
                    className="w-44"
                  >
                    <option value="flag_for_review">Flag for Review</option>
                    <option value="auto_block">Auto-Block</option>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center gap-3">
        <Button loading={mutation.isPending} disabled={changed.length === 0} onClick={() => mutation.mutate(changed)}>
          Save changes{changed.length > 0 ? ` (${changed.length})` : ''}
        </Button>
        {changed.length === 0 && <span className="text-sm text-slate-400">No pending changes.</span>}
      </div>
    </div>
  );
}
