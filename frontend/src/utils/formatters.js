export const formatCurrency = (amount, symbol = '₹') =>
  `${symbol}${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatNumber = (n) =>
  parseFloat(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 3 })

export const STATUS_LABELS = {
  draft: { label: 'Draft', cls: 'badge-gray' },
  confirmed: { label: 'Confirmed', cls: 'badge-green' },
  partial: { label: 'Partial', cls: 'badge-yellow' },
  complete: { label: 'Complete', cls: 'badge-blue' },
  cancelled: { label: 'Cancelled', cls: 'badge-red' },
  void: { label: 'Void', cls: 'badge-red' },
}

export const TYPE_LABELS = {
  quotation: 'Quotation',
  sales_order: 'Sales Order',
  delivery_challan: 'Delivery Challan',
  sales_invoice: 'Sales Invoice',
  credit_note: 'Credit Note',
  pos: 'POS',
  purchase_order: 'Purchase Order',
  goods_receipt: 'Goods Receipt',
  purchase_bill: 'Purchase Bill',
  debit_note: 'Debit Note',
}
