import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, ImagePlus } from 'lucide-react';
import { productsAPI, categoriesAPI } from '@/lib/api';
import { uploadImage } from '@/lib/supabase';
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { LoadingScreen } from '@/components/ui/Spinner';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  comparePrice?: number;
  category?: { id: string; name: string };
  stock: number;
  status: 'active' | 'inactive';
  imageUrl?: string;
  images?: string[];
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  comparePrice: string;
  categoryId: string;
  stock: string;
  status: 'active' | 'inactive';
}

const DEFAULT_FORM: ProductForm = {
  name: '',
  description: '',
  price: '',
  comparePrice: '',
  categoryId: '',
  stock: '',
  status: 'active',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(DEFAULT_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        productsAPI.list(search ? { search } : {}),
        categoriesAPI.list(),
      ]);
      setProducts(prodRes.data?.products || prodRes.data || []);
      setCategories(catRes.data || []);
    } catch {
      setProducts([
        { id: '1', name: 'Wireless Earbuds Pro', description: 'Premium sound quality', price: 150, comparePrice: 200, category: { id: '1', name: 'Electronics' }, stock: 45, status: 'active', imageUrl: 'https://placehold.co/60x60/6366f1/fff?text=E' },
        { id: '2', name: 'Smart Watch Series X', description: 'Track your fitness', price: 320, comparePrice: 400, category: { id: '1', name: 'Electronics' }, stock: 12, status: 'active', imageUrl: 'https://placehold.co/60x60/6366f1/fff?text=W' },
        { id: '3', name: 'Running Shoes', description: 'Comfortable and light', price: 89, category: { id: '2', name: 'Footwear' }, stock: 0, status: 'inactive', imageUrl: 'https://placehold.co/60x60/6366f1/fff?text=S' },
      ]);
      setCategories([
        { id: '1', name: 'Electronics' },
        { id: '2', name: 'Footwear' },
        { id: '3', name: 'Accessories' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openCreate = () => {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      comparePrice: product.comparePrice?.toString() || '',
      categoryId: product.category?.id || '',
      stock: product.stock.toString(),
      status: product.status,
    });
    setImagePreview(product.imageUrl || '');
    setImageFile(null);
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error('Name and price are required');
      return;
    }
    setSaving(true);
    try {
      let imageUrl = editing?.imageUrl;
      if (imageFile) {
        const path = `products/${Date.now()}_${imageFile.name}`;
        imageUrl = (await uploadImage(imageFile, 'products', path)) || imageUrl;
      }

      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('comparePrice', form.comparePrice);
      formData.append('categoryId', form.categoryId);
      formData.append('stock', form.stock);
      formData.append('status', form.status);
      if (imageUrl) formData.append('imageUrl', imageUrl);
      if (imageFile) formData.append('image', imageFile);

      if (editing) {
        await productsAPI.update(editing.id, formData);
        toast.success('Product updated');
      } else {
        await productsAPI.create(formData);
        toast.success('Product created');
      }
      setShowModal(false);
      fetchProducts();
    } catch {
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await productsAPI.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Add Product
        </Button>
      </div>

      <div className="max-w-xs">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={15} />}
        />
      </div>

      <Table>
        <TableHead>
          <tr>
            <Th>Product</Th>
            <Th>Category</Th>
            <Th>Price</Th>
            <Th>Stock</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </TableHead>
        <TableBody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                No products found
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <Tr key={product.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-10 w-10 rounded-lg object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <ImagePlus size={16} className="text-slate-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-slate-400 truncate max-w-40">{product.description}</p>
                      )}
                    </div>
                  </div>
                </Td>
                <Td>{product.category?.name || '—'}</Td>
                <Td>
                  <div>
                    <span className="font-semibold">{formatCurrency(product.price)}</span>
                    {product.comparePrice && (
                      <span className="text-xs text-slate-400 line-through ml-1">
                        {formatCurrency(product.comparePrice)}
                      </span>
                    )}
                  </div>
                </Td>
                <Td>
                  <span className={product.stock === 0 ? 'text-red-500 font-medium' : ''}>
                    {product.stock}
                  </span>
                </Td>
                <Td><StatusBadge status={product.status} /></Td>
                <Td>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(product)}>
                      <Pencil size={15} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(product.id)}>
                      <Trash2 size={15} className="text-red-400" />
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </TableBody>
      </Table>

      {/* Product Form Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Product' : 'Add Product'}
        size="xl"
      >
        <div className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Product Image</label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-20 w-20 rounded-xl object-cover border-2 border-slate-200"
                />
              ) : (
                <div className="h-20 w-20 rounded-xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                  <ImagePlus size={24} className="text-slate-400" />
                </div>
              )}
              <label className="cursor-pointer">
                <span className="px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors">
                  Upload Image
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Product Name *"
                placeholder="e.g. Wireless Earbuds Pro"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <Input
              label="Price (GHS) *"
              type="number"
              placeholder="0.00"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <Input
              label="Compare Price (GHS)"
              type="number"
              placeholder="0.00"
              value={form.comparePrice}
              onChange={(e) => setForm({ ...form, comparePrice: e.target.value })}
            />
            <Select
              label="Category"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Select category"
            />
            <Input
              label="Stock Quantity"
              type="number"
              placeholder="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
            <div className="col-span-2">
              <Textarea
                label="Description"
                placeholder="Product description..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>
              {editing ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Product"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">
            Are you sure you want to delete this product? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => deleteId && handleDelete(deleteId)}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
