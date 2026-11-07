"use client";

import { settingsService } from "@/lib/client/services";
import type { ThemePreference } from "@/lib/constants";
import { applyThemeClass, resolvedTheme } from "@/lib/theme";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: "light" | "dark";
  setPreference: (next: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({
  initialTheme,
  children,
}: {
  initialTheme: ThemePreference;
  children: ReactNode;
}) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(initialTheme);
  const [prefersDark, setPrefersDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setPrefersDark(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    applyThemeClass(preference);
  }, [preference, prefersDark]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    applyThemeClass(next);
    void settingsService.updateSettings({ theme: next }).catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({
      preference,
      resolved: resolvedTheme(preference, prefersDark),
      setPreference,
    }),
    [preference, prefersDark, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
};
