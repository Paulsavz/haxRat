import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { categoriesAPI } from '@/lib/api';
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import { LoadingScreen } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  description?: string;
  productCount?: number;
  createdAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await categoriesAPI.list();
      setCategories(res.data || []);
    } catch {
      setCategories([
        { id: '1', name: 'Electronics', description: 'Gadgets and devices', productCount: 24, createdAt: new Date().toISOString() },
        { id: '2', name: 'Footwear', description: 'Shoes and sandals', productCount: 15, createdAt: new Date().toISOString() },
        { id: '3', name: 'Accessories', description: 'Bags, watches, etc.', productCount: 31, createdAt: new Date().toISOString() },
        { id: '4', name: 'Clothing', description: 'Fashion items', productCount: 48, createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const data = { name: name.trim(), description: description.trim() };
      if (editing) {
        await categoriesAPI.update(editing.id, data);
        setCategories((prev) =>
          prev.map((c) => (c.id === editing.id ? { ...c, ...data } : c))
        );
        toast.success('Category updated');
      } else {
        const res = await categoriesAPI.create(data);
        setCategories((prev) => [...prev, { ...res.data, productCount: 0, createdAt: new Date().toISOString() }]);
        toast.success('Category created');
      }
      setShowModal(false);
    } catch {
      toast.error('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await categoriesAPI.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success('Category deleted');
    } catch {
      toast.error('Failed to delete category');
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Add Category
        </Button>
      </div>

      <Table>
        <TableHead>
          <tr>
            <Th>Name</Th>
            <Th>Description</Th>
            <Th>Products</Th>
            <Th>Created</Th>
            <Th>Actions</Th>
          </tr>
        </TableHead>
        <TableBody>
          {categories.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                No categories yet
              </td>
            </tr>
          ) : (
            categories.map((cat) => (
              <Tr key={cat.id}>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-brand-50 flex items-center justify-center">
                      <Tag size={15} className="text-brand-500" />
                    </div>
                    <span className="font-medium text-slate-900">{cat.name}</span>
                  </div>
                </Td>
                <Td className="text-slate-500 max-w-xs truncate">{cat.description || '—'}</Td>
                <Td>{cat.productCount ?? '—'}</Td>
                <Td className="text-slate-400">{formatDate(cat.createdAt)}</Td>
                <Td>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(cat)}>
                      <Pencil size={15} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(cat.id)}>
                      <Trash2 size={15} className="text-red-400" />
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </TableBody>
      </Table>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Category' : 'Add Category'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Name *"
            placeholder="e.g. Electronics"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Textarea
            label="Description"
            placeholder="Category description..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>
              {editing ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Category"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">Delete this category? Products in this category will be uncategorized.</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={() => deleteId && handleDelete(deleteId)}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
