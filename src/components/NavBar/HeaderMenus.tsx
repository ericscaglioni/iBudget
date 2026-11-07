"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

type HeaderMenuId = "theme" | "profile";

type HeaderMenusContextValue = {
  register: (id: HeaderMenuId, close: () => void) => void;
  closeOthers: (id: HeaderMenuId) => void;
};

const HeaderMenusContext = createContext<HeaderMenusContextValue | null>(null);

export const HeaderMenus = ({ children }: { children: ReactNode }) => {
  const closers = useRef<Partial<Record<HeaderMenuId, () => void>>>({});
  const value = useMemo<HeaderMenusContextValue>(
    () => ({
      register: (id, close) => {
        closers.current[id] = close;
      },
      closeOthers: (id) => {
        (Object.keys(closers.current) as HeaderMenuId[]).forEach((key) => {
          if (key !== id) closers.current[key]?.();
        });
      },
    }),
    []
  );

  return <HeaderMenusContext.Provider value={value}>{children}</HeaderMenusContext.Provider>;
};

export const ExclusiveMenuSync = ({ id, close }: { id: HeaderMenuId; close: () => void }) => {
  const ctx = useContext(HeaderMenusContext);

  useEffect(() => {
    ctx?.register(id, close);
  }, [ctx, id, close]);

  return null;
};

export const useCloseOtherHeaderMenus = (id: HeaderMenuId) => {
  const ctx = useContext(HeaderMenusContext);
  return () => ctx?.closeOthers(id);
};
