import { type HydratedDocument, type Model, Schema, type Types, model } from 'mongoose';
import {
  CATEGORY_KEYS,
  type CategoryKey,
  type Outcome,
  OUTCOME_VALUES,
} from '../constants/moderation';

export interface ISubmission {
  user: Types.ObjectId;
  policyVersion: number; // snapshot of the active policy at submission time
  outcome: Outcome; // aggregate (most severe across images); updated on appeal override
  imageCount: number;
  // Union of categories detected as violations across this submission's images.
  // Immutable detection record used for category filtering (not affected by overrides).
  violatedCategories: CategoryKey[];
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    policyVersion: { type: Number, required: true },
    outcome: { type: String, enum: OUTCOME_VALUES, required: true, index: true },
    imageCount: { type: Number, required: true, min: 1 },
    violatedCategories: { type: [String], enum: CATEGORY_KEYS, default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Common history query: a user's submissions, newest first.
submissionSchema.index({ user: 1, createdAt: -1 });

export type SubmissionDocument = HydratedDocument<ISubmission>;
type SubmissionModel = Model<ISubmission>;
export const Submission = model<ISubmission, SubmissionModel>('Submission', submissionSchema);
