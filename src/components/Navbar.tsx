"use client";

import { useClerk } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";

export const Navbar = () => {
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname.startsWith("/login");

  if (isLoginPage) return null;

  return (
    <nav className="w-full flex justify-between items-center py-4 px-6 bg-white shadow-sm">
      <h1 className="text-xl font-bold text-primary">iBudget</h1>
      <button
        onClick={() => {
          signOut(() => router.push("/login"));
        }}
        className="text-sm text-grayNeutral hover:text-primary"
      >
        Sign out
      </button>
    </nav>
  );
}