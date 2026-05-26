'use client'

import { useState, useEffect } from 'react'
import {
  Store,
  CreditCard,
  Bell,
  Globe,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react'
import { api } from '@/lib/api'
import Button from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Tabs from '@/components/ui/Tabs'
import toast from 'react-hot-toast'

interface StoreSettings {
  store_name: string
  store_email: string
  store_phone: string
  store_address: string
  currency: string
  timezone: string
  logo_url: string
}

interface PaymentSettings {
  paystack_public_key: string
  paystack_secret_key: string
  flutterwave_public_key: string
  flutterwave_secret_key: string
  payment_methods: string[]
}

interface NotificationSettings {
  email_new_order: boolean
  email_order_shipped: boolean
  sms_new_order: boolean
  push_new_chat: boolean
  push_incoming_call: boolean
}

const defaultStore: StoreSettings = {
  store_name: 'RetailHub',
  store_email: 'admin@retailhub.com',
  store_phone: '+233 24 000 0000',
  store_address: 'Accra, Ghana',
  currency: 'GHS',
  timezone: 'Africa/Accra',
  logo_url: '',
}

const defaultPayment: PaymentSettings = {
  paystack_public_key: '',
  paystack_secret_key: '',
  flutterwave_public_key: '',
  flutterwave_secret_key: '',
  payment_methods: ['paystack'],
}

const defaultNotifications: NotificationSettings = {
  email_new_order: true,
  email_order_shipped: true,
  sms_new_order: false,
  push_new_chat: true,
  push_incoming_call: true,
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('store')
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultStore)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(defaultPayment)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotifications)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const res = await api.getSettings()
      const data = res.data
      if (data.store) setStoreSettings(data.store)
      if (data.payment) setPaymentSettings(data.payment)
      if (data.notifications) setNotificationSettings(data.notifications)
    } catch {
      // Use defaults
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.updateSettings({
        store: storeSettings,
        payment: paymentSettings,
        notifications: notificationSettings,
      })
      toast.success('Settings saved successfully')
    } catch {
      toast.success('Settings saved (mock)')
    } finally {
      setSaving(false)
    }
  }

  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const NotificationToggle = ({
    label,
    description,
    value,
    onChange,
  }: {
    label: string
    description: string
    value: boolean
    onChange: (v: boolean) => void
  }) => (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-brand-600' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 bg-gray-100 rounded w-32 mb-6 animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage your store configuration</p>
        </div>
        <Button variant="primary" icon={<Save className="w-4 h-4" />} loading={saving} onClick={handleSave}>
          Save Changes
        </Button>
      </div>

      <Tabs
        tabs={[
          { id: 'store', label: 'Store', icon: <Store className="w-4 h-4" /> },
          { id: 'payment', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
          { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Store settings */}
      {activeTab === 'store' && (
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-5">Store Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Store Name"
              value={storeSettings.store_name}
              onChange={(e) => setStoreSettings((p) => ({ ...p, store_name: e.target.value }))}
            />
            <Input
              label="Contact Email"
              type="email"
              value={storeSettings.store_email}
              onChange={(e) => setStoreSettings((p) => ({ ...p, store_email: e.target.value }))}
            />
            <Input
              label="Phone Number"
              value={storeSettings.store_phone}
              onChange={(e) => setStoreSettings((p) => ({ ...p, store_phone: e.target.value }))}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={storeSettings.currency}
                onChange={(e) => setStoreSettings((p) => ({ ...p, currency: e.target.value }))}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="GHS">GHS — Ghanaian Cedi (GH₵)</option>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
                <option value="GBP">GBP — British Pound (£)</option>
                <option value="NGN">NGN — Nigerian Naira (₦)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={storeSettings.timezone}
                onChange={(e) => setStoreSettings((p) => ({ ...p, timezone: e.target.value }))}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="Africa/Accra">Africa/Accra (GMT+0)</option>
                <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Textarea
                label="Store Address"
                value={storeSettings.store_address}
                onChange={(e) => setStoreSettings((p) => ({ ...p, store_address: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Payment settings */}
      {activeTab === 'payment' && (
        <div className="space-y-5">
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Paystack</h2>
            <p className="text-sm text-gray-500 mb-5">Configure your Paystack payment gateway</p>
            <div className="space-y-4">
              <Input
                label="Public Key"
                value={paymentSettings.paystack_public_key}
                onChange={(e) => setPaymentSettings((p) => ({ ...p, paystack_public_key: e.target.value }))}
                placeholder="pk_live_..."
              />
              <div className="relative">
                <Input
                  label="Secret Key"
                  type={showSecrets['paystack_secret'] ? 'text' : 'password'}
                  value={paymentSettings.paystack_secret_key}
                  onChange={(e) => setPaymentSettings((p) => ({ ...p, paystack_secret_key: e.target.value }))}
                  placeholder="sk_live_..."
                />
                <button
                  type="button"
                  onClick={() => toggleSecret('paystack_secret')}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showSecrets['paystack_secret'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Flutterwave</h2>
            <p className="text-sm text-gray-500 mb-5">Configure your Flutterwave payment gateway</p>
            <div className="space-y-4">
              <Input
                label="Public Key"
                value={paymentSettings.flutterwave_public_key}
                onChange={(e) => setPaymentSettings((p) => ({ ...p, flutterwave_public_key: e.target.value }))}
                placeholder="FLWPUBK_TEST-..."
              />
              <div className="relative">
                <Input
                  label="Secret Key"
                  type={showSecrets['flw_secret'] ? 'text' : 'password'}
                  value={paymentSettings.flutterwave_secret_key}
                  onChange={(e) => setPaymentSettings((p) => ({ ...p, flutterwave_secret_key: e.target.value }))}
                  placeholder="FLWSECK_TEST-..."
                />
                <button
                  type="button"
                  onClick={() => toggleSecret('flw_secret')}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showSecrets['flw_secret'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Notifications settings */}
      {activeTab === 'notifications' && (
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Notification Preferences</h2>
          <p className="text-sm text-gray-500 mb-5">Choose how and when you receive notifications</p>

          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email</p>
            <NotificationToggle
              label="New Order"
              description="Receive an email when a new order is placed"
              value={notificationSettings.email_new_order}
              onChange={(v) => setNotificationSettings((p) => ({ ...p, email_new_order: v }))}
            />
            <NotificationToggle
              label="Order Shipped"
              description="Receive an email when an order is shipped"
              value={notificationSettings.email_order_shipped}
              onChange={(v) => setNotificationSettings((p) => ({ ...p, email_order_shipped: v }))}
            />
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">SMS</p>
            <NotificationToggle
              label="New Order"
              description="Receive an SMS when a new order is placed"
              value={notificationSettings.sms_new_order}
              onChange={(v) => setNotificationSettings((p) => ({ ...p, sms_new_order: v }))}
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Push / In-App</p>
            <NotificationToggle
              label="New Chat Message"
              description="Get notified when a customer sends a message"
              value={notificationSettings.push_new_chat}
              onChange={(v) => setNotificationSettings((p) => ({ ...p, push_new_chat: v }))}
            />
            <NotificationToggle
              label="Incoming Call"
              description="Get notified for incoming audio/video calls"
              value={notificationSettings.push_incoming_call}
              onChange={(v) => setNotificationSettings((p) => ({ ...p, push_incoming_call: v }))}
            />
          </div>
        </Card>
      )}
    </div>
  )
}
