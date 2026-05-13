import TransactionList from '../../components/common/TransactionList'
import { salesApi } from '../../services/api'

export default function Quotations() {
  return (
    <TransactionList
      title="Quotations" subtitle="Manage customer quotations"
      defaultType="quotation" api={salesApi}
      convertTargetType="sales_order" convertLabel="→ Sales Order"
      showImageToggle
    />
  )
}
