import "../../globals.css";

export const metadata = {
  title: "Login – iBudget",
  description: "Login page for iBudget",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      {children}
    </main>
  );
}