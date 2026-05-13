import TransactionList from '../../components/common/TransactionList'
import { purchasesApi } from '../../services/api'

export default function PurchaseOrders() {
  return (
    <TransactionList
      title="Purchase Orders" subtitle="Manage purchase orders"
      defaultType="purchase_order" api={purchasesApi}
      convertTargetType="goods_receipt" convertLabel="→ Goods Receipt"
      showImageToggle
    />
  )
}
