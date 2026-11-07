import type { Appearance } from "@clerk/types";

/** Forest tokens — follows `.dark` on `<html>` via `--surface` / `--ink`. */
export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: "rgb(var(--brand))",
    colorBackground: "rgb(var(--surface))",
    colorText: "rgb(var(--ink))",
    colorTextSecondary: "rgb(var(--muted))",
    colorMutedForeground: "rgb(var(--muted))",
    colorNeutral: "rgb(var(--muted))",
    colorDanger: "rgb(var(--expense))",
    colorInput: "rgb(var(--paper))",
    colorInputForeground: "rgb(var(--ink))",
    colorBorder: "rgb(var(--line))",
    borderRadius: "0.375rem",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    card: "shadow-none border border-line bg-surface",
    headerTitle: "text-ink font-semibold",
    headerSubtitle: "text-muted",
    socialButtonsBlockButton: "border border-line bg-surface text-ink",
    formButtonPrimary: "bg-brand text-on-brand hover:bg-brand/90 shadow-none",
    footer: "bg-surface",
    footerActionText: "text-muted",
    footerActionLink: "text-brand",
  },
};
