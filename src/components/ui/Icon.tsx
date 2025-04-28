import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, ChevronDownIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid';

const iconMap = {
  edit: PencilSquareIcon,
  delete: TrashIcon,
  arrowLeft: ArrowLeftIcon,
  arrowRight: ArrowRightIcon,
  checkMark: CheckIcon,
  chevronDownIcon: ChevronDownIcon,
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