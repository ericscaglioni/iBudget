import { AppFrame } from "@/components/AppFrame";
import { FloatingTransactionButton } from "@/components/FloatingTransactionButton";
import { GlobalTransactionModal } from "@/components/GlobalTransactionModal";
import { TransactionModalDataInitializer } from "@/components/TransactionModalDataInitializer";
import { LoadingOverlay } from "@/components/ui";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { LoadingProvider } from "@/lib/hooks/useLoading";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { ThemeProvider } from "@/lib/providers/ThemeProvider";
import { TransactionModalProvider } from "@/lib/providers/TransactionModalProvider";
import { settingsService } from "@/lib/server/services";
import { themeBootScript } from "@/lib/theme";
import type { ThemePreference } from "@/lib/constants";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata = {
  title: "iBudget",
  description: "Be in control of your money",
};

const readTheme = async (): Promise<ThemePreference> => {
  try {
    const { userId } = await auth();
    if (!userId) return "light";
    return await settingsService.getTheme(userId);
  } catch {
    return "light";
  }
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = await readTheme();

  return (
    <ClerkProvider
      appearance={clerkAppearance}
      {...(process.env.NEXT_PUBLIC_CLERK_PROXY_URL
        ? { proxyUrl: process.env.NEXT_PUBLIC_CLERK_PROXY_URL }
        : {})}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeBootScript(theme) }} />
        </head>
        <body className="font-sans bg-paper text-ink" suppressHydrationWarning>
          <ThemeProvider initialTheme={theme}>
            <QueryProvider>
              <LoadingProvider>
                <TransactionModalProvider>
                  <AppFrame>{children}</AppFrame>
                  <Toaster position="top-right" />
                  <FloatingTransactionButton />
                  <GlobalTransactionModal />
                  <TransactionModalDataInitializer />
                  <LoadingOverlay />
                </TransactionModalProvider>
              </LoadingProvider>
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
