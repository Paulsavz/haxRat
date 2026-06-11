import { motion } from 'framer-motion';
import { cn } from '../lib/cn';
import { easeSmooth } from '../motion/variants';

export interface ProgressProps {
  /** 0–100. Omit for an indeterminate bar. */
  value?: number;
  tone?: 'brand' | 'success' | 'warning' | 'danger';
  className?: string;
}

const toneMap = {
  brand: 'bg-brand-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
};

export function Progress({ value, tone = 'brand', className }: ProgressProps) {
  const indeterminate = value == null;
  const clamped = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-muted', className)}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {indeterminate ? (
        <motion.div
          className={cn('h-full w-1/3 rounded-full', toneMap[tone])}
          animate={{ x: ['-100%', '300%'] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : (
        <motion.div
          className={cn('h-full rounded-full', toneMap[tone])}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={easeSmooth}
        />
      )}
    </div>
  );
}
