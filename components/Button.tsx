import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  ...props
}) => {
  const styles = clsx(
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 select-none',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
    {
      // --- SIZE VARIANTS ---
      'px-3 py-1.5 text-xs': size === 'sm',
      'px-4 py-2 text-sm': size === 'md',
      'px-5 py-3 text-base': size === 'lg',

      // --- WIDTH ---
      'w-full': fullWidth,

      // --- VARIANTS ---
      'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/20':
        variant === 'primary',

      'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-700':
        variant === 'secondary',

      'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800':
        variant === 'ghost',
    },
    className
  );

  return (
    <button {...props} className={styles}>
      {children}
    </button>
  );
};
