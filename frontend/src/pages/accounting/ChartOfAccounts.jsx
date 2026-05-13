import { useState, useEffect } from 'react'
import { accountingApi } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import Modal from '../../components/common/Modal'
import { formatCurrency } from '../../utils/formatters'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense', 'bank', 'cash', 'receivable', 'payable', 'tax']
const emptyForm = { code: '', name: '', type: 'asset', description: '', openingBalance: 0 }
const typeColors = { asset: 'badge-blue', liability: 'badge-red', equity: 'badge-purple', revenue: 'badge-green', expense: 'badge-yellow', bank: 'badge-blue', cash: 'badge-green', receivable: 'badge-blue', payable: 'badge-red', tax: 'badge-gray' }

export default function ChartOfAccounts() {
  const { isAdmin } = useAuthStore()
  const [accounts, setAccounts] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await accountingApi.listAccounts()
    setAccounts(data || [])
  }
  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!form.code || !form.name) return toast.error('Code and Name are required')
    setSaving(true)
    try {
      if (editing) { await accountingApi.updateAccount(editing.id, form); toast.success('Updated!') }
      else { await accountingApi.createAccount(form); toast.success('Account created!') }
      setModalOpen(false); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Save failed') }
    finally { setSaving(false) }
  }

  const grouped = TYPES.reduce((g, t) => { g[t] = accounts.filter(a => a.type === t); return g }, {})

  return (
    <div className="space-y-4">
      <PageHeader title="Chart of Accounts" subtitle={`${accounts.length} accounts`}>
        {isAdmin() && <button onClick={() => { setForm(emptyForm); setEditing(null); setModalOpen(true) }} className="btn-primary">+ New Account</button>}
      </PageHeader>

      {TYPES.map(type => grouped[type].length > 0 && (
        <div key={type} className="card overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <span className={`badge ${typeColors[type]}`}>{type}</span>
            <span className="text-sm font-medium text-gray-600 capitalize">{type} Accounts</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['Code', 'Name', 'Balance', 'System', ...(isAdmin() ? ['Actions'] : [])].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {grouped[type].map(a => (
                <tr key={a.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{a.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                  <td className="px-4 py-3 font-semibold text-primary-600">{formatCurrency(a.currentBalance)}</td>
                  <td className="px-4 py-3">{a.isSystem ? <span className="badge badge-gray">System</span> : '—'}</td>
                  {isAdmin() && <td className="px-4 py-3">
                    {!a.isSystem && <button onClick={() => { setForm(a); setEditing(a); setModalOpen(true) }} className="btn-ghost btn-sm">Edit</button>}
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Account' : 'New Account'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Code *</label><input className="input" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} /></div>
            <div className="form-group"><label className="label">Name *</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="form-group"><label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="label">Opening Balance</label><input type="number" className="input" value={form.openingBalance} onChange={e => setForm(p => ({ ...p, openingBalance: e.target.value }))} /></div>
          </div>
          <div className="form-group"><label className="label">Description</label><textarea className="input" rows={2} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : (editing ? 'Update' : 'Create')}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
