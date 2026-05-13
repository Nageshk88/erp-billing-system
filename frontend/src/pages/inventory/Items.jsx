import { useState, useEffect, useCallback } from 'react'
import { itemsApi } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import Modal from '../../components/common/Modal'
import useAuthStore from '../../store/authStore'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

const emptyForm = { name: '', sku: '', barcode: '', category: '', brand: '', uom: 'Nos', hsnCode: '', taxRate: 18, costPrice: 0, sellingPrice: 0, mrp: 0, minStockLevel: 0, description: '' }

export default function Items() {
  const { isAdmin } = useAuthStore()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)

  const load = useCallback(async () => {
    const { data } = await itemsApi.list({ search: search || undefined })
    setItems(data.data || []); setTotal(data.total || 0)
  }, [search])

  useEffect(() => { load() }, [load])

  const openEdit = (item) => { setForm(item); setEditing(item); setModalOpen(true) }

  const handleSave = async () => {
    if (!form.name) return toast.error('Name is required')
    setSaving(true)
    try {
      let saved
      if (editing) { const { data } = await itemsApi.update(editing.id, form); saved = data; toast.success('Updated!') }
      else { const { data } = await itemsApi.create(form); saved = data; toast.success('Item created!') }

      if (imageFile && saved.id) {
        const fd = new FormData(); fd.append('image', imageFile)
        await itemsApi.uploadImage(saved.id, fd)
      }
      setModalOpen(false); setImageFile(null); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Save failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Items / Products" subtitle={`${total} items`}>
        <button onClick={() => { setForm(emptyForm); setEditing(null); setModalOpen(true) }} className="btn-primary">+ New Item</button>
      </PageHeader>
      <input placeholder="Search items, SKU..." className="input max-w-sm" value={search} onChange={e => setSearch(e.target.value)} />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Image', 'Name', 'SKU', 'Category', 'UoM', 'Selling Price', ...(isAdmin() ? ['Cost Price'] : []), 'Tax%', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.length === 0 ? <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">No items found.</td></tr>
              : items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-gray-200" />
                      : <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">No img</div>
                    }
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.sku}</td>
                  <td className="px-4 py-3 text-gray-600">{item.category}</td>
                  <td className="px-4 py-3 text-gray-600">{item.uom}</td>
                  <td className="px-4 py-3 font-medium text-primary-600">{formatCurrency(item.sellingPrice)}</td>
                  {isAdmin() && <td className="px-4 py-3 text-gray-500">{formatCurrency(item.costPrice)}</td>}
                  <td className="px-4 py-3 text-gray-500">{item.taxRate}%</td>
                  <td className="px-4 py-3"><button onClick={() => openEdit(item)} className="btn-ghost btn-sm">Edit</button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setImageFile(null) }} title={editing ? 'Edit Item' : 'New Item'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[['name', 'Name *', 'text'], ['sku', 'SKU', 'text'], ['barcode', 'Barcode', 'text'], ['category', 'Category', 'text'], ['brand', 'Brand', 'text'], ['uom', 'Unit of Measure', 'text'], ['hsnCode', 'HSN Code', 'text'], ['taxRate', 'Tax Rate %', 'number'], ['sellingPrice', 'Selling Price', 'number'], ['mrp', 'MRP', 'number'], ...(isAdmin() ? [['costPrice', 'Cost Price (Admin only)', 'number']] : []), ['minStockLevel', 'Min Stock Level', 'number']].map(([f, l, t]) => (
              <div key={f} className="form-group">
                <label className="label">{l}</label>
                <input type={t} className="input" value={form[f] ?? ''} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="form-group">
            <label className="label">Item Image (used in Quotations/POs)</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="input py-1.5 text-xs" />
            {editing?.imageUrl && <img src={editing.imageUrl} alt="" className="mt-2 h-16 w-16 object-cover rounded-lg border" />}
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
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
