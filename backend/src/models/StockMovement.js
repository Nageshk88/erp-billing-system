const { Schema, model } = require('mongoose');

const StockMovementSchema = new Schema({
  itemId:        { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  warehouseId:   { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
  movementType:  { type: String, enum: ['in', 'out', 'transfer', 'adjustment'], required: true },
  quantity:      { type: Number, required: true },
  balanceAfter:  { type: Number, default: 0 },
  date:          { type: Date, required: true },
  notes:         String,
}, { timestamps: true });

module.exports = model('StockMovement', StockMovementSchema);
