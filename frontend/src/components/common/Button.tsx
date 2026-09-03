import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2 rounded-xl gap-2',
    lg: 'text-base px-6 py-3 rounded-xl gap-2.5 font-semibold',
  }[size];

  const variantClasses = {
    primary:
      'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-sm hover:shadow transition-all disabled:bg-teal-300',
    secondary:
      'bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white shadow-sm transition-all disabled:bg-slate-400',
    success:
      'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm transition-all disabled:bg-emerald-300',
    danger:
      'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm transition-all disabled:bg-rose-300',
    outline:
      'border border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-700 disabled:opacity-50',
    ghost:
      'hover:bg-slate-100 active:bg-slate-200 text-slate-700 disabled:opacity-50',
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-medium cursor-pointer transition-all duration-150 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
