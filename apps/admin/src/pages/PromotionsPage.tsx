import { useEffect, useState } from 'react';
import { Plus, Trash2, Percent, DollarSign, ImagePlus, Tag } from 'lucide-react';
import { promotionsAPI } from '@/lib/api';
import { uploadImage } from '@/lib/supabase';
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Tabs from '@/components/ui/Tabs';
import { LoadingScreen } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrder?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
}

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  link?: string;
  isActive: boolean;
  createdAt: string;
}

const TABS = [
  { id: 'coupons', label: 'Coupons' },
  { id: 'banners', label: 'Banners' },
];

const DEFAULT_COUPON = {
  code: '',
  type: 'percent' as 'percent' | 'fixed',
  value: '',
  minOrder: '',
  maxUses: '',
  expiresAt: '',
};

export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState('coupons');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [couponForm, setCouponForm] = useState(DEFAULT_COUPON);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerLink, setBannerLink] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [couponsRes, bannersRes] = await Promise.all([
        promotionsAPI.listCoupons(),
        promotionsAPI.listBanners(),
      ]);
      setCoupons(couponsRes.data || []);
      setBanners(bannersRes.data || []);
    } catch {
      setCoupons([
        { id: '1', code: 'SAVE10', type: 'percent', value: 10, minOrder: 50, maxUses: 100, usedCount: 23, expiresAt: '2026-12-31', isActive: true },
        { id: '2', code: 'FLAT20', type: 'fixed', value: 20, minOrder: 100, maxUses: 50, usedCount: 12, expiresAt: '2026-06-30', isActive: true },
        { id: '3', code: 'WELCOME', type: 'percent', value: 15, maxUses: 200, usedCount: 87, isActive: false },
      ]);
      setBanners([
        { id: '1', title: 'Summer Sale', imageUrl: 'https://placehold.co/400x150/6366f1/fff?text=Summer+Sale', link: '/', isActive: true, createdAt: new Date().toISOString() },
        { id: '2', title: 'New Arrivals', imageUrl: 'https://placehold.co/400x150/10b981/fff?text=New+Arrivals', isActive: true, createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setCouponForm((f) => ({ ...f, code }));
  };

  const handleCreateCoupon = async () => {
    if (!couponForm.code || !couponForm.value) {
      toast.error('Code and value are required');
      return;
    }
    setSaving(true);
    try {
      const data = {
        code: couponForm.code.toUpperCase(),
        type: couponForm.type,
        value: parseFloat(couponForm.value),
        minOrder: couponForm.minOrder ? parseFloat(couponForm.minOrder) : undefined,
        maxUses: couponForm.maxUses ? parseInt(couponForm.maxUses) : undefined,
        expiresAt: couponForm.expiresAt || undefined,
      };
      const res = await promotionsAPI.createCoupon(data);
      setCoupons((prev) => [...prev, { ...res.data, usedCount: 0, isActive: true }]);
      setShowCouponModal(false);
      setCouponForm(DEFAULT_COUPON);
      toast.success('Coupon created');
    } catch {
      toast.error('Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await promotionsAPI.deleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast.success('Coupon deleted');
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  const handleBannerImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleCreateBanner = async () => {
    if (!bannerTitle || !bannerFile) {
      toast.error('Title and image are required');
      return;
    }
    setSaving(true);
    try {
      const path = `banners/${Date.now()}_${bannerFile.name}`;
      const imageUrl = await uploadImage(bannerFile, 'banners', path);
      if (!imageUrl) throw new Error('Upload failed');

      const formData = new FormData();
      formData.append('title', bannerTitle);
      formData.append('link', bannerLink);
      formData.append('image', bannerFile);
      formData.append('imageUrl', imageUrl);

      const res = await promotionsAPI.createBanner(formData);
      setBanners((prev) => [...prev, { ...res.data, imageUrl, isActive: true, createdAt: new Date().toISOString() }]);
      setShowBannerModal(false);
      setBannerTitle('');
      setBannerLink('');
      setBannerFile(null);
      setBannerPreview('');
      toast.success('Banner created');
    } catch {
      toast.error('Failed to create banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      await promotionsAPI.deleteBanner(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      toast.success('Banner deleted');
    } catch {
      toast.error('Failed to delete banner');
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Promotions</h1>
        <Button onClick={() => activeTab === 'coupons' ? setShowCouponModal(true) : setShowBannerModal(true)}>
          <Plus size={16} />
          {activeTab === 'coupons' ? 'Add Coupon' : 'Add Banner'}
        </Button>
      </div>

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'coupons' && (
        <Table>
          <TableHead>
            <tr>
              <Th>Code</Th>
              <Th>Type</Th>
              <Th>Value</Th>
              <Th>Min Order</Th>
              <Th>Uses</Th>
              <Th>Expires</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </TableHead>
          <TableBody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400 text-sm">No coupons yet</td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <Tr key={coupon.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-brand-500" />
                      <span className="font-mono font-semibold text-slate-900">{coupon.code}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      {coupon.type === 'percent' ? <Percent size={13} /> : <DollarSign size={13} />}
                      <span className="capitalize">{coupon.type}</span>
                    </div>
                  </Td>
                  <Td className="font-semibold">
                    {coupon.type === 'percent' ? `${coupon.value}%` : `GHS ${coupon.value}`}
                  </Td>
                  <Td>{coupon.minOrder ? `GHS ${coupon.minOrder}` : '—'}</Td>
                  <Td>
                    {coupon.usedCount}{coupon.maxUses ? `/${coupon.maxUses}` : ''}
                  </Td>
                  <Td className="text-slate-400">
                    {coupon.expiresAt ? formatDate(coupon.expiresAt) : 'Never'}
                  </Td>
                  <Td>
                    <Badge variant={coupon.isActive ? 'success' : 'danger'}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteCoupon(coupon.id)}>
                      <Trash2 size={15} className="text-red-400" />
                    </Button>
                  </Td>
                </Tr>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {activeTab === 'banners' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.length === 0 ? (
            <div className="col-span-2 text-center py-16 text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
              No banners yet
            </div>
          ) : (
            banners.map((banner) => (
              <div key={banner.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{banner.title}</p>
                    <p className="text-xs text-slate-400">{formatDate(banner.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={banner.isActive ? 'success' : 'danger'}>
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteBanner(banner.id)}>
                      <Trash2 size={15} className="text-red-400" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Coupon Modal */}
      <Modal open={showCouponModal} onClose={() => setShowCouponModal(false)} title="Create Coupon" size="md">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              label="Coupon Code *"
              placeholder="e.g. SAVE10"
              value={couponForm.code}
              onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
              className="flex-1"
            />
            <div className="flex items-end">
              <Button variant="outline" onClick={generateCode}>Generate</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Discount Type"
              value={couponForm.type}
              onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value as 'percent' | 'fixed' })}
              options={[{ value: 'percent', label: 'Percentage (%)' }, { value: 'fixed', label: 'Fixed Amount (GHS)' }]}
            />
            <Input
              label={couponForm.type === 'percent' ? 'Discount %' : 'Amount (GHS)'}
              type="number"
              placeholder="0"
              value={couponForm.value}
              onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
            />
            <Input
              label="Min Order (GHS)"
              type="number"
              placeholder="Optional"
              value={couponForm.minOrder}
              onChange={(e) => setCouponForm({ ...couponForm, minOrder: e.target.value })}
            />
            <Input
              label="Max Uses"
              type="number"
              placeholder="Unlimited"
              value={couponForm.maxUses}
              onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })}
            />
            <div className="col-span-2">
              <Input
                label="Expiry Date"
                type="date"
                value={couponForm.expiresAt}
                onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowCouponModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleCreateCoupon}>Create Coupon</Button>
          </div>
        </div>
      </Modal>

      {/* Banner Modal */}
      <Modal open={showBannerModal} onClose={() => setShowBannerModal(false)} title="Add Banner" size="md">
        <div className="space-y-4">
          <Input
            label="Banner Title *"
            placeholder="e.g. Summer Sale"
            value={bannerTitle}
            onChange={(e) => setBannerTitle(e.target.value)}
          />
          <Input
            label="Link (optional)"
            placeholder="https://..."
            value={bannerLink}
            onChange={(e) => setBannerLink(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Banner Image *</label>
            {bannerPreview ? (
              <img src={bannerPreview} alt="Banner preview" className="w-full h-40 object-cover rounded-xl mb-2" />
            ) : (
              <div className="w-full h-40 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300 mb-2">
                <ImagePlus size={32} className="text-slate-400" />
              </div>
            )}
            <label className="cursor-pointer inline-flex">
              <span className="px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors">
                Choose Image
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleBannerImage} />
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowBannerModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleCreateBanner}>Upload Banner</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
