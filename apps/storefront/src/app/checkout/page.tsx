'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin, CreditCard, Truck, ChevronDown, ChevronUp, Loader2,
  CheckCircle, Package,
} from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { ordersApi, deliveryApi, authApi } from '../../lib/api';
import { formatCurrency, cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import toast from 'react-hot-toast';
import type { Address, DeliveryZone } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddressForm {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  country: string;
}

const EMPTY_ADDRESS: AddressForm = {
  name: '', phone: '', line1: '', line2: '',
  city: '', region: '', country: 'Ghana',
};

const REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern',
  'Brong-Ahafo', 'Northern', 'Upper East', 'Upper West', 'Volta',
];

const PAYMENT_METHODS = [
  { id: 'paystack_card', label: 'Debit / Credit Card', icon: '💳', desc: 'Visa, Mastercard, Verve' },
  { id: 'paystack_mobile_money', label: 'Mobile Money', icon: '📱', desc: 'MTN, Vodafone, AirtelTigo' },
  { id: 'paystack_bank', label: 'Bank Transfer', icon: '🏦', desc: 'Direct bank transfer' },
  { id: 'cod', label: 'Pay on Delivery', icon: '💵', desc: 'Cash on delivery' },
];

// ─── Step Header ──────────────────────────────────────────────────────────────

