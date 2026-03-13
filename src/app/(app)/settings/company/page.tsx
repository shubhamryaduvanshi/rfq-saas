import { requireAuthUser } from "@/lib/auth-context";
import { Company } from "@/models/Company";
import { connectDB } from "@/lib/db";
import { CompanyForm } from "@/features/company/components/CompanyForm";

export default async function CompanySettingsPage() {
  const ctx = await requireAuthUser();

  let initial: any = undefined;
  if (ctx.companyId) {
    await connectDB();
    const company = await Company.findById(ctx.companyId).lean().exec();
    if (company) {
      initial = {
        name: company.name,
        contactPerson: company.contactPerson,
        email: company.email,
        mobile: company.mobile,
        address: company.address,
        gstOrRegNo: company.gstOrRegNo,
        logoUrl: company.logoUrl,
        website: company.website,
        tagline: company.tagline,
        paymentDetails: company.paymentDetails,
      };
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Company</h1>
      <p className="text-sm text-zinc-600">
        Set up your company details. These appear on RFQ documents.
      </p>
      <div className="rounded border bg-white p-4">
        <CompanyForm initial={initial} />
      </div>
    </div>
  );
}

