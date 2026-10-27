"use client";

import clsx from "clsx";
import { ReactNode, useEffect, useState } from "react";

// Keep in sync with `duration-300` below
const DURATION_MS = 300;

type Props = {
  open: boolean;
  children: ReactNode;
  id?: string;
  className?: string;
};

/**
 * Smoothly expands and collapses its content, whatever height it has.
 *
 * It animates the height of a grid row between 0fr and 1fr, which works with content of unknown
 * height (unlike animating `height`) and doesn't need any measuring. The content stays mounted,
 * so it can fade and slide instead of popping in and out, and it is `inert` while collapsed so
 * nothing in it can be tabbed to or read out.
 */
export const Collapsible = ({ open, children, id, className }: Props) => {
  // The content has to be clipped while it grows or shrinks, but not once it's fully open: clipping
  // would cut off anything that sticks out of it, such as the shadow of a hovered card
  const [settled, setSettled] = useState(open);

  useEffect(() => {
    if (!open) {
      setSettled(false);
      return;
    }
    const timer = setTimeout(() => setSettled(true), DURATION_MS);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <div
      id={id}
      inert={!open}
      className={clsx(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className
      )}
    >
      <div className={clsx("min-h-0", (!open || !settled) && "overflow-hidden")}>{children}</div>
    </div>
  );
};
