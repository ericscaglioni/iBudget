'use client';

import clsx from 'clsx';
import { ButtonHTMLAttributes, ReactNode } from 'react';

const base =
  'inline-flex items-center justify-center font-medium rounded-md transition focus:outline-none focus:ring-2 focus:ring-primary/50';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary/90',
  outline: 'border border-gray-300 text-gray-800 bg-white hover:bg-gray-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-gray-500 hover:text-gray-700',
};

  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2',
  };

type ButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md';

type Props = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  ...props
}: Props) => {
  const isDisabled = isLoading || disabled;

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={clsx(
        base,
        variants[variant],
        sizes[size],
        isDisabled && 'opacity-60 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};