# @retail/ui

A shared, animated design system for the retail platform. One set of modern,
themeable components that **any module** — the admin app, the storefront, or
anything you add next — can import from a single place.

- ⚛️ **React + TypeScript**, built on Tailwind tokens.
- 🎞️ **Animation built in** via `framer-motion` (enter/exit, layout, spring press feedback) with a shared motion language.
- 🎨 **Themeable** through CSS variables — light/dark out of the box, re-brand by overriding a few variables.
- ♿ **Accessible & reduced-motion aware** — respects `prefers-reduced-motion`, ships ARIA roles and focus states.
- 🧩 **POS-ready** — includes a touch `Keypad`, `StatCard`, status `Badge`s, toasts, drawers, and more.

## What's inside

| Category | Components |
| --- | --- |
| Actions | `Button` |
| Layout | `Card`, `CardHeader/Title/Description/Body/Footer`, `StatCard` |
| Forms | `Input`, `Textarea`, `Select`, `Switch`, `Keypad` |
| Overlays | `Modal`, `Drawer`, `Tooltip`, `ToastProvider` + `useToast` |
| Navigation | `Tabs` (underline / pill, animated indicator) |
| Feedback | `Badge`, `Progress`, `Spinner`, `LoadingOverlay`, `Skeleton`, `SkeletonCard`, `EmptyState` |
| Media | `Avatar` |
| Motion | `FadeIn`, `Stagger`, `PageTransition`, + variants (`fadeIn`, `slideUp`, `scaleIn`, `staggerContainer`, `spring`, …) |
| Utilities | `cn`, `useDisclosure` |

## Setup (once per app)

1. **Add the dependency** (workspaces resolve it locally):

   ```jsonc
   // apps/<your-app>/package.json
   "dependencies": { "@retail/ui": "*" }
   ```

2. **Extend Tailwind** with the shared preset and scan the package source:

   ```ts
   // tailwind.config.ts
   import preset from '@retail/ui/tailwind-preset';

   export default {
     presets: [preset],
     content: [
       './src/**/*.{ts,tsx}',
       '../../packages/ui/src/**/*.{ts,tsx}', // so DS classes aren't purged
     ],
   };
   ```

3. **Import the theme variables** once at your app root:

   ```ts
   import '@retail/ui/styles.css';
   ```

4. **Next.js only** — transpile the workspace package:

   ```js
   // next.config.js
   module.exports = { transpilePackages: ['@retail/ui'] };
   ```

5. **Wrap your tree** in `ToastProvider` if you use toasts:

   ```tsx
   import { ToastProvider } from '@retail/ui';

   <ToastProvider>
     <App />
   </ToastProvider>;
   ```

## Usage

```tsx
import { Button, Card, CardBody, Modal, useDisclosure, useToast } from '@retail/ui';

function NewSaleCard() {
  const dialog = useDisclosure();
  const { toast } = useToast();

  return (
    <Card>
      <CardBody>
        <Button onClick={dialog.onOpen}>New sale</Button>
        <Modal
          open={dialog.open}
          onClose={dialog.onClose}
          title="Confirm payment"
          footer={
            <Button onClick={() => { dialog.onClose(); toast({ tone: 'success', title: 'Paid' }); }}>
              Charge
            </Button>
          }
        >
          Charge the customer GHS 120.00?
        </Modal>
      </CardBody>
    </Card>
  );
}
```

### Theming

Every color comes from a CSS variable defined in `styles.css`. To re-brand,
override them in your own stylesheet (or per `.dark`):

```css
:root {
  --ui-brand: 262 83% 58%;   /* purple brand */
  --ui-radius: 1rem;         /* rounder corners */
}
```

Toggle dark mode by adding `class="dark"` to `<html>`.

### Motion

Reach for the prebuilt wrappers, or compose with the exported variants:

```tsx
import { motion } from 'framer-motion';
import { Stagger, slideUp } from '@retail/ui';

<Stagger className="grid gap-4">
  {items.map((i) => <Stagger.Item key={i.id}>…</Stagger.Item>)}
</Stagger>

<motion.div variants={slideUp} initial="hidden" animate="visible">…</motion.div>
```

## Live style guide

`Showcase` renders every component on one screen — handy as a reference or a
visual smoke test:

```tsx
import { ToastProvider } from '@retail/ui';
import { Showcase } from '@retail/ui/src/Showcase';

export default () => (
  <ToastProvider>
    <Showcase />
  </ToastProvider>
);
```
