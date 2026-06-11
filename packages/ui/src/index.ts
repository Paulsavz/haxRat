/**
 * @retail/ui — shared, animated design system for the retail platform.
 *
 * Import components, motion helpers, and utilities from a single entry point:
 *   import { Button, Card, Modal, useToast } from '@retail/ui';
 *
 * Wire-up (once per app):
 *   1. tailwind.config: presets: [require('@retail/ui/tailwind-preset')]
 *      and add '../../packages/ui/src/**\/*.{ts,tsx}' to `content`.
 *   2. import '@retail/ui/styles.css' at your app root.
 *   3. Wrap your tree in <ToastProvider> if you use toasts.
 *   (Next.js only: add transpilePackages: ['@retail/ui'] to next.config.js)
 */

// Utilities
export { cn } from './lib/cn';
export { useDisclosure, type Disclosure } from './hooks/useDisclosure';

// Motion language
export * from './motion/variants';
export { FadeIn, Stagger, PageTransition } from './motion/Motion';

// Components
export { Button, buttonVariants, type ButtonProps } from './components/Button';
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardFooter,
  StatCard,
  type CardProps,
  type StatCardProps,
} from './components/Card';
export { Badge, badgeVariants, type BadgeProps } from './components/Badge';
export { Input, type InputProps } from './components/Input';
export { Textarea, type TextareaProps } from './components/Textarea';
export { Select, type SelectProps, type SelectOption } from './components/Select';
export { Switch, type SwitchProps } from './components/Switch';
export { Modal, type ModalProps } from './components/Modal';
export { Drawer, type DrawerProps } from './components/Drawer';
export { ToastProvider, useToast, type ToastOptions } from './components/Toast';
export { Tabs, type TabsProps, type TabItem } from './components/Tabs';
export { Skeleton, SkeletonCard, type SkeletonProps } from './components/Skeleton';
export { Spinner, LoadingOverlay, type SpinnerProps } from './components/Spinner';
export { Avatar, type AvatarProps } from './components/Avatar';
export { Tooltip, type TooltipProps } from './components/Tooltip';
export { EmptyState, type EmptyStateProps } from './components/EmptyState';
export { Progress, type ProgressProps } from './components/Progress';
export { Keypad, type KeypadProps } from './components/Keypad';
