import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'glass' | 'interactive';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  onClick,
  variant = 'default' 
}) => {
  const variants = {
    default: "bg-white dark:bg-dark-card shadow-sm dark:shadow-none border border-gray-100 dark:border-dark-border",
    glass: "bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border border-white/20 dark:border-gray-700 shadow-xl",
    interactive: "bg-white dark:bg-dark-card shadow-sm hover:shadow-md dark:hover:border-primary-500/50 border border-gray-100 dark:border-dark-border transition-all cursor-pointer hover:-translate-y-0.5",
  };

  return (
    <div 
      onClick={onClick}
      className={`rounded-2xl p-6 ${variants[variant]} ${className}`}
    >
      {children}
    </div>
  );
};