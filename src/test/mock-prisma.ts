import { vi, type Mock } from "vitest";

type ModelMock = Record<string, Mock>;

/**
 * A stand-in for the Prisma client: every `prisma.<model>.<method>` is a `vi.fn()` created on first
 * use (returning undefined until a test says otherwise), so service tests run without a database.
 * `$transaction` runs the given queries the way Prisma does: an array resolves every promise in
 * order, a callback gets the client itself.
 */
export const createPrismaMock = () => {
  const models = new Map<string, ModelMock>();

  const modelFor = (name: string): ModelMock => {
    let model = models.get(name);
    if (!model) {
      const methods = new Map<string, Mock>();
      model = new Proxy({} as ModelMock, {
        get: (_target, method: string) => {
          if (!methods.has(method)) methods.set(method, vi.fn());
          return methods.get(method)!;
        },
      });
      models.set(name, model);
    }
    return model;
  };

  const prisma: Record<string, unknown> = new Proxy({} as Record<string, unknown>, {
    get: (_target, prop: string) => {
      if (prop === "$transaction") {
        return vi.fn(async (arg: unknown) =>
          Array.isArray(arg) ? Promise.all(arg) : (arg as (client: unknown) => unknown)(prisma)
        );
      }
      return modelFor(prop);
    },
  });

  return prisma as unknown as Record<string, ModelMock> & { $transaction: Mock };
};

export type PrismaMock = ReturnType<typeof createPrismaMock>;
