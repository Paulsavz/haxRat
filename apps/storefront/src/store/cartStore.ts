import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '../types';

// ─── State Shape ──────────────────────────────────────────────────────────────

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;

  // Actions
  addItem: (product: Product, quantity?: number, selectedVariants?: Record<string, string>) => void;
  removeItem: (productId: string, selectedVariants?: Record<string, string>) => void;
  updateQuantity: (productId: string, quantity: number, selectedVariants?: Record<string, string>) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;

  // Computed
  totalItems: () => number;
  subtotal: () => number;
  total: () => number;
}

// ─── Key Helper ───────────────────────────────────────────────────────────────

function itemKey(productId: string, variants: Record<string, string> = {}): string {
  const variantStr = Object.entries(variants)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|');
  return `${productId}__${variantStr}`;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      couponDiscount: 0,

      addItem(product, quantity = 1, selectedVariants = {}) {
        const key = itemKey(product.id, selectedVariants);
        set((state) => {
          const existing = state.items.find(
            (i) => itemKey(i.product.id, i.selectedVariants) === key
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                itemKey(i.product.id, i.selectedVariants) === key
                  ? { ...i, quantity: Math.min(i.quantity + quantity, i.product.stock) }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { product, quantity, selectedVariants }],
          };
        });
      },

      removeItem(productId, selectedVariants = {}) {
        const key = itemKey(productId, selectedVariants);
        set((state) => ({
          items: state.items.filter(
            (i) => itemKey(i.product.id, i.selectedVariants) !== key
          ),
        }));
      },

      updateQuantity(productId, quantity, selectedVariants = {}) {
        const key = itemKey(productId, selectedVariants);
        if (quantity <= 0) {
          get().removeItem(productId, selectedVariants);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            itemKey(i.product.id, i.selectedVariants) === key
              ? { ...i, quantity: Math.min(quantity, i.product.stock) }
              : i
          ),
        }));
      },

      clearCart() {
        set({ items: [], couponCode: null, couponDiscount: 0 });
      },

      applyCoupon(code, discount) {
        set({ couponCode: code, couponDiscount: discount });
      },

      removeCoupon() {
        set({ couponCode: null, couponDiscount: 0 });
      },

      totalItems() {
        return get().items.reduce((acc, i) => acc + i.quantity, 0);
      },

      subtotal() {
        return get().items.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
      },

      total() {
        const sub = get().subtotal();
        return Math.max(0, sub - get().couponDiscount);
      },
    }),
    {
      name: 'retail-cart',
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        couponDiscount: state.couponDiscount,
      }),
    }
  )
);
