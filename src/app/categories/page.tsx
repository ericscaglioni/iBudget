import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { categoryService } from "@/lib/server/services";
import { CategoriesPageShell } from "./_components";
import { handleServerError } from "@/lib/utils/server-error-handler";

const CategoriesPage = async () => {
  try {
    const { userId } = await auth();
    if (!userId) redirect("/login");

    const categories = await categoryService.getUserCategories(userId);
    return <CategoriesPageShell categories={categories} />;
  } catch (error) {
    handleServerError(error);
  }
};

export default CategoriesPage;