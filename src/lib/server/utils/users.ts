import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

export type UserProfile = {
  id: string;
  email: string | null;
  name: string | null;
};

export type ClerkEventUser = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email_addresses?: { email_address: string }[];
};

export type ClerkUserLike = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  primaryEmailAddress?: { emailAddress: string } | null;
  emailAddresses: { emailAddress: string }[];
};

const displayName = (first?: string | null, last?: string | null) => {
  const name = [first, last].map((part) => part?.trim()).filter(Boolean).join(" ");
  return name.length > 0 ? name : null;
};

export const profileFromClerkEvent = (data: ClerkEventUser): UserProfile => ({
  id: data.id,
  email: data.email_addresses?.[0]?.email_address?.trim() || null,
  name: displayName(data.first_name, data.last_name),
});

export const profileFromClerkUser = (user: ClerkUserLike): UserProfile => ({
  id: user.id,
  email:
    user.primaryEmailAddress?.emailAddress?.trim() ||
    user.emailAddresses[0]?.emailAddress?.trim() ||
    null,
  name: displayName(user.firstName, user.lastName),
});

const requireUserId = (userId: string) => {
  if (typeof userId !== "string" || userId.trim() === "") {
    throw new Error("upsertUserProfile requires a non-empty user id");
  }
  return userId;
};

export const upsertUserProfile = async (profile: UserProfile) => {
  const id = requireUserId(profile.id);
  return prisma.user.upsert({
    where: { id },
    create: { id, email: profile.email, name: profile.name },
    update: { email: profile.email, name: profile.name },
  });
};

const profileFromClerkId = async (userId: string): Promise<UserProfile | null> => {
  try {
    if (typeof clerkClient !== "function") return null;
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return profileFromClerkUser(user);
  } catch {
    // Missing keys or Clerk downtime: still create the id so FKs work
    return null;
  }
};

export const ensureUserRow = async (userId: string) => {
  const id = requireUserId(userId);
  const existing = await prisma.user.findUnique({ where: { id } });
  if (existing?.email || existing?.name) return existing;

  const profile = await profileFromClerkId(id);
  if (profile) return upsertUserProfile(profile);

  return prisma.user.upsert({
    where: { id },
    create: { id },
    update: {},
  });
};
