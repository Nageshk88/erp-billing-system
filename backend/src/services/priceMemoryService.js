const { Transaction } = require('../models');
const { Types } = require('mongoose');

/**
 * Feature A — Price Memory
 * Uses MongoDB aggregation to unwind embedded lines and fetch
 * the last 10 transaction prices for a specific customer + item pair.
 */
async function getPriceMemory(customerId, itemId) {
  const results = await Transaction.aggregate([
    {
      $match: {
        contactId: new Types.ObjectId(customerId),
        type: { $in: ['sales_invoice', 'pos'] },
        status: { $in: ['confirmed', 'complete'] },
      },
    },
    { $unwind: '$lines' },
    { $match: { 'lines.itemId': new Types.ObjectId(itemId) } },
    { $sort: { date: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'warehouses',
        localField: 'warehouseId',
        foreignField: '_id',
        as: 'warehouseInfo',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'createdById',
        foreignField: '_id',
        as: 'staffInfo',
      },
    },
    {
      $project: {
        date: 1,
        transactionNumber: '$number',
        unitPrice: '$lines.unitPrice',
        quantity: '$lines.quantity',
        discountPct: '$lines.discountPct',
        lineTotal: '$lines.lineTotal',
        warehouseName: { $arrayElemAt: ['$warehouseInfo.name', 0] },
        staffName: { $arrayElemAt: ['$staffInfo.name', 0] },
      },
    },
  ]);

  return results.map(r => ({
    date: r.date,
    transactionNumber: r.transactionNumber,
    unitPrice: r.unitPrice,
    quantity: r.quantity,
    discountPct: r.discountPct || 0,
    lineTotal: r.lineTotal,
    warehouseName: r.warehouseName || '—',
    staffName: r.staffName || '—',
  }));
}

module.exports = { getPriceMemory };
