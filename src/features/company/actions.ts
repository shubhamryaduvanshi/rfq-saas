"use server";

import { redirect } from "next/navigation";
import { requireAuthUser } from "@/lib/auth-context";
import { companySchema, type CompanyInput } from "@/lib/validators/company";
import { CompanyService } from "@/services/company-service";

export async function upsertCompanyAction(input: CompanyInput) {
  const ctx = await requireAuthUser();

  const parsed = companySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid company data." };
  }

  const companyId = await CompanyService.upsertCompanyForUser(
    ctx,
    parsed.data
  );

  if (!ctx.companyId) {
    redirect("/dashboard");
  }

  return { success: true, companyId };
}

