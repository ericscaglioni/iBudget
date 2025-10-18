// Client-safe decimal utility
// This avoids importing Prisma's Decimal which has Node.js dependencies

export class ClientDecimal {
  private value: number;

  constructor(value: number | string) {
    this.value = typeof value === 'string' ? parseFloat(value) : value;
  }

  toNumber(): number {
    return this.value;
  }

  toString(): string {
    return this.value.toString();
  }

  static fromNumber(value: number): ClientDecimal {
    return new ClientDecimal(value);
  }
}

// Helper function to convert decimal-like values to number
export const toNumber = (value: number | string | { toNumber(): number }): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  if (value && typeof value.toNumber === 'function') return value.toNumber();
  return 0;
};
