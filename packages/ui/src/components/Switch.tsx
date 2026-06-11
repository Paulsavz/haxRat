import { motion } from 'framer-motion';
import { cn } from '../lib/cn';
import { spring } from '../motion/variants';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  id?: string;
}

/** Animated toggle with a spring-driven thumb. */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
  className,
  id,
}: SwitchProps) {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-2.5 select-none',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className
      )}
    >
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          checked ? 'bg-brand' : 'bg-surface-muted border border-border'
        )}
      >
        <motion.span
          layout
          transition={spring}
          className={cn(
            'inline-block h-5 w-5 rounded-full bg-white shadow-sm',
            checked ? 'ml-5' : 'ml-0.5'
          )}
        />
      </button>
      {label && <span className="text-sm text-foreground">{label}</span>}
    </label>
  );
}
