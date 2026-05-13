const { Schema, model } = require('mongoose');

const JournalLineSchema = new Schema({
  accountId:   { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  debit:       { type: Number, default: 0 },
  credit:      { type: Number, default: 0 },
  description: String,
}, { _id: true });

const JournalEntrySchema = new Schema({
  number:        { type: String, unique: true, sparse: true },
  date:          { type: Date, required: true },
  narration:     String,
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
  createdById:   { type: Schema.Types.ObjectId, ref: 'User' },
  isReversed:    { type: Boolean, default: false },
  lines:         [JournalLineSchema],
}, { timestamps: true });

module.exports = model('JournalEntry', JournalEntrySchema);
