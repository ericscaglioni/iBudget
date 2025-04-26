import { Navbar } from "@/components/NavBar";
import { LoadingOverlay } from "@/components/ui";
import { LoadingProvider } from "@/lib/hooks/useLoading";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";

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