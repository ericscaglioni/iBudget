import path from "node:path";
import { defineConfig } from "vitest/config";

const srcAlias = { "@": path.resolve(__dirname, "src") };

const coverage = {
  provider: "v8" as const,
  reporter: ["text-summary", "text", "html"],
  include: [
    "src/lib/**/*.{ts,tsx}",
    "src/app/api/**/*.ts",
    "src/app/**/schema.ts",
    "src/components/ui/**/*.{ts,tsx}",
    "src/components/PageShell.tsx",
    "src/components/FloatingTransactionButton.tsx",
    "src/components/utils/**/*.tsx",
    "src/components/guide/**/*.tsx",
    "src/lib/hooks/**/*.{ts,tsx}",
  ],
  exclude: [
    "src/**/*.test.{ts,tsx}",
    "src/test/**",
    "src/lib/providers/**",
    "src/lib/queries/**",
    "src/lib/utils/toast.tsx",
    "src/**/index.ts",
    "src/lib/prisma.ts",
    "src/components/ui/Table/**",
    "src/components/ui/Combobox.tsx",
    "src/components/ui/MobileCombobox.tsx",
    "src/components/ui/SelectModal.tsx",
    "src/components/ui/MonthYearPicker.tsx",
    "src/components/ui/FormCombobox.tsx",
    "src/components/ui/FormRadioGroup.tsx",
  ],
  thresholds: { statements: 85, branches: 85, functions: 85, lines: 85 },
};

export default defineConfig({
  resolve: { alias: srcAlias },
  esbuild: { jsx: "automatic" },
  test: {
    mockReset: true,
    restoreMocks: true,
    coverage,
    projects: [
      {
        resolve: { alias: srcAlias },
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.test.ts"],
          setupFiles: ["./src/test/setup-node.ts"],
          mockReset: true,
          restoreMocks: true,
        },
      },
      {
        resolve: { alias: srcAlias },
        esbuild: { jsx: "automatic" },
        test: {
          name: "ui",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./src/test/setup.ts"],
          mockReset: true,
          restoreMocks: true,
        },
      },
    ],
  },
});
