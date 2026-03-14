"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { RFQStatus } from "@/types/rfq";

type TemplateOption = {
  id: string;
  key: string;
  name: string;
  isDefault: boolean;
};

type ColumnConfigOption = {
  id: string;
  name: string;
  isDefault: boolean;
};

type RFQHeader = {
  id: string;
  title: string;
  number: string;
  date: string;
  vendorName: string;
  remarks: string;
  status: RFQStatus;
  templateId: string;
  columnConfigId: string;
  vendorEmail: string;
  vendorContact: string;
};

type RFQItemRow = {
  id: string;
  position: number;
  values: {
    productName?: string;
    imageUrl?: string | null;
    rate?: number | null;
    quantity?: number | null;
    amount?: number | null;
    remark?: string | null;
    discount?: number | null;
    finalAmount?: number | null;
  };
};

type EditableItem = {
  id: string;
  position: number;
  productName: string;
  imageUrl: string;
  rate: number | "";
  quantity: number | "";
  amount: number;
  remark: string;
  discount: number | "";
  finalAmount: number;
  isNew?: boolean;
  isDeleted?: boolean;
};

interface RFQEditFormProps {
  rfq: RFQHeader;
  templates: TemplateOption[];
  columnConfigs: ColumnConfigOption[];
  columns: any[];
  items: RFQItemRow[];
}

function toEditableItem(item: RFQItemRow): EditableItem {
  const v = item.values ?? {};
  const rate = v.rate ?? "";
  const quantity = v.quantity ?? "";
  const rateNum = typeof rate === "number" ? rate : 0;
  const qtyNum = typeof quantity === "number" ? quantity : 0;
  const amount = rateNum * qtyNum;
  const discountNum = typeof v.discount === "number" ? v.discount : 0;
  const finalAmount = Math.max(amount - discountNum, 0);

  return {
    id: item.id,
    position: item.position,
    productName: v.productName ?? "",
    imageUrl: v.imageUrl ?? "",
    rate,
    quantity,
    amount,
    remark: v.remark ?? "",
    discount: v.discount ?? "",
    finalAmount,
  };
}

