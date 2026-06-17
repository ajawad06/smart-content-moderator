import { z } from 'zod';
import { CATEGORY_KEYS, OUTCOME_VALUES } from '../../constants/moderation';

export const listSubmissionsQuerySchema = z.object({
  outcome: z.enum(OUTCOME_VALUES as [string, ...string[]]).optional(),
  category: z.enum(CATEGORY_KEYS as [string, ...string[]]).optional(),
  from: z.coerce.date().optional(), // ISO date; filters createdAt >= from
  to: z.coerce.date().optional(), // ISO date; filters createdAt <= to
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListSubmissionsQuery = z.infer<typeof listSubmissionsQuerySchema>;
