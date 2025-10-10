"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { navItems } from "./constants";
import { Icon } from "@/components/ui";

export const Navbar = () => {
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname.startsWith("/login");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoginPage) return null;

  const handleSignOut = () => {
    setIsMobileMenuOpen(false);
    signOut(() => router.push("/login"));
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="w-full bg-white shadow-sm">
      {/* Main navbar container */}
      <div className="flex justify-between items-center py-3 sm:py-4 px-4 sm:px-6">
        {/* LEFT SIDE: Logo + Nav Links (desktop) */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg sm:text-xl font-bold text-primary">
            iBudget
          </Link>

          {/* DESKTOP: Navigation Links (hidden on mobile) */}
          <div className="hidden sm:flex gap-4">
            {navItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={`text-sm text-grayNeutral hover:text-primary transition-colors ${
                  pathname === item.href ? "text-primary font-semibold" : ""
                }`}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE: Sign out (desktop) + Burger (mobile) */}
        <div className="flex items-center gap-4">
          {/* DESKTOP: Sign out button (hidden on mobile) */}
          <button
            onClick={handleSignOut}
            className="hidden sm:block text-sm text-grayNeutral hover:text-primary transition-colors"
          >
            Sign out
          </button>

          {/* MOBILE: Burger menu button (visible on mobile only) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 text-grayNeutral hover:text-primary transition-colors"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            <Icon name={isMobileMenuOpen ? "close" : "menu"} className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* MOBILE MENU: Dropdown (visible on mobile only when open) */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-white">
          <div className="flex flex-col py-2 px-4">
            {/* Navigation Links */}
            {navItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                onClick={closeMobileMenu}
                className={`py-3 text-sm text-grayNeutral hover:text-primary transition-colors border-b border-gray-100 last:border-b-0 ${
                  pathname === item.href ? "text-primary font-semibold" : ""
                }`}
              >
                {item.title}
              </Link>
            ))}

            {/* Sign out button */}
            <button
              onClick={handleSignOut}
              className="py-3 text-sm text-grayNeutral hover:text-primary transition-colors text-left"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};