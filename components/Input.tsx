import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement> {
  label?: string;
  error?: string;
  as?: 'input' | 'select';
  children?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  className = '', 
  as = 'input', 
  children, 
  ...props 
}) => {
  const baseStyles = `
    w-full px-4 py-3 rounded-xl border 
    bg-white dark:bg-dark-card 
    border-gray-200 dark:border-dark-border 
    text-gray-900 dark:text-white 
    placeholder-gray-400 dark:placeholder-gray-500
    focus:ring-2 focus:ring-primary-500 focus:border-transparent 
    outline-none transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <div className="flex flex-col gap-1.5 mb-4">
      {label && (
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 ml-1">
          {label}
        </label>
      )}
      
      {as === 'select' ? (
        <select className={`${baseStyles} ${className}`} {...props as any}>
          {children}
        </select>
      ) : (
        <input className={`${baseStyles} ${className}`} {...props} />
      )}
      
      {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
    </div>
  );
};