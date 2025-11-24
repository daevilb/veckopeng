import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label
          className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 ml-1"
        >
          {label}
        </label>
      )}

      <input
        {...props}
        className={clsx(
          'w-full px-3 py-2 rounded-xl border text-gray-900 dark:text-gray-100',
          'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700',
          'focus:outline-none focus:ring-2 focus:ring-primary-500',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
      />

      {error && (
        <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>
      )}
    </div>
  );
};
