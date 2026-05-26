import Link from 'next/link'
import { Store, Phone, Mail, MapPin, Instagram, Twitter, Facebook } from 'lucide-react'

const shopLinks = [
  { href: '/products', label: 'All Products' },
  { href: '/products?featured=true', label: 'Featured' },
  { href: '/products?sort=newest', label: 'New Arrivals' },
  { href: '/cart', label: 'Cart' },
]

const companyLinks = [
  { href: '/about', label: 'About Us' },
  { href: '/about#contact', label: 'Contact' },
  { href: '/about#hours', label: 'Business Hours' },
]

const accountLinks = [
  { href: '/login', label: 'Sign In' },
  { href: '/profile', label: 'My Profile' },
  { href: '/orders', label: 'My Orders' },
]

export default function Footer() {
  return (
    <footer className="border-t border-surface-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-ink-900">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                <Store className="h-4 w-4 text-white" />
              </div>
              Retail<span className="text-primary-600">Hub</span>
            </Link>
            <p className="mt-3 text-sm leading-6 text-ink-500">
              Your one-stop destination for quality products. Shop with confidence — fast delivery,
              secure payments, and live support.
            </p>
            <div className="mt-5 flex gap-3">
              {[
                { icon: Instagram, label: 'Instagram', href: '#' },
                { icon: Twitter, label: 'Twitter', href: '#' },
                { icon: Facebook, label: 'Facebook', href: '#' },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-surface-200 text-ink-500 transition-all hover:border-primary-600 hover:text-primary-600"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold text-ink-900">Shop</h3>
            <ul className="mt-4 space-y-3">
              {shopLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-ink-500 transition-colors hover:text-primary-600"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-ink-900">Company</h3>
            <ul className="mt-4 space-y-3">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-ink-500 transition-colors hover:text-primary-600"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              {accountLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-ink-500 transition-colors hover:text-primary-600"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-ink-900">Contact</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-ink-500">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
                <span>123 Market Street, Accra, Ghana</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-ink-500">
                <Phone className="h-4 w-4 shrink-0 text-primary-500" />
                <a href="tel:+233244000000" className="hover:text-primary-600">
                  +233 244 000 000
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-ink-500">
                <Mail className="h-4 w-4 shrink-0 text-primary-500" />
                <a href="mailto:hello@retailhub.com" className="hover:text-primary-600">
                  hello@retailhub.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-surface-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-400">
            © {new Date().getFullYear()} RetailHub. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-xs text-ink-400 hover:text-ink-600">
              Privacy Policy
            </a>
            <a href="#" className="text-xs text-ink-400 hover:text-ink-600">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
