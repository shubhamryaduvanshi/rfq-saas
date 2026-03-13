"use client";

import { useState, type FormEvent } from "react";
import { signupSchema } from "@/lib/validators/auth";
import { signupAction } from "@/features/auth/actions";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const raw = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
    };

    const parsed = signupSchema.safeParse(raw);
    if (!parsed.success) {
      setError("Please check your inputs.");
      return;
    }

    setLoading(true);
    try {
      await signupAction(parsed.data);
    } catch {
      setError("Failed to sign up. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input name="name" className="w-full rounded border px-3 py-2" required />
      </div>
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
        {loading ? "Creating account…" : "Sign up"}
      </button>
    </form>
  );
}

