import { requireAuthUser } from "@/lib/auth-context";
import { TemplateService } from "@/services/template-service";
import { ColumnConfigService } from "@/services/column-config-service";

export default async function NewRFQPage() {
  const ctx = await requireAuthUser({ requireCompany: true });
  const [templates, columnConfigs] = await Promise.all([
    TemplateService.listCompanyTemplates(ctx),
    ColumnConfigService.listCompanyColumnConfigs(ctx),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Create RFQ</h1>
      <div className="rounded border bg-white p-4 space-y-3 text-sm text-zinc-700">
        <p>
          RFQ creation form and dynamic product table UI will go here. For now,
          the backend APIs for RFQ creation are ready.
        </p>
        <p>
          Available templates:{" "}
          {templates.map((t) => t.name).join(", ") || "none"}
        </p>
        <p>
          Available column configs:{" "}
          {columnConfigs.map((c) => c.name).join(", ") || "none"}
        </p>
      </div>
    </div>
  );
}

