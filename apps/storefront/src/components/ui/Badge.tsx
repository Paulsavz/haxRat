import { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

// ─── Variants ─────────────────────────────────────────────────────────────────

const variants = {
  default:  'bg-gray-100 text-gray-700',
  primary:  'bg-primary-100 text-primary-700',
  success:  'bg-emerald-100 text-emerald-700',
  warning:  'bg-amber-100 text-amber-700',
  danger:   'bg-red-100 text-red-700',
  info:     'bg-sky-100 text-sky-700',
  outline:  'border border-current text-gray-700',
};

const sizes = {
  sm: 'text-xs px-1.5 py-0.5 rounded-md',
  md: 'text-xs px-2 py-1 rounded-lg',
  lg: 'text-sm px-3 py-1 rounded-lg',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  dot?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Badge({ variant = 'default', size = 'md', dot, children, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
      {children}
    </span>
  );
}

// ─── Order Status Badge ───────────────────────────────────────────────────────

const statusConfig = {
  placed:      { variant: 'info' as const,    label: 'Order Placed' },
  confirmed:   { variant: 'primary' as const, label: 'Confirmed' },
  processing:  { variant: 'warning' as const, label: 'Processing' },
  shipped:     { variant: 'info' as const,    label: 'Shipped' },
  delivered:   { variant: 'success' as const, label: 'Delivered' },
  cancelled:   { variant: 'danger' as const,  label: 'Cancelled' },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] ?? { variant: 'default' as const, label: status };
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}
