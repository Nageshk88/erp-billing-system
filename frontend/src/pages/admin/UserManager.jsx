import { useState, useEffect } from 'react'
import { authApi } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import Modal from '../../components/common/Modal'
import { RoleBadge } from '../../components/common/Badge'
import toast from 'react-hot-toast'

const emptyForm = { name: '', email: '', password: '', role: 'staff', isActive: true }

export default function UserManager() {
  const [users, setUsers] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => { const { data } = await authApi.listUsers(); setUsers(data || []) }
  useEffect(() => { load() }, [])

  const openEdit = (u) => { setForm({ ...u, password: '' }); setEditing(u); setModalOpen(true) }

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error('Name and email required')
    if (!editing && !form.password) return toast.error('Password required for new user')
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (editing) { await authApi.updateUser(editing.id, payload); toast.success('Updated!') }
      else { await authApi.createUser(payload); toast.success('User created!') }
      setModalOpen(false); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Save failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="User Management" subtitle="Manage system users and roles (Admin only)">
        <button onClick={() => { setForm(emptyForm); setEditing(null); setModalOpen(true) }} className="btn-primary">+ New User</button>
      </PageHeader>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/60">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                <td className="px-4 py-3">{u.isActive ? <span className="badge badge-green">Active</span> : <span className="badge badge-red">Inactive</span>}</td>
                <td className="px-4 py-3"><button onClick={() => openEdit(u)} className="btn-ghost btn-sm">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : 'New User'}>
        <div className="space-y-4">
          <div className="form-group"><label className="label">Full Name *</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Email *</label><input type="email" className="input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
          <div className="form-group"><label className="label">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label><input type="password" className="input" value={form.password || ''} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></div>
          <div className="form-group"><label className="label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : (editing ? 'Update' : 'Create')}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
