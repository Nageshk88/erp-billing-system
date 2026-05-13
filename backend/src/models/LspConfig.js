const { Schema, model } = require('mongoose');

const LspConfigSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true },
  itemId:     { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  minPrice:   { type: Number, required: true },
  setById:    { type: Schema.Types.ObjectId, ref: 'User' },
  notes:      String,
}, { timestamps: true });

LspConfigSchema.index({ customerId: 1, itemId: 1 }, { unique: true });

module.exports = model('LspConfig', LspConfigSchema);
