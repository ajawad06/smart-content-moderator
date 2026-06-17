import { z } from 'zod';
import { CATEGORY_KEYS, ENFORCEMENT_VALUES } from '../../constants/moderation';

const categoryUpdateSchema = z
  .object({
    category: z.enum(CATEGORY_KEYS as [string, ...string[]]),
    enabled: z.boolean().optional(),
    threshold: z.number().int().min(0).max(100).optional(),
    enforcement: z.enum(ENFORCEMENT_VALUES as [string, ...string[]]).optional(),
  })
  .refine(
    (v) => v.enabled !== undefined || v.threshold !== undefined || v.enforcement !== undefined,
    { message: 'At least one of enabled, threshold, or enforcement must be provided' },
  );

export const updatePolicySchema = z.object({
  updates: z.array(categoryUpdateSchema).min(1, 'At least one category update is required'),
});

export const versionParamSchema = z.object({
  version: z.coerce.number().int().positive(),
});

export type CategoryUpdate = {
  category: (typeof CATEGORY_KEYS)[number];
  enabled?: boolean;
  threshold?: number;
  enforcement?: (typeof ENFORCEMENT_VALUES)[number];
};
