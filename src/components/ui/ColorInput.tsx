"use client";

import { FieldValues, Path, UseFormReturn } from "react-hook-form";

type Props<TData extends FieldValues> = {
  form: UseFormReturn<TData>;
  name: Path<TData>;
  label: string;
};

export const ColorInput = <TData extends FieldValues,>({
  form,
  name,
  label,
}: Props<TData>) => {
  const { formState: { errors } } = form;
  const error = errors[name]?.message as string | undefined;

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type="color"
        {...form.register(name)}
        className="w-12 h-12 p-0 border-none rounded-md bg-transparent"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};