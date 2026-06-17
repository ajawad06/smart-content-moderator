import type { FilterQuery } from 'mongoose';
import { OUTCOME } from '../../constants/moderation';
import { ApiError } from '../../middleware/error';
import { type AppealDocument, Appeal, APPEAL_STATUS, type IAppeal } from '../../models/Appeal';
import { Submission } from '../../models/Submission';
import { Verdict } from '../../models/Verdict';
import { Types } from 'mongoose';
import type { CreateAppealInput, ListAppealsQuery, ResolveAppealInput } from './appeal.schemas';

/** A user files an appeal against one of their own flagged/blocked submissions. */
export async function createAppeal(
  userId: string,
  input: CreateAppealInput,
): Promise<AppealDocument> {
  const submission = await Submission.findById(input.submissionId);
  if (!submission) throw new ApiError(404, 'Submission not found');
  if (submission.user.toString() !== userId) {
    throw new ApiError(403, 'You can only appeal your own submissions');
  }
  if (submission.outcome === OUTCOME.APPROVED) {
    throw new ApiError(400, 'Only flagged or blocked submissions can be appealed');
  }
  const existing = await Appeal.findOne({ submission: submission._id });
  if (existing) throw new ApiError(409, 'An appeal already exists for this submission');

  return Appeal.create({
    submission: submission._id,
    user: userId,
    justification: input.justification,
  });
}

export interface PaginatedAppeals {
  appeals: AppealDocument[];
  page: number;
  limit: number;
  total: number;
}

/** Lists the current user's own appeals. */
export async function listMyAppeals(
  userId: string,
  query: ListAppealsQuery,
): Promise<PaginatedAppeals> {
  return paginate({ user: new Types.ObjectId(userId), ...statusFilter(query) }, query);
}

/** Admin queue: all appeals, optionally filtered by status (status=pending = the review queue). */
export async function listAllAppeals(query: ListAppealsQuery): Promise<PaginatedAppeals> {
  return paginate(statusFilter(query), query);
}

function statusFilter(query: ListAppealsQuery): FilterQuery<IAppeal> {
  return query.status ? { status: query.status } : {};
}

async function paginate(
  filter: FilterQuery<IAppeal>,
  query: ListAppealsQuery,
): Promise<PaginatedAppeals> {
  const skip = (query.page - 1) * query.limit;
  const [appeals, total] = await Promise.all([
    Appeal.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .populate('submission'),
    Appeal.countDocuments(filter),
  ]);
  return { appeals, page: query.page, limit: query.limit, total };
}

/**
 * Admin accepts or rejects a pending appeal. On acceptance, every non-approved verdict
 * in the submission is overridden to Approved and the submission outcome becomes Approved.
 * The original outcome is preserved on each verdict for audit.
 */
export async function resolveAppeal(
  adminId: string,
  appealId: string,
  input: ResolveAppealInput,
): Promise<AppealDocument> {
  const appeal = await Appeal.findById(appealId);
  if (!appeal) throw new ApiError(404, 'Appeal not found');
  if (appeal.status !== APPEAL_STATUS.PENDING) {
    throw new ApiError(409, `Appeal has already been ${appeal.status}`);
  }

  if (input.decision === 'accept') {
    await Verdict.updateMany(
      { submission: appeal.submission, outcome: { $ne: OUTCOME.APPROVED } },
      { $set: { overrideOutcome: OUTCOME.APPROVED } },
    );
    await Submission.updateOne(
      { _id: appeal.submission },
      { $set: { outcome: OUTCOME.APPROVED } },
    );
    appeal.status = APPEAL_STATUS.ACCEPTED;
  } else {
    appeal.status = APPEAL_STATUS.REJECTED;
  }

  appeal.adminResponse = input.response ?? null;
  appeal.resolvedBy = new Types.ObjectId(adminId);
  appeal.resolvedAt = new Date();
  await appeal.save();
  return appeal;
}

/** Returns a map of submissionId -> appeal for the given submissions (for history enrichment). */
export async function appealsForSubmissions(
  submissionIds: Types.ObjectId[],
): Promise<Map<string, AppealDocument>> {
  const appeals = await Appeal.find({ submission: { $in: submissionIds } });
  return new Map(appeals.map((a) => [a.submission.toString(), a]));
}
