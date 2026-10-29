"use client";

import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { FieldLabel } from "./FieldLabel";

type Props<TData extends FieldValues> = {
  form: UseFormReturn<TData>;
  name: Path<TData>;
  label: string;
  required?: boolean;
};

export const ColorInput = <TData extends FieldValues,>({
  form,
  name,
  label,
  required,
}: Props<TData>) => {
  const { formState: { errors } } = form;
  const error = errors[name]?.message as string | undefined;

  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type="color"
        aria-required={required || undefined}
        {...form.register(name)}
        className="w-12 h-12 p-0 border-none rounded-md bg-transparent"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};