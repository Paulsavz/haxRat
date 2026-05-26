import type { Metadata } from 'next'
import { MapPin, Phone, Mail, Clock, MessageCircle, Users, Award, Package } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about RetailHub — Ghana\'s premier online retail destination.',
}

const TEAM = [
  { name: 'Kwame Mensah', role: 'CEO & Founder', initials: 'KM' },
  { name: 'Abena Asante', role: 'Head of Operations', initials: 'AA' },
  { name: 'Kofi Boateng', role: 'Head of Technology', initials: 'KB' },
  { name: 'Ama Owusu', role: 'Customer Experience', initials: 'AO' },
]

const HOURS = [
  { day: 'Monday – Friday', hours: '8:00 AM – 6:00 PM' },
  { day: 'Saturday', hours: '9:00 AM – 4:00 PM' },
  { day: 'Sunday', hours: 'Closed' },
]

const STATS = [
  { icon: Package, label: 'Products', value: '10,000+' },
  { icon: Users, label: 'Happy Customers', value: '50,000+' },
  { icon: Award, label: 'Years in Business', value: '5+' },
  { icon: MapPin, label: 'Delivery Cities', value: '20+' },
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-900 to-primary-700 py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-4xl font-extrabold text-white md:text-5xl">
              About RetailHub
            </h1>
            <p className="mt-5 text-lg text-primary-100 leading-relaxed max-w-2xl mx-auto">
              We&apos;re on a mission to make quality products accessible to every Ghanaian, with fast
              delivery, fair prices, and world-class customer support.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-white border-b border-surface-200 py-12">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {STATS.map(({ icon: Icon, label, value }) => (
                <div key={label} className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <p className="text-3xl font-extrabold text-ink-900">{value}</p>
                  <p className="mt-1 text-sm text-ink-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 md:grid-cols-2 items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">Our Story</p>
                <h2 className="mt-2 text-3xl font-bold text-ink-900">
                  Born in Ghana, Built for Africa
                </h2>
                <div className="mt-5 space-y-4 text-ink-600 text-sm leading-7">
                  <p>
                    RetailHub was founded in 2019 with a simple belief: every Ghanaian deserves
                    access to quality products without the hassle of traffic, limited selection, or
                    unreliable delivery.
                  </p>
                  <p>
                    Starting with just 100 products and 3 team members in Accra, we&apos;ve grown to
                    serve over 50,000 customers across 20+ cities — and we&apos;re just getting started.
                  </p>
                  <p>
                    Today, RetailHub is Ghana&apos;s most loved online store, known for our curated
                    selection, lightning-fast delivery, and live support via chat, audio, and video.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['Quality First', 'Fast Delivery', 'Live Support', 'Easy Returns'].map((item, i) => (
                  <div
                    key={item}
                    className={`rounded-2xl p-5 text-center font-semibold ${
                      i % 2 === 0
                        ? 'bg-primary-600 text-white'
                        : 'bg-primary-50 text-primary-700'
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="bg-surface-50 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">People</p>
              <h2 className="mt-2 text-3xl font-bold text-ink-900">Meet the Team</h2>
            </div>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {TEAM.map((member) => (
                <div key={member.name} className="card p-5 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">
                    {member.initials}
                  </div>
                  <p className="text-sm font-semibold text-ink-900">{member.name}</p>
                  <p className="text-xs text-ink-500 mt-0.5">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact + Hours */}
        <section id="contact" className="py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 md:grid-cols-2">
              {/* Contact */}
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">Get in Touch</p>
                <h2 className="mt-2 text-2xl font-bold text-ink-900">Contact Us</h2>
                <p className="mt-3 text-sm text-ink-500">
                  Our team is available via multiple channels to answer your questions.
                </p>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                      <MapPin className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-900">Visit Us</p>
                      <p className="text-sm text-ink-500">123 Market Street, Accra, Ghana</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                      <Phone className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-900">Call Us</p>
                      <a href="tel:+233244000000" className="text-sm text-primary-600 hover:underline">
                        +233 244 000 000
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                      <Mail className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-900">Email Us</p>
                      <a href="mailto:hello@retailhub.com" className="text-sm text-primary-600 hover:underline">
                        hello@retailhub.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                      <MessageCircle className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-900">Live Support</p>
                      <p className="text-sm text-ink-500">Chat, Audio & Video via our widget</p>
                    </div>
                  </div>
                </div>

                <Link href="/" className="btn-primary mt-6 inline-flex">
                  <MessageCircle className="h-4 w-4" />
                  Open Support Chat
                </Link>
              </div>

              {/* Business Hours */}
              <div id="hours">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">Availability</p>
                <h2 className="mt-2 text-2xl font-bold text-ink-900">Business Hours</h2>
                <p className="mt-3 text-sm text-ink-500">
                  Our support team is available during the following hours (GMT+0):
                </p>

                <div className="mt-6 card divide-y divide-surface-200 overflow-hidden">
                  {HOURS.map(({ day, hours }) => (
                    <div key={day} className="flex items-center justify-between px-5 py-3.5">
                      <span className="text-sm font-medium text-ink-700">{day}</span>
                      <span className={`text-sm ${hours === 'Closed' ? 'text-red-500' : 'text-green-600 font-medium'}`}>
                        {hours}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm font-semibold text-amber-800">Public Holidays</p>
                  <p className="text-xs text-amber-700 mt-1">
                    We operate on reduced hours on public holidays. Check our social media for announcements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
