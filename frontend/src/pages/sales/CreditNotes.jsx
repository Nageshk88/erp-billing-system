import TransactionList from '../../components/common/TransactionList'
import { salesApi } from '../../services/api'

export default function CreditNotes() {
  return (
    <TransactionList
      title="Credit Notes" subtitle="Manage customer credit notes"
      defaultType="credit_note" api={salesApi}
    />
  )
}
