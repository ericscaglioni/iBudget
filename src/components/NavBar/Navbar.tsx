"use client";

import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { navItems } from "./constants";
import { Icon } from "@/components/ui";

export const Navbar = () => {
  const { signOut } = useClerk();
  const { user } = useUser();
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
          {/* DESKTOP: Profile menu with Settings and Sign out (hidden on mobile) */}
          <Menu as="div" className="relative hidden sm:block">
            <MenuButton
              className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Open profile menu"
            >
              {user?.imageUrl ? (
                // Clerk serves the avatar from its own CDN, so a plain img avoids extra next/image config
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.imageUrl}
                  alt={user.fullName ?? "Profile"}
                  className="size-9 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {(user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? "?").charAt(0).toUpperCase()}
                </span>
              )}
            </MenuButton>

            <MenuItems
              anchor="bottom end"
              className="z-50 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg [--anchor-gap:4px] focus:outline-none"
            >
              <MenuItem>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100"
                >
                  <Icon name="settings" className="size-4 text-gray-500" />
                  Settings
                </Link>
              </MenuItem>
              <MenuItem>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 data-[focus]:bg-gray-100"
                >
                  <Icon name="signOut" className="size-4 text-gray-500" />
                  Sign out
                </button>
              </MenuItem>
            </MenuItems>
          </Menu>

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

            {/* Settings */}
            <Link
              href="/settings"
              onClick={closeMobileMenu}
              className={`py-3 text-sm text-grayNeutral hover:text-primary transition-colors border-b border-gray-100 ${
                pathname === "/settings" ? "text-primary font-semibold" : ""
              }`}
            >
              Settings
            </Link>

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