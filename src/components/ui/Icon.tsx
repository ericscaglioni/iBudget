import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  PencilSquareIcon,
  TrashIcon,
  Bars3Icon,
  XMarkIcon,
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
  chevronLeft: ChevronLeftIcon,
  chevronRight: ChevronRightIcon,
  chevronUp: ChevronUpIcon,
  edit: PencilSquareIcon,
  menu: Bars3Icon,
  close: XMarkIcon,
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