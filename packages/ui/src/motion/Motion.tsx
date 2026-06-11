import { type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { fadeIn, slideUp, staggerContainer, staggerItem } from './variants';

type DivProps = HTMLMotionProps<'div'>;

/** Fade + lift content in on mount. */
export function FadeIn({ children, ...props }: { children: ReactNode } & DivProps) {
  return (
    <motion.div variants={slideUp} initial="hidden" animate="visible" exit="exit" {...props}>
      {children}
    </motion.div>
  );
}

/**
 * Reveal a list of children one after another.
 * Wrap each child in <Stagger.Item> (or use the exported `staggerItem`).
 */
export function Stagger({ children, ...props }: { children: ReactNode } & DivProps) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" {...props}>
      {children}
    </motion.div>
  );
}

Stagger.Item = function StaggerItem({ children, ...props }: { children: ReactNode } & DivProps) {
  return (
    <motion.div variants={staggerItem} {...props}>
      {children}
    </motion.div>
  );
};

/** Generic page-transition wrapper. Use as the root of a route. */
export function PageTransition({ children, ...props }: { children: ReactNode } & DivProps) {
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" exit="exit" {...props}>
      {children}
    </motion.div>
  );
}
