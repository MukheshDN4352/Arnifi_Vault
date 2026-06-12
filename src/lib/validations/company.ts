import { z } from "zod";

export const createCompanySchema = z.object({
  name: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(150, "Company name too long"),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
