'use client';

type Props = {
  label: string;
  color: string; // expected to be a HEX color (e.g. #10B981)
  icon?: React.ReactNode; // optional icon prop
};

export const Chip = ({ label, color, icon }: Props) => {
  return (
    <span
      className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium text-white whitespace-nowrap"
      style={{ backgroundColor: color }}
    >
      <div className="flex flex-row items-center gap-0.5 sm:gap-1">
        {icon && icon}
        <span className="truncate">{label}</span>
      </div>
    </span>
  );
};