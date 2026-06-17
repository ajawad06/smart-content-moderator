// Mirrors backend src/constants/moderation.ts (kept in sync manually; small + stable).

export const CATEGORY_LABELS: Record<string, string> = {
  graphic_violence: 'Graphic Violence',
  hate_symbols: 'Hate Symbols',
  self_harm: 'Self-Harm',
  extremist_propaganda: 'Extremist Propaganda',
  weapons_contraband: 'Weapons & Contraband',
  harassment_humiliation: 'Harassment & Humiliation',
};

export const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS);

export const OUTCOME_LABELS: Record<string, string> = {
  approved: 'Approved',
  flagged: 'Flagged for Review',
  blocked: 'Blocked',
};

export const ENFORCEMENT_LABELS: Record<string, string> = {
  auto_block: 'Auto-Block',
  flag_for_review: 'Flag for Review',
};

export const APPEAL_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

export function categoryLabel(key: string): string {
  return CATEGORY_LABELS[key] ?? key;
}
