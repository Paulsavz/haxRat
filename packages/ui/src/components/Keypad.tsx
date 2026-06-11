import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';
import { cn } from '../lib/cn';
import { spring } from '../motion/variants';

export interface KeypadProps {
  /** Current entered string (controlled). */
  value: string;
  onChange: (value: string) => void;
  /** Allow a single decimal point (for amounts). Default true. */
  decimal?: boolean;
  /** Max number of digits/characters. */
  maxLength?: number;
  className?: string;
}

/**
 * Touch-friendly numeric keypad for POS flows: amount entry, quantity, PIN.
 * Keys give spring-based press feedback. Fully controlled.
 */
export function Keypad({ value, onChange, decimal = true, maxLength = 12, className }: KeypadProps) {
  const press = (key: string) => {
    if (key === 'del') {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === '.') {
      if (!decimal || value.includes('.')) return;
      onChange((value === '' ? '0' : value) + '.');
      return;
    }
    if (value.length >= maxLength) return;
    if (value === '0' && key !== '.') {
      onChange(key);
      return;
    }
    onChange(value + key);
  };

  const keys: { label: React.ReactNode; key: string }[] = [
    { label: '1', key: '1' },
    { label: '2', key: '2' },
    { label: '3', key: '3' },
    { label: '4', key: '4' },
    { label: '5', key: '5' },
    { label: '6', key: '6' },
    { label: '7', key: '7' },
    { label: '8', key: '8' },
    { label: '9', key: '9' },
    { label: decimal ? '.' : '', key: '.' },
    { label: '0', key: '0' },
    { label: <Delete size={20} />, key: 'del' },
  ];

  return (
    <div className={cn('grid grid-cols-3 gap-2.5', className)}>
      {keys.map((k, i) => {
        const disabled = k.key === '.' && !decimal;
        return (
          <motion.button
            key={i}
            type="button"
            disabled={disabled}
            whileTap={{ scale: disabled ? 1 : 0.92 }}
            transition={spring}
            onClick={() => press(k.key)}
            className={cn(
              'h-14 rounded-xl text-xl font-semibold flex items-center justify-center transition-colors',
              'bg-surface border border-border text-foreground shadow-soft',
              'hover:bg-surface-muted active:bg-muted',
              disabled && 'opacity-0 pointer-events-none',
              k.key === 'del' && 'text-muted-foreground'
            )}
          >
            {k.label}
          </motion.button>
        );
      })}
    </div>
  );
}
