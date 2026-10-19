import { DEFAULT_BASE_CURRENCY } from "@/lib/constants";
import { ValidationError } from "@/lib/errors/AppError";
import { prisma } from "@/lib/prisma";

/**
 * Currencies the user actually holds accounts in, most used first.
 * These are the only currencies that can be shown on the dashboard or picked as a default.
 */
export const getAvailableCurrencies = async (userId: string): Promise<string[]> => {
  const accounts = await prisma.account.findMany({ where: { userId }, select: { currency: true } });

  const counts = new Map<string, number>();
  accounts.forEach(({ currency }) => counts.set(currency, (counts.get(currency) ?? 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([currency]) => currency);
};

/**
 * Pick the currency to show: the requested one if the user has an account in it, otherwise their
 * saved default, otherwise the one they use the most. Never returns a currency without accounts
 * (unless the user has no accounts at all).
 */
export const resolveCurrency = async (userId: string, requested?: string | null) => {
  const available = await getAvailableCurrencies(userId);

  if (requested && available.includes(requested)) {
    return { currency: requested, available };
  }

  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (settings && available.includes(settings.baseCurrency)) {
    return { currency: settings.baseCurrency, available };
  }

  return { currency: available[0] ?? DEFAULT_BASE_CURRENCY, available };
};

export const getSettings = async (userId: string) => {
  const { currency, available } = await resolveCurrency(userId);
  return { defaultCurrency: currency, availableCurrencies: available };
};

export const updateSettings = async (userId: string, data: { defaultCurrency?: string }) => {
  const { defaultCurrency } = data;

  if (defaultCurrency !== undefined) {
    const available = await getAvailableCurrencies(userId);
    if (!available.includes(defaultCurrency)) {
      throw new ValidationError("You can only pick a currency you have an account in");
    }

    await prisma.userSettings.upsert({
      where: { userId },
      create: { userId, baseCurrency: defaultCurrency },
      update: { baseCurrency: defaultCurrency },
    });
  }

  return getSettings(userId);
};
