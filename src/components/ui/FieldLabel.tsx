import clsx from "clsx";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  required?: boolean;
  htmlFor?: string;
  className?: string;
};

export const FieldLabel = ({ children, required = false, htmlFor, className }: Props) => (
  <label htmlFor={htmlFor} className={clsx("block text-sm font-medium mb-1", className)}>
    {children}
    {required ? (
      <>
        <span className="text-red-600" aria-hidden="true">
          {" "}
          *
        </span>
        <span className="sr-only"> (required)</span>
      </>
    ) : null}
  </label>
);
