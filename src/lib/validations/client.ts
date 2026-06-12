import { z } from "zod";

export const createClientSchema = z.object({
  name: z
    .string()
    .min(2, "Client name must be at least 2 characters")
    .max(150, "Client name too long"),
  // Optional company association; validated against the DB in the action.
  companyId: z.string().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
