"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { loginSchema } from "@/lib/validators/auth";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const raw = {
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
    };

    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) {
      setError("Please check your credentials.");
      return;
    }

    setLoading(true);
    let res;
    try {
      console.log("Parsed Data::", parsed);

      res = await signIn("credentials", {
        ...parsed.data,
        redirect: true,
        callbackUrl,
      });
    } catch (error) {
      console.log("error while logging in:::", error);

    }

    if (res && (res as any).error) {
      setError("Invalid email or password.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          name="email"
          type="email"
          className="w-full rounded border px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          name="password"
          type="password"
          className="w-full rounded border px-3 py-2"
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-black px-3 py-2 text-white text-sm font-medium"
      >
        {loading ? "Logging in…" : "Login"}
      </button>
    </form>
  );
}

