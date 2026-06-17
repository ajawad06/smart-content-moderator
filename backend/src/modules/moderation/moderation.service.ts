import { CATEGORIES, type CategoryKey } from '../../constants/moderation';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { requireActivePolicy } from '../policies/policy.service';
import { GroqModerationProvider } from './groq.provider';
import { MockModerationProvider } from './mock.provider';
import type { CategoryDescriptor, ModerationImageInput, ModerationProvider } from './provider.types';
import { type ComputedVerdict, computeVerdict } from './verdict';

const CATEGORY_BY_KEY = new Map<CategoryKey, CategoryDescriptor>(
  CATEGORIES.map((c) => [c.key, { key: c.key, label: c.label, description: c.description }]),
);

let provider: ModerationProvider | null = null;

/** Lazily constructs the configured provider (singleton). */
export function getModerationProvider(): ModerationProvider {
  if (provider) return provider;
  provider =
    env.MODERATION_PROVIDER === 'groq'
      ? new GroqModerationProvider()
      : new MockModerationProvider();
  logger.info(`Moderation provider initialized: ${provider.name}`);
  return provider;
}

export interface ScreenResult extends ComputedVerdict {
  policyVersion: number;
  providerName: string;
}

/**
 * Screens a single image against the currently active policy: only enabled categories
 * are sent to the AI provider; the verdict engine then applies thresholds/enforcement.
 * Returns the verdict plus the policy version it was computed against (for snapshotting).
 */
export async function screenImage(image: ModerationImageInput): Promise<ScreenResult> {
  const policy = await requireActivePolicy();
  const enabled = policy.categories.filter((c) => c.enabled);
  const descriptors = enabled
    .map((c) => CATEGORY_BY_KEY.get(c.category))
    .filter((d): d is CategoryDescriptor => Boolean(d));

  const prov = getModerationProvider();
  const classifications = descriptors.length > 0 ? await prov.screen(image, descriptors) : [];

  const verdict = computeVerdict(policy.categories, classifications);
  return { ...verdict, policyVersion: policy.version, providerName: prov.name };
}
