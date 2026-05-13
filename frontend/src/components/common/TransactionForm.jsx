import { useState, useEffect } from 'react'
import { contactsApi, itemsApi, warehousesApi, salesApi, lspApi } from '../../services/api'
import { formatCurrency } from '../../utils/formatters'
import PriceMemoryModal from '../sales/PriceMemoryModal'
import useAuthStore from '../../store/authStore'
import useUiStore from '../../store/uiStore'
import toast from 'react-hot-toast'
import { ClockIcon, UserIcon } from '@heroicons/react/24/outline'

const emptyLine = () => ({ itemId: '', quantity: 1, unitPrice: 0, discountPct: 0, taxRate: 18, lineTotal: 0, includeImage: false })

export default function TransactionForm({ initial, defaultType, api, onSave, onCancel, showImageToggle }) {
  const { isAdmin } = useAuthStore()
  const { openCrmDrawer } = useUiStore()
  const isEditMode = !!initial?.id && initial.status === 'draft'

  const [form, setForm] = useState({
    type: defaultType, date: new Date().toISOString().split('T')[0],
    status: 'draft', contactId: '', warehouseId: '', notes: '', terms: '',
    ...(initial || {}),
  })
  const [lines, setLines] = useState(initial?.lines?.map(l => ({ ...l, itemId: l.itemId || l.item?.id })) || [emptyLine()])
  const [contacts, setContacts] = useState([])
  const [items, setItems] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [saving, setSaving] = useState(false)
  const [priceMemory, setPriceMemory] = useState(null)

  const isSale = ['quotation', 'sales_order', 'delivery_challan', 'sales_invoice', 'credit_note', 'pos'].includes(defaultType)

  useEffect(() => {
    Promise.all([
      contactsApi.list({ type: isSale ? 'customer' : 'supplier', limit: 200 }),
      itemsApi.list({ limit: 200 }),
      warehousesApi.list(),
    ]).then(([c, it, w]) => {
      setContacts(c.data.data || [])
      setItems(it.data.data || [])
      setWarehouses(w.data || [])
    })
  }, [])

  const calcLine = (line) => {
    const qty = parseFloat(line.quantity) || 0
    const price = parseFloat(line.unitPrice) || 0
    const disc = parseFloat(line.discountPct) || 0
    const tax = parseFloat(line.taxRate) || 0
    const base = qty * price * (1 - disc / 100)
    const total = base + base * (tax / 100)
    return { ...line, lineTotal: +total.toFixed(2) }
  }

  const updateLine = (idx, field, value) => {
    const updated = [...lines]
    updated[idx] = calcLine({ ...updated[idx], [field]: value })
    setLines(updated)
  }

  const addLine = () => setLines([...lines, emptyLine()])
  const removeLine = (idx) => setLines(lines.filter((_, i) => i !== idx))

  const grandTotal = lines.reduce((s, l) => s + (parseFloat(l.lineTotal) || 0), 0)

  const checkLsp = async (lineIdx) => {
    if (!form.contactId || !lines[lineIdx].itemId || !isAdmin()) return
    const price = parseFloat(lines[lineIdx].unitPrice)
    try {
      const { data } = await lspApi.check(form.contactId, lines[lineIdx].itemId, price)
      if (!data.allowed) {
        toast.error(`Price blocked: minimum is ${formatCurrency(data.minPrice)} (LSP rule)`, { duration: 5000 })
      }
    } catch {}
  }

  const handleSave = async () => {
    if (!form.contactId) return toast.error('Please select a customer/supplier')
    if (lines.some(l => !l.itemId)) return toast.error('All lines must have an item selected')
    setSaving(true)
    try {
      const payload = { ...form, lines: lines.map(l => ({ ...l, sortOrder: lines.indexOf(l) })) }
      if (initial?.id) {
        await api.update(initial.id, payload)
        toast.success('Saved!')
      } else {
        await api.create(payload)
        toast.success('Created!')
      }
      onSave()
    } catch (e) {
      const err = e.response?.data
      if (err?.error === 'LSP_VIOLATION') {
        toast.error(err.message, { duration: 6000 })
      } else {
        toast.error(err?.error || 'Save failed')
      }
    } finally { setSaving(false) }
  }

  const isReadOnly = initial?.status && initial.status !== 'draft'

  return (
    <div className="space-y-5">
      {/* Header Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="label">{isSale ? 'Customer' : 'Supplier'} *</label>
          <div className="flex gap-2">
            <select className="input flex-1" value={form.contactId} onChange={e => setForm(f => ({ ...f, contactId: e.target.value }))} disabled={isReadOnly}>
              <option value="">Select...</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {isSale && form.contactId && (
              <button type="button" onClick={() => openCrmDrawer(form.contactId)} className="btn-secondary btn-sm flex-shrink-0" title="Open CRM Profile">
                <UserIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="form-group">
          <label className="label">Date *</label>
          <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} disabled={isReadOnly} />
        </div>
        <div className="form-group">
          <label className="label">Warehouse</label>
          <select className="input" value={form.warehouseId} onChange={e => setForm(f => ({ ...f, warehouseId: e.target.value }))} disabled={isReadOnly}>
            <option value="">Select warehouse...</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Due Date</label>
          <input type="date" className="input" value={form.dueDate || ''} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} disabled={isReadOnly} />
        </div>
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="section-title text-sm">Line Items</h3>
          {!isReadOnly && <button type="button" onClick={addLine} className="btn-secondary btn-sm">+ Add Line</button>}
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs text-gray-500">Item</th>
                {showImageToggle && <th className="px-3 py-2 text-center text-xs text-gray-500 w-16">Img</th>}
                <th className="px-3 py-2 text-right text-xs text-gray-500 w-20">Qty</th>
                <th className="px-3 py-2 text-right text-xs text-gray-500 w-28">Unit Price</th>
                <th className="px-3 py-2 text-right text-xs text-gray-500 w-16">Disc%</th>
                <th className="px-3 py-2 text-right text-xs text-gray-500 w-16">Tax%</th>
                <th className="px-3 py-2 text-right text-xs text-gray-500 w-28">Total</th>
                {!isReadOnly && <th className="px-3 py-2 w-16"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lines.map((line, i) => (
                <tr key={i}>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <select className="input text-xs py-1" value={line.itemId} onChange={e => { updateLine(i, 'itemId', e.target.value) }} disabled={isReadOnly}>
                        <option value="">Select item...</option>
                        {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                      </select>
                      {isSale && form.contactId && line.itemId && (
                        <button type="button" title="Price History" onClick={() => setPriceMemory({ idx: i, itemId: line.itemId, itemName: items.find(it => it.id === line.itemId)?.name })} className="p-1 text-blue-400 hover:text-blue-600">
                          <ClockIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  {showImageToggle && (
                    <td className="px-3 py-2 text-center">
                      <input type="checkbox" checked={line.includeImage || false} onChange={e => updateLine(i, 'includeImage', e.target.checked)} disabled={isReadOnly} className="rounded" />
                    </td>
                  )}
                  <td className="px-3 py-2"><input type="number" className="input text-xs py-1 text-right" value={line.quantity} onChange={e => updateLine(i, 'quantity', e.target.value)} disabled={isReadOnly} min="0" /></td>
                  <td className="px-3 py-2"><input type="number" className="input text-xs py-1 text-right" value={line.unitPrice} onChange={e => { updateLine(i, 'unitPrice', e.target.value); }} onBlur={() => checkLsp(i)} disabled={isReadOnly} min="0" /></td>
                  <td className="px-3 py-2"><input type="number" className="input text-xs py-1 text-right" value={line.discountPct} onChange={e => updateLine(i, 'discountPct', e.target.value)} disabled={isReadOnly} min="0" max="100" /></td>
                  <td className="px-3 py-2"><input type="number" className="input text-xs py-1 text-right" value={line.taxRate} onChange={e => updateLine(i, 'taxRate', e.target.value)} disabled={isReadOnly} min="0" /></td>
                  <td className="px-3 py-2 text-right font-medium">{formatCurrency(line.lineTotal)}</td>
                  {!isReadOnly && (
                    <td className="px-3 py-2 text-center">
                      {lines.length > 1 && <button type="button" onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={showImageToggle ? 6 : 5} className="px-3 py-3 text-right font-semibold text-gray-700">Grand Total:</td>
                <td className="px-3 py-3 text-right font-bold text-primary-700 text-base">{formatCurrency(grandTotal)}</td>
                {!isReadOnly && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} disabled={isReadOnly} />
        </div>
        <div className="form-group">
          <label className="label">Terms & Conditions</label>
          <textarea className="input" rows={2} value={form.terms || ''} onChange={e => setForm(f => ({ ...f, terms: e.target.value }))} disabled={isReadOnly} />
        </div>
      </div>

      {!isReadOnly && (
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : (initial?.id ? 'Update' : 'Create')}
          </button>
        </div>
      )}

      {/* Price Memory Modal */}
      {priceMemory && (
        <PriceMemoryModal
          customerId={form.contactId}
          itemId={priceMemory.itemId}
          itemName={priceMemory.itemName}
          onClose={() => setPriceMemory(null)}
          onSelect={(price) => { updateLine(priceMemory.idx, 'unitPrice', price); setPriceMemory(null) }}
        />
      )}
    </div>
  )
}
