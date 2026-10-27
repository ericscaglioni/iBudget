"use client";

import { Button, ClientOnlyCurrency, Icon, Modal } from "@/components/ui";
import { accountService } from "@/lib/client/services";
import { moveItem } from "@/lib/utils/move-item";
import { showError, showSuccess } from "@/lib/utils/toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AccountItem {
  accountId: string;
  name: string;
  balance: number;
  currency: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** The accounts of the currency being shown, in their current order. */
  accounts: AccountItem[];
  currency: string;
}

export const ReorderAccountsModal = ({ open, onClose, accounts, currency }: Props) => {
  const router = useRouter();
  const currentIds = accounts.map((account) => account.accountId);
  const currentKey = currentIds.join(",");

  const [order, setOrder] = useState<string[]>(currentIds);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Start from the order on the dashboard every time the window opens (or the accounts change)
  useEffect(() => {
    if (open) {
      setOrder(currentKey ? currentKey.split(",") : []);
      setDragIndex(null);
    }
  }, [open, currentKey]);

  const byId = new Map(accounts.map((account) => [account.accountId, account]));
  const isChanged = order.join(",") !== currentKey;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await accountService.reorderAccounts(order);
      router.refresh();
      showSuccess("Account order saved");
      onClose();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Could not save the order");
    } finally {
      setIsSaving(false);
    }
  };

  // Closing mid-save would drop the result of the request
  const handleClose = () => {
    if (!isSaving) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Reorder ${currency} accounts`}
      description="The first accounts are the ones shown on the dashboard. Drag to reorder, or use the arrows."
      maxWidth="md"
    >
      <ul className="space-y-2">
        {order.map((id, index) => {
          const account = byId.get(id);
          if (!account) return null;

          return (
            <li
              key={id}
              draggable={!isSaving}
              onDragStart={(event) => {
                setDragIndex(index);
                event.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(event) => {
                event.preventDefault(); // allow dropping here
                if (dragIndex !== null && dragIndex !== index) {
                  setOrder((current) => moveItem(current, dragIndex, index));
                  setDragIndex(index);
                }
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`flex items-center gap-3 rounded-lg border bg-white px-3 py-2 ${
                dragIndex === index ? "border-primary opacity-60" : "border-gray-200"
              }`}
            >
              <span className="w-5 shrink-0 select-none text-center text-gray-400 cursor-grab" aria-hidden="true">
                ⋮⋮
              </span>
              <span className="w-5 shrink-0 text-xs font-medium text-gray-400">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800" title={account.name}>
                {account.name}
              </span>
              <ClientOnlyCurrency
                value={account.balance}
                currency={account.currency}
                className="hidden shrink-0 text-sm text-gray-500 sm:inline"
              />
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => setOrder((current) => moveItem(current, index, index - 1))}
                  disabled={index === 0 || isSaving}
                  aria-label={`Move ${account.name} up`}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Icon name="chevronUp" className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOrder((current) => moveItem(current, index, index + 1))}
                  disabled={index === order.length - 1 || isSaving}
                  aria-label={`Move ${account.name} down`}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Icon name="chevronDown" className="size-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Pinned to the bottom of the window, so Save is always in reach however long the list is */}
      <div className="sticky bottom-0 -mx-2 -mb-2 mt-4 flex flex-col-reverse justify-end gap-3 border-t border-gray-100 bg-white px-2 py-3 sm:flex-row">
        <Button variant="ghost" size="sm" onClick={handleClose} disabled={isSaving} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
          disabled={!isChanged}
          className="w-full sm:w-auto"
        >
          {isSaving ? "Saving..." : "Save order"}
        </Button>
      </div>
    </Modal>
  );
};
