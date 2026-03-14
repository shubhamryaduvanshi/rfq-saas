import Link from "next/link";
import { requireAuthUser } from "@/lib/auth-context";
import { RFQService } from "@/services/rfq-service";
import { RFQListActions } from "@/features/rfq/components/RFQListActions";

export default async function RFQListPage() {
  const ctx = await requireAuthUser({ requireCompany: true });

  const { data, total } = await RFQService.listRFQs(ctx, {
    page: 1,
    pageSize: 20,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">RFQs</h1>
        <Link
          href="/rfqs/new"
          className="rounded bg-black px-3 py-2 text-sm font-medium text-white"
        >
          Create RFQ
        </Link>
      </div>
      <div className="rounded border bg-white">
        {total === 0 ? (
          <div className="p-4 text-sm text-zinc-600">
            No RFQs yet. Click &quot;Create RFQ&quot; to get started.
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="border-b bg-zinc-50 text-left text-xs font-semibold text-zinc-600">
              <tr>
                <th className="px-3 py-2">RFQ #</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Vendor</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((rfq) => (
                <tr key={rfq.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2 align-middle text-xs text-zinc-600">
                    {rfq.number}
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <Link
                      href={`/rfqs/${rfq.id}`}
                      className="text-sm font-medium text-zinc-900"
                    >
                      {rfq.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2 align-middle text-sm text-zinc-700">
                    {rfq.vendorName}
                  </td>
                  <td className="px-3 py-2 align-middle text-xs uppercase text-zinc-500">
                    {rfq.status}
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <RFQListActions id={rfq.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

