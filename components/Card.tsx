import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive';
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  children,
  className,
  ...props
}) => {
  return (
    <div
      {...props}
      className={clsx(
        'rounded-2xl border bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-sm transition-all duration-200',
        {
          'hover:shadow-lg hover:border-primary-400/50 cursor-pointer hover:-translate-y-0.5':
            variant === 'interactive',
        },
        className
      )}
    >
      <div className="p-5">{children}</div>
    </div>
  );
};
