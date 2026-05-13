const { Schema, model } = require('mongoose');

const WarehouseSchema = new Schema({
  code:      { type: String, unique: true, sparse: true },
  name:      { type: String, required: true },
  address:   String,
  isDefault: { type: Boolean, default: false },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

module.exports = model('Warehouse', WarehouseSchema);
