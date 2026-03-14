import { notFound } from "next/navigation";
import { requireAuthUser } from "@/lib/auth-context";
import { RFQService } from "@/services/rfq-service";
import { TemplateService } from "@/services/template-service";
import { ColumnConfigService } from "@/services/column-config-service";
import { RFQEditForm } from "@/features/rfq/components/RFQEditForm";
import type { RFQStatus } from "@/types/rfq";

interface RFQDetailPageProps {
  params: { id: string };
}

export default async function RFQDetailPage({ params }: RFQDetailPageProps) {
  const ctx = await requireAuthUser({ requireCompany: true });
  const { id } = await params;

  const [rfqData, templates, columnConfigs] = await Promise.all([
    RFQService.getRFQ(ctx, id),
    TemplateService.listCompanyTemplates(ctx),
    ColumnConfigService.listCompanyColumnConfigs(ctx),
  ]);

  console.log("RFQ DATA::", rfqData);


  if (!rfqData) {
    notFound();
  }

  const { rfq, items } = rfqData;

  const header = {
    id: rfq._id.toString(),
    title: rfq.title,
    number: rfq.number,
    date: rfq.date.toISOString().slice(0, 10),
    vendorName: rfq.vendorName,
    remarks: rfq.remarks ?? "",
    status: rfq.status as RFQStatus,
    templateId: rfq.template ? rfq.template.toString() : "",
    columnConfigId: rfq.columnConfig ? rfq.columnConfig.toString() : "",
    vendorEmail: rfq.vendorEmail ?? "",
    vendorContact: rfq.vendorContact ?? "",
  };

  const columnConfigDoc: any = (rfq as any).columnConfig;
  const columns =
    columnConfigDoc && Array.isArray(columnConfigDoc.columns)
      ? columnConfigDoc.columns
      : [];

  const lineItems = items.map((item: any) => {
    const values = item.values || {};
    return {
      id: item._id.toString(),
      position: item.position,
      values: values as Record<string, unknown>,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            RFQ #{header.number}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {header.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Manage details, share with vendors, and export this RFQ.
          </p>
        </div>
      </div>

      <RFQEditForm
        rfq={header}
        templates={templates}
        columnConfigs={columnConfigs}
        columns={columns}
        items={lineItems}
      />
    </div>
  );
}

