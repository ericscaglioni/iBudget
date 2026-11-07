import { get, patch } from "@/lib/api/client";
import type { ThemePreference } from "@/lib/constants";

const settingsPath = "/api/settings";

export type Settings = {
  defaultCurrency: string;
  availableCurrencies: string[];
  openDashboardOn: "home" | "all";
  theme: ThemePreference;
};

export const getSettings = async () => {
  return get<Settings>(settingsPath);
};

export const updateSettings = async (data: {
  defaultCurrency?: string;
  openDashboardOn?: "home" | "all";
  theme?: ThemePreference;
}) => {
  return patch<
    { defaultCurrency?: string; openDashboardOn?: "home" | "all"; theme?: ThemePreference },
    Settings
  >(settingsPath, data);
};
