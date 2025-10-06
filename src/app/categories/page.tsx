import { categoryService } from "@/lib/server/services";
import { CategoriesPageShell } from "./_components";
import { handleServerError } from "@/lib/utils/server-error-handler";

const CategoriesPage = async () => {
  try {
    const { groups } = await categoryService.listCategoryGroups();
    return <CategoriesPageShell groups={groups} />;
  } catch (error) {
    handleServerError(error);
  }
};

export default CategoriesPage;