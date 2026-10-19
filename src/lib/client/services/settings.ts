import { get, patch } from "@/lib/api/client";

const settingsPath = "/api/settings";

export type Settings = {
  defaultCurrency: string;
  availableCurrencies: string[];
};

export const getSettings = async () => {
  return get<Settings>(settingsPath);
};

export const updateSettings = async (data: { defaultCurrency?: string }) => {
  return patch<{ defaultCurrency?: string }, Settings>(settingsPath, data);
};
