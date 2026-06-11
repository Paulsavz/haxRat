import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/cn';
import { spring } from '../motion/variants';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Lift slightly on hover — good for clickable cards. */
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive, children, ...props }, ref) => {
    if (interactive) {
      return (
        <motion.div
          ref={ref}
          whileHover={{ y: -3 }}
          transition={spring}
          className={cn(
            'rounded-2xl border border-border bg-surface shadow-card cursor-pointer hover:shadow-lifted transition-shadow',
            className
          )}
          {...(props as any)}
        >
          {children}
        </motion.div>
      );
    }
    return (
      <div
        ref={ref}
        className={cn('rounded-2xl border border-border bg-surface shadow-card', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 pt-5 pb-4 border-b border-border', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold text-foreground', className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground mt-0.5', className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-6 py-4 border-t border-border flex items-center gap-3', className)}
      {...props}
    />
  );
}

export interface StatCardProps {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  change?: string;
  trend?: 'up' | 'down' | 'flat';
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'muted';
  className?: string;
}

const toneMap: Record<NonNullable<StatCardProps['tone']>, string> = {
  brand: 'bg-brand-50 text-brand-600',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-rose-50 text-rose-600',
  muted: 'bg-surface-muted text-muted-foreground',
};

/** Dashboard metric tile with an icon and optional trend indicator. */
export function StatCard({
  title,
  value,
  icon,
  change,
  trend = 'flat',
  tone = 'brand',
  className,
}: StatCardProps) {
  const trendColor =
    trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-500' : 'text-muted-foreground';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className={cn(
        'rounded-2xl border border-border bg-surface shadow-card p-5 flex items-start gap-4',
        className
      )}
    >
      {icon && <div className={cn('p-3 rounded-xl shrink-0', toneMap[tone])}>{icon}</div>}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {change && <p className={cn('text-xs mt-1 font-medium', trendColor)}>{change}</p>}
      </div>
    </motion.div>
  );
}
