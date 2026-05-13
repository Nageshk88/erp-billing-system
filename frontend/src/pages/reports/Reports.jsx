import { useState, useEffect } from 'react'
import { reportsApi } from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/formatters'
import PageHeader from '../../components/common/PageHeader'

const today = new Date().toISOString().split('T')[0]
const monthStart = today.substring(0, 7) + '-01'

export default function Reports() {
  const [tab, setTab] = useState('pl')
  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(today)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true); setData(null)
    try {
      let res
      if (tab === 'pl') res = await reportsApi.profitLoss({ from, to })
      else if (tab === 'bs') res = await reportsApi.balanceSheet()
      else if (tab === 'stock') res = await reportsApi.stockSummary()
      else if (tab === 'tax') res = await reportsApi.taxReport({ from, to })
      else if (tab === 'recv') res = await reportsApi.receivables()
      else if (tab === 'pay') res = await reportsApi.payables()
      setData(res.data)
    } catch { setData(null) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [tab, from, to])

  const tabs = [
    { id: 'pl', label: 'Profit & Loss' }, { id: 'bs', label: 'Balance Sheet' },
    { id: 'stock', label: 'Stock Summary' }, { id: 'tax', label: 'Tax Report' },
    { id: 'recv', label: 'Receivables' }, { id: 'pay', label: 'Payables' },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="Reports & Analytics" />

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white shadow-sm text-primary-600' : 'text-gray-600 hover:text-gray-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Date filter */}
      {['pl', 'tax'].includes(tab) && (
        <div className="flex items-center gap-3">
          <div className="form-group"><label className="label">From</label><input type="date" className="input w-auto" value={from} onChange={e => setFrom(e.target.value)} /></div>
          <div className="form-group"><label className="label">To</label><input type="date" className="input w-auto" value={to} onChange={e => setTo(e.target.value)} /></div>
        </div>
      )}

      {loading ? <div className="text-center py-20 text-gray-400">Loading report...</div> : (
        <div className="card p-6">
          {tab === 'pl' && data && <ProfitLoss data={data} />}
          {tab === 'bs' && data && <BalanceSheet data={data} />}
          {tab === 'stock' && data && <StockSummary data={data} />}
          {tab === 'tax' && data && <TaxReport data={data} />}
          {tab === 'recv' && data && <ReceivablesPayables data={data} title="Receivables" />}
          {tab === 'pay' && data && <ReceivablesPayables data={data} title="Payables" />}
        </div>
      )}
    </div>
  )
}

function ProfitLoss({ data }) {
  return (
    <div className="max-w-xl">
      <h2 className="section-title mb-4">Profit & Loss Statement</h2>
      <table className="w-full text-sm">
        <tbody>
          <Row label="Gross Revenue" value={data.revenue} />
          <Row label="Credit Notes / Returns" value={data.creditNotes} negative />
          <RowBold label="Net Revenue" value={data.netRevenue} />
          <tr><td colSpan={2} className="py-2 border-b border-gray-200" /></tr>
          <Row label="Cost of Goods Sold (Purchases)" value={data.cogs} negative />
          <RowBold label="Gross Profit" value={data.grossProfit} highlight={data.grossProfit >= 0} />
        </tbody>
      </table>
    </div>
  )
}

function BalanceSheet({ data }) {
  return (
    <div>
      <h2 className="section-title mb-4">Balance Sheet</h2>
      <div className="grid grid-cols-2 gap-8">
        {Object.entries(data).map(([type, accounts]) => (
          <div key={type}>
            <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">{type}</h3>
            {accounts.map(a => (
              <div key={a.id} className="flex justify-between text-sm py-1 border-b border-gray-50">
                <span className="text-gray-700">{a.name}</span>
                <span className="font-medium">{formatCurrency(a.currentBalance)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function StockSummary({ data }) {
  return (
    <div>
      <h2 className="section-title mb-4">Stock Summary</h2>
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Item', 'SKU', 'Warehouse', 'Quantity', 'UoM', 'Cost Price', 'Stock Value'].map(h => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((s, i) => (
            <tr key={i} className="hover:bg-gray-50/60">
              <td className="px-3 py-2 font-medium">{s.Item?.name}</td>
              <td className="px-3 py-2 text-gray-500 font-mono text-xs">{s.Item?.sku}</td>
              <td className="px-3 py-2 text-gray-600">{s.Warehouse?.name}</td>
              <td className="px-3 py-2 font-semibold">{s.quantity}</td>
              <td className="px-3 py-2 text-gray-500">{s.Item?.uom}</td>
              <td className="px-3 py-2 text-gray-500">{formatCurrency(s.Item?.costPrice)}</td>
              <td className="px-3 py-2 font-semibold text-primary-600">{formatCurrency(s.stockValue)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 bg-gray-50">
            <td colSpan={6} className="px-3 py-2 font-bold text-right">Total Stock Value:</td>
            <td className="px-3 py-2 font-bold text-primary-700">{formatCurrency(data.reduce((s, r) => s + (r.stockValue || 0), 0))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function TaxReport({ data }) {
  return (
    <div className="max-w-md">
      <h2 className="section-title mb-4">Tax Report</h2>
      <table className="w-full text-sm">
        <tbody>
          <Row label="Output Tax (Sales)" value={data.salesTax} />
          <Row label="Input Tax Credit (Purchases)" value={data.purchaseTax} />
          <RowBold label="Net Tax Payable" value={data.netTax} highlight={data.netTax >= 0} />
        </tbody>
      </table>
    </div>
  )
}

function ReceivablesPayables({ data, title }) {
  const total = data.reduce((s, r) => s + (r.outstanding || 0), 0)
  return (
    <div>
      <h2 className="section-title mb-4">{title}</h2>
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Invoice', 'Date', 'Party', 'Grand Total', 'Paid', 'Outstanding'].map(h => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map(r => (
            <tr key={r.id} className="hover:bg-gray-50/60">
              <td className="px-3 py-2 font-medium text-primary-600">{r.number}</td>
              <td className="px-3 py-2 text-gray-600">{formatDate(r.date)}</td>
              <td className="px-3 py-2 text-gray-800">{r.contact?.name}</td>
              <td className="px-3 py-2">{formatCurrency(r.grandTotal)}</td>
              <td className="px-3 py-2 text-green-600">{formatCurrency(r.paidAmount)}</td>
              <td className="px-3 py-2 font-bold text-red-600">{formatCurrency(r.outstanding)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 bg-gray-50">
            <td colSpan={5} className="px-3 py-2 font-bold text-right">Total Outstanding:</td>
            <td className="px-3 py-2 font-bold text-red-700">{formatCurrency(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function Row({ label, value, negative }) {
  return (
    <tr className="border-b border-gray-50">
      <td className="py-2 text-gray-700">{label}</td>
      <td className="py-2 text-right font-medium">{negative ? `(${formatCurrency(value)})` : formatCurrency(value)}</td>
    </tr>
  )
}

function RowBold({ label, value, highlight }) {
  return (
    <tr className="border-b-2 border-gray-200 font-bold">
      <td className="py-3 text-gray-900">{label}</td>
      <td className={`py-3 text-right text-base ${highlight ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(value)}</td>
    </tr>
  )
}
