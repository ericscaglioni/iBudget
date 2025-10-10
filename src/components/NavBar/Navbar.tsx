"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { navItems } from "./constants";

export const Navbar = () => {
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname.startsWith("/login");

  if (isLoginPage) return null;

  return (
    <nav className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 px-4 sm:px-6 bg-white shadow-sm gap-3 sm:gap-0">
      {/* LEFT SIDE: Logo + Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <Link href="/dashboard" className="text-lg sm:text-xl font-bold text-primary">
          iBudget
        </Link>
        {/* Navigation Links */}
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {navItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`text-xs sm:text-sm text-grayNeutral hover:text-primary ${
                pathname === item.href ? "text-primary font-semibold" : ""
              }`}
            >
              {item.title}
            </Link>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: Sign out */}
      <button
        onClick={() => signOut(() => router.push("/login"))}
        className="text-xs sm:text-sm text-grayNeutral hover:text-primary self-start sm:self-auto"
      >
        Sign out
      </button>
    </nav>
  );
};