export function RFQEditForm({
  rfq,
  templates,
  columnConfigs,
  columns,
  items: initialItems,
}: RFQEditFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(rfq.title);
  const [vendorName, setVendorName] = useState(rfq.vendorName);
  const [date, setDate] = useState(rfq.date);
  const [remarks, setRemarks] = useState(rfq.remarks);
  const [status, setStatus] = useState<RFQStatus>(rfq.status);
  const [templateId, setTemplateId] = useState(rfq.templateId);
  const [columnConfigId, setColumnConfigId] = useState(rfq.columnConfigId);
  const [vendorEmail, setVendorEmail] = useState(rfq.vendorEmail);
  const [vendorContact, setVendorContact] = useState(rfq.vendorContact);

  const [editableItems, setEditableItems] = useState<EditableItem[]>(
    () => initialItems.map(toEditableItem)
  );

  const [showImage, setShowImage] = useState(false);
  const [showRemark, setShowRemark] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [uploadingImageRow, setUploadingImageRow] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = useMemo(
    () => editableItems.reduce((sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0), 0),
    [editableItems]
  );

  const totalDiscount = useMemo(
    () => editableItems.reduce((sum, item) => sum + (typeof item.discount === "number" ? item.discount : 0), 0),
    [editableItems]
  );

  const grandTotal = useMemo(
    () => editableItems.reduce((sum, item) => sum + (Number.isFinite(item.finalAmount) ? item.finalAmount : 0), 0),
    [editableItems]
  );

  function updateItem(id: string, patch: Partial<EditableItem>) {
    setEditableItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const merged = { ...item, ...patch };

        const rateNum = typeof merged.rate === "number" ? merged.rate : 0;
        const qtyNum = typeof merged.quantity === "number" ? merged.quantity : 0;
        const discountNum = typeof merged.discount === "number" ? merged.discount : 0;
        const amount = Number.isFinite(rateNum * qtyNum) ? rateNum * qtyNum : 0;
        const finalAmount = Math.max(amount - discountNum, 0);

        return { ...merged, amount, finalAmount };
      })
    );
  }

  function addRow() {
    const newId = `new-${Date.now()}`;
    setEditableItems((prev) => [
      ...prev,
      {
        id: newId,
        position: prev.length + 1,
        productName: "",
        imageUrl: "",
        rate: "",
        quantity: "",
        amount: 0,
        remark: "",
        discount: "",
        finalAmount: 0,
        isNew: true,
      },
    ]);
  }

  function removeRow(id: string) {
    setEditableItems((prev) =>
      prev.length === 1 ? prev : prev.filter((item) => item.id !== id)
    );
  }

  async function handleImageUpload(rowId: string, file: File | null) {
    if (!file) return;
    setUploadingImageRow(rowId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/rfq-item-image", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) { alert("Failed to upload image."); return; }
      const data = (await res.json()) as { url: string };
      updateItem(rowId, { imageUrl: data.url });
    } catch (err) {
      console.error(err);
      alert("Unexpected error while uploading image.");
    } finally {
      setUploadingImageRow(null);
    }
  }

  async function handleUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !vendorName.trim()) {
      setError("Title and vendor name are required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/rfqs/${rfq.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          vendorName: vendorName.trim(),
          date,
          remarks: remarks.trim() || undefined,
          status,
          templateId: templateId || undefined,
          columnConfigId: columnConfigId || undefined,
          vendorEmail: vendorEmail.trim() || undefined,
          vendorContact: vendorContact.trim() || undefined,
          items: editableItems
            .filter((item) => item.productName.trim() || item.rate || item.quantity)
            .map((item, index) => ({
              id: item.isNew ? undefined : item.id,
              position: index + 1,
              productName: item.productName.trim(),
              imageUrl: showImage ? item.imageUrl || undefined : undefined,
              rate: typeof item.rate === "number" ? item.rate : undefined,
              quantity: typeof item.quantity === "number" ? item.quantity : undefined,
              amount: item.amount || undefined,
              remark: showRemark ? item.remark.trim() || undefined : undefined,
              discount: showDiscount && typeof item.discount === "number" ? item.discount : undefined,
              finalAmount: item.finalAmount || undefined,
            })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Something went wrong while updating the RFQ.");
        setSaving(false);
        return;
      }

      router.refresh();
      setSaving(false);
    } catch (err) {
      console.error(err);
      setError("Unexpected error while updating the RFQ.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this RFQ? This cannot be undone.")) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/rfqs/${rfq.id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Something went wrong while deleting the RFQ.");
        setDeleting(false);
        return;
      }

      router.push("/rfqs");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Unexpected error while deleting the RFQ.");
      setDeleting(false);
    }
  }

  function handleExportExcel() {
    window.open(`/api/rfqs/${rfq.id}/export/excel`, "_blank");
  }

  function handleExportPdf() {
    window.open(`/api/rfqs/${rfq.id}/export/pdf`, "_blank");
  }

  return (
    <div className="space-y-6">
      {/* Status + actions bar */}
      <section className="rounded border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">RFQ status</p>
            <p className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-800">
              {status}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleExportExcel}
              className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50">
              Export Excel
            </button>
            <button type="button" onClick={handleExportPdf}
              className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50">
              Export PDF
            </button>
            <button type="button" onClick={handleDelete} disabled={deleting}
              className="rounded border border-red-500 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70">
              {deleting ? "Deleting…" : "Delete RFQ"}
            </button>
          </div>
        </div>
      </section>

      {/* Main form */}
      <section className="rounded border bg-white p-4">
        <form onSubmit={handleUpdate} className="space-y-4">
          {/* Header fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">RFQ title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">Vendor name</label>
              <input type="text" value={vendorName} onChange={(e) => setVendorName(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" required />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">RFQ date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">Vendor email</label>
              <input type="email" value={vendorEmail} onChange={(e) => setVendorEmail(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">Vendor contact</label>
              <input type="text" value={vendorContact} onChange={(e) => setVendorContact(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as RFQStatus)}
                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900">
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="responded">Responded</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">Template</label>
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}
                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900">
                <option value="">— None —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}{t.isDefault ? " • Default" : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">Column configuration</label>
              <select value={columnConfigId} onChange={(e) => setColumnConfigId(e.target.value)}
                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900">
                <option value="">— None —</option>
                {columnConfigs.map((cfg) => (
                  <option key={cfg.id} value={cfg.id}>{cfg.name}{cfg.isDefault ? " • Default" : ""}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">Internal notes</label>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3}
              className="w-full resize-none rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
          </div>

          {/* Line items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Line items</h3>
                <p className="mt-1 text-xs text-zinc-600">
                  Amounts update automatically based on rate, quantity, and discount.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-xs text-zinc-700">
                  <input type="checkbox" checked={showImage} onChange={(e) => setShowImage(e.target.checked)}
                    className="h-3 w-3 rounded border-zinc-300" />
                  Image
                </label>
                <label className="flex items-center gap-1 text-xs text-zinc-700">
                  <input type="checkbox" checked={showRemark} onChange={(e) => setShowRemark(e.target.checked)}
                    className="h-3 w-3 rounded border-zinc-300" />
                  Remark
                </label>
                <label className="flex items-center gap-1 text-xs text-zinc-700">
                  <input type="checkbox" checked={showDiscount} onChange={(e) => setShowDiscount(e.target.checked)}
                    className="h-3 w-3 rounded border-zinc-300" />
                  Discount
                </label>
                <button type="button" onClick={addRow}
                  className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50">
                  + Add row
                </button>
              </div>
            </div>

            <div className="overflow-auto rounded border">
              <table className="min-w-full border-collapse text-xs">
                <thead className="bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="border-b border-r px-2 py-2 text-left">#</th>
                    <th className="border-b border-r px-2 py-2 text-left">Product / service</th>
                    {showImage && <th className="border-b border-r px-2 py-2 text-left">Image</th>}
                    <th className="border-b border-r px-2 py-2 text-right">Rate</th>
                    <th className="border-b border-r px-2 py-2 text-right">Qty</th>
                    <th className="border-b border-r px-2 py-2 text-right">Amount</th>
                    {showRemark && <th className="border-b border-r px-2 py-2 text-left">Remark</th>}
                    {showDiscount && <th className="border-b border-r px-2 py-2 text-right">Discount</th>}
                    <th className="border-b px-2 py-2 text-right">Final amount</th>
                    <th className="border-b px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {editableItems.map((item, index) => (
                    <tr key={item.id} className="border-t last:border-b-0">
                      <td className="border-r px-2 py-1.5 align-top text-zinc-600">{index + 1}</td>
                      <td className="border-r px-2 py-1.5 align-top">
                        <input type="text" value={item.productName}
                          onChange={(e) => updateItem(item.id, { productName: e.target.value })}
                          placeholder="Product or service name"
                          className="w-56 rounded border border-zinc-200 px-2 py-1 text-xs outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
                      </td>
                      {showImage && (
                        <td className="border-r px-2 py-1.5 align-top">
                          <div className="flex flex-col gap-1">
                            <input type="file" accept="image/*"
                              onChange={(e) => handleImageUpload(item.id, e.target.files?.[0] ?? null)}
                              className="w-52 text-[11px] text-zinc-700 file:mr-2 file:rounded file:border-none file:bg-zinc-900 file:px-2 file:py-1 file:text-xs file:font-medium file:text-white" />
                            {uploadingImageRow === item.id && (
                              <span className="text-[10px] text-zinc-500">Uploading…</span>
                            )}
                            {item.imageUrl && (
                              <span className="truncate text-[10px] text-zinc-500">Saved</span>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="border-r px-2 py-1.5 align-top text-right">
                        <input type="number" min={0} step="0.01" value={item.rate}
                          onChange={(e) => updateItem(item.id, { rate: e.target.value === "" ? "" : Number(e.target.value) })}
                          className="w-24 rounded border border-zinc-200 px-2 py-1 text-right text-xs outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
                      </td>
                      <td className="border-r px-2 py-1.5 align-top text-right">
                        <input type="number" min={0} step="1" value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: e.target.value === "" ? "" : Number(e.target.value) })}
                          className="w-20 rounded border border-zinc-200 px-2 py-1 text-right text-xs outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
                      </td>
                      <td className="border-r px-2 py-1.5 align-top text-right text-zinc-900">
                        {item.amount.toFixed(2)}
                      </td>
                      {showRemark && (
                        <td className="border-r px-2 py-1.5 align-top">
                          <input type="text" value={item.remark}
                            onChange={(e) => updateItem(item.id, { remark: e.target.value })}
                            placeholder="Internal remark or vendor feedback"
                            className="w-56 rounded border border-zinc-200 px-2 py-1 text-xs outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
                        </td>
                      )}
                      {showDiscount && (
                        <td className="border-r px-2 py-1.5 align-top text-right">
                          <input type="number" min={0} step="0.01" value={item.discount}
                            onChange={(e) => updateItem(item.id, { discount: e.target.value === "" ? "" : Number(e.target.value) })}
                            className="w-20 rounded border border-zinc-200 px-2 py-1 text-right text-xs outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900" />
                        </td>
                      )}
                      <td className="px-2 py-1.5 align-top text-right text-zinc-900">
                        {item.finalAmount.toFixed(2)}
                      </td>
                      <td className="px-2 py-1.5 align-top text-right">
                        <button type="button" onClick={() => removeRow(item.id)}
                          className="text-xs text-zinc-400 hover:text-red-500" aria-label="Remove row">
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-50 text-xs text-zinc-700">
                    <td className="border-t px-2 py-2" colSpan={5}>Totals</td>
                    <td className="border-t px-2 py-2 text-right">{subtotal.toFixed(2)}</td>
                    {showRemark && <td className="border-t px-2 py-2" />}
                    {showDiscount && (
                      <td className="border-t px-2 py-2 text-right">{totalDiscount.toFixed(2)}</td>
                    )}
                    <td className="border-t px-2 py-2 text-right font-semibold">{grandTotal.toFixed(2)}</td>
                    <td className="border-t px-2 py-2" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => router.push("/rfqs")}
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              Back to list
            </button>
            <button type="submit" disabled={saving}
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-70">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}