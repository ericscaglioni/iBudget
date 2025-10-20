import { NextResponse, type NextRequest } from "next/server";
import { ClerkEvent } from "./types";
import { Webhook } from "svix";
import { userService } from "@/lib/client/services";

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

  switch (event.type) {
    case "user.created":
      const response =await userService.initUser(event.data.id)
      return NextResponse.json(response);
    case "user.deleted":
      const deleteResponse = await userService.deleteUser(event.data.id)
      return NextResponse.json(deleteResponse);
    default:
      console.log("Unhandled event type:", event.type);
      // Handle other event types if needed
      break;
  }

  // if we get here, we don't have the event handled
  return NextResponse.json({ status: 500 });
}