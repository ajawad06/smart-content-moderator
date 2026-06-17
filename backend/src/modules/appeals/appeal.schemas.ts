import { z } from 'zod';
import { APPEAL_STATUS_VALUES } from '../../models/Appeal';

export const createAppealSchema = z.object({
  submissionId: z.string().length(24, 'A valid submission id is required'),
  justification: z.string().trim().min(10, 'Justification must be at least 10 characters').max(2000),
});

export const resolveAppealSchema = z.object({
  decision: z.enum(['accept', 'reject']),
  response: z.string().trim().max(2000).optional(),
});

export const listAppealsQuerySchema = z.object({
  status: z.enum(APPEAL_STATUS_VALUES as [string, ...string[]]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateAppealInput = z.infer<typeof createAppealSchema>;
export type ResolveAppealInput = z.infer<typeof resolveAppealSchema>;
export type ListAppealsQuery = z.infer<typeof listAppealsQuerySchema>;
