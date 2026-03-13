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
  date: z.string().datetime().or(z.string().min(1)), // allow simple date string; will parse on server
  remarks: z.string().max(2000).optional().nullable(),
  templateId: z.string().min(1),
  columnConfigId: z.string().min(1),
  vendorEmail: z.string().email().optional().nullable(),
  vendorContact: z.string().max(100).optional().nullable(),
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

