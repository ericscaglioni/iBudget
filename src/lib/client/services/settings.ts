import { get, patch } from "@/lib/api/client";

const settingsPath = "/api/settings";

export type Settings = {
  defaultCurrency: string;
  availableCurrencies: string[];
  openDashboardOn: "home" | "all";
};

export const getSettings = async () => {
  return get<Settings>(settingsPath);
};

export const updateSettings = async (data: {
  defaultCurrency?: string;
  openDashboardOn?: "home" | "all";
}) => {
  return patch<{ defaultCurrency?: string; openDashboardOn?: "home" | "all" }, Settings>(
    settingsPath,
    data
  );
};
