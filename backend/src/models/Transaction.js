const { Schema, model } = require('mongoose');

// Embedded subdocument — lines live inside the Transaction document
const LineSchema = new Schema({
  itemId:       { type: Schema.Types.ObjectId, ref: 'Item' },
  description:  String,
  quantity:     { type: Number, required: true },
  unitPrice:    { type: Number, required: true },
  discountPct:  { type: Number, default: 0 },
  taxRate:      { type: Number, default: 0 },
  taxAmount:    { type: Number, default: 0 },
  lineTotal:    { type: Number, required: true },
  includeImage: { type: Boolean, default: false },
  sortOrder:    { type: Number, default: 0 },
}, { _id: true });

const TRANSACTION_TYPES = [
  'quotation', 'sales_order', 'delivery_challan', 'sales_invoice',
  'credit_note', 'pos', 'purchase_order', 'goods_receipt',
  'purchase_bill', 'debit_note',
];

const TransactionSchema = new Schema({
  type:           { type: String, enum: TRANSACTION_TYPES, required: true },
  number:         String,
  date:           { type: Date, required: true },
  dueDate:        Date,
  status:         { type: String, enum: ['draft', 'confirmed', 'partial', 'complete', 'cancelled', 'void'], default: 'draft' },
  contactId:      { type: Schema.Types.ObjectId, ref: 'Contact' },
  warehouseId:    { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  createdById:    { type: Schema.Types.ObjectId, ref: 'User' },
  referenceId:    { type: Schema.Types.ObjectId, ref: 'Transaction' },
  referenceType:  String,
  lines:          [LineSchema],
  subtotal:       { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxAmount:      { type: Number, default: 0 },
  grandTotal:     { type: Number, default: 0 },
  paidAmount:     { type: Number, default: 0 },
  notes:          String,
  terms:          String,
  shippingAddress: String,
}, { timestamps: true });

TransactionSchema.index({ type: 1, status: 1, date: -1 });
TransactionSchema.index({ contactId: 1, type: 1 });

// Auto-generate transaction number before saving if not set
TransactionSchema.pre('save', async function () {
  if (!this.number) {
    const Counter = require('./Counter');
    const prefix = {
      quotation: 'QT', sales_order: 'SO', delivery_challan: 'DC',
      sales_invoice: 'INV', credit_note: 'CN', pos: 'POS',
      purchase_order: 'PO', goods_receipt: 'GRN', purchase_bill: 'BILL', debit_note: 'DN',
    }[this.type] || 'TXN';
    const year = new Date().getFullYear();
    const counter = await Counter.findByIdAndUpdate(
      `${this.type}_${year}`,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.number = `${prefix}-${year}-${String(counter.seq).padStart(4, '0')}`;
  }
});

module.exports = model('Transaction', TransactionSchema);
