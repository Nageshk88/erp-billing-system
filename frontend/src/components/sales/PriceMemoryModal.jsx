import { useEffect, useState } from 'react'
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline'
import { salesApi } from '../../services/api'
import { formatDate, formatCurrency } from '../../utils/formatters'

export default function PriceMemoryModal({ customerId, itemId, itemName, onClose, onSelect }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!customerId || !itemId) return
    salesApi.priceMemory(customerId, itemId)
      .then(r => setHistory(r.data))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [customerId, itemId])

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Price History</h2>
              <p className="text-xs text-gray-500">{itemName} — Last 10 transactions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ClockIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No previous transactions found for this customer + item combination.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 rounded-lg">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Disc%</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Staff</th>
                    {onSelect && <th className="px-4 py-2.5"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.map((row, i) => (
                    <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 text-gray-600">{formatDate(row.date)}</td>
                      <td className="px-4 py-3 text-right font-medium">{row.quantity}</td>
                      <td className="px-4 py-3 text-right font-bold text-primary-700">{formatCurrency(row.unitPrice)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{row.discountPct || 0}%</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(row.lineTotal)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{row.warehouseName}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{row.staffName}</td>
                      {onSelect && (
                        <td className="px-4 py-3">
                          <button onClick={() => { onSelect(row.unitPrice); onClose() }}
                            className="text-xs btn-sm btn-primary">
                            Use Price
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
