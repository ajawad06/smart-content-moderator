export type Role = 'user' | 'admin';
export type Outcome = 'approved' | 'flagged' | 'blocked';
export type Enforcement = 'auto_block' | 'flag_for_review';
export type Classification = 'violation' | 'inconclusive';
export type AppealStatus = 'pending' | 'accepted' | 'rejected';

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CategorySetting {
  category: string;
  enabled: boolean;
  threshold: number;
  enforcement: Enforcement;
}

export interface PolicyConfig {
  id: string;
  version: number;
  categories: CategorySetting[];
  createdBy: string | null;
  createdAt: string;
}

export interface VerdictCategoryResult {
  category: string;
  classification: Classification;
  confidence: number;
  reasoning: string;
  threshold: number;
  enforcement: Enforcement;
}

export interface Verdict {
  id: string;
  submission: string;
  filename: string;
  mimeType: string;
  size: number;
  outcome: Outcome;
  overrideOutcome: Outcome | null;
  effectiveOutcome: Outcome;
  categoryResults: VerdictCategoryResult[];
  policyVersion: number;
  provider: string;
  createdAt: string;
}

export interface Appeal {
  id: string;
  submission: string | Submission;
  user: string;
  justification: string;
  status: AppealStatus;
  adminResponse: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface Submission {
  id: string;
  user: string;
  policyVersion: number;
  outcome: Outcome;
  imageCount: number;
  violatedCategories: string[];
  createdAt: string;
  appeal?: Appeal | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
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
  verdictsByOutcome: Record<Outcome, number>;
  verdictsByCategory: Record<string, number>;
  appeals: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    resolutionRate: number;
    acceptanceRate: number;
  };
  topUsersBySubmissions: { userId: string; email: string; count: number }[];
  topUsersByViolations: { userId: string; email: string; count: number }[];
}
