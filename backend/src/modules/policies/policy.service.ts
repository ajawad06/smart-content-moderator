import { Types } from 'mongoose';
import {
  CATEGORY_KEYS,
  type CategoryKey,
  DEFAULT_ENFORCEMENT,
  DEFAULT_THRESHOLD,
} from '../../constants/moderation';
import { ApiError } from '../../middleware/error';
import {
  type ICategorySetting,
  PolicyConfig,
  type PolicyConfigDocument,
} from '../../models/PolicyConfig';
import { logger } from '../../utils/logger';
import type { CategoryUpdate } from './policy.schemas';

/** The active policy is the highest-versioned document. */
export async function getActivePolicy(): Promise<PolicyConfigDocument | null> {
  return PolicyConfig.findOne().sort({ version: -1 });
}

/** Like getActivePolicy but throws if none exists (should never happen post-seed). */
export async function requireActivePolicy(): Promise<PolicyConfigDocument> {
  const policy = await getActivePolicy();
  if (!policy) throw new ApiError(500, 'No active policy configuration found');
  return policy;
}

export async function listPolicyVersions(): Promise<PolicyConfigDocument[]> {
  return PolicyConfig.find().sort({ version: -1 });
}

export async function getPolicyByVersion(version: number): Promise<PolicyConfigDocument> {
  const policy = await PolicyConfig.findOne({ version });
  if (!policy) throw new ApiError(404, `Policy version ${version} not found`);
  return policy;
}

/** Creates version 1 with default settings for all categories if no policy exists. */
export async function seedDefaultPolicy(): Promise<void> {
  const existing = await getActivePolicy();
  if (existing) return;
  const categories: ICategorySetting[] = CATEGORY_KEYS.map((category) => ({
    category,
    enabled: true,
    threshold: DEFAULT_THRESHOLD,
    enforcement: DEFAULT_ENFORCEMENT,
  }));
  await PolicyConfig.create({ version: 1, categories, createdBy: null });
  logger.info('Seed: created default policy configuration (version 1)');
}

/**
 * Applies partial per-category changes by creating a NEW immutable version.
 * Prior versions are never modified, so existing verdicts remain valid.
 */
export async function updatePolicy(
  adminId: string,
  updates: CategoryUpdate[],
): Promise<PolicyConfigDocument> {
  const active = await requireActivePolicy();

  // Start from the current settings, keyed by category.
  const merged = new Map<CategoryKey, ICategorySetting>(
    active.categories.map((c) => [
      c.category,
      { category: c.category, enabled: c.enabled, threshold: c.threshold, enforcement: c.enforcement },
    ]),
  );

  for (const update of updates) {
    const current = merged.get(update.category);
    if (!current) throw new ApiError(400, `Unknown category: ${update.category}`);
    if (update.enabled !== undefined) current.enabled = update.enabled;
    if (update.threshold !== undefined) current.threshold = update.threshold;
    if (update.enforcement !== undefined) current.enforcement = update.enforcement;
    merged.set(update.category, current);
  }

  // Preserve canonical category order and completeness.
  const categories = CATEGORY_KEYS.map((key) => merged.get(key)!);

  return PolicyConfig.create({
    version: active.version + 1,
    categories,
    createdBy: new Types.ObjectId(adminId),
  });
}
