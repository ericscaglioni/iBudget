import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { categoryService } from "@/lib/server/services";
import { CategoriesPageShell } from "./_components";
import { handleServerError } from "@/lib/utils/server-error-handler";
import { parseQueryParams } from "@/lib/utils/parse-query";

// Force dynamic rendering since we use auth() and searchParams
export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const CategoriesPage = async ({ searchParams }: Props) => {
  try {
    const { userId } = await auth();
    if (!userId) redirect("/login");

    const params = await searchParams;
    const queryParams = await parseQueryParams(params);

    const { categories, total } = await categoryService.getCategoriesByUser(
      userId,
      queryParams
    );

    return (
      <CategoriesPageShell
        categories={categories}
        totalCount={total}
        page={queryParams.page}
        pageSize={queryParams.pageSize}
      />
    );
  } catch (error) {
    handleServerError(error);
  }
};

export default CategoriesPage;