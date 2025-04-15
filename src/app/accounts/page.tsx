import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AccountsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Accounts</h1>
      {/* Account management UI will go here */}
    </main>
  );
}