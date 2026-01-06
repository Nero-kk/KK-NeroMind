import React from 'react';

interface ToolbarButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  tooltip,
  onClick,
  active = false,
  disabled = false,
}) => {
  return (
    <button
      className={`
        nm-flex nm-items-center nm-justify-center
        nm-w-8 nm-h-8
        nm-rounded-lg
        nm-transition-all nm-duration-150
        ${active
          ? 'nm-bg-nero-accent nm-text-white'
          : 'nm-text-nero-text-light dark:nm-text-nero-text-dark nm-hover:nm-bg-nero-border-light dark:nm-hover:nm-bg-nero-border-dark'
        }
        ${disabled ? 'nm-opacity-50 nm-cursor-not-allowed' : 'nm-cursor-pointer'}
        nm-border-none
        nm-outline-none
        focus:nm-ring-2 focus:nm-ring-nero-accent focus:nm-ring-offset-1
      `}
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      aria-label={tooltip}
    >
      {icon}
    </button>
  );
};
