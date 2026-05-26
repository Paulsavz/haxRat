'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Check, MapPin, Truck, CreditCard, Loader2 } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { ordersApi } from '@/lib/api'
import { cn, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

type Step = 'address' | 'delivery' | 'payment'

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'address', label: 'Address', icon: <MapPin className="h-4 w-4" /> },
  { id: 'delivery', label: 'Delivery', icon: <Truck className="h-4 w-4" /> },
  { id: 'payment', label: 'Payment', icon: <CreditCard className="h-4 w-4" /> },
]

const DELIVERY_OPTIONS = [
  {
    id: 'standard',
    label: 'Standard Delivery',
    desc: '3–5 business days',
    price: 0,
    badge: 'FREE',
  },
  {
    id: 'express',
    label: 'Express Delivery',
    desc: 'Next business day',
    price: 30,
    badge: null,
  },
  {
    id: 'same_day',
    label: 'Same-Day Delivery',
    desc: 'Order before 12pm (Accra only)',
    price: 50,
    badge: 'Fast',
  },
]

interface AddressForm {
  full_name: string
  phone: string
  line1: string
  line2: string
  city: string
  region: string
  country: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCartStore()
  const { user } = useAuthStore()

  const [step, setStep] = useState<Step>('address')
  const [address, setAddress] = useState<AddressForm>({
    full_name: user?.user_metadata?.full_name || '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    region: '',
    country: 'Ghana',
  })
  const [deliveryMethod, setDeliveryMethod] = useState('standard')
  const [submitting, setSubmitting] = useState(false)

  const selectedDelivery = DELIVERY_OPTIONS.find((o) => o.id === deliveryMethod)!
  const shippingCost = selectedDelivery.price
  const totalAmount = subtotal() + shippingCost

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-ink-700">Your cart is empty</h2>
            <Link href="/products" className="btn-primary mt-4">Shop Now</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const handleAddressNext = (e: React.FormEvent) => {
    e.preventDefault()
    setStep('delivery')
  }

  const handleDeliveryNext = () => setStep('payment')

