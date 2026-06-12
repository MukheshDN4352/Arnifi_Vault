import { z } from "zod";

// Checkout = removing a document from the active vault (terminal). No return.
export const createCheckoutSchema = z.object({
  documentId: z.string().cuid("Invalid document ID"),
  takenByName: z
    .string()
    .min(2, "Enter who is taking the document")
    .max(100, "Name too long"),
  takenByDetail: z.string().max(150, "Too long").optional(),
  purpose: z.string().max(500, "Too long").optional(),
  // datetime-local string from the form; converted to Date in the action.
  checkedOutAt: z.string().min(1, "Checkout date/time is required"),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
