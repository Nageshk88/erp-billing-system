import { useState, useEffect, useCallback } from 'react'
import { contactsApi } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import Modal from '../../components/common/Modal'
import useUiStore from '../../store/uiStore'
import toast from 'react-hot-toast'
import { UserIcon } from '@heroicons/react/24/outline'

const emptyForm = { type: 'customer', name: '', code: '', email: '', phone: '', address: '', city: '', country: 'India', gstNumber: '', creditLimit: 0, partyType: 'Other', businessType: '', personalPreferences: '' }

export default function Customers() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const { openCrmDrawer } = useUiStore()

  const load = useCallback(async () => {
    const { data } = await contactsApi.list({ type: 'customer', search: search || undefined })
    setItems(data.data || []); setTotal(data.total || 0)
  }, [search])

  useEffect(() => { load() }, [load])

  const openNew = () => { setForm(emptyForm); setEditing(null); setModalOpen(true) }
  const openEdit = (c) => { setForm(c); setEditing(c); setModalOpen(true) }

  const handleSave = async () => {
    if (!form.name) return toast.error('Name is required')
    setSaving(true)
    try {
      if (editing) { await contactsApi.update(editing.id, form); toast.success('Updated!') }
      else { await contactsApi.create(form); toast.success('Customer created!') }
      setModalOpen(false); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Save failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this customer?')) return
    await contactsApi.remove(id); toast.success('Deactivated'); load()
  }

  const partyColors = { Wholesaler: 'badge-blue', Retailer: 'badge-green', 'End User': 'badge-purple', Other: 'badge-gray' }

  return (
    <div className="space-y-4">
      <PageHeader title="Customers" subtitle={`${total} customers`}>
        <button onClick={openNew} className="btn-primary">+ New Customer</button>
      </PageHeader>

      <input placeholder="Search customers..." className="input max-w-sm" value={search} onChange={e => setSearch(e.target.value)} />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">City</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Party Type</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No customers found.</td></tr>
            ) : items.map(c => (
              <tr key={c.id} className="hover:bg-gray-50/60">
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-500">{c.code}</td>
                <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                <td className="px-4 py-3 text-gray-600">{c.city}</td>
                <td className="px-4 py-3 text-center"><span className={`badge ${partyColors[c.partyType] || 'badge-gray'}`}>{c.partyType}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openCrmDrawer(c.id)} className="btn-ghost btn-sm" title="CRM Profile"><UserIcon className="w-4 h-4" /></button>
                    <button onClick={() => openEdit(c)} className="btn-ghost btn-sm">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="btn-danger btn-sm">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'New Customer'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[['name', 'Name *', 'text'], ['code', 'Code', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'text'], ['city', 'City', 'text'], ['country', 'Country', 'text'], ['gstNumber', 'GST Number', 'text'], ['creditLimit', 'Credit Limit', 'number']].map(([f, l, t]) => (
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
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Party Type</label>
              <select className="input" value={form.partyType} onChange={e => setForm(p => ({ ...p, partyType: e.target.value }))}>
                {['Wholesaler', 'Retailer', 'End User', 'Other'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Business Type</label>
              <input className="input" value={form.businessType || ''} onChange={e => setForm(p => ({ ...p, businessType: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Personal Preferences (CRM notes)</label>
            <textarea className="input" rows={2} placeholder='e.g. "Prefers Coffee, call before 11am"' value={form.personalPreferences || ''} onChange={e => setForm(p => ({ ...p, personalPreferences: e.target.value }))} />
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
