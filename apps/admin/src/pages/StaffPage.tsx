import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, UserCog } from 'lucide-react';
import { staffAPI } from '@/lib/api';
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Avatar from '@/components/ui/Avatar';
import { LoadingScreen } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

const DEFAULT_FORM = {
  name: '',
  email: '',
  phone: '',
  role: 'support',
  password: '',
  status: 'active' as 'active' | 'inactive',
};

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'support', label: 'Support Agent' },
  { value: 'driver', label: 'Delivery Driver' },
];

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchStaff = async () => {
    try {
      const res = await staffAPI.list();
      setStaff(res.data || []);
    } catch {
      setStaff([
        { id: '1', name: 'Ama Owusu', email: 'ama.owusu@retailhub.com', phone: '+233244111222', role: 'admin', status: 'active', createdAt: new Date(Date.now() - 365 * 86400000).toISOString() },
        { id: '2', name: 'Kwame Nkrumah', email: 'kwame.n@retailhub.com', phone: '+233205333444', role: 'support', status: 'active', createdAt: new Date(Date.now() - 90 * 86400000).toISOString() },
        { id: '3', name: 'Abena Asante', email: 'abena.a@retailhub.com', phone: '+233209555666', role: 'manager', status: 'active', createdAt: new Date(Date.now() - 180 * 86400000).toISOString() },
        { id: '4', name: 'Kofi Mensah', email: 'kofi.m@retailhub.com', role: 'driver', status: 'inactive', createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setShowModal(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditing(member);
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
      password: '',
      status: member.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      toast.error('Name and email are required');
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        status: form.status,
        ...(form.password && { password: form.password }),
      };

      if (editing) {
        await staffAPI.update(editing.id, data);
        setStaff((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...data } : s)));
        toast.success('Staff member updated');
      } else {
        const res = await staffAPI.create({ ...data, password: form.password || 'TempPass123!' });
        setStaff((prev) => [...prev, { ...res.data, createdAt: new Date().toISOString() }]);
        toast.success('Staff member created');
      }
      setShowModal(false);
    } catch {
      toast.error('Failed to save staff member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await staffAPI.delete(id);
      setStaff((prev) => prev.filter((s) => s.id !== id));
      toast.success('Staff member removed');
    } catch {
      toast.error('Failed to remove staff member');
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Staff</h1>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Add Staff
        </Button>
      </div>

      <Table>
        <TableHead>
          <tr>
            <Th>Member</Th>
            <Th>Role</Th>
            <Th>Phone</Th>
            <Th>Status</Th>
            <Th>Joined</Th>
            <Th>Actions</Th>
          </tr>
        </TableHead>
        <TableBody>
          {staff.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">No staff members</td>
            </tr>
          ) : (
            staff.map((member) => (
              <Tr key={member.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={member.name} size="sm" />
                    <div>
                      <p className="font-medium text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-400">{member.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <UserCog size={13} className="text-slate-400" />
                    <span className="capitalize">{ROLES.find((r) => r.value === member.role)?.label || member.role}</span>
                  </div>
                </Td>
                <Td className="text-slate-500">{member.phone || '—'}</Td>
                <Td><StatusBadge status={member.status} /></Td>
                <Td className="text-slate-400">{formatDate(member.createdAt)}</Td>
                <Td>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(member)}>
                      <Pencil size={15} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(member.id)}>
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
        title={editing ? 'Edit Staff Member' : 'Add Staff Member'}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Full Name *" placeholder="e.g. Kwame Asante" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Input label="Email *" type="email" placeholder="email@retailhub.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <Input label="Phone" placeholder="+233..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={ROLES} />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
              options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
            />
            <Input
              label={editing ? 'New Password (optional)' : 'Password *'}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>
              {editing ? 'Save Changes' : 'Add Member'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Staff Member" size="sm">
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">Are you sure you want to remove this staff member? They will lose access to the admin panel.</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={() => deleteId && handleDelete(deleteId)}>Remove</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
