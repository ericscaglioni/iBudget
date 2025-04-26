import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  color: z.string().min(1, "Color is required"),
  groupId: z.string().min(1, "Group is required"),
});

export type CategoryInput = z.infer<typeof categorySchema>;