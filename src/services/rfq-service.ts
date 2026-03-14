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
      templateId: doc.template ? doc.template.toString() : "",
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
      .lean({ virtuals: false })
      .exec();

    if (!rfq) return null;

    const items = await RFQItem.find({
      rfq: rfq._id,
      company: ctx.companyId,
    })
      .sort({ position: 1 })
      .lean({ virtuals: false })
      .exec();

    // Serialize ObjectIds to strings to avoid buffer objects in the client
    return {
      rfq: {
        ...rfq,
        _id: rfq._id.toString(),
        company: rfq.company.toString(),
        createdBy: rfq.createdBy?.toString() ?? null,
        template: rfq.template ? (rfq.template as any)._id?.toString() ?? rfq.template.toString() : null,
        columnConfig: rfq.columnConfig ? (rfq.columnConfig as any)._id?.toString() ?? rfq.columnConfig.toString() : null,
      },
      items: items.map((item) => ({
        ...item,
        _id: item._id.toString(),
        company: item.company.toString(),
        rfq: item.rfq.toString(),
      })),
    };
  }

  static async createRFQ(ctx: AuthUserContext, payload: CreateRFQInput) {
    await connectDB();

    if (!ctx.companyId) {
      throw new Error("Company is required for adding Quotation");
    }

    const date = !Number.isNaN(Date.parse(payload.date))
      ? new Date(payload.date)
      : new Date();

    let lastError: unknown;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const number = generateRFQNumber(ctx.companyId);

        const rfq: any = await RFQ.create({
          company: new Types.ObjectId(ctx.companyId),
          createdBy: new Types.ObjectId(ctx.userId),
          title: payload.title,
          number,
          date,
          vendorName: payload.vendorName,
          remarks: payload.remarks ?? undefined,
          status: "draft",
          vendorEmail: payload.vendorEmail ?? undefined,
          vendorContact: payload.vendorContact ?? undefined,
          ...(payload.templateId && {
            template: new Types.ObjectId(payload.templateId),
          }),
          ...(payload.columnConfigId && {
            columnConfig: new Types.ObjectId(payload.columnConfigId),
          }),
        });

        // if (payload.items && payload.items.length > 0) {
        //   await RFQItem.insertMany(
        //     payload.items.map((item) => ({
        //       company: new Types.ObjectId(ctx.companyId!),
        //       rfq: rfq._id,
        //       position: item.position,
        //       productName: item.productName,
        //       imageUrl: item.imageUrl ?? undefined,
        //       rate: item.rate,
        //       quantity: item.quantity,
        //       amount: item.amount,
        //       remark: item.remark ?? undefined,
        //       discount: item.discount,
        //       finalAmount: item.finalAmount,
        //     }))
        //   );
        // }

        if (payload.items && payload.items.length > 0) {
          await RFQItem.insertMany(
            payload.items.map((item) => ({
              company: new Types.ObjectId(ctx.companyId!),
              rfq: rfq._id,
              position: item.position,
              values: {
                productName: item.productName,
                imageUrl: item.imageUrl ?? undefined,
                rate: item.rate,
                quantity: item.quantity,
                amount: item.amount,
                remark: item.remark ?? undefined,
                discount: item.discount,
                finalAmount: item.finalAmount,
              },
            }))
          );
        }
        return rfq;
      } catch (error: any) {
        lastError = error;
        if (error?.code === 11000) continue;
        throw error;
      }
    }

    throw new Error(
      `Failed to generate unique RFQ number after several attempts: ${String(
        (lastError as any)?.message ?? ""
      )}`
    );
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
    if (input.templateId !== undefined && input.templateId !== null)
      update.template = new Types.ObjectId(input.templateId);
    if (input.columnConfigId !== undefined && input.columnConfigId !== null)
      update.columnConfig = new Types.ObjectId(input.columnConfigId);
    if (input.vendorEmail !== undefined) update.vendorEmail = input.vendorEmail;
    if (input.vendorContact !== undefined) update.vendorContact = input.vendorContact;
    if (input.status !== undefined) update.status = input.status;

    const rfq = await RFQ.findOneAndUpdate(
      { _id: rfqId, company: ctx.companyId },
      { $set: update },
      { new: true }
    ).exec();

    if (!rfq) throw new Error("RFQ not found.");

    // Replace all items if provided
    if (input.items !== undefined) {
      await RFQItem.deleteMany({ rfq: rfq._id, company: ctx.companyId }).exec();

      if (input.items.length > 0) {
        await RFQItem.insertMany(
          input.items.map((item) => ({
            company: new Types.ObjectId(ctx.companyId!),
            rfq: rfq._id,
            position: item.position,
            values: {
              productName: item.productName,
              imageUrl: item.imageUrl ?? undefined,
              rate: item.rate,
              quantity: item.quantity,
              amount: item.amount,
              remark: item.remark ?? undefined,
              discount: item.discount,
              finalAmount: item.finalAmount,
            },
          }))
        );
      }
    }

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