import { NextResponse, type NextRequest } from "next/server";
import { ClerkEvent, EventType } from "./types";
import { Webhook } from "svix";
import { deleteUserData, initializeUserDefaults } from "@/lib/server/utils/initializeUserDefaults";

const getValidationHeaders = (headers: Headers) => {
  const svix_id = headers.get("svix-id") ?? "";
  const svix_timestamp = headers.get("svix-timestamp") ?? "";
  const svix_signature = headers.get("svix-signature") ?? "";

  return {
    "svix-id": svix_id,
    "svix-timestamp": svix_timestamp,
    "svix-signature": svix_signature,
  };
};

export async function POST(req: NextRequest) {
  // Read the request body as a buffer for signature verification
  const body = await req.text();

  // Verify the webhook signature
  const validationHeaders = getValidationHeaders(req.headers);

  let event: ClerkEvent;
  try {
    const sivx = new Webhook(process.env.CLERK_WEBHOOK_SIGNING_SECRET ?? "");
    event = sivx.verify(body, validationHeaders) as ClerkEvent;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error trying to verify webhook signature: ${err.message}`);
    } else {
      console.error(`Error trying to verify webhook signature: ${String(err)}`);
    }
    return NextResponse.json("Bad Request", { status: 400 });
  }

  // The signature above proves the event comes from Clerk, so it is safe to act on the user id.
  // These run server-side directly: there is intentionally no public HTTP endpoint for this.
  try {
    switch (event.type) {
      case EventType.USER_CREATED:
        await initializeUserDefaults(event.data.id);
        return NextResponse.json({ data: { message: "User initialized successfully" } });
      case EventType.USER_DELETED: {
        const deleted = await deleteUserData(event.data.id);
        console.log(`Deleted data for user ${event.data.id}:`, deleted);
        return NextResponse.json({ data: { message: "User deleted successfully", deleted } });
      }
      default:
        console.log("Unhandled event type:", event.type);
        // Acknowledge events we don't handle so Clerk doesn't keep retrying them
        return NextResponse.json({ data: { message: "Event ignored" } });
    }
  } catch (err) {
    console.error(`Error handling Clerk event ${event.type}:`, err);
    // A non-2xx status makes Clerk retry the delivery
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}