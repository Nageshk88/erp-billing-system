import { NavLink } from 'react-router-dom'
import {
  HomeIcon, UsersIcon, CubeIcon, DocumentTextIcon,
  ShoppingCartIcon, CalculatorIcon, ChartBarIcon,
  ShieldCheckIcon, BuildingStorefrontIcon, ArrowsRightLeftIcon,
  CreditCardIcon, ReceiptRefundIcon, BanknotesIcon,
  ClipboardDocumentListIcon, AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'
import useUiStore from '../../store/uiStore'
import useAuthStore from '../../store/authStore'

const navGroups = [
  {
    label: 'Overview',
    items: [{ to: '/', icon: HomeIcon, label: 'Dashboard', exact: true }],
  },
  {
    label: 'Contacts',
    items: [
      { to: '/contacts/customers', icon: UsersIcon, label: 'Customers' },
      { to: '/contacts/suppliers', icon: BuildingStorefrontIcon, label: 'Suppliers' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { to: '/inventory/items', icon: CubeIcon, label: 'Items / Products' },
      { to: '/inventory/stock', icon: ArrowsRightLeftIcon, label: 'Stock Levels' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/sales/quotations', icon: DocumentTextIcon, label: 'Quotations' },
      { to: '/sales/orders', icon: ClipboardDocumentListIcon, label: 'Sales Orders' },
      { to: '/sales/invoices', icon: ReceiptRefundIcon, label: 'Sales Invoices' },
      { to: '/sales/credit-notes', icon: CreditCardIcon, label: 'Credit Notes' },
    ],
  },
  {
    label: 'Purchases',
    items: [
      { to: '/purchases/orders', icon: ShoppingCartIcon, label: 'Purchase Orders' },
      { to: '/purchases/bills', icon: BanknotesIcon, label: 'Purchase Bills' },
    ],
  },
  {
    label: 'Accounting',
    items: [
      { to: '/accounting/accounts', icon: CalculatorIcon, label: 'Chart of Accounts' },
      { to: '/accounting/journal', icon: DocumentTextIcon, label: 'Journal Entries' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { to: '/reports', icon: ChartBarIcon, label: 'Reports' },
    ],
  },
]

const adminGroup = {
  label: 'Admin',
  items: [
    { to: '/admin/lsp', icon: AdjustmentsHorizontalIcon, label: 'LSP / Pricing Rules' },
    { to: '/admin/users', icon: ShieldCheckIcon, label: 'User Management' },
  ],
}

export default function Sidebar() {
  const { sidebarOpen } = useUiStore()
  const { isAdmin } = useAuthStore()
  const groups = isAdmin() ? [...navGroups, adminGroup] : navGroups

  return (
    <aside className={`fixed top-0 left-0 h-full bg-gray-900 text-white flex flex-col z-20 transition-all duration-200 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-700 ${!sidebarOpen && 'justify-center'}`}>
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">E</div>
        {sidebarOpen && <span className="font-bold text-base leading-tight">ERP Billing<br /><span className="text-xs font-normal text-gray-400">Trading Suite</span></span>}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 scrollbar-thin">
        {groups.map(group => (
          <div key={group.label} className="mb-2">
            {sidebarOpen && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-1">{group.label}</p>}
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'} ${!sidebarOpen && 'justify-center'}`
                }
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className={`px-4 py-3 border-t border-gray-700 text-xs text-gray-500 ${!sidebarOpen && 'hidden'}`}>
        v1.0.0
      </div>
    </aside>
  )
}
