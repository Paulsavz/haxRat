import { useId, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/cn';
import { spring } from '../motion/variants';

export interface TabItem {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  variant?: 'underline' | 'pill';
}

/**
 * Tab bar with a sliding active indicator driven by a shared `layoutId`,
 * so the indicator smoothly animates between tabs.
 */
export function Tabs({ items, value, onChange, className, variant = 'underline' }: TabsProps) {
  const groupId = useId();

  if (variant === 'pill') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 p-1 rounded-xl bg-surface-muted',
          className
        )}
        role="tablist"
      >
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.value)}
              className={cn(
                'relative inline-flex items-center gap-2 px-3.5 h-8 rounded-lg text-sm font-medium transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {active && (
                <motion.span
                  layoutId={`${groupId}-pill`}
                  transition={spring}
                  className="absolute inset-0 rounded-lg bg-surface shadow-soft"
                />
              )}
              <span className="relative flex items-center gap-2">
                {item.icon}
                {item.label}
                {item.badge}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1 border-b border-border', className)} role="tablist">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative inline-flex items-center gap-2 px-3.5 pb-2.5 pt-1 text-sm font-medium transition-colors',
              active ? 'text-brand-600' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="flex items-center gap-2">
              {item.icon}
              {item.label}
              {item.badge}
            </span>
            {active && (
              <motion.span
                layoutId={`${groupId}-underline`}
                transition={spring}
                className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-brand-500"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
