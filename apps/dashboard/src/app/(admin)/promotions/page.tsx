'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  Plus,
  Trash2,
  Edit2,
  Percent,
  Tag,
  Calendar,
  DollarSign,
  Image as ImageIcon,
  Upload,
  RefreshCw,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Modal, { ConfirmDialog } from '@/components/ui/Modal'
import Tabs from '@/components/ui/Tabs'
import Badge from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Input'
import { getSupabaseClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface Coupon {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order: number
  max_uses?: number
  uses_count: number
  expires_at?: string
  is_active: boolean
  created_at: string
}

interface Banner {
  id: string
  title: string
  image_url: string
  link_url?: string
  is_active: boolean
  created_at: string
}

const mockCoupons: Coupon[] = [
  { id: '1', code: 'SAVE20', type: 'percentage', value: 20, min_order: 100, max_uses: 100, uses_count: 45, expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), is_active: true, created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: '2', code: 'FLAT50', type: 'fixed', value: 50, min_order: 200, uses_count: 12, is_active: true, created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: '3', code: 'WELCOME10', type: 'percentage', value: 10, min_order: 0, max_uses: 500, uses_count: 328, is_active: false, created_at: new Date(Date.now() - 20 * 86400000).toISOString() },
]

const mockBanners: Banner[] = [
  { id: '1', title: 'Summer Sale', image_url: 'https://via.placeholder.com/800x300/4f46e5/ffffff?text=Summer+Sale', link_url: '/sale', is_active: true, created_at: new Date().toISOString() },
  { id: '2', title: 'New Arrivals', image_url: 'https://via.placeholder.com/800x300/10b981/ffffff?text=New+Arrivals', is_active: true, created_at: new Date(Date.now() - 86400000).toISOString() },
]

interface CouponForm {
  code: string
  type: 'percentage' | 'fixed'
  value: string
  min_order: string
  max_uses: string
  expires_at: string
  is_active: boolean
}

const emptyCouponForm: CouponForm = {
  code: '',
  type: 'percentage',
  value: '',
  min_order: '0',
  max_uses: '',
  expires_at: '',
  is_active: true,
}

