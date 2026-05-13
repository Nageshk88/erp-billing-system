const { Schema, model } = require('mongoose');

const ItemSchema = new Schema({
  sku:           { type: String, unique: true, sparse: true },
  barcode:       String,
  name:          { type: String, required: true },
  description:   String,
  category:      String,
  brand:         String,
  imageUrl:      String,
  uom:           { type: String, default: 'Nos' },
  hsnCode:       String,
  taxRate:       { type: Number, default: 18 },
  costPrice:     { type: Number, default: 0 },
  sellingPrice:  { type: Number, default: 0 },
  mrp:           { type: Number, default: 0 },
  minStockLevel: { type: Number, default: 0 },
  openingStock:  { type: Number, default: 0 },
  isActive:      { type: Boolean, default: true },
}, { timestamps: true });

ItemSchema.index({ name: 'text', sku: 'text' });

module.exports = model('Item', ItemSchema);
