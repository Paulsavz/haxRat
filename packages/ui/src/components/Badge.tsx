import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-medium rounded-full transition-colors',
  {
    variants: {
      variant: {
        neutral: 'bg-surface-muted text-muted-foreground',
        brand: 'bg-brand-50 text-brand-700',
        success: 'bg-emerald-50 text-emerald-700',
        warning: 'bg-amber-50 text-amber-700',
        danger: 'bg-rose-50 text-rose-700',
        outline: 'border border-border text-foreground',
      },
      size: {
        sm: 'text-[11px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
      },
    },
    defaultVariants: { variant: 'neutral', size: 'md' },
  }
);

const dotColor: Record<string, string> = {
  neutral: 'bg-slate-400',
  brand: 'bg-brand-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  outline: 'bg-slate-400',
};

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Show a leading status dot. Set `pulse` to animate it (e.g. "live"). */
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({ className, variant, size, dot, pulse, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full rounded-full opacity-75 animate-pulse-ring',
                dotColor[variant ?? 'neutral']
              )}
            />
          )}
          <span
            className={cn('relative inline-flex rounded-full h-2 w-2', dotColor[variant ?? 'neutral'])}
          />
        </span>
      )}
      {children}
    </span>
  );
}
