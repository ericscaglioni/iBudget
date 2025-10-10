"use client";

import { useEffect, useState } from "react";

interface Props {
  value: number;
  currency: string;
  className?: string;
}

export const ClientOnlyCurrency = ({ value, currency, className = "" }: Props) => {
  const [formattedValue, setFormattedValue] = useState<string | null>(null);

  useEffect(() => {
    // Format currency only on the client after hydration
    const formatted = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(value);
    
    setFormattedValue(formatted);
  }, [value, currency]);

  // Show a placeholder while formatting (during SSR and before hydration)
  if (formattedValue === null) {
    return <span className={className}>...</span>;
  }

  return <span className={className}>{formattedValue}</span>;
};