function StepHeader({ num, title, isActive, isDone }: { num: number; title: string; isActive: boolean; isDone: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-4 rounded-2xl transition-colors',
      isActive ? 'bg-primary-50' : isDone ? 'bg-surface-muted' : 'bg-white'
    )}>
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
        isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary-600 text-white' : 'bg-gray-200 text-ink-muted'
      )}>
        {isDone ? <CheckCircle size={16} /> : num}
      </div>
      <span className={cn('font-semibold text-sm', isActive ? 'text-primary-700' : 'text-ink')}>
        {title}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, total, couponCode, couponDiscount, clearCart } = useCartStore();
  const { session } = useAuthStore();

  const [step, setStep] = useState<'address' | 'delivery' | 'payment'>('address');
  const [addressForm, setAddressForm] = useState<AddressForm>(EMPTY_ADDRESS);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('paystack_card');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  const sub = subtotal();
  const disc = couponDiscount;
  const selectedZone = zones.find((z) => z.id === selectedZoneId);
  const deliveryFee = selectedZone?.fee ?? 0;
  const grandTotal = Math.max(0, sub - disc) + deliveryFee;

  // Load saved addresses + zones
  useEffect(() => {
    if (session) {
      authApi.addresses()
        .then((r) => {
          setSavedAddresses(r.data);
          const def = r.data.find((a) => a.is_default);
          if (def) {
            setSelectedAddressId(def.id);
            setAddressForm({
              name: def.name, phone: def.phone,
              line1: def.line1, line2: def.line2 ?? '',
              city: def.city, region: def.region ?? '',
              country: def.country,
            });
          }
        })
        .catch(console.error);
    }
    deliveryApi.zones()
      .then((r) => {
        setZones(r.data.filter((z) => z.is_active));
        if (r.data.length) setSelectedZoneId(r.data[0].id);
      })
      .catch(console.error);
  }, [session]);

  const handleAddressChange = (field: keyof AddressForm, value: string) => {
    setAddressForm((f) => ({ ...f, [field]: value }));
  };

  const handlePlaceOrder = async () => {
    if (!addressForm.name || !addressForm.phone || !addressForm.line1 || !addressForm.city) {
      toast.error('Please complete your delivery address');
      setStep('address');
      return;
    }
    if (!selectedZoneId) {
      toast.error('Please select a delivery zone');
      setStep('delivery');
      return;
    }
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setPlacing(true);
    try {
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        variant: item.selectedVariants,
      }));

      const res = await ordersApi.create({
        address: {
          name: addressForm.name,
          phone: addressForm.phone,
          line1: addressForm.line1,
          line2: addressForm.line2 || undefined,
          city: addressForm.city,
          region: addressForm.region || undefined,
          country: addressForm.country,
        },
        delivery_zone_id: selectedZoneId,
        payment_method: paymentMethod,
        coupon_code: couponCode ?? undefined,
        notes: notes || undefined,
        items: orderItems,
      });

      clearCart();
      toast.success('Order placed successfully!');
      router.push(`/order-confirmation/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Package size={48} className="mx-auto text-ink-faint mb-4" />
        <h1 className="text-xl font-bold text-ink mb-2">Your cart is empty</h1>
        <Button onClick={() => router.push('/products')}>Shop Now</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-display font-bold text-ink mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Steps */}
        <div className="lg:col-span-2 space-y-4">
          {/* Step 1: Address */}
          <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
            <button
              onClick={() => setStep(step === 'address' ? 'delivery' : 'address')}
              className="w-full"
            >
              <StepHeader
                num={1}
                title="Delivery Address"
                isActive={step === 'address'}
                isDone={step !== 'address' && !!addressForm.line1}
              />
            </button>

            {step === 'address' && (
              <div className="px-5 pb-5 border-t border-gray-50">
                {/* Saved addresses */}
                {savedAddresses.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-sm font-medium text-ink-muted mb-2">Saved Addresses</p>
                    {savedAddresses.map((addr) => (
                      <label key={addr.id} className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer hover:border-primary-400 transition-colors">
                        <input
                          type="radio"
                          name="saved-address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => {
                            setSelectedAddressId(addr.id);
                            setAddressForm({
                              name: addr.name, phone: addr.phone,
                              line1: addr.line1, line2: addr.line2 ?? '',
                              city: addr.city, region: addr.region ?? '',
                              country: addr.country,
                            });
                          }}
                          className="mt-1 accent-primary-600"
                        />
                        <div className="text-sm">
                          <p className="font-semibold">{addr.name}</p>
                          <p className="text-ink-muted">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                          <p className="text-ink-muted">{addr.city}, {addr.region}</p>
                        </div>
                      </label>
                    ))}
                    <button
                      onClick={() => setSelectedAddressId(null)}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Add new address
                    </button>
                  </div>
                )}

                {/* Address form */}
                {!selectedAddressId && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <Input label="Full Name" value={addressForm.name} onChange={(e) => handleAddressChange('name', e.target.value)} required fullWidth />
                    <Input label="Phone Number" type="tel" value={addressForm.phone} onChange={(e) => handleAddressChange('phone', e.target.value)} required fullWidth />
                    <Input label="Address Line 1" value={addressForm.line1} onChange={(e) => handleAddressChange('line1', e.target.value)} className="sm:col-span-2" required fullWidth />
                    <Input label="Address Line 2 (optional)" value={addressForm.line2} onChange={(e) => handleAddressChange('line2', e.target.value)} className="sm:col-span-2" fullWidth />
                    <Input label="City" value={addressForm.city} onChange={(e) => handleAddressChange('city', e.target.value)} required fullWidth />
                    <Select
                      label="Region"
                      value={addressForm.region}
                      onChange={(e) => handleAddressChange('region', e.target.value)}
                      options={REGIONS.map((r) => ({ value: r, label: r }))}
                      placeholder="Select region"
                      fullWidth
                    />
                  </div>
                )}

                <Button
                  className="mt-4"
                  onClick={() => setStep('delivery')}
                  disabled={!addressForm.name || !addressForm.line1}
                  fullWidth
                >
                  Continue to Delivery
                </Button>
              </div>
            )}
          </div>

          {/* Step 2: Delivery Zone */}
          <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
            <button onClick={() => setStep('delivery')} className="w-full">
              <StepHeader
                num={2}
                title="Delivery Zone"
                isActive={step === 'delivery'}
                isDone={step === 'payment' && !!selectedZoneId}
              />
            </button>

            {step === 'delivery' && (
              <div className="px-5 pb-5 border-t border-gray-50 space-y-3">
                {zones.map((zone) => (
                  <label key={zone.id} className={cn(
                    'flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors',
                    selectedZoneId === zone.id ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  )}>
                    <input
                      type="radio"
                      name="zone"
                      checked={selectedZoneId === zone.id}
                      onChange={() => setSelectedZoneId(zone.id)}
                      className="mt-1 accent-primary-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-ink">{zone.name}</p>
                        <p className="font-bold text-primary-700 text-sm">
                          {zone.fee === 0 ? 'FREE' : formatCurrency(zone.fee)}
                        </p>
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {zone.min_days}–{zone.max_days} business days · {zone.regions.join(', ')}
                      </p>
                    </div>
                  </label>
                ))}

                {zones.length === 0 && (
                  <p className="text-sm text-ink-muted py-4 text-center">
                    No delivery zones available. Contact us.
                  </p>
                )}

                <Textarea
                  label="Order Notes (optional)"
                  placeholder="Special instructions, landmark, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  fullWidth
                />

                <Button fullWidth onClick={() => setStep('payment')} disabled={!selectedZoneId}>
                  Continue to Payment
                </Button>
              </div>
            )}
          </div>

          {/* Step 3: Payment */}
          <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
            <button onClick={() => setStep('payment')} className="w-full">
              <StepHeader num={3} title="Payment Method" isActive={step === 'payment'} isDone={false} />
            </button>

            {step === 'payment' && (
              <div className="px-5 pb-5 border-t border-gray-50 space-y-3">
                {PAYMENT_METHODS.map((pm) => (
                  <label key={pm.id} className={cn(
                    'flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors',
                    paymentMethod === pm.id ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  )}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === pm.id}
                      onChange={() => setPaymentMethod(pm.id)}
                      className="accent-primary-600"
                    />
                    <span className="text-2xl">{pm.icon}</span>
                    <div>
                      <p className="font-semibold text-sm text-ink">{pm.label}</p>
                      <p className="text-xs text-ink-muted">{pm.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl shadow-soft p-5 sticky top-24">
            <h2 className="text-base font-semibold text-ink mb-4">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={`${item.product.id}-${JSON.stringify(item.selectedVariants)}`} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-surface-subtle flex-shrink-0">
                    {item.product.images[0] ? (
                      <img src={item.product.images[0]} alt={item.product.name} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-ink-muted">x{item.quantity}</p>
                  </div>
                  <p className="text-xs font-bold text-ink flex-shrink-0">
                    {formatCurrency(item.product.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-ink-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(sub)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Delivery</span>
                <span>{deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}</span>
              </div>
              {disc > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(disc)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-base text-ink">
                <span>Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <Button
              fullWidth
              size="lg"
              className="mt-5"
              onClick={handlePlaceOrder}
              loading={placing}
            >
              Place Order · {formatCurrency(grandTotal)}
            </Button>

            <p className="text-xs text-center text-ink-faint mt-3">
              By placing this order, you agree to our Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
