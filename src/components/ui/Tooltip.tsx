"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import clsx from "clsx";
import { ReactNode } from "react";
import { Icon } from "./Icon";

type Props = {
  /** The explanation shown when the trigger is opened. */
  content: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * A short explanation next to a figure that is easy to misread (a percentage vs last month,
 * for example). The whole line is the control: tap or click, including on a phone.
 */
export const Tooltip = ({ content, children, className }: Props) => {
  return (
    <Popover className={clsx("relative inline-flex max-w-full", className)}>
      <PopoverButton
        type="button"
        className="inline-flex max-w-full items-center gap-1 rounded-sm bg-transparent p-0 text-left text-inherit cursor-help focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        {children}
        <Icon name="info" className="h-3.5 w-3.5 shrink-0 opacity-70" />
      </PopoverButton>
      <PopoverPanel
        anchor="top start"
        className="z-50 w-64 rounded-md border border-gray-200 bg-white p-3 text-xs sm:text-sm font-normal text-gray-700 shadow-lg"
      >
        {content}
      </PopoverPanel>
    </Popover>
  );
};
