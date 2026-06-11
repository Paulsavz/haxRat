import type { Transition, Variants } from 'framer-motion';

/**
 * Shared motion language. Components in this package use these so animation
 * feels consistent everywhere, and any module can reuse them directly with
 * `motion.div`.
 */

/** Snappy, natural spring used for interactive elements. */
export const spring: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 32,
  mass: 0.8,
};

/** Smooth easing curve (iOS-style) for enter/exit. */
export const easeSmooth: Transition = {
  duration: 0.28,
  ease: [0.32, 0.72, 0, 1],
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: easeSmooth },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: easeSmooth },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: easeSmooth },
  exit: { opacity: 0, y: 12, transition: { duration: 0.15 } },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0, transition: easeSmooth },
  exit: { opacity: 0, y: -12, transition: { duration: 0.15 } },
};

/** Container that staggers its children in. Pair with `staggerItem`. */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: easeSmooth },
};

/** Press / hover feedback for tappable surfaces. */
export const tapScale = {
  whileHover: { scale: 1.015 },
  whileTap: { scale: 0.97 },
  transition: spring,
};
