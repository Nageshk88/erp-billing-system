import { useEffect, useState } from 'react'
import { XMarkIcon, UserCircleIcon, ShoppingBagIcon, ExclamationTriangleIcon, SparklesIcon } from '@heroicons/react/24/outline'
import useUiStore from '../../store/uiStore'
import { crmApi, contactsApi } from '../../services/api'
import { formatDate } from '../../utils/formatters'

export default function CrmDrawer() {
  const { crmDrawerOpen, crmCustomerId, closeCrmDrawer } = useUiStore()
  const [customer, setCustomer] = useState(null)
  const [profile, setProfile] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    if (!crmDrawerOpen || !crmCustomerId) return
    setLoading(true)
    setActiveTab('profile')
    Promise.all([
      contactsApi.get(crmCustomerId),
      crmApi.getProfile(crmCustomerId),
      crmApi.analytics(crmCustomerId),
    ]).then(([c, p, a]) => {
      setCustomer(c.data)
      setProfile(p.data)
      setAnalytics(a.data)
    }).finally(() => setLoading(false))
  }, [crmDrawerOpen, crmCustomerId])

  if (!crmDrawerOpen) return null

  return (
    <aside className="fixed top-0 right-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-30 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex items-center gap-3">
          <UserCircleIcon className="w-8 h-8 opacity-80" />
          <div>
            <div className="font-semibold text-base">{customer?.name || 'Loading...'}</div>
            <div className="text-xs opacity-75">{customer?.code}</div>
          </div>
        </div>
        <button onClick={closeCrmDrawer} className="p-1 rounded hover:bg-white/20 transition-colors">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {['profile', 'analytics'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : activeTab === 'profile' ? (
          <ProfileTab customer={customer} profile={profile} />
        ) : (
          <AnalyticsTab analytics={analytics} />
        )}
      </div>
    </aside>
  )
}

function ProfileTab({ customer, profile }) {
  const partyColors = { Wholesaler: 'badge-blue', Retailer: 'badge-green', 'End User': 'badge-purple', Other: 'badge-gray' }

  return (
    <div className="p-5 space-y-5">
      {/* Party Type Badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Party Type</span>
        <span className={`badge ${partyColors[profile?.partyType] || 'badge-gray'}`}>{profile?.partyType || 'Other'}</span>
      </div>

      {/* Static CRM Fields */}
      <div className="space-y-3">
        <InfoRow label="Business Type" value={profile?.businessType || customer?.businessType} />
        <InfoRow label="Location" value={[customer?.city, profile?.country || customer?.country].filter(Boolean).join(', ')} />
        <InfoRow label="Phone" value={customer?.phone} />
        <InfoRow label="Email" value={customer?.email} />
        <InfoRow label="GST Number" value={customer?.gstNumber} />
        <InfoRow label="Credit Limit" value={customer?.creditLimit ? `₹${Number(customer.creditLimit).toLocaleString('en-IN')}` : 'Not set'} />
      </div>

      {/* Personal Preferences */}
      {(profile?.personalPreferences || customer?.personalPreferences) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Personal Preferences</span>
          </div>
          <p className="text-sm text-amber-800">{profile?.personalPreferences || customer?.personalPreferences}</p>
        </div>
      )}

      {/* Outstanding */}
      {parseFloat(customer?.outstandingBalance) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Outstanding Balance</div>
          <div className="text-xl font-bold text-red-600">₹{Number(customer.outstandingBalance).toLocaleString('en-IN')}</div>
        </div>
      )}
    </div>
  )
}

function AnalyticsTab({ analytics }) {
  if (!analytics) return <div className="p-6 text-center text-gray-400 text-sm">No data available</div>

  return (
    <div className="p-5 space-y-6">
      {/* Frequently Bought */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBagIcon className="w-4 h-4 text-primary-500" />
          <h3 className="text-sm font-semibold text-gray-700">Frequently Bought</h3>
        </div>
        {analytics.frequentlyBought?.length > 0 ? (
          <div className="space-y-2">
            {analytics.frequentlyBought.map((row, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-sm font-medium text-gray-800">{row.item?.name}</div>
                  <div className="text-xs text-gray-400">{row.item?.sku} • {row.orderCount} orders</div>
                </div>
                <div className="text-sm font-semibold text-primary-600">{row.totalQty} {row.item?.uom}</div>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-gray-400 italic">No purchase history found.</p>}
      </section>

      {/* Latest New Product */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <SparklesIcon className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-semibold text-gray-700">Latest New Product</h3>
          <span className="text-xs text-gray-400">(first time purchase)</span>
        </div>
        {analytics.latestNewProduct ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <div className="font-medium text-sm text-emerald-800">{analytics.latestNewProduct.item?.name}</div>
            <div className="text-xs text-emerald-600 mt-1">First purchased: {formatDate(analytics.latestNewProduct.firstPurchaseDate)}</div>
            <div className="text-xs text-emerald-500 mt-1">Great item for feedback collection!</div>
          </div>
        ) : <p className="text-xs text-gray-400 italic">No data available.</p>}
      </section>

      {/* Dropped Items */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
          <h3 className="text-sm font-semibold text-gray-700">Dropped Items Alert</h3>
        </div>
        <p className="text-xs text-gray-400 mb-2">Previously bought regularly, not ordered in 90+ days.</p>
        {analytics.droppedItems?.length > 0 ? (
          <div className="space-y-2">
            {analytics.droppedItems.map((row, i) => (
              <div key={i} className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                <div className="font-medium text-sm text-orange-800">{row.item?.name}</div>
                <div className="text-xs text-orange-600 mt-1">{row.purchaseCount} orders in history • Inactive 90+ days</div>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-gray-400 italic">No dropped items detected.</p>}
      </section>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs text-gray-500 flex-shrink-0 mt-0.5">{label}</span>
      <span className="text-sm text-gray-800 text-right">{value || '—'}</span>
    </div>
  )
}
