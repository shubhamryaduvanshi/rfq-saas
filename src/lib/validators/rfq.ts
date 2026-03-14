import { z } from "zod";
import type { RFQStatus } from "@/types/rfq";

export const rfqStatusEnum: [RFQStatus, ...RFQStatus[]] = [
  "draft",
  "sent",
  "responded",
  "closed",
];

export const createRFQSchema = z.object({
  title: z.string().min(2).max(200),
  vendorName: z.string().min(2).max(200),
  date: z.string().datetime().or(z.string().min(1)),
  remarks: z.string().max(2000).optional().nullable(),
  templateId: z.string().min(1).optional().nullable(),
  columnConfigId: z.string().min(1).optional().nullable(),
  vendorEmail: z.string().email().optional().nullable(),
  vendorContact: z.string().max(100).optional().nullable(),
  items: z.array(
    z.object({
      position: z.number().int().positive(),
      productName: z.string().max(500),
      imageUrl: z.string().url().optional().nullable(),
      rate: z.number().min(0).optional(),
      quantity: z.number().min(0).optional(),
      amount: z.number().min(0).optional(),
      remark: z.string().max(1000).optional().nullable(),
      discount: z.number().min(0).optional(),
      finalAmount: z.number().min(0).optional(),
    })
  ).optional().default([]),
});

export const updateRFQSchema = createRFQSchema
  .partial()
  .extend({
    status: z.enum(rfqStatusEnum).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

export type CreateRFQInput = z.infer<typeof createRFQSchema>;
export type UpdateRFQInput = z.infer<typeof updateRFQSchema>;

