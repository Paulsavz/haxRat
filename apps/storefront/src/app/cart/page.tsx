'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, Tag, ArrowLeft, ShoppingBag, Loader2 } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { couponsApi } from '../../lib/api';
import { formatCurrency, cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import type { CartItem } from '../../types';

// ─── Cart Item Row ────────────────────────────────────────────────────────────

function CartItemRow({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCartStore();

  const handleQtyChange = (qty: number) => {
    updateQuantity(item.product.id, qty, item.selectedVariants);
  };

  const handleRemove = () => {
    removeItem(item.product.id, item.selectedVariants);
    toast(`${item.product.name} removed`, { icon: '🗑️' });
  };

  const mainImage = item.product.images[0];
  const variantEntries = Object.entries(item.selectedVariants ?? {});

  return (
    <div className="flex items-start gap-4 py-5 border-b border-gray-100 last:border-0">
      {/* Image */}
      <Link href={`/products/${item.product.slug}`} className="flex-shrink-0">
        <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-surface-subtle">
          {mainImage ? (
            <Image src={mainImage} alt={item.product.name} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-2xl">📦</div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/products/${item.product.slug}`}>
          <h3 className="font-semibold text-ink text-sm hover:text-primary-600 transition-colors line-clamp-2">
            {item.product.name}
          </h3>
        </Link>

        {/* Variants */}
        {variantEntries.length > 0 && (
          <p className="text-xs text-ink-muted mt-0.5">
            {variantEntries.map(([k, v]) => `${k}: ${v}`).join(' · ')}
          </p>
        )}

        <p className="text-base font-bold text-ink mt-1">
          {formatCurrency(item.product.price * item.quantity)}
        </p>
        {item.quantity > 1 && (
          <p className="text-xs text-ink-faint">
            {formatCurrency(item.product.price)} each
          </p>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => handleQtyChange(item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-surface-muted disabled:opacity-40 transition-colors"
              disabled={item.quantity <= 1}
            >
              <Minus size={13} />
            </button>
            <span className="w-9 text-center text-sm font-semibold">{item.quantity}</span>
            <button
              onClick={() => handleQtyChange(item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-surface-muted disabled:opacity-40 transition-colors"
              disabled={item.quantity >= item.product.stock}
            >
              <Plus size={13} />
            </button>
          </div>

          <button
            onClick={handleRemove}
            className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CartPage() {
  const { items, subtotal, total, couponCode, couponDiscount, applyCoupon, removeCoupon } =
    useCartStore();
  const [couponInput, setCouponInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [couponError, setCouponError] = useState('');

  const sub = subtotal();
  const tot = total();
  const isEmpty = items.length === 0;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidating(true);
    setCouponError('');
    try {
      const res = await couponsApi.validate(couponInput.trim(), sub);
      const { discount_type, discount_value } = res.data;
      const discount =
        discount_type === 'percentage' ? (sub * discount_value) / 100 : discount_value;
      applyCoupon(couponInput.trim().toUpperCase(), discount);
      toast.success(`Coupon applied! You saved ${formatCurrency(discount)}`);
      setCouponInput('');
    } catch (err: any) {
      setCouponError(err.message ?? 'Invalid or expired coupon');
    } finally {
      setValidating(false);
    }
  };

  if (isEmpty) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 bg-surface-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={40} className="text-ink-faint" />
        </div>
        <h1 className="text-2xl font-display font-bold text-ink mb-2">Your cart is empty</h1>
        <p className="text-ink-muted mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link href="/products">
          <Button size="lg" leftIcon={<ArrowLeft size={18} />}>
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-ink">Shopping Cart</h1>
        <Link href="/products" className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1">
          <ArrowLeft size={14} /> Continue Shopping
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Item list */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-soft p-5">
            <p className="text-sm font-medium text-ink-muted mb-2">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </p>
            {items.map((item) => (
              <CartItemRow key={`${item.product.id}-${JSON.stringify(item.selectedVariants)}`} item={item} />
            ))}
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          {/* Coupon */}
          <div className="bg-white rounded-3xl shadow-soft p-5">
            <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
              <Tag size={15} className="text-primary-500" /> Promo Code
            </h2>

            {couponCode ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div>
                  <p className="text-sm font-bold text-emerald-700">{couponCode}</p>
                  <p className="text-xs text-emerald-600">
                    You save {formatCurrency(couponDiscount)}
                  </p>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                />
                <Button
                  size="sm"
                  onClick={handleApplyCoupon}
                  loading={validating}
                  disabled={!couponInput.trim()}
                >
                  Apply
                </Button>
              </div>
            )}
            {couponError && (
              <p className="text-xs text-red-600 mt-2">{couponError}</p>
            )}
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-3xl shadow-soft p-5">
            <h2 className="text-base font-semibold text-ink mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-ink-muted">
                <span>Subtotal ({items.reduce((a, i) => a + i.quantity, 0)} items)</span>
                <span>{formatCurrency(sub)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Shipping</span>
                <span className="text-emerald-600">Calculated at checkout</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({couponCode})</span>
                  <span>-{formatCurrency(couponDiscount)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base text-ink">
                <span>Total</span>
                <span>{formatCurrency(tot)}</span>
              </div>
            </div>

            <Link href="/checkout" className="block mt-5">
              <Button fullWidth size="lg">
                Proceed to Checkout
              </Button>
            </Link>

            <p className="text-xs text-center text-ink-faint mt-3">
              Secure checkout powered by Paystack
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
