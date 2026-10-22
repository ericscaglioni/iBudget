"use client";

import { Button, Icon } from "@/components/ui";
import { guideService } from "@/lib/client/services";
import { AppError } from "@/lib/errors/AppError";
import { useTransactionModal } from "@/lib/providers/TransactionModalProvider";
import { showError } from "@/lib/utils/toast";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useState } from "react";

type StepId = "create-account" | "add-transaction";

type Props = {
  steps: { id: StepId; done: boolean }[];
  /** Hiding is only offered once the user has an account; before that the dashboard has nothing else to show */
  canDismiss: boolean;
};

const STEP_CONTENT: Record<StepId, { title: string; description: string; actionLabel: string }> = {
  "create-account": {
    title: "Create your first account",
    description:
      "An account is where your money lives: a wallet, a bank account or a card. Every transaction is recorded against one, so start here.",
    actionLabel: "Create account",
  },
  "add-transaction": {
    title: "Add your first transaction",
    description:
      "Log an expense or income. You can also use the + button at the bottom right, from any page.",
    actionLabel: "Add transaction",
  },
};

export const GettingStarted = ({ steps, canDismiss }: Props) => {
  const router = useRouter();
  const { openModal } = useTransactionModal();
  const [isDismissing, setIsDismissing] = useState(false);

  const doneCount = steps.filter((step) => step.done).length;
  const currentStepId = steps.find((step) => !step.done)?.id;

  const handleAction = (stepId: StepId) => {
    if (stepId === "create-account") {
      router.push("/accounts?new=1");
    } else {
      openModal();
    }
  };

  const handleDismiss = async () => {
    try {
      setIsDismissing(true);
      await guideService.dismissTip("checklist");
      router.refresh();
    } catch (error) {
      showError(error instanceof AppError ? error.message : "Couldn't hide the guide");
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <section
      aria-label="Getting started"
      className="bg-white border border-blue-200 rounded-lg shadow-sm p-4 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Welcome to iBudget</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Two quick steps to get going ({doneCount} of {steps.length} done).
          </p>
        </div>
        {canDismiss && (
          <Button variant="ghost" size="sm" onClick={handleDismiss} isLoading={isDismissing}>
            Hide
          </Button>
        )}
      </div>

      <ol className="mt-4 space-y-3">
        {steps.map((step, index) => {
          const content = STEP_CONTENT[step.id];
          const isCurrent = step.id === currentStepId;

          return (
            <li key={step.id} className="flex gap-3">
              <span
                className={clsx(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  step.done && "bg-green-100 text-green-700",
                  isCurrent && "bg-primary text-white",
                  !step.done && !isCurrent && "bg-gray-100 text-gray-400"
                )}
              >
                {step.done ? <Icon name="checkMark" className="size-4" /> : index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={clsx(
                    "text-sm font-medium",
                    step.done ? "text-gray-400 line-through" : "text-gray-900"
                  )}
                >
                  {content.title}
                </p>
                {isCurrent && (
                  <>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">{content.description}</p>
                    <Button className="mt-3" size="md" onClick={() => handleAction(step.id)}>
                      {content.actionLabel}
                    </Button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
