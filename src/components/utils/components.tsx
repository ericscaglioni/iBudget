'use client';

import { formatCurrency, formatDate } from '@/lib/utils/format';
import { ClientOnly } from '@/components/utils/ClientOnly';
import clsx from 'clsx';

type BaseProps = {
  className?: string;
};

export const CurrencyCell = ({
  value,
  currency,
  className,
}: {
  value: number;
  currency: string;
} & BaseProps) => (
  <ClientOnly>
    <span className={clsx(className)}>{formatCurrency(value, currency)}</span>
  </ClientOnly>
);

export const DateCell = ({
  value,
  className,
}: {
  value: string | Date;
} & BaseProps) => (
  <ClientOnly>
    <span className={clsx(className)}>{formatDate(value)}</span>
  </ClientOnly>
);