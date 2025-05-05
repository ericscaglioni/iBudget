'use client';

type Props = {
  label: string;
  color: string; // expected to be a HEX color (e.g. #10B981)
  icon?: React.ReactNode; // optional icon prop
};

export const Chip = ({ label, color, icon }: Props) => {
  return (
    <span
      className="inline-block px-2 py-1 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      <div className="flex flex-row items-center gap-1">
        {icon && icon}
        {label}
      </div>
    </span>
  );
};