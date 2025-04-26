"use client";

import Link from "next/link";
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
      {/* LEFT SIDE: Logo + Nav */}
      <div className="flex items-center gap-6">
        <Link href="/accounts" className="text-xl font-bold text-primary">
          iBudget
        </Link>
        <Link href="/accounts" className="text-sm text-grayNeutral hover:text-primary">
          Accounts
        </Link>
        <Link href="/categories" className="text-sm text-grayNeutral hover:text-primary">
          Categories
        </Link>
        {/* Add more links here in the future */}
      </div>

      {/* RIGHT SIDE: Sign out */}
      <button
        onClick={() => signOut(() => router.push("/login"))}
        className="text-sm text-grayNeutral hover:text-primary"
      >
        Sign out
      </button>
    </nav>
  );
};