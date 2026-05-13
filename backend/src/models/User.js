const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['admin', 'staff'], default: 'staff' },
  isActive: { type: Boolean, default: true },
  avatar:   { type: String },
}, { timestamps: true });

UserSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

UserSchema.methods.validatePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

UserSchema.methods.toSafeObject = function () {
  const obj = this.toJSON();
  delete obj.password;
  return obj;
};

module.exports = model('User', UserSchema);
