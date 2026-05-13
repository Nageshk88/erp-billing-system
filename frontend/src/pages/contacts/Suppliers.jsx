import { useState, useEffect, useCallback } from 'react'
import { contactsApi } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import Modal from '../../components/common/Modal'
import toast from 'react-hot-toast'

const emptyForm = { type: 'supplier', name: '', code: '', email: '', phone: '', address: '', city: '', country: 'India', gstNumber: '' }

export default function Suppliers() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const { data } = await contactsApi.list({ type: 'supplier', search: search || undefined })
    setItems(data.data || []); setTotal(data.total || 0)
  }, [search])

  useEffect(() => { load() }, [load])

  const openEdit = (c) => { setForm(c); setEditing(c); setModalOpen(true) }

  const handleSave = async () => {
    if (!form.name) return toast.error('Name is required')
    setSaving(true)
    try {
      if (editing) { await contactsApi.update(editing.id, form); toast.success('Updated!') }
      else { await contactsApi.create({ ...form, type: 'supplier' }); toast.success('Supplier created!') }
      setModalOpen(false); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Save failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Suppliers" subtitle={`${total} suppliers`}>
        <button onClick={() => { setForm(emptyForm); setEditing(null); setModalOpen(true) }} className="btn-primary">+ New Supplier</button>
      </PageHeader>
      <input placeholder="Search suppliers..." className="input max-w-sm" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Name', 'Code', 'Phone', 'City', 'GST', 'Actions'].map(h => (
                <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No suppliers found.</td></tr>
              : items.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.code}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{c.city}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.gstNumber}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => openEdit(c)} className="btn-ghost btn-sm">Edit</button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Supplier' : 'New Supplier'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[['name', 'Name *', 'text'], ['code', 'Code', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'text'], ['city', 'City', 'text'], ['country', 'Country', 'text'], ['gstNumber', 'GST Number', 'text']].map(([f, l, t]) => (
              <div key={f} className="form-group">
                <label className="label">{l}</label>
                <input type={t} className="input" value={form[f] || ''} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="form-group">
            <label className="label">Address</label>
            <textarea className="input" rows={2} value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
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
