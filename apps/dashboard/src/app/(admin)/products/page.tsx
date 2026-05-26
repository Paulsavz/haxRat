'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  Upload,
  X,
  RefreshCw,
  ImageIcon,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Modal, { ConfirmDialog } from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { getSupabaseClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  compare_price?: number
  category_id?: string
  category_name?: string
  stock: number
  images: string[]
  sku?: string
  is_active: boolean
  created_at: string
}

const mockProducts: Product[] = Array.from({ length: 12 }, (_, i) => ({
  id: `prod-${i + 1}`,
  name: `Product ${i + 1}`,
  description: 'High quality product for retail.',
  price: 50 + i * 30,
  compare_price: 80 + i * 35,
  category_id: `cat-${(i % 3) + 1}`,
  category_name: ['Electronics', 'Clothing', 'Food'][i % 3],
  stock: Math.floor(Math.random() * 100),
  images: [],
  sku: `SKU-${String(i + 1).padStart(4, '0')}`,
  is_active: i % 7 !== 0,
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
}))

const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Electronics' },
  { id: 'cat-2', name: 'Clothing' },
  { id: 'cat-3', name: 'Food' },
]

interface ProductFormData {
  name: string
  description: string
  price: string
  compare_price: string
  category_id: string
  stock: string
  sku: string
  is_active: boolean
  images: string[]
}

