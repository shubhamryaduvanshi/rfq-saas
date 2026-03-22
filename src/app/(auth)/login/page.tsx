import { LoginForm } from "@/features/auth/components/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold text-center">Login</h1>
        <Suspense fallback={'loading...'}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}

