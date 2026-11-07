import type { ThemePreference } from "@/lib/constants";

export const THEME_STORAGE_UNSET = "light";

export const isThemePreference = (value: string | null | undefined): value is ThemePreference =>
  value === "light" || value === "dark" || value === "system";

export const resolvedTheme = (preference: ThemePreference, prefersDark: boolean): "light" | "dark" => {
  if (preference === "system") return prefersDark ? "dark" : "light";
  return preference;
};

export const applyThemeClass = (preference: ThemePreference) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = preference;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.classList.toggle("dark", resolvedTheme(preference, prefersDark) === "dark");
};

/** Runs before paint so the first frame matches the saved preference. */
export const themeBootScript = (preference: ThemePreference) =>
  `(()=>{try{var t=${JSON.stringify(preference)};var r=document.documentElement;r.dataset.theme=t;var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);r.classList.toggle("dark",d);}catch(e){}})();`;
