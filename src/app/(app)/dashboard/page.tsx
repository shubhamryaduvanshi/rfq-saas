import { requireAuthUser } from "@/lib/auth-context";
import { RFQService } from "@/services/rfq-service";

export default async function DashboardPage() {
  const ctx = await requireAuthUser({ requireCompany: true });

  const { data, total } = await RFQService.listRFQs(ctx, {
    page: 1,
    pageSize: 5,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <section className="rounded border bg-white p-4">
        <h2 className="text-sm font-semibold mb-2">RFQ summary</h2>
        <p className="text-sm text-zinc-600">
          You have <span className="font-semibold">{total}</span> RFQs.
        </p>
      </section>
      <section className="rounded border bg-white p-4">
        <h2 className="text-sm font-semibold mb-3">Recent RFQs</h2>
        {data.length === 0 ? (
          <p className="text-sm text-zinc-600">No RFQs yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.map((rfq) => (
              <li key={rfq.id} className="flex items-center justify-between">
                <span>
                  {rfq.number} — {rfq.title}
                </span>
                <span className="text-xs text-zinc-500">{rfq.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

