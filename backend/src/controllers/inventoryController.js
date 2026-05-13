const { Inventory, Item, Warehouse, StockMovement } = require('../models');
const mongoose = require('mongoose');

exports.stockSummary = async (req, res, next) => {
  try {
    const rows = await Inventory.find()
      .populate('itemId', 'name sku uom minStockLevel')
      .populate('warehouseId', 'name code');
    res.json(rows.map(r => r.toJSON()));
  } catch (e) { next(e); }
};

exports.itemStock = async (req, res, next) => {
  try {
    const rows = await Inventory.find({ itemId: req.params.itemId })
      .populate('warehouseId', 'name');
    res.json(rows.map(r => r.toJSON()));
  } catch (e) { next(e); }
};

exports.movements = async (req, res, next) => {
  try {
    const { itemId, warehouseId, from, to, limit = 100 } = req.query;
    const filter = {};
    if (itemId) filter.itemId = itemId;
    if (warehouseId) filter.warehouseId = warehouseId;
    if (from || to) { filter.date = {}; if (from) filter.date.$gte = new Date(from); if (to) filter.date.$lte = new Date(to); }

    const rows = await StockMovement.find(filter)
      .sort({ createdAt: -1 }).limit(+limit)
      .populate('itemId', 'name sku')
      .populate('warehouseId', 'name');
    res.json(rows.map(r => r.toJSON()));
  } catch (e) { next(e); }
};

exports.adjustment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { itemId, warehouseId, quantity, notes } = req.body;
    const qty = parseFloat(quantity);

    let inv = await Inventory.findOne({ itemId, warehouseId }).session(session);
    if (!inv) inv = new Inventory({ itemId, warehouseId, quantity: 0 });
    const newQty = parseFloat(inv.quantity) + qty;
    inv.quantity = newQty;
    await inv.save({ session });

    await StockMovement.create([{
      itemId, warehouseId,
      movementType: qty > 0 ? 'in' : 'out',
      quantity: Math.abs(qty),
      balanceAfter: newQty,
      date: new Date(),
      notes: notes || 'Manual adjustment',
    }], { session });

    await session.commitTransaction();
    res.json({ message: 'Stock adjusted', newQuantity: newQty });
  } catch (e) { await session.abortTransaction(); next(e); }
  finally { session.endSession(); }
};

exports.lowStock = async (req, res, next) => {
  try {
    const rows = await Inventory.find().populate('itemId', 'name sku uom minStockLevel');
    const low = rows.filter(r => parseFloat(r.quantity) <= parseFloat(r.itemId?.minStockLevel || 0));
    res.json(low.map(r => r.toJSON()));
  } catch (e) { next(e); }
};
