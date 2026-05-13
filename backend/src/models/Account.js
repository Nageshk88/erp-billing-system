const { Schema, model } = require('mongoose');

const AccountSchema = new Schema({
  code:           { type: String, required: true, unique: true },
  name:           { type: String, required: true },
  type:           { type: String, required: true, enum: ['asset', 'liability', 'equity', 'revenue', 'expense', 'bank', 'cash', 'receivable', 'payable', 'tax'] },
  parentId:       { type: Schema.Types.ObjectId, ref: 'Account' },
  openingBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  isSystem:       { type: Boolean, default: false },
  isActive:       { type: Boolean, default: true },
  description:    String,
}, { timestamps: true });

module.exports = model('Account', AccountSchema);
