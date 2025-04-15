import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

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
      <html lang="en">
        <body className="font-sans bg-background text-slateDark">
          <Navbar />
          <main className="min-h-screen flex flex-col items-center justify-center px-4">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}