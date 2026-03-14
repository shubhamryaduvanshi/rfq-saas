"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface RFQListActionsProps {
  id: string;
}

export function RFQListActions({ id }: RFQListActionsProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm("Delete this RFQ? This cannot be undone.")) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/rfqs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        // eslint-disable-next-line no-alert
        alert("Failed to delete RFQ.");
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      // eslint-disable-next-line no-alert
      alert("Unexpected error while deleting RFQ.");
    } finally {
      setLoadingId(null);
    }
  }

  function openExcel() {
    window.open(`/api/rfqs/${id}/export/excel`, "_blank");
  }

  function openPdf() {
    window.open(`/api/rfqs/${id}/export/pdf`, "_blank");
  }

  const isBusy = loadingId === id;

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={openExcel}
        className="rounded border border-zinc-200 px-1.5 py-1 text-[10px] font-medium text-zinc-600 hover:bg-zinc-50"
        title="Export Excel"
      >
        XLS
      </button>
      <button
        type="button"
        onClick={openPdf}
        className="rounded border border-zinc-200 px-1.5 py-1 text-[10px] font-medium text-zinc-600 hover:bg-zinc-50"
        title="Export PDF"
      >
        PDF
      </button>
      <Link
        href={`/rfqs/${id}`}
        className="rounded border border-zinc-200 px-1.5 py-1 text-[10px] font-medium text-zinc-600 hover:bg-zinc-50"
        title="Edit"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isBusy}
        className="rounded border border-red-500 px-1.5 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        title="Delete"
      >
        Del
      </button>
    </div>
  );
}

