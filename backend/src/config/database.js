const mongoose = require('mongoose');

// Global toJSON transform — every model gets `id` instead of `_id`, no `__v`
mongoose.plugin((schema) => {
  schema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });
});

const connect = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in .env');
  await mongoose.connect(uri);
};

module.exports = { connect, mongoose };
