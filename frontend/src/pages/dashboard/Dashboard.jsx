import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { reportsApi } from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { BanknotesIcon, ShoppingCartIcon, ExclamationCircleIcon, CubeIcon } from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [salesData, setSalesData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([reportsApi.dashboard(), reportsApi.salesAnalysis()])
      .then(([d, s]) => {
        setData(d.data)
        const grouped = {}
        s.data.forEach(r => {
          const month = r.date?.substring(0, 7)
          if (month) grouped[month] = (grouped[month] || 0) + parseFloat(r.grandTotal || 0)
        })
        setSalesData(Object.entries(grouped).slice(-6).map(([k, v]) => ({ month: k, sales: v })))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400 text-sm">Loading dashboard...</div></div>

  const stats = [
    { label: 'Sales This Month', value: formatCurrency(data?.salesThisMonth), icon: BanknotesIcon, color: 'bg-blue-500', link: '/sales/invoices' },
    { label: 'Purchases This Month', value: formatCurrency(data?.purchasesThisMonth), icon: ShoppingCartIcon, color: 'bg-purple-500', link: '/purchases/bills' },
    { label: 'Overdue Invoices', value: data?.overdueReceivables || 0, icon: ExclamationCircleIcon, color: 'bg-red-500', link: '/reports' },
    { label: 'Low Stock Items', value: data?.lowStockCount || 0, icon: CubeIcon, color: 'bg-orange-500', link: '/inventory/stock' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back — here's your business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Link key={s.label} to={s.link} className="stat-card hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
              </div>
              <div className={`${s.color} w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <s.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="section-title mb-4">Monthly Sales Trend</h2>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No sales data yet</div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Recent Sales</h2>
          <div className="space-y-3">
            {data?.recentSales?.length > 0 ? data.recentSales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-sm font-medium text-gray-800">{sale.contact?.name || 'N/A'}</div>
                  <div className="text-xs text-gray-400">{sale.number} • {formatDate(sale.date)}</div>
                </div>
                <div className="text-sm font-bold text-primary-600">{formatCurrency(sale.grandTotal)}</div>
              </div>
            )) : (
              <p className="text-sm text-gray-400 italic">No recent sales</p>
            )}
          </div>
          <Link to="/sales/invoices" className="btn-secondary w-full justify-center mt-4 text-xs">View All Invoices</Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="card p-6">
        <h2 className="section-title mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '+ New Invoice', to: '/sales/invoices', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
            { label: '+ New Quotation', to: '/sales/quotations', color: 'text-green-600 bg-green-50 hover:bg-green-100' },
            { label: '+ New Purchase Order', to: '/purchases/orders', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
            { label: 'View Reports', to: '/reports', color: 'text-orange-600 bg-orange-50 hover:bg-orange-100' },
          ].map(q => (
            <Link key={q.label} to={q.to} className={`rounded-xl px-4 py-3 text-sm font-medium text-center transition-colors ${q.color}`}>
              {q.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
