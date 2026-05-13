import { useState, useEffect } from 'react'
import { accountingApi } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import { formatDate, formatCurrency } from '../../utils/formatters'

export default function JournalEntries() {
  const [entries, setEntries] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data } = await accountingApi.listJournal()
    setEntries(data.data || []); setTotal(data.total || 0)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <PageHeader title="Journal Entries" subtitle={`${total} entries`} />
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Number', 'Date', 'Narration', 'Lines', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
              : entries.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No journal entries. They are auto-created when invoices are confirmed.</td></tr>
              : entries.map(e => (
                <tr key={e.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-medium font-mono">{e.number}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(e.date)}</td>
                  <td className="px-4 py-3 text-gray-700">{e.narration}</td>
                  <td className="px-4 py-3 text-gray-500">{e.lines?.length || 0} lines</td>
                  <td className="px-4 py-3">
                    <button onClick={() => alert(JSON.stringify(e.lines?.map(l => `${l.account?.name}: Dr ${l.debit} Cr ${l.credit}`), null, 2))} className="btn-ghost btn-sm">View</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
