const { Transaction, Inventory, Account, Contact } = require('../models');

exports.dashboard = async (req, res, next) => {
  try {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [salesAgg, purchasesAgg, overdueCount, lowStockCount, recentSales] = await Promise.all([
      Transaction.aggregate([
        { $match: { type: { $in: ['sales_invoice', 'pos'] }, status: 'confirmed', date: { $gte: monthStart, $lte: today } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]),
      Transaction.aggregate([
        { $match: { type: 'purchase_bill', status: 'confirmed', date: { $gte: monthStart, $lte: today } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]),
      Transaction.countDocuments({
        type: { $in: ['sales_invoice', 'pos'] }, status: 'confirmed',
        $expr: { $gt: ['$grandTotal', '$paidAmount'] },
      }),
      Inventory.aggregate([
        { $lookup: { from: 'items', localField: 'itemId', foreignField: '_id', as: 'item' } },
        { $unwind: '$item' },
        { $match: { $expr: { $lte: ['$quantity', '$item.minStockLevel'] } } },
        { $count: 'total' },
      ]),
      Transaction.find({ type: { $in: ['sales_invoice', 'pos'] }, status: 'confirmed' })
        .sort({ date: -1 }).limit(5).populate('contactId', 'name'),
    ]);

    res.json({
      salesThisMonth: salesAgg[0]?.total || 0,
      purchasesThisMonth: purchasesAgg[0]?.total || 0,
      overdueReceivables: overdueCount,
      lowStockCount: lowStockCount[0]?.total || 0,
      recentSales: recentSales.map(s => ({
        ...s.toJSON(), contact: s.contactId,
      })),
    });
  } catch (e) { next(e); }
};

exports.profitLoss = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    const dateWhere = Object.keys(dateFilter).length ? { date: dateFilter } : {};

    const [revenueAgg, cogAgg, cnAgg] = await Promise.all([
      Transaction.aggregate([{ $match: { type: { $in: ['sales_invoice', 'pos'] }, status: 'confirmed', ...dateWhere } }, { $group: { _id: null, total: { $sum: '$grandTotal' } } }]),
      Transaction.aggregate([{ $match: { type: 'purchase_bill', status: 'confirmed', ...dateWhere } }, { $group: { _id: null, total: { $sum: '$grandTotal' } } }]),
      Transaction.aggregate([{ $match: { type: 'credit_note', status: 'confirmed', ...dateWhere } }, { $group: { _id: null, total: { $sum: '$grandTotal' } } }]),
    ]);
    const revenue = revenueAgg[0]?.total || 0;
    const cogs = cogAgg[0]?.total || 0;
    const creditNotes = cnAgg[0]?.total || 0;
    const netRevenue = revenue - creditNotes;
    res.json({ revenue, creditNotes, netRevenue, cogs, grossProfit: netRevenue - cogs });
  } catch (e) { next(e); }
};

exports.balanceSheet = async (req, res, next) => {
  try {
    const accounts = await Account.find({ isActive: true }).sort({ code: 1 });
    const grouped = {};
    for (const acc of accounts) {
      if (!grouped[acc.type]) grouped[acc.type] = [];
      grouped[acc.type].push(acc.toJSON());
    }
    res.json(grouped);
  } catch (e) { next(e); }
};

exports.stockSummary = async (req, res, next) => {
  try {
    const rows = await Inventory.find()
      .populate('itemId', 'name sku uom costPrice sellingPrice')
      .populate('warehouseId', 'name');
    res.json(rows.map(r => {
      const obj = r.toJSON();
      obj.stockValue = parseFloat(obj.quantity) * parseFloat(obj.itemId?.costPrice || 0);
      obj.Item = obj.itemId;
      obj.Warehouse = obj.warehouseId;
      return obj;
    }));
  } catch (e) { next(e); }
};

exports.taxReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    const dateWhere = Object.keys(dateFilter).length ? { date: dateFilter } : {};

    const [salesTaxAgg, purchaseTaxAgg] = await Promise.all([
      Transaction.aggregate([{ $match: { type: { $in: ['sales_invoice', 'pos'] }, status: 'confirmed', ...dateWhere } }, { $group: { _id: null, total: { $sum: '$taxAmount' } } }]),
      Transaction.aggregate([{ $match: { type: 'purchase_bill', status: 'confirmed', ...dateWhere } }, { $group: { _id: null, total: { $sum: '$taxAmount' } } }]),
    ]);
    const salesTax = salesTaxAgg[0]?.total || 0;
    const purchaseTax = purchaseTaxAgg[0]?.total || 0;
    res.json({ salesTax, purchaseTax, netTax: salesTax - purchaseTax });
  } catch (e) { next(e); }
};

exports.receivables = async (req, res, next) => {
  try {
    const rows = await Transaction.find({ type: { $in: ['sales_invoice', 'pos'] }, status: 'confirmed' })
      .sort({ date: 1 }).populate('contactId', 'name phone email');
    const data = rows.map(r => {
      const obj = r.toJSON();
      obj.contact = obj.contactId;
      obj.outstanding = parseFloat(obj.grandTotal) - parseFloat(obj.paidAmount || 0);
      return obj;
    }).filter(r => r.outstanding > 0);
    res.json(data);
  } catch (e) { next(e); }
};

exports.payables = async (req, res, next) => {
  try {
    const rows = await Transaction.find({ type: 'purchase_bill', status: 'confirmed' })
      .sort({ date: 1 }).populate('contactId', 'name phone');
    const data = rows.map(r => {
      const obj = r.toJSON();
      obj.contact = obj.contactId;
      obj.outstanding = parseFloat(obj.grandTotal) - parseFloat(obj.paidAmount || 0);
      return obj;
    }).filter(r => r.outstanding > 0);
    res.json(data);
  } catch (e) { next(e); }
};

exports.salesAnalysis = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filter = { type: { $in: ['sales_invoice', 'pos'] }, status: 'confirmed' };
    if (from || to) { filter.date = {}; if (from) filter.date.$gte = new Date(from); if (to) filter.date.$lte = new Date(to); }
    const rows = await Transaction.find(filter).sort({ date: 1 }).populate('contactId', 'name');
    res.json(rows.map(r => ({ ...r.toJSON(), contact: r.contactId })));
  } catch (e) { next(e); }
};
