import mongoose, { Schema, Document, Model } from "mongoose";

export type TemplateKey = "minimal" | "corporate" | "detailed" | (string & {});

export interface ITemplate extends Document {
  company: mongoose.Types.ObjectId | null; // null = global template
  key: TemplateKey;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },
    key: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TemplateSchema.index({ company: 1, key: 1 }, { unique: true });

export const Template: Model<ITemplate> =
  mongoose.models.Template || mongoose.model<ITemplate>("Template", TemplateSchema);

