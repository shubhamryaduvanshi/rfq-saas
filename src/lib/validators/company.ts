import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(2).max(200),
  contactPerson: z.string().min(2).max(200),
  email: z.string().email(),
  mobile: z.string().min(5).max(20),
  address: z.string().min(5).max(500),
  gstOrRegNo: z.string().min(2).max(100),
  logoUrl: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  tagline: z.string().max(200).optional().nullable(),
  paymentDetails: z.string().max(1000).optional().nullable(),
});

export type CompanyInput = z.infer<typeof companySchema>;

