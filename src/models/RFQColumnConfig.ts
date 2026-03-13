import mongoose, { Schema, Document, Model } from "mongoose";

export type RFQColumnType = "text" | "number" | "image" | "dropdown" | "textarea";

export interface IRFQColumn {
  id: string;
  label: string;
  type: RFQColumnType;
  enabled: boolean;
  order: number;
  required?: boolean;
  width?: string;
  options?: string[];
}

export interface IRFQColumnConfig extends Document {
  company: mongoose.Types.ObjectId;
  name: string;
  columns: IRFQColumn[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RFQColumnSchema = new Schema<IRFQColumn>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "number", "image", "dropdown", "textarea"],
      required: true,
    },
    enabled: { type: Boolean, default: true },
    order: { type: Number, required: true },
    required: { type: Boolean, default: false },
    width: { type: String },
    options: [{ type: String }],
  },
  { _id: false }
);

const RFQColumnConfigSchema = new Schema<IRFQColumnConfig>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    columns: { type: [RFQColumnSchema], default: [] },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

RFQColumnConfigSchema.index({ company: 1, name: 1 }, { unique: true });
RFQColumnConfigSchema.index({ company: 1, isDefault: 1 });

export const RFQColumnConfig: Model<IRFQColumnConfig> =
  mongoose.models.RFQColumnConfig ||
  mongoose.model<IRFQColumnConfig>("RFQColumnConfig", RFQColumnConfigSchema);

