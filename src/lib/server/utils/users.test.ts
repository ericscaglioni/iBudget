import { describe, expect, it, vi } from "vitest";
import type { PrismaMock } from "@/test/mock-prisma";

const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));

vi.mock("@/lib/prisma", async () => {
  const { createPrismaMock } = await import("@/test/mock-prisma");
  return { prisma: createPrismaMock() };
});

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn(async () => ({ users: { getUser } })),
}));

import { prisma } from "@/lib/prisma";
import {
  ensureUserRow,
  profileFromClerkEvent,
  profileFromClerkUser,
  upsertUserProfile,
  type ClerkEventUser,
} from "./users";

const db = prisma as unknown as PrismaMock;

const event = (overrides: Partial<ClerkEventUser> = {}): ClerkEventUser => ({
  id: "user_1",
  first_name: "Ada",
  last_name: "Lovelace",
  email_addresses: [{ email_address: "ada@example.com" }],
  ...overrides,
});

describe("profileFromClerkEvent", () => {
  it("reads the Clerk webhook name and first email", () => {
    expect(profileFromClerkEvent(event())).toEqual({
      id: "user_1",
      email: "ada@example.com",
      name: "Ada Lovelace",
    });
  });

  it("uses email as missing when Clerk has no addresses, and name when both parts are blank", () => {
    expect(
      profileFromClerkEvent(event({ first_name: "  ", last_name: "", email_addresses: [] })),
    ).toEqual({ id: "user_1", email: null, name: null });
  });
});

describe("profileFromClerkUser", () => {
  it("prefers the primary email over the list", () => {
    expect(
      profileFromClerkUser({
        id: "user_1",
        firstName: "Ada",
        lastName: null,
        primaryEmailAddress: { emailAddress: "primary@example.com" },
        emailAddresses: [{ emailAddress: "other@example.com" }],
      }),
    ).toEqual({ id: "user_1", email: "primary@example.com", name: "Ada" });
  });
});

describe("upsertUserProfile", () => {
  it("creates or updates the directory row with email and name", async () => {
    await upsertUserProfile({ id: "user_1", email: "ada@example.com", name: "Ada Lovelace" });
    expect(db.user.upsert).toHaveBeenCalledWith({
      where: { id: "user_1" },
      create: { id: "user_1", email: "ada@example.com", name: "Ada Lovelace" },
      update: { email: "ada@example.com", name: "Ada Lovelace" },
    });
  });

  it("refuses an empty id", async () => {
    await expect(upsertUserProfile({ id: "  ", email: null, name: null })).rejects.toThrow(
      "non-empty user id",
    );
    expect(db.user.upsert).not.toHaveBeenCalled();
  });
});

describe("ensureUserRow", () => {
  const clerkUser = {
    id: "user_1",
    firstName: "Ada",
    lastName: "Lovelace",
    primaryEmailAddress: { emailAddress: "ada@example.com" },
    emailAddresses: [{ emailAddress: "ada@example.com" }],
  };

  it("copies name and email from Clerk when the row is new", async () => {
    db.user.findUnique.mockResolvedValue(null);
    getUser.mockResolvedValue(clerkUser);

    await ensureUserRow("user_1");

    expect(getUser).toHaveBeenCalledWith("user_1");
    expect(db.user.upsert).toHaveBeenCalledWith({
      where: { id: "user_1" },
      create: { id: "user_1", email: "ada@example.com", name: "Ada Lovelace" },
      update: { email: "ada@example.com", name: "Ada Lovelace" },
    });
  });

  it("fills name and email when the row exists but those are empty", async () => {
    db.user.findUnique.mockResolvedValue({ id: "user_1", email: null, name: null });
    getUser.mockResolvedValue(clerkUser);

    await ensureUserRow("user_1");

    expect(getUser).toHaveBeenCalledWith("user_1");
    expect(db.user.upsert).toHaveBeenCalledWith({
      where: { id: "user_1" },
      create: { id: "user_1", email: "ada@example.com", name: "Ada Lovelace" },
      update: { email: "ada@example.com", name: "Ada Lovelace" },
    });
  });

  it("does not call Clerk when name or email is already stored", async () => {
    db.user.findUnique.mockResolvedValue({ id: "user_1", email: "ada@example.com", name: "Ada" });

    await ensureUserRow("user_1");

    expect(getUser).not.toHaveBeenCalled();
    expect(db.user.upsert).not.toHaveBeenCalled();
  });

  it("still creates the id when Clerk is unavailable", async () => {
    db.user.findUnique.mockResolvedValue(null);
    getUser.mockRejectedValue(new Error("Clerk down"));

    await ensureUserRow("user_1");

    expect(db.user.upsert).toHaveBeenCalledWith({
      where: { id: "user_1" },
      create: { id: "user_1" },
      update: {},
    });
  });
});
