import Link from 'next/link';
import {
  Package, Phone, Mail, MapPin, Clock, Shield,
  Truck, Heart, Star, ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { Metadata } from 'next';

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about RetailHub — our story, values, and commitment to quality.',
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const VALUES = [
  {
    icon: Shield,
    title: 'Quality First',
    desc: 'Every product is hand-picked and quality-checked before listing. We only sell what we believe in.',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    desc: 'Same-day and next-day delivery available across Greater Accra, with nationwide shipping.',
  },
  {
    icon: Heart,
    title: 'Customer Care',
    desc: "Real humans ready to help via chat, call, or WhatsApp. We don't hide behind bots.",
  },
  {
    icon: Star,
    title: 'Best Prices',
    desc: "We negotiate directly with suppliers to pass savings on to you. Quality doesn't have to be expensive.",
  },
];

const TEAM = [
  { name: 'Kwame Mensah', role: 'Founder & CEO', avatar: '👨🏿‍💼' },
  { name: 'Ama Osei', role: 'Head of Operations', avatar: '👩🏿‍💼' },
  { name: 'David Boateng', role: 'Customer Experience', avatar: '👨🏿‍💻' },
];

const HOURS = [
  { day: 'Monday – Friday', hours: '8:00am – 6:00pm' },
  { day: 'Saturday', hours: '9:00am – 4:00pm' },
  { day: 'Sunday', hours: '10:00am – 2:00pm' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-20">
      {/* Hero */}
      <section className="text-center">
        <div className="w-20 h-20 bg-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Package size={40} className="text-white" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-ink mb-4">
          We're RetailHub
        </h1>
        <p className="text-lg text-ink-muted max-w-2xl mx-auto leading-relaxed">
          A modern retail platform built for Ghanaians who expect quality products, honest prices,
          and real human support — all in one place.
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link href="/products">
            <Button size="lg" rightIcon={<ArrowRight size={18} />}>Shop Now</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">Create Account</Button>
          </Link>
        </div>
      </section>

      {/* Story */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">Our Story</span>
          <h2 className="text-3xl font-display font-bold text-ink mt-2 mb-4">
            Started with a simple idea
          </h2>
          <div className="space-y-4 text-ink-muted leading-relaxed">
            <p>
              RetailHub was founded in 2022 with a straightforward mission: make quality shopping
              accessible to everyone in Ghana. We were tired of unreliable delivery, hidden fees,
              and products that didn't match their descriptions.
            </p>
            <p>
              So we built the platform we always wanted — with real product photos, transparent pricing,
              same-day delivery in Accra, and a support team you can actually reach.
            </p>
            <p>
              Today, we serve thousands of happy customers across Ghana and are growing every day,
              one happy order at a time.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Happy Customers', value: '10,000+' },
            { label: 'Products Listed', value: '5,000+' },
            { label: 'Orders Delivered', value: '50,000+' },
            { label: 'Cities Served', value: '12' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl shadow-soft p-5 text-center">
              <p className="text-3xl font-display font-bold text-primary-600">{stat.value}</p>
              <p className="text-sm text-ink-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section>
        <div className="text-center mb-10">
          <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">Our Values</span>
          <h2 className="text-3xl font-display font-bold text-ink mt-2">What we stand for</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl shadow-soft p-6">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
                <Icon size={22} className="text-primary-600" />
              </div>
              <h3 className="font-semibold text-ink mb-2">{title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section>
        <div className="text-center mb-10">
          <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">The Team</span>
          <h2 className="text-3xl font-display font-bold text-ink mt-2">People behind RetailHub</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {TEAM.map((member) => (
            <div key={member.name} className="bg-white rounded-2xl shadow-soft p-6 text-center">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 text-5xl">
                {member.avatar}
              </div>
              <h3 className="font-semibold text-ink">{member.name}</h3>
              <p className="text-sm text-ink-muted">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white rounded-3xl shadow-soft p-8 sm:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact info */}
          <div>
            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">Contact</span>
            <h2 className="text-3xl font-display font-bold text-ink mt-2 mb-6">Get in touch</h2>
            <div className="space-y-4">
              <a href="tel:+233200000000" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone size={18} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Phone</p>
                  <p className="font-semibold text-ink group-hover:text-primary-600 transition-colors">
                    +233 20 000 0000
                  </p>
                </div>
              </a>

              <a href="mailto:hello@retailhub.com" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Email</p>
                  <p className="font-semibold text-ink group-hover:text-primary-600 transition-colors">
                    hello@retailhub.com
                  </p>
                </div>
              </a>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Address</p>
                  <p className="font-semibold text-ink">123 Market Street</p>
                  <p className="text-sm text-ink-muted">Accra, Ghana</p>
                </div>
              </div>
            </div>
          </div>

          {/* Business hours */}
          <div>
            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">Hours</span>
            <h2 className="text-3xl font-display font-bold text-ink mt-2 mb-6">Business Hours</h2>
            <div className="space-y-3">
              {HOURS.map(({ day, hours }) => (
                <div key={day} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-primary-500" />
                    <span className="text-sm font-medium text-ink">{day}</span>
                  </div>
                  <span className="text-sm text-ink-muted">{hours}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="flex items-center gap-2 text-emerald-700">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-sm font-semibold">Online chat available 24/7</span>
              </div>
              <p className="text-xs text-emerald-600 mt-1">
                Use the chat widget for instant help, anytime.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
