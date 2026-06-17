import {
  CATEGORY_KEYS,
  type CategoryKey,
  type Outcome,
  OUTCOME_VALUES,
} from '../../constants/moderation';
import { Appeal, APPEAL_STATUS, APPEAL_STATUS_VALUES } from '../../models/Appeal';
import { Submission } from '../../models/Submission';
import { User } from '../../models/User';
import { Verdict } from '../../models/Verdict';

interface CountByKey {
  _id: string;
  count: number;
}

/** Turns aggregation buckets into a complete, zero-filled record over `keys`. */
function densify<K extends string>(rows: CountByKey[], keys: readonly K[]): Record<K, number> {
  const map = new Map(rows.map((r) => [r._id, r.count]));
  return Object.fromEntries(keys.map((k) => [k, map.get(k) ?? 0])) as Record<K, number>;
}

export interface LeaderboardEntry {
  userId: string;
  email: string;
  count: number;
}

export interface Analytics {
  overview: {
    totalSubmissions: number;
    totalImages: number;
    totalAppeals: number;
    totalUsers: number;
  };
  submissionsOverTime: { date: string; count: number }[];
  submissionsByOutcome: Record<Outcome, number>;
  verdictsByOutcome: Record<Outcome, number>; // effective outcome (override wins)
  verdictsByCategory: Record<CategoryKey, number>; // count of violation detections per category
  appeals: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    resolutionRate: number; // resolved / total
    acceptanceRate: number; // accepted / resolved
  };
  topUsersBySubmissions: LeaderboardEntry[];
  topUsersByViolations: LeaderboardEntry[];
}

const LEADERBOARD_LIMIT = 10;

const leaderboardTail = [
  { $sort: { count: -1 as const } },
  { $limit: LEADERBOARD_LIMIT },
  { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
  { $unwind: '$user' },
  { $project: { _id: 0, userId: { $toString: '$_id' }, email: '$user.email', count: 1 } },
];

export async function getAnalytics(): Promise<Analytics> {
  const [
    totalSubmissions,
    totalImages,
    totalAppeals,
    totalUsers,
    overTime,
    subByOutcome,
    verdByOutcome,
    verdByCategory,
    appealByStatus,
    bySubmissions,
    byViolations,
  ] = await Promise.all([
    Submission.countDocuments(),
    Verdict.countDocuments(),
    Appeal.countDocuments(),
    User.countDocuments(),

    // Submission volume over time, grouped by calendar day (UTC).
    Submission.aggregate<{ _id: string; count: number }>([
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),

    Submission.aggregate<CountByKey>([{ $group: { _id: '$outcome', count: { $sum: 1 } } }]),

    // Verdict distribution by effective outcome (override takes precedence).
    Verdict.aggregate<CountByKey>([
      { $group: { _id: { $ifNull: ['$overrideOutcome', '$outcome'] }, count: { $sum: 1 } } },
    ]),

    // Violation detections per category (immutable detection record).
    Verdict.aggregate<CountByKey>([
      { $unwind: '$categoryResults' },
      { $match: { 'categoryResults.classification': 'violation' } },
      { $group: { _id: '$categoryResults.category', count: { $sum: 1 } } },
    ]),

    Appeal.aggregate<CountByKey>([{ $group: { _id: '$status', count: { $sum: 1 } } }]),

    Submission.aggregate<LeaderboardEntry>([
      { $group: { _id: '$user', count: { $sum: 1 } } },
      ...leaderboardTail,
    ]),

    // Rank by number of submissions that contained at least one violation.
    Submission.aggregate<LeaderboardEntry>([
      { $match: { 'violatedCategories.0': { $exists: true } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      ...leaderboardTail,
    ]),
  ]);

  const appealCounts = densify(appealByStatus, APPEAL_STATUS_VALUES);
  const resolved = appealCounts[APPEAL_STATUS.ACCEPTED] + appealCounts[APPEAL_STATUS.REJECTED];

  return {
    overview: { totalSubmissions, totalImages, totalAppeals, totalUsers },
    submissionsOverTime: overTime.map((r) => ({ date: r._id, count: r.count })),
    submissionsByOutcome: densify(subByOutcome, OUTCOME_VALUES),
    verdictsByOutcome: densify(verdByOutcome, OUTCOME_VALUES),
    verdictsByCategory: densify(verdByCategory, CATEGORY_KEYS),
    appeals: {
      total: totalAppeals,
      pending: appealCounts[APPEAL_STATUS.PENDING],
      accepted: appealCounts[APPEAL_STATUS.ACCEPTED],
      rejected: appealCounts[APPEAL_STATUS.REJECTED],
      resolutionRate: totalAppeals === 0 ? 0 : resolved / totalAppeals,
      acceptanceRate: resolved === 0 ? 0 : appealCounts[APPEAL_STATUS.ACCEPTED] / resolved,
    },
    topUsersBySubmissions: bySubmissions,
    topUsersByViolations: byViolations,
  };
}
