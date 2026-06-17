import {
  type Classification,
  CLASSIFICATION,
  type CategoryKey,
  type Enforcement,
  ENFORCEMENT,
  type Outcome,
  OUTCOME,
} from '../../constants/moderation';
import type { ICategorySetting } from '../../models/PolicyConfig';
import type { CategoryClassification } from './provider.types';

export interface VerdictCategoryResult {
  category: CategoryKey;
  classification: Classification;
  confidence: number;
  reasoning: string;
  threshold: number;
  enforcement: Enforcement;
}

export interface ComputedVerdict {
  outcome: Outcome;
  categoryResults: VerdictCategoryResult[];
}

/**
 * Pure function: given the policy's per-category settings and the AI's per-category
 * confidence, compute the overall outcome and the breakdown.
 *
 * - Disabled categories are skipped entirely (not screened, not in the breakdown).
 * - A detection counts only if confidence >= threshold; below that it is inconclusive
 *   and does not affect the outcome.
 * - Auto-Block takes precedence over Flag-for-Review, which takes precedence over Approved.
 */
export function computeVerdict(
  categories: ICategorySetting[],
  classifications: CategoryClassification[],
): ComputedVerdict {
  const confidenceByCategory = new Map(
    classifications.map((c) => [c.category, c]),
  );

  let anyBlock = false;
  let anyFlag = false;
  const categoryResults: VerdictCategoryResult[] = [];

  for (const setting of categories) {
    if (!setting.enabled) continue;

    const cls = confidenceByCategory.get(setting.category);
    const confidence = cls?.confidence ?? 0;
    const reasoning = cls?.reasoning ?? 'Category was not assessed.';
    const meets = confidence >= setting.threshold;

    if (meets) {
      if (setting.enforcement === ENFORCEMENT.AUTO_BLOCK) anyBlock = true;
      else anyFlag = true;
    }

    categoryResults.push({
      category: setting.category,
      classification: meets ? CLASSIFICATION.VIOLATION : CLASSIFICATION.INCONCLUSIVE,
      confidence,
      reasoning,
      threshold: setting.threshold,
      enforcement: setting.enforcement,
    });
  }

  const outcome: Outcome = anyBlock
    ? OUTCOME.BLOCKED
    : anyFlag
      ? OUTCOME.FLAGGED
      : OUTCOME.APPROVED;

  return { outcome, categoryResults };
}
