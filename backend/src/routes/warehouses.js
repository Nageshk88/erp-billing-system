const express = require('express');
const router = express.Router();
const { Warehouse } = require('../models');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const rows = await Warehouse.find({ isActive: true }).sort({ name: 1 });
    res.json(rows.map(w => w.toJSON()));
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const w = await Warehouse.create(req.body);
    res.status(201).json(w.toJSON());
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const w = await Warehouse.findById(req.params.id);
    if (!w) return res.status(404).json({ error: 'Not found' });
    Object.assign(w, req.body);
    await w.save();
    res.json(w.toJSON());
  } catch (e) { next(e); }
});

module.exports = router;
