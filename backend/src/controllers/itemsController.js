const { Item, Inventory, Warehouse, StockMovement } = require('../models');

exports.list = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;
    const filter = { isActive: true };
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { sku: { $regex: search, $options: 'i' } }];
    if (category) filter.category = category;

    const [total, items] = await Promise.all([
      Item.countDocuments(filter),
      Item.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(+limit),
    ]);

    const data = items.map(item => {
      const obj = item.toJSON();
      if (res.locals.hideCostPrice) delete obj.costPrice;
      return obj;
    });
    res.json({ total, page: +page, data });
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    const stocks = await Inventory.find({ itemId: item._id }).populate('warehouseId');
    const obj = item.toJSON();
    if (res.locals.hideCostPrice) delete obj.costPrice;
    obj.stocks = stocks.map(s => s.toJSON());
    res.json(obj);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const item = await Item.create(req.body);
    res.status(201).json(item.toJSON());
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item.toJSON());
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deactivated' });
  } catch (e) { next(e); }
};

const isNonNegativeNumber = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

exports.bulkUpdate = async (req, res, next) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'updates must be a non-empty array' });
    }

    const notFound = [];
    const failed = [];
    const valid = []; // { sku, sellingPrice?, stock? }

    for (const row of updates) {
      const sku = row?.sku;
      if (!sku || typeof sku !== 'string') {
        failed.push({ sku: sku ?? null, reason: 'Missing or invalid sku' });
        continue;
      }
      const hasPrice = row.sellingPrice !== undefined && row.sellingPrice !== null;
      const hasStock = row.stock !== undefined && row.stock !== null;
      if (!hasPrice && !hasStock) {
        failed.push({ sku, reason: 'No sellingPrice or stock value provided' });
        continue;
      }
      if (hasPrice && !isNonNegativeNumber(row.sellingPrice)) {
        failed.push({ sku, reason: 'sellingPrice must be a non-negative number' });
        continue;
      }
      if (hasStock && !isNonNegativeNumber(row.stock)) {
        failed.push({ sku, reason: 'stock must be a non-negative number' });
        continue;
      }
      valid.push({ sku, sellingPrice: hasPrice ? row.sellingPrice : undefined, stock: hasStock ? row.stock : undefined });
    }

    const skus = valid.map(v => v.sku);
    const items = skus.length ? await Item.find({ sku: { $in: skus } }).select('_id sku') : [];
    const itemBySku = new Map(items.map(i => [i.sku, i]));

    const needsStock = valid.some(v => v.stock !== undefined && itemBySku.has(v.sku));
    let defaultWarehouse = null;
    if (needsStock) {
      defaultWarehouse = await Warehouse.findOne({ isDefault: true, isActive: true });
    }

    const itemOps = [];
    const stockRows = []; // { itemId, sku, stock }
    let updatedCount = 0;
    const updatedSkus = new Set();

    for (const row of valid) {
      const item = itemBySku.get(row.sku);
      if (!item) {
        notFound.push(row.sku);
        continue;
      }
      if (row.sellingPrice !== undefined) {
        itemOps.push({ updateOne: { filter: { _id: item._id }, update: { $set: { sellingPrice: row.sellingPrice } } } });
        updatedSkus.add(row.sku);
      }
      if (row.stock !== undefined) {
        if (!defaultWarehouse) {
          failed.push({ sku: row.sku, reason: 'No default warehouse configured; cannot update stock' });
          continue;
        }
        stockRows.push({ itemId: item._id, sku: row.sku, stock: row.stock });
        updatedSkus.add(row.sku);
      }
    }

    if (itemOps.length) await Item.bulkWrite(itemOps);

    if (stockRows.length) {
      const itemIds = stockRows.map(r => r.itemId);
      const existingInventory = await Inventory.find({ itemId: { $in: itemIds }, warehouseId: defaultWarehouse._id });
      const invByItemId = new Map(existingInventory.map(inv => [String(inv.itemId), inv]));

      const inventoryOps = stockRows.map(r => ({
        updateOne: {
          filter: { itemId: r.itemId, warehouseId: defaultWarehouse._id },
          update: { $set: { quantity: r.stock } },
          upsert: true,
        },
      }));
      await Inventory.bulkWrite(inventoryOps);

      const now = new Date();
      const movements = stockRows
        .map(r => {
          const prevQty = parseFloat(invByItemId.get(String(r.itemId))?.quantity || 0);
          const delta = r.stock - prevQty;
          if (delta === 0) return null;
          return {
            itemId: r.itemId,
            warehouseId: defaultWarehouse._id,
            movementType: 'adjustment',
            quantity: Math.abs(delta),
            balanceAfter: r.stock,
            date: now,
            notes: 'Bulk update via Power Automate',
          };
        })
        .filter(Boolean);
      if (movements.length) await StockMovement.insertMany(movements);
    }

    updatedCount = updatedSkus.size;

    res.json({
      totalReceived: updates.length,
      updated: updatedCount,
      notFoundCount: notFound.length,
      failedCount: failed.length,
      notFound,
      failed,
    });
  } catch (e) { next(e); }
};

exports.uploadImage = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const imageUrl = `/uploads/items/${req.file.filename}`;
    item.imageUrl = imageUrl;
    await item.save();
    res.json({ imageUrl });
  } catch (e) { next(e); }
};
