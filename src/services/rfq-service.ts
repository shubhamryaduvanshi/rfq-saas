import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { RFQ } from "@/models/RFQ";
import { RFQItem } from "@/models/RFQItem";
import { RFQColumnConfig } from "@/models/RFQColumnConfig";
import type { AuthUserContext } from "@/lib/auth-context";
import type { RFQListItem } from "@/types/rfq";
import {
  type CreateRFQInput,
  type UpdateRFQInput,
} from "@/lib/validators/rfq";
import { generateRFQNumber } from "@/utils/rfq-number";

export class RFQService {
  static async listRFQs(
    ctx: AuthUserContext,
    params: { page?: number; pageSize?: number; status?: string }
  ): Promise<{ data: RFQListItem[]; total: number }> {
    await connectDB();

    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 10));

    const query: any = { company: ctx.companyId };
    if (params.status) {
      query.status = params.status;
    }

    const [items, total] = await Promise.all([
      RFQ.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec(),
      RFQ.countDocuments(query).exec(),
    ]);

    const data: RFQListItem[] = items.map((doc) => ({
      id: doc._id.toString(),
      title: doc.title,
      number: doc.number,
      date: doc.date.toISOString(),
      vendorName: doc.vendorName,
      status: doc.status,
      templateId: doc.template.toString(),
    }));

    return { data, total };
  }

  static async getRFQ(ctx: AuthUserContext, rfqId: string) {
    await connectDB();

    if (!Types.ObjectId.isValid(rfqId)) return null;

    const rfq = await RFQ.findOne({
      _id: rfqId,
      company: ctx.companyId,
    })
      .populate("template")
      .populate("columnConfig")
      .lean()
      .exec();

    if (!rfq) return null;

    const items = await RFQItem.find({
      rfq: rfq._id,
      company: ctx.companyId,
    })
      .sort({ position: 1 })
      .lean()
      .exec();

    return { rfq, items };
  }

  static async createRFQ(ctx: AuthUserContext, input: CreateRFQInput) {
    await connectDB();

    if (!ctx.companyId) {
      throw new Error("Company context is required to create RFQs.");
    }

    const number = generateRFQNumber(ctx.companyId);

    const date =
      input.date && !Number.isNaN(Date.parse(input.date))
        ? new Date(input.date)
        : new Date();

    const rfq = await RFQ.create({
      company: new Types.ObjectId(ctx.companyId),
      createdBy: new Types.ObjectId(ctx.userId),
      title: input.title,
      number,
      date,
      vendorName: input.vendorName,
      remarks: input.remarks ?? undefined,
      status: "draft",
      template: new Types.ObjectId(input.templateId),
      columnConfig: new Types.ObjectId(input.columnConfigId),
      vendorEmail: input.vendorEmail ?? undefined,
      vendorContact: input.vendorContact ?? undefined,
    });

    return rfq;
  }

  static async updateRFQ(
    ctx: AuthUserContext,
    rfqId: string,
    input: UpdateRFQInput
  ) {
    await connectDB();

    if (!Types.ObjectId.isValid(rfqId)) {
      throw new Error("Invalid RFQ id.");
    }

    const update: any = {};
    if (input.title !== undefined) update.title = input.title;
    if (input.vendorName !== undefined) update.vendorName = input.vendorName;
    if (input.date !== undefined) {
      update.date = !Number.isNaN(Date.parse(input.date))
        ? new Date(input.date)
        : new Date();
    }
    if (input.remarks !== undefined) update.remarks = input.remarks;
    if (input.templateId !== undefined)
      update.template = new Types.ObjectId(input.templateId);
    if (input.columnConfigId !== undefined)
      update.columnConfig = new Types.ObjectId(input.columnConfigId);
    if (input.vendorEmail !== undefined) update.vendorEmail = input.vendorEmail;
    if (input.vendorContact !== undefined)
      update.vendorContact = input.vendorContact;
    if (input.status !== undefined) update.status = input.status;

    const rfq = await RFQ.findOneAndUpdate(
      { _id: rfqId, company: ctx.companyId },
      { $set: update },
      { new: true }
    ).exec();

    return rfq;
  }

  static async deleteRFQ(ctx: AuthUserContext, rfqId: string) {
    await connectDB();

    if (!Types.ObjectId.isValid(rfqId)) {
      throw new Error("Invalid RFQ id.");
    }

    const rfq = await RFQ.findOneAndDelete({
      _id: rfqId,
      company: ctx.companyId,
    }).exec();

    if (rfq) {
      await RFQItem.deleteMany({
        rfq: rfq._id,
        company: ctx.companyId,
      }).exec();
    }

    return rfq;
  }

  static async duplicateRFQ(ctx: AuthUserContext, rfqId: string) {
    await connectDB();

    if (!Types.ObjectId.isValid(rfqId)) {
      throw new Error("Invalid RFQ id.");
    }

    const original = await RFQ.findOne({
      _id: rfqId,
      company: ctx.companyId,
    }).exec();

    if (!original) {
      throw new Error("RFQ not found.");
    }

    const number = generateRFQNumber(ctx.companyId ?? "");

    const duplicate = await RFQ.create({
      company: original.company,
      createdBy: new Types.ObjectId(ctx.userId),
      title: `${original.title} (Copy)`,
      number,
      date: new Date(),
      vendorName: original.vendorName,
      remarks: original.remarks,
      status: "draft",
      template: original.template,
      columnConfig: original.columnConfig,
      vendorEmail: original.vendorEmail,
      vendorContact: original.vendorContact,
    });

    const items = await RFQItem.find({
      rfq: original._id,
      company: ctx.companyId,
    })
      .sort({ position: 1 })
      .lean()
      .exec();

    if (items.length > 0) {
      await RFQItem.insertMany(
        items.map((item) => ({
          company: item.company,
          rfq: duplicate._id,
          position: item.position,
          values: item.values,
        }))
      );
    }

    return duplicate;
  }
}

