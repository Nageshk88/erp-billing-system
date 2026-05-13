import TransactionList from '../../components/common/TransactionList'
import { salesApi } from '../../services/api'

export default function SalesOrders() {
  return (
    <TransactionList
      title="Sales Orders" subtitle="Manage sales orders"
      defaultType="sales_order" api={salesApi}
      convertTargetType="delivery_challan" convertLabel="→ Delivery Challan"
      showImageToggle
    />
  )
}
