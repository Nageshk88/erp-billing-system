const { Contact, Transaction } = require('../models');

exports.list = async (req, res, next) => {
  try {
    const { type, search, page = 1, limit = 50 } = req.query;
    const filter = { isActive: true };
    if (type && type !== 'both') filter.$or = [{ type }, { type: 'both' }];
    if (search) filter.name = { $regex: search, $options: 'i' };

    const [total, data] = await Promise.all([
      Contact.countDocuments(filter),
      Contact.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(+limit).lean({ virtuals: true }),
    ]);
    res.json({ total, page: +page, data: data.map(normalizeId) });
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const c = await Contact.findById(req.params.id).lean({ virtuals: true });
    if (!c) return res.status(404).json({ error: 'Contact not found' });
    res.json(normalizeId(c));
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const c = await Contact.create(req.body);
    res.status(201).json(c.toJSON());
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const c = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!c) return res.status(404).json({ error: 'Contact not found' });
    res.json(c.toJSON());
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const c = await Contact.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!c) return res.status(404).json({ error: 'Contact not found' });
    res.json({ message: 'Contact deactivated' });
  } catch (e) { next(e); }
};

exports.ledger = async (req, res, next) => {
  try {
    const txns = await Transaction.find({
      contactId: req.params.id,
      status: { $nin: ['cancelled', 'void'] },
    }).sort({ date: -1 }).limit(100).lean({ virtuals: true });
    res.json(txns.map(normalizeId));
  } catch (e) { next(e); }
};

function normalizeId(doc) {
  if (!doc) return doc;
  doc.id = doc._id?.toString();
  delete doc._id;
  delete doc.__v;
  return doc;
}
