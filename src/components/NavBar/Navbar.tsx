"use client";

import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { usePathname, useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { navItems, primaryNavItems, secondaryNavItems } from "./constants";
import { Icon } from "@/components/ui";
import { ExclusiveMenuSync, HeaderMenus, useCloseOtherHeaderMenus } from "./HeaderMenus";
import { ThemeToggle } from "./ThemeToggle";
import clsx from "clsx";

const navLinkClass = (active: boolean) =>
  clsx(
    "block w-full rounded-md px-3 py-2 text-sm transition-colors",
    active ? "bg-paper font-medium text-ink" : "text-muted hover:bg-paper hover:text-ink"
  );

const ProfileMenu = ({ onSignOut }: { onSignOut: () => void }) => {
  const { user } = useUser();
  const closeOthers = useCloseOtherHeaderMenus("profile");

  return (
    <Menu as="div" className="shrink-0">
      {({ close }) => (
        <>
          <ExclusiveMenuSync id="profile" close={close} />
          <MenuButton
            onClick={closeOthers}
            className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-brand/50"
            aria-label="Open profile menu"
          >
            {user?.imageUrl ? (
              // Clerk serves the avatar from its own CDN, so a plain img avoids extra next/image config
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.imageUrl}
                alt={user.fullName ?? "Profile"}
                className="size-9 rounded-full object-cover border border-line"
              />
            ) : (
              <span className="flex size-9 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                {(user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? "?").charAt(0).toUpperCase()}
              </span>
            )}
          </MenuButton>
          <MenuItems
            anchor="bottom end"
            modal={false}
            className="z-50 w-48 rounded-md border border-line bg-surface py-1 [--anchor-gap:8px] focus:outline-none"
          >
            <MenuItem>
              <Link
                href="/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm text-ink data-[focus]:bg-paper"
              >
                <Icon name="settings" className="size-4 text-muted" />
                Settings
              </Link>
            </MenuItem>
            <MenuItem>
              <button
                onClick={onSignOut}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-ink data-[focus]:bg-paper"
              >
                <Icon name="signOut" className="size-4 text-muted" />
                Sign out
              </button>
            </MenuItem>
          </MenuItems>
        </>
      )}
    </Menu>
  );
};

export const Navbar = () => {
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname.startsWith("/login");
  const [moreOpen, setMoreOpen] = useState(false);
  const bottomNavRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (isLoginPage) {
      document.documentElement.style.removeProperty("--mobile-bottom-chrome");
      return;
    }
    const nav = bottomNavRef.current;
    if (!nav) return;
    const apply = () => {
      const height = nav.offsetHeight;
      if (height > 0) {
        document.documentElement.style.setProperty("--mobile-bottom-chrome", `${height}px`);
      } else {
        document.documentElement.style.removeProperty("--mobile-bottom-chrome");
      }
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [isLoginPage, moreOpen]);

  if (isLoginPage) return null;

  const handleSignOut = () => {
    setMoreOpen(false);
    signOut(() => router.push("/login"));
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const moreActive = secondaryNavItems.some((item) => isActive(item.href)) || pathname.startsWith("/settings");

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-line bg-surface md:flex">
        <div className="flex h-14 items-center px-5">
          <Link href="/dashboard" className="text-lg font-semibold text-brand">
            iBudget
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2" aria-label="Main">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={navLinkClass(isActive(item.href))}>
              {item.title}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col border-t border-line px-3 py-3">
          <Link href="/settings" className={navLinkClass(pathname.startsWith("/settings"))}>
            Settings
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between overflow-visible border-b border-line bg-surface px-3 md:pl-56 md:pr-6">
        <Link href="/dashboard" className="text-base font-semibold text-brand md:hidden">
          iBudget
        </Link>
        <div className="hidden md:block" />
        <div className="ml-auto flex items-center gap-1 overflow-visible">
          <HeaderMenus>
            <ThemeToggle />
            <ProfileMenu onSignOut={handleSignOut} />
          </HeaderMenus>
        </div>
      </header>

      <nav
        ref={bottomNavRef}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Primary"
      >
        <div className="grid grid-cols-4">
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 py-3 text-xs",
                isActive(item.href) ? "font-medium text-ink" : "text-muted"
              )}
            >
              {item.title}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            className={clsx(
              "flex min-h-14 flex-col items-center justify-center gap-0.5 py-3 text-xs",
              moreActive || moreOpen ? "font-medium text-ink" : "text-muted"
            )}
            aria-expanded={moreOpen}
            aria-label="More"
          >
            More
          </button>
        </div>
        {moreOpen && (
          <div className="border-t border-line px-3 py-2">
            {secondaryNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={clsx("block py-2.5 text-sm", isActive(item.href) ? "font-medium text-ink" : "text-muted")}
              >
                {item.title}
              </Link>
            ))}
            <Link
              href="/settings"
              onClick={() => setMoreOpen(false)}
              className={clsx("block py-2.5 text-sm", pathname.startsWith("/settings") ? "font-medium text-ink" : "text-muted")}
            >
              Settings
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="block w-full py-2.5 text-left text-sm text-muted"
            >
              Sign out
            </button>
          </div>
        )}
      </nav>
    </>
  );
};
