import mongoose, { Schema, Document, Model } from "mongoose";

export type RFQStatus = "draft" | "sent" | "responded" | "closed";

export interface IRFQ extends Document {
  company: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  title: string;
  number: string;
  date: Date;
  vendorName: string;
  remarks?: string;
  status: RFQStatus;
  template?: mongoose.Types.ObjectId | null;
  columnConfig?: mongoose.Types.ObjectId | null;
  vendorEmail?: string;
  vendorContact?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RFQSchema = new Schema<IRFQ>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    number: { type: String, required: true },
    date: { type: Date, required: true },
    vendorName: { type: String, required: true },
    remarks: { type: String },
    status: {
      type: String,
      enum: ["draft", "sent", "responded", "closed"],
      default: "draft",
    },
    template: {
      type: Schema.Types.ObjectId,
      ref: "Template",
      default: null,
    },
    columnConfig: {
      type: Schema.Types.ObjectId,
      ref: "RFQColumnConfig",
      default: null,
    },
    vendorEmail: { type: String },
    vendorContact: { type: String },
  },
  { timestamps: true }
);

RFQSchema.index({ company: 1, status: 1, createdAt: -1 });
RFQSchema.index({ company: 1, number: 1 }, { unique: true });

if (mongoose.models.RFQ) {
  delete mongoose.models.RFQ;
}

export const RFQ: Model<IRFQ> = mongoose.model<IRFQ>("RFQ", RFQSchema);

