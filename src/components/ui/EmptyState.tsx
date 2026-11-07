import { ReactNode } from "react";
import { Button } from "./Button";

type Props = {
  title: string;
  description: ReactNode;
  action?: { label: string; onClick: () => void };
};

/** What a page shows when there is nothing to list yet: say what it's for and offer the next step. */
export const EmptyState = ({ title, description, action }: Props) => (
  <div className="bg-surface border border-dashed border-line rounded-lg px-4 py-10 sm:py-14 text-center">
    <h2 className="text-base sm:text-lg font-semibold text-ink">{title}</h2>
    <p className="text-sm text-muted mt-2 max-w-md mx-auto">{description}</p>
    {action && (
      <div className="mt-5">
        <Button variant="primary" size="lg" onClick={action.onClick}>
          {action.label}
        </Button>
      </div>
    )}
  </div>
);
