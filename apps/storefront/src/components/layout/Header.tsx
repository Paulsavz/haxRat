'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  ShoppingCart,
  Search,
  User,
  Menu,
  X,
  Package,
  Home,
  Info,
  ChevronDown,
} from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

// ─── Nav Links ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: '/',          label: 'Home',     icon: Home },
  { href: '/products',  label: 'Products', icon: Package },
  { href: '/about',     label: 'About',    icon: Info },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.totalItems());
  const { session, logout } = useAuthStore();

  // Track scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-soft'
            : 'bg-white'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center">
                <Package size={18} className="text-white" />
              </div>
              <span className="font-display font-bold text-lg text-ink hidden sm:block">
                RetailHub
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-ink-muted hover:text-ink hover:bg-surface-muted'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Search */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-sm mx-auto items-center bg-surface-muted rounded-xl border border-gray-200 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-200 transition-all"
            >
              <Search size={16} className="ml-3 text-ink-faint flex-shrink-0" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products…"
                className="flex-1 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink-faint outline-none"
              />
            </form>

            {/* Right icons */}
            <div className="flex items-center gap-1 ml-auto md:ml-0">
              {/* Mobile search */}
              <button
                className="md:hidden p-2 rounded-xl hover:bg-surface-muted text-ink-muted transition-colors"
                onClick={() => setSearchOpen(true)}
              >
                <Search size={20} />
              </button>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative p-2 rounded-xl hover:bg-surface-muted text-ink-muted hover:text-ink transition-colors"
              >
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Link>

              {/* Profile */}
              {session ? (
                <Link
                  href="/profile"
                  className="p-2 rounded-xl hover:bg-surface-muted text-ink-muted hover:text-ink transition-colors"
                >
                  <User size={20} />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Sign in
                </Link>
              )}

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2 rounded-xl hover:bg-surface-muted text-ink-muted transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white animate-fade-in">
            <nav className="px-4 py-3 space-y-1">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      pathname === link.href
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-ink hover:bg-surface-muted'
                    )}
                  >
                    <Icon size={18} />
                    {link.label}
                  </Link>
                );
              })}
              <hr className="my-2 border-gray-100" />
              {session ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink hover:bg-surface-muted"
                  >
                    <User size={18} /> My Account
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-primary-700 bg-primary-50"
                >
                  <User size={18} /> Sign in
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-4 animate-slide-up">
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <div className="flex-1 flex items-center bg-surface-muted rounded-xl px-3 py-2 gap-2">
                <Search size={18} className="text-ink-faint" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products…"
                  className="flex-1 bg-transparent text-sm outline-none"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-ink-faint hover:text-ink"
              >
                <X size={22} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
