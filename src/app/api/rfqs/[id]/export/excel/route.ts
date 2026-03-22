import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireAuthUser } from "@/lib/auth-context";
import { RFQService } from "@/services/rfq-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const ctx = await requireAuthUser({ requireCompany: true });
    const data = await RFQService.getRFQ(ctx, id);

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { rfq, items } = data as any;
    const columnConfig = (rfq as any).columnConfig;
    const columns = Array.isArray(columnConfig?.columns)
      ? columnConfig.columns
      : [];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("RFQ");

    sheet.columns = [
      { header: "Field", key: "field", width: 20 },
      { header: "Value", key: "value", width: 60 },
    ];

    sheet.addRow({ field: "RFQ Number", value: rfq.number });
    sheet.addRow({ field: "Title", value: rfq.title });
    sheet.addRow({
      field: "Date",
      value: rfq.date instanceof Date ? rfq.date.toISOString() : String(rfq.date),
    });
    sheet.addRow({ field: "Vendor", value: rfq.vendorName });
    sheet.addRow({ field: "Status", value: rfq.status });
    if (rfq.vendorEmail) {
      sheet.addRow({ field: "Vendor Email", value: rfq.vendorEmail });
    }
    if (rfq.vendorContact) {
      sheet.addRow({ field: "Vendor Contact", value: rfq.vendorContact });
    }
    if (rfq.remarks) {
      sheet.addRow({ field: "Remarks", value: rfq.remarks });
    }

    sheet.addRow({});
    sheet.addRow({ field: "Line items" });

    const headerRowIndex = sheet.rowCount + 1;
    const headerRow = sheet.addRow([
      "#",
      ...columns.map((col: any) => String(col.label)),
    ]);
    headerRow.font = { bold: true };

    items.forEach((item: any) => {
      const values = item.values || {};
      const rowValues = columns.map((col: any) => {
        const raw = values[col.id];
        if (raw == null) return "";
        if (Array.isArray(raw)) return raw.join(", ");
        return String(raw);
      });
      sheet.addRow([item.position, ...rowValues]);
    });

    sheet.getRow(headerRowIndex).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF4F4F5" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="rfq-${rfq.number}.xlsx"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to export RFQ to Excel" },
      { status: 500 }
    );
  }
}

