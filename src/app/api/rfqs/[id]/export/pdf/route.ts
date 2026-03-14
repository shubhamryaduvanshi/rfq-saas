import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { requireAuthUser } from "@/lib/auth-context";
import { RFQService } from "@/services/rfq-service";

interface RouteParams {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireAuthUser({ requireCompany: true });
    const data = await RFQService.getRFQ(ctx, params.id);

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { rfq, items } = data as any;
    const columnConfig = (rfq as any).columnConfig;
    const columns = Array.isArray(columnConfig?.columns)
      ? columnConfig.columns
      : [];

    const buffer: Buffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Uint8Array[] = [];

      doc.on("data", (chunk) => {
        chunks.push(chunk);
      });

      doc.on("end", () => {
        // eslint-disable-next-line n/no-unsupported-features/node-builtins
        resolve(Buffer.concat(chunks));
      });

      doc.on("error", (err) => {
        reject(err);
      });

      doc.fontSize(18).text(`RFQ ${rfq.number}`, { bold: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(rfq.title);
      doc.moveDown();

      doc.fontSize(10);
      doc.text(`Vendor: ${rfq.vendorName}`);
      if (rfq.vendorEmail) {
        doc.text(`Email: ${rfq.vendorEmail}`);
      }
      if (rfq.vendorContact) {
        doc.text(`Contact: ${rfq.vendorContact}`);
      }
      doc.text(
        `Date: ${
          rfq.date instanceof Date ? rfq.date.toISOString() : String(rfq.date)
        }`
      );
      doc.text(`Status: ${rfq.status}`);
      doc.moveDown();

      if (rfq.remarks) {
        doc.fontSize(10).text("Remarks:", { underline: true });
        doc.moveDown(0.25);
        doc.text(rfq.remarks, { width: 500 });
        doc.moveDown();
      }

      if (columns.length && items.length) {
        doc.fontSize(10).text("Line items", { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const rowHeight = 18;
        const firstColumnWidth = 30;
        const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right - firstColumnWidth;
        const columnWidth = availableWidth / Math.max(columns.length, 1);

        function drawRow(
          y: number,
          values: (string | number)[],
          isHeader = false
        ) {
          doc.fontSize(9);
          values.forEach((val, index) => {
            const xOffset =
              doc.page.margins.left +
              (index === 0 ? 0 : firstColumnWidth + (index - 1) * columnWidth);
            const width = index === 0 ? firstColumnWidth : columnWidth;

            if (isHeader) {
              doc
                .rect(xOffset, y, width, rowHeight)
                .fill("#F4F4F5")
                .stroke("#E5E7EB");
              doc
                .fillColor("#111827")
                .text(String(val), xOffset + 4, y + 5, {
                  width: width - 8,
                  align: "left",
                });
            } else {
              doc
                .rect(xOffset, y, width, rowHeight)
                .stroke("#E5E7EB");
              doc
                .fillColor("#111827")
                .text(String(val), xOffset + 4, y + 5, {
                  width: width - 8,
                  align: "left",
                });
            }
          });
          doc.fillColor("#111827");
        }

        drawRow(
          tableTop,
          ["#", ...columns.map((col: any) => String(col.label))],
          true
        );

        let currentY = tableTop + rowHeight;
        items.forEach((item: any) => {
          const values = item.values || {};
          const rowValues = columns.map((col: any) => {
            const raw = values[col.id];
            if (raw == null) return "";
            if (Array.isArray(raw)) return raw.join(", ");
            return String(raw);
          });

          if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            currentY = doc.page.margins.top;
            drawRow(
              currentY,
              ["#", ...columns.map((col: any) => String(col.label))],
              true
            );
            currentY += rowHeight;
          }

          drawRow(currentY, [item.position, ...rowValues]);
          currentY += rowHeight;
        });
      }

      doc.end();
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rfq-${(data as any).rfq.number}.pdf"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to export RFQ to PDF" },
      { status: 500 }
    );
  }
}

