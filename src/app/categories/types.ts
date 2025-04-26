import { Category, CategoryGroup } from "@prisma/client";

export interface CategoryGroupWithCategories extends CategoryGroup {
  categories: Category[];
}