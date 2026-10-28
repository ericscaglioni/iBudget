import { vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(async () => ({
    users: { getUser: vi.fn().mockRejectedValue(new Error("Clerk is mocked in tests")) },
  })),
}));
