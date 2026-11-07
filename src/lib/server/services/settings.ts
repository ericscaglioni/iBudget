import {
  DEFAULT_BASE_CURRENCY,
  OPEN_DASHBOARD_ON,
  THEME_PREFERENCES,
  type OpenDashboardOn,
  type ThemePreference,
} from "@/lib/constants";
import { ValidationError } from "@/lib/errors/AppError";
import { prisma } from "@/lib/prisma";
import { ensureUserRow } from "@/lib/server/utils/users";

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

const asOpenDashboardOn = (value: string | null | undefined, canUseAll: boolean): OpenDashboardOn => {
  if (canUseAll && value === "all") return "all";
  return "home";
};

const asTheme = (value: string | null | undefined): ThemePreference => {
  if (value === "dark" || value === "system" || value === "light") return value;
  return "light";
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
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  return {
    defaultCurrency: currency,
    availableCurrencies: available,
    openDashboardOn: asOpenDashboardOn(settings?.openDashboardOn, available.length > 1),
    theme: asTheme(settings?.theme),
  };
};

export const getTheme = async (userId: string): Promise<ThemePreference> => {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { theme: true },
  });
  return asTheme(settings?.theme);
};

export const updateSettings = async (
  userId: string,
  data: { defaultCurrency?: string; openDashboardOn?: string; theme?: string }
) => {
  const { defaultCurrency, openDashboardOn, theme } = data;
  const touchingBase = defaultCurrency !== undefined;
  const touchingOpen = openDashboardOn !== undefined;
  const touchingTheme = theme !== undefined;
  if (!touchingBase && !touchingOpen && !touchingTheme) {
    return getSettings(userId);
  }

  const available = await getAvailableCurrencies(userId);
  const existing = await prisma.userSettings.findUnique({ where: { userId } });

  let nextBase = existing?.baseCurrency;
  if (touchingBase) {
    if (!available.includes(defaultCurrency)) {
      throw new ValidationError("You can only pick a currency you have an account in");
    }
    nextBase = defaultCurrency;
  }

  let nextOpen: OpenDashboardOn | undefined;
  if (touchingOpen) {
    if (!(OPEN_DASHBOARD_ON as readonly string[]).includes(openDashboardOn)) {
      throw new ValidationError("Open dashboard on must be Home currency or All");
    }
    if (openDashboardOn === "all" && available.length < 2) {
      throw new ValidationError("All is only available when you have more than one currency");
    }
    nextOpen = openDashboardOn as OpenDashboardOn;
  }

  let nextTheme: ThemePreference | undefined;
  if (touchingTheme) {
    if (!(THEME_PREFERENCES as readonly string[]).includes(theme)) {
      throw new ValidationError("Theme must be Light, Dark or System");
    }
    nextTheme = theme as ThemePreference;
  }

  await ensureUserRow(userId);
  const baseCurrency = nextBase ?? available[0] ?? DEFAULT_BASE_CURRENCY;
  await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      baseCurrency,
      openDashboardOn: nextOpen ?? "home",
      theme: nextTheme ?? "light",
    },
    update: {
      ...(touchingBase ? { baseCurrency: nextBase } : {}),
      ...(touchingOpen ? { openDashboardOn: nextOpen } : {}),
      ...(touchingTheme ? { theme: nextTheme } : {}),
    },
  });

  return getSettings(userId);
};
