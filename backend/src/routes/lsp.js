const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { LspConfig, Item, Contact } = require('../models');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const rows = await LspConfig.find()
      .populate('itemId', 'name sku')
      .populate('customerId', 'name code');
    res.json(rows.map(r => {
      const obj = r.toJSON();
      obj.item = obj.itemId;
      obj.customer = obj.customerId;
      return obj;
    }));
  } catch (e) { next(e); }
});

router.get('/check', async (req, res, next) => {
  try {
    const { customerId, itemId, price } = req.query;
    const lsp = await LspConfig.findOne({ customerId, itemId });
    if (!lsp) return res.json({ allowed: true, minPrice: null });
    const allowed = parseFloat(price) >= parseFloat(lsp.minPrice);
    res.json({ allowed, minPrice: lsp.minPrice });
  } catch (e) { next(e); }
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { customerId, itemId, minPrice, notes } = req.body;
    const record = await LspConfig.findOneAndUpdate(
      { customerId, itemId },
      { customerId, itemId, minPrice, notes, setById: req.user._id },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json(record.toJSON());
  } catch (e) { next(e); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const r = await LspConfig.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) { next(e); }
});

module.exports = router;
