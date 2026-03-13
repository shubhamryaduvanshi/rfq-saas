import { connectDB } from "@/lib/db";
import { RFQColumnConfig } from "@/models/RFQColumnConfig";
import type { AuthUserContext } from "@/lib/auth-context";

export class ColumnConfigService {
  static async listCompanyColumnConfigs(ctx: AuthUserContext) {
    await connectDB();
    if (!ctx.companyId) return [];

    const configs = await RFQColumnConfig.find({
      company: ctx.companyId,
    })
      .sort({ isDefault: -1, name: 1 })
      .lean()
      .exec();

    return configs.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      isDefault: c.isDefault,
    }));
  }
}

