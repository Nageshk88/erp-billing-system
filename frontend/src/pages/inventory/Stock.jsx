import { useState, useEffect } from 'react'
import { inventoryApi } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import Modal from '../../components/common/Modal'
import { formatNumber } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function Stock() {
  const [stock, setStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [adjModal, setAdjModal] = useState(false)
  const [adjForm, setAdjForm] = useState({ itemId: '', warehouseId: '', quantity: 0, notes: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await inventoryApi.stockSummary()
    setStock(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handleAdjust = async () => {
    setSaving(true)
    try {
      await inventoryApi.adjustment(adjForm)
      toast.success('Stock adjusted!')
      setAdjModal(false)
      load()
    } catch (e) { toast.error(e.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  const lowStock = stock.filter(s => parseFloat(s.quantity) <= parseFloat(s.Item?.minStockLevel || 0))

  return (
    <div className="space-y-4">
      <PageHeader title="Stock Levels" subtitle="Real-time inventory across warehouses">
        <button onClick={() => setAdjModal(true)} className="btn-secondary">+ Manual Adjustment</button>
      </PageHeader>

      {lowStock.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-orange-500 text-lg">⚠️</span>
          <div>
            <div className="font-semibold text-orange-800 text-sm">Low Stock Alert</div>
            <div className="text-xs text-orange-700 mt-0.5">{lowStock.length} item(s) at or below minimum stock level: {lowStock.map(s => s.Item?.name).join(', ')}</div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Item', 'SKU', 'Warehouse', 'On Hand', 'Reserved', 'Available', 'UoM', 'Min Level', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
              : stock.length === 0 ? <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">No stock data.</td></tr>
              : stock.map(s => {
                const avail = parseFloat(s.quantity) - parseFloat(s.reservedQuantity || 0)
                const isLow = avail <= parseFloat(s.Item?.minStockLevel || 0)
                return (
                  <tr key={s.id} className={`hover:bg-gray-50/60 ${isLow ? 'bg-orange-50/30' : ''}`}>
                    <td className="px-4 py-3 font-medium">{s.Item?.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{s.Item?.sku}</td>
                    <td className="px-4 py-3 text-gray-600">{s.Warehouse?.name}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatNumber(s.quantity)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatNumber(s.reservedQuantity)}</td>
                    <td className="px-4 py-3 font-semibold text-primary-600">{formatNumber(avail)}</td>
                    <td className="px-4 py-3 text-gray-500">{s.Item?.uom}</td>
                    <td className="px-4 py-3 text-gray-500">{s.Item?.minStockLevel}</td>
                    <td className="px-4 py-3">
                      {isLow ? <span className="badge badge-red">Low</span> : <span className="badge badge-green">OK</span>}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      <Modal open={adjModal} onClose={() => setAdjModal(false)} title="Manual Stock Adjustment">
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Item</label>
            <select className="input" value={adjForm.itemId} onChange={e => setAdjForm(f => ({ ...f, itemId: e.target.value }))}>
              <option value="">Select item...</option>
              {[...new Set(stock.map(s => s.Item?.id))].map(id => {
                const s = stock.find(s => s.Item?.id === id)
                return <option key={id} value={id}>{s?.Item?.name}</option>
              })}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Warehouse</label>
            <select className="input" value={adjForm.warehouseId} onChange={e => setAdjForm(f => ({ ...f, warehouseId: e.target.value }))}>
              <option value="">Select warehouse...</option>
              {[...new Set(stock.map(s => JSON.stringify({ id: s.Warehouse?.id, name: s.Warehouse?.name })))].map(s => {
                const w = JSON.parse(s)
                return <option key={w.id} value={w.id}>{w.name}</option>
              })}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Quantity (use negative to reduce)</label>
            <input type="number" className="input" value={adjForm.quantity} onChange={e => setAdjForm(f => ({ ...f, quantity: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label">Notes</label>
            <input className="input" placeholder="Reason for adjustment..." value={adjForm.notes} onChange={e => setAdjForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setAdjModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAdjust} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Adjust Stock'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
