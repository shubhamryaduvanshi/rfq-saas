import { connectDB } from "@/lib/db";
import { Template } from "@/models/Template";
import type { AuthUserContext } from "@/lib/auth-context";

export class TemplateService {
  static async listCompanyTemplates(ctx: AuthUserContext) {
    await connectDB();
    if (!ctx.companyId) return [];

    const templates = await Template.find({
      company: ctx.companyId,
    })
      .sort({ isDefault: -1, name: 1 })
      .lean()
      .exec();

    return templates.map((t) => ({
      id: t._id.toString(),
      key: t.key,
      name: t.name,
      isDefault: t.isDefault,
    }));
  }
}

