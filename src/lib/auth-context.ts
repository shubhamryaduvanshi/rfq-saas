import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export type UserRole = "owner" | "admin" | "member";

export interface AuthUserContext {
  userId: string;
  companyId: string | null;
  role: UserRole;
  email: string;
  name?: string;
}

export async function requireAuthUser(options?: { requireCompany?: boolean }) {

  const session = await getServerSession(authOptions);
  console.log("sessions:<><>><:", session);

  if (!session || !session.user || !(session.user as any).id) {
    redirect("/login");
  }

  const ctx: AuthUserContext = {
    userId: (session.user as any).id,
    companyId: (session.user as any).company ?? null,
    role: ((session.user as any).role ?? "member") as UserRole,
    email: session.user.email!,
    name: session.user.name ?? undefined,
  };

  if (options?.requireCompany && !ctx.companyId) {
    redirect("/settings/company");
  }

  return ctx;
}

