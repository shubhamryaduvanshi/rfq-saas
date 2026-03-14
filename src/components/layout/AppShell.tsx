import Link from "next/link";
import type { AuthUserContext } from "@/lib/auth-context";

interface AppShellProps {
  user: AuthUserContext;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="text-sm font-semibold">
            RFQ SaaS
          </Link>
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <span>{user.email}</span>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl gap-6 p-4">
        <nav className="w-48 shrink-0 space-y-2 text-sm bg-blue-300 rounded-2xl min-h-[85vh] p-4">
          <Link href="/dashboard" className="block text-zinc-800">
            Dashboard
          </Link>
          <Link href="/rfqs" className="block text-zinc-800">
            RFQs
          </Link>
          <Link href="/settings/company" className="block text-zinc-800">
            Company
          </Link>
          {/* <Link href="/settings/templates" className="block text-zinc-800">
            Templates
          </Link>
          <Link href="/settings/profile" className="block text-zinc-800">
            Profile
          </Link> */}
        </nav>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

