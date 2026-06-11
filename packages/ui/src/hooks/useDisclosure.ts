import { useCallback, useState } from 'react';

export interface Disclosure {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
  setOpen: (v: boolean) => void;
}

/** Open/close state helper for modals, drawers, popovers, menus. */
export function useDisclosure(initial = false): Disclosure {
  const [open, setOpen] = useState(initial);
  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);
  const onToggle = useCallback(() => setOpen((v) => !v), []);
  return { open, onOpen, onClose, onToggle, setOpen };
}
