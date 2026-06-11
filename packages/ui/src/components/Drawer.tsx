import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../lib/cn';
import { easeSmooth } from '../motion/variants';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right' | 'bottom';
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const offscreen = {
  left: { x: '-100%' },
  right: { x: '100%' },
  bottom: { y: '100%' },
};

const positionClass = {
  left: 'top-0 left-0 h-full w-[min(420px,90vw)] rounded-r-2xl',
  right: 'top-0 right-0 h-full w-[min(420px,90vw)] rounded-l-2xl',
  bottom: 'bottom-0 inset-x-0 max-h-[85vh] rounded-t-2xl',
};

/** Slide-over panel (sheet) anchored to an edge of the screen. */
export function Drawer({
  open,
  onClose,
  side = 'right',
  title,
  children,
  footer,
  className,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            initial={offscreen[side]}
            animate={{ x: 0, y: 0 }}
            exit={offscreen[side]}
            transition={easeSmooth}
            className={cn(
              'absolute bg-surface shadow-float flex flex-col',
              positionClass[side],
              className
            )}
          >
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-base font-semibold text-foreground">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="-mr-1.5 p-1.5 rounded-lg text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
            {footer && (
              <div className="px-5 py-4 border-t border-border flex items-center gap-3 bg-surface-subtle">
                {footer}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
