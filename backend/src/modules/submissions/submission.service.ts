import type { FilterQuery } from 'mongoose';
import { type CategoryKey, CLASSIFICATION, type Outcome, OUTCOME } from '../../constants/moderation';
import { ApiError } from '../../middleware/error';
import { type ISubmission, Submission, type SubmissionDocument } from '../../models/Submission';
import { Verdict, type VerdictDocument } from '../../models/Verdict';
import type { JwtPayload } from '../../utils/jwt';
import { screenImage } from '../moderation/moderation.service';
import type { ListSubmissionsQuery } from './submission.schemas';

export interface UploadedImage {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

const SEVERITY: Record<Outcome, number> = {
  [OUTCOME.APPROVED]: 0,
  [OUTCOME.FLAGGED]: 1,
  [OUTCOME.BLOCKED]: 2,
};

function mostSevere(outcomes: Outcome[]): Outcome {
  return outcomes.reduce(
    (worst, o) => (SEVERITY[o] > SEVERITY[worst] ? o : worst),
    OUTCOME.APPROVED as Outcome,
  );
}

/** Screens each image, persists per-image verdicts, and creates the parent submission. */
export async function createSubmission(
  userId: string,
  images: UploadedImage[],
): Promise<{ submission: SubmissionDocument; verdicts: VerdictDocument[] }> {
  if (images.length === 0) {
    throw new ApiError(400, 'At least one image is required');
  }

  const submission = await Submission.create({
    user: userId,
    policyVersion: 0, // placeholder; set from screening below
    outcome: OUTCOME.APPROVED,
    imageCount: images.length,
    violatedCategories: [],
  });

  const verdicts: VerdictDocument[] = [];
  const outcomes: Outcome[] = [];
  const violated = new Set<CategoryKey>();
  let policyVersion = 0;

  try {
    for (const image of images) {
      const result = await screenImage({
        base64: image.buffer.toString('base64'),
        mimeType: image.mimetype,
        filename: image.originalname,
      });
      policyVersion = result.policyVersion;
      outcomes.push(result.outcome);
      for (const r of result.categoryResults) {
        if (r.classification === CLASSIFICATION.VIOLATION) violated.add(r.category);
      }

      const verdict = await Verdict.create({
        submission: submission._id,
        user: userId,
        filename: image.originalname,
        mimeType: image.mimetype,
        size: image.size,
        data: image.buffer,
        outcome: result.outcome,
        overrideOutcome: null,
        categoryResults: result.categoryResults,
        policyVersion: result.policyVersion,
        provider: result.providerName,
      });
      verdicts.push(verdict);
    }
  } catch (err) {
    // Roll back the partial submission so we never leave an orphan.
    await Verdict.deleteMany({ submission: submission._id });
    await submission.deleteOne();
    throw err;
  }

  submission.outcome = mostSevere(outcomes);
  submission.violatedCategories = [...violated];
  submission.policyVersion = policyVersion;
  await submission.save();

  return { submission, verdicts };
}

export interface PaginatedSubmissions {
  submissions: SubmissionDocument[];
  page: number;
  limit: number;
  total: number;
}

export async function listSubmissions(
  userId: string,
  query: ListSubmissionsQuery,
): Promise<PaginatedSubmissions> {
  const filter: FilterQuery<ISubmission> = { user: userId };
  if (query.outcome) filter.outcome = query.outcome;
  if (query.category) filter.violatedCategories = query.category;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = query.from;
    if (query.to) filter.createdAt.$lte = query.to;
  }

  const skip = (query.page - 1) * query.limit;
  const [submissions, total] = await Promise.all([
    Submission.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    Submission.countDocuments(filter),
  ]);

  return { submissions, page: query.page, limit: query.limit, total };
}

/** Loads a submission and its verdicts, enforcing ownership (admins may view any). */
export async function getSubmissionDetail(
  submissionId: string,
  requester: JwtPayload,
): Promise<{ submission: SubmissionDocument; verdicts: VerdictDocument[] }> {
  const submission = await Submission.findById(submissionId);
  if (!submission) throw new ApiError(404, 'Submission not found');
  if (requester.role !== 'admin' && submission.user.toString() !== requester.sub) {
    throw new ApiError(403, 'You do not have access to this submission');
  }
  const verdicts = await Verdict.find({ submission: submission._id }).sort({ createdAt: 1 });
  return { submission, verdicts };
}

/** Loads a verdict's raw image bytes, enforcing ownership (admins may view any). */
export async function getVerdictImage(
  verdictId: string,
  requester: JwtPayload,
): Promise<{ data: Buffer; mimeType: string; filename: string }> {
  const verdict = await Verdict.findById(verdictId).select('+data user mimeType filename');
  if (!verdict) throw new ApiError(404, 'Image not found');
  if (requester.role !== 'admin' && verdict.user.toString() !== requester.sub) {
    throw new ApiError(403, 'You do not have access to this image');
  }
  return { data: verdict.data, mimeType: verdict.mimeType, filename: verdict.filename };
}
