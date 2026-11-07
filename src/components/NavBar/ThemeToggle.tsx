"use client";

import { Icon } from "@/components/ui";
import type { ThemePreference } from "@/lib/constants";
import { useTheme } from "@/lib/providers/ThemeProvider";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ExclusiveMenuSync, useCloseOtherHeaderMenus } from "./HeaderMenus";

const choices: { value: ThemePreference; label: string; icon: "sun" | "moon" | "computer" }[] = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
  { value: "system", label: "System", icon: "computer" },
];

export const ThemeToggle = () => {
  const { preference, resolved, setPreference } = useTheme();
  const closeOthers = useCloseOtherHeaderMenus("theme");

  return (
    <Menu as="div" className="shrink-0">
      {({ close }) => (
        <>
          <ExclusiveMenuSync id="theme" close={close} />
          <MenuButton
            onClick={closeOthers}
            className="flex size-9 items-center justify-center rounded-md text-muted hover:bg-paper hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand/50"
            aria-label={`Theme: ${preference}. ${resolved} is showing.`}
          >
            <Icon name={resolved === "dark" ? "moon" : "sun"} className="size-5" />
          </MenuButton>
          <MenuItems
            anchor="bottom end"
            modal={false}
            className="z-50 w-40 rounded-md border border-line bg-surface py-1 shadow-none [--anchor-gap:8px] focus:outline-none"
          >
            {choices.map((choice) => (
              <MenuItem key={choice.value}>
                <button
                  type="button"
                  onClick={() => setPreference(choice.value)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink data-[focus]:bg-paper"
                >
                  <Icon name={choice.icon} className="size-4 text-muted" />
                  {choice.label}
                  {preference === choice.value ? (
                    <Icon name="checkMark" className="ml-auto size-4 text-brand" />
                  ) : null}
                </button>
              </MenuItem>
            ))}
          </MenuItems>
        </>
      )}
    </Menu>
  );
};
