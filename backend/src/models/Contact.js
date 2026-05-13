const { Schema, model } = require('mongoose');

const ContactSchema = new Schema({
  type:                { type: String, enum: ['customer', 'supplier', 'both'], required: true },
  code:                { type: String, unique: true, sparse: true },
  name:                { type: String, required: true },
  email:               String,
  phone:               String,
  address:             String,
  city:                String,
  state:               String,
  country:             { type: String, default: 'India' },
  pincode:             String,
  gstNumber:           String,
  panNumber:           String,
  creditLimit:         { type: Number, default: 0 },
  outstandingBalance:  { type: Number, default: 0 },
  // CRM fields
  partyType:           { type: String, enum: ['Wholesaler', 'Retailer', 'End User', 'Other'], default: 'Other' },
  businessType:        String,
  personalPreferences: String,
  isActive:            { type: Boolean, default: true },
  notes:               String,
}, { timestamps: true });

ContactSchema.index({ name: 'text' });

module.exports = model('Contact', ContactSchema);
