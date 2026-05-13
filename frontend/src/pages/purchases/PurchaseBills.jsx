import TransactionList from '../../components/common/TransactionList'
import { purchasesApi } from '../../services/api'

export default function PurchaseBills() {
  return (
    <TransactionList
      title="Purchase Bills" subtitle="Manage supplier bills"
      defaultType="purchase_bill" api={purchasesApi}
    />
  )
}
