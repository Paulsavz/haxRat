'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  X,
  Store,
  LogOut,
  Package,
  ChevronDown,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Shop' },
  { href: '/about', label: 'About' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const totalItems = useCartStore((s) => s.totalItems())
  const { user, signOut } = useAuthStore()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
  }, [pathname])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-surface-200 bg-white/95 backdrop-blur-sm transition-shadow duration-200',
        scrolled && 'shadow-card'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-xl font-bold text-ink-900 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
            <Store className="h-4.5 w-4.5 text-white" />
          </div>
          <span>
            Retail<span className="text-primary-600">Hub</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                pathname === l.href
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-ink-600 hover:bg-surface-100 hover:text-ink-900'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-1.5">
          {/* Search toggle */}
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="btn-ghost rounded-xl p-2.5"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Cart */}
          <Link
            href="/cart"
            className="btn-ghost relative rounded-xl p-2.5"
            aria-label={`Cart (${totalItems} items)`}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>

          {/* Profile / Auth */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="btn-ghost flex items-center gap-1.5 rounded-xl px-2.5 py-2"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                  {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-surface-200 bg-white py-2 shadow-widget"
                  >
                    <div className="border-b border-surface-200 px-4 pb-2">
                      <p className="text-xs font-semibold text-ink-900 truncate">
                        {user.user_metadata?.full_name || 'My Account'}
                      </p>
                      <p className="text-xs text-ink-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink-700 hover:bg-surface-50"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink-700 hover:bg-surface-50"
                    >
                      <Package className="h-4 w-4" />
                      My Orders
                    </Link>
                    <button
                      onClick={signOut}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/login" className="btn-primary rounded-xl px-4 py-2 text-sm hidden sm:flex">
              Sign In
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="btn-ghost rounded-xl p-2.5 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-surface-100"
          >
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
              <form onSubmit={handleSearch}>
                <input
                  autoFocus
                  type="search"
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-base"
                />
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-surface-100 md:hidden"
          >
            <div className="flex flex-col px-4 py-3 gap-1">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    'rounded-xl px-4 py-3 text-sm font-medium transition-all',
                    pathname === l.href
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-ink-700 hover:bg-surface-100'
                  )}
                >
                  {l.label}
                </Link>
              ))}
              {!user && (
                <Link href="/login" className="btn-primary mt-2 rounded-xl text-center">
                  Sign In
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
