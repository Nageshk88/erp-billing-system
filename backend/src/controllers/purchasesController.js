const { Transaction, Contact, Warehouse, User, Inventory, StockMovement } = require('../models');
const mongoose = require('mongoose');
const { generatePdf } = require('../services/pdfService');

const PURCHASE_TYPES = ['purchase_order', 'goods_receipt', 'purchase_bill', 'debit_note'];

exports.list = async (req, res, next) => {
  try {
    const { type, status, contactId, from, to, page = 1, limit = 50 } = req.query;
    const filter = { type: { $in: PURCHASE_TYPES } };
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (contactId) filter.contactId = contactId;
    if (from || to) { filter.date = {}; if (from) filter.date.$gte = new Date(from); if (to) filter.date.$lte = new Date(to); }

    const [total, rows] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.find(filter).sort({ date: -1 }).skip((page - 1) * +limit).limit(+limit)
        .populate('contactId', 'name code'),
    ]);
    res.json({ total, page: +page, data: rows.map(normalizeTxn) });
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const txn = await getFullTransaction(req.params.id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    res.json(normalizeTxn(txn));
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { lines = [], ...header } = req.body;
    header.createdById = req.user._id;
    const { subtotal, taxAmount, grandTotal } = calcTotals(lines);
    const [txn] = await Transaction.create([{
      ...header,
      lines: lines.map((l, i) => ({ ...l, sortOrder: i })),
      subtotal, taxAmount, grandTotal,
    }], { session });
    await session.commitTransaction();
    res.status(201).json(normalizeTxn(await getFullTransaction(txn._id)));
  } catch (e) { await session.abortTransaction(); next(e); }
  finally { session.endSession(); }
};

exports.update = async (req, res, next) => {
  try {
    const txn = await Transaction.findById(req.params.id);
    if (!txn) return res.status(404).json({ error: 'Not found' });
    const { lines, ...header } = req.body;
    const { subtotal, taxAmount, grandTotal } = calcTotals(lines || txn.lines);
    Object.assign(txn, header, { subtotal, taxAmount, grandTotal });
    if (lines) txn.lines = lines.map((l, i) => ({ ...l, sortOrder: i }));
    await txn.save();
    res.json(normalizeTxn(await getFullTransaction(txn._id)));
  } catch (e) { next(e); }
};

exports.confirm = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const txn = await Transaction.findById(req.params.id).session(session);
    if (!txn) { await session.abortTransaction(); return res.status(404).json({ error: 'Not found' }); }

    if (['goods_receipt', 'purchase_bill'].includes(txn.type)) {
      for (const line of txn.lines) {
        let inv = await Inventory.findOne({ itemId: line.itemId, warehouseId: txn.warehouseId }).session(session);
        if (!inv) inv = new Inventory({ itemId: line.itemId, warehouseId: txn.warehouseId, quantity: 0 });
        const newQty = parseFloat(inv.quantity) + parseFloat(line.quantity);
        inv.quantity = newQty;
        await inv.save({ session });
        await StockMovement.create([{
          itemId: line.itemId, warehouseId: txn.warehouseId, transactionId: txn._id,
          movementType: 'in', quantity: line.quantity, balanceAfter: newQty, date: txn.date,
        }], { session });
      }
    }
    txn.status = 'confirmed';
    await txn.save({ session });
    await session.commitTransaction();
    res.json({ message: 'Confirmed', status: 'confirmed' });
  } catch (e) { await session.abortTransaction(); next(e); }
  finally { session.endSession(); }
};

exports.cancel = async (req, res, next) => {
  try {
    const txn = await Transaction.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
    if (!txn) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Cancelled' });
  } catch (e) { next(e); }
};

exports.convert = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const source = await Transaction.findById(req.params.id).session(session);
    if (!source) { await session.abortTransaction(); return res.status(404).json({ error: 'Not found' }); }
    const { targetType } = req.body;
    const conversionMap = { purchase_order: 'goods_receipt', goods_receipt: 'purchase_bill' };
    if (conversionMap[source.type] !== targetType) {
      await session.abortTransaction();
      return res.status(400).json({ error: `Cannot convert ${source.type} to ${targetType}` });
    }
    const newLines = source.lines.map(l => {
      const line = l.toObject();
      // Feature B: strip images when converting to purchase bill
      if (targetType === 'purchase_bill') line.includeImage = false;
      delete line._id;
      return line;
    });
    const [newTxn] = await Transaction.create([{
      type: targetType, status: 'draft',
      date: source.date, contactId: source.contactId, warehouseId: source.warehouseId,
      createdById: req.user._id, referenceId: source._id, referenceType: source.type,
      lines: newLines,
      subtotal: source.subtotal, taxAmount: source.taxAmount, grandTotal: source.grandTotal,
    }], { session });
    source.status = 'complete';
    await source.save({ session });
    await session.commitTransaction();
    res.status(201).json(normalizeTxn(await getFullTransaction(newTxn._id)));
  } catch (e) { await session.abortTransaction(); next(e); }
  finally { session.endSession(); }
};

exports.generatePdf = async (req, res, next) => {
  try {
    const txn = await getFullTransaction(req.params.id);
    if (!txn) return res.status(404).json({ error: 'Not found' });
    const pdf = await generatePdf(normalizeTxn(txn));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${txn.number}.pdf"`);
    res.send(pdf);
  } catch (e) { next(e); }
};

function calcTotals(lines) {
  let subtotal = 0, taxAmount = 0;
  for (const l of lines) {
    const base = (parseFloat(l.quantity) || 0) * (parseFloat(l.unitPrice) || 0) * (1 - (parseFloat(l.discountPct) || 0) / 100);
    subtotal += base; taxAmount += base * ((parseFloat(l.taxRate) || 0) / 100);
  }
  return { subtotal: +subtotal.toFixed(2), taxAmount: +taxAmount.toFixed(2), grandTotal: +(subtotal + taxAmount).toFixed(2) };
}

async function getFullTransaction(id) {
  return Transaction.findById(id)
    .populate('contactId', 'name code address phone')
    .populate('warehouseId', 'name')
    .populate('createdById', 'name')
    .populate('lines.itemId', 'name sku uom imageUrl costPrice');
}

function normalizeTxn(txn) {
  if (!txn) return null;
  const obj = txn.toJSON ? txn.toJSON() : txn;
  obj.contact = obj.contactId;
  obj.warehouse = obj.warehouseId;
  obj.createdBy = obj.createdById;
  if (obj.lines) obj.lines = obj.lines.map(l => ({ ...l, item: l.itemId }));
  return obj;
}
