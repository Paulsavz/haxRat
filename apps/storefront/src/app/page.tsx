'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight, Tag, Truck, Shield, RefreshCw } from 'lucide-react';
import { ProductGrid } from '../components/products/ProductGrid';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { bannersApi, productsApi, categoriesApi } from '../lib/api';
import type { Banner, Product, Category } from '../types';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

// ─── Hero Carousel ────────────────────────────────────────────────────────────

function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % banners.length), [banners.length]);
  const prev = () => setCurrent((c) => (c - 1 + banners.length) % banners.length);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [banners.length, next]);

  if (banners.length === 0) {
    return (
      <div className="relative h-[340px] sm:h-[460px] lg:h-[520px] rounded-3xl overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 flex items-center">
        <div className="px-8 sm:px-16">
          <p className="text-primary-200 font-medium text-sm mb-2 uppercase tracking-wider">Welcome</p>
          <h1 className="text-3xl sm:text-5xl font-display font-bold text-white mb-4 text-balance">
            Shop Quality Products Online
          </h1>
          <p className="text-primary-200 text-base sm:text-lg mb-8 max-w-md">
            Fast delivery, great prices, and real human support when you need it.
          </p>
          <Link href="/products">
            <Button size="lg" variant="white" rightIcon={<ArrowRight size={18} />}>
              Shop Now
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[340px] sm:h-[460px] lg:h-[520px] rounded-3xl overflow-hidden group">
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-700',
            i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          <Image
            src={banner.image_url}
            alt={banner.title}
            fill
            className="object-cover"
            priority={i === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex items-center px-8 sm:px-16">
            <div className="max-w-md">
              <p className="text-white/70 font-medium text-sm mb-2 uppercase tracking-wider">
                Featured
              </p>
              <h2 className="text-3xl sm:text-5xl font-display font-bold text-white mb-3 text-balance">
                {banner.title}
              </h2>
              {banner.subtitle && (
                <p className="text-white/80 text-base sm:text-lg mb-6">{banner.subtitle}</p>
              )}
              {banner.link && (
                <Link href={banner.link}>
                  <Button size="lg" variant="white" rightIcon={<ArrowRight size={18} />}>
                    Shop Now
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Controls */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  'rounded-full transition-all duration-300',
                  i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/70'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Category Card ────────────────────────────────────────────────────────────

function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/products?category=${category.slug}`}
      className="group flex flex-col items-center gap-3"
    >
      <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100 relative">
        {category.image_url ? (
          <Image
            src={category.image_url}
            alt={category.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            {category.icon ?? '🛒'}
          </div>
        )}
      </div>
      <span className="text-sm font-semibold text-ink group-hover:text-primary-600 transition-colors text-center">
        {category.name}
      </span>
    </Link>
  );
}

// ─── Feature Strip ────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Truck, title: 'Fast Delivery', desc: 'Same-day delivery available' },
  { icon: Shield, title: 'Secure Payments', desc: 'Powered by Paystack' },
  { icon: RefreshCw, title: 'Easy Returns', desc: '7-day hassle-free returns' },
  { icon: Tag, title: 'Best Prices', desc: 'Lowest prices guaranteed' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    bannersApi.list()
      .then((r) => setBanners(r.data))
      .catch(console.error);

    categoriesApi.list()
      .then((r) => setCategories(r.data.slice(0, 8)))
      .catch(console.error);

    productsApi.featured()
      .then((r) => {
        setFeatured(r.data.slice(0, 8));
        setIsLoadingProducts(false);
      })
      .catch(() => setIsLoadingProducts(false));
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Subscribed! Welcome to our newsletter.');
    setEmail('');
    setSubscribing(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-16">
      {/* Hero */}
      <section>
        <HeroCarousel banners={banners} />
      </section>

      {/* Feature Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-soft"
          >
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="text-xs text-ink-muted">{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-ink">Shop by Category</h2>
              <p className="text-ink-muted text-sm mt-1">Find what you're looking for</p>
            </div>
            <Link
              href="/products"
              className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
            >
              See all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-ink">Featured Products</h2>
            <p className="text-ink-muted text-sm mt-1">Hand-picked just for you</p>
          </div>
          <Link
            href="/products"
            className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <ProductGrid products={featured} isLoading={isLoadingProducts} columns={4} />
      </section>

      {/* Promotional Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary-900 to-primary-700 p-8 sm:p-12">
        <div className="relative z-10 max-w-xl">
          <span className="inline-block bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
            Limited Offer
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3">
            Get 20% off your first order
          </h2>
          <p className="text-primary-200 mb-6">
            Use code <code className="bg-white/20 px-2 py-0.5 rounded font-mono font-bold text-white">FIRST20</code> at checkout.
          </p>
          <Link href="/products">
            <Button size="lg" variant="white" rightIcon={<ArrowRight size={18} />}>
              Start Shopping
            </Button>
          </Link>
        </div>
        {/* Decorative */}
        <div className="absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-primary-600/30 to-transparent" />
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute -right-5 -bottom-10 w-40 h-40 bg-white/5 rounded-full" />
      </section>

      {/* Newsletter */}
      <section className="bg-white rounded-3xl shadow-soft p-8 sm:p-12 text-center">
        <h2 className="text-2xl font-display font-bold text-ink mb-2">Stay in the loop</h2>
        <p className="text-ink-muted mb-6 max-w-md mx-auto">
          Get the latest deals, new arrivals, and exclusive offers straight to your inbox.
        </p>
        <form
          onSubmit={handleSubscribe}
          className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto"
        >
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" loading={subscribing} className="flex-shrink-0 sm:w-32">
            Subscribe
          </Button>
        </form>
        <p className="text-xs text-ink-faint mt-3">No spam. Unsubscribe anytime.</p>
      </section>
    </div>
  );
}