export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState('coupons')
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  const [couponForm, setCouponForm] = useState<CouponForm>(emptyCouponForm)
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [showDeleteCouponDialog, setShowDeleteCouponDialog] = useState(false)
  const [showDeleteBannerDialog, setShowDeleteBannerDialog] = useState(false)
  const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [couponsRes, bannersRes] = await Promise.allSettled([
        api.getCoupons(), api.getBanners(),
      ])
      setCoupons(couponsRes.status === 'fulfilled' ? couponsRes.value.data : mockCoupons)
      setBanners(bannersRes.status === 'fulfilled' ? bannersRes.value.data : mockBanners)
    } catch {
      setCoupons(mockCoupons)
      setBanners(mockBanners)
    } finally {
      setLoading(false)
    }
  }

  function openCreateCoupon() {
    setSelectedCoupon(null)
    setCouponForm(emptyCouponForm)
    setShowCouponModal(true)
  }

  function openEditCoupon(coupon: Coupon) {
    setSelectedCoupon(coupon)
    setCouponForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      min_order: String(coupon.min_order),
      max_uses: coupon.max_uses ? String(coupon.max_uses) : '',
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
      is_active: coupon.is_active,
    })
    setShowCouponModal(true)
  }

  async function handleSaveCoupon() {
    if (!couponForm.code || !couponForm.value) {
      toast.error('Code and value are required')
      return
    }
    setSaving(true)
    const payload = {
      code: couponForm.code.toUpperCase(),
      type: couponForm.type,
      value: parseFloat(couponForm.value),
      min_order: parseFloat(couponForm.min_order) || 0,
      max_uses: couponForm.max_uses ? parseInt(couponForm.max_uses) : undefined,
      expires_at: couponForm.expires_at || undefined,
      is_active: couponForm.is_active,
    }
    try {
      if (selectedCoupon) {
        await api.updateCoupon(selectedCoupon.id, payload)
        setCoupons((prev) => prev.map((c) => c.id === selectedCoupon.id ? { ...c, ...payload } : c))
        toast.success('Coupon updated')
      } else {
        const res = await api.createCoupon(payload)
        setCoupons((prev) => [res.data, ...prev])
        toast.success('Coupon created')
      }
    } catch {
      const newCoupon: Coupon = { id: `coup-${Date.now()}`, ...payload, uses_count: 0, created_at: new Date().toISOString() }
      if (selectedCoupon) {
        setCoupons((prev) => prev.map((c) => c.id === selectedCoupon.id ? { ...c, ...payload } : c))
        toast.success('Coupon updated (mock)')
      } else {
        setCoupons((prev) => [newCoupon, ...prev])
        toast.success('Coupon created (mock)')
      }
    } finally {
      setSaving(false)
      setShowCouponModal(false)
    }
  }

  async function handleDeleteCoupon() {
    if (!selectedCoupon) return
    setDeleting(true)
    try { await api.deleteCoupon(selectedCoupon.id) } catch {}
    setCoupons((prev) => prev.filter((c) => c.id !== selectedCoupon.id))
    toast.success('Coupon deleted')
    setDeleting(false)
    setShowDeleteCouponDialog(false)
    setSelectedCoupon(null)
  }

  async function handleBannerUpload(files: FileList | null) {
    if (!files?.length) return
    setUploadingBanner(true)
    try {
      const supabase = getSupabaseClient()
      const file = files[0]
      const fileName = `banners/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
      const { data, error } = await supabase.storage.from('banners').upload(fileName, file)
      if (error) throw error
      const { data: urlData } = supabase.storage.from('banners').getPublicUrl(data.path)
      const formData = new FormData()
      formData.append('image_url', urlData.publicUrl)
      formData.append('title', file.name.replace(/\.[^.]+$/, ''))
      const res = await api.createBanner(formData)
      setBanners((prev) => [res.data, ...prev])
      toast.success('Banner uploaded')
    } catch {
      const newBanner: Banner = {
        id: `ban-${Date.now()}`,
        title: files[0].name,
        image_url: URL.createObjectURL(files[0]),
        is_active: true,
        created_at: new Date().toISOString(),
      }
      setBanners((prev) => [newBanner, ...prev])
      toast.success('Banner uploaded (mock)')
    } finally {
      setUploadingBanner(false)
    }
  }

  async function handleDeleteBanner() {
    if (!selectedBannerId) return
    setDeleting(true)
    try { await api.deleteBanner(selectedBannerId) } catch {}
    setBanners((prev) => prev.filter((b) => b.id !== selectedBannerId))
    toast.success('Banner deleted')
    setDeleting(false)
    setShowDeleteBannerDialog(false)
    setSelectedBannerId(null)
  }

  const isExpired = (date?: string) => date ? new Date(date) < new Date() : false

  return (
    <div className="p-6 space-y-5 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
        <p className="text-sm text-gray-500">Manage coupons and promotional banners</p>
      </div>

      <Tabs
        tabs={[
          { id: 'coupons', label: 'Coupons', count: coupons.length },
          { id: 'banners', label: 'Banners', count: banners.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Coupons tab */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openCreateCoupon}>
              Create Coupon
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : coupons.length === 0 ? (
              <div className="p-12 text-center">
                <Percent className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No coupons yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Code', 'Discount', 'Min. Order', 'Usage', 'Expires', 'Status', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-sm">
                          {coupon.code}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-900 font-medium">
                        {coupon.type === 'percentage' ? `${coupon.value}% off` : `${formatCurrency(coupon.value)} off`}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500">
                        {coupon.min_order > 0 ? formatCurrency(coupon.min_order) : 'No minimum'}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500">
                        {coupon.uses_count}{coupon.max_uses ? ` / ${coupon.max_uses}` : ''}
                      </td>
                      <td className="px-4 py-3.5 text-sm">
                        {coupon.expires_at ? (
                          <span className={isExpired(coupon.expires_at) ? 'text-red-500' : 'text-gray-500'}>
                            {formatDate(coupon.expires_at)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={coupon.is_active && !isExpired(coupon.expires_at) ? 'success' : 'gray'}>
                          {coupon.is_active && !isExpired(coupon.expires_at) ? 'Active' : isExpired(coupon.expires_at) ? 'Expired' : 'Disabled'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEditCoupon(coupon)} className="p-1.5 rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSelectedCoupon(coupon); setShowDeleteCouponDialog(true) }} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Banners tab */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="primary"
              icon={<Upload className="w-4 h-4" />}
              loading={uploadingBanner}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Banner
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleBannerUpload(e.target.files)}
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="aspect-[800/300] bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : banners.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
              <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No banners uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((banner) => (
                <div key={banner.id} className="group relative rounded-xl overflow-hidden border border-gray-200 shadow-card">
                  <div className="aspect-[800/300] bg-gray-100 relative">
                    <Image
                      src={banner.image_url}
                      alt={banner.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => { setSelectedBannerId(banner.id); setShowDeleteBannerDialog(true) }}
                        className="h-10 w-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{banner.title}</p>
                    <Badge variant={banner.is_active ? 'success' : 'gray'}>
                      {banner.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Coupon modal */}
      <Modal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        title={selectedCoupon ? 'Edit Coupon' : 'Create Coupon'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCouponModal(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSaveCoupon}>
              {selectedCoupon ? 'Save Changes' : 'Create Coupon'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Coupon Code *"
            value={couponForm.code}
            onChange={(e) => setCouponForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
            placeholder="e.g. SAVE20"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Discount Type"
              value={couponForm.type}
              onChange={(e) => setCouponForm((p) => ({ ...p, type: e.target.value as 'percentage' | 'fixed' }))}
              options={[
                { value: 'percentage', label: 'Percentage (%)' },
                { value: 'fixed', label: 'Fixed Amount (GH₵)' },
              ]}
            />
            <Input
              label={`Value (${couponForm.type === 'percentage' ? '%' : 'GH₵'}) *`}
              type="number"
              min="0"
              max={couponForm.type === 'percentage' ? '100' : undefined}
              value={couponForm.value}
              onChange={(e) => setCouponForm((p) => ({ ...p, value: e.target.value }))}
              placeholder="0"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min. Order Amount"
              type="number"
              min="0"
              value={couponForm.min_order}
              onChange={(e) => setCouponForm((p) => ({ ...p, min_order: e.target.value }))}
              placeholder="0"
            />
            <Input
              label="Max Uses"
              type="number"
              min="1"
              value={couponForm.max_uses}
              onChange={(e) => setCouponForm((p) => ({ ...p, max_uses: e.target.value }))}
              placeholder="Unlimited"
            />
          </div>
          <Input
            label="Expiry Date"
            type="date"
            value={couponForm.expires_at}
            onChange={(e) => setCouponForm((p) => ({ ...p, expires_at: e.target.value }))}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCouponForm((p) => ({ ...p, is_active: !p.is_active }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${couponForm.is_active ? 'bg-brand-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${couponForm.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <label className="text-sm text-gray-700">
              {couponForm.is_active ? 'Active' : 'Inactive'}
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteCouponDialog}
        onClose={() => setShowDeleteCouponDialog(false)}
        onConfirm={handleDeleteCoupon}
        title="Delete Coupon"
        message={`Delete coupon "${selectedCoupon?.code}"? This cannot be undone.`}
        loading={deleting}
      />
      <ConfirmDialog
        isOpen={showDeleteBannerDialog}
        onClose={() => setShowDeleteBannerDialog(false)}
        onConfirm={handleDeleteBanner}
        title="Delete Banner"
        message="Delete this banner? This cannot be undone."
        loading={deleting}
      />
    </div>
  )
}
