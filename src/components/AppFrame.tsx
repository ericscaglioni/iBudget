"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppFooter } from "./AppFooter";
import { Navbar } from "./NavBar/Navbar";

export const AppFrame = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  if (pathname.startsWith("/login")) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <div className="md:pl-56">
        <main className="min-h-screen pb-[calc(var(--mobile-bottom-chrome,3.5rem)+6.5rem)] transition-[padding-bottom] duration-200 md:pb-8">
          {children}
        </main>
        <AppFooter />
      </div>
    </>
  );
};
