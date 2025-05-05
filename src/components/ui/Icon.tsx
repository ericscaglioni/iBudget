import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/20/solid';

const iconMap = {
  arrowDown: ArrowDownIcon,
  arrowLeft: ArrowLeftIcon,
  arrowLoop: ArrowPathIcon,
  arrowRight: ArrowRightIcon,
  arrowUp: ArrowUpIcon,
  delete: TrashIcon,
  checkMark: CheckIcon,
  chevronDown: ChevronDownIcon,
  chevronUp: ChevronUpIcon,
  edit: PencilSquareIcon,
};

export type IconType = keyof typeof iconMap;

interface IconProps {
  name: IconType;
  className?: string;
  onClick?: () => void;
}

export const Icon = ({ name, className, onClick }: IconProps) => {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    return null;
  }

  return (
    <IconComponent
      className={`h-4 w-4 ${className}`}
      onClick={onClick}
    />
  );
}