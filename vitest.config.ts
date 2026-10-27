import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // Every test starts with clean mocks, so nothing one test sets up can leak into the next
    mockReset: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "text", "html"],
      // The business logic: services, API routes, schemas, helpers and the client API layer.
      // React components, pages, hooks and providers are UI and are not counted here.
      include: ["src/lib/**/*.{ts,tsx}", "src/app/api/**/*.ts", "src/app/**/schema.ts"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/lib/hooks/**",
        "src/lib/providers/**",
        "src/lib/queries/**",
        "src/lib/utils/toast.tsx",
        // Only re-exports, and the Prisma client singleton: no logic to test
        "src/**/index.ts",
        "src/lib/prisma.ts",
      ],
      thresholds: { statements: 85, branches: 85, functions: 85, lines: 85 },
    },
  },
});
