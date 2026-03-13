"use client";

import { useState, type FormEvent } from "react";
import { companySchema } from "@/lib/validators/company";
import { upsertCompanyAction } from "@/features/company/actions";

interface CompanyFormProps {
  initial?: Partial<ReturnType<typeof companySchema["parse"]>>;
}

export function CompanyForm({ initial }: CompanyFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const raw = {
      name: String(formData.get("name") || ""),
      contactPerson: String(formData.get("contactPerson") || ""),
      email: String(formData.get("email") || ""),
      mobile: String(formData.get("mobile") || ""),
      address: String(formData.get("address") || ""),
      gstOrRegNo: String(formData.get("gstOrRegNo") || ""),
      logoUrl: String(formData.get("logoUrl") || ""),
      website: String(formData.get("website") || ""),
      tagline: String(formData.get("tagline") || ""),
      paymentDetails: String(formData.get("paymentDetails") || ""),
    };

    Object.keys(raw).forEach((key) => {
      if (!(raw as any)[key]) {
        (raw as any)[key] = undefined;
      }
    });

    const parsed = companySchema.safeParse(raw);
    if (!parsed.success) {
      setError("Please check your company details.");
      return;
    }

    setLoading(true);
    try {
      const res = await upsertCompanyAction(parsed.data);
      if (!res?.success) {
        setError(res?.error ?? "Failed to save company.");
        setLoading(false);
      }
    } catch {
      setError("Failed to save company.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Company Name</label>
          <input
            name="name"
            defaultValue={initial?.name}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Contact Person
          </label>
          <input
            name="contactPerson"
            defaultValue={initial?.contactPerson}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={initial?.email}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mobile</label>
          <input
            name="mobile"
            defaultValue={initial?.mobile}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <textarea
          name="address"
          defaultValue={initial?.address}
          className="w-full rounded border px-3 py-2"
          rows={3}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">
            GST / Reg Number
          </label>
          <input
            name="gstOrRegNo"
            defaultValue={initial?.gstOrRegNo}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Website</label>
          <input
            name="website"
            defaultValue={initial?.website}
            className="w-full rounded border px-3 py-2"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Tagline</label>
          <input
            name="tagline"
            defaultValue={initial?.tagline}
            className="w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Logo URL</label>
          <input
            name="logoUrl"
            defaultValue={initial?.logoUrl}
            className="w-full rounded border px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Payment Details
        </label>
        <textarea
          name="paymentDetails"
          defaultValue={initial?.paymentDetails}
          className="w-full rounded border px-3 py-2"
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-black px-3 py-2 text-white text-sm font-medium"
      >
        {loading ? "Saving…" : "Save company"}
      </button>
    </form>
  );
}

