import { type HydratedDocument, type Model, Schema, type Types, model } from 'mongoose';
import {
  CATEGORY_KEYS,
  type CategoryKey,
  type Classification,
  CLASSIFICATION_VALUES,
  type Enforcement,
  ENFORCEMENT_VALUES,
  type Outcome,
  OUTCOME_VALUES,
} from '../constants/moderation';

export interface IVerdictCategoryResult {
  category: CategoryKey;
  classification: Classification;
  confidence: number;
  reasoning: string;
  threshold: number;
  enforcement: Enforcement;
}

export interface IVerdict {
  submission: Types.ObjectId;
  user: Types.ObjectId; // denormalized owner, for analytics and ownership checks
  filename: string;
  mimeType: string;
  size: number;
  data: Buffer; // raw image bytes; excluded from queries by default (select: false)
  outcome: Outcome; // computed at submission time (immutable)
  overrideOutcome: Outcome | null; // set when an appeal is accepted
  categoryResults: IVerdictCategoryResult[];
  policyVersion: number;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
}

const categoryResultSchema = new Schema<IVerdictCategoryResult>(
  {
    category: { type: String, enum: CATEGORY_KEYS, required: true },
    classification: { type: String, enum: CLASSIFICATION_VALUES, required: true },
    confidence: { type: Number, required: true },
    reasoning: { type: String, default: '' },
    threshold: { type: Number, required: true },
    enforcement: { type: String, enum: ENFORCEMENT_VALUES, required: true },
  },
  { _id: false },
);

const verdictSchema = new Schema<IVerdict>(
  {
    submission: { type: Schema.Types.ObjectId, ref: 'Submission', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true, select: false },
    outcome: { type: String, enum: OUTCOME_VALUES, required: true },
    overrideOutcome: { type: String, enum: OUTCOME_VALUES, default: null },
    categoryResults: { type: [categoryResultSchema], default: [] },
    policyVersion: { type: Number, required: true },
    provider: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.data; // never serialize raw bytes
        // Surface the effective outcome (override wins) for convenience.
        ret.effectiveOutcome = (ret.overrideOutcome as Outcome | null) ?? ret.outcome;
        return ret;
      },
    },
  },
);

export type VerdictDocument = HydratedDocument<IVerdict>;
type VerdictModel = Model<IVerdict>;
export const Verdict = model<IVerdict, VerdictModel>('Verdict', verdictSchema);
