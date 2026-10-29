"use client";

import { usePathname } from "next/navigation";
import packageJson from "../../package.json";

export const AppFooter = () => {
  const pathname = usePathname();
  if (pathname.startsWith("/login")) return null;

  return (
    <footer className="px-3 sm:px-6 pb-28 pt-6 text-center text-xs text-grayNeutral">
      iBudget {packageJson.version}
    </footer>
  );
};
