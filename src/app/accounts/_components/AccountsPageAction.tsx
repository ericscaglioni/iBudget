"use client";

import { useState } from "react";
import { AccountModal } from "./AccountModal";

export function AccountsPageActions() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex justify-end mb-6">
      <button
        onClick={() => setOpen(true)}
        className="bg-primary text-white px-4 py-2 rounded-md shadow hover:bg-primary/90 transition"
      >
        + New Account
      </button>

      <AccountModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}