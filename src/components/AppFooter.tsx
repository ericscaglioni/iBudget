"use client";

import { usePathname } from "next/navigation";
import packageJson from "../../package.json";

export const AppFooter = () => {
  const pathname = usePathname();
  if (pathname.startsWith("/login")) return null;

  return (
    <footer className="px-3 sm:px-6 pb-6 pt-6 text-center text-xs text-muted">
      iBudget {packageJson.version}
    </footer>
  );
};
