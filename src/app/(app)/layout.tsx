import type { ReactNode } from "react";
import { requireAuthUser } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAuthUser();

  return <AppShell user={user}>{children}</AppShell>;
}

