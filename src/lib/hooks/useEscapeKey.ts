"use client";

import { useEffect, useRef } from "react";

/**
 * Run `onEscape` when the user presses Esc while `enabled` is true.
 *
 * Meant for overlays that are not built on Headless UI's `Dialog` (which already closes on Esc).
 * The key press is claimed (capture phase + preventDefault/stopPropagation) so that a surrounding
 * dialog does not also close: with several layers open, Esc only closes the top one.
 */
export const useEscapeKey = (onEscape: () => void, enabled: boolean = true) => {
  // Always call the latest handler without re-subscribing on every render
  const handlerRef = useRef(onEscape);
  useEffect(() => {
    handlerRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      // isComposing: Esc is also used to cancel IME composition and shouldn't close anything then
      if (event.key !== "Escape" || event.isComposing) return;

      event.preventDefault();
      event.stopPropagation();
      handlerRef.current();
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [enabled]);
};
