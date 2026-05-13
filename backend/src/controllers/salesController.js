const { Transaction, Item, Contact, Warehouse, User, LspConfig, Inventory, StockMovement } = require('../models');
const mongoose = require('mongoose');
const { getPriceMemory } = require('../services/priceMemoryService');
const { generatePdf } = require('../services/pdfService');

const SALE_TYPES = ['quotation', 'sales_order', 'delivery_challan', 'sales_invoice', 'credit_note', 'pos'];

exports.list = async (req, res, next) => {
  try {
    const { type, status, contactId, from, to, page = 1, limit = 50 } = req.query;
    const filter = { type: { $in: SALE_TYPES } };
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (contactId) filter.contactId = contactId;
    if (from || to) { filter.date = {}; if (from) filter.date.$gte = new Date(from); if (to) filter.date.$lte = new Date(to); }

    const [total, rows] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.find(filter).sort({ date: -1, createdAt: -1 })
        .skip((page - 1) * +limit).limit(+limit)
        .populate('contactId', 'name code')
        .populate('createdById', 'name'),
    ]);
    res.json({ total, page: +page, data: rows.map(normalizeTxn) });
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const txn = await getFullTransaction(req.params.id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    const obj = normalizeTxn(txn);
    if (res.locals.hideCostPrice) obj.lines?.forEach(l => { if (l.item) delete l.item.costPrice; });
    res.json(obj);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { lines = [], ...header } = req.body;
    header.createdById = req.user._id;

    // Feature D: LSP check for staff
    if (req.user.role === 'staff' && header.contactId) {
      for (const line of lines) {
        const lsp = await LspConfig.findOne({ customerId: header.contactId, itemId: line.itemId });
        if (lsp && parseFloat(line.unitPrice) < parseFloat(lsp.minPrice)) {
          await session.abortTransaction();
          const item = await Item.findById(line.itemId).select('name');
          return res.status(403).json({
            error: 'LSP_VIOLATION',
            message: `Price for "${item?.name}" is below the minimum allowed price of ₹${lsp.minPrice}. Admin override required.`,
            itemId: line.itemId,
            minPrice: lsp.minPrice,
          });
        }
      }
    }

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
    if (['confirmed', 'complete'].includes(txn.status)) {
      return res.status(400).json({ error: 'Cannot edit a confirmed transaction' });
    }
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

    if (['sales_invoice', 'pos', 'delivery_challan'].includes(txn.type)) {
      for (const line of txn.lines) {
        await updateStock(line.itemId, txn.warehouseId, -line.quantity, txn._id, txn.date, session);
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
    if (!source) { await session.abortTransaction(); return res.status(404).json({ error: 'Source not found' }); }

    const { targetType } = req.body;
    const conversionMap = { quotation: 'sales_order', sales_order: 'delivery_challan', delivery_challan: 'sales_invoice' };
    if (conversionMap[source.type] !== targetType) {
      await session.abortTransaction();
      return res.status(400).json({ error: `Cannot convert ${source.type} to ${targetType}` });
    }

    const newLines = source.lines.map(l => {
      const line = l.toObject();
      // Feature B: strip images when converting to invoice
      if (targetType === 'sales_invoice') line.includeImage = false;
      delete line._id;
      return line;
    });

    const [newTxn] = await Transaction.create([{
      type: targetType, status: 'draft',
      date: source.date, dueDate: source.dueDate,
      contactId: source.contactId, warehouseId: source.warehouseId,
      createdById: req.user._id,
      referenceId: source._id, referenceType: source.type,
      lines: newLines,
      subtotal: source.subtotal, taxAmount: source.taxAmount, grandTotal: source.grandTotal,
      notes: source.notes, terms: source.terms,
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

exports.priceMemory = async (req, res, next) => {
  try {
    const history = await getPriceMemory(req.params.customerId, req.params.itemId);
    res.json(history);
  } catch (e) { next(e); }
};

// ── Helpers ───────────────────────────────────────────────────────────

function calcTotals(lines) {
  let subtotal = 0, taxAmount = 0;
  for (const l of lines) {
    const base = (parseFloat(l.quantity) || 0) * (parseFloat(l.unitPrice) || 0) * (1 - (parseFloat(l.discountPct) || 0) / 100);
    subtotal += base;
    taxAmount += base * ((parseFloat(l.taxRate) || 0) / 100);
  }
  return { subtotal: +subtotal.toFixed(2), taxAmount: +taxAmount.toFixed(2), grandTotal: +(subtotal + taxAmount).toFixed(2) };
}

async function getFullTransaction(id) {
  return Transaction.findById(id)
    .populate('contactId', 'name code address phone email gstNumber')
    .populate('warehouseId', 'name')
    .populate('createdById', 'name')
    .populate('lines.itemId', 'name sku uom imageUrl costPrice sellingPrice');
}

function normalizeTxn(txn) {
  if (!txn) return null;
  const obj = txn.toJSON ? txn.toJSON() : txn;
  obj.contact   = obj.contactId;
  obj.warehouse = obj.warehouseId;
  obj.createdBy = obj.createdById;
  if (obj.lines) obj.lines = obj.lines.map(l => ({ ...l, item: l.itemId }));
  return obj;
}

async function updateStock(itemId, warehouseId, qty, txnId, date, session) {
  if (!warehouseId) return;
  let inv = await Inventory.findOne({ itemId, warehouseId }).session(session);
  if (!inv) inv = new Inventory({ itemId, warehouseId, quantity: 0 });
  const newQty = parseFloat(inv.quantity) + qty;
  inv.quantity = newQty;
  await inv.save({ session });
  await StockMovement.create([{
    itemId, warehouseId, transactionId: txnId,
    movementType: qty > 0 ? 'in' : 'out', quantity: Math.abs(qty),
    balanceAfter: newQty, date,
  }], { session });
}
