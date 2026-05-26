import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ShoppingBag, MessageCircle, Truck, ShieldCheck, RotateCcw, Star } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProductGrid from '@/components/products/ProductGrid'
import { productsApi, categoriesApi } from '@/lib/api'
import type { Category, Product } from '@/types'

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await productsApi.list({ featured: true, per_page: 8 })
    return res.data
  } catch {
    return []
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    return await categoriesApi.list()
  } catch {
    return []
  }
}

const categoryIcons: Record<string, string> = {
  electronics: '📱',
  fashion: '👗',
  home: '🏠',
  beauty: '💄',
  sports: '⚽',
  books: '📚',
  food: '🛒',
  toys: '🎮',
}

export default async function HomePage() {
  const [featured, categories] = await Promise.all([getFeaturedProducts(), getCategories()])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* ─── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
            <div className="max-w-2xl">
              <span className="badge mb-4 bg-white/20 text-white text-xs font-medium px-3 py-1">
                🎉 Free delivery on orders over GHS 200
              </span>
              <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Shop Smarter,
                <br />
                <span className="text-primary-200">Live Better</span>
              </h1>
              <p className="mt-5 text-lg text-primary-100 leading-relaxed max-w-xl">
                Discover thousands of quality products with fast delivery, secure payments, and
                live customer support via chat, audio, and video.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/products" className="btn-primary bg-white text-primary-700 hover:bg-primary-50 shadow-lg">
                  <ShoppingBag className="h-4 w-4" />
                  Shop Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="btn-secondary border-white/30 bg-white/10 text-white hover:bg-white/20"
                >
                  <MessageCircle className="h-4 w-4" />
                  Talk to Us
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-12 flex flex-wrap gap-8">
                {[
                  { label: 'Products', value: '10,000+' },
                  { label: 'Happy Customers', value: '50K+' },
                  { label: 'Avg. Rating', value: '4.9 ⭐' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-sm text-primary-200">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Trust badges ─────────────────────────────────────── */}
        <section className="bg-white border-b border-surface-200">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { icon: Truck, label: 'Fast Delivery', desc: 'Same-day in Accra' },
                { icon: ShieldCheck, label: 'Secure Payments', desc: 'Paystack encrypted' },
                { icon: RotateCcw, label: 'Easy Returns', desc: '30-day hassle-free' },
                { icon: Star, label: 'Top Rated', desc: '4.9/5 from 50K+ reviews' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-3 py-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{label}</p>
                    <p className="text-xs text-ink-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Categories ───────────────────────────────────────── */}
        {categories.length > 0 && (
          <section className="py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">Browse</p>
                  <h2 className="section-title mt-1">Shop by Category</h2>
                </div>
                <Link href="/products" className="btn-ghost text-primary-600 hover:text-primary-700">
                  All categories <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {categories.slice(0, 6).map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.slug}`}
                    className="group card flex flex-col items-center gap-3 p-5 text-center transition-all hover:border-primary-200 hover:bg-primary-50 hover:shadow-card-hover"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-2xl transition-transform group-hover:scale-110">
                      {categoryIcons[cat.slug] || '🛍️'}
                    </div>
                    <span className="text-sm font-medium text-ink-700 group-hover:text-primary-700">
                      {cat.name}
                    </span>
                    {cat.product_count !== undefined && (
                      <span className="text-xs text-ink-400">{cat.product_count} items</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Featured Products ─────────────────────────────────── */}
        <section className="py-14 bg-surface-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">Curated</p>
                <h2 className="section-title mt-1">Featured Products</h2>
              </div>
              <Link href="/products?featured=true" className="btn-ghost text-primary-600 hover:text-primary-700">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ProductGrid products={featured} />
          </div>
        </section>

        {/* ─── Promo Banner ─────────────────────────────────────── */}
        <section className="py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-primary-800 p-8 md:p-12">
              <div className="relative z-10 max-w-lg">
                <span className="badge bg-white/20 text-white mb-3">Limited Time Offer</span>
                <h2 className="text-3xl font-extrabold text-white md:text-4xl">
                  Get 20% Off Your First Order
                </h2>
                <p className="mt-3 text-primary-100">
                  Use code <strong className="text-white">WELCOME20</strong> at checkout. Valid for
                  new customers only.
                </p>
                <Link
                  href="/products"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary-700 shadow-lg transition-all hover:bg-primary-50"
                >
                  Shop Now <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Decorative circles */}
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
              <div className="absolute -bottom-8 right-20 h-40 w-40 rounded-full bg-white/5" />
              <div className="absolute bottom-8 right-64 h-20 w-20 rounded-full bg-white/10" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
