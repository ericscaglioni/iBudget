"use client";

interface Option {
  label: string;
  value: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const SegmentedControl = ({ options, value, onChange, label }: Props) => {
  return (
    <div className="w-full sm:w-auto">
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <div className="inline-flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all ${
              value === option.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

