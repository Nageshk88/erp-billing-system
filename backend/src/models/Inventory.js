const { Schema, model } = require('mongoose');

const InventorySchema = new Schema({
  itemId:           { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  warehouseId:      { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  quantity:         { type: Number, default: 0 },
  reservedQuantity: { type: Number, default: 0 },
}, { timestamps: true });

InventorySchema.index({ itemId: 1, warehouseId: 1 }, { unique: true });

module.exports = model('Inventory', InventorySchema);
