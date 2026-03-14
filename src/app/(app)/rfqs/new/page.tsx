import { requireAuthUser } from "@/lib/auth-context";
import { RFQCreateForm } from "@/features/rfq/components/RFQCreateForm";

export default async function NewRFQPage() {
  const ctx = await requireAuthUser({ requireCompany: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create RFQ</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Start a new request for quotation by adding products, quantities and
            optional discounts.
          </p>
        </div>
      </div>

      <RFQCreateForm ctx={ctx} />
    </div>
  );
}


