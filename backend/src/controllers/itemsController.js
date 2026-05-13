const { Item, Inventory, Warehouse } = require('../models');

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
