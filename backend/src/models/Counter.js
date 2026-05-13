const { Schema, model } = require('mongoose');

// Atomic sequence counter for transaction numbers
const CounterSchema = new Schema({
  _id: String,
  seq: { type: Number, default: 0 },
});

module.exports = model('Counter', CounterSchema);
