import { z } from "zod";
import { VaultLocation } from "@prisma/client";
import { isValidLocationTriple } from "@/lib/config/vault-locations";

const documentBaseSchema = z.object({
  name: z
    .string()
    .min(2, "Document name must be at least 2 characters")
    .max(200, "Document name too long"),
  category: z.string().min(1, "Category is required").max(100),
  categoryOther: z.string().max(150, "Too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  // Owner — at least one of company/client (validated against the DB in the action)
  companyId: z.string().optional(),
  clientId: z.string().optional(),
  // Storage location — required, validated against the config hierarchy
  location: z.nativeEnum(VaultLocation, { required_error: "Location is required" }),
  lockerNo: z.string().min(1, "Locker is required"),
  rackNo: z.string().min(1, "Rack is required"),
  // Optional S3 file
  fileKey: z.string().optional(),
  fileUrl: z.string().url("Invalid file URL").optional().or(z.literal("")),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
});

type DocumentFields = z.infer<typeof documentBaseSchema>;

// Cross-field rules applied to both create and update.
function applyRefinements<T extends z.ZodTypeAny>(schema: T) {
  return schema
    .refine(
      (d: DocumentFields) => d.category !== "Other" || !!d.categoryOther?.trim(),
      { message: "Please specify the category", path: ["categoryOther"] }
    )
    .refine(
      (d: DocumentFields) => isValidLocationTriple(d.location, d.lockerNo, d.rackNo),
      { message: "Invalid storage location selection", path: ["rackNo"] }
    )
    .refine((d: DocumentFields) => !!(d.companyId || d.clientId), {
      message: "Select an owner — a company or a client",
      path: ["companyId"],
    });
}

export const createDocumentSchema = applyRefinements(documentBaseSchema);

export const updateDocumentSchema = applyRefinements(
  documentBaseSchema.extend({ id: z.string().cuid("Invalid document ID") })
);

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
