import * as React from 'react';
import { cn } from '@/lib/utils';

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/70 disabled:pointer-events-none disabled:opacity-60';

const variantStyles = {
  primary: 'bg-primary text-foreground hover:bg-primary-hover active:bg-primary-active',
  secondary:
    'border border-white/10 bg-surface text-foreground hover:bg-surface-hover active:bg-surface-active',
  ghost: 'text-foreground hover:bg-white/10 active:bg-white/20',
  outline:
    'border border-primary/60 text-primary hover:bg-primary-light hover:text-foreground active:bg-primary-light-active'
} as const;

const sizeStyles = {
  sm: 'h-9 px-4',
  md: 'h-11 px-5',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10'
} as const;

type Variant = keyof typeof variantStyles;
type Size = keyof typeof sizeStyles;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  return cn(baseStyles, variantStyles[variant], sizeStyles[size], className);
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, ...props }, ref) => (
    <button ref={ref} className={buttonClasses({ variant, size, className })} {...props} />
  )
);
Button.displayName = 'Button';
