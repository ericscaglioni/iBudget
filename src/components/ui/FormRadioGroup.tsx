"use client";

import { UseFormReturn, Path, FieldValues, useWatch } from "react-hook-form";
import { RadioGroup } from "./RadioGroup";

interface RadioOption {
  value: string;
  label: string;
}

interface FormRadioGroupProps<TFormValues extends FieldValues> {
  form: UseFormReturn<TFormValues>;
  name: Path<TFormValues>;
  label: string;
  options: RadioOption[];
  className?: string;
}

export const FormRadioGroup = <TFormValues extends FieldValues>({
  form,
  name,
  label,
  options,
  className,
}: FormRadioGroupProps<TFormValues>) => {
  const {
    setValue,
    formState: { errors },
  } = form;

  const value = useWatch({ control: form.control, name });
  const error = errors[name]?.message as string | undefined;

  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <RadioGroup
        options={options}
        value={value}
        onChange={(val) => setValue(name, val as any, { shouldValidate: true, shouldDirty: true })}
        name={name}
        className="mt-2"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

