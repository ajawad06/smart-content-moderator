import { type HydratedDocument, type Model, Schema, Types, model } from 'mongoose';
import {
  CATEGORY_KEYS,
  type CategoryKey,
  type Enforcement,
  ENFORCEMENT_VALUES,
} from '../constants/moderation';

export interface ICategorySetting {
  category: CategoryKey;
  enabled: boolean;
  threshold: number; // percentage 0-100; detections below this are inconclusive
  enforcement: Enforcement;
}

export interface IPolicyConfig {
  version: number;
  categories: ICategorySetting[];
  createdBy: Types.ObjectId | null; // admin who created this version; null for the seeded default
  createdAt: Date;
  updatedAt: Date;
}

const categorySettingSchema = new Schema<ICategorySetting>(
  {
    category: { type: String, enum: CATEGORY_KEYS, required: true },
    enabled: { type: Boolean, default: true, required: true },
    threshold: { type: Number, min: 0, max: 100, default: 70, required: true },
    enforcement: { type: String, enum: ENFORCEMENT_VALUES, required: true },
  },
  { _id: false },
);

const policyConfigSchema = new Schema<IPolicyConfig>(
  {
    // Monotonically increasing. The active policy is always the highest version.
    version: { type: Number, required: true, unique: true, index: true },
    categories: { type: [categorySettingSchema], required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
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

export type PolicyConfigDocument = HydratedDocument<IPolicyConfig>;
type PolicyConfigModel = Model<IPolicyConfig>;
export const PolicyConfig = model<IPolicyConfig, PolicyConfigModel>(
  'PolicyConfig',
  policyConfigSchema,
);
