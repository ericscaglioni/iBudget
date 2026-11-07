'use client';

import clsx from 'clsx';
import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';

const base =
  'inline-flex items-center justify-center font-medium rounded-md transition focus:outline-none focus:ring-2 focus:ring-brand/50';

const variants = {
    primary: 'bg-brand text-on-brand hover:bg-brand/90',
    outline: 'border border-line text-ink bg-surface hover:bg-paper',
    danger: 'bg-expense text-on-brand hover:bg-expense/90',
    ghost: 'bg-transparent text-muted hover:text-ink',
};

const sizes = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-4 py-2',
};

type ButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled,
    className,
    ...props
  },
  ref,
) {
  const isDisabled = isLoading || disabled;

  return (
    <button
      ref={ref}
      type="button"
      disabled={isDisabled}
      className={clsx(
        base,
        variants[variant],
        sizes[size],
        isDisabled && 'opacity-60 cursor-not-allowed',
        className
      )}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && (
        <span
          aria-hidden="true"
          className="mr-2 size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
});
