import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRFQItem extends Document {
  company: mongoose.Types.ObjectId;
  rfq: mongoose.Types.ObjectId;
  position: number;
  values: Map<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const RFQItemSchema = new Schema<IRFQItem>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    rfq: { type: Schema.Types.ObjectId, ref: "RFQ", required: true, index: true },
    position: { type: Number, required: true },
    values: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

RFQItemSchema.index({ rfq: 1, position: 1 });

export const RFQItem: Model<IRFQItem> =
  mongoose.models.RFQItem || mongoose.model<IRFQItem>("RFQItem", RFQItemSchema);

