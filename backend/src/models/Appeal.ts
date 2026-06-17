import { type HydratedDocument, type Model, Schema, type Types, model } from 'mongoose';

export const APPEAL_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;
export const APPEAL_STATUS_VALUES = Object.values(APPEAL_STATUS);
export type AppealStatus = (typeof APPEAL_STATUS_VALUES)[number];

export interface IAppeal {
  submission: Types.ObjectId;
  user: Types.ObjectId; // the appellant (submission owner)
  justification: string;
  status: AppealStatus;
  adminResponse: string | null;
  resolvedBy: Types.ObjectId | null; // admin who resolved it
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const appealSchema = new Schema<IAppeal>(
  {
    // One appeal per submission.
    submission: {
      type: Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
      unique: true,
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    justification: { type: String, required: true, trim: true },
    status: { type: String, enum: APPEAL_STATUS_VALUES, default: APPEAL_STATUS.PENDING, index: true },
    adminResponse: { type: String, default: null },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
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

export type AppealDocument = HydratedDocument<IAppeal>;
type AppealModel = Model<IAppeal>;
export const Appeal = model<IAppeal, AppealModel>('Appeal', appealSchema);
