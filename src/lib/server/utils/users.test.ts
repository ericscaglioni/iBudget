import { describe, expect, it, vi } from "vitest";
import type { PrismaMock } from "@/test/mock-prisma";

vi.mock("@/lib/prisma", async () => {
  const { createPrismaMock } = await import("@/test/mock-prisma");
  return { prisma: createPrismaMock() };
});

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
  it("creates the row if needed and does not clear email or name", async () => {
    await ensureUserRow("user_1");
    expect(db.user.upsert).toHaveBeenCalledWith({
      where: { id: "user_1" },
      create: { id: "user_1" },
      update: {},
    });
  });
});
