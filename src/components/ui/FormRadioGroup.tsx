"use client";

import { UseFormReturn, Path, FieldValues, useWatch } from "react-hook-form";
import { FieldLabel } from "./FieldLabel";
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
  required?: boolean;
}

export const FormRadioGroup = <TFormValues extends FieldValues>({
  form,
  name,
  label,
  options,
  className,
  required,
}: FormRadioGroupProps<TFormValues>) => {
  const {
    setValue,
    formState: { errors },
  } = form;

  const value = useWatch({ control: form.control, name });
  const error = errors[name]?.message as string | undefined;

  return (
    <div className={className}>
      <FieldLabel required={required} className="text-gray-700">{label}</FieldLabel>
      <RadioGroup
        options={options}
        value={value}
        onChange={(val) => setValue(name, val as never, { shouldValidate: true, shouldDirty: true })}
        name={name}
        className="mt-2"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

