import Link from 'next/link';
import { Package, Phone, Mail, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

// ─── Component ────────────────────────────────────────────────────────────────

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                <Package size={20} className="text-white" />
              </div>
              <span className="font-display font-bold text-xl">RetailHub</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your one-stop shop for quality products delivered fast and fresh, right to your door.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                <Facebook size={16} />
              </a>
              <a href="#" className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                <Twitter size={16} />
              </a>
              <a href="#" className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                <Instagram size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-300">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/',          label: 'Home' },
                { href: '/products',  label: 'Products' },
                { href: '/cart',      label: 'Cart' },
                { href: '/profile',   label: 'My Account' },
                { href: '/about',     label: 'About Us' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-300">Policies</h3>
            <ul className="space-y-2.5">
              {[
                'Privacy Policy',
                'Terms of Service',
                'Return Policy',
                'Shipping Policy',
                'Cookie Policy',
              ].map((label) => (
                <li key={label}>
                  <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-300">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-gray-400">
                <MapPin size={15} className="flex-shrink-0 mt-0.5 text-primary-400" />
                <span>123 Market Street, Accra, Ghana</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-400">
                <Phone size={15} className="flex-shrink-0 text-primary-400" />
                <a href="tel:+233200000000" className="hover:text-white transition-colors">
                  +233 20 000 0000
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-400">
                <Mail size={15} className="flex-shrink-0 text-primary-400" />
                <a href="mailto:hello@retailhub.com" className="hover:text-white transition-colors">
                  hello@retailhub.com
                </a>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-white/5 rounded-xl">
              <p className="text-xs text-gray-400 font-medium">Business Hours</p>
              <p className="text-xs text-gray-300 mt-1">Mon – Fri: 8am – 6pm</p>
              <p className="text-xs text-gray-300">Sat – Sun: 9am – 4pm</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            &copy; {year} RetailHub. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <img src="/images/payment/visa.svg" alt="Visa" className="h-5 opacity-60" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
            <img src="/images/payment/mastercard.svg" alt="Mastercard" className="h-5 opacity-60" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
            <span className="text-xs text-gray-500 bg-white/10 px-2 py-0.5 rounded-md">Paystack</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
