import { categoryService } from "@/lib/server/services";
import { CategoriesPageShell } from "./_components";

const CategoriesPage = async () =>{
  const groups = await categoryService.listCategoryGroups();

  return (
    <CategoriesPageShell groups={groups} />
  );
}

export default CategoriesPage;