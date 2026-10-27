import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/lib/errors/AppError";
import { makeRequest, readJson, routeContext } from "@/test/http";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/server/services", () => ({
  transactionService: {
    createTransferTransaction: vi.fn(),
    createRecurringTransaction: vi.fn(),
    createTransaction: vi.fn(),
  },
}));

import { auth } from "@clerk/nextjs/server";
import { transactionService } from "@/lib/server/services";
import { POST } from "./route";

const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
const post = (body: unknown) => POST(makeRequest("/api/transactions", { method: "POST", body }), routeContext());

const expense = { type: "expense", amount: 25, accountId: "a1", categoryId: "c1", description: "  Lunch  ", date: "2026-10-20" };

beforeEach(() => mockAuth.mockResolvedValue({ userId: "u1" }));

describe("POST /api/transactions", () => {
  it("creates a one-time transaction, with the description trimmed", async () => {
    vi.mocked(transactionService.createTransaction).mockResolvedValue({ id: "t1" } as never);

    const { status, body } = await readJson(await post(expense));

    expect(status).toBe(201);
    expect(body).toEqual({ data: { id: "t1" } });
    expect(transactionService.createTransaction).toHaveBeenCalledWith("u1", {
      type: "expense",
      amount: 25,
      accountId: "a1",
      categoryId: "c1",
      description: "Lunch",
      date: "2026-10-20",
      isRecurring: false,
    });
  });

  it("creates a transfer, including the amount received for a different currency", async () => {
    vi.mocked(transactionService.createTransferTransaction).mockResolvedValue({ transferId: "tr1" } as never);

    const { status } = await readJson(
      await post({ type: "transfer", fromAccountId: "usd", toAccountId: "brl", amount: 100, toAmount: 520, description: "Move", date: "2026-10-20" })
    );

    expect(status).toBe(201);
    expect(transactionService.createTransferTransaction).toHaveBeenCalledWith("u1", {
      fromAccountId: "usd",
      toAccountId: "brl",
      amount: 100,
      toAmount: 520,
      description: "Move",
      date: "2026-10-20",
    });
    expect(transactionService.createTransaction).not.toHaveBeenCalled();
  });

  it("creates every occurrence of a recurring transaction", async () => {
    vi.mocked(transactionService.createRecurringTransaction).mockResolvedValue({ count: 12 } as never);

    const { status } = await readJson(await post({ ...expense, isRecurring: true, frequency: "monthly", endsAt: "2027-01-01" }));

    expect(status).toBe(201);
    expect(transactionService.createRecurringTransaction).toHaveBeenCalledWith("u1", {
      type: "expense",
      amount: 25,
      accountId: "a1",
      categoryId: "c1",
      description: "Lunch",
      date: "2026-10-20",
      frequency: "monthly",
      endsAt: "2027-01-01",
    });
    expect(transactionService.createTransaction).not.toHaveBeenCalled();
  });

  it("treats a 'recurring' transaction without a frequency as a one-time one", async () => {
    vi.mocked(transactionService.createTransaction).mockResolvedValue({ id: "t1" } as never);
    await post({ ...expense, isRecurring: true });
    expect(transactionService.createTransaction).toHaveBeenCalled();
    expect(transactionService.createRecurringTransaction).not.toHaveBeenCalled();
  });

  it("answers 400 for a missing description, without creating anything", async () => {
    const { status } = await readJson(await post({ ...expense, description: undefined }));
    expect(status).toBe(400);
    expect(transactionService.createTransaction).not.toHaveBeenCalled();
  });

  it("answers with the service's validation error", async () => {
    vi.mocked(transactionService.createTransaction).mockRejectedValue(new ValidationError("Missing required transaction data"));
    const { status, body } = await readJson(await post(expense));
    expect(status).toBe(400);
    expect(body).toMatchObject({ error: { message: "Missing required transaction data" } });
  });

  it("creates nothing and answers 401 when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await post(expense)).status).toBe(401);
    expect(transactionService.createTransaction).not.toHaveBeenCalled();
  });
});
