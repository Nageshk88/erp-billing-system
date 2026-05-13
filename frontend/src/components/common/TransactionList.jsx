import { useState, useEffect, useCallback } from 'react'
import { formatCurrency, formatDate, STATUS_LABELS, TYPE_LABELS } from '../../utils/formatters'
import { StatusBadge } from './Badge'
import PageHeader from './PageHeader'
import Modal from './Modal'
import TransactionForm from './TransactionForm'
import toast from 'react-hot-toast'

export default function TransactionList({
  title, subtitle, type, api, defaultType,
  convertTargetType, convertLabel,
  showImageToggle = false,
}) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.list({ type: defaultType, status: statusFilter || undefined, search: search || undefined })
      setItems(data.data || [])
      setTotal(data.total || 0)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [api, defaultType, statusFilter, search])

  useEffect(() => { load() }, [load])

  const handleConfirm = async (id) => {
    try { await api.confirm(id); toast.success('Confirmed!'); load() } catch (e) { toast.error(e.response?.data?.error || 'Failed') }
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancel this transaction?')) return
    try { await api.cancel(id); toast.success('Cancelled'); load() } catch (e) { toast.error(e.response?.data?.error || 'Failed') }
  }

  const handleConvert = async (id) => {
    try { await api.convert(id, convertTargetType); toast.success(`Converted to ${TYPE_LABELS[convertTargetType]}`); load() }
    catch (e) { toast.error(e.response?.data?.error || 'Conversion failed') }
  }

  const handlePdf = async (id, number) => {
    try {
      const { data } = await api.pdf(id)
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch { toast.error('PDF generation failed') }
  }

  const openEdit = (item) => { setEditing(item); setModalOpen(true) }
  const openNew = () => { setEditing(null); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditing(null) }
  const afterSave = () => { closeModal(); load() }

  return (
    <div className="space-y-4">
      <PageHeader title={title} subtitle={`${total} records`}>
        <button onClick={openNew} className="btn-primary">+ New {TYPE_LABELS[defaultType] || title}</button>
      </PageHeader>

      {/* Filters */}
      <div className="flex gap-3">
        <input placeholder="Search..." className="input max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input max-w-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Party</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No records found. Create your first {TYPE_LABELS[defaultType]}.</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-primary-600">{item.number || 'Draft'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(item.date)}</td>
                  <td className="px-4 py-3 text-gray-800">{item.contact?.name || '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(item.grandTotal)}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(item)} className="btn-ghost btn-sm">Edit</button>
                      {item.status === 'draft' && (
                        <button onClick={() => handleConfirm(item.id)} className="btn-primary btn-sm">Confirm</button>
                      )}
                      {convertTargetType && item.status === 'confirmed' && (
                        <button onClick={() => handleConvert(item.id)} className="btn-secondary btn-sm">{convertLabel}</button>
                      )}
                      <button onClick={() => handlePdf(item.id, item.number)} className="btn-secondary btn-sm">PDF</button>
                      {item.status === 'draft' && (
                        <button onClick={() => handleCancel(item.id)} className="btn-danger btn-sm">Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? `Edit ${TYPE_LABELS[defaultType]}` : `New ${TYPE_LABELS[defaultType]}`} size="xl">
        <TransactionForm
          initial={editing}
          defaultType={defaultType}
          api={api}
          onSave={afterSave}
          onCancel={closeModal}
          showImageToggle={showImageToggle}
        />
      </Modal>
    </div>
  )
}
