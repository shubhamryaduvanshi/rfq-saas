"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { signupSchema, type SignupInput } from "@/lib/validators/auth";

export async function signupAction(input: SignupInput) {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const { name, email, password } = parsed.data;

  await connectDB();

  const existing = await User.findOne({ email }).exec();
  if (existing) {
    return { success: false, error: "Email already in use." };
  }

  const hashed = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    password: hashed,
    provider: "credentials",
    role: "owner",
  });

  redirect("/login");
}

