import { z } from "zod";

export const CategoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  color: z.string().min(1, "Color is required"),
  groupId: z.string().min(1, "Group is required"),
});

export type CategoryFormInput = z.infer<typeof CategoryFormSchema>;