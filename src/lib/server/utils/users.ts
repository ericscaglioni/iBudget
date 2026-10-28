import { prisma } from "@/lib/prisma";

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

export const ensureUserRow = async (userId: string) => {
  const id = requireUserId(userId);
  return prisma.user.upsert({
    where: { id },
    create: { id },
    update: {},
  });
};
