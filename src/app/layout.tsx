import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "sonner";
import { LoadingProvider } from "@/lib/hooks/useLoading";
import { LoadingOverlay } from "@/components/ui";

export const metadata = {
  title: "iBudget",
  description: "Be in control of your money",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="font-sans bg-background text-slateDark" suppressHydrationWarning>
          <LoadingProvider>
            <Navbar />
            <Toaster
              position="top-right"
            />
            <main className="min-h-screen">
              {children}
            </main>
            <LoadingOverlay />
          </LoadingProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}