  const handlePayment = async () => {
    if (!user) {
      toast.error('Please sign in to place an order')
      router.push('/login')
      return
    }

    setSubmitting(true)
    try {
      // Create order first
      const order = await ordersApi.create({
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        address: {
          full_name: address.full_name,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2 || undefined,
          city: address.city,
          region: address.region,
          country: address.country,
        },
        delivery_method: deliveryMethod,
      })

      // Initialize Paystack
      const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
      if (!paystackKey) {
        throw new Error('Payment not configured')
      }

      // Dynamically load Paystack script
      const PaystackPop = await loadPaystack()
      const handler = PaystackPop.setup({
        key: paystackKey,
        email: user.email!,
        amount: Math.round(totalAmount * 100), // Paystack uses pesewas
        currency: 'GHS',
        ref: `retailhub_${order.id}_${Date.now()}`,
        metadata: { order_id: order.id },
        callback: () => {
          clearCart()
          router.push(`/orders/${order.id}`)
          toast.success('Payment successful! Order placed.')
        },
        onClose: () => {
          toast.error('Payment cancelled')
          setSubmitting(false)
        },
      })
      handler.openIframe()
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-ink-500">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/cart" className="hover:text-primary-600">Cart</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-ink-900 font-medium">Checkout</span>
          </nav>

          <h1 className="mb-8 text-2xl font-bold text-ink-900">Checkout</h1>

          {/* Step indicator */}
          <div className="mb-8 flex items-center gap-0">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (i < stepIndex) setStep(s.id)
                    }}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold text-sm transition-all',
                      i < stepIndex
                        ? 'border-primary-600 bg-primary-600 text-white cursor-pointer'
                        : i === stepIndex
                        ? 'border-primary-600 bg-white text-primary-600'
                        : 'border-surface-300 bg-white text-ink-400 cursor-not-allowed'
                    )}
                  >
                    {i < stepIndex ? <Check className="h-4 w-4" /> : s.icon}
                  </button>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      i <= stepIndex ? 'text-primary-600' : 'text-ink-400'
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2 mb-5',
                      i < stepIndex ? 'bg-primary-600' : 'bg-surface-200'
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Form area */}
            <div className="lg:col-span-2">
              {/* Step 1: Address */}
              {step === 'address' && (
                <form onSubmit={handleAddressNext} className="card p-6 space-y-5">
                  <h2 className="text-base font-semibold text-ink-900">Delivery Address</h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink-700">Full Name *</label>
                      <input
                        required
                        type="text"
                        value={address.full_name}
                        onChange={(e) => setAddress((a) => ({ ...a, full_name: e.target.value }))}
                        className="input-base"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink-700">Phone *</label>
                      <input
                        required
                        type="tel"
                        value={address.phone}
                        onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))}
                        className="input-base"
                        placeholder="0244 000 000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-700">Address Line 1 *</label>
                    <input
                      required
                      type="text"
                      value={address.line1}
                      onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
                      className="input-base"
                      placeholder="Street address, P.O. box"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink-700">Address Line 2</label>
                    <input
                      type="text"
                      value={address.line2}
                      onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
                      className="input-base"
                      placeholder="Apartment, suite, unit (optional)"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink-700">City *</label>
                      <input
                        required
                        type="text"
                        value={address.city}
                        onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                        className="input-base"
                        placeholder="Accra"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink-700">Region *</label>
                      <select
                        required
                        value={address.region}
                        onChange={(e) => setAddress((a) => ({ ...a, region: e.target.value }))}
                        className="input-base"
                      >
                        <option value="">Select region</option>
                        {['Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central', 'Northern', 'Upper East', 'Upper West', 'Volta', 'Brong-Ahafo', 'Oti', 'Ahafo', 'Bono East', 'Savannah', 'North East', 'Western North'].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink-700">Country</label>
                      <input
                        type="text"
                        value={address.country}
                        readOnly
                        className="input-base bg-surface-50 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary w-full py-3">
                    Continue to Delivery
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </form>
              )}

              {/* Step 2: Delivery */}
              {step === 'delivery' && (
                <div className="card p-6 space-y-5">
                  <h2 className="text-base font-semibold text-ink-900">Delivery Method</h2>
                  <div className="space-y-3">
                    {DELIVERY_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className={cn(
                          'flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition-all',
                          deliveryMethod === opt.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-surface-200 hover:border-surface-300'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="delivery"
                            value={opt.id}
                            checked={deliveryMethod === opt.id}
                            onChange={() => setDeliveryMethod(opt.id)}
                            className="h-4 w-4 text-primary-600"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-ink-900">{opt.label}</span>
                              {opt.badge && (
                                <span className={cn(
                                  'badge text-xs',
                                  opt.badge === 'FREE' ? 'bg-green-100 text-green-700' : 'bg-primary-100 text-primary-700'
                                )}>
                                  {opt.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-ink-500 mt-0.5">{opt.desc}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-ink-900">
                          {opt.price === 0 ? 'Free' : formatCurrency(opt.price)}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep('address')} className="btn-secondary flex-1">
                      Back
                    </button>
                    <button onClick={handleDeliveryNext} className="btn-primary flex-1">
                      Continue to Payment <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {step === 'payment' && (
                <div className="card p-6 space-y-5">
                  <h2 className="text-base font-semibold text-ink-900">Payment</h2>

                  <div className="rounded-xl border border-surface-200 p-4 bg-surface-50">
                    <div className="flex items-center gap-3 mb-3">
                      <Image
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Paystack_logo.svg/320px-Paystack_logo.svg.png"
                        alt="Paystack"
                        width={100}
                        height={24}
                        className="h-6 w-auto object-contain"
                      />
                      <span className="text-xs text-ink-500">Secure payment powered by Paystack</span>
                    </div>
                    <p className="text-sm text-ink-600">
                      You&apos;ll be redirected to Paystack to complete payment securely via card, mobile money, or bank transfer.
                    </p>
                  </div>

                  {/* Order review */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-ink-600">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal())}</span>
                    </div>
                    <div className="flex justify-between text-ink-600">
                      <span>Shipping ({selectedDelivery.label})</span>
                      <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                        {shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}
                      </span>
                    </div>
                    <div className="border-t border-surface-200 pt-2 flex justify-between font-bold text-ink-900 text-base">
                      <span>Total</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep('delivery')} className="btn-secondary flex-1">
                      Back
                    </button>
                    <button
                      onClick={handlePayment}
                      disabled={submitting}
                      className="btn-primary flex-1 py-3"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing…
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          Pay {formatCurrency(totalAmount)}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="card p-5 sticky top-24">
                <h3 className="mb-4 text-sm font-semibold text-ink-900">
                  Order ({items.length} items)
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-100">
                        <Image
                          src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=96&h=96&fit=crop'}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[9px] font-bold text-white">
                          {quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-ink-800 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-ink-500">{formatCurrency(product.price)} × {quantity}</p>
                      </div>
                      <p className="text-xs font-bold text-ink-900">
                        {formatCurrency(product.price * quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t border-surface-200 pt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-ink-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal())}</span>
                  </div>
                  <div className="flex justify-between text-ink-600">
                    <span>Shipping</span>
                    <span>{shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-ink-900">
                    <span>Total</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

// Helper to load Paystack dynamically
function loadPaystack(): Promise<{
  setup: (options: Record<string, unknown>) => { openIframe: () => void }
}> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).PaystackPop) {
      resolve((window as unknown as Record<string, unknown>).PaystackPop as ReturnType<typeof loadPaystack> extends Promise<infer T> ? T : never)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.onload = () => resolve((window as unknown as Record<string, unknown>).PaystackPop as ReturnType<typeof loadPaystack> extends Promise<infer T> ? T : never)
    script.onerror = reject
    document.head.appendChild(script)
  })
}