const emptyForm: ProductFormData = {
  name: '',
  description: '',
  price: '',
  compare_price: '',
  category_id: '',
  stock: '',
  sku: '',
  is_active: true,
  images: [],
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [form, setForm] = useState<ProductFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [prodRes, catRes] = await Promise.allSettled([
        api.getProducts(),
        api.getCategories(),
      ])
      setProducts(prodRes.status === 'fulfilled' ? prodRes.value.data : mockProducts)
      setCategories(catRes.status === 'fulfilled' ? catRes.value.data : mockCategories)
    } catch {
      setProducts(mockProducts)
      setCategories(mockCategories)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setSelectedProduct(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(product: Product) {
    setSelectedProduct(product)
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      compare_price: String(product.compare_price ?? ''),
      category_id: product.category_id ?? '',
      stock: String(product.stock),
      sku: product.sku ?? '',
      is_active: product.is_active,
      images: product.images,
    })
    setShowModal(true)
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files?.length) return
    setUploadingImage(true)
    try {
      const supabase = getSupabaseClient()
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        const fileName = `products/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, { upsert: false })

        if (error) throw error

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(data.path)

        uploadedUrls.push(urlData.publicUrl)
      }

      setForm((prev) => ({ ...prev, images: [...prev.images, ...uploadedUrls] }))
      toast.success('Image uploaded successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  function removeImage(url: string) {
    setForm((prev) => ({ ...prev, images: prev.images.filter((img) => img !== url) }))
  }

  async function handleSave() {
    if (!form.name || !form.price) {
      toast.error('Name and price are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        compare_price: form.compare_price ? parseFloat(form.compare_price) : undefined,
        category_id: form.category_id || undefined,
        stock: parseInt(form.stock) || 0,
        sku: form.sku || undefined,
        is_active: form.is_active,
        images: form.images,
      }

      if (selectedProduct) {
        await api.updateProduct(selectedProduct.id, payload)
        setProducts((prev) =>
          prev.map((p) =>
            p.id === selectedProduct.id
              ? { ...p, ...payload, category_name: categories.find((c) => c.id === payload.category_id)?.name }
              : p
          )
        )
        toast.success('Product updated')
      } else {
        const res = await api.createProduct(payload)
        setProducts((prev) => [res.data, ...prev])
        toast.success('Product created')
      }
      setShowModal(false)
    } catch {
      // Use optimistic update for mock
      if (selectedProduct) {
        toast.success('Product updated (mock)')
      } else {
        const newProduct: Product = {
          id: `prod-${Date.now()}`,
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          compare_price: form.compare_price ? parseFloat(form.compare_price) : undefined,
          category_id: form.category_id,
          category_name: categories.find((c) => c.id === form.category_id)?.name,
          stock: parseInt(form.stock) || 0,
          sku: form.sku,
          is_active: form.is_active,
          images: form.images,
          created_at: new Date().toISOString(),
        }
        setProducts((prev) => [newProduct, ...prev])
        toast.success('Product created (mock)')
      }
      setShowModal(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedProduct) return
    setDeleting(true)
    try {
      await api.deleteProduct(selectedProduct.id)
      setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id))
      toast.success('Product deleted')
    } catch {
      setProducts((prev) => prev.filter((p) => p.id !== selectedProduct!.id))
      toast.success('Product deleted (mock)')
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
      setSelectedProduct(null)
    }
  }

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

  return (
    <div className="p-6 space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">{products.length} products total</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={openCreate}
        >
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
        <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={loadData} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-gray-200 shadow-card hover:shadow-card-hover hover:border-gray-300 transition-all overflow-hidden group"
            >
              {/* Image */}
              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                    <ImageIcon className="w-12 h-12 mb-2" />
                    <span className="text-xs">No image</span>
                  </div>
                )}
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(product)}
                    className="h-9 w-9 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-brand-50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-brand-600" />
                  </button>
                  <button
                    onClick={() => { setSelectedProduct(product); setShowDeleteDialog(true) }}
                    className="h-9 w-9 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
                {!product.is_active && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="danger">Inactive</Badge>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                {product.category_name && (
                  <p className="text-xs text-gray-400 mt-0.5">{product.category_name}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(product.price)}
                    </span>
                    {product.compare_price && product.compare_price > product.price && (
                      <span className="text-xs text-gray-400 line-through ml-1.5">
                        {formatCurrency(product.compare_price)}
                      </span>
                    )}
                  </div>
                  <Badge
                    variant={product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'danger'}
                    size="sm"
                  >
                    {product.stock} in stock
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedProduct ? 'Edit Product' : 'Add Product'}
        size="2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {selectedProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Product Name *"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Wireless Headphones"
              />
            </div>
            <Input
              label="Price (GH₵) *"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              placeholder="0.00"
            />
            <Input
              label="Compare Price (GH₵)"
              type="number"
              min="0"
              step="0.01"
              value={form.compare_price}
              onChange={(e) => setForm((p) => ({ ...p, compare_price: e.target.value }))}
              placeholder="0.00"
              hint="Original price for sale display"
            />
            <Select
              label="Category"
              value={form.category_id}
              onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
              options={categoryOptions}
            />
            <Input
              label="Stock Quantity"
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
              placeholder="0"
            />
            <div className="col-span-2">
              <Input
                label="SKU"
                value={form.sku}
                onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                placeholder="e.g. WH-001"
              />
            </div>
            <div className="col-span-2">
              <Textarea
                label="Description"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Product description..."
                rows={3}
              />
            </div>
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.images.map((url) => (
                <div key={url} className="relative h-20 w-20 rounded-lg overflow-hidden border border-gray-200">
                  <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                  <button
                    onClick={() => removeImage(url)}
                    className="absolute top-0.5 right-0.5 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className={cn(
                  'h-20 w-20 rounded-lg border-2 border-dashed border-gray-300',
                  'flex flex-col items-center justify-center gap-1 text-gray-400',
                  'hover:border-brand-400 hover:text-brand-500 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {uploadingImage ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span className="text-[10px]">Upload</span>
                  </>
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files)}
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                form.is_active ? 'bg-brand-600' : 'bg-gray-200'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow',
                  form.is_active ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
            <label className="text-sm text-gray-700">
              {form.is_active ? 'Active (visible in store)' : 'Inactive (hidden from store)'}
            </label>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        confirmText="Delete Product"
        loading={deleting}
      />
    </div>
  )
}
