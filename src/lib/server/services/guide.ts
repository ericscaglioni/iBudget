import { ValidationError } from "@/lib/errors/AppError";
import { prisma } from "@/lib/prisma";
import { getAvailableCurrencies } from "./settings";

/** Tips a user can dismiss. Add an id here to introduce a new dismissible tip. */
export const TIP_IDS = ["checklist", "multi-currency"] as const;
export type TipId = (typeof TIP_IDS)[number];

export type ChecklistStep = {
  id: "create-account" | "add-transaction";
  done: boolean;
};

export type Guide = {
  hasAccounts: boolean;
  /** null when the checklist should not be shown (finished or dismissed) */
  checklist: { steps: ChecklistStep[] } | null;
  /** The user has accounts in 2+ currencies but never chose a default currency */
  showMultiCurrencyHint: boolean;
};

const isTipId = (value: unknown): value is TipId => TIP_IDS.includes(value as TipId);

const getDismissed = async (userId: string): Promise<string[]> => {
  const guide = await prisma.userGuide.findUnique({ where: { userId } });
  return Array.isArray(guide?.dismissed) ? guide.dismissed.filter((id): id is string => typeof id === "string") : [];
};

export const dismissTip = async (userId: string, tipId: unknown) => {
  if (!isTipId(tipId)) throw new ValidationError("Unknown tip");

  const dismissed = await getDismissed(userId);
  if (dismissed.includes(tipId)) return;

  const next = [...dismissed, tipId];
  await prisma.userGuide.upsert({
    where: { userId },
    create: { userId, dismissed: next },
    update: { dismissed: next },
  });
};

/**
 * Works out what to tell this user, only from what they have actually done.
 * Nothing here is stored except the tips they dismissed, so tips reappear or disappear on their own
 * as the data changes (e.g. the checklist ticks itself off).
 */
export const getGuide = async (userId: string): Promise<Guide> => {
  const [accountCount, transactionCount, currencies, settings, dismissed] = await Promise.all([
    prisma.account.count({ where: { userId } }),
    prisma.transaction.count({ where: { userId } }),
    getAvailableCurrencies(userId),
    prisma.userSettings.findUnique({ where: { userId }, select: { userId: true } }),
    getDismissed(userId),
  ]);

  const steps: ChecklistStep[] = [
    { id: "create-account", done: accountCount > 0 },
    { id: "add-transaction", done: transactionCount > 0 },
  ];
  const isFinished = steps.every((step) => step.done);
  // Hiding only counts once there is an account: before that the dashboard has nothing else to show
  const isHidden = accountCount > 0 && dismissed.includes("checklist");

  return {
    hasAccounts: accountCount > 0,
    checklist: isFinished || isHidden ? null : { steps },
    // A saved settings row means they already picked a default currency, so there is nothing to explain
    showMultiCurrencyHint: currencies.length > 1 && !settings && !dismissed.includes("multi-currency"),
  };
};
