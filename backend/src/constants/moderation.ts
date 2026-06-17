/**
 * Canonical moderation domain constants shared across policies, screening, and verdicts.
 * Category keys are stored in the database; labels/descriptions are presentation metadata.
 */

export const CATEGORIES = [
  {
    key: 'graphic_violence',
    label: 'Graphic Violence',
    description: 'Depictions of physical harm, gore, or serious injury to humans or animals.',
  },
  {
    key: 'hate_symbols',
    label: 'Hate Symbols',
    description: 'Imagery associated with extremist ideologies or designated terrorist organizations.',
  },
  {
    key: 'self_harm',
    label: 'Self-Harm',
    description: 'Visual content depicting or glorifying acts of self-inflicted injury.',
  },
  {
    key: 'extremist_propaganda',
    label: 'Extremist Propaganda',
    description: 'Content that promotes, recruits for, or glorifies violent extremist movements.',
  },
  {
    key: 'weapons_contraband',
    label: 'Weapons & Contraband',
    description: 'Imagery depicting illegal weapons, drug manufacturing, or trafficking-related content.',
  },
  {
    key: 'harassment_humiliation',
    label: 'Harassment & Humiliation',
    description: 'Imagery intended to degrade, threaten, or publicly humiliate an identifiable individual.',
  },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]['key'];
export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key) as CategoryKey[];

export function isCategoryKey(value: string): value is CategoryKey {
  return CATEGORY_KEYS.includes(value as CategoryKey);
}

/** How a category's positive detection affects the overall verdict. */
export const ENFORCEMENT = {
  AUTO_BLOCK: 'auto_block',
  FLAG_FOR_REVIEW: 'flag_for_review',
} as const;
export const ENFORCEMENT_VALUES = Object.values(ENFORCEMENT);
export type Enforcement = (typeof ENFORCEMENT_VALUES)[number];

/** Per-category result in a verdict breakdown. */
export const CLASSIFICATION = {
  VIOLATION: 'violation', // confidence met or exceeded the threshold
  INCONCLUSIVE: 'inconclusive', // below threshold; does not affect the verdict
} as const;
export const CLASSIFICATION_VALUES = Object.values(CLASSIFICATION);
export type Classification = (typeof CLASSIFICATION_VALUES)[number];

/** Overall submission/image outcome. */
export const OUTCOME = {
  APPROVED: 'approved',
  FLAGGED: 'flagged',
  BLOCKED: 'blocked',
} as const;
export const OUTCOME_VALUES = Object.values(OUTCOME);
export type Outcome = (typeof OUTCOME_VALUES)[number];

/** Default per-category settings used when seeding the first policy version. */
export const DEFAULT_THRESHOLD = 70;
export const DEFAULT_ENFORCEMENT: Enforcement = ENFORCEMENT.FLAG_FOR_REVIEW;
