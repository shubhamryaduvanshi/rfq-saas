import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Company } from "@/models/Company";
import { User } from "@/models/User";
import { RFQColumnConfig } from "@/models/RFQColumnConfig";
import { getDefaultRFQColumns } from "@/models/rfq-default-columns";
import { Template } from "@/models/Template";
import type { AuthUserContext } from "@/lib/auth-context";
import type { CompanyInput } from "@/lib/validators/company";

export class CompanyService {
  static async upsertCompanyForUser(ctx: AuthUserContext, input: CompanyInput) {
    await connectDB();

    let companyId = ctx.companyId
      ? new Types.ObjectId(ctx.companyId)
      : undefined;

    if (!companyId) {
      const company = await Company.create({
        name: input.name,
        contactPerson: input.contactPerson,
        email: input.email,
        mobile: input.mobile,
        address: input.address,
        gstOrRegNo: input.gstOrRegNo,
        logoUrl: input.logoUrl ?? undefined,
        website: input.website ?? undefined,
        tagline: input.tagline ?? undefined,
        paymentDetails: input.paymentDetails ?? undefined,
      });

      companyId = company._id;

      console.log("COMPANY OBJECT:::", company);


      await User.findByIdAndUpdate(ctx.userId, {
        $set: { companyId: companyId },
      }).exec();

      const existingConfig = await RFQColumnConfig.findOne({
        company: companyId,
        isDefault: true,
      }).exec();

      if (!existingConfig) {
        await RFQColumnConfig.create({
          company: companyId,
          name: "Default RFQ Columns",
          columns: getDefaultRFQColumns(),
          isDefault: true,
        });
      }

      const existingTemplates = await Template.find({
        company: companyId,
      }).countDocuments();

      if (existingTemplates === 0) {
        await Template.create([
          {
            company: companyId,
            key: "minimal",
            name: "Minimal",
            description: "Clean, minimal RFQ layout",
            isDefault: true,
          },
          {
            company: companyId,
            key: "corporate",
            name: "Corporate",
            description: "Formal corporate RFQ layout",
            isDefault: false,
          },
          {
            company: companyId,
            key: "detailed",
            name: "Detailed",
            description: "Detailed RFQ with extra fields",
            isDefault: false,
          },
        ]);
      }
    } else {
      await Company.findByIdAndUpdate(
        companyId,
        {
          $set: {
            name: input.name,
            contactPerson: input.contactPerson,
            email: input.email,
            mobile: input.mobile,
            address: input.address,
            gstOrRegNo: input.gstOrRegNo,
            logoUrl: input.logoUrl ?? undefined,
            website: input.website ?? undefined,
            tagline: input.tagline ?? undefined,
            paymentDetails: input.paymentDetails ?? undefined,
          },
        },
        { new: true }
      ).exec();
    }

    return companyId!.toString();
  }
}

