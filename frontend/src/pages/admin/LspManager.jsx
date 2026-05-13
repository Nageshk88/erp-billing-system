import { useState, useEffect } from 'react'
import { lspApi, contactsApi, itemsApi } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import Modal from '../../components/common/Modal'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function LspManager() {
  const [rules, setRules] = useState([])
  const [customers, setCustomers] = useState([])
  const [items, setItems] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ customerId: '', itemId: '', minPrice: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [r, c, i] = await Promise.all([lspApi.list(), contactsApi.list({ type: 'customer', limit: 200 }), itemsApi.list({ limit: 200 })])
    setRules(r.data || []); setCustomers(c.data.data || []); setItems(i.data.data || [])
  }
  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!form.customerId || !form.itemId || !form.minPrice) return toast.error('All fields required')
    setSaving(true)
    try { await lspApi.create(form); toast.success('LSP rule saved!'); setModalOpen(false); load() }
    catch (e) { toast.error(e.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this LSP rule?')) return
    await lspApi.delete(id); toast.success('Deleted'); load()
  }

  return (
    <div className="space-y-4">
      <PageHeader title="LSP / Pricing Rules" subtitle="Set minimum authorized prices per customer-item pair (Admin only)">
        <button onClick={() => { setForm({ customerId: '', itemId: '', minPrice: '', notes: '' }); setModalOpen(true) }} className="btn-primary">+ New Rule</button>
      </PageHeader>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Last Selling Price (LSP) Rules:</strong> If a sales staff tries to set a price below the configured minimum for a specific customer+item combination, the system will block the transaction and require admin override.
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Customer', 'Item', 'Min Price (LSP)', 'Set By', 'Notes', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rules.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No LSP rules configured yet.</td></tr>
              : rules.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-medium">{r.customer?.name}</td>
                  <td className="px-4 py-3 text-gray-700">{r.item?.name} <span className="text-xs text-gray-400">({r.item?.sku})</span></td>
                  <td className="px-4 py-3 font-bold text-primary-600">{formatCurrency(r.minPrice)}</td>
                  <td className="px-4 py-3 text-gray-500">{r.setBy?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.notes || '—'}</td>
                  <td className="px-4 py-3"><button onClick={() => handleDelete(r.id)} className="btn-danger btn-sm">Remove</button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New LSP Rule">
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Customer *</label>
            <select className="input" value={form.customerId} onChange={e => setForm(p => ({ ...p, customerId: e.target.value }))}>
              <option value="">Select customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Item *</label>
            <select className="input" value={form.itemId} onChange={e => setForm(p => ({ ...p, itemId: e.target.value }))}>
              <option value="">Select item...</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Minimum Price (LSP) *</label>
            <input type="number" className="input" placeholder="e.g. 500" value={form.minPrice} onChange={e => setForm(p => ({ ...p, minPrice: e.target.value }))} min="0" />
          </div>
          <div className="form-group">
            <label className="label">Notes</label>
            <input className="input" placeholder="Reason or contract reference..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Create Rule'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
