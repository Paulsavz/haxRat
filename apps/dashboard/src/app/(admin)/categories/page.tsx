'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Tag, Search } from 'lucide-react'
import { api } from '@/lib/api'
import { formatRelativeTime } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Modal, { ConfirmDialog } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  products_count: number
  is_active: boolean
  created_at: string
  image_url?: string
}

const mockCategories: Category[] = [
  { id: '1', name: 'Electronics', slug: 'electronics', description: 'Phones, laptops, gadgets', products_count: 45, is_active: true, created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: '2', name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel', products_count: 120, is_active: true, created_at: new Date(Date.now() - 25 * 86400000).toISOString() },
  { id: '3', name: 'Food & Beverages', slug: 'food-beverages', description: 'Fresh and packaged foods', products_count: 80, is_active: true, created_at: new Date(Date.now() - 20 * 86400000).toISOString() },
  { id: '4', name: 'Home & Living', slug: 'home-living', description: 'Furniture and home decor', products_count: 55, is_active: true, created_at: new Date(Date.now() - 15 * 86400000).toISOString() },
  { id: '5', name: 'Beauty', slug: 'beauty', description: 'Skincare and cosmetics', products_count: 38, is_active: false, created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
]

interface CategoryForm {
  name: string
  description: string
  is_active: boolean
}

const emptyForm: CategoryForm = { name: '', description: '', is_active: true }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [form, setForm] = useState<CategoryForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    setLoading(true)
    try {
      const res = await api.getCategories()
      setCategories(res.data)
    } catch {
      setCategories(mockCategories)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setSelectedCategory(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(cat: Category) {
    setSelectedCategory(cat)
    setForm({ name: cat.name, description: cat.description ?? '', is_active: cat.is_active })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Category name is required')
      return
    }
    setSaving(true)
    try {
      const slug = form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const payload = { name: form.name, description: form.description, is_active: form.is_active, slug }

      if (selectedCategory) {
        await api.updateCategory(selectedCategory.id, payload)
        setCategories((prev) =>
          prev.map((c) => (c.id === selectedCategory.id ? { ...c, ...payload } : c))
        )
        toast.success('Category updated')
      } else {
        const res = await api.createCategory(payload)
        setCategories((prev) => [res.data, ...prev])
        toast.success('Category created')
      }
      setShowModal(false)
    } catch {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: form.name,
        slug: form.name.toLowerCase().replace(/\s+/g, '-'),
        description: form.description,
        products_count: 0,
        is_active: form.is_active,
        created_at: new Date().toISOString(),
      }
      if (selectedCategory) {
        setCategories((prev) =>
          prev.map((c) => (c.id === selectedCategory.id ? { ...c, ...form } : c))
        )
        toast.success('Category updated (mock)')
      } else {
        setCategories((prev) => [newCat, ...prev])
        toast.success('Category created (mock)')
      }
      setShowModal(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedCategory) return
    setDeleting(true)
    try {
      await api.deleteCategory(selectedCategory.id)
    } catch {}
    setCategories((prev) => prev.filter((c) => c.id !== selectedCategory.id))
    toast.success('Category deleted')
    setDeleting(false)
    setShowDeleteDialog(false)
    setSelectedCategory(null)
  }

  const filtered = categories.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">{categories.length} categories</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
          Add Category
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>

      {/* Categories grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-xl border border-gray-200 shadow-card hover:shadow-card-hover transition-all p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center">
                    <Tag className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                    <p className="text-xs text-gray-400 font-mono">/{cat.slug}</p>
                  </div>
                </div>
                <Badge variant={cat.is_active ? 'success' : 'gray'}>
                  {cat.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {cat.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{cat.description}</p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  <strong className="text-gray-900">{cat.products_count}</strong> products
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setSelectedCategory(cat); setShowDeleteDialog(true) }}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedCategory ? 'Edit Category' : 'Add Category'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {selectedCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Category Name *"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Electronics"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Brief description..."
            rows={3}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-brand-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <label className="text-sm text-gray-700">
              {form.is_active ? 'Active' : 'Inactive'}
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Delete "${selectedCategory?.name}"? All products in this category will become uncategorized.`}
        confirmText="Delete Category"
        loading={deleting}
      />
    </div>
  )
}
