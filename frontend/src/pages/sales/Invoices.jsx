import TransactionList from '../../components/common/TransactionList'
import { salesApi } from '../../services/api'

export default function Invoices() {
  return (
    <TransactionList
      title="Sales Invoices" subtitle="Manage sales invoices"
      defaultType="sales_invoice" api={salesApi}
    />
  )
}
