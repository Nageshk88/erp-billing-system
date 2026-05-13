import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Customers from './pages/contacts/Customers'
import Suppliers from './pages/contacts/Suppliers'
import Items from './pages/inventory/Items'
import Stock from './pages/inventory/Stock'
import Quotations from './pages/sales/Quotations'
import SalesOrders from './pages/sales/SalesOrders'
import Invoices from './pages/sales/Invoices'
import CreditNotes from './pages/sales/CreditNotes'
import PurchaseOrders from './pages/purchases/PurchaseOrders'
import PurchaseBills from './pages/purchases/PurchaseBills'
import ChartOfAccounts from './pages/accounting/ChartOfAccounts'
import JournalEntries from './pages/accounting/JournalEntries'
import Reports from './pages/reports/Reports'
import LspManager from './pages/admin/LspManager'
import UserManager from './pages/admin/UserManager'

function PrivateRoute({ children, adminOnly = false }) {
  const { user, isAdmin } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin()) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { user } = useAuthStore()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="contacts/customers" element={<Customers />} />
        <Route path="contacts/suppliers" element={<Suppliers />} />
        <Route path="inventory/items" element={<Items />} />
        <Route path="inventory/stock" element={<Stock />} />
        <Route path="sales/quotations" element={<Quotations />} />
        <Route path="sales/orders" element={<SalesOrders />} />
        <Route path="sales/invoices" element={<Invoices />} />
        <Route path="sales/credit-notes" element={<CreditNotes />} />
        <Route path="purchases/orders" element={<PurchaseOrders />} />
        <Route path="purchases/bills" element={<PurchaseBills />} />
        <Route path="accounting/accounts" element={<ChartOfAccounts />} />
        <Route path="accounting/journal" element={<JournalEntries />} />
        <Route path="reports" element={<Reports />} />
        <Route path="admin/lsp" element={<PrivateRoute adminOnly><LspManager /></PrivateRoute>} />
        <Route path="admin/users" element={<PrivateRoute adminOnly><UserManager /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
