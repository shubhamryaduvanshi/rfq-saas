import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "owner" | "admin" | "member";

export interface IUser extends Document {
  name?: string;
  email: string;
  password?: string; // hashed for credentials users
  image?: string;
  provider: "credentials" | "google";
  providerId?: string;
  company?: mongoose.Types.ObjectId;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    image: { type: String },
    provider: {
      type: String,
      enum: ["credentials", "google"],
      required: true,
      default: "credentials",
    },
    providerId: { type: String, index: true },
    company: { type: Schema.Types.ObjectId, ref: "Company" },
    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member",
    },
  },
  { timestamps: true }
);

UserSchema.index({ company: 1, role: 1 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

