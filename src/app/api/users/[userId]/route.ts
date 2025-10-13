
import { deleteUserCategories, initializeUserDefaults } from "@/lib/server/utils/initializeUserDefaults";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = await params;
  const { userId } = resolvedParams;
  if (!userId) {
    return NextResponse.json({ status: 400, message: "User ID is required" });
  }

  const body = await request.json();
  if (body.type === "init") {
    await initializeUserDefaults(userId as string);
    return NextResponse.json({ status: 201 });
  }
  
  await deleteUserCategories(userId as string);
  return NextResponse.json({ status: 200 });
  
}