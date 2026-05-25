import { useEffect, useState } from 'react';
import { Store, CreditCard, Bell, Palette, Save, ImagePlus } from 'lucide-react';
import { settingsAPI } from '@/lib/api';
import { uploadImage } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Tabs from '@/components/ui/Tabs';
import { LoadingScreen } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

interface Settings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  currency: string;
  logoUrl: string;
  paystackPublicKey: string;
  paystackSecretKey: string;
  notifyNewOrder: boolean;
  notifyNewChat: boolean;
  notifyNewCall: boolean;
  primaryColor: string;
}

const TABS = [
  { id: 'store', label: 'Store' },
  { id: 'payment', label: 'Payment' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'appearance', label: 'Appearance' },
];

const CURRENCIES = [
  { value: 'GHS', label: 'GHS — Ghanaian Cedi' },
  { value: 'NGN', label: 'NGN — Nigerian Naira' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('store');
  const [settings, setSettings] = useState<Settings>({
    storeName: 'RetailHub',
    storeEmail: 'hello@retailhub.com',
    storePhone: '+233244000000',
    currency: 'GHS',
    logoUrl: '',
    paystackPublicKey: '',
    paystackSecretKey: '',
    notifyNewOrder: true,
    notifyNewChat: true,
    notifyNewCall: true,
    primaryColor: '#6366f1',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.get();
      setSettings((prev) => ({ ...prev, ...res.data }));
      setLogoPreview(res.data.logoUrl || '');
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let logoUrl = settings.logoUrl;
      if (logoFile) {
        const path = `settings/logo_${Date.now()}_${logoFile.name}`;
        logoUrl = (await uploadImage(logoFile, 'store', path)) || logoUrl;
      }
      await settingsAPI.update({ ...settings, logoUrl });
      setSettings((prev) => ({ ...prev, logoUrl }));
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <Button onClick={handleSave} loading={saving}>
          <Save size={15} />
          Save Changes
        </Button>
      </div>

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* Store Settings */}
      {activeTab === 'store' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <Store size={20} className="text-brand-500" />
            <h2 className="font-semibold text-slate-900">Store Information</h2>
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Store Logo</label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-xl object-cover border-2 border-slate-200" />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                  <ImagePlus size={20} className="text-slate-400" />
                </div>
              )}
              <label className="cursor-pointer">
                <span className="px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors">
                  Upload Logo
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Store Name"
              value={settings.storeName}
              onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
            />
            <Select
              label="Currency"
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              options={CURRENCIES}
            />
            <Input
              label="Store Email"
              type="email"
              value={settings.storeEmail}
              onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
            />
            <Input
              label="Store Phone"
              value={settings.storePhone}
              onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Payment Settings */}
      {activeTab === 'payment' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <CreditCard size={20} className="text-brand-500" />
            <h2 className="font-semibold text-slate-900">Payment Configuration</h2>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <p className="font-medium">Paystack Integration</p>
            <p className="mt-1 text-amber-600">Keys are encrypted and stored securely. Never share your secret key.</p>
          </div>

          <div className="space-y-4">
            <Input
              label="Paystack Public Key"
              placeholder="pk_live_..."
              value={settings.paystackPublicKey}
              onChange={(e) => setSettings({ ...settings, paystackPublicKey: e.target.value })}
            />
            <Input
              label="Paystack Secret Key"
              type="password"
              placeholder="sk_live_..."
              value={settings.paystackSecretKey}
              onChange={(e) => setSettings({ ...settings, paystackSecretKey: e.target.value })}
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600">
            <p className="font-medium text-slate-700 mb-1">Test Mode</p>
            <p>Use <code className="bg-slate-200 px-1 rounded">pk_test_</code> and <code className="bg-slate-200 px-1 rounded">sk_test_</code> keys for testing.</p>
          </div>
        </div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <Bell size={20} className="text-brand-500" />
            <h2 className="font-semibold text-slate-900">Notification Preferences</h2>
          </div>

          <div className="space-y-4">
            {[
              { key: 'notifyNewOrder', label: 'New Orders', desc: 'Receive notifications when new orders are placed' },
              { key: 'notifyNewChat', label: 'New Chat Messages', desc: 'Receive notifications for new customer messages' },
              { key: 'notifyNewCall', label: 'Incoming Calls', desc: 'Receive notifications for incoming calls' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900">{label}</p>
                  <p className="text-sm text-slate-500">{desc}</p>
                </div>
                <button
                  onClick={() => setSettings((prev) => ({ ...prev, [key]: !prev[key as keyof Settings] }))}
                  className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                    settings[key as keyof Settings] ? 'bg-brand-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
                      settings[key as keyof Settings] ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appearance Settings */}
      {activeTab === 'appearance' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <Palette size={20} className="text-brand-500" />
            <h2 className="font-semibold text-slate-900">Appearance</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                className="h-10 w-16 rounded-lg border border-slate-200 cursor-pointer"
              />
              <Input
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                className="max-w-32"
                placeholder="#6366f1"
              />
            </div>
            <div className="flex gap-2 mt-4">
              {['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((color) => (
                <button
                  key={color}
                  onClick={() => setSettings({ ...settings, primaryColor: color })}
                  className="h-8 w-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: settings.primaryColor === color ? color : 'transparent',
                    transform: settings.primaryColor === color ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
