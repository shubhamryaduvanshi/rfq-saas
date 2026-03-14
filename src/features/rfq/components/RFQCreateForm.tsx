"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthUserContext, requireAuthUser } from "@/lib/auth-context";

interface RFQCreateFormProps {
  ctx: AuthUserContext
}

type LineItem = {
  id: string;
  productName: string;
  imageUrl: string;
  rate: number | "";
  quantity: number | "";
  amount: number;
  remark: string;
  discount: number | "";
  finalAmount: number;
};

export function RFQCreateForm({ ctx }: RFQCreateFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [vendorContact, setVendorContact] = useState("");

  const [items, setItems] = useState<LineItem[]>([
    {
      id: "1",
      productName: "",
      imageUrl: "",
      rate: "",
      quantity: "",
      amount: 0,
      remark: "",
      discount: "",
      finalAmount: 0,
    },
  ]);

  const [showImage, setShowImage] = useState(false);
  const [showRemark, setShowRemark] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImageRow, setUploadingImageRow] = useState<string | null>(
    null
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + (Number.isFinite(item.amount) ? item.amount : 0),
        0
      ),
    [items]
  );

  const totalDiscount = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          (typeof item.discount === "number" &&
            Number.isFinite(item.discount)
            ? item.discount
            : 0),
        0
      ),
    [items]
  );

  const grandTotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          (Number.isFinite(item.finalAmount) ? item.finalAmount : 0),
        0
      ),
    [items]
  );

  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const merged: LineItem = { ...item, ...patch };

        const rateNumber =
          typeof merged.rate === "number"
            ? merged.rate
            : merged.rate === ""
              ? 0
              : Number(merged.rate);
        const qtyNumber =
          typeof merged.quantity === "number"
            ? merged.quantity
            : merged.quantity === ""
              ? 0
              : Number(merged.quantity);
        const discountNumber =
          typeof merged.discount === "number"
            ? merged.discount
            : merged.discount === ""
              ? 0
              : Number(merged.discount);

        const amount = Number.isFinite(rateNumber * qtyNumber)
          ? rateNumber * qtyNumber
          : 0;
        const finalAmount = Math.max(
          amount -
          (Number.isFinite(discountNumber) ? discountNumber : 0),
          0
        );

        return {
          ...merged,
          amount,
          finalAmount,
        };
      })
    );
  }

  function addRow() {
    setItems((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        productName: "",
        imageUrl: "",
        rate: "",
        quantity: "",
        amount: 0,
        remark: "",
        discount: "",
        finalAmount: 0,
      },
    ]);
  }

  function removeRow(id: string) {
    setItems((prev) =>
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
      if (!res.ok) {
        // eslint-disable-next-line no-alert
        alert("Failed to upload image. Please try again.");
        return;
      }
      const data = (await res.json()) as { url: string };
      updateItem(rowId, { imageUrl: data.url });
    } catch (err) {
      console.error(err);
      // eslint-disable-next-line no-alert
      alert("Unexpected error while uploading image.");
    } finally {
      setUploadingImageRow(null);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !vendorName.trim()) {
      setError("Title and vendor name are required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        vendorName: vendorName.trim(),
        date,
        remarks: remarks.trim() || undefined,
        vendorEmail: vendorEmail.trim() || undefined,
        vendorContact: vendorContact.trim() || undefined,
        items: items
          .filter(
            (item) =>
              item.productName.trim() || item.rate || item.quantity
          )
          .map((item, index) => ({
            position: index + 1,
            productName: item.productName.trim(),
            imageUrl: showImage ? item.imageUrl || undefined : undefined,
            rate:
              typeof item.rate === "number"
                ? item.rate
                : item.rate === ""
                  ? undefined
                  : Number(item.rate),
            quantity:
              typeof item.quantity === "number"
                ? item.quantity
                : item.quantity === ""
                  ? undefined
                  : Number(item.quantity),
            amount: item.amount || undefined,
            remark: showRemark
              ? item.remark.trim() || undefined
              : undefined,
            discount:
              showDiscount && item.discount !== ""
                ? typeof item.discount === "number"
                  ? item.discount
                  : Number(item.discount)
                : undefined,
            finalAmount: item.finalAmount || undefined,
          })),
      };

      const res = await fetch("/api/rfqs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(
          data?.error ||
          "Something went wrong while creating the RFQ. Please try again."
        );
        setSubmitting(false);
        return;
      }

      const data = (await res.json()) as { id: string };
      router.push(`/rfqs/${data.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Unexpected error while creating the RFQ.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded border bg-white p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                RFQ title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q2 hardware refresh"
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Vendor name
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Vendor or supplier name"
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                RFQ date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Vendor email
              </label>
              <input
                type="email"
                value={vendorEmail}
                onChange={(e) => setVendorEmail(e.target.value)}
                placeholder="name@vendor.com"
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Vendor contact
              </label>
              <input
                type="text"
                value={vendorContact}
                onChange={(e) => setVendorContact(e.target.value)}
                placeholder="+1 555 000 1234"
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          {/* <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Internal notes (optional)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Share context or evaluation notes with your team."
                rows={3}
                className="w-full resize-none rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div> */}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  Line items
                </h3>
                <p className="mt-1 text-xs text-zinc-600">
                  Add products or services to this RFQ. Amounts update
                  automatically based on rate, quantity, and discount.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-xs text-zinc-700">
                  <input
                    type="checkbox"
                    checked={showImage}
                    onChange={(e) => setShowImage(e.target.checked)}
                    className="h-3 w-3 rounded border-zinc-300 text-zinc-900"
                  />
                  Image
                </label>
                <label className="flex items-center gap-1 text-xs text-zinc-700">
                  <input
                    type="checkbox"
                    checked={showRemark}
                    onChange={(e) => setShowRemark(e.target.checked)}
                    className="h-3 w-3 rounded border-zinc-300 text-zinc-900"
                  />
                  Remark
                </label>
                <label className="flex items-center gap-1 text-xs text-zinc-700">
                  <input
                    type="checkbox"
                    checked={showDiscount}
                    onChange={(e) => setShowDiscount(e.target.checked)}
                    className="h-3 w-3 rounded border-zinc-300 text-zinc-900"
                  />
                  Discount
                </label>
                <button
                  type="button"
                  onClick={addRow}
                  className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                >
                  + Add row
                </button>
              </div>
            </div>

            <div className="overflow-auto rounded border">
              <table className="min-w-full border-collapse text-xs">
                <thead className="bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="border-b border-r px-2 py-2 text-left">#</th>
                    <th className="border-b border-r px-2 py-2 text-left">
                      Product / service
                    </th>
                    {showImage && (
                      <th className="border-b border-r px-2 py-2 text-left">
                        Image (optional)
                      </th>
                    )}
                    <th className="border-b border-r px-2 py-2 text-right">
                      Rate
                    </th>
                    <th className="border-b border-r px-2 py-2 text-right">
                      Qty
                    </th>
                    <th className="border-b border-r px-2 py-2 text-right">
                      Amount
                    </th>
                    {showRemark && (
                      <th className="border-b border-r px-2 py-2 text-left">
                        Remark / feedback
                      </th>
                    )}
                    {showDiscount && (
                      <th className="border-b border-r px-2 py-2 text-right">
                        Discount
                      </th>
                    )}
                    <th className="border-b px-2 py-2 text-right">
                      Final amount
                    </th>
                    <th className="border-b px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="border-t last:border-b-0">
                      <td className="border-r px-2 py-1.5 align-top text-zinc-600">
                        {index + 1}
                      </td>
                      <td className="border-r px-2 py-1.5 align-top">
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) =>
                            updateItem(item.id, {
                              productName: e.target.value,
                            })
                          }
                          placeholder="Product or service name"
                          className="w-56 rounded border border-zinc-200 px-2 py-1 text-xs outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                        />
                      </td>
                      {/* {showImage && (
                        <td className="border-r px-2 py-1.5 align-top">
                          <div className="flex flex-col gap-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleImageUpload(
                                  item.id,
                                  e.target.files?.[0] ?? null
                                )
                              }
                              className="w-52 text-[11px] text-zinc-700 file:mr-2 file:rounded file:border-none file:bg-zinc-900 file:px-2 file:py-1 file:text-xs file:font-medium file:text-white"
                            />
                            {uploadingImageRow === item.id && (
                              <span className="text-[10px] text-zinc-500">
                                Uploading…
                              </span>
                            )}
                            {item.imageUrl && (
                              <span className="truncate text-[10px] text-zinc-500">
                                Saved
                              </span>
                            )}
                          </div>
                        </td>
                      )} */}
                      {showImage && (
                        <td className="border-r px-2 py-1.5 align-top">
                          <div className="flex flex-col gap-1">
                            {uploadingImageRow === item.id && (
                              <span className="text-[10px] text-zinc-500">Uploading…</span>
                            )}

                            {item.imageUrl && uploadingImageRow !== item.id ? (
                              <div className="relative h-14 w-14">
                                <img
                                  src={item.imageUrl}
                                  alt="Preview"
                                  className="h-14 w-14 rounded border border-zinc-200 object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateItem(item.id, { imageUrl: "" })}
                                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-800 text-[10px] text-white hover:bg-red-500"
                                  aria-label="Remove image"
                                >
                                  ×
                                </button>
                              </div>
                            ) : <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleImageUpload(item.id, e.target.files?.[0] ?? null)
                              }
                              className="w-52 text-[11px] text-zinc-700 file:mr-2 file:rounded file:border-none file:bg-zinc-900 file:px-2 file:py-1 file:text-xs file:font-medium file:text-white"
                            />}
                          </div>
                        </td>
                      )}
                      <td className="border-r px-2 py-1.5 align-top text-right">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.rate}
                          onChange={(e) =>
                            updateItem(item.id, {
                              rate: e.target.value === "" ? "" : Number(e.target.value),
                            })
                          }
                          className="w-24 rounded border border-zinc-200 px-2 py-1 text-right text-xs outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                        />
                      </td>
                      <td className="border-r px-2 py-1.5 align-top text-right">
                        <input
                          type="number"
                          min={0}
                          step="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, {
                              quantity:
                                e.target.value === "" ? "" : Number(e.target.value),
                            })
                          }
                          className="w-20 rounded border border-zinc-200 px-2 py-1 text-right text-xs outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                        />
                      </td>
                      <td className="border-r px-2 py-1.5 align-top text-right text-zinc-900">
                        {item.amount.toFixed(2)}
                      </td>
                      {showRemark && (
                        <td className="border-r px-2 py-1.5 align-top">
                          <input
                            type="text"
                            value={item.remark}
                            onChange={(e) =>
                              updateItem(item.id, {
                                remark: e.target.value,
                              })
                            }
                            placeholder="Internal remark or vendor feedback"
                            className="w-56 rounded border border-zinc-200 px-2 py-1 text-xs outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                          />
                        </td>
                      )}
                      {showDiscount && (
                        <td className="border-r px-2 py-1.5 align-top text-right">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.discount}
                            onChange={(e) =>
                              updateItem(item.id, {
                                discount:
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value),
                              })
                            }
                            className="w-20 rounded border border-zinc-200 px-2 py-1 text-right text-xs outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                          />
                        </td>
                      )}
                      <td className="px-2 py-1.5 align-top text-right text-zinc-900">
                        {item.finalAmount.toFixed(2)}
                      </td>
                      <td className="px-2 py-1.5 align-top text-right">
                        <button
                          type="button"
                          onClick={() => removeRow(item.id)}
                          className="text-xs text-zinc-400 hover:text-red-500"
                          aria-label="Remove row"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-50 text-xs text-zinc-700">
                    <td className="border-t px-2 py-2" colSpan={5}>
                      Totals
                    </td>
                    <td className="border-t px-2 py-2 text-right">
                      {subtotal.toFixed(2)}
                    </td>
                    <td className="border-t px-2 py-2" />
                    {showDiscount && (
                      <td className="border-t px-2 py-2 text-right">
                        {totalDiscount.toFixed(2)}
                      </td>
                    )}
                    <td className="border-t px-2 py-2 text-right font-semibold">
                      {grandTotal.toFixed(2)}
                    </td>
                    <td className="border-t px-2 py-2" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/rfqs")}
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Creating…" : "Create RFQ"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

