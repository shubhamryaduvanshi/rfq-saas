import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICompany extends Document {
  name: string;
  contactPerson: string;
  email: string;
  mobile: string;
  address: string;
  gstOrRegNo: string;
  logoUrl?: string;
  website?: string;
  tagline?: string;
  paymentDetails?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    gstOrRegNo: { type: String, required: true },
    logoUrl: { type: String },
    website: { type: String },
    tagline: { type: String },
    paymentDetails: { type: String },
  },
  { timestamps: true }
);

CompanySchema.index({ name: 1 });

export const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema);

